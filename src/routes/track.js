const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../config/database');
const { hashTrackingCode } = require('../utils/crypto');

const router = express.Router();

// Rate limit untuk pelacakan (FR-3)
const trackLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 10,
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 5 menit.' }
});

/**
 * GET /api/track/:code
 * Lacak status laporan (FR-3)
 * Hanya informasi non-sensitif yang tampil ke pelapor
 */
router.get('/:code', trackLimiter, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 10) {
      return res.status(400).json({ error: 'Format kode pelacakan tidak valid.' });
    }

    const codeHash = hashTrackingCode(code);

    // Ambil laporan tanpa data sensitif (FR-3)
    const [reports] = await db.query(
      `SELECT r.id, r.source, r.mode, r.status, r.created_at, r.updated_at,
              c.nama as kategori, r.location, r.incident_date
       FROM reports r
       LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.tracking_code_hash = ?`,
      [codeHash]
    );

    if (reports.length === 0) {
      // Pesan generik (keamanan - FR-3)
      return res.status(404).json({ error: 'Kode pelacakan tidak ditemukan. Pastikan kode yang Anda masukkan sudah benar.' });
    }

    const report = reports[0];

    // Ambil linimasa status (hanya public_note, TANPA internal_note)
    const [statusLogs] = await db.query(
      `SELECT to_status, public_note, created_at
       FROM report_status_logs
       WHERE report_id = ?
       ORDER BY created_at ASC`,
      [report.id]
    );

    // Ambil pesan dari Satgas (P1)
    const [messages] = await db.query(
      `SELECT sender, message, created_at
       FROM report_messages
       WHERE report_id = ?
       ORDER BY created_at ASC`,
      [report.id]
    );

    res.json({
      kategori: report.kategori,
      lokasi: report.location,
      tanggal_kejadian: report.incident_date,
      tanggal_lapor: report.created_at,
      pembaruan_terakhir: report.updated_at,
      status: report.status,
      sumber: report.source,
      linimasa: statusLogs.map(log => ({
        status: log.to_status,
        catatan: log.public_note,
        waktu: log.created_at
      })),
      pesan: messages.map(msg => ({
        dari: msg.sender,
        pesan: msg.message,
        waktu: msg.created_at
      }))
    });

  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
