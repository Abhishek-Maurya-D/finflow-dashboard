/**
 * ui.js
 * ─────────────────────────────────────────────────────────────
 * All user-facing event handlers.
 * Mutates state (S.*) and calls render() after each change.
 *
 * Depends on: state.js, utils.js, pages.js
 * Called by:  inline onclick="" attributes in index.html
 *             and app.js (for init)
 */

'use strict';

// ── Page navigation ──────────────────────────────────────────

const PAGE_TITLES = {
  overview:     'Dashboard Overview',
  transactions: 'Transactions',
  insights:     'Insights & Analytics',
};

/**
 * Switch to a different page.
 * Updates: S.page, active nav link, page title, closes mobile sidebar.
 *
 * @param {string} pg - 'overview' | 'transactions' | 'insights'
 */
function goPage(pg) {
  S.page    = pg;
  S.curPage = 1; // reset pagination when switching pages

  // Update active nav link highlight
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pg);
  });

  $('pageTitle').textContent = PAGE_TITLES[pg] || pg;

  closeSidebar();
  render();
}

// ── Role switching ───────────────────────────────────────────

/**
 * Switch between Admin and Viewer roles.
 * Admin → can add, edit, delete transactions.
 * Viewer → read-only, admin controls are hidden.
 *
 * @param {string} role - 'admin' | 'viewer'
 */
function setRole(role) {
  S.role = role;

  // Toggle active state on both role buttons
  $('ro-admin').classList.toggle('active',  role === 'admin');
  $('ro-viewer').classList.toggle('active', role === 'viewer');

  // Update the role pill (icon + label)
  const pill = $('role-pill');
  pill.className = 'role-pill ' + role;
  pill.innerHTML =
    ico(role === 'admin' ? 'eye' : 'lock', 11) +
    `<span id="role-pill-txt">${role === 'admin' ? 'Admin' : 'Viewer'}</span>`;

  // Only re-render if on transactions page (other pages are role-agnostic)
  if (S.page === 'transactions') render();

  toast(
    role === 'admin'
      ? 'Switched to Admin — full access enabled'
      : 'Switched to Viewer — read-only mode',
    't-warn'
  );
}

// ── Theme toggle ─────────────────────────────────────────────

/**
 * Toggle between light and dark mode.
 * Adds/removes the 'dark' class on <body>, which CSS vars pick up.
 */
function toggleTheme() {
  S.dark = !S.dark;
  document.body.classList.toggle('dark', S.dark);

  // Swap the icon
  $('themeIco').innerHTML = S.dark
    // Moon icon
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    // Sun icon
    : `<circle cx="12" cy="12" r="5"/>
       <line x1="12" y1="1" x2="12" y2="3"/>
       <line x1="12" y1="21" x2="12" y2="23"/>
       <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
       <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
       <line x1="1" y1="12" x2="3" y2="12"/>
       <line x1="21" y1="12" x2="23" y2="12"/>
       <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
       <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
}

// ── Transactions: filters, sort, pagination ──────────────────

/** Live search — fires on every keystroke */
function doSearch(value) {
  S.search  = value;
  S.curPage = 1;
  render();
}

/** Type filter dropdown change */
function doFilter(value) {
  S.filter  = value;
  S.curPage = 1;
  render();
}

/** Pagination — jump to page p */
function doPage(p) {
  S.curPage = p;
  render();
}

/**
 * Column sort — toggles asc/desc on same field, defaults to desc on new field.
 * @param {string} field - 'date' | 'amount'
 */
function doSort(field) {
  if (S.sort.field === field) {
    S.sort.dir = S.sort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    S.sort.field = field;
    S.sort.dir   = 'desc';
  }
  render();
}

// ── CSV export ───────────────────────────────────────────────

/**
 * Export all transactions (unfiltered) as a CSV file download.
 * Uses Blob + object URL — no server needed.
 */
function exportCSV() {
  const header = 'Date,Amount,Category,Type,Note';
  const rows   = S.txns.map(t =>
    `${t.date},${t.amount},${t.category},${t.type},"${(t.note || '').replace(/"/g, '""')}"`
  );

  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'finflow-transactions.csv';
  a.click();

  toast('Exported finflow-transactions.csv', 't-ok');
}

// ── Modal: Add / Edit transaction ────────────────────────────

