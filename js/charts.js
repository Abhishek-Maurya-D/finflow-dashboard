/**
 * charts.js
 * ─────────────────────────────────────────────────────────────
 * Pure SVG chart renderers. Each function receives data and
 * returns an HTML string — no DOM manipulation here.
 *
 * Charts are drawn with raw SVG math so there is no dependency
 * on a charting library. They inherit CSS custom properties for
 * colours, so dark mode works automatically.
 *
 * Depends on: utils.js (fmt, fmtShort, ico)
 * Used by:    pages.js
 */

'use strict';

// ── Area / Line Chart ────────────────────────────────────────

/**
 * Renders a two-series (income + expense) area chart as an SVG string.
 *
 * @param {Array<{ k, inc, exp, lbl }>} data - monthly aggregated data
 * @returns {string} HTML string containing the SVG and legend
 */
function renderAreaChart(data) {
  if (!data.length) {
    return `<div class="empty-state">
      ${ico('bar', 36)}
      <div class="empty-title">No data yet</div>
      <div class="empty-sub">Add some transactions to see the trend</div>
    </div>`;
  }

  // Chart dimensions and padding
  const W  = 640;  // viewBox width
  const H  = 180;  // viewBox height
  const PL = 50;   // left padding (for y-axis labels)
  const PR = 14;   // right padding
  const PT = 12;   // top padding
  const PB = 28;   // bottom padding (for x-axis labels)

  const cW = W - PL - PR;  // drawable width
  const cH = H - PT - PB;  // drawable height

  const maxV = Math.max(...data.map(d => Math.max(d.inc, d.exp)), 1);

  // x position for data point i
  const x = i => PL + i * (cW / Math.max(data.length - 1, 1));
  // y position for value v
  const y = v => PT + cH - (v / maxV) * cH;

  // ── Y-axis grid lines ──
  let grid = '';
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  ticks.forEach(t => {
    const yy = PT + cH * (1 - t);
    const v  = Math.round(maxV * t);
    grid += `<line x1="${PL}" y1="${yy}" x2="${W - PR}" y2="${yy}"
      stroke="var(--border)" stroke-width="1"/>`;
    grid += `<text x="${PL - 6}" y="${yy + 4}"
      fill="var(--text3)" font-size="9.5" font-family="monospace" text-anchor="end">
      $${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}
    </text>`;
  });

  // ── SVG path strings ──
  const incPts = data.map((d, i) => `${x(i)},${y(d.inc)}`).join(' L ');
  const expPts = data.map((d, i) => `${x(i)},${y(d.exp)}`).join(' L ');

  const bottom = PT + cH;
  const lx = x(0);
  const rx = x(data.length - 1);

  // ── X-axis labels (skip some if too many months) ──
  let xlbl = '';
  const step = Math.ceil(data.length / 6);
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      xlbl += `<text x="${x(i)}" y="${H - 4}"
        fill="var(--text3)" font-size="9.5" font-family="monospace" text-anchor="middle">
        ${d.lbl}
      </text>`;
    }
  });

  // ── Data point circles with native SVG tooltips ──
  let dots = '';
  data.forEach((d, i) => {
    dots += `
      <circle cx="${x(i)}" cy="${y(d.inc)}" r="3.5"
        fill="var(--green)" stroke="var(--surface)" stroke-width="1.5">
        <title>${d.lbl} — Income: ${fmt(d.inc)}</title>
      </circle>
      <circle cx="${x(i)}" cy="${y(d.exp)}" r="3.5"
        fill="var(--red)" stroke="var(--surface)" stroke-width="1.5">
        <title>${d.lbl} — Expense: ${fmt(d.exp)}</title>
      </circle>`;
  });

  return `
    <div class="chart-svg-wrap" style="height:190px">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="height:180px">
        <defs>
          <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="var(--green)" stop-opacity=".18"/>
            <stop offset="100%" stop-color="var(--green)" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="var(--red)" stop-opacity=".15"/>
            <stop offset="100%" stop-color="var(--red)" stop-opacity="0"/>
          </linearGradient>
        </defs>

        ${grid}

        <!-- Filled areas -->
        <path d="M ${incPts} L ${rx},${bottom} L ${lx},${bottom} Z" fill="url(#gI)"/>
        <path d="M ${expPts} L ${rx},${bottom} L ${lx},${bottom} Z" fill="url(#gE)"/>

        <!-- Lines -->
        <path d="M ${incPts}" fill="none" stroke="var(--green)" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M ${expPts}" fill="none" stroke="var(--red)"   stroke-width="1.8" stroke-linejoin="round"/>

        ${dots}
        ${xlbl}
      </svg>
    </div>

    <div class="chart-legend">
      <div class="leg-item">
        <div class="leg-dot" style="background:var(--green)"></div>
        Income
      </div>
      <div class="leg-item">
        <div class="leg-dot" style="background:var(--red)"></div>
        Expense
      </div>
    </div>`;
}

