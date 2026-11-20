const express = require('express');
const { body, validationResult } = require('express-validator');

const Medication = require('../models/Medication');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function formatMedication(medication) {
  return {
    ...medication,
    dose: medication.dosage
  };
}

// GET all medications
router.get('/', async (req, res, next) => {
  try {
    const medications = await Medication.findAllByUser(req.user.id);

    return res.status(200).json({
      success: true,
      count: medications.length,
      medications: medications.map(formatMedication)
    });
  } catch (error) {
    next(error);
  }
});

// CREATE medication
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Medication name is required'),
    body('dose').trim().notEmpty().withMessage('Dosage is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { name, dose, dosage, schedule, frequency, time } = req.body;

      const medication = await Medication.createMedication({
        userId: req.user.id,
        name: name.trim(),
        dosage: (dose || dosage).trim(),
        schedule: schedule || `${frequency || 'Daily'} at ${time || '08:00'}`
      });

      return res.status(201).json({
        success: true,
        message: 'Medication added successfully',
        medication: formatMedication(medication)
      });
    } catch (error) {
      next(error);
    }
  }
);

// UPDATE medication
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medication ID'
      });
    }

    const existing = await Medication.findById(id, req.user.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or unauthorized'
      });
    }

    const medication = await Medication.updateMedication(
      id,
      req.user.id,
      {
        name: req.body.name,
        dosage: req.body.dose ?? req.body.dosage,
        schedule: req.body.schedule ??
          (req.body.frequency || req.body.time
            ? `${req.body.frequency || 'Daily'} at ${req.body.time || '08:00'}`
            : undefined)
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Medication updated successfully',
      medication: formatMedication(medication)
    });
  } catch (error) {
    next(error);
  }
});

// DELETE medication
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medication ID'
      });
    }

    const medication = await Medication.deleteMedication(id, req.user.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Medication removed successfully',
      id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
