# 🔧 SmartPill — Database Setup Guide

## Why is the database offline?

SmartPill uses **MongoDB Atlas** (a cloud database) to store user accounts and medication data.
The app is running on Vercel, but the **`MONGODB_URI` environment variable is not configured**.

---

## ✅ Fix in 5 Steps

### Step 1 — Create a Free MongoDB Atlas Account

1. Go to **[mongodb.com/atlas](https://www.mongodb.com/atlas)**
2. Click **"Try Free"** and create an account
3. Create a **free M0 cluster** (Shared/Free — no credit card needed)

### Step 2 — Create a Database User

1. In Atlas, go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Set a **username** and **password** (remember these)
4. Under "Database User Privileges", select: **"Read and write to any database"**
5. Click **"Add User"**

### Step 3 — Allow Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** → this sets `0.0.0.0/0`
4. Click **"Confirm"**

> ⚠️ This step is critical — without it, Vercel can't connect to Atlas.

### Step 4 — Get Your Connection String

1. Go to **Clusters** (left sidebar) → Click **"Connect"** on your cluster
2. Click **"Connect your application"**
3. Select: Driver = **Node.js**, Version = **5.5 or later**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://youruser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
5. Replace `<password>` with your actual password
6. Add `/smartpill` before the `?` to specify the database name:
   ```
   mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/smartpill?retryWrites=true&w=majority
   ```

### Step 5 — Add Environment Variables to Vercel

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. Click on your **Smart-pill** project
3. Click **Settings** → **Environment Variables**
4. Add these three variables:

   | Name | Value |
   |------|-------|
   | `MONGODB_URI` | `mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/smartpill?retryWrites=true&w=majority` |
   | `JWT_SECRET` | Any random string of 32+ characters (e.g., `mysupersecretkey12345678901234567890`) |
   | `NODE_ENV` | `production` |

5. Make sure to select **All Environments** (Production, Preview, Development)
6. Click **Save** for each variable

### Step 6 — Redeploy

1. Go to the **Deployments** tab in your Vercel project
2. Click the **⋯** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait ~1 minute for deployment to complete

---

## ✅ Verify It Works

After redeploying, visit:
```
https://smartpill-five.vercel.app/api/health
```

You should see:
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "readyState": 1
  }
}
```

---

## 🆘 Still Not Working?

### Check 1: Is the connection string correct?
- Must include your actual password (not `<password>`)
- Must include `/smartpill` before the `?`
- Must NOT have any spaces

### Check 2: Is Network Access set to 0.0.0.0/0?
- In Atlas → Network Access → check there's an entry for `0.0.0.0/0`

### Check 3: Did you redeploy after adding env vars?
- Vercel only uses new env vars after a fresh deployment
- Go to Deployments → Redeploy

### Check 4: Check the health endpoint error message
- Visit `/api/health` on your Vercel URL
- The `database.error` field will show the exact connection error

---

## Need Help?

Open an issue on the [GitHub repository](https://github.com/deekshayadav1436-create/Smart-pill/issues).
