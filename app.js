/**
 * @module App
 * @description Ponto de entrada da aplicação.
 * Responsável por ligar eventos à lógica de negócio.
 * Não contém lógica — apenas orquestração.
 */

import State from './store.js';
import { parseCSV } from './parser.js';
import { renderizarLista, atualizarDiffInline, atualizarProgresso } from './renderer.js';
import { gerarRelatorioPDF } from './pdf-exporter.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast toast--${type} toast--visible`;
  setTimeout(() => el.classList.remove('toast--visible'), 3000);
}

function $(id) { return document.getElementById(id); }

// ─── Event Handlers ──────────────────────────────────────────────────────────

function onCSVLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const produtos = parseCSV(e.target.result);
    if (produtos.length === 0) {
      showToast('CSV inválido ou vazio.', 'error');
      return;
    }
    State.set({ produtos });
    State.persist();
    showToast(`${produtos.length} produtos importados.`, 'success');
  };
  reader.readAsText(file, 'UTF-8');
}

function onBusca(e) {
  State.set({ filtro: e.target.value.trim() });
}

function onOrdenar() {
  const atual = State.get().ordenacao;
  const nova = atual === 'csv' ? 'az' : 'csv';
  State.set({ ordenacao: nova });

  const btn = $('btnOrdenar');
  if (btn) {
    btn.querySelector('.btn-label').textContent = nova === 'az' ? 'Ordem: A–Z' : 'Ordem: CSV';
    btn.classList.toggle('btn--active', nova === 'az');
  }
}

function onCategoria(categoria) {
  State.set({ categoriaAtiva: categoria });

  document.querySelectorAll('[data-categoria]').forEach(btn => {
    btn.classList.toggle('btn--active', btn.dataset.categoria === categoria);
  });
}

function onContagem(e) {
  const input = e.target;
  if (!input.classList.contains('input-contagem')) return;

  const nome = input.dataset.nome;
  const valor = input.value === '' ? null : parseFloat(input.value);

  // Atualiza estado sem re-renderizar
  const produtos = State.get().produtos.map(p =>
    p.nome === nome ? { ...p, contagem: valor } : p
  );
  State.set({ produtos });
  State.persist();

  // Atualiza apenas o diff do card afetado
  atualizarDiffInline(nome, valor);
  atualizarProgresso(State.get());
}

function onReset() {
  const confirmado = confirm('Deseja apagar toda a contagem e recomeçar do zero?\n\nEsta ação não pode ser desfeita.');
  if (!confirmado) return;

  State.clear();
  const csvInput = $('csvInput');
  if (csvInput) csvInput.value = '';
  showToast('Sistema limpo com sucesso.', 'info');
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

function bindEvents() {
  $('csvInput')?.addEventListener('change', onCSVLoad);
  $('txtBusca')?.addEventListener('input', onBusca);
  $('btnOrdenar')?.addEventListener('click', onOrdenar);
  $('btnReset')?.addEventListener('click', onReset);
  $('btnExportar')?.addEventListener('click', () => gerarRelatorioPDF(State.get().produtos));

  // Categorias via delegação
  document.querySelectorAll('[data-categoria]').forEach(btn => {
    btn.addEventListener('click', () => onCategoria(btn.dataset.categoria));
  });

  // Input de contagem via event delegation (1 listener para toda a lista)
  document.getElementById('lista')?.addEventListener('input', onContagem);
}

function init() {
  // Reage a mudanças de estado
  State.subscribe(state => {
    renderizarLista(state);
    atualizarProgresso(state);
  });

  // Carrega dados salvos
  State.hydrate();

  // Liga eventos
  bindEvents();

  // Ativa categoria "todas" por padrão
  document.querySelector('[data-categoria="todas"]')?.classList.add('btn--active');
}

document.addEventListener('DOMContentLoaded', init);
