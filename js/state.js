/**
 * state.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for the entire application.
 *
 * Pattern used: unidirectional data flow (Flux-lite)
 *   User action → mutate S → call render() → UI updates
 *
 * All UI is derived from S — nothing is stored in the DOM.
 *
 * Depends on: data.js (SEED must be loaded first)
 */

'use strict';

// ── Persistence helpers ──────────────────────────────────────

/**
 * Load saved transactions from localStorage.
 * Falls back to SEED if nothing is stored or parsing fails.
 * @returns {Array} Array of transaction objects
 */
function loadStorage() {
  try {
    const saved = localStorage.getItem('finflow_txns');
    // Deep-clone SEED so the original array is never mutated
    return saved ? JSON.parse(saved) : SEED.map(t => ({ ...t }));
  } catch (err) {
    console.warn('Could not load from localStorage:', err);
    return SEED.map(t => ({ ...t }));
  }
}

/**
 * Write current transactions to localStorage.
 * Called after every add / edit / delete action.
 */
function persist() {
  try {
    localStorage.setItem('finflow_txns', JSON.stringify(S.txns));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
}

// ── Application State ────────────────────────────────────────

/**
 * S  — the one and only state object.
 *
 * Never mutate nested objects in place; always reassign:
 *   S.txns = S.txns.filter(...)   ✓
 *   S.txns.splice(...)            ✗
 */
const S = {
  // Persisted data
  txns: loadStorage(),

  // UI state
  role:    'admin',        // 'admin' | 'viewer'
  page:    'overview',     // 'overview' | 'transactions' | 'insights'
  dark:    false,

  // Transactions page controls
  filter:  'all',          // 'all' | 'income' | 'expense'
  search:  '',
  sort: {
    field: 'date',         // 'date' | 'amount'
    dir:   'desc',         // 'asc'  | 'desc'
  },
  curPage: 1,              // current pagination page

  // Modal state
  editId: null,            // null = adding new, number = editing existing
};

// ── Derived data ─────────────────────────────────────────────

/**
 * Calculate income, expenses and net balance from all transactions.
 * @returns {{ inc: number, exp: number, bal: number }}
 */
function getTotals() {
  const inc = S.txns
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const exp = S.txns
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { inc, exp, bal: inc - exp };
}

/**
 * Apply current filter, search query and sort to transaction list.
 * Returns a new sorted array — never mutates S.txns.
 * @returns {Array} Filtered and sorted transactions
 */
function getFiltered() {
  let list = [...S.txns];

  // Type filter
  if (S.filter !== 'all') {
    list = list.filter(t => t.type === S.filter);
  }

  // Text search (category, note, or amount)
  if (S.search) {
    const q = S.search.toLowerCase();
    list = list.filter(t =>
      t.category.toLowerCase().includes(q) ||
      (t.note || '').toLowerCase().includes(q) ||
      String(t.amount).includes(q)
    );
  }

  // Sort
  const { field, dir } = S.sort;
  list.sort((a, b) => {
    const av = field === 'amount' ? a.amount : a.date;
    const bv = field === 'amount' ? b.amount : b.date;
    if (av > bv) return dir === 'asc' ?  1 : -1;
    if (av < bv) return dir === 'asc' ? -1 :  1;
    return 0;
  });

  return list;
}

/**
 * Aggregate transactions by month for the area chart.
 * Returns months sorted chronologically.
 * @returns {Array<{ k, inc, exp, lbl }>}
 */
function getMonthlyData() {
  const map = {};

  [...S.txns]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(t => {
      const k = t.date.slice(0, 7); // "YYYY-MM"
      if (!map[k]) map[k] = { k, inc: 0, exp: 0 };
      t.type === 'income' ? (map[k].inc += t.amount) : (map[k].exp += t.amount);
    });

  return Object.values(map).map(d => ({
    ...d,
    lbl: fmtShort(d.k + '-15'), // e.g. "Jan '26"
  }));
}

/**
 * Sum expenses by category, sorted descending by value.
 * @returns {Array<{ n: string, v: number }>}
 */
function getCatData() {
  const map = {};

  S.txns
    .filter(t => t.type === 'expense')
    .forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

  return Object.entries(map)
    .map(([n, v]) => ({ n, v }))
    .sort((a, b) => b.v - a.v);
}
