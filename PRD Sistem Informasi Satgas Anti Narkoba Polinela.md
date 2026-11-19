# PRD — Sistem Informasi Satgas Anti Narkoba Berbasis Website

**Studi Kasus:** Politeknik Negeri Lampung · **Versi:** 1.0 (Draft) · **Tanggal:** 4 Oktober 2026 **Tim:** Devnis Arga Setiawan, Dina Aulia Nursabita, Nabila Ramadhani, Shofiyyah Nabila Putri, Yuda Aditya Putra **Sumber:** Proposal Proyek Mandiri + desain Stitch (Beranda, Laporkan, Lacak Laporan)

---

## 1. Ringkasan

Satgas Anti Narkoba Polinela (dibentuk Juli 2025 bersama BNN Provinsi Lampung) saat ini memakai Google Form untuk pelaporan dan Instagram untuk edukasi. Data tidak terpusat, tindak lanjut tidak punya alur baku, rekap manual lewat Word. Sejak Google Form dibuka, **belum ada laporan dari mahasiswa** (diduga takut identitas bocor); semua kasus datang dari kepolisian via Wakil Direktur III, sehingga Satgas bersifat reaktif.

**Produk:** website terpusat untuk pelaporan (anonim & teridentifikasi), pelacakan status, manajemen tindak lanjut oleh Satgas, dashboard monitoring, modul pihak eksternal, serta konten edukasi/berita/agenda.

## 2. Tujuan & Metrik Keberhasilan

| Tujuan | Metrik | Target (6 bulan setelah rilis) |
| --- | --- | --- |
| Menumbuhkan kepercayaan pelapor internal | Jumlah laporan dari mahasiswa/dosen/tendik | ≥ 1 laporan valid pertama dalam 1 bulan; tren naik |
| Menggantikan rekap manual | % laporan tercatat & diproses di sistem | 100% |
| Transparansi | % laporan yang memiliki status terbarui ≤ 3 hari kerja | ≥ 90% |
| Dokumentasi kasus eksternal | % laporan kepolisian masuk lewat modul eksternal | ≥ 80% |
| Kualitas | Lulus Blackbox Testing semua test case kritis | 100% |

**Non-goals:** aplikasi mobile native, integrasi API BNN/Kepolisian, pembayaran, prediksi/analitik lanjutan, notifikasi real-time (fase lanjutan).

## 3. Pengguna & Peran (RBAC)

| Peran | Deskripsi | Akses |
| --- | --- | --- |
| **Publik / Pelapor Anonim** | Mahasiswa, dosen, tendik, atau masyarakat tanpa akun | Lihat konten publik, kirim laporan, lacak dengan kode |
| **Pelapor Teridentifikasi** | Bersedia dihubungi (mengisi nama, NIM/NIP, kontak) | Sama seperti di atas + dapat dihubungi Satgas |
| **Pihak Eksternal** | Kepolisian/masyarakat via formulir khusus | Kirim laporan resmi, lacak status |
| **Admin Satgas (Anggota)** | Verifikator & penindak lanjut | Kelola laporan, ubah status, catatan internal, dashboard |
| **Ketua Satgas / Super Admin** | Penanggung jawab | Semua akses admin + kelola akun, konten, rekap/ekspor, audit log |

## 4. Inventaris Desain Stitch vs Kebutuhan Proposal

| Halaman | Status desain | Catatan |
| --- | --- | --- |
| Beranda | ✅ Ada | Hero, jaminan keamanan, alasan melapor, 4 langkah, preview edukasi/berita/agenda |
| Laporkan (3 langkah) | ✅ Ada | Pilih mode anonim/teridentifikasi → Kejadian → Pendukung → Konfirmasi → kode pelacakan |
| Lacak Laporan | ✅ Ada | Input kode, detail & linimasa 4 tahap |
| Edukasi, Berita, Agenda, Tentang Satgas | ⚠️ Hanya di navigasi | Perlu didesain (list + detail) |
| Login | ⚠️ Hanya tombol | Perlu halaman login Admin |
| **Dashboard Admin** (monitoring, daftar laporan, detail & ubah status, rekap) | ❌ Belum ada | Wajib sesuai proposal (FR-5, FR-6) |
| **Formulir Pihak Eksternal** | ❌ Belum ada | Wajib sesuai proposal (FR-2) |
| CMS Edukasi/Berita/Agenda (admin) | ❌ Belum ada | Konten dinamis dari database |

