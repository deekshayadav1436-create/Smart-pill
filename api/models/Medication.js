/**
 * ==============================================================================
 * SmartPill Health Management System - Medication Model
 * File: backend/models/Medication.js
 * ==============================================================================
 * Educational Notes (BCA Viva Reference):
 * 1. Document Relational Reference: The `user` field establishes a one-to-many
 *    relationship between the User model and Medication entries using ObjectId.
 * 2. Active vs. Historical Tracking: The `status` field differentiates between
 *    ongoing prescriptions ('Active') and past treatments ('Completed' / 'Discontinued').
 * 3. Historical Metadata: Fields like `startDate`, `endDate`, `prescribedBy`, and
 *    `discontinueReason` provide comprehensive audit history for medical consultations.
 * ==============================================================================
 */

const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: [100, 'Medication name cannot exceed 100 characters']
    },
    dose: {
      type: String,
      required: [true, 'Dosage is required (e.g., 500 mg)'],
      trim: true
    },
    type: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Inhaler', 'Other'],
      default: 'Tablet'
    },
    frequency: {
      type: String,
      default: 'Daily'
    },
    time: {
      type: String,
      default: '08:00'
    },
    // Status flag: Active (currently taking) vs Completed / Discontinued (past medication history)
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Discontinued'],
      default: 'Active',
      index: true
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    endDate: {
      type: String,
      default: ''
    },
    prescribedBy: {
      type: String,
      trim: true,
      default: 'General Physician'
    },
    discontinueReason: {
      type: String,
      trim: true,
      default: ''
    },
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    adherenceStatus: {
      type: String,
      enum: ['Upcoming', 'Taken', 'Missed'],
      default: 'Upcoming'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly fetch a user's active or historical medications
medicationSchema.index({ user: 1, status: 1 });

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication;
