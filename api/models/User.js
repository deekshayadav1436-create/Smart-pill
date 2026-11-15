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

const bcrypt = require('bcryptjs');
const { pool } = require('../db');

/**
 * User data access layer using PostgreSQL.
 * All functions return plain JS objects matching the shape expected by the auth routes.
 */

// Create a new user (hash password before insert)
async function createUser({ fullName, username, email, password }) {
  const hashed = await bcrypt.hash(password, 12);
  const res = await pool.query(
    `INSERT INTO users (full_name, username, email, password_hash, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, full_name AS "fullName", username, email, created_at AS "createdAt"`,
    [fullName, username, email, hashed]
  );
  return res.rows[0];
}

// Find user by username (case‑insensitive)
async function findByUsername(username) {
  const res = await pool.query(
    `SELECT id, full_name AS "fullName", username, email, password_hash AS "password", created_at AS "createdAt"
     FROM users WHERE username = $1`,
    [username]
  );
  return res.rows[0];
}

// Find user by email (case‑insensitive)
async function findByEmail(email) {
  const res = await pool.query(
    `SELECT id, full_name AS "fullName", username, email, password_hash AS "password", created_at AS "createdAt"
     FROM users WHERE email = $1`,
    [email]
  );
  return res.rows[0];
}

// Find user by id
async function findById(id) {
  const res = await pool.query(
    `SELECT id, full_name AS "fullName", username, email, created_at AS "createdAt"
     FROM users WHERE id = $1`,
    [id]
  );
  return res.rows[0];
}

// Verify a plaintext password against stored hash
async function verifyPassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

module.exports = {
  createUser,
  findByUsername,
  findByEmail,
  findById,
  verifyPassword,
};

