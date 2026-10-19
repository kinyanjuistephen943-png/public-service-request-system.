/**
 * track.js
 * Logic for status tracking (Pending -> In Progress -> Resolved), timeline rendering, and citizen feedback.
 */

let currentViewingRequest = null;
let selectedStarRating = 5;

document.addEventListener('DOMContentLoaded', () => {
  initTrackForm();
  checkUrlParamAndTrack();
  renderMyRequestsList();
});

// Check if query param exists: ?id=REQ-2026-1234
function checkUrlParamAndTrack() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackId = urlParams.get('id');
  if (trackId) {
    const input = document.getElementById('search-track-id');
    if (input) input.value = trackId;
    loadRequestDetails(trackId);
  }
}

// Form search listener
function initTrackForm() {
  const form = document.getElementById('tracking-search-form');
  const input = document.getElementById('search-track-id');

  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim().toUpperCase();
    if (!query) {
      window.showToast('Input Required', 'Please enter a Tracking ID.', 'error');
      return;
    }
    loadRequestDetails(query);
  });
}

// Load and render request
function loadRequestDetails(id) {
  const cleanId = String(id).trim().toUpperCase();
  const req = window.StorageService.getRequestById(cleanId);

  const resultContainer = document.getElementById('track-results-container');
  const emptyContainer = document.getElementById('track-empty-state');
  const notFoundContainer = document.getElementById('track-not-found-state');

  if (!req) {
    currentViewingRequest = null;
    if (resultContainer) resultContainer.style.display = 'none';
    if (emptyContainer) emptyContainer.style.display = 'none';
    if (notFoundContainer) {
      document.getElementById('not-found-id-label').textContent = cleanId;
      notFoundContainer.style.display = 'block';
    }
    window.showToast('Not Found', `No request found matching ID: ${cleanId}`, 'error');
    return;
  }

  currentViewingRequest = req;
  if (notFoundContainer) notFoundContainer.style.display = 'none';
  if (emptyContainer) emptyContainer.style.display = 'none';
  if (resultContainer) resultContainer.style.display = 'block';

  renderRequestOverview(req);
  renderStepper(req.status);
  renderTimeline(req.timeline || []);
  renderFeedbackSection(req);
}

