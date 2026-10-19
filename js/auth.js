/**
 * auth.js
 * Handles citizen & officer registration, login, role-based redirection, and validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initRoleSelector();
  initRegisterForm();
  initLoginForm();
});

// Switch visual styling for role radios
function initRoleSelector() {
  const roleLabels = document.querySelectorAll('.role-radio-label');
  roleLabels.forEach(label => {
    const radio = label.querySelector('input[type="radio"]');
    if (!radio) return;

    if (radio.checked) {
      label.classList.add('active');
    }

    radio.addEventListener('change', () => {
      roleLabels.forEach(l => l.classList.remove('active'));
      if (radio.checked) {
        label.classList.add('active');
      }
    });
  });
}

// Handle Registration
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('reg-fullname').value.trim();
    const nationalId = document.getElementById('reg-nationalid').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    const roleRadio = document.querySelector('input[name="userRole"]:checked');
    const role = roleRadio ? roleRadio.value : 'citizen';

    // Basic Validations
    if (!fullName || !email || !password) {
      window.showToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    if (password.length < 6) {
      window.showToast('Validation Error', 'Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      window.showToast('Validation Error', 'Passwords do not match.', 'error');
      return;
    }

    const result = window.StorageService.registerUser({
      fullName,
      nationalId,
      email,
      phone,
      password,
      role
    });

    if (!result.success) {
      window.showToast('Registration Failed', result.message, 'error');
      return;
    }

    window.showToast('Account Created!', `Welcome, ${fullName}. Redirecting to sign in...`, 'success');

    // Auto login
    window.StorageService.loginUser(email, password);

    setTimeout(() => {
      if (role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'submit-request.html';
      }
    }, 1000);
  });
}

// Handle Login
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const identifier = document.getElementById('login-id').value.trim();
    const password = document.getElementById('login-password').value;

    if (!identifier || !password) {
      window.showToast('Validation Error', 'Please enter your Email/Citizen ID and Password.', 'error');
      return;
    }

    const result = window.StorageService.loginUser(identifier, password);

    if (!result.success) {
      window.showToast('Sign In Failed', result.message, 'error');
      return;
    }

    const user = result.user;
    window.showToast('Signed In', `Welcome back, ${user.fullName}!`, 'success');

    setTimeout(() => {
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        // Check if there was a previous redirect intended
        const params = new URLSearchParams(window.location.search);
        const nextUrl = params.get('redirect') || 'track.html';
        window.location.href = nextUrl;
      }
    }, 800);
  });
}
