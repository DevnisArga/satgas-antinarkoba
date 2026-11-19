const db = require('../config/database');

/**
 * Catat aksi di audit log
 */
async function logAudit(userId, aksi, target, detail = null, ip = null) {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, aksi, target, detail, ip) VALUES (?, ?, ?, ?, ?)',
      [userId, aksi, target, detail, ip]
    );
  } catch (error) {
    console.error('Gagal mencatat audit log:', error.message);
  }
}

module.exports = { logAudit };