### Temuan perlu diperbaiki pada desain

1. **Format kode pelacakan tidak konsisten:** form menampilkan `SATGAS-2026-8F42K`, halaman lacak mengharapkan `TRK-XXXX-POLINELA`. Tetapkan satu format.
2. **Ringkasan konfirmasi hardcoded** (kategori, lokasi, tanggal). Harus diambil dari input pengguna.
3. **Klaim keamanan berlebihan:** "100% Terenkripsi", "dilindungi sepenuhnya oleh undang-undang", "Terenkripsi SHA-256" (hash bukan enkripsi). Ganti dengan klaim yang bisa dipertanggungjawabkan (lihat §8).
4. **Tahun footer 2024 dan tanggal contoh 2024** → sesuaikan 2026; data dummy diganti data dinamis.
5. Validasi form belum ada (kolom wajib bertanda `*`, kategori default "Pilih…"); tambahkan validasi & status error.
6. Navigasi `xl:` saja — pastikan menu mobile (hamburger) tersedia.
7. Tombol "Chat Panduan Bantuan" dan "Lupa kode pelacakan?" belum punya fungsi → tentukan perilaku atau hapus. (Catatan: kode anonim memang tidak bisa dipulihkan; tampilkan pesan jujur.)
8. Mode teridentifikasi: field identitas ber-label "Opsional Terverifikasi" membingungkan → ganti jadi "Data kontak (agar Satgas dapat menghubungi Anda)".

## 5. Kebutuhan Fungsional

Prioritas: **P0** = wajib MVP, **P1** = penting, **P2** = fase lanjutan.

### FR-1 Pelaporan Anonim & Teridentifikasi (P0)

- FR-1.1 Pemilihan mode pelaporan (anonim default).
- FR-1.2 Form langkah 1: kategori (Penyalahgunaan/Konsumsi di Kampus; Dugaan Peredaran; Kepemilikan Barang Terlarang; Lainnya), lokasi, tanggal, waktu, deskripsi (min. 30 karakter).
- FR-1.3 Langkah 2: pihak terlibat (opsional), unggah bukti (JPG, PNG, MP4, PDF; maks. 25 MB/file, maks. 5 file), informasi tambahan.
- FR-1.4 Mode anonim **tidak menyimpan** nama, NIM, kontak, maupun IP address; mode teridentifikasi menampilkan kolom identitas.
- FR-1.5 Langkah 3: ringkasan dinamis + persetujuan pernyataan; submit.
- FR-1.6 Sistem membuat **kode pelacakan unik** yang tidak dapat ditebak, ditampilkan sekali dengan tombol salin/unduh, disertai peringatan "simpan kode, tidak dapat dipulihkan".
- FR-1.7 Metadata (EXIF/lokasi) pada foto/video dibersihkan otomatis sebelum disimpan.
- FR-1.8 Perlindungan spam: rate limiting + CAPTCHA.

### FR-2 Modul Pelaporan Pihak Eksternal (P0)

- Formulir khusus untuk kepolisian/masyarakat: instansi, nama petugas/pelapor, kontak, nomor surat/referensi (opsional), ringkasan kasus, pihak terkait (mahasiswa/dosen/tendik), lampiran surat.
- Masuk ke antrean yang sama dengan penanda sumber "Eksternal"; kode pelacakan dengan prefiks berbeda.

### FR-3 Pelacakan Status (P0)

