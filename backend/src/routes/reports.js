const fs = require('fs');
const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/database');
const { encrypt, generateTrackingCode, generateExternalTrackingCode, hashTrackingCode } = require('../utils/crypto');

const router = express.Router();

// Helper untuk mencocokkan atau membuat category_id dari nama kategori
async function resolveCategoryId(connection, catInput) {
  if (!catInput) return null;
  if (!isNaN(catInput) && Number.isInteger(Number(catInput))) {
    return parseInt(catInput, 10);
  }
  const [rows] = await connection.query(
    'SELECT id FROM categories WHERE nama = ? OR nama LIKE ? LIMIT 1',
    [catInput, `%${catInput}%`]
  );
  if (rows.length > 0) {
    return rows[0].id;
  }
  const [insertResult] = await connection.query(
    'INSERT INTO categories (nama, tipe) VALUES (?, "laporan")',
    [catInput]
  );
  return insertResult.insertId;
}

// Konfigurasi upload file
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nama file diacak (keamanan)
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.mp4', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file ${ext} tidak diizinkan. Hanya JPG, PNG, MP4, dan PDF.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB per file
    files: 5 // Maks 5 file
  }
});

/**
 * POST /api/reports
 * Kirim laporan teridentifikasi (FR-1)
 */
router.post('/', upload.array('attachments', 5), [
  body('nama').notEmpty().withMessage('Nama lengkap pelapor wajib diisi.'),
  body('nim_nip')
    .notEmpty().withMessage('NPM / NIP pelapor wajib diisi.')
    .matches(/^\d{8}$/).withMessage('NPM / NIP harus berupa angka dan tepat 8 digit.'),
  body('telepon')
    .notEmpty().withMessage('Nomor WhatsApp / telepon pelapor wajib diisi.')
    .matches(/^\d{11,13}$/).withMessage('Nomor WhatsApp / HP harus berupa angka dan terdiri dari 11 sampai 13 digit.'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Format email tidak valid.'),
  body('category_id').notEmpty().withMessage('Kategori wajib dipilih.'),
  body('location').notEmpty().withMessage('Lokasi wajib diisi.'),
  body('incident_date').notEmpty().withMessage('Tanggal kejadian wajib diisi.'),
  body('description').isLength({ min: 30 }).withMessage('Deskripsi minimal 30 karakter.')
], async (req, res) => {
  const connection = await db.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Lampiran bukti kejadian wajib diunggah minimal 1 berkas (foto/video/dokumen).' });
    }

    const {
      mode = 'teridentifikasi',
      category_id,
      location,
      incident_date,
      incident_time,
      description,
      involved_parties,
      extra_info,
      // Data identitas
      nama,
      nim_nip,
      telepon,
      email
    } = req.body;

    if (!nim_nip || !/^\d{8}$/.test(nim_nip.trim())) {
      return res.status(400).json({ error: 'NPM / NIP harus berupa angka dan tepat 8 digit.' });
    }

    if (!telepon || !/^\d{11,13}$/.test(telepon.trim())) {
      return res.status(400).json({ error: 'Nomor WhatsApp / HP harus berupa angka dan berjumlah 11-13 digit.' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    await connection.beginTransaction();

    // Generate tracking code
    const trackingCode = generateTrackingCode();
    const trackingCodeHash = hashTrackingCode(trackingCode);

    // Pastikan category_id valid di tabel categories
    const resolvedCategoryId = await resolveCategoryId(connection, category_id);

    // Insert report - mode teridentifikasi dengan kerahasiaan terenkripsi di DB
    const reportMode = 'teridentifikasi';
    const [result] = await connection.query(
      `INSERT INTO reports (tracking_code_hash, source, mode, category_id, location, incident_date, incident_time, description, involved_parties, extra_info, status)
       VALUES (?, 'internal', ?, ?, ?, ?, ?, ?, ?, ?, 'diterima')`,
      [trackingCodeHash, reportMode, resolvedCategoryId, location, incident_date, incident_time || null, description, involved_parties || null, extra_info || null]
    );

    const reportId = result.insertId;

    // Simpan identitas terenkripsi (AES-256-GCM)
    await connection.query(
      `INSERT INTO report_reporters (report_id, nama_encrypted, nim_nip_encrypted, telepon_encrypted, email_encrypted)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nama_encrypted = VALUES(nama_encrypted),
         nim_nip_encrypted = VALUES(nim_nip_encrypted),
         telepon_encrypted = VALUES(telepon_encrypted),
         email_encrypted = VALUES(email_encrypted)`,
      [reportId, encrypt(nama), encrypt(nim_nip), encrypt(telepon), encrypt(email)]
    );

    // Simpan attachments (FR-1.3)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.query(
          `INSERT INTO report_attachments (report_id, file_path, original_name, mime, size) VALUES (?, ?, ?, ?, ?)`,
          [reportId, file.filename, file.originalname, file.mimetype, file.size]
        );
      }
    }

    // Log status awal
    await connection.query(
      `INSERT INTO report_status_logs (report_id, from_status, to_status, public_note) VALUES (?, NULL, 'diterima', 'Laporan berhasil diterima.')`,
      [reportId]
    );

    await connection.commit();

    // FR-1.6: Tampilkan kode pelacakan sekali
    res.status(201).json({
      message: 'Laporan berhasil dikirim.',
      tracking_code: trackingCode,
      warning: 'Simpan kode pelacakan ini. Kode tidak dapat dipulihkan jika hilang.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Submit report error:', error);

    if (error.message?.includes('Tipe file')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Terjadi kesalahan saat mengirim laporan.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/reports/external
 * Modul pelaporan pihak eksternal (FR-2)
 */
router.post('/external', upload.array('attachments', 5), [
  body('instansi').notEmpty().withMessage('Instansi wajib diisi.'),
  body('nama_petugas').notEmpty().withMessage('Nama petugas/pelapor wajib diisi.'),
  body('kontak')
    .notEmpty().withMessage('Kontak/Nomor HP wajib diisi.')
    .matches(/^\d{11,13}$/).withMessage('Nomor kontak WhatsApp / HP harus berupa angka dan terdiri dari 11 sampai 13 digit.'),
  body('description').isLength({ min: 30 }).withMessage('Ringkasan kasus minimal 30 karakter.')
], async (req, res) => {
  const connection = await db.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Lampiran berkas bukti atau surat resmi wajib diunggah minimal 1 berkas.' });
    }

    const {
      instansi,
      nama_petugas,
      kontak,
      no_referensi,
      category_id,
      location,
      incident_date,
      incident_time,
      description,
      involved_parties
    } = req.body;

    if (!kontak || !/^\d{11,13}$/.test(kontak.trim())) {
      return res.status(400).json({ error: 'Nomor kontak WhatsApp / HP harus berupa angka dan berjumlah 11-13 digit.' });
    }

    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    await connection.beginTransaction();

    const trackingCode = generateExternalTrackingCode();
    const trackingCodeHash = hashTrackingCode(trackingCode);

    const resolvedCategoryId = await resolveCategoryId(connection, category_id);

    const [result] = await connection.query(
      `INSERT INTO reports (tracking_code_hash, source, mode, category_id, location, incident_date, incident_time, description, involved_parties, status)
       VALUES (?, 'eksternal', 'teridentifikasi', ?, ?, ?, ?, ?, ?, 'diterima')`,
      [trackingCodeHash, resolvedCategoryId, location || null, incident_date || null, incident_time || null, description, involved_parties || null]
    );

    const reportId = result.insertId;

    // Simpan info eksternal
    await connection.query(
      `INSERT INTO report_external_info (report_id, instansi, nama_petugas, kontak, no_referensi)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         instansi = VALUES(instansi),
         nama_petugas = VALUES(nama_petugas),
         kontak = VALUES(kontak),
         no_referensi = VALUES(no_referensi)`,
      [reportId, instansi, nama_petugas, kontak, no_referensi || null]
    );

    // Simpan attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.query(
          `INSERT INTO report_attachments (report_id, file_path, original_name, mime, size) VALUES (?, ?, ?, ?, ?)`,
          [reportId, file.filename, file.originalname, file.mimetype, file.size]
        );
      }
    }

    // Log status awal
    await connection.query(
      `INSERT INTO report_status_logs (report_id, from_status, to_status, public_note) VALUES (?, NULL, 'diterima', 'Laporan eksternal berhasil diterima.')`,
      [reportId]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Laporan eksternal berhasil dikirim.',
      tracking_code: trackingCode,
      warning: 'Simpan kode pelacakan ini untuk memantau status laporan.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('External report error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengirim laporan.' });
  } finally {
    connection.release();
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Ukuran file melebihi batas 25 MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Maksimal 5 file yang dapat diunggah.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
