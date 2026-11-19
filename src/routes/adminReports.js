const express = require('express');
const { body, query, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { decrypt } = require('../utils/crypto');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// Semua route memerlukan autentikasi admin
router.use(authenticate, authorize('admin', 'super_admin', 'anggota'));

/**
 * GET /api/admin/members
 * Daftar Satgas aktif untuk dropdown penugasan
 */
router.get('/members', async (req, res) => {
  try {
    const [members] = await db.query(
      'SELECT id, nama FROM users WHERE aktif = 1 ORDER BY nama ASC'
    );
    res.json({ data: members });
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * GET /api/admin/reports
 * Daftar laporan dengan filter & pencarian (FR-5)
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category_id,
      source,
      urgency,
      search,
      date_from,
      date_to,
      sort = 'newest'
    } = req.query;

    let where = '1=1';
    const params = [];

    if (status) {
      where += ' AND r.status = ?';
      params.push(status);
    }
    if (category_id) {
      where += ' AND r.category_id = ?';
      params.push(category_id);
    }
    if (source) {
      where += ' AND r.source = ?';
      params.push(source);
    }
    if (urgency) {
      where += ' AND r.urgency = ?';
      params.push(urgency);
    }
    if (date_from) {
      where += ' AND r.created_at >= ?';
      params.push(date_from);
    }
    if (date_to) {
      where += ' AND r.created_at <= ?';
      params.push(date_to + ' 23:59:59');
    }

    // Pencarian berdasarkan deskripsi atau lokasi
    if (search) {
      where += ' AND (r.description LIKE ? OR r.location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const orderBy = sort === 'oldest' ? 'r.created_at ASC' : 'r.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Count total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM reports r WHERE ${where}`,
      params
    );

    // Get reports
    const [reports] = await db.query(
      `SELECT r.*, c.nama as kategori, u.nama as assigned_name
       FROM reports r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.assigned_to = u.id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: reports,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin reports list error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * GET /api/admin/reports/rekap-pdf
 * Unduh rekap laporan dalam format PDF, bisa filter per bulan atau rentang tanggal
 */
router.get('/rekap-pdf', async (req, res) => {
  try {
    const { date_from, date_to, bulan, tahun } = req.query;

    let where = '1=1';
    const params = [];

    if (bulan && tahun) {
      where += ' AND MONTH(r.created_at) = ? AND YEAR(r.created_at) = ?';
      params.push(parseInt(bulan), parseInt(tahun));
    } else {
      if (date_from) {
        where += ' AND DATE(r.created_at) >= ?';
        params.push(date_from);
      }
      if (date_to) {
        where += ' AND DATE(r.created_at) <= ?';
        params.push(date_to);
      }
    }

    const [reports] = await db.query(
      `SELECT r.id, r.source, r.mode, r.location, r.incident_date, r.urgency, r.status, r.created_at,
              c.nama as kategori, u.nama as assigned_name
       FROM reports r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.assigned_to = u.id
       WHERE ${where}
       ORDER BY r.created_at DESC`,
      params
    );

    const total = reports.length;
    const byStatus = {}, bySource = {}, byUrgency = {};
    for (const r of reports) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      bySource[r.source] = (bySource[r.source] || 0) + 1;
      byUrgency[r.urgency || 'sedang'] = (byUrgency[r.urgency || 'sedang'] || 0) + 1;
    }

    const BULAN_ID = ['','Januari','Februari','Maret','April','Mei','Juni',
                        'Juli','Agustus','September','Oktober','November','Desember'];
    let judulPeriode = 'Semua Data';
    if (bulan && tahun) judulPeriode = `${BULAN_ID[parseInt(bulan)]} ${tahun}`;
    else if (date_from || date_to) judulPeriode = `${date_from || '-'} s/d ${date_to || '-'}`;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap_Laporan_${judulPeriode.replace(/[^a-zA-Z0-9]/g,'_')}.pdf"`);
    doc.pipe(res);

    // ---- HEADER ----
    doc.fontSize(16).font('Times-Bold').fillColor('#000000').text('SATGAS ANTI NARKOBA', { align: 'center' });
    doc.fontSize(12).font('Times-Bold').text('POLITEKNIK NEGERI LAMPUNG (POLINELA)', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).font('Times-Bold').text('REKAPITULASI LAPORAN', { align: 'center' });
    doc.fontSize(10).font('Times-Roman').text(`Periode: ${judulPeriode}`, { align: 'center' });
    doc.moveDown(0.3);
    // Garis double header
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).stroke('#000000');
    doc.moveDown(0.1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#000000');
    doc.moveDown(0.6);

    // ---- RINGKASAN ----
    doc.fillColor('#000000').fontSize(11).font('Times-Bold').text('I. RINGKASAN');
    doc.moveDown(0.3);
    const colX1 = 55, colX2 = 200, colX3 = 345;
    const startY = doc.y;
    doc.fontSize(10).font('Times-Bold').text('Total Laporan:', colX1, startY);
    doc.font('Times-Roman').text(`${total} laporan`, colX1, startY + 15);

    doc.font('Times-Bold').text('Berdasarkan Status:', colX2, startY);
    let ys2 = startY + 15;
    for (const [st, cnt] of Object.entries(byStatus)) {
      doc.font('Times-Roman').text(`${st}: ${cnt}`, colX2, ys2);
      ys2 += 13;
    }

    doc.font('Times-Bold').text('Berdasarkan Urgensi:', colX3, startY);
    let ys3 = startY + 15;
    for (const [urg, cnt] of Object.entries(byUrgency)) {
      doc.font('Times-Roman').text(`${urg}: ${cnt}`, colX3, ys3);
      ys3 += 13;
    }

    const maxRows = Math.max(Object.keys(byStatus).length, Object.keys(byUrgency).length);
    doc.moveDown(maxRows + 1.2);

    const srcParts = Object.entries(bySource).map(([s,c]) => `${s}: ${c}`).join('   |   ');
    doc.fontSize(10).font('Times-Roman').text(`Sumber Laporan: ${srcParts}`, colX1);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#000000');
    doc.moveDown(0.6);

    // ---- TABEL ----
    doc.fillColor('#000000').fontSize(11).font('Times-Bold').text('II. DAFTAR LAPORAN');
    doc.moveDown(0.4);

    if (reports.length === 0) {
      doc.fontSize(10).font('Times-Roman').text('Tidak ada laporan pada periode yang dipilih.', { align: 'center' });
    } else {
      // Lebar total 495 (dari x=50 sampai 545, pas margin A4)
      const colWidths = [25, 160, 50, 50, 70, 70, 70];
      const colXs = [50];
      for (let i = 1; i < colWidths.length; i++) {
        colXs.push(colXs[i - 1] + colWidths[i - 1]);
      }
      const totalW = colWidths.reduce((a, b) => a + b, 0); // 495
      const headers = ['No.', 'Kategori & Lokasi', 'Sumber', 'Urgensi', 'Status', 'Tgl Kejadian', 'Tgl Masuk'];
      const headerH = 20;

      // Fungsi gambar header tabel (polos formal dengan grid hitam)
      const drawTableHeader = (y) => {
        // Border kotak header
        doc.rect(50, y, totalW, headerH).lineWidth(0.5).stroke('#000000');
        // Garis vertikal pemisah kolom
        for (let i = 1; i < colXs.length; i++) {
          doc.moveTo(colXs[i], y).lineTo(colXs[i], y + headerH).lineWidth(0.5).stroke('#000000');
        }
        // Teks header
        headers.forEach((text, i) => {
          doc.fillColor('#000000').fontSize(9).font('Times-Bold')
            .text(text, colXs[i] + 3, y + 5, {
              width: colWidths[i] - 6,
              align: i === 0 ? 'center' : 'left',
              lineBreak: false
            });
        });
      };

      let rowY = doc.y;
      drawTableHeader(rowY);
      rowY += headerH;

      reports.forEach((r, idx) => {
        const tglK = r.incident_date
          ? new Date(r.incident_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-';
        const tglM = r.created_at
          ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-';
        
        // Format kategori dan lokasi rapi
        const kategoriLokasi = `${r.kategori || '-'}\nLokasi: ${r.location || '-'}`;
        const sumber = r.source === 'eksternal' ? 'Eksternal' : 'Internal';
        const urgensi = (r.urgency || 'sedang').charAt(0).toUpperCase() + (r.urgency || 'sedang').slice(1);
        const status = r.status.charAt(0).toUpperCase() + r.status.slice(1);

        const cells = [
          String(idx + 1),
          kategoriLokasi,
          sumber,
          urgensi,
          status,
          tglK,
          tglM
        ];

        // Hitung tinggi dinamis berdasarkan teks terpanjang (agar tidak tabrakan/overlap garis)
        doc.fontSize(8.5).font('Times-Roman');
        let maxCellH = 14;
        cells.forEach((cellText, i) => {
          const h = doc.heightOfString(cellText, { width: colWidths[i] - 8 });
          if (h > maxCellH) maxCellH = h;
        });

        const rowH = Math.max(18, Math.ceil(maxCellH + 8));

        // Cek jika halaman habis, buat halaman baru
        if (rowY + rowH > 760) {
          doc.addPage();
          rowY = 50;
          drawTableHeader(rowY);
          rowY += headerH;
        }

        // Gambar border baris data (polos hitam putih standar kedinasan/akademik)
        doc.rect(50, rowY, totalW, rowH).lineWidth(0.5).stroke('#000000');
        for (let i = 1; i < colXs.length; i++) {
          doc.moveTo(colXs[i], rowY).lineTo(colXs[i], rowY + rowH).lineWidth(0.5).stroke('#000000');
        }

        // Cetak teks tiap cell di dalam batas kotak
        cells.forEach((cellText, i) => {
          doc.fillColor('#000000').fontSize(8.5).font('Times-Roman')
            .text(cellText, colXs[i] + 4, rowY + 4, {
              width: colWidths[i] - 8,
              align: i === 0 ? 'center' : 'left'
            });
        });

        rowY += rowH;
      });

      doc.y = rowY + 10;
    }

    // ---- FOOTER ----
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#000000');
    doc.moveDown(0.3);
    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.fontSize(9).font('Times-Roman').fillColor('#000000')
      .text(`Dicetak pada: ${tglCetak}   |   Sistem Informasi Satgas Anti Narkoba — Politeknik Negeri Lampung`, { align: 'center' });
    doc.end();

  } catch (error) {
    console.error('Rekap PDF error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat rekap PDF.' });
  }
});

/**
 * GET /api/admin/reports/:id
 * Detail laporan (FR-5)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await db.query(
      `SELECT r.*, c.nama as kategori, u.nama as assigned_name
       FROM reports r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.assigned_to = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const report = reports[0];

    // Ambil attachments
    const [attachments] = await db.query(
      'SELECT * FROM report_attachments WHERE report_id = ?',
      [id]
    );

    // Ambil status logs
    const [statusLogs] = await db.query(
      `SELECT sl.*, u.nama as changed_by_name
       FROM report_status_logs sl
       LEFT JOIN users u ON sl.changed_by = u.id
       WHERE sl.report_id = ?
       ORDER BY sl.created_at ASC`,
      [id]
    );

    // Ambil info reporter (hanya super_admin atau role berwenang)
    let reporter = null;
    if (report.mode === 'teridentifikasi') {
      const [reporters] = await db.query(
        'SELECT * FROM report_reporters WHERE report_id = ?',
        [id]
      );
      if (reporters.length > 0) {
        // Hanya super_admin yang bisa melihat identitas (FR-5, §8)
        if (req.user.role === 'super_admin') {
          reporter = {
            nama: decrypt(reporters[0].nama_encrypted),
            nim_nip: decrypt(reporters[0].nim_nip_encrypted),
            telepon: decrypt(reporters[0].telepon_encrypted),
            email: decrypt(reporters[0].email_encrypted)
          };
          await logAudit(req.user.id, 'VIEW_REPORTER_IDENTITY', `report:${id}`, null, req.ip);
        } else {
          reporter = { restricted: true, message: 'Hanya Satgas yang berwenang yang dapat melihat identitas pelapor.' };
        }
      }
    }

    // Ambil info eksternal
    let externalInfo = null;
    if (report.source === 'eksternal') {
      const [extInfo] = await db.query(
        'SELECT * FROM report_external_info WHERE report_id = ?',
        [id]
      );
      if (extInfo.length > 0) {
        externalInfo = extInfo[0];
      }
    }

    // Pesan
    const [messages] = await db.query(
      'SELECT * FROM report_messages WHERE report_id = ? ORDER BY created_at ASC',
      [id]
    );

    res.json({
      ...report,
      attachments,
      status_logs: statusLogs,
      reporter,
      external_info: externalInfo,
      messages
    });

  } catch (error) {
    console.error('Admin report detail error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * PATCH /api/admin/reports/:id/status
 * Ubah status laporan (FR-5)
 */
router.patch('/:id/status', authorize('super_admin'), [
  body('status').isIn(['diterima', 'diverifikasi', 'ditindaklanjuti', 'selesai', 'ditolak']).withMessage('Status tidak valid.'),
  body('public_note').optional().isString(),
  body('internal_note').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, public_note, internal_note } = req.body;

    // Ambil status saat ini
    const [reports] = await db.query('SELECT status FROM reports WHERE id = ?', [id]);
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const currentStatus = reports[0].status;

    // Update status
    await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, id]);

    // Log perubahan status
    await db.query(
      `INSERT INTO report_status_logs (report_id, from_status, to_status, public_note, internal_note, changed_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, currentStatus, status, public_note || null, internal_note || null, req.user.id]
    );

    await logAudit(req.user.id, 'CHANGE_STATUS', `report:${id}`, `${currentStatus} → ${status}`, req.ip);

    res.json({ message: 'Status berhasil diperbarui.', from: currentStatus, to: status });

  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * PATCH /api/admin/reports/:id/assign
 * Penugasan ke anggota (FR-5)
 */
router.patch('/:id/assign', [
  body('assigned_to').notEmpty().withMessage('Anggota harus dipilih.').isNumeric().withMessage('ID anggota tidak valid.').toInt(),
  body('urgency').optional().isIn(['rendah', 'sedang', 'tinggi'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { assigned_to, urgency } = req.body;

    const updates = ['assigned_to = ?'];
    const params = [assigned_to];

    if (urgency) {
      updates.push('urgency = ?');
      params.push(urgency);
    }

    params.push(id);
    await db.query(`UPDATE reports SET ${updates.join(', ')} WHERE id = ?`, params);

    await logAudit(req.user.id, 'ASSIGN_REPORT', `report:${id}`, `assigned_to:${assigned_to}`, req.ip);

    res.json({ message: 'Penugasan berhasil.' });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