- Input kode → tampilkan kategori, tanggal kirim, lokasi, pembaruan terakhir, status & linimasa.
- Tahap: **Diterima → Diverifikasi → Ditindaklanjuti → Selesai** (+ **Ditolak/Tidak Valid** dengan alasan ringkas).
- Hanya informasi non-sensitif yang tampil ke pelapor; catatan internal tidak pernah ditampilkan.
- Kode tidak ditemukan → pesan generik; rate limit percobaan.
- Pesan/pertanyaan dari Satgas kepada pelapor anonim dapat ditampilkan di halaman lacak (P1), pelapor membalas lewat kode yang sama.
- Cetak bukti laporan (tanpa data sensitif).

### FR-4 Edukasi, Berita, Agenda, Tentang Satgas (P0 publik, P1 CMS)

- Daftar + detail + filter kategori untuk Edukasi (Jenis Narkotika, Pencegahan Dini, Regulasi & Hukum), Berita, Agenda (Workshop/Seminar/Kampanye, tanggal, lokasi).
- Beranda menampilkan 3 edukasi, 2 berita, 3 agenda terbaru secara dinamis.
- Halaman Tentang Satgas: profil, struktur, dasar pembentukan, kontak/hotline.
- Admin dapat CRUD konten (judul, isi, gambar, kategori, status draft/terbit).

### FR-5 Manajemen Laporan oleh Satgas (P0)

- Daftar laporan: pencarian (kode), filter (status, kategori, sumber, tanggal), urutan terbaru.
- Detail laporan: seluruh isi, bukti (lihat/unduh), identitas (jika ada, hanya peran berwenang).
- Ubah status dengan catatan; tiap perubahan tercatat (siapa, kapan, dari→ke) dan tampil di linimasa publik sesuai teks yang aman.
- Penugasan ke anggota Satgas, tingkat urgensi (Rendah/Sedang/Tinggi), catatan internal.
- Lampiran hasil tindak lanjut (mis. surat rekomendasi tindakan) saat status Selesai.
- Deteksi indikasi duplikat (kategori + lokasi + tanggal serupa) (P1).

### FR-6 Dashboard Monitoring & Rekapitulasi (P0)

- Kartu ringkas: total laporan, baru, dalam proses, selesai, ditolak.
- Grafik: laporan per bulan, per kategori, per lokasi, per sumber (internal/eksternal/anonim).
- Rekap bulanan/tahunan otomatis; ekspor PDF/Excel menggantikan rekap manual Word (PDF/Excel: P1).

### FR-7 Autentikasi & Hak Akses (P0)

- Login Admin (email + kata sandi), logout, sesi dengan kedaluwarsa, ganti/reset kata sandi.
- RBAC sesuai §3; Super Admin mengelola akun anggota.
- Pelapor **tidak wajib** punya akun. Tombol "Login" di header hanya untuk staf.
- Audit log: login, lihat identitas pelapor, ubah status, ekspor.

## 6. Alur Utama

**Alur pelaporan:** Beranda → Laporkan → pilih mode → isi kejadian → pendukung → konfirmasi → kode pelacakan → (opsional) Lacak.

**Alur penanganan:** `Diterima` → verifikasi oleh Admin → `Diverifikasi` (atau `Ditolak`) → `Ditindaklanjuti` (koordinasi/penugasan/surat rekomendasi) → `Selesai` (hasil & rekomendasi diarsipkan).

## 7. Model Data (ERD ringkas)

| Tabel | Atribut utama |
| --- | --- |
| `users` | id, nama, email, password_hash, role, aktif, created_at |
| `reports` | id, tracking_code_hash, source (internal/eksternal), mode (anon/ident), category_id, location, incident_date, incident_time, description, involved_parties, extra_info, urgency, status, assigned_to, created_at, updated_at |
| `report_reporters` | report_id, nama, nim_nip, telepon, email (**terenkripsi**; hanya mode teridentifikasi) |
| `report_external_info` | report_id, instansi, nama_petugas, kontak, no_referensi |
| `report_attachments` | id, report_id, file_path, mime, size |
| `report_status_logs` | id, report_id, from_status, to_status, public_note, internal_note, changed_by, created_at |
| `report_messages` | id, report_id, sender (satgas/pelapor), message, created_at (P1) |
| `categories` | id, nama, tipe (laporan/edukasi/berita/agenda) |
| `education_articles`, `news`, `agendas` | id, judul, slug, isi, gambar, category_id, status, tanggal, lokasi (agenda), author_id |
| `audit_logs` | id, user_id, aksi, target, ip, created_at |

