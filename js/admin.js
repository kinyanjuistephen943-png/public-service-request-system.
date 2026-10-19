
let selectedRequestIdForUpdate = null;
let allLoadedRequests = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
  initFilterControls();
  initStatusUpdateModal();
  initExportCsvButton();
  initResetDataButton();
});

// Admin Authentication Check
function checkAdminAccess() {
  const guardContainer = document.getElementById('admin-guard-container');
  const dashboardContainer = document.getElementById('admin-dashboard-container');

  const currentUser = window.StorageService ? window.StorageService.getCurrentUser() : null;

  if (currentUser && currentUser.role === 'admin') {
    if (guardContainer) guardContainer.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'block';
    loadDashboardData();
  } else {
    if (guardContainer) guardContainer.style.display = 'block';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    initAdminQuickAccess();
  }
}

// Quick Access helper for demo testing
function initAdminQuickAccess() {
  const quickAdminBtn = document.getElementById('btn-quick-admin-login');
  if (quickAdminBtn) {
    quickAdminBtn.addEventListener('click', () => {
      // Create or log into local admin officer session
      const adminEmail = 'officer@ecitizen.gov.local';
      let admin = window.StorageService.findUser(adminEmail);
      if (!admin) {
        window.StorageService.registerUser({
          fullName: 'Officer John Kamau',
          nationalId: 'ADMIN-8821',
          email: adminEmail,
          phone: '+254 711 000 111',
          password: 'AdminPassword123',
          role: 'admin'
        });
      }
      window.StorageService.loginUser(adminEmail, 'AdminPassword123');
      window.showToast('Officer Authenticated', 'Logged in as Municipal Admin Officer.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  }
}

// Main Data Loader
function loadDashboardData() {
  allLoadedRequests = window.StorageService.getRequests();
  renderAnalyticsKpis();
  renderDistributionBars();
  renderRequestsTable();
}

// Render KPI Cards (Open vs Resolved, Total, Rates)
function renderAnalyticsKpis() {
  const stats = window.StorageService.getAnalytics();

  const totalEl = document.getElementById('kpi-total');
  const openEl = document.getElementById('kpi-open');
  const progressEl = document.getElementById('kpi-progress');
  const resolvedEl = document.getElementById('kpi-resolved');
  const rateEl = document.getElementById('kpi-rate');
  const pendingEl = document.getElementById('kpi-pending-sub');

  if (totalEl) totalEl.textContent = stats.total;
  if (openEl) openEl.textContent = stats.openCases;
  if (progressEl) progressEl.textContent = stats.inProgress;
  if (resolvedEl) resolvedEl.textContent = stats.resolved;
  if (rateEl) rateEl.textContent = `${stats.resolutionRate}%`;
  if (pendingEl) pendingEl.textContent = `${stats.pending} pending initial review`;
}

// Render Visual Analytics Distribution
function renderDistributionBars() {
  const stats = window.StorageService.getAnalytics();
  const total = stats.total;

  // Category Distribution
  const catContainer = document.getElementById('category-distribution-container');
  if (catContainer) {
    catContainer.innerHTML = '';

    if (total === 0) {
      catContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">No requests submitted yet to calculate category metrics.</p>';
    } else {
      const categories = Object.keys(stats.categoryCounts);
      categories.forEach(cat => {
        const count = stats.categoryCounts[cat];
        const pct = Math.round((count / total) * 100);

        const group = document.createElement('div');
        group.className = 'progress-bar-group';
        group.innerHTML = `
          <div class="progress-bar-labels">
            <span>${cat}</span>
            <span>${count} cases (${pct}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        catContainer.appendChild(group);
      });
    }
  }

  // Priority Distribution
  const prioContainer = document.getElementById('priority-distribution-container');
  if (prioContainer) {
    prioContainer.innerHTML = '';

    if (total === 0) {
      prioContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">No requests submitted yet.</p>';
    } else {
      const prios = [
        { label: 'Urgent / Critical', key: 'Urgent', color: '#dc2626' },
        { label: 'High Priority', key: 'High', color: '#ea580c' },
        { label: 'Medium Priority', key: 'Medium', color: '#16a34a' },
        { label: 'Low Priority', key: 'Low', color: '#64748b' }
      ];

      prios.forEach(p => {
        const count = stats.priorityCounts[p.key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        const group = document.createElement('div');
        group.className = 'progress-bar-group';
        group.innerHTML = `
          <div class="progress-bar-labels">
            <span>${p.label}</span>
            <span>${count} (${pct}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${p.color};"></div>
          </div>
        `;
        prioContainer.appendChild(group);
      });
    }
  }
}

// Filter and Search table
function initFilterControls() {
  const searchInput = document.getElementById('table-search-input');
  const statusFilter = document.getElementById('table-status-filter');
  const categoryFilter = document.getElementById('table-category-filter');
  const priorityFilter = document.getElementById('table-priority-filter');

  const onFilterChange = () => renderRequestsTable();

  if (searchInput) searchInput.addEventListener('input', onFilterChange);
  if (statusFilter) statusFilter.addEventListener('change', onFilterChange);
  if (categoryFilter) categoryFilter.addEventListener('change', onFilterChange);
  if (priorityFilter) priorityFilter.addEventListener('change', onFilterChange);
}

// Render Requests Table
function renderRequestsTable() {
  const tbody = document.getElementById('admin-requests-tbody');
  const emptyState = document.getElementById('table-empty-state');
  const countBadge = document.getElementById('filtered-count-badge');

  if (!tbody) return;

  const searchVal = (document.getElementById('table-search-input')?.value || '').toLowerCase().trim();
  const statusVal = document.getElementById('table-status-filter')?.value || 'ALL';
  const categoryVal = document.getElementById('table-category-filter')?.value || 'ALL';
  const priorityVal = document.getElementById('table-priority-filter')?.value || 'ALL';

  const filtered = allLoadedRequests.filter(r => {
    // Search match
    const matchSearch = !searchVal || 
      r.id.toLowerCase().includes(searchVal) ||
      r.location.toLowerCase().includes(searchVal) ||
      r.category.toLowerCase().includes(searchVal) ||
      (r.citizen && r.citizen.name.toLowerCase().includes(searchVal));

    // Status match
    const matchStatus = (statusVal === 'ALL') || (r.status === statusVal);

    // Category match
    const matchCategory = (categoryVal === 'ALL') || (r.category === categoryVal);

    // Priority match
    const matchPriority = (priorityVal === 'ALL') || (r.priority === priorityVal);

    return matchSearch && matchStatus && matchCategory && matchPriority;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} of ${allLoadedRequests.length} requests`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  tbody.innerHTML = '';

  filtered.forEach(r => {
    const tr = document.createElement('tr');

    let badgeClass = 'badge-pending';
    if (r.status === 'In Progress') badgeClass = 'badge-progress';
    if (r.status === 'Resolved') badgeClass = 'badge-resolved';
    if (r.status === 'Rejected') badgeClass = 'badge-rejected';

    let prioClass = 'badge-medium';
    if (r.priority === 'Urgent') prioClass = 'badge-urgent';
    if (r.priority === 'High') prioClass = 'badge-high';
    if (r.priority === 'Low') prioClass = 'badge-low';

    const dateStr = new Date(r.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const citizenLabel = r.citizen ? r.citizen.name : 'Citizen';

    tr.innerHTML = `
      <td>
        <strong style="font-family: monospace; font-size: 0.95rem; color: var(--primary);">${r.id}</strong>
        ${r.image ? '<span title="Has photo evidence" style="color: #0284c7; margin-left: 4px;">📷</span>' : ''}
      </td>
      <td>
        <div style="font-weight: 600; color: var(--secondary);">${r.category}</div>
        <small style="color: var(--text-muted);">${citizenLabel}</small>
      </td>
      <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.location}">
        ${r.location}
      </td>
      <td><span class="badge ${prioClass}">${r.priority}</span></td>
      <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${r.status}</span></td>
      <td><span style="font-size: 0.85rem; color: var(--text-muted);">${dateStr}</span></td>
      <td>
        <div class="table-action-btns">
          <button class="btn btn-outline btn-sm" onclick="openStatusModal('${r.id}')" title="Update incident status">
            Update
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openDetailsModal('${r.id}')" title="View details & photo">
            Inspect
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Setup Status Update Modal
function initStatusUpdateModal() {
  const form = document.getElementById('status-update-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedRequestIdForUpdate) return;

    const newStatus = document.getElementById('modal-new-status').value;
    const notes = document.getElementById('modal-status-notes').value;

    const res = window.StorageService.updateRequestStatus(selectedRequestIdForUpdate, newStatus, notes);

    if (res.success) {
      window.showToast('Status Updated', `Case ${selectedRequestIdForUpdate} marked as ${newStatus}.`, 'success');
      window.closeModal('modal-update-status');
      form.reset();
      selectedRequestIdForUpdate = null;
      loadDashboardData();
    } else {
      window.showToast('Error', res.message, 'error');
    }
  });
}

function openStatusModal(id) {
  const req = window.StorageService.getRequestById(id);
  if (!req) return;

  selectedRequestIdForUpdate = id;
  document.getElementById('modal-update-req-id').textContent = req.id;
  document.getElementById('modal-new-status').value = req.status;
  document.getElementById('modal-status-notes').value = '';

  window.openModal('modal-update-status');
}

// Setup View Details Modal
function openDetailsModal(id) {
  const req = window.StorageService.getRequestById(id);
  if (!req) return;

  document.getElementById('view-req-id').textContent = req.id;
  document.getElementById('view-category').textContent = req.category;
  document.getElementById('view-priority').textContent = req.priority;
  document.getElementById('view-status').textContent = req.status;
  document.getElementById('view-location').textContent = req.location;
  document.getElementById('view-description').textContent = req.description;
  document.getElementById('view-reporter').textContent = `${req.citizen.name} (${req.citizen.phone || req.citizen.email || 'No contact provided'})`;

  // Image section
  const imgBox = document.getElementById('view-image-container');
  const imgEl = document.getElementById('view-image-el');
  if (req.image) {
    imgEl.src = req.image;
    imgBox.style.display = 'block';
  } else {
    imgBox.style.display = 'none';
  }

  // Citizen Feedback section
  const feedbackBox = document.getElementById('view-feedback-box');
  if (req.feedback) {
    feedbackBox.style.display = 'block';
    document.getElementById('view-feedback-rating').textContent = '★'.repeat(req.feedback.rating) + '☆'.repeat(5 - req.feedback.rating);
    document.getElementById('view-feedback-comment').textContent = req.feedback.comment || 'No text comments.';
  } else {
    feedbackBox.style.display = 'none';
  }

  window.openModal('modal-view-details');
}

// Export Requests to CSV (Bonus Feature)
function initExportCsvButton() {
  const exportBtn = document.getElementById('btn-export-csv');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const requests = window.StorageService.getRequests();

    if (requests.length === 0) {
      window.showToast('No Data', 'There are no service requests available to export.', 'info');
      return;
    }

    // Generate CSV Header
    let csv = 'Tracking ID,Category,Location,Priority,Status,Citizen Name,Contact,Created Date,Admin Remarks\n';

    requests.forEach(r => {
      const cleanLocation = `"${(r.location || '').replace(/"/g, '""')}"`;
      const cleanRemarks = `"${(r.adminNotes || '').replace(/"/g, '""')}"`;
      const cleanCitizen = `"${(r.citizen?.name || '').replace(/"/g, '""')}"`;
      const contact = `"${(r.citizen?.phone || r.citizen?.email || '').replace(/"/g, '""')}"`;

      csv += `${r.id},"${r.category}",${cleanLocation},${r.priority},${r.status},${cleanCitizen},${contact},${r.createdAt},${cleanRemarks}\n`;
    });

    // Create Download Link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `public_service_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.showToast('Export Complete', 'Downloaded service requests report as CSV.', 'success');
  });
}

// Reset / Clear Data helper (Ensures testing from clean state)
function initResetDataButton() {
  const resetBtn = document.getElementById('btn-reset-data');
  if (!resetBtn) return;

  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all requests and restore the portal to an empty state? This action cannot be undone.')) {
      localStorage.removeItem('psrs_requests');
      window.showToast('Data Cleared', 'System restored to clean empty state (zero test data).', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  });
}

// Expose modal helpers
window.openStatusModal = openStatusModal;
window.openDetailsModal = openDetailsModal;
