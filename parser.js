/**
 * @module Parser
 * @description CSV parsing and product categorization.
 * Pure functions — no side effects, fully testable.
 */

const SEPARATOR = ';';

const KEYWORDS = {
  filtro: ['filtro', 'fitro', 'filtrante', 'elemento', 'psl', 'tecfil', 'vox', 'fram'],
  oleo: [
    'oil', 'fluido', 'aditivo', 'unilit', 'petronas', 'ipiranga', 'lubrax',
    'shell', 'castrol', 'ypf', 'texaco', 'havoline', 'bardahl', 'radiex',
    'elaion', 'agro', 'selenia', '5w30', '15w40', '20w50', 'lubri',
    'extron', 'deiton', 'evora', 'lynix', 'top auto',
  ],
};

/**
 * Identifica a categoria de um produto pelo nome.
 * @param {string} nome
 * @returns {'Filtro' | 'Óleo' | 'Vitrine'}
 */
export function identificarCategoria(nome) {
  const n = nome.toLowerCase();
  if (KEYWORDS.filtro.some(k => n.includes(k))) return 'Filtro';
  if (KEYWORDS.oleo.some(k => n.includes(k))) return 'Óleo';
  return 'Vitrine';
}

/**
 * Normaliza número no formato brasileiro para float.
 * @param {string} valor
 * @returns {number}
 */
function parseBRFloat(valor = '0') {
  return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Extrai os últimos N dígitos de um código de barras.
 * @param {string} barra
 * @param {number} digits
 * @returns {string}
 */
function formatarBarra(barra, digits = 4) {
  return barra.length >= digits ? barra.slice(-digits) : barra;
}

/**
 * Parseia texto CSV e retorna array de produtos normalizados.
 * @param {string} texto
 * @returns {Produto[]}
 */
export function parseCSV(texto) {
  const linhas = texto.split('\n').filter(l => l.trim() !== '');
  if (linhas.length < 2) return [];

  const cabecalho = linhas[0].split(SEPARATOR).map(c => c.trim().toLowerCase());

  const idx = {
    nome:   cabecalho.indexOf('des_item'),
    saldo:  cabecalho.indexOf('qtd_saldo'),
    barra:  cabecalho.indexOf('cod_barra'),
    codItem:cabecalho.indexOf('cod_item'),
    custo:  cabecalho.indexOf('val_custo_unitario'),
  };

  return linhas.slice(1).reduce((acc, linha) => {
    const cols = linha.split(SEPARATOR);
    if (cols.length < 2) return acc;

    const nome = cols[idx.nome]?.trim() || 'Sem Nome';

    acc.push({
      codItem:   cols[idx.codItem]?.trim() || 'N/A',
      nome,
      barra:     formatarBarra(cols[idx.barra]?.trim() || ''),
      saldo:     parseBRFloat(cols[idx.saldo]),
      custo:     parseBRFloat(cols[idx.custo]),
      categoria: identificarCategoria(nome),
      contagem:  null,
    });

    return acc;
  }, []);
}
