/**
 * home.js
 * Landing page logic: Live stats counter & quick tracking search
 */

document.addEventListener('DOMContentLoaded', () => {
  renderHomeStats();
  initQuickTracker();
});

// Render dynamic public counts
function renderHomeStats() {
  if (!window.StorageService) return;

  const stats = window.StorageService.getAnalytics();

  const totalEl = document.getElementById('stat-total-count');
  const pendingEl = document.getElementById('stat-pending-count');
  const progressEl = document.getElementById('stat-progress-count');
  const resolvedEl = document.getElementById('stat-resolved-count');

  if (totalEl) totalEl.textContent = stats.total;
  if (pendingEl) pendingEl.textContent = stats.pending;
  if (progressEl) progressEl.textContent = stats.inProgress;
  if (resolvedEl) resolvedEl.textContent = stats.resolved;
}

// Quick tracker form handler
function initQuickTracker() {
  const form = document.getElementById('quick-track-form');
  const input = document.getElementById('quick-track-id');

  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim().toUpperCase();

    if (!query) {
      if (window.showToast) {
        window.showToast('Input Required', 'Please enter a valid Tracking ID (e.g., REQ-2026-1042)', 'error');
      } else {
        alert('Please enter a Tracking ID');
      }
      input.focus();
      return;
    }

    // Direct user to track page with query param
    window.location.href = `track.html?id=${encodeURIComponent(query)}`;
  });
}
