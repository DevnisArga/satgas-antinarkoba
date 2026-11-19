# Sistem Informasi Satgas Anti Narkoba Polinela

Aplikasi web terpusat untuk pelaporan (anonim & teridentifikasi), pelacakan status, manajemen tindak lanjut, dashboard monitoring, serta konten edukasi/berita/agenda — Politeknik Negeri Lampung.

**Tim:** Devnis Arga Setiawan, Dina Aulia Nursabita, Nabila Ramadhani, Shofiyyah Nabila Putri, Yuda Aditya Putra

---

## Teknologi

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express.js
- **Database**: MySQL (XAMPP / phpMyAdmin)
- **Auth**: JWT + Bcrypt
- **Keamanan**: AES-256 (enkripsi identitas pelapor), CSPRNG (kode pelacakan), Rate Limiting, Helmet, express-validator

---

## Struktur Proyek

```
PM/
├── backend/      # REST API Express.js (port 5000)
├── frontend/     # React + Vite (port 5173)
└── PRD Sistem Informasi Satgas Anti Narkoba Polinela.md
```

---

## Cara Menjalankan

### Prasyarat

- Node.js v18+
- XAMPP aktif (MySQL port 3306)

### Backend

```bash
cd backend
npm install
npm run db:migrate   # buat database & tabel
npm run db:seed      # isi data awal + akun default
npm run dev          # http://localhost:5000
```

**Akun default hasil seeding:**

| Role | Email | Password |
|------|-------|----------|
| Super Admin (Ketua) | admin@satgas.polinela.ac.id | admin123 |
| Admin (Anggota) | anggota1@satgas.polinela.ac.id | satgas123 |

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## Halaman Tersedia

### Publik

| Path | Halaman |
|------|---------|
| `/` | Beranda |
| `/laporkan` | Formulir Pengaduan (wizard 3 langkah, anonim/teridentifikasi) |
| `/laporkan/eksternal` | Formulir Pihak Eksternal (Kepolisian/instansi) |
| `/lacak` | Lacak Status Laporan dengan kode pelacakan |
| `/edukasi` | Katalog Edukasi Narkoba |
| `/edukasi/:slug` | Detail Artikel Edukasi |
| `/berita` | Berita Satgas |
| `/berita/:slug` | Detail Berita |
| `/agenda` | Agenda Kegiatan |
| `/tentang` | Tentang Satgas |
| `/login` | Login Petugas/Admin |

### Dashboard Admin (`/admin`)

| Path | Halaman |
|------|---------|
| `/admin` | Dashboard Monitoring (KPI: total/baru/proses/selesai/ditolak, grafik per bulan/kategori/sumber) |
| `/admin/laporan` | Daftar Laporan (filter status/kategori/sumber/tanggal, pencarian kode) |
| `/admin/laporan/:id` | Detail & Tindak Lanjut Laporan (ubah status, catatan internal, penugasan, urgensi) |
| `/admin/edukasi` | Kelola Artikel Edukasi (CRUD, draft/terbit) |
| `/admin/berita` | Kelola Berita (CRUD, draft/terbit) |
| `/admin/agenda` | Kelola Agenda Kegiatan (CRUD) |
| `/admin/users` | Kelola Pengguna (Super Admin only) |

---

## Alur Laporan

**Pelaporan:** Beranda → Laporkan → pilih mode → isi kejadian → lampiran → konfirmasi → kode pelacakan

**Penanganan:** `Diterima` → verifikasi Admin → `Diverifikasi` (atau `Ditolak`) → `Ditindaklanjuti` → `Selesai`

**Status publik dapat dipantau** via `/lacak` dengan kode pelacakan (linimasa 4 tahap). Catatan internal tidak pernah tampil ke pelapor.

---

## RBAC

| Peran | Akses |
|-------|-------|
| Publik / Anonim | Kirim laporan, lacak dengan kode, baca konten |
| Pihak Eksternal | Kirim laporan via formulir khusus, lacak status |
| Admin (Anggota) | Kelola laporan, ubah status, catatan, dashboard, CMS konten |
| Super Admin (Ketua) | Semua akses Admin + kelola akun, ekspor, audit log |

---

## Keamanan

- Mode anonim: **tidak menyimpan** nama, NIM, kontak, maupun IP address
- Identitas pelapor teridentifikasi dienkripsi AES-256 di level aplikasi
- Kode pelacakan CSPRNG ≥ 12 karakter; database hanya menyimpan **hash** kode
- Format kode: `SATGAS-2026-XXXXXXXX` (internal) / `EXT-2026-XXXXXXXX` (eksternal)
- Password di-hash bcrypt; sesi JWT dengan kedaluwarsa
- Akses identitas pelapor dicatat di audit log; hanya peran berwenang yang dapat melihat
- Hardening: Helmet, Rate Limiting, CORS ketat, validasi input, parameterized queries

---

## API Endpoints

| Method | Endpoint | Akses |
|--------|----------|-------|
| POST | `/api/auth/login` · `/logout` | Admin |
| GET | `/api/auth/profile` | Admin |
| POST | `/api/reports` | Publik |
| POST | `/api/reports/external` | Publik |
| GET | `/api/track/:code` | Publik (rate limited) |
| GET | `/api/admin/reports` · `/:id` | Admin |
| PATCH | `/api/admin/reports/:id/status` | Admin |
| GET | `/api/admin/dashboard/stats` | Admin |
| CRUD | `/api/admin/education` · `/news` · `/agendas` | Admin |
| CRUD | `/api/admin/users` | Super Admin |
| GET | `/api/education` · `/news` · `/agendas` (+`/:slug`) | Publik |
