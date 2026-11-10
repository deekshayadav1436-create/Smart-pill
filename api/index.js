/**
 * Vercel Serverless Function Entry Point for SmartPill API
 * Bridges incoming serverless HTTP requests to the Express application.
 */
const app = require('../backend/server.js');

module.exports = app;
