/**
 * Vercel Serverless Function Entry Point for SmartPill API
 * Bridges incoming serverless HTTP requests to the Express application.
 *
 * KEY FIX: We eagerly call connectToDatabase() before handing off to Express
 * so the MongoDB Atlas connection is established on every cold-start request.
 */
const server = require('../backend/server.js');
const connectToDatabase = server.connectToDatabase;

module.exports = async (req, res) => {
  // 1. Eagerly connect to the database on every cold-start invocation.
  //    Subsequent warm invocations reuse the cached Mongoose connection.
  try {
    await connectToDatabase();
  } catch (err) {
    // Connection failure is intentionally non-fatal here.
    // The route handlers will return appropriate 503 responses via checkDbReady.
    console.error('[Vercel] Database connection attempt failed:', err.message);
  }

  // 2. If Vercel rewrite sets req.url to the serverless function path itself (/api/index.js),
  //    recover the original client path from req.originalUrl or the x-matched-path header
  if (req.url === '/api/index.js' || req.url === '/index.js' || req.url.startsWith('/api/index.js?')) {
    const rawUrl = req.headers['x-matched-path'] || req.originalUrl;
    if (rawUrl && !rawUrl.includes('index.js')) {
      req.url = rawUrl;
    }
  }

  // 3. Ensure path starts with /api so Express routes match correctly
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return server(req, res);
};
