/**
 * ==============================================================================
 * SmartPill Health Management System - Medication & History Routes
 * File: backend/routes/medications.js
 * ==============================================================================
 * Educational Notes (BCA Viva Reference):
 * 1. User Isolation & Multi-Tenancy: Every query filters by `req.user._id` to ensure
 *    that patients can only view, edit, or delete their own medical records.
 * 2. RESTful Architecture:
 *    - GET /api/medications -> Read list
 *    - POST /api/medications -> Create record
 *    - PUT /api/medications/:id -> Update or transition to history
 *    - DELETE /api/medications/:id -> Remove record
 * 3. Medication Lifecycle Transition:
 *    - When a patient stops a medication, the status transitions from 'Active' to
 *      'Completed' or 'Discontinued', recording `endDate` and `discontinueReason`.
 *    - The patient can also reactivate a previously used medication at any time.
 * ==============================================================================
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Medication = require('../models/Medication');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all medication routes
router.use(authenticate);

/**
 * 1. GET /api/medications
 * Retrieve all medications (both active and historical) for the logged-in user.
 * Optional query parameter: ?status=Active | Completed | Discontinued
 */
router.get('/', async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const medications = await Medication.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: medications.length,
      medications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 2. POST /api/medications
 * Create a new medication record (either active or historical)
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Medication name is required'),
    body('dose').trim().notEmpty().withMessage('Dosage is required (e.g. 500 mg)'),
    body('type').optional().isIn(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Inhaler', 'Other']),
    body('status').optional().isIn(['Active', 'Completed', 'Discontinued'])
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

      const {
        name,
        dose,
        type,
        frequency,
        time,
        status,
        startDate,
        endDate,
        prescribedBy,
        discontinueReason,
        instructions,
        adherenceStatus
      } = req.body;

      const medication = new Medication({
        user: req.user._id,
        name: name.trim(),
        dose: dose.trim(),
        type: type || 'Tablet',
        frequency: frequency || 'Daily',
        time: time || '08:00',
        status: status || 'Active',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || '',
        prescribedBy: prescribedBy || 'General Physician',
        discontinueReason: discontinueReason || '',
        instructions: instructions || '',
        adherenceStatus: adherenceStatus || 'Upcoming'
      });

      await medication.save();

      return res.status(201).json({
        success: true,
        message: 'Medication added successfully',
        medication
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 3. PUT /api/medications/:id
 * Update an existing medication, toggle status (e.g. move to history or reactivate)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or unauthorized'
      });
    }

    const updatableFields = [
      'name',
      'dose',
      'type',
      'frequency',
      'time',
      'status',
      'startDate',
      'endDate',
      'prescribedBy',
      'discontinueReason',
      'instructions',
      'adherenceStatus'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        medication[field] = req.body[field];
      }
    });

    // If marked as Completed or Discontinued and no endDate provided, set today
    if (
      (medication.status === 'Completed' || medication.status === 'Discontinued') &&
      !medication.endDate
    ) {
      medication.endDate = new Date().toISOString().split('T')[0];
    }

    await medication.save();

    return res.status(200).json({
      success: true,
      message: 'Medication updated successfully',
      medication
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 4. DELETE /api/medications/:id
 * Permanently delete a medication record
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Medication removed successfully',
      id: req.params.id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
