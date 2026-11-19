
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// ========================================
// ERROR LOG
// ========================================

const logFile = path.join(__dirname, '../../error.log');

function writeLog(message) {
  const log = `[${new Date().toISOString()}] ${message}\n`;

  try {
    fs.appendFileSync(logFile, log);
  } catch (error) {
    console.error('Gagal menulis log:', error.message);
  }

  console.error(message);
}

// ========================================
// LOGIN RATE LIMIT
// ========================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,

  message: {
    error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
  },

  standardHeaders: true,
  legacyHeaders: false
});

// ========================================
// POST /api/auth/login
// ========================================

router.post(
  '/login',

  loginLimiter,

  [
    body('email')
      .isEmail()
      .withMessage('Format email tidak valid.'),

    body('password')
      .notEmpty()
      .withMessage('Password wajib diisi.')
  ],

  async (req, res) => {
    try {
      writeLog('[LOGIN] Permintaan login diterima.');

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }

      const email = req.body.email.trim().toLowerCase();
      const password = req.body.password;

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET belum dikonfigurasi.');
      }

      writeLog('[LOGIN] Memeriksa database.');

      const [users] = await db.query(
        `SELECT id, nama, email, password_hash, role, aktif
         FROM users
         WHERE LOWER(TRIM(email)) = ?
         AND aktif = 1`,
        [email]
      );

      writeLog(
        `[LOGIN] Jumlah user ditemukan: ${users.length}`
      );

      if (users.length === 0) {
        return res.status(401).json({
          error: 'Email atau password salah.'
        });
      }

      const user = users[0];

      if (!user.password_hash) {
        throw new Error('Password hash pengguna kosong.');
      }

      writeLog('[LOGIN] Memverifikasi password.');

      const isMatch = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isMatch) {
        return res.status(401).json({
          error: 'Email atau password salah.'
        });
      }

      writeLog('[LOGIN] Password cocok.');

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '8h'
        }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
      });

      writeLog('[LOGIN] Mencatat audit log.');

      await logAudit(
        user.id,
        'LOGIN',
        'auth',
        null,
        req.ip
      );

      writeLog('[LOGIN] Login berhasil.');

      return res.json({
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      writeLog(
        `[LOGIN] ERROR: ${error.stack || error.message}`
      );

      return res.status(500).json({
        error: 'Terjadi kesalahan internal.'
      });
    }
  }
);

// ========================================
// POST /api/auth/logout
// ========================================

router.post('/logout', authenticate, async (req, res) => {
  try {
    await logAudit(
      req.user.id,
      'LOGOUT',
      'auth',
      null,
      req.ip
    );

    res.clearCookie('token');

    return res.json({
      message: 'Berhasil logout.'
    });

  } catch (error) {
    writeLog(`[LOGOUT] ERROR: ${error.stack || error.message}`);

    return res.status(500).json({
      error: 'Terjadi kesalahan saat logout.'
    });
  }
});

// ========================================
// GET /api/auth/me
// ========================================

router.get('/me', authenticate, (req, res) => {
  return res.json({
    user: req.user
  });
});

router.put(
  '/password',

  authenticate,

  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Password lama wajib diisi.'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password baru minimal 8 karakter.')
  ],

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      const [users] = await db.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0 || !users[0].password_hash) {
        return res.status(404).json({
          error: 'Data pengguna tidak ditemukan.'
        });
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        users[0].password_hash
      );

      if (!isMatch) {
        return res.status(400).json({
          error: 'Password lama tidak sesuai.'
        });
      }

      const newHash = await bcrypt.hash(newPassword, 12);

      await db.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newHash, req.user.id]
      );

      await logAudit(
        req.user.id,
        'CHANGE_PASSWORD',
        'auth',
        null,
        req.ip
      );

      return res.json({
        message: 'Password berhasil diubah.'
      });

    } catch (error) {
      writeLog(
        `[PASSWORD] ERROR: ${error.stack || error.message}`
      );

      return res.status(500).json({
        error: 'Terjadi kesalahan server.'
      });
    }
  }
);

module.exports = router;
