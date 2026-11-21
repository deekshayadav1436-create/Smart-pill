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
const { Pool } = require('pg');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Import Route Handlers
const authRoutes = require('./routes/auth');
const medicationRoutes = require('./routes/medications');
const featureRoutes = require('./routes/features');

// Initialize Express Application
const app = express();

// ==============================================================================
// 1. Environment Configurations & Constants
// ==============================================================================
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/smartpill';
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
      // Allow requests with no origin (like curl, postman) or matching dev origins
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://localhost:')) {
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
    endpoints: {
      auth: '/api/auth',
      medications: '/api/medications'
    }
  });
});

/**
 * Health Check Endpoint:
 * Used for container orchestrators, uptime monitoring, and ping testing.
 * Returns HTTP 200 when database and server are healthy, HTTP 503 when degraded.
 */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: { status: 'connected' },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: { status: 'disconnected', error: err.message },
      environment: process.env.NODE_ENV || 'development'
    });
  }
});



/**
 * Mount Authentication Router
 * Prefix: /api/auth
 */
app.use('/api/auth', authRoutes);

/**
 * Mount Medications & History Router
 * Prefix: /api/medications
 */
app.use('/api/medications', medicationRoutes);
app.use('/api', featureRoutes);

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

// =============================================================================
// PostgreSQL Connection & Server Bootstrap
// =============================================================================
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connected successfully');
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  }
};

const startServer = async () => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 SmartPill Backend Server running on http://${HOST}:${PORT}`);
    console.log(`📋 Health check available at http://${HOST}:${PORT}/api/health`);
  });
  await testDbConnection();
};

if (require.main === module) {
  startServer();
}

// Graceful shutdown handling for PostgreSQL pool
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  try {
    await pool.end();
    console.log('PostgreSQL pool has ended.');
  } catch (err) {
    console.error('Error during PostgreSQL pool shutdown:', err.message);
  }
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

