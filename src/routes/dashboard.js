const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin', 'super_admin', 'anggota'));

/**
 * GET /api/admin/dashboard/stats
 * Dashboard monitoring (FR-6)
 */
router.get('/stats', async (req, res) => {
  try {
    // Kartu ringkas: total, baru, dalam proses, selesai, ditolak
    const [totals] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'diterima' THEN 1 ELSE 0 END) as baru,
        SUM(CASE WHEN status IN ('diverifikasi', 'ditindaklanjuti') THEN 1 ELSE 0 END) as dalam_proses,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'ditolak' THEN 1 ELSE 0 END) as ditolak
      FROM reports
    `);

    // Laporan per bulan (12 bulan terakhir)
    const [perBulan] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as bulan,
        COUNT(*) as jumlah
      FROM reports
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY bulan ASC
    `);

    // Per kategori
    const [perKategori] = await db.query(`
      SELECT c.nama as kategori, COUNT(*) as jumlah
      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      GROUP BY r.category_id, c.nama
      ORDER BY jumlah DESC
    `);

    // Per sumber
    const [perSumber] = await db.query(`
      SELECT 
        CASE 
          WHEN source = 'eksternal' THEN 'Eksternal'
          WHEN mode = 'anonim' THEN 'Anonim'
          ELSE 'Teridentifikasi'
        END as sumber,
        COUNT(*) as jumlah
      FROM reports
      GROUP BY sumber
    `);

    // Per status
    const [perStatus] = await db.query(`
      SELECT status, COUNT(*) as jumlah
      FROM reports
      GROUP BY status
    `);

    // Laporan terbaru (5)
    const [terbaru] = await db.query(`
      SELECT r.id, r.status, r.source, r.mode, r.urgency, r.created_at,
             c.nama as kategori, r.location
      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    // Urgensi tinggi & belum selesai
    const [urgensiTinggi] = await db.query(`
      SELECT COUNT(*) as jumlah
      FROM reports
      WHERE urgency = 'tinggi' AND status NOT IN ('selesai', 'ditolak')
    `);

    res.json({
      ringkasan: totals[0],
      per_bulan: perBulan,
      per_kategori: perKategori,
      per_sumber: perSumber,
      per_status: perStatus,
      terbaru,
      urgensi_tinggi: urgensiTinggi[0].jumlah
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
