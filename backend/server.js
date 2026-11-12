/**
 * ==============================================================================
 * SmartPill Health Management System - Express Backend Server Entry Point
 * File: backend/server.js
 * ==============================================================================
 * Educational Notes (BCA Viva Reference):
 * 1. Express Application Architecture:
 *    - Middleware Chain: Ordered pipeline through which incoming HTTP requests flow
 *      (CORS -> cookie parsing -> JSON body parser -> routers -> 404 -> Error Handler).
 * 2. Cross-Origin Resource Sharing (CORS):
 *    - Configured with `credentials: true` to allow cookies to travel between frontend
 *      (Vite dev server at http://localhost:5173) and backend (Express at http://localhost:5000).
 * 3. Centralized Global Error Handler:
 *    - Follows Express convention with 4 parameters: `(err, req, res, next)`.
 *    - Catches Mongoose duplicate key errors (code 11000), validation errors, and runtime failures.
 * 4. Graceful Shutdown & Database Lifecycle:
 *    - Mongoose connects to MongoDB before HTTP server starts accepting traffic.
 * ==============================================================================
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Import Route Handlers
const authRoutes = require('./routes/auth');
const medicationRoutes = require('./routes/medications');

// Initialize Express Application
const app = express();

// ==============================================================================
// 1. Environment Configurations & Constants
// ==============================================================================
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI.trim().replace(/^\u2028/, '')
  : 'mongodb://127.0.0.1:27017/smartpill';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

// ==============================================================================
// 2. Global Middleware Pipeline
// ==============================================================================

/**
 * CORS Configuration:
 * Allows frontend client on IPv4 (127.0.0.1:5173) to communicate across origins
 * while supporting credentials (secure HTTP-only session cookies & Bearer tokens).
 */
const allowedOrigins = [
  FRONTEND_URL,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, postman) or matching allowed/dev/vercel origins
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

/**
 * Cookie Parser Middleware:
 * Parses Cookie header and populates req.cookies with an object keyed by the cookie names.
 */
app.use(cookieParser());

/**
 * Body Parser Middlewares:
 * 1. express.json(): Parses incoming requests with JSON payloads (Content-Type: application/json)
 * 2. express.urlencoded(): Parses URL-encoded form data (Content-Type: application/x-www-form-urlencoded)
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================================================================
// 3. API Routes
// ==============================================================================

/**
 * API Root Information Endpoint
 */
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    name: 'SmartPill API',
    status: 'online',
    health: '/api/health',
    setup: '/api/setup-check',
    endpoints: {
      auth: '/api/auth',
      medications: '/api/medications'
    }
  });
});

/**
 * Setup Diagnostic Endpoint:
 * Checks if all required environment variables are configured.
 * Safe to expose — never shows actual secret values.
 */
app.get('/api/setup-check', (req, res) => {
  const mongoUri = process.env.MONGODB_URI;
  const jwtSecret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;

  const isAtlasUri = mongoUri && mongoUri.startsWith('mongodb+srv://');
  const isLocalUri = mongoUri && mongoUri.includes('127.0.0.1');

  const issues = [];
  if (!mongoUri) {
    issues.push('MONGODB_URI is not set — the database cannot connect. Add a MongoDB Atlas URI in Vercel Project Settings → Environment Variables.');
  } else if (isLocalUri) {
    issues.push('MONGODB_URI is set to a local address (127.0.0.1) which is unreachable from Vercel. Replace it with a MongoDB Atlas URI (mongodb+srv://...).');
  }
  if (!jwtSecret) {
    issues.push('JWT_SECRET is not set — authentication will use an insecure fallback. Set a strong random string in Vercel env vars.');
  }

  res.status(issues.length > 0 ? 400 : 200).json({
    configured: issues.length === 0,
    issues,
    env: {
      MONGODB_URI: !mongoUri ? '❌ NOT SET' : (isLocalUri ? '⚠️ LOCAL ADDRESS — will not work on Vercel' : (isAtlasUri ? '✅ Atlas URI configured' : '⚠️ Set but not an Atlas URI')),
      JWT_SECRET: !jwtSecret ? '❌ NOT SET' : '✅ Set',
      NODE_ENV: nodeEnv || '⚠️ Not set (defaults to development)',
    },
    action: issues.length > 0
      ? 'Go to Vercel Dashboard → Your Project → Settings → Environment Variables and add MONGODB_URI (MongoDB Atlas URI), JWT_SECRET, and NODE_ENV=production. Then Redeploy.'
      : 'All required environment variables are configured. If database is still offline, check MongoDB Atlas Network Access settings (allow 0.0.0.0/0).',
    guide: 'https://github.com/deekshayadav1436-create/Smart-pill/blob/main/SETUP_GUIDE.md'
  });
});

// Module-level cache so the promise persists across serverless warm invocations.
// Using global ensures the value survives across require() calls in the same Lambda.
let cachedPromise = global._mongoosePromise || null;

/**
 * Serverless-compatible Mongoose connection with module-level caching.
 *
 * On Vercel/Lambda the Node.js process can be reused across requests (warm start).
 * We store the connection promise in the module scope so a second concurrent
 * request joins the same in-flight connect() rather than opening a new one.
 *
 * Key options for MongoDB Atlas:
 *   - serverSelectionTimeoutMS: how long to wait for a suitable server (10s)
 *   - connectTimeoutMS: socket-level connect timeout (10s)
 *   - bufferCommands: false → queries fail fast instead of queuing indefinitely
 *   - maxPoolSize: keep pool small for serverless to avoid Atlas free-tier limits
 */
