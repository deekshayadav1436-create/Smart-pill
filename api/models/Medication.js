const { pool } = require('../db');

async function findAllByUser(userId) {
  const result = await pool.query(
    'SELECT * FROM medications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function createMedication({ userId, name, dosage, schedule }) {
  const result = await pool.query(
    `INSERT INTO medications (user_id, name, dosage, schedule)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, dosage || null, schedule || null]
  );
  return result.rows[0];
}

async function findById(id, userId) {
  const result = await pool.query(
    'SELECT * FROM medications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0];
}

async function updateMedication(id, userId, updates) {
  const result = await pool.query(
    `UPDATE medications
     SET name = COALESCE($1, name),
         dosage = COALESCE($2, dosage),
         schedule = COALESCE($3, schedule)
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [updates.name ?? null, updates.dosage ?? null,
     updates.schedule ?? null, id, userId]
  );
  return result.rows[0];
}

async function deleteMedication(id, userId) {
  const result = await pool.query(
    'DELETE FROM medications WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  findAllByUser,
  createMedication,
  findById,
  updateMedication,
  deleteMedication
};
