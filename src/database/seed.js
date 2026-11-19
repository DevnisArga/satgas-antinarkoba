/**
 * Database Seed Script
 * Mengisi data awal: kategori, super admin, konten contoh
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Kategori Laporan
    const kategoriLaporan = [
      ['Penyalahgunaan/Konsumsi di Kampus', 'laporan'],
      ['Dugaan Peredaran', 'laporan'],
      ['Kepemilikan Barang Terlarang', 'laporan'],
      ['Lainnya', 'laporan']
    ];

    // Kategori Edukasi
    const kategoriEdukasi = [
      ['Jenis Narkotika', 'edukasi'],
      ['Pencegahan Dini', 'edukasi'],
      ['Regulasi & Hukum', 'edukasi'],
      ['Kategori Hukuman', 'edukasi']
    ];

    // Kategori Berita & Agenda
    const kategoriLain = [
      ['Berita Umum', 'berita'],
      ['Workshop', 'agenda'],
      ['Seminar', 'agenda'],
      ['Kampanye', 'agenda']
    ];

    const allCategories = [...kategoriLaporan, ...kategoriEdukasi, ...kategoriLain];
    
    for (const [nama, tipe] of allCategories) {
      await db.query(
        'INSERT IGNORE INTO categories (nama, tipe) VALUES (?, ?)',
        [nama, tipe]
      );
    }
    console.log('  ✅ Kategori');

    // Super Admin default
    const passwordHash = await bcrypt.hash('admin123', 12);
    await db.query(
      `INSERT IGNORE INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Satgas 1', 'admin@satgas.polinela.ac.id', passwordHash, 'super_admin']
    );
    console.log('  ✅ Super Admin (admin@satgas.polinela.ac.id / admin123)');

    // Admin Satgas contoh
    const adminHash = await bcrypt.hash('satgas123', 12);
    await db.query(
      `INSERT IGNORE INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Satgas 2', 'anggota1@satgas.polinela.ac.id', adminHash, 'admin']
    );
    console.log('  ✅ Admin Satgas contoh');

    // Konten Edukasi contoh
    const eduArticles = [
      {
        judul: 'Mengenal Jenis-Jenis Narkotika dan Bahayanya',
        slug: 'mengenal-jenis-narkotika',
        isi: `<h2>Apa Itu Narkotika?</h2>
<p>Narkotika adalah zat atau obat yang berasal dari tanaman atau bukan tanaman, baik sintetis maupun semi sintetis, yang dapat menyebabkan penurunan atau perubahan kesadaran, hilangnya rasa, mengurangi sampai menghilangkan rasa nyeri, dan dapat menimbulkan ketergantungan.</p>
<h3>Golongan I</h3>
<p>Narkotika yang hanya dapat digunakan untuk tujuan pengembangan ilmu pengetahuan dan tidak digunakan dalam terapi. Contoh: heroin, kokain, ganja, opium.</p>
<h3>Golongan II</h3>
<p>Narkotika yang berkhasiat pengobatan digunakan sebagai pilihan terakhir dan dapat digunakan dalam terapi. Contoh: morfin, fentanil.</p>
<h3>Golongan III</h3>
<p>Narkotika yang berkhasiat pengobatan dan banyak digunakan dalam terapi. Contoh: kodein.</p>`,
        category_id: 5
      },
      {
        judul: 'Pencegahan Dini: Lindungi Diri dari Bahaya Narkoba',
        slug: 'pencegahan-dini-narkoba',
        isi: `<h2>Langkah-Langkah Pencegahan</h2>
<p>Pencegahan penggunaan narkoba dimulai dari diri sendiri. Berikut langkah-langkah yang dapat Anda lakukan:</p>
<ul>
<li><strong>Tingkatkan pengetahuan</strong> tentang bahaya narkoba</li>
<li><strong>Pilih lingkungan pergaulan</strong> yang positif</li>
<li><strong>Kembangkan hobi</strong> dan aktivitas yang produktif</li>
<li><strong>Berani menolak</strong> ajakan menggunakan narkoba</li>
<li><strong>Laporkan</strong> jika mengetahui peredaran narkoba di sekitar Anda</li>
</ul>
<h3>Kenali Tanda-Tanda Pengguna</h3>
<p>Perubahan perilaku drastis, mata merah, penurunan prestasi akademik, sering mengantuk, dan perubahan lingkaran pertemanan.</p>`,
        category_id: 6
      },
      {
        judul: 'Regulasi dan Hukum Terkait Narkotika di Indonesia',
        slug: 'regulasi-hukum-narkotika',
        isi: `<h2>Undang-Undang No. 35 Tahun 2009</h2>
<p>UU tentang Narkotika mengatur secara komprehensif mengenai peredaran, penyalahgunaan, dan sanksi terkait narkotika di Indonesia.</p>
<h3>Sanksi Hukum</h3>
<ul>
<li><strong>Pengguna:</strong> Pidana penjara paling lama 4 tahun (Pasal 127)</li>
<li><strong>Pengedar:</strong> Pidana penjara paling singkat 5 tahun dan paling lama 20 tahun (Pasal 114)</li>
<li><strong>Produsen:</strong> Pidana penjara seumur hidup atau pidana mati (Pasal 113)</li>
</ul>
<p>Di lingkungan kampus, mahasiswa yang terbukti menggunakan narkoba juga terancam sanksi akademik berupa skorsing hingga dikeluarkan.</p>`,
        category_id: 7
      }
    ];

    for (const article of eduArticles) {
      await db.query(
        `INSERT IGNORE INTO education_articles (judul, slug, isi, category_id, status, author_id) VALUES (?, ?, ?, ?, 'terbit', 1)`,
        [article.judul, article.slug, article.isi, article.category_id]
      );
    }
    console.log('  ✅ Artikel Edukasi');

    // Berita contoh
    const newsItems = [
      {
        judul: 'Satgas Anti Narkoba Polinela Resmi Dibentuk',
        slug: 'satgas-resmi-dibentuk',
        isi: `<p>Politeknik Negeri Lampung resmi membentuk Satuan Tugas (Satgas) Anti Narkoba pada Juli 2025 bekerja sama dengan BNN Provinsi Lampung. Pembentukan ini merupakan langkah konkret dalam upaya pencegahan dan penanganan penyalahgunaan narkoba di lingkungan kampus.</p>
<p>Wakil Direktur III Polinela menyatakan bahwa pembentukan satgas ini bertujuan untuk menciptakan lingkungan kampus yang bersih dari narkoba dan memberikan perlindungan kepada seluruh civitas akademika.</p>`,
        tanggal: '2025-07-15'
      },
      {
        judul: 'Sosialisasi Bahaya Narkoba Bersama BNN Lampung',
        slug: 'sosialisasi-bnn-lampung',
        isi: `<p>Satgas Anti Narkoba Polinela bersama BNN Provinsi Lampung menyelenggarakan kegiatan sosialisasi bahaya narkoba yang diikuti oleh seluruh mahasiswa baru angkatan 2026.</p>
<p>Kegiatan ini bertujuan untuk meningkatkan kesadaran mahasiswa akan bahaya penyalahgunaan narkoba dan peran mereka dalam pencegahan.</p>`,
        tanggal: '2026-09-01'
      }
    ];

    for (const item of newsItems) {
      await db.query(
        `INSERT IGNORE INTO news (judul, slug, isi, tanggal, status, author_id) VALUES (?, ?, ?, ?, 'terbit', 1)`,
        [item.judul, item.slug, item.isi, item.tanggal]
      );
    }
    console.log('  ✅ Berita');

    // Agenda contoh
    const agendaItems = [
      {
        judul: 'Workshop Pencegahan Narkoba untuk Dosen dan Tendik',
        slug: 'workshop-pencegahan-dosen',
        isi: '<p>Workshop sehari penuh tentang cara mengenali dan mencegah penyalahgunaan narkoba di lingkungan kampus.</p>',
        tanggal: '2026-11-15',
        waktu: '08:00:00',
        lokasi: 'Aula Utama Polinela',
        category_id: 9
      },
      {
        judul: 'Seminar Nasional Anti Narkoba 2026',
        slug: 'seminar-nasional-2026',
        isi: '<p>Seminar nasional dengan pembicara dari BNN, Kepolisian, dan akademisi tentang strategi pemberantasan narkoba.</p>',
        tanggal: '2026-12-01',
        waktu: '09:00:00',
        lokasi: 'Gedung Serba Guna Polinela',
        category_id: 10
      },
      {
        judul: 'Kampanye "Kampus Bersih Narkoba"',
        slug: 'kampanye-kampus-bersih',
        isi: '<p>Kampanye besar-besaran di seluruh area kampus Polinela untuk menyatakan komitmen bebas narkoba.</p>',
        tanggal: '2026-12-15',
        waktu: '07:00:00',
        lokasi: 'Seluruh Area Kampus Polinela',
        category_id: 11
      }
    ];

    for (const item of agendaItems) {
      await db.query(
        `INSERT IGNORE INTO agendas (judul, slug, isi, tanggal, waktu, lokasi, category_id, status, author_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'terbit', 1)`,
        [item.judul, item.slug, item.isi, item.tanggal, item.waktu, item.lokasi, item.category_id]
      );
    }
    console.log('  ✅ Agenda');

    console.log('\n✅ Seeding selesai!');
    console.log('\n📋 Akun default:');
    console.log('   Super Admin: admin@satgas.polinela.ac.id / admin123');
    console.log('   Admin: anggota1@satgas.polinela.ac.id / satgas123');

  } catch (error) {
    console.error('❌ Seeding gagal:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
