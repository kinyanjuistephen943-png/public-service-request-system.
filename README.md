# Public Service Request System (Mini eCitizen-Style)

An official, transparent civic issue reporting and municipal dispatch management portal inspired by government digital services (eCitizen).

Built with clean, standard-compliant **HTML5**, **Vanilla CSS**, and **Modern JavaScript (ES6+)** with complete separation of page logic and presentation styles.

---

## 🌟 Key Features & Requirements Matrix

| Requirement | Implementation Details | Status |
| :--- | :--- | :--- |
| **Citizen Registration & Login** | Secure local authentication supporting both **Citizen** and **Admin Officer** roles with form validation and session persistence. | ✅ Complete |
| **Submit Service Request** | Form capturing **Category** (Streetlight, Water, Garbage, Roads, etc.), **Location** (with GPS detection), **Description**, **Priority level**, and optional **Photo Evidence Upload** with instant preview. | ✅ Complete |
| **Admin Dashboard** | Municipal dispatch queue with multi-criteria filtering (status, category, priority), search, status updates, and case inspection modal. | ✅ Complete |
| **Status Tracking** | Visual 3-stage progress stepper (**Pending &rarr; In Progress &rarr; Resolved**), chronological audit timeline, and deep-linkable tracking URLs. | ✅ Complete |
| **Basic Analytics** | Real-time calculations of **Open Cases (Pending + In Progress)** vs. **Resolved Cases**, resolution rate percentage, and visual distribution bars. | ✅ Complete |
| **Clean Initial State** | Starts strictly with zero pre-seeded mock/test data in `localStorage`. | ✅ Complete |

### 🎁 Bonus Features (Beyond Core Requirements)
1. **Automated Tracking ID Generator**: Unique civic reference codes (e.g., `REQ-2026-4821`).
2. **Citizen Satisfaction Rating**: Once marked as *Resolved*, citizens can submit a 1–5 star rating with feedback comments.
3. **CSV Report Export**: Admins can export all service requests with timestamps and officer notes to a downloadable `.csv` spreadsheet.
4. **Photo Attachment & Image Preview**: In-browser FileReader converting images to Base64 for local storage with an inspection modal.
5. **Geolocation Autofill**: "Use GPS" button detects browser coordinates for rapid incident logging.
6. **Toast Notification System**: Non-intrusive floating toasts for feedback, actions, and validation warnings.
7. **Printable Summary Receipt**: Instant print/save option for citizen reference records.

---

## 📁 Project Structure

The project is organized into separate HTML pages, dedicated CSS stylesheets, and modular JavaScript files:

```
public-service-request-system/
├── index.html              # Home landing page with services catalog & quick tracker
├── submit-request.html     # Citizen request filing form with image upload
├── track.html              # Status tracking, 3-step progress bar & timeline
├── admin.html              # Municipal officer dashboard & analytics
├── register.html           # Citizen / Officer registration page
├── login.html              # Citizen / Officer authentication gateway
├── README.md               # Documentation & setup guide
│
├── css/
│   ├── common.css          # Design system tokens, shared header, footer, badges, toasts, modals
│   ├── home.css            # Hero section, civic catalog cards, stats banner
│   ├── auth.css            # Registration & login cards, role selectors
│   ├── submit.css          # Form layouts, file upload zone, confirmation modal
│   ├── track.css           # Step-progress bar, timeline stream, star rating widget
│   └── admin.css           # Analytics KPI cards, distribution bars, data table
│
└── js/
    ├── storage.js          # Centralized LocalStorage data layer & analytics calculation
    ├── common.js           # Session badge in header, mobile navbar, toasts, modal controllers
    ├── home.js             # Live statistics counters & quick tracking redirects
    ├── auth.js             # Registration & login validation with role-based routing
    ├── submit.js           # Image encoding, GPS coordinate detection & submission
    ├── track.js            # Stepper logic, timeline audit trail, feedback submission
    └── admin.js            # Analytics KPIs, table filters, status transitions, CSV export
```

