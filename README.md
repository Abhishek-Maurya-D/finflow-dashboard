# FinFlow — Finance Dashboard

A clean, responsive finance dashboard for tracking income, expenses and spending patterns. Built with vanilla HTML, CSS and JavaScript — no build tools, no package manager, no dependencies.

**🔗 Live Demo → [https://abhishek-maurya-d.github.io/finflow-dashboard/](https://abhishek-maurya-d.github.io/finflow-dashboard/)**

---

## Quick Start

```
1. Download or clone the project folder
2. Open index.html in any modern browser
3. Done — everything works immediately
```

No `npm install`, no server, no `.env` file. Just open the file.

---

## File Structure

```
finflow/
│
├── index.html              ← Entry point. Links all CSS and JS. Contains
│                             the HTML shell (sidebar, topbar, modal).
│
├── css/
│   ├── tokens.css          ← CSS custom properties (colours, shadows, fonts).
│   │                         Edit this file to retheme the whole app.
│   ├── base.css            ← CSS reset + raw element defaults (body, button, a).
│   ├── layout.css          ← Structural layout: sidebar, topbar, main column.
│   │                         Also contains all responsive breakpoints.
│   ├── components.css      ← Reusable UI pieces: cards, badges, table, modal,
│   │                         toast, form elements, pagination, buttons.
│   └── pages.css           ← Page-specific styles for Overview, Transactions
│                             and Insights. Also responsive overrides per page.
│
└── js/
    ├── data.js             ← Seed transactions (18 mock records) + CAT_PALETTE
    │                         colour map. Static — never changes at runtime.
    ├── state.js            ← Single S{} state object. localStorage persistence.
    │                         Derived data helpers: getTotals, getFiltered, etc.
    ├── utils.js            ← Pure helpers: fmt(), fmtDate(), esc(), ico().
    │                         No DOM access, easily unit-testable.
    ├── charts.js           ← SVG chart renderers: renderAreaChart, renderDonut.
    │                         Return HTML strings — no DOM side effects.
    ├── pages.js            ← HTML builders for each page (Overview, Transactions,
    │                         Insights). render() is the single update entry point.
    ├── ui.js               ← All event handlers: goPage, setRole, toggleTheme,
    │                         doSearch, doFilter, doSort, openAdd, openEdit,
    │                         submitForm, doDelete, exportCSV, toast, sidebar.
    └── app.js              ← Bootstrap: sets the date, attaches Escape handler,
                              calls render() for the first time.
```

### Why this order?

Scripts in `index.html` must load in this sequence because each file depends on the ones above it:

```
data.js   →  provides SEED + CAT_PALETTE
state.js  →  uses SEED; creates S{} and derived-data helpers (fmtShort needed by getMonthlyData)
utils.js  →  provides fmt, fmtDate, fmtShort, esc, ico, $
charts.js →  uses fmt, esc, ico, CAT_PALETTE
pages.js  →  uses everything above + state helpers
ui.js     →  uses pages.js (render), state (S), utils (toast, $)
app.js    →  calls render() to boot the app — must be last
```

---

## Features

### 1. Dashboard Overview
- **Net Balance, Total Income, Total Expenses** — three summary cards with coloured accent lines and hover lift effect
- **Cash Flow Trend** — area chart showing monthly income vs expenses over time (pure SVG, no library)
- **Spending by Category** — donut chart with legend (pure SVG, no library)
- **Insights strip** — four quick-stat cards: top category, this month's surplus/deficit, savings rate, spend ratio

### 2. Transactions
- Full table: Date, Note, Category, Amount, Type
- **Live search** — filter by category name, note text, or amount as you type
- **Type filter** — All / Income / Expense dropdown
- **Column sort** — click Date or Amount header to sort asc/desc (toggle)
- **Pagination** — 10 rows per page with prev/next controls

### 3. Role-Based UI
- **Admin** — sees Add Transaction button, Edit and Delete row actions
- **Viewer** — sees "View only" badge instead; all mutation controls are hidden
- Switch roles instantly with the toggle in the sidebar — no page reload

### 4. Insights Page
- Monthly cash flow chart
- Category donut chart
- Highest spending category card
- Average monthly expense card
- Month-over-month change card
- Ranked category bar chart with percentage fills

### 5. State Management
- Single `S` object is the one source of truth
- All UI is derived from state — nothing is stored in the DOM
- Pattern: **action → mutate S → call render() → UI updates**
- `localStorage` persists transactions across page reloads

### 6. UI / UX
- Clean two-column layout with persistent sidebar
- Fully responsive — mobile, tablet, desktop
- Empty state messages in charts and table
- Dark mode toggle (top right corner)
- Smooth page transitions (CSS animation)
- Toast notifications for every action
- Modal form with inline validation
- Keyboard shortcut: `Esc` closes the modal

### Optional Enhancements (all included)
- ✅ Dark mode
- ✅ LocalStorage persistence
- ✅ CSV export (unfiltered, all transactions)
- ✅ Animations (page fade, modal slide, toasts)
- ✅ Month-over-month comparison on Insights page

---

## How Each File Connects

```
index.html
  │
  ├── loads css/tokens.css    → defines --accent, --green, etc.
  ├── loads css/base.css      → resets <body>, <button>, etc.
  ├── loads css/layout.css    → .sidebar, .topbar, .main, .page
  ├── loads css/components.css→ .badge, .modal, .toast, .txn-table, etc.
  ├── loads css/pages.css     → .summary-row, .charts-row, .insights-row, etc.
  │
  ├── loads js/data.js        → SEED[], CAT_PALETTE{}
  ├── loads js/state.js       → S{}, persist(), getTotals(), getFiltered(),
  │                             getMonthlyData(), getCatData()
  ├── loads js/utils.js       → $(), fmt(), fmtDate(), fmtShort(), esc(), ico()
  ├── loads js/charts.js      → renderAreaChart(), renderDonut()
  ├── loads js/pages.js       → render(), buildOverview(), buildTransactions(),
  │                             buildInsightsPage()
  ├── loads js/ui.js          → goPage(), setRole(), toggleTheme(), doSearch(),
  │                             doFilter(), doSort(), doPage(), openAdd(),
  │                             openEdit(), closeModal(), submitForm(),
  │                             doDelete(), exportCSV(), toast(),
  │                             toggleSidebar(), closeSidebar()
  └── loads js/app.js         → initialise() → render()  ← boots the app
```

**HTML calls JS:** Every `onclick="..."` attribute in `index.html` calls a function defined in `ui.js`. The modal buttons call `openAdd()`, `openEdit()`, `closeModal()`, `submitForm()`. Nav links call `goPage()`. Role buttons call `setRole()`.

**JS writes HTML:** `render()` in `pages.js` writes a full HTML string into `#pageContent`. It never touches any other DOM element. Charts and tables are rebuilt from scratch on every state change — fast enough for this data size, and much simpler than diffing.

---

## Customising

### Change colours
Edit `css/tokens.css`. All colours are CSS custom properties. Change `--accent` and everything using it updates automatically.

### Add a category
1. In `js/data.js`, add the name to `CAT_PALETTE` with a hex colour.
2. In `index.html`, add an `<option>` inside the `#fc` select in the modal.

### Add a new page
1. Add a `nav-link` in `index.html` with `data-page="yourpage"`.
2. Add `'yourpage': 'Your Page Title'` to `PAGE_TITLES` in `ui.js`.
3. Add a `case 'yourpage': container.innerHTML = buildYourPage(); break;` in `render()` in `pages.js`.
4. Write `function buildYourPage() { return \`...\`; }` in `pages.js`.

### Change rows per page
Edit `const PER_PAGE = 10;` at the top of `js/pages.js`.

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Edge, Safari). No polyfills needed for the features used (CSS custom properties, Intl.NumberFormat, localStorage, Blob/URL.createObjectURL).

---

## Design Decisions

| Decision | Reason |
|---|---|
| No framework (React, Vue, etc.) | Zero build step — open the file and it works |
| No chart library | Removes a large dependency; SVG math is manageable for 2 chart types |
| Single `S{}` state object | Easy to reason about — one place to look for all app data |
| HTML string builders (not DOM API) | Simpler code; render() is just "write a string" |
| CSS custom properties | Dark mode is free once tokens are defined |
| DM Sans + DM Mono | Clean, professional, legible at small sizes |