// ── Donut Chart ──────────────────────────────────────────────

/**
 * Renders a donut chart showing expense distribution by category.
 *
 * @param {Array<{ n: string, v: number }>} data - sorted category totals
 * @returns {string} HTML string containing the SVG and legend
 */
function renderDonut(data) {
  if (!data.length) {
    return `<div class="empty-state">
      ${ico('zap', 36)}
      <div class="empty-title">No expense data</div>
      <div class="empty-sub">Add some expenses to see the breakdown</div>
    </div>`;
  }

  const total = data.reduce((s, d) => s + d.v, 0);

  // SVG dimensions
  const R  = 58;   // outer radius
  const ri = 34;   // inner radius (donut hole)
  const cx = 70;   // centre x
  const cy = 70;   // centre y
  const sz = 140;  // viewBox size

  let ang = -Math.PI / 2;  // start at top
  let paths = '';

  data.forEach(d => {
    const a = (d.v / total) * 2 * Math.PI;  // slice angle

    // Arc start and end points (outer ring)
    const x1 = cx + R * Math.cos(ang);
    const y1 = cy + R * Math.sin(ang);
    const x2 = cx + R * Math.cos(ang + a);
    const y2 = cy + R * Math.sin(ang + a);

    // Arc start and end points (inner ring, for donut cutout)
    const ix1 = cx + ri * Math.cos(ang);
    const iy1 = cy + ri * Math.sin(ang);
    const ix2 = cx + ri * Math.cos(ang + a);
    const iy2 = cy + ri * Math.sin(ang + a);

    // SVG large-arc-flag: 1 if the slice is > 180°
    const lg = a > Math.PI ? 1 : 0;

    const col = CAT_PALETTE[d.n] || '#64748b';

    paths += `
      <path d="M ${x1} ${y1}
               A ${R} ${R} 0 ${lg} 1 ${x2} ${y2}
               L ${ix2} ${iy2}
               A ${ri} ${ri} 0 ${lg} 0 ${ix1} ${iy1} Z"
        fill="${col}">
        <title>${d.n}: ${fmt(d.v)} (${((d.v / total) * 100).toFixed(0)}%)</title>
      </path>`;

    ang += a;
  });

  // Legend rows (up to 6 categories)
  const legend = data.slice(0, 6).map(d => `
    <div class="donut-row">
      <div class="donut-left">
        <div class="donut-swatch" style="background:${CAT_PALETTE[d.n] || '#64748b'}"></div>
        ${esc(d.n)}
      </div>
      <div class="donut-pct">
        ${((d.v / total) * 100).toFixed(0)}% · ${fmt(d.v)}
      </div>
    </div>`).join('');

  return `
    <div class="donut-section">
      <div class="donut-center">
        <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
          ${paths}
          <!-- Centre labels -->
          <text x="${cx}" y="${cy - 5}" text-anchor="middle"
            fill="var(--text3)" font-size="9" font-family="monospace">TOTAL</text>
          <text x="${cx}" y="${cy + 11}" text-anchor="middle"
            fill="var(--text)" font-size="13" font-family="monospace" font-weight="500">
            ${fmt(total)}
          </text>
        </svg>
      </div>
      <div class="donut-legend-list">${legend}</div>
    </div>`;
}
