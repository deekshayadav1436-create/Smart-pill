const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// NOTIFICATIONS
router.get('/notifications', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load notifications' });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title, message, type || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create notification' });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update notification' });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete notification' });
  }
});

// ADHERENCE / MEDICATION LOGS
router.get('/adherence', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ml.*, m.name AS medication_name, m.dosage
       FROM medication_logs ml
       LEFT JOIN medications m ON m.id = ml.medication_id
       WHERE ml.user_id = $1 ORDER BY ml.scheduled_time DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load adherence records' });
  }
});

router.post('/adherence', async (req, res) => {
  try {
    const { medication_id, scheduled_time, status } = req.body;
    if (!medication_id || !scheduled_time) {
      return res.status(400).json({ message: 'Medication and scheduled time are required' });
    }

    const medication = await pool.query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [medication_id, req.user.id]
    );
    if (!medication.rowCount) return res.status(404).json({ message: 'Medication not found' });

    const result = await pool.query(
      `INSERT INTO medication_logs (user_id, medication_id, scheduled_time, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, medication_id, scheduled_time, status || 'upcoming']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to save adherence record' });
  }
});

router.patch('/adherence/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['upcoming', 'taken', 'missed', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid adherence status' });
    }
    const result = await pool.query(
      `UPDATE medication_logs SET status = $1, recorded_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Adherence record not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update adherence record' });
  }
});

// SETTINGS
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );
    if (!result.rowCount) {
      const created = await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
        [req.user.id]
      );
      return res.json(created.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { reminder_enabled, email_notifications, theme } = req.body;
    if (theme !== undefined && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ message: 'Invalid theme' });
    }
    const result = await pool.query(
      `INSERT INTO user_settings (user_id, reminder_enabled, email_notifications, theme)
       VALUES ($1, COALESCE($2, TRUE), COALESCE($3, TRUE), COALESCE($4, 'light'))
       ON CONFLICT (user_id) DO UPDATE SET
         reminder_enabled = COALESCE($2, user_settings.reminder_enabled),
         email_notifications = COALESCE($3, user_settings.email_notifications),
         theme = COALESCE($4, user_settings.theme),
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, reminder_enabled ?? null, email_notifications ?? null, theme ?? null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to save settings' });
  }
});

// HEALTH RECORDS
router.get('/health-records', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM health_records WHERE user_id = $1 ORDER BY record_date DESC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load health records' });
  }
});

router.post('/health-records', async (req, res) => {
  try {
    const { record_type, title, description, record_date } = req.body;
    if (!record_type || !title) {
      return res.status(400).json({ message: 'Record type and title are required' });
    }
    const result = await pool.query(
      `INSERT INTO health_records (user_id, record_type, title, description, record_date)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE)) RETURNING *`,
      [req.user.id, record_type, title, description || null, record_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create health record' });
  }
});

router.delete('/health-records/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM health_records WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Health record not found' });
    res.json({ message: 'Health record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete health record' });
  }
});

module.exports = router;
