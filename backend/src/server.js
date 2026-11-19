
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const initDatabase = require('./database/init');
const db = require('./config/database');

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const trackRoutes = require('./routes/track');
const adminReportRoutes = require('./routes/adminReports');
const dashboardRoutes = require('./routes/dashboard');
const contentRoutes = require('./routes/content');
const adminContentRoutes = require('./routes/adminContent');
const adminUserRoutes = require('./routes/adminUsers');
const regulationRoutes = require('./routes/regulations');

const { authenticate, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// ERROR LOG FILE
// ========================================

const logFile = path.join(__dirname, '../error.log');

function writeLog(message) {
  const log = `[${new Date().toISOString()}] ${message}\n`;

  try {
    fs.appendFileSync(logFile, log);
  } catch (error) {
    console.error('Gagal menulis error.log:', error.message);
  }

  console.error(message);
}

// ========================================
// SECURITY
// ========================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// ========================================
// CORS
// ========================================

const allowedOrigins = [
  'https://antinarkobapolinela.info',
  'https://www.antinarkobapolinela.info'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.includes(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error('Origin tidak diizinkan oleh CORS.')
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ],

    optionsSuccessStatus: 204
  })
);

// ========================================
// RATE LIMITER
// ========================================

const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  max:
    process.env.NODE_ENV === 'development'
      ? parseInt(process.env.RATE_LIMIT_MAX) || 5000
      : parseInt(process.env.RATE_LIMIT_MAX) || 200,

  message: {
    error: 'Terlalu banyak permintaan, coba lagi nanti.'
  },

  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => req.method === 'OPTIONS'
});

app.use(limiter);

// ========================================
// BODY PARSING
// ========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========================================
// LOGGING
// ========================================

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ========================================
// STATIC UPLOADS
// ========================================

const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

// ========================================
// ROOT
// ========================================

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API Satgas Anti Narkoba Polinela aktif dan berjalan.',
    endpoints: {
      health: '/api/health',
      reports: '/api/reports',
      track: '/api/track',
      auth: '/api/auth'
    }
  });
});

// ========================================
// API ROUTES
// ========================================

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

app.use(
  '/api/education',
  contentRoutes('education_articles')
);

app.use(
  '/api/news',
  contentRoutes('news')
);

app.use(
  '/api/agendas',
  contentRoutes('agendas')
);

app.use(
  '/api/admin/education',
  adminContentRoutes('education_articles')
);

app.use(
  '/api/admin/news',
  adminContentRoutes('news')
);

app.use(
  '/api/admin/agendas',
  adminContentRoutes('agendas')
);

app.use('/api/regulations', regulationRoutes);
app.use('/api/admin/users', adminUserRoutes);

// ========================================
// ADMIN MEMBERS
// ========================================

app.get(
  '/api/admin/members',
  authenticate,
  authorize('admin', 'super_admin'),
  async (req, res) => {
    try {
      const [members] = await db.query(
        'SELECT id, nama FROM users WHERE aktif = 1 ORDER BY nama ASC'
      );

      return res.json({
        data: members
      });

    } catch (error) {
      writeLog(`FETCH MEMBERS ERROR: ${error.stack || error.message}`);

      return res.status(500).json({
        error: 'Terjadi kesalahan server.'
      });
    }
  }
);

// ========================================
// CATEGORIES
// ========================================

app.get('/api/categories', async (req, res) => {
  try {
    const { tipe } = req.query;

    let sql = 'SELECT id, nama, tipe FROM categories';
    const params = [];

    if (tipe) {
      sql += ' WHERE tipe = ?';
      params.push(tipe);
    }

    sql += ' ORDER BY id ASC';

    const [rows] = await db.query(sql, params);

    return res.json({
      data: rows
    });

  } catch (error) {
    writeLog(`FETCH CATEGORIES ERROR: ${error.stack || error.message}`);

    return res.status(500).json({
      error: 'Gagal memuat kategori.'
    });
  }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// 404
// ========================================

app.use((req, res) => {
  return res.status(404).json({
    error: 'Endpoint tidak ditemukan.'
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  writeLog(
    `SERVER ERROR | ${req.method} ${req.originalUrl} | ${err.stack || err.message}`
  );

  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: err.message
    });
  }

  if (
    err.message?.includes('tidak diizinkan') ||
    err.message?.includes('melebihi')
  ) {
    return res.status(400).json({
      error: err.message
    });
  }

  return res.status(err.status || err.statusCode || 500).json({
    error: 'Terjadi kesalahan internal.'
  });
});

// ========================================
// START SERVER
// ========================================

async function startServer() {
  try {
    await db.query('SELECT 1');

    console.log('Database terhubung');

    await initDatabase();

    console.log('Database initialization selesai');

    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
      console.log(
        `Environment: ${process.env.NODE_ENV || 'development'}`
      );
    });

  } catch (error) {
    writeLog(
      `START SERVER ERROR: ${error.stack || error.message}`
    );

    process.exit(1);
  }
}

startServer();

module.exports = app;
