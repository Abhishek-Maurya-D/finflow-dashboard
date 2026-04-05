/**
 * pages.js
 * ─────────────────────────────────────────────────────────────
 * HTML string builders for each page.
 * Each function returns a string that gets injected into #pageContent.
 *
 * render() is the single entry point — it reads S.page and calls
 * the right builder. Called after every state mutation.
 *
 * Depends on: state.js, utils.js, charts.js
 * Used by:    ui.js, app.js
 */

'use strict';

// Rows per page in the transactions table
const PER_PAGE = 10;

// ── render ───────────────────────────────────────────────────

/**
 * Main render function. Reads S.page and injects the correct
 * page HTML into #pageContent, then re-triggers the CSS animation.
 */
function render() {
  const container = $('pageContent');

  // Re-trigger the fadeUp animation on page switch
  container.style.animation = 'none';
  void container.offsetWidth;
  container.style.animation = '';

  switch (S.page) {
    case 'overview':     container.innerHTML = buildOverview();     break;
    case 'transactions': container.innerHTML = buildTransactions(); break;
    case 'insights':     container.innerHTML = buildInsightsPage(); break;
    default:             container.innerHTML = buildOverview();
  }
}

// ── Overview page ────────────────────────────────────────────

/**
 * Build the full overview page: summary cards + charts + insights strip.
 */
function buildOverview() {
  return buildSummaryCards() + buildChartsRow() + buildInsightCards();
}

function buildSummaryCards() {
  const { inc, exp, bal } = getTotals();
  const txns = S.txns;

  return `
  <div class="summary-row">

    <div class="sum-card s-balance">
      <div class="sum-meta">
        <div class="sum-label">Net Balance</div>
        <div class="sum-value c-blue">${fmt(bal)}</div>
        <div class="sum-sub">${txns.length} transactions total</div>
      </div>
      <div class="sum-icon i-blue">${ico('wallet')}</div>
    </div>

    <div class="sum-card s-income">
      <div class="sum-meta">
        <div class="sum-label">Total Income</div>
        <div class="sum-value c-green">${fmt(inc)}</div>
        <div class="sum-sub">${txns.filter(t => t.type === 'income').length} income entries</div>
      </div>
      <div class="sum-icon i-green">${ico('up')}</div>
    </div>

    <div class="sum-card s-expense">
      <div class="sum-meta">
        <div class="sum-label">Total Expenses</div>
        <div class="sum-value c-red">${fmt(exp)}</div>
        <div class="sum-sub">${txns.filter(t => t.type === 'expense').length} expense entries</div>
      </div>
      <div class="sum-icon i-red">${ico('down')}</div>
    </div>

  </div>`;
}

function buildChartsRow() {
  return `
  <div class="charts-row">

    <div class="chart-card">
      <div class="card-header">
        <div>
          <div class="card-title">Cash Flow Trend</div>
          <div class="card-subtitle">Monthly income vs expenses</div>
        </div>
      </div>
      ${renderAreaChart(getMonthlyData())}
    </div>

    <div class="chart-card">
      <div class="card-header">
        <div>
          <div class="card-title">Spending by Category</div>
          <div class="card-subtitle">Expense distribution</div>
        </div>
      </div>
      ${renderDonut(getCatData())}
    </div>

  </div>`;
}

function buildInsightCards() {
  const { inc, exp } = getTotals();
  const cats = getCatData();

  // Current month figures
  const now   = new Date();
  const mKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const mTxns = S.txns.filter(t => t.date.startsWith(mKey));
  const mInc  = mTxns.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const mExp  = mTxns.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const mDelta = mInc - mExp;

  const savRate = inc > 0 ? ((inc - exp) / inc * 100).toFixed(1) : '0';
  const ratio   = inc > 0 ? (exp / inc * 100).toFixed(1)         : '0';

  return `
  <div class="insights-row">

    <div class="insight-card">
      <div class="insight-ico ic-amber">${ico('fire')}</div>
      <div>
        <div class="insight-label">Top Category</div>
        <div class="insight-value">${cats[0] ? cats[0].n : '—'}</div>
        <div class="insight-desc">${cats[0] ? fmt(cats[0].v) + ' total spent' : 'No expenses yet'}</div>
      </div>
    </div>

    <div class="insight-card">
      <div class="insight-ico ic-${mDelta >= 0 ? 'green' : 'red'}">${ico(mDelta >= 0 ? 'up' : 'down')}</div>
      <div>
        <div class="insight-label">This Month</div>
        <div class="insight-value">${fmt(Math.abs(mDelta))}</div>
        <div class="insight-desc">${mDelta >= 0 ? 'Surplus' : 'Deficit'} · ${fmt(mExp)} spent</div>
      </div>
    </div>

    <div class="insight-card">
      <div class="insight-ico ic-teal">${ico('zap')}</div>
      <div>
        <div class="insight-label">Savings Rate</div>
        <div class="insight-value">${savRate}%</div>
        <div class="insight-desc">Of all income retained</div>
      </div>
    </div>

    <div class="insight-card">
      <div class="insight-ico ic-purple">${ico('bar')}</div>
      <div>
        <div class="insight-label">Spend Ratio</div>
        <div class="insight-value">${ratio}%</div>
        <div class="insight-desc">${fmt(exp)} of ${fmt(inc)} earned</div>
      </div>
    </div>

  </div>`;
}

