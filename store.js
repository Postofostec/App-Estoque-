/**
 * @module Store
 * @description Centralized state management with observer pattern.
 * Single source of truth for all application data.
 */

const STORAGE_KEY = 'estoque_v2';

const State = (() => {
  let _state = {
    produtos: [],
    filtro: '',
    ordenacao: 'csv', // 'csv' | 'az'
    categoriaAtiva: 'todas', // 'todas' | 'Óleo' | 'Filtro' | 'Vitrine'
  };

  const _listeners = new Set();

  const notify = () => _listeners.forEach(fn => fn({ ..._state }));

  return {
    get: () => ({ ..._state }),

    set(partial) {
      _state = { ..._state, ...partial };
      notify();
    },

    subscribe(fn) {
      _listeners.add(fn);
      return () => _listeners.delete(fn); // unsubscribe
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_state.produtos));
      } catch (e) {
        console.warn('[Store] Falha ao persistir estado:', e);
      }
    },

    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          _state.produtos = JSON.parse(raw);
          notify();
        }
      } catch (e) {
        console.warn('[Store] Falha ao hidratar estado:', e);
      }
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
      _state = { ..._state, produtos: [], filtro: '', categoriaAtiva: 'todas' };
      notify();
    },
  };
})();

export default State;
