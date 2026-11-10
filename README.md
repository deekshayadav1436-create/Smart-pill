# SmartPill - Health Management System

> **Vercel-Ready Fullstack Monorepo**  
> Complete health management application running under **one single URL** in both cloud production (Vercel) and local development.

---

## Single Working URL Architecture

Whether deployed on **Vercel** or running **locally**, the frontend and backend operate together under **one single origin**:

- **Production (Vercel)**: `https://<your-project>.vercel.app`
  - Frontend UI: `https://<your-project>.vercel.app/`
  - Backend API: `https://<your-project>.vercel.app/api/*` (e.g. `/api/health`, `/api/auth/login`)
- **Local Development**: `http://127.0.0.1:5173`
  - Frontend UI: `http://127.0.0.1:5173/`
  - Backend API: `http://127.0.0.1:5173/api/*` (auto-proxied via Vite to internal Express server)

---

## Monorepo Project Structure

```text
Smart-pill/
├── api/
│   └── index.js             # Vercel Serverless Function entry point (bridges Express app)
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── models/
│   │   ├── Medication.js    # Mongoose active & past medication schema
│   │   └── User.js          # Mongoose user model with bcrypt hashing
│   ├── routes/
│   │   ├── auth.js          # Authentication routes (/api/auth)
│   │   └── medications.js   # Medication CRUD & history routes (/api/medications)
│   ├── .env.example         # Backend environment template
│   ├── package.json         # Backend dependencies
│   └── server.js            # Dual-mode Express server (Serverless + standalone listener)
├── frontend/
│   ├── public/              # Static public assets (favicons, SVG icons)
│   ├── src/
│   │   ├── components/      # AuthPage, MedicationHistoryView, MedicationsView, etc.
│   │   ├── App.jsx          # Root application routing and state management
│   │   ├── App.css          # Healthcare UI theme
│   │   └── main.jsx         # React 19 entry point
│   ├── .env.example         # Frontend environment template
│   ├── .gitignore           # Frontend local gitignore
│   ├── index.html           # HTML shell
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration with /api reverse proxy
├── .gitignore               # Root gitignore (excludes node_modules, build outputs, real .env)
├── package.json             # Root orchestration with npm workspaces
├── package-lock.json
├── vercel.json              # Vercel deployment specification (build & API rewrites)
├── README.md                # Project documentation & deployment guide
├── install.bat              # 1-Click Windows dependency installer
└── start.bat                # 1-Click Windows local runner
```

---

## How to Run Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB service (`net start MongoDB`) or a cloud MongoDB Atlas connection URI

### Quick Start (Windows)
1. Double-click **`install.bat`** (or run `npm run install:all` in terminal).
2. Double-click **`start.bat`** (or run `npm run dev` in terminal).
3. Open your browser at **`http://127.0.0.1:5173`**.

---

## How to Deploy to Vercel (Step-by-Step)

This repository is pre-configured with `vercel.json` and `api/index.js` for single-click Vercel deployment.

### Step 1: Push Repository to GitHub
Ensure all code is committed and pushed to your GitHub repository on branch `main`.

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Select your repository: `Smart-pill` and click **Import**.

### Step 3: Project Configuration
Vercel will automatically read `vercel.json`. Verify the following settings:
- **Framework Preset**: `Vite` (or `Other`)
- **Root Directory**: `./` (leave default repository root)
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`

### Step 4: Configure Environment Variables
In the **Environment Variables** section of the Vercel project settings, add:

| Variable Name | Required | Description / Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | **Yes** | Your cloud MongoDB Atlas connection string, e.g.: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartpill?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | A strong random string for signing JWT authentication tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (Default: `7d`) |
| `NODE_ENV` | No | Set to `production` |

> Note on MongoDB: Vercel functions execute in the cloud and cannot connect to `127.0.0.1` (localhost). A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster is recommended for production.

### Step 5: Click Deploy
Click **Deploy**. Once built, Vercel will provide your unified URL (e.g. `https://smart-pill.vercel.app`).

---

## System Health & Diagnostic Endpoints

- **Root API Status**: `GET /api`
  ```json
  {
    "name": "SmartPill API",
    "status": "online",
    "health": "/api/health"
  }
  ```
- **Database Diagnostic Check**: `GET /api/health`
  Returns HTTP 200 with MongoDB host and connection status, or HTTP 503 with setup instructions if MongoDB Atlas credentials are not yet configured.

---

## Tech Stack

- **Frontend**: React 19, Vite 6, Modern CSS
- **Backend**: Node.js, Express 4.21, Mongoose 8.6, JSON Web Tokens (JWT), Bcrypt.js
- **Deployment**: Vercel Serverless Functions (`@vercel/node`) + Vercel Edge Static CDN