const connectToDatabase = async () => {
  // 1. Already fully connected — reuse immediately.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. A connection is in progress — await the shared promise.
  if (cachedPromise && mongoose.connection.readyState !== 0) {
    await cachedPromise;
    return mongoose.connection;
  }

  // 3. No active connection — start a new one and cache the promise.
  cachedPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,  // 10 s — give Atlas time to wake up
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: false,            // fail fast — don't queue commands
    maxPoolSize: 10,
    minPoolSize: 1,
    autoIndex: true
  }).then((conn) => {
    global._mongoosePromise = cachedPromise;
    return conn.connection;
  }).catch((err) => {
    // Reset so the next request can try again.
    cachedPromise = null;
    global._mongoosePromise = null;
    console.error('[DB] Connection failed:', err.message);
    throw err;
  });

  await cachedPromise;
  return mongoose.connection;
};


/**
 * Health Check Endpoint:
 * Used for container orchestrators, uptime monitoring, and ping testing.
 * Returns HTTP 200 when database and server are healthy, HTTP 503 when degraded.
 *
 * KEY FIX: Always attempt DB connection on health check — this ensures the
 * connection is established immediately on first request (Vercel cold start).
 */
app.get('/api/health', async (req, res) => {
  let connectError = null;
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectToDatabase();
    } catch (err) {
      connectError = err;
    }
  }

  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      readyState: dbState,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
      error: connectError ? connectError.message : null
    },
    environment: process.env.NODE_ENV || 'development',
    mongoUri: MONGODB_URI ? MONGODB_URI.replace(/:\/\/[^@]+@/, '://<credentials>@') : 'not set'
  });
});

/**
 * Database Readiness Diagnostic Middleware:
 * Provides immediate connection attempt if not connected, and clear diagnostics.
 */
const checkDbReady = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectToDatabase();
    } catch (err) {
      const isCloudEnv = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      const isLocalhostUri = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('127.0.0.1') || process.env.MONGODB_URI.includes('localhost');
      
      const errorMsg = (isCloudEnv && isLocalhostUri)
        ? 'Database offline: MONGODB_URI environment variable is not configured in Vercel. Please add your MongoDB Atlas connection string (mongodb+srv://...) in Vercel Project Settings -> Environment Variables.'
        : `Database offline: ${err.message}`;

      return res.status(503).json({
        success: false,
        message: errorMsg,
        errors: [
          {
            path: 'database',
            msg: errorMsg
          }
        ]
      });
    }
  }
  next();
};

/**
 * Mount Authentication Router
 * Prefix: /api/auth
 */
app.use('/api/auth', checkDbReady, authRoutes);

/**
 * Mount Medications & History Router
 * Prefix: /api/medications
 */
app.use('/api/medications', checkDbReady, medicationRoutes);

// ==============================================================================
// 4. Static Frontend Production Build Serving (Single-Origin Architecture)
// ==============================================================================
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ==============================================================================
// 5. Fallback 404 Route Handler
// ==============================================================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: [${req.method}] ${req.originalUrl}`,
    errors: [{ path: 'route', msg: 'The requested API endpoint does not exist' }]
  });
});

// ==============================================================================
// 5. Global Error Handling Middleware
// ==============================================================================
/**
 * Express error handler with arity of 4: (err, req, res, next).
 * Catches all synchronous and asynchronous errors forwarded via next(err).
 */
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // 1. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already exists`,
      errors: [
        {
          path: duplicateField,
          msg: `${duplicateField} already exists in database`
        }
      ]
    });
  }

  // 2. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors || {}).map((item) => ({
      path: item.path,
      msg: item.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  // 3. Mongoose Invalid ObjectId Cast Error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`,
      errors: [{ path: err.path, msg: `Cast to ${err.kind} failed for value "${err.value}"` }]
    });
  }

  // 4. Default / Internal Server Error (500)
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: [
      {
        path: 'server',
        msg: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
      }
    ]
  });
});

// ==============================================================================
// 6. Database Connection & Server Bootstrap with Auto-Retry
// ==============================================================================

// Database lifecycle event handlers
mongoose.connection.on('connected', () => {
  console.log(`✅ MongoDB connected successfully: host=${mongoose.connection.host}, database=${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection lost / disconnected. Reconnection will be attempted automatically.');
});

let isConnecting = false;
let retryTimer = null;

const connectWithRetry = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  try {
    console.log(`[Database] Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: true
    });
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  } catch (error) {
    console.warn(`⚠️  Notice: MongoDB connection attempt failed (${error.message}). Auto-retrying in 5 seconds...`);
    retryTimer = setTimeout(() => {
      isConnecting = false;
      connectWithRetry();
    }, 5000);
  } finally {
    isConnecting = false;
  }
};

const startServer = async () => {
  // 1. Start HTTP Server immediately so API & health check are instantly available
  app.listen(PORT, HOST, () => {
    console.log(`🚀 SmartPill Backend Server running on http://${HOST}:${PORT}`);
    console.log(`📋 Health check available at http://${HOST}:${PORT}/api/health`);
  });

  // 2. Connect to MongoDB with auto-retry
  connectWithRetry();
};

// Only start standalone HTTP server when executed directly (not when required by Vercel serverless functions)
if (require.main === module) {
  startServer();
}

// Graceful process shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  if (retryTimer) clearTimeout(retryTimer);
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');
    }
  } catch (err) {
    console.error('Error during database teardown:', err.message);
  }
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Export the Express app as the default export (used by Vercel serverless handler in api/index.js)
// Also export connectToDatabase so api/index.js can eagerly warm the DB on every cold start.
module.exports = app;
module.exports.connectToDatabase = connectToDatabase;

