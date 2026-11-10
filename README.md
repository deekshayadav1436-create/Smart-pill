# SmartPill – Health Management System

> **Single-Origin BCA Final-Year Project**  
> Complete health management application running under **one single URL: `http://127.0.0.1:5173`**.

---

## 🌐 Single Application URL

The entire application—including the React UI and all backend APIs—is accessible through **one single address**:

```
http://127.0.0.1:5173
```

- **Frontend Interface**: Open `http://127.0.0.1:5173` in your browser.
- **Backend API Routes**: Automatically reverse-proxied under `http://127.0.0.1:5173/api/` (e.g., `http://127.0.0.1:5173/api/health`).
- **No separate ports exposed**: You only ever need to navigate to `http://127.0.0.1:5173`.

---

## 🚀 How to Run (Single Command)

Open a terminal inside this `main` folder:

```bash
npm run dev
```

*(Or simply double-click **`start.bat`** on Windows)*

Then open your browser to:
👉 **`http://127.0.0.1:5173`**

---

## 📁 Project Architecture

The entire project is self-contained inside this single `main` root directory:

```text
main/
├── backend/                  # Node.js + Express API server (internal)
│   ├── middleware/auth.js    # JWT verification middleware
│   ├── models/User.js        # Mongoose User model with bcrypt hashing
│   ├── models/Medication.js  # Mongoose Medication model (active & past history)
│   ├── routes/auth.js        # Authentication endpoints (/api/auth)
│   ├── routes/medications.js # Medication CRUD & history endpoints (/api/medications)
│   ├── .env                  # Backend configuration
│   ├── package.json          # Backend dependencies
│   └── server.js             # Express API entry point
├── frontend/                 # React 19 + Vite interface
│   ├── src/components/       # AuthPage, MedicationHistoryView, MedicationsView, etc.
│   ├── src/App.jsx           # Main application routing and state
│   ├── src/App.css           # Blue & white healthcare theme
│   ├── vite.config.js        # Binds to 127.0.0.1:5173 with /api reverse proxy
│   └── package.json          # Frontend dependencies
├── package.json              # Root orchestration (concurrently)
├── README.md                 # Project documentation
├── start.bat                 # 1-Click Windows launcher
└── install.bat               # 1-Click dependency installer
```

---

## 🔑 Features Included

1. **Authentication (Sign In & Create Account)**:
   - Same-card tab switcher between **Sign In** and **Create Account**.
   - Dual-identifier login: sign in with either **User ID / Username** or **Email Address**.
   - Full validation on all registration fields, duplicate detection, and show/hide password buttons.
   - Secure bcrypt password hashing and JWT authentication.
   - Protected dashboard routing.

2. **Medication History Tracker**:
   - **Currently Taking (Active)**: Live management of active daily prescriptions.
   - **Previously Used (History)**: Full archive with start date, end date, prescribing doctor, and reason for stopping.
   - **Move to History / Discontinue**: Instant transition of completed medicines into medical history.
   - **Reactivate**: One-click resumption of past treatments into active regimen.

---

## 🗄️ MongoDB Setup Guide

- **Cloud MongoDB Atlas (Recommended)**:
  Paste your MongoDB connection string in `backend/.env`:
  ```properties
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartpill?retryWrites=true&w=majority
  ```
- **Local MongoDB**:
  Install MongoDB Community Server and run `net start MongoDB`. The default string in `backend/.env` is:
  ```properties
  MONGODB_URI=mongodb://127.0.0.1:27017/smartpill
  ```

> Note: The application includes intelligent local fallbacks, so you can test and demonstrate the UI even before MongoDB is started.
