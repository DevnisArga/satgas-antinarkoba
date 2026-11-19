import { useState, useEffect } from 'react';
import { 
  FileText, Lock, Download, CheckCircle2, X, Search, 
  Clock, AlertTriangle, KeyRound, ExternalLink, Calendar, User, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function RegulasiUnduhan() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal minta akses
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formAkses, setFormAkses] = useState({
    nama: '',
    identitas: '',
    email: '',
    alasan: ''
  });
  const [submittingAccess, setSubmittingAccess] = useState(false);

  // Modal cek status token
  const [modalCheckTokenOpen, setModalCheckTokenOpen] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [tokenResult, setTokenResult] = useState(null);
  const [checkingToken, setCheckingToken] = useState(false);

  // Local storage tokens user: { [docId]: token }
  const [myTokens, setMyTokens] = useState(() => {
    try {
      const saved = localStorage.getItem('satgas_doc_tokens');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Approved docs map: { [docId]: token }
  const [approvedDocs, setApprovedDocs] = useState({});
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Sync check status for saved tokens
  useEffect(() => {
    checkMyTokens();
  }, [myTokens]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/regulations');
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error('Fetch regulations error:', err);
      toast.error('Gagal memuat dokumen regulasi.');
    } finally {
      setLoading(false);
    }
  };

  const checkMyTokens = async () => {
    const entries = Object.entries(myTokens);
    if (entries.length === 0) return;

    const approved = {};
    const updatedTokens = { ...myTokens };
    let hasChanges = false;

    for (const [docId, token] of entries) {
      try {
        const res = await api.get(`/regulations/check-access/${token}`);
        const status = res.data?.data?.status;
        if (status === 'approved') {
          approved[docId] = token;
        } else if (status === 'used' || status === 'expired') {
          // Token sudah terpakai/hangus (1x unduh), bersihkan dari penyimpanan browser
          delete updatedTokens[docId];
          hasChanges = true;
        }
      } catch (e) {
        // Token tidak valid atau error
      }
    }

    if (hasChanges) {
      setMyTokens(updatedTokens);
      localStorage.setItem('satgas_doc_tokens', JSON.stringify(updatedTokens));
    }
    setApprovedDocs(approved);
  };

  // Unduh berkas dengan sistem One-Time Token (sekali unduh langsung hangus & refresh status)
  const handleDownloadOnce = (docId, token, docTitle) => {
    if (downloadingDocId) return;
    setDownloadingDocId(docId);
    toast.loading(`Mengunduh berkas "${docTitle}"...`, { id: 'download-single' });

    // Trigger download berkas
    const downloadUrl = `/api/regulations/download/${token}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Seketika amankan kartu dokumen: hapus izin dari browser & kunci kembali
    setTimeout(() => {
      const updatedTokens = { ...myTokens };
      delete updatedTokens[docId];
      setMyTokens(updatedTokens);
      localStorage.setItem('satgas_doc_tokens', JSON.stringify(updatedTokens));

      const updatedApproved = { ...approvedDocs };
      delete updatedApproved[docId];
      setApprovedDocs(updatedApproved);

      setDownloadingDocId(null);
      toast.success(
        `Berkas berhasil diunduh. Izin akses otomatis ditutup & dikunci kembali demi keamanan.`,
        { id: 'download-single', duration: 5000 }
      );
      fetchDocuments();
    }, 1200);
  };

  const handleRequestAccessSubmit = async (e) => {
    e.preventDefault();
    if (!formAkses.nama || !formAkses.identitas || !formAkses.email) {
      toast.error('Mohon lengkapi semua kolom bertanda *');
      return;
    }

    setSubmittingAccess(true);
    try {
      const res = await api.post(`/regulations/${selectedDoc.id}/request-access`, formAkses);
      const generatedToken = res.data.token;

      // Simpan token ke localStorage pengguna
      const newTokens = { ...myTokens, [selectedDoc.id]: generatedToken };
      setMyTokens(newTokens);
      localStorage.setItem('satgas_doc_tokens', JSON.stringify(newTokens));

      toast.success('Permohonan berhasil dikirim! Menunggu persetujuan Admin.');
      setSelectedDoc(null);
      setFormAkses({ nama: '', identitas: '', email: '', alasan: '' });
    } catch (err) {
      console.error('Request access error:', err);
      const msg = err.response?.data?.error || 'Gagal mengajukan permohonan akses.';
      toast.error(msg);
    } finally {
      setSubmittingAccess(false);
    }
  };

  const handleManualCheckToken = async (e) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setCheckingToken(true);
    setTokenResult(null);
    try {
      const res = await api.get(`/regulations/check-access/${inputToken.trim()}`);
      setTokenResult(res.data.data);
      if (res.data.data.status === 'approved') {
        const docId = res.data.data.document_id;
        const newTokens = { ...myTokens, [docId]: inputToken.trim() };
        setMyTokens(newTokens);
        localStorage.setItem('satgas_doc_tokens', JSON.stringify(newTokens));
      }
    } catch (err) {
      toast.error('Token tidak valid atau tidak ditemukan di database.');
      setTokenResult({ notFound: true });
    } finally {
      setCheckingToken(false);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.nomor_dokumen && d.nomor_dokumen.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.kategori && d.kategori.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-widest text-secondary font-bold">
          Pusat Arsip Resmi Polinela
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
          Regulasi & Pusat Unduhan Materi
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Dokumen peraturan, SOP penindakan, modul, dan materi sosialisasi resmi. Pengunduhan dokumen memerlukan verifikasi dan persetujuan dari Admin Satgas.
        </p>
      </div>

      {/* Top Bar Filter & Token Checker */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari materi dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-secondary"
          />
        </div>

        <button
          onClick={() => {
            setModalCheckTokenOpen(true);
            setTokenResult(null);
            setInputToken('');
          }}
          className="btn-secondary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto border-slate-300"
        >
          <KeyRound className="w-4 h-4 text-secondary" />
          Cek Status Izin Unduh (Token)
        </button>
      </div>

      {/* Grid Dokumen Materi yang Diupload Admin */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-xl mx-auto space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Dokumen Materi</h3>
          <p className="text-xs text-slate-500">
            Admin belum mengunggah dokumen materi baru. Silakan login ke Panel Admin &gt; Kelola Dokumen Unduhan untuk mengunggah materi berkas dokumen asli.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const token = myTokens[doc.id];
            const isApproved = !!approvedDocs[doc.id];

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full">
                      {doc.kategori || 'Dokumen Resmi'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {doc.judul}
                    </h3>
                    {doc.nomor_dokumen && (
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        No: {doc.nomor_dokumen}
                      </p>
                    )}
                  </div>

                  {doc.deskripsi && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {doc.deskripsi}
                    </p>
                  )}

                  <div className="text-[11px] text-slate-500 font-mono pt-1">
                    Berkas: {doc.file_path.split('-').pop()}
                  </div>
                </div>

                {/* Status & Download Action */}
                <div className="pt-4 border-t border-slate-100">
                  {isApproved ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Izin Disetujui Admin!
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">1x Unduh</span>
                      </div>
                      <button
                        onClick={() => handleDownloadOnce(doc.id, approvedDocs[doc.id], doc.judul)}
                        disabled={downloadingDocId === doc.id}
                        className="btn-primary w-full !py-2 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md shadow-secondary/20 transition disabled:opacity-60"
                      >
                        {downloadingDocId === doc.id ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Mengunduh Berkas...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" /> Unduh Berkas Asli
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-slate-400 text-center">
                        Izin otomatis hangus & dikunci kembali setelah diunduh
                      </p>
                    </div>
                  ) : token ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Permohonan sedang ditinjau Admin.</span>
                      </div>
                      <button
                        onClick={() => {
                          setInputToken(token);
                          setModalCheckTokenOpen(true);
                        }}
                        className="w-full py-1.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition"
                      >
                        Cek Status Permohonan
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="bg-amber-600 hover:bg-amber-700 text-white w-full !py-2.5 text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-md shadow-amber-600/20"
                    >
                      <Lock className="w-4 h-4" /> Minta Akses Unduh
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJUKAN PERMOHONAN AKSES */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Permohonan Izin Unduh</h3>
                  <p className="text-[11px] text-slate-500">Memerlukan persetujuan Admin Satgas</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <strong className="block text-slate-900">Dokumen:</strong>
              {selectedDoc.judul}
            </div>

            <form onSubmit={handleRequestAccessSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemohon"
                  value={formAkses.nama}
                  onChange={(e) => setFormAkses({ ...formAkses, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NPM / NIP / NIK *</label>
                <input
                  type="text"
                  required
                  placeholder="Nomor identitas"
                  value={formAkses.identitas}
                  onChange={(e) => setFormAkses({ ...formAkses, identitas: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Aktif *</label>
                <input
                  type="email"
                  required
                  placeholder="email@polinela.ac.id"
                  value={formAkses.email}
                  onChange={(e) => setFormAkses({ ...formAkses, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tujuan / Alasan Unduh</label>
                <textarea
                  rows={2}
                  placeholder="Keperluan tugas, riset, atau arsip..."
                  value={formAkses.alasan}
                  onChange={(e) => setFormAkses({ ...formAkses, alasan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAccess}
                  className="btn-primary !py-2 !px-5 text-xs font-bold"
                >
                  {submittingAccess ? 'Mengirim...' : 'Kirim Permohonan ke Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CEK STATUS TOKEN */}
      {modalCheckTokenOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cek Status Izin Unduh</h3>
                  <p className="text-[11px] text-slate-500">Masukkan kode token permohonan</p>
                </div>
              </div>
              <button
                onClick={() => setModalCheckTokenOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualCheckToken} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Token Permohonan</label>
                <input
                  type="text"
                  required
                  placeholder="Tempelkan token di sini..."
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-secondary text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={checkingToken}
                className="btn-primary w-full !py-2.5 text-xs font-bold"
              >
                {checkingToken ? 'Mengecek...' : 'Periksa Status Izin'}
              </button>
            </form>

            {tokenResult && !tokenResult.notFound && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <p><strong>Dokumen:</strong> {tokenResult.doc_title}</p>
                <p><strong>Pemohon:</strong> {tokenResult.nama} ({tokenResult.identitas})</p>
                <p>
                  <strong>Status Persetujuan:</strong>{' '}
                  <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                    tokenResult.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : tokenResult.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : tokenResult.status === 'used'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tokenResult.status === 'approved'
                      ? 'Disetujui Admin (Siap Unduh)'
                      : tokenResult.status === 'rejected'
                        ? 'Ditolak'
                        : tokenResult.status === 'used'
                          ? 'Sudah Diunduh (Hangus)'
                          : 'Masih Menunggu'}
                  </span>
                </p>
                {tokenResult.admin_note && (
                  <p><strong>Catatan Admin:</strong> {tokenResult.admin_note}</p>
                )}

                {tokenResult.status === 'approved' && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        handleDownloadOnce(tokenResult.document_id, tokenResult.token, tokenResult.doc_title);
                        setModalCheckTokenOpen(false);
                      }}
                      className="btn-primary w-full !py-2 text-xs font-bold inline-flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Unduh Berkas Sekarang (1x Unduh)
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      Link unduh langsung hangus setelah berkas mulai diunduh
                    </p>
                  </div>
                )}

                {tokenResult.status === 'used' && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-purple-800">
                      <Lock className="w-3.5 h-3.5" /> Akses Telah Kadaluarsa (Sudah Diunduh)
                    </p>
                    <p>
                      Dokumen ini telah selesai diunduh pada{' '}
                      {tokenResult.downloaded_at
                        ? new Date(tokenResult.downloaded_at).toLocaleString('id-ID')
                        : 'sesi sebelumnya'}.
                      Sesuai protokol keamanan data Satgas, izin ini sudah hangus dan tidak dapat dipakai kembali.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
