const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// Multer storage untuk dokumen materi regulasi resmi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `DOK-REGULASI-${Date.now()}-${cleanName}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format berkas harus PDF, DOC, DOCX, PPT, PPTX, atau Excel'));
    }
  }
});

// ==========================================
// 1. PUBLIC ROUTES (Semua Pengunjung)
// ==========================================

/**
 * GET /api/regulations
 * Daftar seluruh dokumen regulasi / materi resmi yang diupload
 */
router.get('/', async (req, res) => {
  try {
    const [docs] = await db.query(`
      SELECT d.*, u.nama as author_name 
      FROM regulation_documents d
      LEFT JOIN users u ON d.author_id = u.id
      ORDER BY d.created_at DESC
    `);
    res.json({ data: docs });
  } catch (error) {
    console.error('Fetch public regulations error:', error);
    res.status(500).json({ error: 'Gagal memuat dokumen regulasi.' });
  }
});

/**
 * POST /api/regulations/:id/request-access
 * Pengunjung mengajukan permohonan akses download
 */
router.post('/:id/request-access', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, identitas, email, alasan } = req.body;

    if (!nama || !identitas || !email) {
      return res.status(400).json({ error: 'Nama, NPM/NIP/Identitas, dan Email wajib diisi.' });
    }

    // Pastikan dokumen ada
    const [docs] = await db.query('SELECT id, judul FROM regulation_documents WHERE id = ?', [id]);
    if (docs.length === 0) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
    }

    // Buat token akses unik
    const token = crypto.randomBytes(24).toString('hex');

    await db.query(
      `INSERT INTO document_access_requests (document_id, token, nama, identitas, email, alasan, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [id, token, nama, identitas, email, alasan || null]
    );

    res.status(201).json({
      message: 'Permohonan akses berhasil dikirim. Menunggu persetujuan Admin Satgas.',
      token
    });
  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({ error: 'Gagal mengajukan permohonan akses.' });
  }
});

/**
 * GET /api/regulations/check-access/:token
 * Cek status permohonan akses pengguna menggunakan token
 */
router.get('/check-access/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const [requests] = await db.query(`
      SELECT r.*, d.judul as doc_title, d.nomor_dokumen
      FROM document_access_requests r
      JOIN regulation_documents d ON r.document_id = d.id
      WHERE r.token = ?
    `, [token]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Token permohonan tidak ditemukan.' });
    }

    res.json({ data: requests[0] });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Gagal mengecek status akses.' });
  }
});

/**
 * GET /api/regulations/download/:token
 * Download dokumen HANYA jika status request sudah 'approved'
 * Menerapkan One-Time Download Token (Single-Use):
 * Begitu berkas diunduh, status permohonan seketika diubah menjadi 'used'
 * dan link/token langsung hangus demi mencegah pencurian akses atau penyalahgunaan link.
 */
router.get('/download/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const [requests] = await db.query(`
      SELECT r.id, r.status, r.downloaded_at, d.file_path, d.judul
      FROM document_access_requests r
      JOIN regulation_documents d ON r.document_id = d.id
      WHERE r.token = ?
    `, [token]);

    if (requests.length === 0) {
      return res.status(404).send('Token permohonan tidak valid atau tidak ditemukan.');
    }

    const reqData = requests[0];
    if (reqData.status === 'used' || reqData.status === 'expired') {
      return res.status(403).send(
        'Izin unduh telah digunakan (kadaluarsa). Sesuai kebijakan keamanan Satgas Anti Narkoba, izin akses dokumen ini hanya berlaku 1 kali unduh. Silakan ajukan permohonan akses baru jika memerlukan berkas kembali.'
      );
    }
    if (reqData.status !== 'approved') {
      return res.status(403).send('Akses belum disetujui oleh Admin Satgas. Harap tunggu persetujuan.');
    }

    const filePath = path.join(__dirname, '../../uploads', reqData.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Berkas dokumen tidak ditemukan di server.');
    }

    // Catat waktu download & ubah status token menjadi 'used' (Hangus 1x pakai)
    await db.query(
      `UPDATE document_access_requests SET status = 'used', downloaded_at = NOW() WHERE id = ?`,
      [reqData.id]
    );

    res.download(filePath, reqData.file_path);
  } catch (error) {
    console.error('Download regulation error:', error);
    res.status(500).send('Terjadi kesalahan saat mengunduh berkas.');
  }
});

// ==========================================
// 2. ADMIN & SUPER ADMIN ROUTES
// ==========================================

/**
 * POST /api/regulations
 * Admin upload dokumen materi baru
 */
router.post('/', authenticate, authorize('admin', 'super_admin'), upload.single('file'), async (req, res) => {
  try {
    const { judul, nomor_dokumen, kategori, deskripsi } = req.body;
    if (!judul || !req.file) {
      return res.status(400).json({ error: 'Judul dan Berkas Dokumen wajib diunggah.' });
    }

    const [result] = await db.query(
      `INSERT INTO regulation_documents (judul, nomor_dokumen, kategori, deskripsi, file_path, file_size, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        judul,
        nomor_dokumen || null,
        kategori || 'Regulasi Kampus',
        deskripsi || null,
        req.file.filename,
        req.file.size,
        req.user.id
      ]
    );

    await logAudit(req.user.id, 'UPLOAD_REGULATION_DOC', `doc:${result.insertId}`, judul, req.ip);

    res.status(201).json({
      message: 'Dokumen materi berhasil diunggah.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Upload regulation error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengunggah dokumen.' });
  }
});

/**
 * DELETE /api/regulations/:id
 * Admin menghapus dokumen materi
 */
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const [docs] = await db.query('SELECT file_path FROM regulation_documents WHERE id = ?', [id]);
    if (docs.length === 0) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
    }

    // Hapus file fisik jika ada
    const filePath = path.join(__dirname, '../../uploads', docs[0].file_path);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('Could not unlink file:', e); }
    }

    await db.query('DELETE FROM regulation_documents WHERE id = ?', [id]);
    await logAudit(req.user.id, 'DELETE_REGULATION_DOC', `doc:${id}`, null, req.ip);

    res.json({ message: 'Dokumen materi berhasil dihapus.' });
  } catch (error) {
    console.error('Delete regulation error:', error);
    res.status(500).json({ error: 'Gagal menghapus dokumen.' });
  }
});

/**
 * GET /api/regulations/admin/requests
 * Admin melihat daftar permohonan akses download pengguna
 */
router.get('/admin/requests', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT r.*, d.judul as doc_title, d.nomor_dokumen, u.nama as reviewer_name
      FROM document_access_requests r
      JOIN regulation_documents d ON r.document_id = d.id
      LEFT JOIN users u ON r.reviewed_by = u.id
      ORDER BY r.created_at DESC
    `);
    res.json({ data: requests });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar permohonan.' });
  }
});

/**
 * PATCH /api/regulations/admin/requests/:id
 * Admin menyetujui (approve) atau menolak (reject) permohonan akses download
 */
router.patch('/admin/requests/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status harus approved atau rejected.' });
    }

    await db.query(
      `UPDATE document_access_requests 
       SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW() 
       WHERE id = ?`,
      [status, admin_note || null, req.user.id, id]
    );

    await logAudit(req.user.id, 'REVIEW_DOC_ACCESS', `request:${id}`, `status:${status}`, req.ip);

    res.json({ message: `Permohonan berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.` });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Gagal memperbarui status permohonan.' });
  }
});

module.exports = router;

