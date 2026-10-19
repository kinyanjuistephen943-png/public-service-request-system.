/**
 * storage.js
 * Centralized Data Management Layer using LocalStorage for PSRS
 * Note: Starts strictly with clean state (NO TEST DATA PRE-SEEDED)
 */

const STORAGE_KEYS = {
  USERS: 'psrs_users',
  REQUESTS: 'psrs_requests',
  CURRENT_USER: 'psrs_current_user'
};

const StorageService = {
  // ================= USERS & AUTH =================
  getUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse users:', e);
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  findUser(identifier) {
    const users = this.getUsers();
    const cleanId = String(identifier).trim().toLowerCase();
    return users.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.nationalId && u.nationalId.toLowerCase() === cleanId)
    );
  },

  registerUser({ fullName, nationalId, email, phone, password, role = 'citizen' }) {
    const users = this.getUsers();
    const existing = this.findUser(email) || (nationalId ? this.findUser(nationalId) : null);
    
    if (existing) {
      return { success: false, message: 'A user with this Email or Citizen ID already exists.' };
    }

    const newUser = {
      id: 'USR-' + Date.now(),
      fullName: fullName.trim(),
      nationalId: nationalId ? nationalId.trim() : '',
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      password: password, // In production, this would be hashed on a secure backend
      role: role.toLowerCase() === 'admin' ? 'admin' : 'citizen',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  },

  loginUser(identifier, password) {
    const user = this.findUser(identifier);
    if (!user) {
      return { success: false, message: 'Account not found. Please register first.' };
    }
    if (user.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Set current active session (excluding password)
    const sessionUser = { ...user };
    delete sessionUser.password;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // ================= SERVICE REQUESTS =================
  getRequests() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      // Strictly NO pre-seeded test data: returns empty array if not created by user
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse requests:', e);
      return [];
    }
  },

  saveRequests(requests) {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  },

  generateTrackingId() {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `REQ-${year}-${randomDigits}`;
  },

  addRequest({ category, location, description, image = null, priority = 'Medium', citizenName = '', citizenContact = '', citizenId = '' }) {
    const requests = this.getRequests();
    const currentUser = this.getCurrentUser();

    // Generate unique ID ensuring no collision
    let trackingId = this.generateTrackingId();
    while (requests.some(r => r.id === trackingId)) {
      trackingId = this.generateTrackingId();
    }

    const newRequest = {
      id: trackingId,
      category,
      location: location.trim(),
      description: description.trim(),
      image, // Base64 data URL or null
      priority, // Low, Medium, High, Urgent
      status: 'Pending', // Pending -> In Progress -> Resolved (or Rejected)
      citizen: {
        id: citizenId || (currentUser ? currentUser.id : 'ANON-' + Date.now()),
        name: citizenName.trim() || (currentUser ? currentUser.fullName : 'Anonymous Citizen'),
        email: currentUser ? currentUser.email : '',
        phone: citizenContact.trim() || (currentUser ? currentUser.phone : '')
      },
      timeline: [
        {
          status: 'Pending',
          timestamp: new Date().toISOString(),
          note: 'Service request submitted successfully by citizen.'
        }
      ],
      adminNotes: '',
      feedback: null, // { rating: 1-5, comment: string, submittedAt: string }
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    requests.unshift(newRequest); // most recent first
    this.saveRequests(requests);
    return newRequest;
  },

  getRequestById(id) {
    const requests = this.getRequests();
    const cleanId = String(id).trim().toUpperCase();
    return requests.find(r => r.id.toUpperCase() === cleanId) || null;
  },

  getRequestsByUser(userId) {
    const requests = this.getRequests();
    return requests.filter(r => r.citizen && r.citizen.id === userId);
  },

  updateRequestStatus(id, newStatus, adminNotes = '') {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id.toUpperCase() === String(id).trim().toUpperCase());

    if (index === -1) {
      return { success: false, message: 'Request not found.' };
    }

    const currentReq = requests[index];
    const prevStatus = currentReq.status;
    currentReq.status = newStatus;
    currentReq.updatedAt = new Date().toISOString();
    
    if (adminNotes && adminNotes.trim()) {
      currentReq.adminNotes = adminNotes.trim();
    }

    // Append to timeline log
    currentReq.timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: adminNotes && adminNotes.trim() ? adminNotes.trim() : `Status transitioned from ${prevStatus} to ${newStatus}.`
    });

    requests[index] = currentReq;
    this.saveRequests(requests);
    return { success: true, request: currentReq };
  },

  submitCitizenFeedback(id, rating, comment = '') {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id.toUpperCase() === String(id).trim().toUpperCase());

    if (index === -1) {
      return { success: false, message: 'Request not found.' };
    }

    requests[index].feedback = {
      rating: Number(rating),
      comment: comment.trim(),
      submittedAt: new Date().toISOString()
    };

    this.saveRequests(requests);
    return { success: true, request: requests[index] };
  },

  // ================= ANALYTICS =================
  getAnalytics() {
    const requests = this.getRequests();
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'Pending').length;
    const inProgress = requests.filter(r => r.status === 'In Progress').length;
    const resolved = requests.filter(r => r.status === 'Resolved').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;
    
    const openCases = pending + inProgress;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Breakdown by category
    const categoryCounts = {};
    requests.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });

    // Breakdown by priority
    const priorityCounts = { Urgent: 0, High: 0, Medium: 0, Low: 0 };
    requests.forEach(r => {
      if (priorityCounts[r.priority] !== undefined) {
        priorityCounts[r.priority]++;
      }
    });

    return {
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      openCases,
      resolutionRate,
      categoryCounts,
      priorityCounts
    };
  }
};

// Export to window
window.StorageService = StorageService;
