/**
 * @module PdfExporter
 * @description Geração de PDF de divergências com impacto financeiro.
 * Depende de jsPDF + jsPDF-AutoTable via CDN.
 */

/**
 * Formata valor para moeda BRL.
 * @param {number} v
 * @returns {string}
 */
const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Gera e faz download do PDF de divergências.
 * @param {Produto[]} produtos
 */
export function gerarRelatorioPDF(produtos) {
  if (!window.jspdf) {
    console.error('[PdfExporter] jsPDF não encontrado.');
    return;
  }

  const { jsPDF } = window.jspdf;

  const divergentes = produtos
    .filter(p => p.contagem !== null)
    .map(p => ({ ...p, dif: parseFloat((p.contagem - p.saldo).toFixed(2)) }))
    .filter(p => p.dif !== 0);

  if (divergentes.length === 0) {
    showToast('Nenhuma divergência encontrada!', 'info');
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a4');
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  // Cabeçalho
  doc.setFillColor(20, 33, 61);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(252, 163, 17);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE DIVERGÊNCIAS — IMPACTO FINANCEIRO', 14, 14);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text(`Emitido em: ${dataHoje}`, 230, 14);

  // Totalizador
  const totalImpacto = divergentes.reduce((sum, p) => sum + p.dif * p.custo, 0);
  const corImpacto = totalImpacto < 0 ? [214, 40, 40] : [42, 157, 143];

  doc.autoTable({
    head: [['Cód.', 'Produto', 'Custo Un.', 'Sistema', 'Contado', 'Diferença', 'Impacto R$']],
    body: divergentes.map(p => [
      p.codItem,
      `[${p.barra}] ${p.nome}`,
      brl(p.custo),
      p.saldo.toFixed(2),
      p.contagem.toFixed(2),
      p.dif > 0 ? `+${p.dif.toFixed(2)}` : p.dif.toFixed(2),
      brl(p.dif * p.custo),
    ]),
    startY: 26,
    headStyles: { fillColor: [20, 33, 61], textColor: [252, 163, 17], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 1: { cellWidth: 90 } },
    foot: [[
      '', '', '', '', '',
      { content: 'TOTAL', styles: { fontStyle: 'bold' } },
      { content: brl(totalImpacto), styles: { fontStyle: 'bold', textColor: corImpacto } },
    ]],
    footStyles: { fillColor: [20, 33, 61], textColor: 255 },
  });

  doc.save(`divergencias-${dataHoje.replace(/\//g, '-')}.pdf`);
  showToast('PDF gerado com sucesso!', 'success');
}

// Utilitário inline para não criar dependência circular
function showToast(msg, type) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast toast--${type} toast--visible`;
  setTimeout(() => el.classList.remove('toast--visible'), 3000);
}
