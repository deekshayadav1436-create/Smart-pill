/**
 * ==============================================================================
 * SmartPill Health Management System - Authentication Routes
 * File: backend/routes/auth.js
 * ==============================================================================
 * Educational Notes (BCA Viva Reference):
 * 1. Express Router: A mini Express application that encapsulates modular routing logic.
 * 2. express-validator: Request validation layer using chains of sanitizers & validators
 *    before requests touch controller/database logic.
 * 3. HTTP Status Codes:
 *    - 200 OK: Standard successful retrieval or action.
 *    - 201 Created: New resource successfully created in database.
 *    - 400 Bad Request: Client input validation failure (malformed data).
 *    - 401 Unauthorized: Invalid or missing authentication credentials.
 *    - 409 Conflict: Unique constraint violation (duplicate username/email).
 *    - 500 Internal Server Error: Unhandled backend exception.
 * 4. Dual-Identifier Login: Inspecting for '@' symbol allows users to log in with
 *    either their email address or their unique username seamlessly.
 * ==============================================================================
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Cookie Configuration Utility:
 * Sets security flags according to deployment environment.
 */
const COOKIE_NAME = 'token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = () => ({
  httpOnly: true, // Prevents client-side scripts from accessing the cookie
  secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF mitigation
  maxAge: SEVEN_DAYS_MS // 7 days in milliseconds
});

/**
 * JWT Generation Utility:
 * Signs token with user ID payload and expiration.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'smartpill_default_jwt_secret_fallback_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ==============================================================================
// 1. POST /api/auth/register - Register a new user
// ==============================================================================
router.post(
  '/register',
  [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters'),

    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain alphanumeric characters and underscores'),

    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),

    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  async (req, res, next) => {
    try {
      // Validate input fields
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((err) => ({
            path: err.path || err.param,
            msg: err.msg
          }))
        });
      }

      const { fullName, username, email, password } = req.body;

      // Check if username is already taken
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          errors: [{ path: 'username', msg: 'Username already taken' }]
        });
      }

      // Check if email is already registered
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          errors: [{ path: 'email', msg: 'Email already registered' }]
        });
      }

      // Instantiate new user document (password gets hashed automatically by pre-save hook)
      const user = new User({
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password
      });

      await user.save();

      // Issue JWT token
      const token = generateToken(user._id);

      // Attach token as httpOnly cookie
      res.cookie(COOKIE_NAME, token, getCookieOptions());

      // Response with user info (toJSON strips password) and token
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==============================================================================
// 2. POST /api/auth/login - Authenticate user & issue cookie
// ==============================================================================
router.post(
  '/login',
  [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Username or email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((err) => ({
            path: err.path || err.param,
            msg: err.msg
          }))
        });
      }

      const { identifier, password } = req.body;
      const cleanIdentifier = identifier.trim().toLowerCase();

      // Detect whether identifier is email or username
      const isEmail = cleanIdentifier.includes('@');
      const query = isEmail ? { email: cleanIdentifier } : { username: cleanIdentifier };

      // Explicitly select '+password' because select: false is configured on UserSchema
      const user = await User.findOne(query).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          errors: [{ path: 'identifier', msg: 'Invalid username/email or password' }]
        });
      }

      // Verify password match using bcrypt comparison method
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          errors: [{ path: 'password', msg: 'Invalid username/email or password' }]
        });
      }

      // Generate JWT
      const token = generateToken(user._id);

      // Store in httpOnly cookie
      res.cookie(COOKIE_NAME, token, getCookieOptions());

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==============================================================================
// 3. GET /api/auth/me - Retrieve current authenticated user profile
// ==============================================================================
router.get('/me', authenticate, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      fullName: req.user.fullName,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  });
});

// ==============================================================================
// 4. POST /api/auth/logout - Clear session cookie
// ==============================================================================
router.post('/logout', (req, res) => {
  const options = getCookieOptions();
  // Clear cookie immediately
  res.clearCookie(COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
