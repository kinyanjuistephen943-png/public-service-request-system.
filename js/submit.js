/**
 * submit.js
 * Handles citizen request submission, image attachments, geolocation autofill, and confirmation receipt.
 */

let uploadedImageData = null;
let currentCreatedRequestId = null;

document.addEventListener('DOMContentLoaded', () => {
  prefillFromSessionAndUrl();
  initImageUpload();
  initGeoLocation();
  initSubmitForm();
  initConfirmationModalActions();
});

// Prefill form from current session & query params
function prefillFromSessionAndUrl() {
  // Check category query param
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    const categorySelect = document.getElementById('request-category');
    if (categorySelect) {
      // Find matching option
      for (let option of categorySelect.options) {
        if (option.value.toLowerCase() === catParam.toLowerCase()) {
          option.selected = true;
          break;
        }
      }
    }
  }

  // Prefill citizen details if logged in
  if (window.StorageService) {
    const user = window.StorageService.getCurrentUser();
    if (user) {
      const nameField = document.getElementById('citizen-name');
      const contactField = document.getElementById('citizen-contact');
      if (nameField) nameField.value = user.fullName || '';
      if (contactField) contactField.value = user.phone || user.email || '';
    }
  }
}

// Handle Image Upload & Base64 preview
function initImageUpload() {
  const fileInput = document.getElementById('request-image');
  const previewBox = document.getElementById('image-preview-container');
  const previewImg = document.getElementById('image-preview');
  const removeBtn = document.getElementById('btn-remove-image');
  const uploadPrompt = document.getElementById('upload-prompt-text');

  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 4MB for localStorage comfort)
    if (file.size > 4 * 1024 * 1024) {
      window.showToast('File Too Large', 'Please upload an image smaller than 4MB.', 'error');
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedImageData = event.target.result;
      previewImg.src = uploadedImageData;
      previewBox.style.display = 'block';
      if (uploadPrompt) uploadPrompt.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      uploadedImageData = null;
      fileInput.value = '';
      previewImg.src = '';
      previewBox.style.display = 'none';
      if (uploadPrompt) uploadPrompt.style.display = 'block';
    });
  }
}

// Geolocation autofill
function initGeoLocation() {
  const locateBtn = document.getElementById('btn-get-location');
  const locationInput = document.getElementById('request-location');

  if (!locateBtn || !locationInput) return;

  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      window.showToast('Geolocation Unsupported', 'Your browser does not support automatic location detection.', 'info');
      return;
    }

    locateBtn.disabled = true;
    locateBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="spinner" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="30" stroke-linecap="round"></circle>
      </svg> Locating...
    `;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        locationInput.value = `GPS: ${lat}, ${lng} (Near Municipal Zone)`;
        locateBtn.disabled = false;
        locateBtn.innerHTML = `&#10003; Located`;
        window.showToast('Location Detected', 'Coordinates filled. You may add landmark details.', 'success');
      },
      (err) => {
        locateBtn.disabled = false;
        locateBtn.innerHTML = `Use GPS`;
        window.showToast('Location Unavailable', 'Could not access GPS. Please type the street or landmark name.', 'info');
      },
      { timeout: 7000 }
    );
  });
}

// Handle Form Submission
function initSubmitForm() {
  const form = document.getElementById('service-request-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const category = document.getElementById('request-category').value;
    const location = document.getElementById('request-location').value.trim();
    const priority = document.getElementById('request-priority').value;
    const description = document.getElementById('request-description').value.trim();
    const citizenName = document.getElementById('citizen-name').value.trim();
    const citizenContact = document.getElementById('citizen-contact').value.trim();

    if (!category) {
      window.showToast('Validation Error', 'Please select a service category.', 'error');
      return;
    }

    if (!location) {
      window.showToast('Validation Error', 'Please specify the incident location/address.', 'error');
      return;
    }

    if (!description || description.length < 10) {
      window.showToast('Validation Error', 'Please write a descriptive explanation (minimum 10 characters).', 'error');
      return;
    }

    // Submit to Storage Service
    const created = window.StorageService.addRequest({
      category,
      location,
      priority,
      description,
      image: uploadedImageData,
      citizenName,
      citizenContact
    });

    currentCreatedRequestId = created.id;

    // Reset Form
    form.reset();
    uploadedImageData = null;
    const previewBox = document.getElementById('image-preview-container');
    if (previewBox) previewBox.style.display = 'none';

    // Show Confirmation Modal
    document.getElementById('modal-tracking-id').textContent = created.id;
    window.openModal('modal-submission-success');

    window.showToast('Request Submitted!', `Your tracking code is ${created.id}`, 'success');
  });
}

// Setup Modal Actions (Copy, Track, Print)
function initConfirmationModalActions() {
  const copyBtn = document.getElementById('btn-copy-tracking-id');
  const trackBtn = document.getElementById('btn-goto-tracking');
  const printBtn = document.getElementById('btn-print-receipt');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const idText = document.getElementById('modal-tracking-id').textContent;
      navigator.clipboard.writeText(idText).then(() => {
        window.showToast('Copied to Clipboard', `Tracking code ${idText} copied!`, 'success');
      });
    });
  }

  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      if (currentCreatedRequestId) {
        window.location.href = `track.html?id=${encodeURIComponent(currentCreatedRequestId)}`;
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}
