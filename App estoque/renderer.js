/**
 * @module Renderer
 * @description Responsável exclusivamente pela camada de renderização da UI.
 * Separado da lógica de negócio — recebe dados, retorna DOM.
 */

import State from './store.js';

/** Cache do container principal */
let _listaEl = null;

const getListaEl = () => _listaEl || (_listaEl = document.getElementById('lista'));

/**
 * Calcula e retorna os produtos a exibir com base no estado atual.
 * @param {AppState} state
 * @returns {Produto[]}
 */
function selecionarProdutos(state) {
  let lista = [...state.produtos];

  // Filtro por categoria
  if (state.categoriaAtiva !== 'todas') {
    lista = lista.filter(p => p.categoria === state.categoriaAtiva);
  }

  // Filtro por texto
  if (state.filtro) {
    const termo = state.filtro.toLowerCase();
    lista = lista.filter(
      p => p.nome.toLowerCase().includes(termo) || p.barra.includes(termo)
    );
  }

  // Ordenação
  if (state.ordenacao === 'az') {
    lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  return lista;
}

/**
 * Cria o elemento de card de produto.
 * Usa dataset para referência sem closures pesadas.
 * @param {Produto} p
 * @param {number} globalIndex
 * @returns {HTMLElement}
 */
function criarCard(p, globalIndex) {
  const diff = p.contagem === null ? null : p.contagem - p.saldo;
  const diffFormatado = diff === null ? '—' : (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2));
  const corDiff = diff === null ? 'var(--muted)' : diff < 0 ? 'var(--danger)' : diff > 0 ? 'var(--success)' : 'var(--muted)';
  const catClass = `cat-badge cat-badge--${p.categoria.toLowerCase().replace('ó', 'o')}`;

  const card = document.createElement('article');
  card.className = 'produto-card';
  card.dataset.nome = p.nome;
  card.style.setProperty('--anim-delay', `${(globalIndex % 20) * 30}ms`);

  card.innerHTML = `
    <div class="produto-info">
      <span class="produto-barra">${p.barra}</span>
      <span class="produto-nome">${p.nome}</span>
      <div class="produto-meta">
        <span class="produto-id">ID ${p.codItem}</span>
        <span class="${catClass}">${p.categoria}</span>
        <span class="produto-saldo">Sistema: <strong>${p.saldo.toFixed(2)}</strong></span>
      </div>
    </div>
    <div class="produto-acoes">
      <input
        type="number"
        step="0.01"
        inputmode="decimal"
        placeholder="Qtd"
        class="input-contagem"
        value="${p.contagem === null ? '' : p.contagem}"
        aria-label="Contagem de ${p.nome}"
        data-nome="${p.nome.replace(/"/g, '&quot;')}"
      >
      <span class="diff-badge" style="color: ${corDiff}">
        ${diffFormatado}
      </span>
    </div>`;

  return card;
}

/**
 * Renderiza a lista de produtos usando DocumentFragment para performance.
 * @param {AppState} state
 */
export function renderizarLista(state) {
  const el = getListaEl();
  if (!el) return;

  const produtos = selecionarProdutos(state);

  // Empty state
  if (produtos.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
        </svg>
        <p>${state.produtos.length === 0 ? 'Importe um arquivo CSV para começar' : 'Nenhum produto encontrado'}</p>
      </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  produtos.forEach((p, i) => fragment.appendChild(criarCard(p, i)));

  el.innerHTML = '';
  el.appendChild(fragment);

  // Atualiza contadores no header
  atualizarContadores(state);
}

/**
 * Atualiza inline o diff de um produto sem re-renderizar a lista inteira.
 * Chamado pelo handler de input para máxima performance.
 * @param {string} nome
 * @param {number|null} contagem
 */
export function atualizarDiffInline(nome, contagem) {
  const card = getListaEl()?.querySelector(`[data-nome="${nome}"]`);
  if (!card) return;

  const diffEl = card.querySelector('.diff-badge');
  const produto = State.get().produtos.find(p => p.nome === nome);
  if (!diffEl || !produto) return;

  if (contagem === null) {
    diffEl.textContent = '—';
    diffEl.style.color = 'var(--muted)';
    return;
  }

  const diff = contagem - produto.saldo;
  diffEl.textContent = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
  diffEl.style.color = diff < 0 ? 'var(--danger)' : diff > 0 ? 'var(--success)' : 'var(--muted)';
}

/**
 * Atualiza badges de contagem nas abas de categoria.
 * @param {AppState} state
 */
function atualizarContadores(state) {
  const categorias = ['Óleo', 'Filtro', 'Vitrine'];
  categorias.forEach(cat => {
    const count = state.produtos.filter(p => p.categoria === cat).length;
    const badge = document.querySelector(`[data-categoria="${cat}"] .btn-count`);
    if (badge) badge.textContent = count;
  });

  const totalBadge = document.querySelector('[data-categoria="todas"] .btn-count');
  if (totalBadge) totalBadge.textContent = state.produtos.length;
}

/**
 * Atualiza o indicador de progresso de contagem.
 * @param {AppState} state
 */
export function atualizarProgresso(state) {
  const total = state.produtos.length;
  const contados = state.produtos.filter(p => p.contagem !== null).length;
  const pct = total > 0 ? Math.round((contados / total) * 100) : 0;

  const bar = document.getElementById('progressBar');
  const label = document.getElementById('progressLabel');

  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = total > 0 ? `${contados}/${total} contados (${pct}%)` : '';
}
