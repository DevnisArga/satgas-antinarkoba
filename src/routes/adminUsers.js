const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// Konfigurasi upload berkas surat pemberhentian resmi
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `SK-PEMBERHENTIAN-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const uploadSurat = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format berkas harus PDF, JPG, JPEG, atau PNG'));
    }
  }
});

// Akses Admin dan Super Admin
router.use(authenticate, authorize('super_admin', 'admin'));

/**
 * GET /api/admin/users/terminations
 * Daftar arsip surat keputusan pemberhentian petugas
 */
router.get('/terminations', async (req, res) => {
  try {
    const [terminations] = await db.query(
      'SELECT * FROM user_terminations ORDER BY created_at DESC'
    );
    res.json({ data: terminations });
  } catch (error) {
    console.error('Fetch terminations error:', error);
    res.status(500).json({ error: 'Gagal memuat arsip pemberhentian.' });
  }
});

/**
 * GET /api/admin/users
 * Daftar semua admin/anggota aktif
 */
router.get('/', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, nama, email, role, aktif, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * POST /api/admin/users
 * Buat akun admin baru
 */
router.post('/', [
  body('nama').notEmpty().withMessage('Nama wajib diisi.'),
  body('email').isEmail().withMessage('Email tidak valid.'),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),
  body('role').isIn(['admin', 'super_admin', 'anggota']).withMessage('Role tidak valid.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nama, email, password, role } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [nama, email, hash, role]
    );

    await logAudit(req.user.id, 'CREATE_USER', `user:${result.insertId}`, email, req.ip);

    res.status(201).json({ message: 'Akun berhasil dibuat.', id: result.insertId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update akun
 */
router.put('/:id', async (req, res) => {
  try {
    const { nama, email, role, aktif, password } = req.body;
    const { id } = req.params;

    const updates = [];
    const values = [];

    if (nama) { updates.push('nama = ?'); values.push(nama); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (role) { updates.push('role = ?'); values.push(role); }
    if (aktif !== undefined) { updates.push('aktif = ?'); values.push(aktif ? 1 : 0); }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      updates.push('password_hash = ?');
      values.push(hash);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Tidak ada data yang diubah.' });

    values.push(id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    await logAudit(req.user.id, 'UPDATE_USER', `user:${id}`, null, req.ip);

    res.json({ message: 'Akun berhasil diperbarui.' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * POST /api/admin/users/:id/terminate
 * Pemberhentian resmi petugas dengan melampirkan berkas surat keputusan
 */
router.post('/:id/terminate', uploadSurat.single('surat_pemberhentian'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nomor_surat, tanggal_surat, alasan } = req.body;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Tidak dapat memberhentikan akun diri sendiri.' });
    }

    if (!nomor_surat || !nomor_surat.trim()) {
      return res.status(400).json({ error: 'Nomor surat pemberhentian wajib diisi.' });
    }
    if (!tanggal_surat) {
      return res.status(400).json({ error: 'Tanggal surat pemberhentian wajib diisi.' });
    }
    if (!alasan || !alasan.trim()) {
      return res.status(400).json({ error: 'Alasan atau keterangan pemberhentian wajib diisi.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Berkas surat keputusan pemberhentian (PDF / Foto) wajib diunggah.' });
    }

    // Ambil data user yang akan diberhentikan
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    const targetUser = users[0];

    if (targetUser.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Hanya Super Admin yang berwenang memberhentikan akun Super Admin.' });
    }

    // 1. Simpan berkas & rincian ke arsip surat pemberhentian resmi
    await db.query(`
      INSERT INTO user_terminations (
        user_id, nama_user, email_user, role_user, nomor_surat, tanggal_surat,
        alasan, file_surat, original_file_name, diberhentikan_oleh, diberhentikan_oleh_nama
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      targetUser.id,
      targetUser.nama,
      targetUser.email,
      targetUser.role,
      nomor_surat.trim(),
      tanggal_surat,
      alasan.trim(),
      req.file.filename,
      req.file.originalname,
      req.user.id,
      req.user.nama
    ]);

    // 2. Hapus akun pengguna dari sistem
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    // 3. Catat di audit log
    await logAudit(
      req.user.id,
      'TERMINATE_USER',
      `user:${id}`,
      `Pemberhentian ${targetUser.nama} (${targetUser.email}) berdasarkan SK No: ${nomor_surat.trim()}`,
      req.ip
    );

    res.json({
      message: `Akun ${targetUser.nama} berhasil diberhentikan dan Surat Keputusan No. ${nomor_surat} telah resmi diarsipkan.`,
      file_surat: req.file.filename
    });
  } catch (error) {
    console.error('Terminate user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses surat pemberhentian.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Mengharuskan surat pemberhentian
 */
router.delete('/:id', async (req, res) => {
  return res.status(400).json({
    error: 'Penghapusan akun petugas wajib menyertakan surat pemberhentian resmi melalui formulir pemberhentian.'
  });
});

module.exports = router;
