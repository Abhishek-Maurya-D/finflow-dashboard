/**
 * app.js
 * ─────────────────────────────────────────────────────────────
 * Application bootstrap — runs after every other script loads.
 * Keeps init logic in one place so it's easy to find.
 *
 * Depends on: ALL other JS files (loaded before this in index.html)
 */

'use strict';

/**
 * initialise
 * Called once when the page loads. Sets up the static parts of
 * the UI that don't depend on page navigation.
 */
function initialise() {
  // ── Date in topbar ──
  $('todayDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  });

  // ── Keyboard shortcut: Escape closes the modal ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('modal').style.display !== 'none') {
      closeModal();
    }
  });

  // ── First render ──
  render();
}

// Run on DOMContentLoaded so all elements exist
document.addEventListener('DOMContentLoaded', initialise);
