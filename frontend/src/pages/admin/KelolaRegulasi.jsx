import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, CheckCircle2, XCircle, Clock, 
  Search, Download, AlertTriangle, UserCheck, Shield, Eye, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getUploadUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function KelolaRegulasi() {
  const { user } = useAuth();
  const isAnggota = user?.role === 'anggota';
  const [activeTab, setActiveTab] = useState('docs'); // 'docs' | 'requests'
  const [documents, setDocuments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal upload dokumen
  const [modalUploadOpen, setModalUploadOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    judul: '',
    nomor_dokumen: '',
    kategori: 'Peraturan Kampus',
    deskripsi: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);

  // Modal review request
  const [reviewModal, setReviewModal] = useState(null); // request object
  const [adminNote, setAdminNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchRequests();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/regulations');
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error('Fetch docs error:', err);
      toast.error('Gagal memuat dokumen materi.');
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/regulations/admin/requests');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    }
  };

  // Upload dokumen materi
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFormData.judul || !uploadFormData.file) {
      toast.error('Judul dan Berkas Dokumen wajib dipilih.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('judul', uploadFormData.judul);
      formData.append('nomor_dokumen', uploadFormData.nomor_dokumen);
      formData.append('kategori', uploadFormData.kategori);
      formData.append('deskripsi', uploadFormData.deskripsi);
      formData.append('file', uploadFormData.file);

      await api.post('/regulations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Materi dokumen berhasil diunggah!');
      setModalUploadOpen(false);
      setUploadFormData({
        judul: '',
        nomor_dokumen: '',
        kategori: 'Peraturan Kampus',
        deskripsi: '',
        file: null
      });
      fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.error || 'Gagal mengunggah berkas.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // Hapus dokumen materi
  const handleDeleteDoc = async (id, judul) => {
    if (!window.confirm(`Yakin ingin menghapus dokumen "${judul}"? Seluruh permohonan akses terkait juga akan dihapus.`)) {
      return;
    }

    try {
      await api.delete(`/regulations/${id}`);
      toast.success('Dokumen berhasil dihapus.');
      fetchDocuments();
      fetchRequests();
    } catch (err) {
      console.error('Delete doc error:', err);
      toast.error('Gagal menghapus dokumen.');
    }
  };

  // Verifikasi request (Approve / Reject)
  const handleReviewAction = async (status) => {
    if (!reviewModal) return;
    setReviewing(true);
    try {
      await api.patch(`/regulations/admin/requests/${reviewModal.id}`, {
        status,
        admin_note: adminNote
      });
      toast.success(`Permohonan ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      setReviewModal(null);
      setAdminNote('');
      fetchRequests();
    } catch (err) {
      console.error('Review request error:', err);
      toast.error('Gagal memperbarui status permohonan.');
    } finally {
      setReviewing(false);
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Kelola Materi Regulasi & Hak Akses Unduh</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAnggota
              ? 'Lihat daftar dokumen regulasi dan tinjau permohonan izin unduh'
              : 'Unggah berkas dokumen resmi dan tinjau persetujuan permohonan izin unduh dari pengguna/mahasiswa'}
          </p>
        </div>
        {/* Hanya admin & super_admin yang bisa upload */}
        {!isAnggota && (
          <button
            onClick={() => setModalUploadOpen(true)}
            className="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Unggah Materi Baru
          </button>
        )}
      </div>

      {/* Info banner untuk anggota */}
      {isAnggota && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <span>Hanya <strong>Admin</strong> atau <strong>Super Admin</strong> yang dapat mengunggah atau menghapus dokumen regulasi.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'docs'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Berkas Dokumen Materi ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Permohonan Izin Unduh
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
              {pendingRequestsCount} Menunggu
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: DAFTAR DOKUMEN MATERI */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Dokumen & Nomor</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Nama Berkas Fisik</th>
                  <th className="py-3.5 px-4">Ukuran</th>
                  <th className="py-3.5 px-4">Diunggah Oleh</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Belum ada dokumen materi yang diunggah. Klik tombol "Unggah Materi Baru" di atas.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{doc.judul}</span>
                        <span className="text-[11px] text-slate-400">{doc.nomor_dokumen || 'Tanpa nomor'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">
                          {doc.kategori}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 truncate max-w-[200px]">
                        {doc.file_path}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {doc.author_name || 'Admin'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={getUploadUrl(doc.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-600 hover:text-secondary rounded-lg hover:bg-slate-100 transition"
                            title="Unduh / Cek Berkas"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {/* Hapus hanya untuk admin & super_admin */}
                          {!isAnggota && (
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.judul)}
                              className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR PERMOHONAN IZIN UNDUH */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Pemohon</th>
                  <th className="py-3.5 px-4">Dokumen yang Diajukan</th>
                  <th className="py-3.5 px-4">Tujuan / Alasan</th>
                  <th className="py-3.5 px-4">Waktu Pengajuan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Belum ada permohonan izin unduh dari pengguna.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{req.nama}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{req.identitas}</span>
                        <span className="text-[10px] text-slate-400 block">{req.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block truncate max-w-[220px]">
                          {req.doc_title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Token: {req.token.slice(0, 10)}...</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                        {req.alasan || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(req.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : req.status === 'used'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'approved'
                            ? 'Disetujui (Belum Unduh)'
                            : req.status === 'rejected'
                              ? 'Ditolak'
                              : req.status === 'used'
                                ? 'Selesai Diunduh (Hangus)'
                                : 'Menunggu'}
                        </span>
                        {req.status === 'used' && req.downloaded_at && (
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            Diunduh: {new Date(req.downloaded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setReviewModal(req);
                            setAdminNote(req.admin_note || '');
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                            req.status === 'used'
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-secondary text-white hover:bg-secondary/90'
                          }`}
                        >
                          {req.status === 'used' ? 'Detail' : 'Tinjau Akses'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD MATERI — hanya admin & super_admin */}
      {modalUploadOpen && !isAnggota && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Unggah Materi Dokumen Resmi</h3>
                  <p className="text-[11px] text-slate-500">Materi akan tampil di halaman Regulasi & Unduhan</p>
                </div>
              </div>
              <button
                onClick={() => setModalUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Dokumen / Materi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Peraturan Direktur Polinela Nomor 5 Tahun 2025"
                  value={uploadFormData.judul}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Dokumen</label>
                  <input
                    type="text"
                    placeholder="Contoh: 5/PL15/2025"
                    value={uploadFormData.nomor_dokumen}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, nomor_dokumen: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={uploadFormData.kategori}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, kategori: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                  >
                    <option value="Peraturan Kampus">Peraturan Kampus</option>
                    <option value="Standar Operasional (SOP)">Standar Operasional (SOP)</option>
                    <option value="Panduan Modul Daring">Panduan Modul Daring</option>
                    <option value="Dokumentasi & Laporan">Dokumentasi & Laporan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat Dokumen</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan isi dokumen, pasal penting, atau kegunaan berkas..."
                  value={uploadFormData.deskripsi}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Berkas Asli (PDF/Word/PPT) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  onChange={(e) => setUploadFormData({ ...uploadFormData, file: e.target.files[0] })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-secondary/10 file:text-secondary file:font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary !py-2 !px-5 text-xs font-bold"
                >
                  {uploading ? 'Mengunggah...' : 'Simpan & Publikasikan Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TINJAU PERMOHONAN AKSES */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tinjau Permohonan Unduh</h3>
                  <p className="text-[11px] text-slate-500">Persetujuan hak akses berkas resmi</p>
                </div>
              </div>
              <button
                onClick={() => setReviewModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <p><strong>Nama Pemohon:</strong> {reviewModal.nama}</p>
              <p><strong>NPM / Identitas:</strong> {reviewModal.identitas}</p>
              <p><strong>Email:</strong> {reviewModal.email}</p>
              <p><strong>Dokumen Diminta:</strong> {reviewModal.doc_title}</p>
              <p><strong>Alasan / Keperluan:</strong> {reviewModal.alasan || 'Tidak dicantumkan'}</p>
              <p className="text-[11px] font-mono text-slate-500 break-all">
                <strong>Token Akses:</strong> {reviewModal.token}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Catatan Admin (Opsional)</label>
              <input
                type="text"
                placeholder="Catatan verifikasi..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReviewAction('rejected')}
                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold transition text-xs flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Tolak Permohonan
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReviewAction('approved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Setujui & Izinkan Unduh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