// ── Transactions page ────────────────────────────────────────

/**
 * Build the full transactions page: toolbar + table + pagination.
 */
function buildTransactions() {
  const fl      = getFiltered();
  const total   = fl.length;
  const pages   = Math.max(1, Math.ceil(total / PER_PAGE));

  // Clamp current page
  if (S.curPage > pages) S.curPage = pages;

  const paged   = fl.slice((S.curPage - 1) * PER_PAGE, S.curPage * PER_PAGE);
  const isAdmin = S.role === 'admin';

  return `
  <div class="txn-card">
    ${buildToolbar(total, isAdmin)}
    <div class="table-wrap">
      <table class="txn-table">
        ${buildTableHead(isAdmin)}
        <tbody>${buildTableRows(paged, isAdmin)}</tbody>
      </table>
    </div>
    ${buildPagination(total, pages)}
  </div>`;
}

function buildToolbar(total, isAdmin) {
  return `
  <div class="txn-toolbar">
    <div class="txn-filters">

      <div class="search-box">
        ${ico('srch', 14)}
        <input
          class="search-input"
          placeholder="Search category, note, amount…"
          value="${esc(S.search)}"
          oninput="doSearch(this.value)"
        />
      </div>

      <select class="filter-select" onchange="doFilter(this.value)">
        <option value="all"    ${S.filter === 'all'     ? 'selected' : ''}>All Types</option>
        <option value="income" ${S.filter === 'income'  ? 'selected' : ''}>Income</option>
        <option value="expense"${S.filter === 'expense' ? 'selected' : ''}>Expense</option>
      </select>

    </div>

    ${isAdmin
      ? `<button class="add-txn-btn" onclick="openAdd()">
           ${ico('plus', 13)} Add Transaction
         </button>`
      : `<div class="viewer-badge">${ico('lock', 13)} View only</div>`
    }
  </div>`;
}

function buildTableHead(isAdmin) {
  /**
   * Renders a sortable column header.
   * Clicking the same field toggles asc/desc; clicking a new field resets to desc.
   */
  const th = (field, label) => {
    const isSorted = S.sort.field === field;
    const arrow    = isSorted ? (S.sort.dir === 'asc' ? '↑' : '↓') : '⇅';
    return `<th class="${isSorted ? 'sorted-col' : ''}" onclick="doSort('${field}')">
      ${label}<span class="sort-indicator">${arrow}</span>
    </th>`;
  };

  return `
  <thead>
    <tr>
      ${th('date', 'Date')}
      <th>Note</th>
      <th>Category</th>
      ${th('amount', 'Amount')}
      <th>Type</th>
      ${isAdmin ? '<th>Actions</th>' : ''}
    </tr>
  </thead>`;
}

function buildTableRows(paged, isAdmin) {
  if (!paged.length) {
    return `
    <tr>
      <td colspan="${isAdmin ? 6 : 5}">
        <div class="empty-state">
          ${ico('srch', 36)}
          <div class="empty-title">No transactions found</div>
          <div class="empty-sub">Try adjusting your search or filter</div>
        </div>
      </td>
    </tr>`;
  }

  return paged.map(t => `
    <tr>
      <td class="date-cell">${fmtDate(t.date)}</td>
      <td style="max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text2)">
        ${esc(t.note || '—')}
      </td>
      <td><span class="cat-tag">${esc(t.category)}</span></td>
      <td class="amt-cell ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
      <td>
        <span class="badge ${t.type}">
          ${ico(t.type === 'income' ? 'up' : 'down', 9)} ${t.type}
        </span>
      </td>
      ${isAdmin ? `
      <td>
        <div class="row-actions">
          <button class="row-btn edit" onclick="openEdit(${t.id})" title="Edit">
            ${ico('edit', 13)}
          </button>
          <button class="row-btn del" onclick="doDelete(${t.id})" title="Delete">
            ${ico('del', 13)}
          </button>
        </div>
      </td>` : ''}
    </tr>`).join('');
}

function buildPagination(total, pages) {
  // Show page numbers within ±2 of current page
  const visible = [];
  for (let p = 1; p <= pages; p++) {
    if (Math.abs(p - S.curPage) < 3) visible.push(p);
  }

  const showing = total
    ? `${(S.curPage - 1) * PER_PAGE + 1}–${Math.min(S.curPage * PER_PAGE, total)} of ${total}`
    : '0 results';

  return `
  <div class="pagination-row">
    <div class="page-info">Showing ${showing}</div>
    <div class="page-btns">
      <button class="page-btn" onclick="doPage(${S.curPage - 1})"
        ${S.curPage === 1 ? 'disabled' : ''}>‹</button>
      ${visible.map(p => `
        <button class="page-btn ${p === S.curPage ? 'cur' : ''}"
          onclick="doPage(${p})">${p}</button>`).join('')}
      <button class="page-btn" onclick="doPage(${S.curPage + 1})"
        ${S.curPage === pages ? 'disabled' : ''}>›</button>
    </div>
  </div>`;
}

