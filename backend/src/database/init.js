const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    // 1. Pastikan folder uploads ada
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Folder uploads berhasil dibuat');
    }

    // 2. Buat tabel-tabel jika belum ada
    await db.query(`
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

    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        tipe ENUM('laporan', 'edukasi', 'berita', 'agenda') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
      CREATE TABLE IF NOT EXISTS report_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        sender ENUM('satgas', 'pelapor') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
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

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_terminations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        nama_user VARCHAR(150) NOT NULL,
        email_user VARCHAR(150) NOT NULL,
        role_user VARCHAR(50) NOT NULL,
        nomor_surat VARCHAR(150) NOT NULL,
        tanggal_surat DATE NOT NULL,
        alasan TEXT NOT NULL,
        file_surat VARCHAR(500) NOT NULL,
        original_file_name VARCHAR(255),
        diberhentikan_oleh INT NULL,
        diberhentikan_oleh_nama VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (diberhentikan_oleh) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 3. Seed kategori dasar jika belum ada
    const [existingCategories] = await db.query('SELECT COUNT(*) as count FROM categories');
    if (existingCategories[0].count === 0) {
      console.log('🌱 Mengisi kategori awal...');
      const initialCategories = [
        ['Penyalahgunaan/Konsumsi di Kampus', 'laporan'],
        ['Dugaan Peredaran', 'laporan'],
        ['Kepemilikan Barang Terlarang', 'laporan'],
        ['Lainnya', 'laporan'],
        ['Jenis Narkotika', 'edukasi'],
        ['Pencegahan Dini', 'edukasi'],
        ['Regulasi & Hukum', 'edukasi'],
        ['Kategori Hukuman', 'edukasi'],
        ['Berita Umum', 'berita'],
        ['Workshop', 'agenda'],
        ['Seminar', 'agenda'],
        ['Kampanye', 'agenda']
      ];
      for (const [nama, tipe] of initialCategories) {
        await db.query('INSERT IGNORE INTO categories (nama, tipe) VALUES (?, ?)', [nama, tipe]);
      }
      console.log('✅ Kategori awal berhasil diisi');
    }

    // 4. Buat akun default HANYA jika belum ada (jangan menimpa data yang sudah diedit pengguna)
    const [existingDefaultUsers] = await db.query('SELECT id FROM users WHERE id IN (1, 2)');
    const existingIds = existingDefaultUsers.map(u => u.id);

    if (!existingIds.includes(1)) {
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@satgas.polinela.ac.id';
      const adminHash = await bcrypt.hash(adminPassword, 12);
      await db.query(
        `INSERT INTO users (id, nama, email, password_hash, role, aktif) 
         VALUES (1, 'Super Admin Satgas', ?, ?, 'super_admin', 1)`,
        [adminEmail, adminHash]
      );
      console.log(`✅ Akun default super_admin dibuat (${adminEmail})`);
    }

    if (!existingIds.includes(2)) {
      const satgasPassword = process.env.DEFAULT_MEMBER_PASSWORD || 'satgas123';
      const satgasEmail = process.env.DEFAULT_MEMBER_EMAIL || 'anggota1@satgas.polinela.ac.id';
      const satgasHash = await bcrypt.hash(satgasPassword, 12);
      await db.query(
        `INSERT INTO users (id, nama, email, password_hash, role, aktif) 
         VALUES (2, 'Admin Satgas', ?, ?, 'admin', 1)`,
        [satgasEmail, satgasHash]
      );
      console.log(`✅ Akun default admin dibuat (${satgasEmail})`);
    }

    console.log('✅ Verifikasi database & tabel selesai');
  } catch (error) {
    console.error('⚠️ Peringatan inisialisasi database:', error.message);
  }
}

module.exports = initDatabase;
