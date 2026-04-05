/**
 * utils.js
 * ─────────────────────────────────────────────────────────────
 * Pure utility functions — no side effects, no DOM access.
 * Everything here can be unit-tested in isolation.
 *
 * Depends on: nothing
 * Used by:    state.js, charts.js, pages.js, ui.js
 */

'use strict';

// ── DOM shorthand ────────────────────────────────────────────

/**
 * Shorthand for document.getElementById.
 * @param {string} id
 * @returns {HTMLElement}
 */
const $ = id => document.getElementById(id);

// ── Number / Date formatters ─────────────────────────────────

/**
 * Format a number as USD currency (no cents shown for whole dollars).
 * e.g. 1500 → "$1,500"
 */
const fmt = n =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

/**
 * Format a number as USD with always-visible cents.
 * e.g. 12.5 → "$12.50"
 */
const fmtFull = n =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

/**
 * Format a YYYY-MM-DD date string as "Apr 3, 2026".
 * Adds T12:00 to avoid timezone-related off-by-one days.
 */
const fmtDate = d => {
  try {
    return new Date(d + 'T12:00').toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    });
  } catch {
    return d;
  }
};

/**
 * Format a YYYY-MM-DD date string as "Jan '26" (short month + year).
 * Used for chart x-axis labels.
 */
const fmtShort = d => {
  try {
    return new Date(d + 'T12:00').toLocaleDateString('en-US', {
      month: 'short',
      year:  '2-digit',
    });
  } catch {
    return d;
  }
};

// ── Security ─────────────────────────────────────────────────

/**
 * Escape a string for safe insertion into HTML.
 * Prevents XSS when rendering user-entered notes or categories.
 * @param {string} s
 * @returns {string}
 */
const esc = s =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// ── Icon builder ─────────────────────────────────────────────

/**
 * Returns an inline SVG string for the given icon name.
 * All icons are from Lucide (https://lucide.dev), MIT-licensed.
 *
 * @param {string} name - icon key (see ICONS map below)
 * @param {number} sz   - width/height in px (default 18)
 * @returns {string}    - SVG element as a string
 */
function ico(name, sz = 18) {
  const ICONS = {
    wallet:  `<path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><line x1="16" y1="12" x2="16.01" y2="12"/>`,
    up:      `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
    down:    `<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>`,
    fire:    `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>`,
    zap:     `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    bar:     `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
    eye:     `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
    plus:    `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    edit:    `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
    del:     `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>`,
    srch:    `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
    chk:     `<polyline points="20 6 9 17 4 12"/>`,
    warn:    `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
    lock:    `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
    info:    `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
  };

  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}