// Render Overview card details
function renderRequestOverview(req) {
  document.getElementById('res-tracking-id').textContent = req.id;
  document.getElementById('res-category').textContent = req.category;
  document.getElementById('res-location').textContent = req.location;
  document.getElementById('res-description').textContent = req.description;
  
  const createdDate = new Date(req.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  document.getElementById('res-date').textContent = createdDate;

  // Status Badge
  const statusBadge = document.getElementById('res-status-badge');
  let statusClass = 'badge-pending';
  if (req.status === 'In Progress') statusClass = 'badge-progress';
  if (req.status === 'Resolved') statusClass = 'badge-resolved';
  if (req.status === 'Rejected') statusClass = 'badge-rejected';

  statusBadge.className = `badge ${statusClass}`;
  statusBadge.innerHTML = `<span class="badge-dot"></span> ${req.status}`;

  // Priority Badge
  const priorityBadge = document.getElementById('res-priority-badge');
  let prioClass = 'badge-medium';
  if (req.priority === 'Urgent') prioClass = 'badge-urgent';
  if (req.priority === 'High') prioClass = 'badge-high';
  if (req.priority === 'Low') prioClass = 'badge-low';
  priorityBadge.className = `badge ${prioClass}`;
  priorityBadge.textContent = req.priority + ' Priority';

  // Photo attachment
  const photoContainer = document.getElementById('res-photo-section');
  const photoImg = document.getElementById('res-photo-img');
  if (req.image) {
    photoImg.src = req.image;
    photoContainer.style.display = 'block';
  } else {
    photoContainer.style.display = 'none';
  }

  // Admin remarks notice
  const adminRemarksBox = document.getElementById('res-admin-remarks');
  const adminRemarksText = document.getElementById('res-admin-notes');
  if (req.adminNotes && req.adminNotes.trim()) {
    adminRemarksText.textContent = req.adminNotes;
    adminRemarksBox.style.display = 'block';
  } else {
    adminRemarksBox.style.display = 'none';
  }
}

// Render 3-step progress bar
function renderStepper(status) {
  const step1 = document.getElementById('step-pending');
  const step2 = document.getElementById('step-progress');
  const step3 = document.getElementById('step-resolved');

  // Reset classes
  [step1, step2, step3].forEach(step => {
    step.classList.remove('completed', 'current');
  });

  if (status === 'Pending') {
    step1.classList.add('current');
  } else if (status === 'In Progress') {
    step1.classList.add('completed');
    step2.classList.add('current');
  } else if (status === 'Resolved') {
    step1.classList.add('completed');
    step2.classList.add('completed');
    step3.classList.add('completed');
  } else if (status === 'Rejected') {
    step1.classList.add('completed');
    // Step indicator can show rejected label
    const title = step2.querySelector('.stepper-title');
    if (title) title.textContent = 'Closed / Rejected';
  }
}

// Render Timeline Stream
function renderTimeline(timeline) {
  const container = document.getElementById('timeline-points-list');
  container.innerHTML = '';

  if (!timeline || timeline.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No activity recorded yet.</p>';
    return;
  }

  timeline.forEach((item, index) => {
    let pointClass = 'pending';
    if (item.status === 'In Progress') pointClass = 'in-progress';
    if (item.status === 'Resolved') pointClass = 'resolved';

    const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const el = document.createElement('div');
    el.className = `timeline-point ${pointClass}`;
    el.innerHTML = `
      <div class="timeline-marker"></div>
      <div class="timeline-card">
        <div class="timeline-card-header">
          <span class="timeline-card-title">${item.status}</span>
          <span class="timeline-card-date">${dateStr}</span>
        </div>
        <div class="timeline-card-note">${item.note || 'Status updated by municipal officer.'}</div>
      </div>
    `;
    container.appendChild(el);
  });
}

// Render Citizen Feedback
function renderFeedbackSection(req) {
  const feedbackSection = document.getElementById('feedback-card');
  if (!feedbackSection) return;

  // Show feedback only if status is Resolved
  if (req.status !== 'Resolved') {
    feedbackSection.style.display = 'none';
    return;
  }

  feedbackSection.style.display = 'block';

  const formBox = document.getElementById('feedback-form-box');
  const submittedBox = document.getElementById('feedback-submitted-box');

  if (req.feedback) {
    formBox.style.display = 'none';
    submittedBox.style.display = 'block';

    let starsDisplay = '★'.repeat(req.feedback.rating) + '☆'.repeat(5 - req.feedback.rating);
    document.getElementById('submitted-stars').textContent = starsDisplay;
    document.getElementById('submitted-comment').textContent = req.feedback.comment || 'No extra written comments.';
  } else {
    formBox.style.display = 'block';
    submittedBox.style.display = 'none';
    initStarRating();
  }
}

// Star rating interactions
function initStarRating() {
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedStarRating = parseInt(star.getAttribute('data-value'), 10);
      updateStarDisplay(selectedStarRating);
    });

    star.addEventListener('mouseenter', () => {
      const hoverVal = parseInt(star.getAttribute('data-value'), 10);
      highlightStars(hoverVal);
    });
  });

  const ratingContainer = document.querySelector('.rating-stars');
  if (ratingContainer) {
    ratingContainer.addEventListener('mouseleave', () => {
      updateStarDisplay(selectedStarRating);
    });
  }

  const feedbackForm = document.getElementById('citizen-feedback-form');
  if (feedbackForm) {
    feedbackForm.onsubmit = (e) => {
      e.preventDefault();
      if (!currentViewingRequest) return;

      const comment = document.getElementById('feedback-comment').value;
      window.StorageService.submitCitizenFeedback(currentViewingRequest.id, selectedStarRating, comment);

      window.showToast('Thank You!', 'Your feedback has been submitted to Municipal Services.', 'success');
      loadRequestDetails(currentViewingRequest.id);
    };
  }
}

function highlightStars(count) {
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach(star => {
    const val = parseInt(star.getAttribute('data-value'), 10);
    if (val <= count) {
      star.classList.add('hovered');
    } else {
      star.classList.remove('hovered');
    }
  });
}

function updateStarDisplay(count) {
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach(star => {
    const val = parseInt(star.getAttribute('data-value'), 10);
    star.classList.remove('hovered');
    if (val <= count) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });
}

// Render "My Requests" list if user is logged in
function renderMyRequestsList() {
  const section = document.getElementById('my-requests-section');
  const tbody = document.getElementById('my-requests-tbody');
  const emptyState = document.getElementById('my-requests-empty');

  if (!section || !tbody) return;

  const currentUser = window.StorageService ? window.StorageService.getCurrentUser() : null;
  if (!currentUser) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  const userRequests = window.StorageService.getRequestsByUser(currentUser.id);

  if (userRequests.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  tbody.innerHTML = '';

  userRequests.forEach(r => {
    const tr = document.createElement('tr');

    let badgeClass = 'badge-pending';
    if (r.status === 'In Progress') badgeClass = 'badge-progress';
    if (r.status === 'Resolved') badgeClass = 'badge-resolved';
    if (r.status === 'Rejected') badgeClass = 'badge-rejected';

    const dateStr = new Date(r.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    tr.innerHTML = `
      <td><strong>${r.id}</strong></td>
      <td>${r.category}</td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.location}</td>
      <td>${dateStr}</td>
      <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${r.status}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="loadRequestDetails('${r.id}')">
          View Progress &rarr;
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Expose globally for table row view buttons
window.loadRequestDetails = loadRequestDetails;
