/**
 * data.js
 * ─────────────────────────────────────────────────────────────
 * Static seed data and lookup constants.
 * Nothing here is stateful — it never changes at runtime.
 *
 * Consumed by:
 *   state.js  → SEED is used when localStorage is empty
 *   charts.js → CAT_PALETTE maps category names to colours
 *   pages.js  → CAT_PALETTE for the insights bar chart
 */

'use strict';

/**
 * 18 mock transactions spanning Jan–Apr 2026.
 * Mix of income and expenses across common categories.
 *
 * Shape: { id, date (YYYY-MM-DD), amount, category, type, note }
 */
const SEED = [
  { id: 1,  date: '2026-01-05', amount: 5200, category: 'Salary',    type: 'income',  note: 'January salary'         },
  { id: 2,  date: '2026-01-08', amount: 320,  category: 'Food',      type: 'expense', note: 'Grocery run'             },
  { id: 3,  date: '2026-01-14', amount: 85,   category: 'Bills',     type: 'expense', note: 'Internet bill'           },
  { id: 4,  date: '2026-01-20', amount: 450,  category: 'Shopping',  type: 'expense', note: 'Clothes'                 },
  { id: 5,  date: '2026-01-25', amount: 1200, category: 'Freelance', type: 'income',  note: 'Website project'         },
  { id: 6,  date: '2026-02-03', amount: 5200, category: 'Salary',    type: 'income',  note: 'February salary'         },
  { id: 7,  date: '2026-02-07', amount: 210,  category: 'Food',      type: 'expense', note: 'Restaurant'              },
  { id: 8,  date: '2026-02-12', amount: 1800, category: 'Travel',    type: 'expense', note: 'Flight tickets'          },
  { id: 9,  date: '2026-02-18', amount: 95,   category: 'Bills',     type: 'expense', note: 'Electricity'             },
  { id: 10, date: '2026-02-22', amount: 350,  category: 'Shopping',  type: 'expense', note: 'Electronics'             },
  { id: 11, date: '2026-03-05', amount: 5200, category: 'Salary',    type: 'income',  note: 'March salary'            },
  { id: 12, date: '2026-03-10', amount: 140,  category: 'Food',      type: 'expense', note: 'Weekly groceries'        },
  { id: 13, date: '2026-03-15', amount: 800,  category: 'Freelance', type: 'income',  note: 'Design work'             },
  { id: 14, date: '2026-03-20', amount: 220,  category: 'Bills',     type: 'expense', note: 'Phone & utilities'       },
  { id: 15, date: '2026-03-28', amount: 600,  category: 'Travel',    type: 'expense', note: 'Hotel stay'              },
  { id: 16, date: '2026-04-01', amount: 5200, category: 'Salary',    type: 'income',  note: 'April salary'            },
  { id: 17, date: '2026-04-02', amount: 180,  category: 'Food',      type: 'expense', note: 'Dining out'              },
  { id: 18, date: '2026-04-03', amount: 90,   category: 'Bills',     type: 'expense', note: 'Streaming subscriptions' },
];

/**
 * Maps each spending category to a fixed brand colour.
 * Used for donut slices, bar fills, and legend swatches.
 */
const CAT_PALETTE = {
  Food:      '#f59e0b',
  Travel:    '#8b5cf6',
  Bills:     '#ef4444',
  Shopping:  '#ec4899',
  Salary:    '#059669',
  Freelance: '#2563eb',
  Other:     '#64748b',
};
