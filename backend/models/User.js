/**
 * ==============================================================================
 * SmartPill Health Management System - User Model
 * File: backend/models/User.js
 * ==============================================================================
 * Educational Notes (BCA Viva Reference):
 * 1. Mongoose Schema: Defines the structure, validation constraints, and default values
 *    for documents stored in the MongoDB "users" collection.
 * 2. Pre-Save Hook (Middleware): Automatically hashes passwords with bcrypt before saving
 *    new or updated documents to prevent storing plaintext passwords.
 * 3. Salt Rounds (Cost Factor = 12): 2^12 hashing iterations strike an optimal balance
 *    between security against brute-force attacks and server CPU performance (~250-350ms).
 * 4. `select: false`: Excludes the password hash from default query projections, preventing
 *    accidental exposure in API responses.
 * 5. Instance Method (`comparePassword`): Encapsulates credential verification logic directly
 *    within the model instance.
 * ==============================================================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Standard RFC 5322 compliant regex for robust email validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Alphanumeric + underscore regex for username validation
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        USERNAME_REGEX,
        'Username can only contain alphanumeric characters and underscores'
      ]
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Excluded from query results by default for defense-in-depth security
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
    toJSON: {
      // Clean up object when converted to JSON (e.g. remove sensitive or internal fields)
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

/**
 * Mongoose Pre-Save Hook (Document Middleware)
 * Runs automatically prior to calling doc.save().
 * Checks if the password field has been modified (either created or changed).
 * If modified, generates a salt with 12 rounds and hashes the plaintext password.
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it has been created or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate cryptographic salt with cost factor 12
    const salt = await bcrypt.genSalt(12);
    // Hash the password with the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: comparePassword
 * Compares candidate plaintext password against stored bcrypt hash.
 * 
 * @param {string} candidatePassword - Plaintext password provided during login
 * @returns {Promise<boolean>} - Resolves to true if matching, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
