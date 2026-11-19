import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Clock, FileText, User, AlertTriangle, 
  CheckCircle2, Send, Download, Lock, UserCheck, Printer, FileSignature, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getUploadUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import ModalSuratRekomendasi from '../../components/admin/ModalSuratRekomendasi';

/**
 * Format nomor HP Indonesia ke format internasional WA (628xxx)
 */
function formatWANumber(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return '62' + digits;
}

/**
 * Buat link WA dengan pesan template undangan menjadi saksi
 */
function buildWALink(phone, nama, reportId) {
  const waNumber = formatWANumber(phone);
  if (!waNumber) return null;
  const pesan = `Assalamualaikum, Yth. ${nama || 'Bapak/Ibu'}.\n\nKami dari Satgas Anti Narkoba Polinela ingin menghubungi Anda terkait laporan kasus #${reportId} yang telah Anda sampaikan.\n\nKami memerlukan keterangan Anda sebagai saksi dalam proses penanganan kasus ini. Mohon kesediaannya untuk dapat dihubungi atau hadir sesuai jadwal yang akan kami informasikan.\n\nTerima kasih atas perhatian dan kerjasamanya.\n\nSalam,\nSatgas Anti Narkoba Polinela`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`;
}

export default function DetailLaporan() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalSuratOpen, setModalSuratOpen] = useState(false);

  // Form Ubah Status
  const [newStatus, setNewStatus] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Form Penugasan
  const [assignedTo, setAssignedTo] = useState('');
  const [urgency, setUrgency] = useState('');
  const [members, setMembers] = useState([
    { id: 1, nama: 'Satgas 1' },
    { id: 2, nama: 'Satgas 2' }
  ]);

  useEffect(() => {
    fetchDetail();
    fetchMembers();
  }, [id]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/admin/reports/members');
      if (res.data?.data && res.data.data.length > 0) {
        setMembers(res.data.data);
      }
    } catch (err) {
      try {
        const res2 = await api.get('/admin/members');
        if (res2.data?.data && res2.data.data.length > 0) {
          setMembers(res2.data.data);
        }
      } catch (err2) {
        console.error('Fetch members fallback error:', err2);
      }
    }
  };

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/admin/reports/${id}`);
      setReport(res.data);
      setNewStatus(res.data.status);
      setUrgency(res.data.urgency || 'sedang');
      setAssignedTo(res.data.assigned_to ? String(res.data.assigned_to) : '');
    } catch (err) {
      console.error('Fetch detail report error:', err);
      toast.error('Gagal memuat detail laporan dari database.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.patch(`/admin/reports/${id}/status`, {
        status: newStatus,
        public_note: publicNote,
        internal_note: internalNote
      });
      toast.success('Status laporan berhasil diperbarui!');
      setPublicNote('');
      setInternalNote('');
      fetchDetail();
    } catch (err) {
      console.error('Update status error:', err);
      const errMsg = err.response?.data?.error || 'Gagal memperbarui status ke database.';
      toast.error(errMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAssign = async () => {
    if (!assignedTo) {
      toast.error('Pilih Satgas terlebih dahulu.');
      return;
    }
    try {
      await api.patch(`/admin/reports/${id}/assign`, {
        assigned_to: parseInt(assignedTo, 10),
        urgency
      });
      toast.success('Penugasan berhasil disimpan ke database');
      fetchDetail();
    } catch (err) {
      console.error('Assign error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal menyimpan penugasan ke database.';
      toast.error(errMsg);
    }
  };

  if (!report) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link to="/admin/laporan" className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Laporan
        </Link>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(user.role === 'admin' || user.role === 'super_admin') && (
            <button
              onClick={() => setModalSuratOpen(true)}
              className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 shadow-sm"
            >
              <FileSignature className="w-4 h-4" />
              Buat Surat Rekomendasi Resmi (BAP / Wajib Lapor)
            </button>
          )}
          <span className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl">
            ID Kasus: #{report.id}
          </span>
        </div>
      </div>

      {/* Main Grid Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Full Report Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                {report.kategori}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Lokasi: {report.location}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tanggal Kejadian: {report.incident_date} {report.incident_time && `(${report.incident_time})`}
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* Kronologi */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Uraian Kronologis Kejadian
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-all overflow-hidden">
                {report.description}
              </div>
            </div>

            {/* Pihak Terlibat */}
            {report.involved_parties && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Pihak / Terduga yang Terkait
                </h3>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 break-all overflow-hidden">
                  {report.involved_parties}
                </p>
              </div>
            )}

            {/* Lampiran Bukti */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Lampiran Bukti Berkas ({report.attachments?.length || 0})
              </h3>
              {report.attachments && report.attachments.length > 0 ? (
                <div className="space-y-2">
                  {report.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700 truncate">{att.original_name}</span>
                      <a
                        href={getUploadUrl(att.file_path)}
                        download={att.original_name || true}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary font-bold hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh Berkas
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Tidak ada berkas lampiran yang diunggah.</p>
              )}
            </div>

            {/* Data Identitas Pelapor (Hanya Jika Teridentifikasi & Super Admin) */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-secondary" />
                Data Pelapor (RBAC Protected)
              </h3>
              {report.reporter?.restricted ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1.5" />
                  {report.reporter.message}
                </div>
              ) : report.reporter ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <p><strong>Nama:</strong> {report.reporter.nama}</p>
                  <p><strong>NIM/NIP:</strong> {report.reporter.nim_nip || '—'}</p>
                  <p><strong>Kontak HP:</strong> {report.reporter.telepon || '—'}</p>
                  <p><strong>Email:</strong> {report.reporter.email || '—'}</p>
                  {report.reporter.telepon && buildWALink(report.reporter.telepon, report.reporter.nama, report.id) && (
                    <a
                      href={buildWALink(report.reporter.telepon, report.reporter.nama, report.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Hubungi via WhatsApp (Undang Jadi Saksi)
                    </a>
                  )}
                </div>
              ) : report.external_info ? (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs space-y-1">
                  <p><strong>Asal / Kategori Pelapor:</strong> {report.external_info.instansi || 'Masyarakat Umum'}</p>
                  <p><strong>Nama Pelapor / Petugas:</strong> {report.external_info.nama_petugas}</p>
                  <p><strong>Kontak:</strong> {report.external_info.kontak}</p>
                  {report.external_info.no_referensi && (
                    <p><strong>No. Referensi / KTP / Surat:</strong> {report.external_info.no_referensi}</p>
                  )}
                  {report.external_info.kontak && buildWALink(report.external_info.kontak, report.external_info.nama_petugas, report.id) && (
                    <a
                      href={buildWALink(report.external_info.kontak, report.external_info.nama_petugas, report.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Hubungi via WhatsApp (Undang Jadi Saksi)
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs">
                  Data identitas aman terenkripsi di server.
                </div>
              )}
            </div>
          </div>

          {/* Linimasa Perubahan Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" />
              Riwayat Penanganan & Linimasa Publik
            </h3>
            <div className="space-y-3">
              {report.status_logs?.map((log, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 capitalize">
                    <span>Tahap: {log.to_status}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.public_note || 'Tidak ada catatan publik.'}</p>
                  {log.internal_note && (
                    <div className="mt-2 p-2 rounded bg-amber-50 text-amber-800 text-[11px] border border-amber-200">
                      <strong>Catatan Internal (Admin Only):</strong> {log.internal_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Update Status */}
        <div className="space-y-6">
          {/* Ubah Status Form — hanya super_admin */}
          {user.role === 'super_admin' ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Perbarui Status Laporan</h3>
              <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Baru</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="select-field !py-2 text-xs"
                  >
                    <option value="diterima">Diterima</option>
                    <option value="diverifikasi">Diverifikasi</option>
                    <option value="ditindaklanjuti">Ditindaklanjuti</option>
                    <option value="selesai">Selesai</option>
                    <option value="ditolak">Ditolak / Gugur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Publik (Dilihat Pelapor di Halaman Lacak)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Informasi aman yang boleh dibaca pelapor..."
                    value={publicNote}
                    onChange={(e) => setPublicNote(e.target.value)}
                    className="textarea-field !py-2 text-xs !min-h-[70px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Rahasia Internal Satgas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan koordinasi internal, bukti tambahan, dll..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="textarea-field !py-2 text-xs !min-h-[70px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary w-full !py-2.5 text-xs font-bold"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan Status'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-1.5 text-amber-500" />
              Hanya <strong>Super Admin</strong> yang dapat mengubah status laporan.
            </div>
          )}

          {/* Penugasan & Urgensi — hanya admin & super_admin */}
          {(user.role === 'admin' || user.role === 'super_admin') ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Penugasan & Urgensi</h3>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tingkat Urgensi Kasus</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="select-field !py-2 text-xs"
                >
                  <option value="rendah">Rendah (Pencegahan)</option>
                  <option value="sedang">Sedang (Penyelidikan Awal)</option>
                  <option value="tinggi">Tinggi (Perlu Respon Mendesak)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tugaskan ke Satgas</label>
                <select
                  value={assignedTo ? String(assignedTo) : ''}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="select-field !py-2 text-xs"
                >
                  <option value="">— Pilih Satgas —</option>
                  {members.map((m) => (
                    <option key={m.id} value={String(m.id)}>{m.nama}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleUpdateAssign}
                className="btn-secondary w-full !py-2 text-xs font-bold border-slate-300"
              >
                Simpan Penugasan
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-1.5 text-amber-500" />
              Hanya <strong>Admin</strong> atau <strong>Super Admin</strong> yang dapat mengubah penugasan laporan.
            </div>
          )}
        </div>
      </div>

      {/* Modal Cetak Surat Rekomendasi Resmi */}
      <ModalSuratRekomendasi
        isOpen={modalSuratOpen}
        onClose={() => setModalSuratOpen(false)}
        report={report}
      />
    </div>
  );
}
