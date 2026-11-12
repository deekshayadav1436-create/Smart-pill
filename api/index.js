/**
 * Vercel Serverless Function Entry Point for SmartPill API
 * Bridges incoming serverless HTTP requests to the Express application.
 */
const app = require('../backend/server.js');

module.exports = (req, res) => {
  // 1. If Vercel rewrite sets req.url to the serverless function path itself (/api/index.js),
  // recover the original client path from req.originalUrl or the x-matched-path header
  if (req.url === '/api/index.js' || req.url === '/index.js' || req.url.startsWith('/api/index.js?')) {
    const rawUrl = req.headers['x-matched-path'] || req.originalUrl;
    if (rawUrl && !rawUrl.includes('index.js')) {
      req.url = rawUrl;
    }
  }

  // 2. Ensure path starts with /api so Express routes match correctly
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
};
