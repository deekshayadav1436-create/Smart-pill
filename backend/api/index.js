/**
 * Vercel Serverless Function Entry Point when Root Directory is set to backend
 */
const server = require('../server.js');
const connectToDatabase = server.connectToDatabase;

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error('[Vercel] Database connection attempt failed:', err.message);
  }

  if (req.url === '/api/index.js' || req.url === '/index.js' || req.url.startsWith('/api/index.js?')) {
    const rawUrl = req.headers['x-matched-path'] || req.originalUrl;
    if (rawUrl && !rawUrl.includes('index.js')) {
      req.url = rawUrl;
    }
  }

  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return server(req, res);
};
