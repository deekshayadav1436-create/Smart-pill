/**
 * Vercel Serverless Function Entry Point for SmartPill API
 * Bridges incoming serverless HTTP requests to the Express application.
 */
const app = require('./server.js');

module.exports = (req, res) => {
  if (req.url === '/api/index.js' || req.url === '/index.js' || req.url.startsWith('/api/index.js?')) {
    const rawUrl = req.headers['x-matched-path'] || req.originalUrl;
    if (typeof rawUrl === 'string' && !rawUrl.includes('index.js')) {
      req.url = rawUrl;
    }
  }

  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
};
