/**
 * common.js
 * Shared layout behaviors: header navigation state, session display, mobile toggle, toasts, modals
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderSession();
  initMobileMenu();
  highlightActiveNavLink();
});

// Toast Notification Manager
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"/></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const closeToast = () => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', closeToast);
  setTimeout(closeToast, 4500);
}

// Update Header session elements based on logged in user
function initHeaderSession() {
  const authContainer = document.getElementById('header-auth-section');
  if (!authContainer) return;

  const currentUser = window.StorageService ? window.StorageService.getCurrentUser() : null;

  if (currentUser) {
    const initials = currentUser.fullName
      ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    const roleBadgeClass = currentUser.role === 'admin' ? 'role-tag-admin' : 'role-tag-citizen';
    const roleLabel = currentUser.role === 'admin' ? 'Admin Officer' : 'Citizen';

    authContainer.innerHTML = `
      <div class="user-profile-badge" title="${currentUser.email}">
        <span class="user-avatar-mini">${initials}</span>
        <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentUser.fullName}</span>
        <span class="user-role-tag ${roleBadgeClass}">${roleLabel}</span>
      </div>
      <button id="logout-btn" class="btn btn-outline btn-sm" title="Sign out of account">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Logout
      </button>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      window.StorageService.logoutUser();
      showToast('Logged Out', 'You have been safely signed out.', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    });
  } else {
    authContainer.innerHTML = `
      <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

// Mobile Hamburger Toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');
  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      mainNav.classList.toggle('show');
    });
  }
}

// Highlight Current Page Nav Link
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Global modal background click close
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// Expose helpers
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
