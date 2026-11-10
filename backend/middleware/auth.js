/**
 * ==============================================================================
 * SmartPill Health Management System - Authentication Middleware
 * File: backend/middleware/auth.js
 * ==============================================================================
 * Educational Notes (BCA Viva Reference):
 * 1. Express Middleware: A function with access to (req, res, next). It intercepts
 *    the HTTP request pipeline to perform validation, authentication, or mutations.
 * 2. JWT Verification: Verifies the cryptographic digital signature of the token
 *    using the server's private JWT_SECRET. Ensures token integrity and origin authenticity.
 * 3. httpOnly Cookies vs LocalStorage:
 *    - Cookies with `httpOnly: true` cannot be accessed via JavaScript (`document.cookie`),
 *      rendering them impervious to Cross-Site Scripting (XSS) credential theft.
 * 4. Error Hierarchy: Handling specific JWT errors like `TokenExpiredError` (expired TTL)
 *    and `JsonWebTokenError` (tampered or malformed token payload).
 * ==============================================================================
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware:
 * Protects private endpoints by verifying that the incoming request contains a valid,
 * non-expired JSON Web Token inside the httpOnly 'token' cookie or Bearer header.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Primary source: httpOnly cookie named 'token'
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback source: Authorization header (Bearer token pattern) for API testing
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token is provided, reject request immediately
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
        errors: [{ path: 'token', msg: 'Authentication token missing' }]
      });
    }

    // Verify token signature and decode payload
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'smartpill_default_jwt_secret_fallback_key'
    );

    // Fetch user from database to ensure user still exists and hasn't been deleted
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User no longer exists.',
        errors: [{ path: 'user', msg: 'User no longer exists' }]
      });
    }

    // Attach authenticated user document to request object
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT error cases
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired, please log in again.',
        errors: [{ path: 'token', msg: 'Token expired' }]
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        errors: [{ path: 'token', msg: 'Invalid token signature' }]
      });
    }

    // Unhandled generic authentication error
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      errors: [{ path: 'token', msg: error.message }]
    });
  }
};

module.exports = {
  authenticate
};
