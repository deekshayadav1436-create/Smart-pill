# SmartPill — Health Management System

> **Vercel-Ready Full-Stack Monorepo**  
> React 19 frontend + Express/MongoDB backend running under **one single URL** — both locally and on Vercel.

---

## Single URL Architecture

| Environment | URL | Frontend | Backend API |
|---|---|---|---|
| **Local Dev** | `http://127.0.0.1:5173` | `http://127.0.0.1:5173/` | `http://127.0.0.1:5173/api/*` (proxied by Vite → Express on port 5000) |
| **Production** | `https://<your-project>.vercel.app` | `https://<your-project>.vercel.app/` | `https://<your-project>.vercel.app/api/*` (Vercel Serverless Function) |

---

## Project Structure

```
Smart-pill/                       ← Vercel project root
├── api/
│   └── index.js                  # Vercel Serverless Function — exports Express app
├── backend/
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── Medication.js         # Mongoose medication schema
│   │   └── User.js               # Mongoose user schema (bcrypt hashing)
│   ├── routes/
│   │   ├── auth.js               # Auth routes: /api/auth/*
│   │   └── medications.js        # Medication CRUD: /api/medications/*
│   ├── .env.example              # Backend environment variable template
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express app (serverless-compatible export)
├── frontend/
│   ├── public/                   # Static assets (favicon, icons)
│   ├── src/
│   │   ├── components/           # AuthPage, MedicationsView, etc.
│   │   ├── App.jsx               # Root component & state management
│   │   ├── App.css               # Healthcare UI theme
│   │   └── main.jsx              # React 19 entry point
│   ├── .env.example              # Frontend environment variable template
│   ├── index.html                # HTML shell
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite + /api proxy for local dev
├── .gitignore                    # Excludes node_modules, dist, .env secrets
├── package.json                  # Root orchestration (npm workspaces)
├── vercel.json                   # Vercel build & rewrite configuration
├── install.bat                   # Windows: 1-click dependency installer
└── start.bat                     # Windows: 1-click local dev starter
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Modern CSS |
| **Backend** | Node.js ≥20, Express 4.21, Mongoose 8.6 |
| **Auth** | JSON Web Tokens (JWT) + HttpOnly cookies + bcrypt |
| **Database** | MongoDB (local for dev, MongoDB Atlas for production) |
| **Deployment** | Vercel Serverless Functions + Vercel Edge CDN |

---

## Running Locally

### Prerequisites

- **Node.js** v20 or higher — [nodejs.org](https://nodejs.org)
- **MongoDB** — either:
  - Local: install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and start it (`mongod`)
  - Cloud: a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (also works for local dev)

### 1. Install Dependencies

```bash
npm install
```

This installs all workspace packages (root + `frontend/` + `backend/`) in one command.

### 2. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGODB_URI and JWT_SECRET at minimum
```

The frontend needs no `.env` file for local dev — the Vite proxy handles `/api` routing automatically.

### 3. Start Both Servers

```bash
npm run dev
```

This concurrently starts:
- **Backend** Express server on `http://127.0.0.1:5000`
- **Frontend** Vite dev server on `http://127.0.0.1:5173`

Open your browser at **`http://127.0.0.1:5173`**.

### Windows Quick Start

Double-click **`install.bat`** then **`start.bat`**.

---

## API Diagnostic Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api` | API info & available routes |
| `GET` | `/api/health` | Server + MongoDB status (HTTP 200 = healthy, 503 = DB offline) |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login (returns JWT cookie + token) |
| `GET` | `/api/auth/me` | Get current user (requires auth) |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/medications` | List medications (requires auth) |
| `POST` | `/api/medications` | Add medication (requires auth) |
| `PUT` | `/api/medications/:id` | Update medication (requires auth) |
| `DELETE` | `/api/medications/:id` | Delete medication (requires auth) |

---

## Deploying to Vercel

This repository is pre-configured for one-click Vercel deployment via `vercel.json`.

### Step 1 — Push to GitHub

Ensure all your changes are committed and pushed to the `main` branch.

### Step 2 — Import into Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New… → Project**
3. Select your `Smart-pill` GitHub repository and click **Import**

### Step 3 — Vercel Project Settings

Vercel reads `vercel.json` automatically. Confirm or manually set:

| Setting | Value |
|---|---|
| **Framework Preset** | `Other` |
| **Root Directory** | `.` (repository root — leave default) |
| **Install Command** | `npm install` |
| **Build Command** | `npm run build` |
| **Output Directory** | `frontend/dist` |

### Step 4 — Set Environment Variables

In **Project Settings → Environment Variables**, add:

| Variable | Required | Value / Example |
|---|---|---|
| `MONGODB_URI` | ✅ **Yes** | `mongodb+srv://<user>:<password>@cluster.mongodb.net/smartpill?retryWrites=true&w=majority` |
| `JWT_SECRET` | ✅ **Yes** | A strong random string — generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
| `NODE_ENV` | ✅ Recommended | `production` |
| `JWT_EXPIRES_IN` | No | `7d` (default) |
| `FRONTEND_URL` | No | `https://your-project-name.vercel.app` (used for CORS — only needed if requests fail) |

> **MongoDB Note:** Vercel Serverless Functions run in the cloud and **cannot** connect to `localhost` MongoDB. You must use a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free-tier cluster for production.

### Step 5 — Deploy

Click **Deploy**. After ~1–2 minutes your app will be live at a URL like:

```
https://smart-pill-abc123.vercel.app
```

### Expected URL Behavior After Deploy

```
https://your-project.vercel.app/                    → React SPA (login/dashboard)
https://your-project.vercel.app/api                 → { "name": "SmartPill API", "status": "online" }
https://your-project.vercel.app/api/health          → DB connection status JSON
https://your-project.vercel.app/api/auth/register   → User registration
https://your-project.vercel.app/api/auth/login      → Authentication
https://your-project.vercel.app/api/medications     → Medication CRUD (requires login)
```

---

## Backend on Vercel — Architecture Note

The backend runs as a **Vercel Serverless Function** via `api/index.js`. It does **not** need a separate hosting provider. Here's how it works:

```
Vercel Request → api/index.js (Serverless Entry) → backend/server.js (Express App)
                                                  ↓
                                            MongoDB Atlas
```

- `backend/server.js` exports `app` and only calls `app.listen()` when run as a standalone Node process (local dev).
- On Vercel, `api/index.js` imports the app and Vercel handles the HTTP layer — `app.listen()` is never called in production.

---

## Offline / Degraded Mode

The frontend has a graceful offline fallback — if the backend is unreachable, medications are stored and read from `localStorage`. Users see their data immediately; it syncs to the database once connectivity is restored.
