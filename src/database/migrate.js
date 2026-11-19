/**
 * Database Migration Script
 * Membuat semua tabel sesuai ERD di PRD §7
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
    connection = await mysql.createConnection(process.env.DATABASE_URL || process.env.MYSQL_URL);
  } else {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    };
    if (process.env.DB_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false };
    }
    connection = await mysql.createConnection(config);
  }

  try {
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'satgas_antinarkoba'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${process.env.DB_NAME || 'satgas_antinarkoba'}\``);

    console.log('📦 Membuat tabel...');

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'admin', 'anggota') NOT NULL DEFAULT 'anggota',
        aktif TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ users');

    // Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        tipe ENUM('laporan', 'edukasi', 'berita', 'agenda') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ categories');

    // Reports table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tracking_code_hash VARCHAR(255) NOT NULL UNIQUE,
        source ENUM('internal', 'eksternal') NOT NULL DEFAULT 'internal',
        mode ENUM('anonim', 'teridentifikasi') NOT NULL DEFAULT 'anonim',
        category_id INT,
        location VARCHAR(255),
        incident_date DATE,
        incident_time TIME,
        description TEXT NOT NULL,
        involved_parties TEXT,
        extra_info TEXT,
        urgency ENUM('rendah', 'sedang', 'tinggi') DEFAULT 'sedang',
        status ENUM('diterima', 'diverifikasi', 'ditindaklanjuti', 'selesai', 'ditolak') NOT NULL DEFAULT 'diterima',
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ reports');

    // Report reporters (identitas pelapor teridentifikasi - terenkripsi)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS report_reporters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL UNIQUE,
        nama_encrypted TEXT,
        nim_nip_encrypted TEXT,
        telepon_encrypted TEXT,
        email_encrypted TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ report_reporters');

    // Report external info (info pelapor eksternal)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS report_external_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL UNIQUE,
        instansi VARCHAR(200),
        nama_petugas VARCHAR(100),
        kontak VARCHAR(100),
        no_referensi VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ report_external_info');

    // Report attachments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS report_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        original_name VARCHAR(255),
        mime VARCHAR(100),
        size INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ report_attachments');

    // Report status logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS report_status_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        public_note TEXT,
        internal_note TEXT,
        changed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ report_status_logs');

    // Report messages (P1 - komunikasi pelapor-satgas)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS report_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        sender ENUM('satgas', 'pelapor') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ report_messages');

    // Education articles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS education_articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        isi TEXT,
        gambar VARCHAR(500),
        category_id INT,
        status ENUM('draft', 'menunggu_verifikasi', 'terbit', 'ditolak') NOT NULL DEFAULT 'draft',
        author_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ education_articles');

    // News
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        isi TEXT,
        gambar VARCHAR(500),
        category_id INT,
        status ENUM('draft', 'menunggu_verifikasi', 'terbit', 'ditolak') NOT NULL DEFAULT 'draft',
        tanggal DATE,
        author_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ news');

    // Agendas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agendas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        isi TEXT,
        gambar VARCHAR(500),
        category_id INT,
        status ENUM('draft', 'menunggu_verifikasi', 'terbit', 'ditolak') NOT NULL DEFAULT 'draft',
        tanggal DATE,
        waktu TIME,
        lokasi VARCHAR(255),
        author_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ agendas');

    // Audit logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        aksi VARCHAR(100) NOT NULL,
        target VARCHAR(255),
        detail TEXT,
        ip VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    console.log('  ✅ audit_logs');

    console.log('\n✅ Semua tabel berhasil dibuat!');

  } catch (error) {
    console.error('❌ Migration gagal:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
