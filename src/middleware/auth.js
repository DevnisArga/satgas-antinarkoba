const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware autentikasi JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Akses ditolak. Silakan login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.query(
      'SELECT id, nama, email, role, aktif FROM users WHERE id = ? AND aktif = 1',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Akun tidak ditemukan atau tidak aktif.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesi telah berakhir. Silakan login kembali.' });
    }
    return res.status(401).json({ error: 'Token tidak valid.' });
  }
};

/**
 * Middleware otorisasi berdasarkan role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk fitur ini.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