Relasi: `reports` 1—N `report_attachments`, `report_status_logs`, `report_messages`; `reports` 1—0..1 `report_reporters`, `report_external_info`; `users` 1—N `reports` (assigned_to).

## 8. Keamanan & Privasi (Inti Kepercayaan Pelapor)

- **Anonimitas nyata:** mode anonim tidak menyimpan identitas, tidak mencatat IP di log aplikasi/laporan, tidak memakai cookie pelacak; konfigurasi reverse proxy/server tidak menyimpan IP untuk endpoint `/reports`.
- **Kode pelacakan:** acak ≥ 12 karakter (CSPRNG); di database hanya disimpan **hash** kode (identitas tidak bisa dipulihkan dari DB).
- **Enkripsi:** HTTPS wajib; data identitas pelapor dienkripsi di level aplikasi (mis. AES-256-GCM, kunci di environment/secret, bukan di repo); kata sandi di-hash (bcrypt/argon2). Proposal menyebut RSA sebagai opsi enkripsi pada WBS—evaluasi, namun AES untuk data bidang lebih praktis.
- **Akses terbatas:** identitas pelapor hanya terlihat Ketua/peran tertentu dan setiap akses dicatat di audit log.
- **Berkas:** whitelist tipe, pemindaian ukuran, nama file diacak, disimpan di luar web root, bersihkan metadata.
- **Hardening:** validasi input (anti SQL injection/XSS), parameterized queries, CORS ketat, helmet, rate limit, CSRF untuk sesi admin, backup terenkripsi terjadwal.
- **Teks klaim di UI:** gunakan "data identitas dienkripsi dan hanya dapat diakses pihak berwenang" dan hindari janji absolut (mis. "100%", "dijamin oleh undang-undang") sebelum dikonfirmasi legal/Satgas.

## 9. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Performa | Halaman publik \< 3 dtk (jaringan 4G); API respons rata-rata \< 500 ms |
| Ketersediaan | Target ≥ 99% pada jam kerja; backup harian |
| Responsif | Mobile-first (≥ 360 px), browser Chrome/Edge/Firefox/Safari terbaru |
| Aksesibilitas | Kontras WCAG AA, label form, navigasi keyboard |
| Usability | Pelaporan selesai ≤ 5 menit; maks. 3 langkah |
| Maintainability | Struktur MVC/modular, dokumentasi API, ESLint |
| Bahasa | Bahasa Indonesia |

## 10. Arsitektur & Tech Stack (sesuai proposal)

- **Front-end:** React.js + Vite; styling Tailwind CSS (token warna/tipografi dari Stitch: primary `#000f22`, primary-container `#0a2540`, secondary `#006a61`, error `#ba1a1a`, font Inter, ikon Material Symbols); Axios/Fetch.
- **Back-end:** Node.js + Express.js (REST API, middleware auth/validasi); JWT/sesi httpOnly untuk admin.
- **Database:** MySQL (phpMyAdmin/XAMPP untuk lokal).
- **Tools:** Figma/Stitch, VS Code, Git. **Hosting:** VPS/hosting Node.js + HTTPS.

**Contoh endpoint**

| Method | Endpoint | Akses |
| --- | --- | --- |
| POST | `/api/reports` | Publik (anonim/ident) |
| POST | `/api/reports/external` | Publik (modul eksternal) |
| GET | `/api/track/:code` | Publik (rate limited) |
| POST | `/api/auth/login` · `/logout` | Admin |
| GET | `/api/admin/reports` · `/:id` | Admin |
| PATCH | `/api/admin/reports/:id/status` | Admin |
| GET | `/api/admin/dashboard/stats` | Admin |
| GET | `/api/admin/reports/export?format=pdf\|xlsx` | Admin |
| GET | `/api/education` · `/news` · `/agendas` (+`/:slug`) | Publik |
| CRUD | `/api/admin/education` · `/news` · `/agendas` | Admin |
| CRUD | `/api/admin/users` | Super Admin |