/** Open the modal in "Add new transaction" mode. */
function openAdd() {
  S.editId = null;

  $('modalTitle').textContent = 'Add Transaction';
  $('fSubmit').textContent    = 'Add Transaction';

  // Reset form fields to sensible defaults
  $('fd').value = new Date().toISOString().split('T')[0]; // today
  $('fa').value = '';
  $('fc').value = 'Food';
  $('ft').value = 'expense';
  $('fn').value = '';

  clearFormErrors();
  $('modal').style.display = 'flex';
}

/**
 * Open the modal pre-filled with an existing transaction's data.
 * @param {number} id - transaction ID to edit
 */
function openEdit(id) {
  const tx = S.txns.find(t => t.id === id);
  if (!tx) return;

  S.editId = id;

  $('modalTitle').textContent = 'Edit Transaction';
  $('fSubmit').textContent    = 'Save Changes';

  $('fd').value = tx.date;
  $('fa').value = tx.amount;
  $('fc').value = tx.category;
  $('ft').value = tx.type;
  $('fn').value = tx.note || '';

  clearFormErrors();
  $('modal').style.display = 'flex';
}

/** Close the modal and reset edit state. */
function closeModal() {
  $('modal').style.display = 'none';
  S.editId = null;
}

/** Clear validation error messages and invalid styles. */
function clearFormErrors() {
  ['fd', 'fa'].forEach(id  => $( id).classList.remove('invalid'));
  ['fe-d', 'fe-a'].forEach(id => $(id).textContent = '');
}

/**
 * Validate the form and either add a new transaction or save edits.
 * Called by the "Add Transaction" / "Save Changes" button in the modal.
 */
function submitForm() {
  clearFormErrors();

  const date     = $('fd').value;
  const amount   = parseFloat($('fa').value);
  const category = $('fc').value;
  const type     = $('ft').value;
  const note     = $('fn').value.trim();

  // Validation
  let isValid = true;

  if (!date) {
    $('fd').classList.add('invalid');
    $('fe-d').textContent = 'Date is required';
    isValid = false;
  }

  if (!amount || amount <= 0) {
    $('fa').classList.add('invalid');
    $('fe-a').textContent = 'Enter a valid amount greater than 0';
    isValid = false;
  }

  if (!isValid) return;

  // Mutate state
  if (S.editId !== null) {
    // Edit existing
    S.txns = S.txns.map(t =>
      t.id === S.editId ? { ...t, date, amount, category, type, note } : t
    );
    toast('Transaction updated successfully', 't-ok');
  } else {
    // Add new — prepend so it appears at the top of the list
    S.txns = [{ id: Date.now(), date, amount, category, type, note }, ...S.txns];
    toast('Transaction added successfully', 't-ok');
  }

  persist();
  closeModal();
  render();
}

/**
 * Delete a transaction after confirming with the user.
 * @param {number} id - transaction ID to delete
 */
function doDelete(id) {
  if (!confirm('Delete this transaction? This cannot be undone.')) return;

  S.txns = S.txns.filter(t => t.id !== id);

  persist();
  toast('Transaction deleted', 't-del');
  render();
}

// ── Mobile sidebar ───────────────────────────────────────────

function toggleSidebar() {
  $('sidebar').classList.toggle('open');
  $('mobOverlay').classList.toggle('open');
}

function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('mobOverlay').classList.remove('open');
}

// ── Toast notifications ──────────────────────────────────────

/**
 * Show a self-dismissing toast notification.
 *
 * @param {string} msg  - message text
 * @param {string} cls  - CSS class: 't-ok' | 't-del' | 't-warn'
 */
function toast(msg, cls = 't-ok') {
  const icoMap = {
    't-ok':   'chk',
    't-del':  'warn',
    't-warn': 'info',
  };

  const div       = document.createElement('div');
  div.className   = 'toast ' + cls;
  div.innerHTML   = ico(icoMap[cls] || 'chk', 14) + `<span>${msg}</span>`;

  $('toastWrap').appendChild(div);

  // Fade out then remove
  setTimeout(() => {
    div.style.transition = 'opacity 0.3s, transform 0.3s';
    div.style.opacity    = '0';
    div.style.transform  = 'translateX(20px)';
    setTimeout(() => div.remove(), 320);
  }, 2600);
}