---

## 🚀 Quick Setup & How to Run

Because the system is built with native web standards (HTML5, Vanilla CSS, and JavaScript), **no build step, npm dependencies, or compilation is required**.

### Option 1: Direct Browser Launch
Simply double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).

### Option 2: Local HTTP Server (Recommended)
Running through a local web server ensures proper cross-page navigation:

- **Using Python 3**:
  ```bash
  python -m http.server 8000
  ```
  Open `http://localhost:8000` in your browser.

- **Using Node.js**:
  ```bash
  npx serve .
  ```

---

## 🧪 Step-by-Step Testing Guide

Because this application starts completely clean with **zero pre-loaded test data**, follow this quick walkthrough:

### 1. File a Citizen Request
1. Open `index.html` and click **"Submit Service Request"** (or choose a category from the catalog).
2. Select a category (e.g. *Broken Streetlight* or *Water Issue*).
3. Enter an address (e.g. *Corner of 5th Ave and Maple St*) or click **"Use GPS"**.
4. Set a priority (e.g. *High* or *Urgent*).
5. Type an incident description and optionally upload a photo.
6. Click **Confirm & Submit Service Request**.
7. Note down your generated **Tracking ID** (e.g., `REQ-2026-1042`).

### 2. Inspect Tracking & Timeline
1. Click **"Track Status Now"** on the confirmation dialog (or navigate to `track.html`).
2. Observe the initial state: **Step 1: Pending** is active.
3. Review the ticket details, address, description, and attached photo evidence.

### 3. Log into Admin Dashboard & Transition Status
1. Navigate to `admin.html` from the top navigation bar.
2. If not signed in as an administrator, click **"Sign In as Municipal Officer"** (or register an Admin account via `register.html`).
3. View the **Basic Analytics**:
   - Total requests counter increments to `1`.
   - Active Open Cases shows `1` (1 pending).
   - Category distribution bar displays 100% for your chosen category.
4. Locate the ticket in the **Incident Management Queue**.
5. Click **"Update"**:
   - Change Status from `Pending` to `In Progress`.
   - Enter department dispatch remarks (e.g., *"Crew dispatched with replacement bulb"*).
   - Click **Save Status Transition**.
6. Observe the KPI cards update dynamically (*In Progress* counter changes).

### 4. Resolve the Case & Provide Citizen Feedback
1. Click **"Update"** on the ticket again and transition status to `Resolved`.
2. Notice the **Resolution Rate** jump to `100%` on the analytics dashboard.
3. Return to `track.html` and search for your tracking ID:
   - **Step 1, Step 2, and Step 3 (Resolved)** will now be marked complete in green.
   - The Activity Timeline shows the exact timestamp and officer note.
   - The **Citizen Resolution Feedback** card unlocks: Select 5 stars, leave comments, and click **Submit Feedback**.
4. In `admin.html`, click **"Inspect"** on the ticket to view the submitted citizen rating!

### 5. Export Municipal Report
1. On `admin.html`, click **"Export CSV Report"** to download `public_service_requests_YYYY-MM-DD.csv`.

---

## 💻 Technical Design Choices

1. **Clean Separation of Concerns**: Each page has its own dedicated `.css` stylesheet and `.js` script file, with shared components stored cleanly in `css/common.css` and `js/common.js`.
2. **Zero Pre-seeded Data**: The `StorageService` checks `localStorage` and returns empty arrays `[]` until the user performs actions.
3. **Data Integrity & Scalability**:
   - Requests are stored with timestamped audit logs (`timeline[]`).
   - Photos are encoded into standard Base64 Data URLs with client-side file size guards.
   - Responsive UI adapts seamlessly from mobile screens (360px) to desktop monitors (1200px+).

---

## 📄 License
Released for educational and municipal evaluation purposes.
All rights reserved © 2026 Public Service Request System.