## 11. Kriteria Penerimaan (contoh untuk Blackbox Testing)

| ID | Skenario | Hasil yang diharapkan |
| --- | --- | --- |
| AC-1 | Kirim laporan anonim valid | Tersimpan, kode pelacakan tampil, tidak ada data identitas/IP di DB |
| AC-2 | Kirim form dengan kolom wajib kosong | Pesan validasi, laporan tidak terkirim |
| AC-3 | Unggah file .exe atau > 25 MB | Ditolak dengan pesan jelas |
| AC-4 | Lacak dengan kode benar | Status & linimasa sesuai; catatan internal tidak tampil |
| AC-5 | Lacak dengan kode salah berulang | Pesan generik, lalu dibatasi (rate limit) |
| AC-6 | Admin ubah status | Linimasa publik & audit log terbarui |
| AC-7 | Anggota biasa membuka identitas pelapor | Ditolak (403) bila tidak berwenang |
| AC-8 | Kirim laporan eksternal | Masuk antrean dengan tanda "Eksternal" |
| AC-9 | Dashboard | Angka cocok dengan data laporan |
| AC-10 | Akses di mobile & 3 browser | Layout & fungsi normal |

## 12. Rencana Rilis (selaras jadwal Sep–Des 2026)

| Fase | Waktu | Isi |
| --- | --- | --- |
| 0 | Sep | Finalisasi PRD, lengkapi desain yang kurang (admin, eksternal, login, halaman konten), perbaiki temuan §4 |
| 1 | Okt | Back-end: DB, auth/RBAC, API laporan & lacak; front-end publik (Beranda, Laporkan, Lacak) |
| 2 | Nov | Modul eksternal, dashboard & manajemen laporan, CMS & halaman konten, rekap/ekspor |
| 3 | Des | Blackbox testing + perbaikan, uji keamanan dasar, deploy, UAT dengan Satgas, ujian PM |
| Pasca | 2027 | Notifikasi, pesan dua arah, ekspor lanjutan, pemeliharaan korektif/adaptif/perfektif |

**Pembagian tugas (sesuai proposal):** Frontend – Devnis; Backend – Dina; UI/UX & laporan – Nabila; analisis backend/frontend & laporan – Shofiyyah; analis/laporan – Yuda.

## 13. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Mahasiswa tetap tidak percaya | Laporan internal nol | Anonimitas teknis nyata, komunikasi transparan, sosialisasi via Instagram & agenda |
| Kebocoran identitas/bukti | Reputasi & keselamatan pelapor | Enkripsi, RBAC, audit log, bersihkan metadata |
| Laporan palsu/spam | Beban verifikasi | CAPTCHA, rate limit, tahap verifikasi |
| Lingkup melebar (desain kurang dari proposal) | Jadwal 4 bulan terlewat | Patok MVP P0, P1/P2 setelah UAT |
| Server/hosting tidak aman | Data bocor | HTTPS, patch rutin, backup |

## 14. Pertanyaan Terbuka (perlu konfirmasi Satgas)

1. Siapa yang berhak melihat identitas pelapor teridentifikasi, dan SOP etiknya?
2. Berapa lama data laporan disimpan (retensi) dan siapa yang berwenang menghapus?
3. Format surat rekomendasi tindakan yang harus dihasilkan sistem (template).
4. Apakah hotline `+62 721 703995` benar milik Satgas (bukan nomor umum kampus)?
5. Bagaimana hubungan dengan Wakil Direktur III dan BNN Provinsi Lampung dalam alur eskalasi?
6. Apakah diperlukan persetujuan hukum/etik untuk menyimpan bukti foto/video?
7. Apakah sistem boleh menyimpan aset gambar kegiatan (hak cipta/izin foto)?