// ── Insights page ─────────────────────────────────────────────

/**
 * Build the full insights page:
 *   - Two charts (area + donut)
 *   - Three stat cards (top category, MoM change, avg expense)
 *   - Category bar chart
 */
function buildInsightsPage() {
  const { inc, exp } = getTotals();
  const monthly      = getMonthlyData();
  const cats         = getCatData();
  const totalExp     = cats.reduce((a, c) => a + c.v, 0);

  // Month-over-month comparison (last two recorded months)
  const lastTwo = monthly.slice(-2);
  let momText;
  if (lastTwo.length === 2) {
    const prev = lastTwo[0].exp;
    const curr = lastTwo[1].exp;
    const diff = curr - prev;
    const pct  = prev > 0 ? ((Math.abs(diff) / prev) * 100).toFixed(0) : 0;
    momText = `Expenses ${diff >= 0 ? 'up' : 'down'} ${pct}% vs previous month`;
  } else {
    momText = 'Not enough data for month comparison';
  }

  // Average monthly expense
  const avgExp = monthly.length
    ? (monthly.reduce((a, m) => a + m.exp, 0) / monthly.length)
    : 0;

  return `
  <!-- Charts row (reused from overview) -->
  <div class="charts-row" style="margin-bottom:20px">
    <div class="chart-card">
      <div class="card-header">
        <div>
          <div class="card-title">Monthly Cash Flow</div>
          <div class="card-subtitle">Income and expenses each month</div>
        </div>
      </div>
      ${renderAreaChart(monthly)}
    </div>
    <div class="chart-card">
      <div class="card-header">
        <div>
          <div class="card-title">Spending by Category</div>
          <div class="card-subtitle">Where your money goes</div>
        </div>
      </div>
      ${renderDonut(cats)}
    </div>
  </div>

  <!-- Stat cards row -->
  <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px">

    <div class="insight-card" style="flex-direction:column; gap:10px">
      <div style="display:flex; align-items:center; gap:10px">
        <div class="insight-ico ic-amber">${ico('fire')}</div>
        <div>
          <div class="insight-label">Highest Spend Category</div>
          <div class="insight-value">${cats[0] ? cats[0].n : '—'}</div>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text3)">
        ${cats[0] && totalExp > 0
          ? `${fmt(cats[0].v)} · ${((cats[0].v / totalExp) * 100).toFixed(0)}% of all expenses`
          : 'No expense data'}
      </div>
    </div>

    <div class="insight-card" style="flex-direction:column; gap:10px">
      <div style="display:flex; align-items:center; gap:10px">
        <div class="insight-ico ic-teal">${ico('bar')}</div>
        <div>
          <div class="insight-label">Avg Monthly Expense</div>
          <div class="insight-value">${fmt(avgExp)}</div>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text3)">
        Across ${monthly.length} recorded month${monthly.length !== 1 ? 's' : ''}
      </div>
    </div>

    <div class="insight-card" style="flex-direction:column; gap:10px">
      <div style="display:flex; align-items:center; gap:10px">
        <div class="insight-ico ic-purple">${ico('zap')}</div>
        <div>
          <div class="insight-label">Month-over-Month</div>
          <div class="insight-value" style="font-size:13px">
            ${momText.split(' ').slice(0, 3).join(' ')}
          </div>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text3)">${momText}</div>
    </div>

  </div>

  <!-- Category bar chart -->
  <div class="chart-card">
    <div class="card-header">
      <div>
        <div class="card-title">Category Breakdown</div>
        <div class="card-subtitle">All expense categories ranked by spend</div>
      </div>
    </div>

    ${cats.length === 0
      ? `<div class="empty-state">
           ${ico('bar', 36)}
           <div class="empty-title">No expense data</div>
         </div>`
      : cats.map(c => {
          const pct = totalExp > 0 ? (c.v / totalExp * 100) : 0;
          return `
          <div class="cat-bar-row">
            <div class="cat-bar-header">
              <div class="cat-bar-left">
                <div class="cat-bar-swatch" style="background:${CAT_PALETTE[c.n] || '#64748b'}"></div>
                ${esc(c.n)}
              </div>
              <div class="cat-bar-val">${fmt(c.v)} · ${pct.toFixed(0)}%</div>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill"
                style="width:${pct.toFixed(1)}%; background:${CAT_PALETTE[c.n] || '#64748b'}">
              </div>
            </div>
          </div>`;
        }).join('')
    }
  </div>`;
}
