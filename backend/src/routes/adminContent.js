const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// Upload config for content images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const name = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase();
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

/**
 * Admin CMS routes factory (FR-4)
 */
function adminContentRoutes(tableName) {
  const router = express.Router();
  router.use(authenticate);

  // Otorisasi tabel untuk Anggota:
  // Anggota bisa GET semua tabel
  // Anggota bisa POST (ajukan konten draf / menunggu verifikasi) pada 'news', 'education_articles', dan 'agendas'
  router.use((req, res, next) => {
    const allowedTables = ['news', 'education_articles', 'agendas'];
    if (req.user.role === 'anggota') {
      if (!allowedTables.includes(tableName) && req.method !== 'GET') {
        return res.status(403).json({ error: 'Anggota hanya dapat melihat konten ini. Akses tambah/edit khusus Admin dan Super Admin.' });
      }
      if (['PUT', 'DELETE'].includes(req.method)) {
        return res.status(403).json({ error: 'Anggota tidak dapat mengubah atau menghapus konten. Hubungi Admin atau Super Admin.' });
      }
    }
    next();
  });

  // Helper: generate slug
  function slugify(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * GET - List semua (termasuk draft dan menunggu verifikasi)
   */
  router.get('/', async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let where = '1=1';
      const params = [];
      if (status) {
        where += ' AND t.status = ?';
        params.push(status);
      }

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM ${tableName} t WHERE ${where}`, params
      );

      const [items] = await db.query(
        `SELECT t.*, c.nama as kategori, u.nama as author, u.role as author_role
         FROM ${tableName} t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN users u ON t.author_id = u.id
         WHERE ${where}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        data: items,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
  });

  /**
   * POST - Create
   * Super Admin & Admin bisa langsung terbit / draft.
   * Anggota hanya bisa simpan draft atau kirim untuk verifikasi Super Admin.
   */
  router.post('/', upload.single('gambar'), [
    body('judul').notEmpty().withMessage('Judul wajib diisi.'),
    body('isi').notEmpty().withMessage('Isi konten wajib diisi.')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      let { judul, isi, category_id, status = 'draft', tanggal, waktu, lokasi } = req.body;
      const slug = slugify(judul) + '-' + Date.now().toString(36);
      const gambar = req.file ? req.file.filename : null;

      // Aturan role: Anggota tidak bisa langsung menerbitkan berita
      if (req.user.role === 'anggota') {
        if (status === 'terbit' || status === 'menunggu_verifikasi') {
          status = 'menunggu_verifikasi';
        } else {
          status = 'draft';
        }
      }

      let columns = 'judul, slug, isi, gambar, category_id, status, author_id';
      let placeholders = '?, ?, ?, ?, ?, ?, ?';
      let values = [judul, slug, isi, gambar, category_id || null, status, req.user.id];

      if (tableName === 'news' || tableName === 'agendas') {
        columns += ', tanggal';
        placeholders += ', ?';
        values.push(tanggal || null);
      }
      if (tableName === 'agendas') {
        columns += ', waktu, lokasi';
        placeholders += ', ?, ?';
        values.push(waktu || null, lokasi || null);
      }

      const [result] = await db.query(
        `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
        values
      );

      await logAudit(req.user.id, 'CREATE_CONTENT', `${tableName}:${result.insertId}`, judul, req.ip);

      res.status(201).json({
        message: status === 'menunggu_verifikasi'
          ? 'Berita berhasil diajukan dan sedang menunggu verifikasi Super Admin.'
          : 'Konten berhasil dibuat.',
        id: result.insertId,
        slug,
        status
      });
    } catch (error) {
      console.error('Create content error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
  });

  /**
   * PUT - Update
   * Super Admin & Admin bisa edit semua berita.
   * Anggota hanya bisa edit miliknya sendiri yang belum terbit.
   * Penerbitan dari status 'menunggu_verifikasi' ke 'terbit' wajib verifikasi Super Admin.
   */
  router.put('/:id', upload.single('gambar'), async (req, res) => {
    try {
      let { judul, isi, category_id, status, tanggal, waktu, lokasi } = req.body;
      const { id } = req.params;

      const [existing] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Konten tidak ditemukan.' });
      }
      const item = existing[0];

      // Otorisasi Anggota
      if (req.user.role === 'anggota') {
        if (item.author_id !== req.user.id) {
          return res.status(403).json({ error: 'Anda hanya dapat mengedit berita yang Anda buat sendiri.' });
        }
        if (item.status === 'terbit') {
          return res.status(403).json({ error: 'Berita yang sudah terbit tidak dapat diubah oleh Anggota.' });
        }
        if (status === 'terbit' || status === 'menunggu_verifikasi') {
          status = 'menunggu_verifikasi';
        }
      }

      // Verifikasi Super Admin / Admin untuk menerbitkan konten yang menunggu verifikasi
      if (status === 'terbit' && item.status === 'menunggu_verifikasi' && !['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Verifikasi dan penerbitan konten hanya dapat dilakukan oleh Admin atau Super Admin.' });
      }

      let updates = [];
      let values = [];

      if (judul) { updates.push('judul = ?'); values.push(judul); }
      if (isi) { updates.push('isi = ?'); values.push(isi); }
      if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id || null); }
      if (status) { updates.push('status = ?'); values.push(status); }
      if (req.file) {
        updates.push('gambar = ?');
        values.push(req.file.filename);
      } else if (req.body.remove_gambar === 'true' || req.body.remove_gambar === true) {
        updates.push('gambar = NULL');
      }
      if (tanggal !== undefined) { updates.push('tanggal = ?'); values.push(tanggal || null); }
      if (waktu !== undefined) { updates.push('waktu = ?'); values.push(waktu || null); }
      if (lokasi !== undefined) { updates.push('lokasi = ?'); values.push(lokasi || null); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Tidak ada data yang diubah.' });
      }

      values.push(id);
      await db.query(`UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`, values);

      await logAudit(req.user.id, 'UPDATE_CONTENT', `${tableName}:${id}`, null, req.ip);

      res.json({ message: 'Konten berhasil diperbarui.' });
    } catch (error) {
      console.error('Update content error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
  });

  /**
   * PATCH /:id/verify
   * Verifikasi konten (Berita, Edukasi, Agenda) khusus Admin & Super Admin
   */
  router.patch('/:id/verify', authorize('super_admin', 'admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'terbitkan' | 'tolak' | 'kembalikan_ke_draft'

      const [existing] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Konten tidak ditemukan.' });
      }

      let newStatus = 'terbit';
      let message = 'Berita berhasil diverifikasi dan telah terbit di website!';

      if (action === 'tolak') {
        newStatus = 'ditolak';
        message = 'Berita ditolak dan tidak diterbitkan.';
      } else if (action === 'kembalikan_ke_draft') {
        newStatus = 'draft';
        message = 'Berita dikembalikan ke status draf.';
      }

      await db.query(`UPDATE ${tableName} SET status = ? WHERE id = ?`, [newStatus, id]);
      await logAudit(req.user.id, 'VERIFY_CONTENT', `${tableName}:${id}`, `Verifikasi Super Admin: ${newStatus}`, req.ip);

      res.json({ message, status: newStatus });
    } catch (error) {
      console.error('Verify content error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server saat memverifikasi konten.' });
    }
  });

  /**
   * DELETE - Delete
   * Super Admin & Admin bisa hapus.
   * Anggota hanya bisa hapus berita miliknya sendiri yang belum terbit.
   */
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [existing] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Konten tidak ditemukan.' });
      }

      if (req.user.role === 'anggota') {
        if (existing[0].author_id !== req.user.id || existing[0].status === 'terbit') {
          return res.status(403).json({ error: 'Anda tidak memiliki hak untuk menghapus berita ini.' });
        }
      }

      await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      await logAudit(req.user.id, 'DELETE_CONTENT', `${tableName}:${id}`, null, req.ip);
      res.json({ message: 'Konten berhasil dihapus.' });
    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
  });

  return router;
}

module.exports = adminContentRoutes;
