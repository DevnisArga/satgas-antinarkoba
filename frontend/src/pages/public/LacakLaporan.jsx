import { useState } from 'react';
import { 
  Search, Shield, Clock, CheckCircle2, AlertCircle, 
  FileText, MessageSquare, Printer, ArrowRight, CornerDownRight, Check 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function LacakLaporan() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Masukkan kode pelacakan.');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/track/${cleanCode}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Track error:', err);
      setReportData(null);
      const errMsg = err.response?.data?.error || 'Kode pelacakan tidak ditemukan. Pastikan kode yang Anda masukkan benar.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      diterima: { label: 'Diterima', color: 'badge-diterima' },
      diverifikasi: { label: 'Diverifikasi', color: 'badge-diverifikasi' },
      ditindaklanjuti: { label: 'Ditindaklanjuti', color: 'badge-ditindaklanjuti' },
      selesai: { label: 'Selesai', color: 'badge-selesai' },
      ditolak: { label: 'Tidak Valid / Ditolak', color: 'badge-ditolak' },
    };
    const s = map[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
    return <span className={`badge ${s.color} px-3 py-1 text-xs font-bold`}>{s.label}</span>;
  };

  const printProof = () => {
    window.print();
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-widest text-secondary font-bold">Transparansi Penanganan</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Lacak Status Penanganan Laporan</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-lg mx-auto">
          Masukkan kode pelacakan unik (misal: <code className="bg-slate-100 px-2 py-0.5 rounded text-secondary font-mono text-xs">SATGAS-2026-XXXX</code>) untuk memeriksa pembaruan kasus Anda.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-100 mb-8">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Contoh: SATGAS-2026-8F42K9..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-field pl-12 uppercase font-mono tracking-wider font-semibold text-sm sm:text-base"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary !py-3 !px-8 whitespace-nowrap">
            {loading ? 'Mencari...' : 'Lacak Status'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>

      {/* Hasil Pelacakan */}
      {searched && reportData && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8 animate-fade-in print:shadow-none print:border-none">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-mono">Kode Tiket: {code.toUpperCase()}</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Kategori: {reportData.kategori}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lokasi: {reportData.lokasi} · Lapor: {new Date(reportData.tanggal_lapor).toLocaleDateString('id-ID')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(reportData.status)}
              <button
                onClick={printProof}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition print:hidden"
              >
                <Printer className="w-4 h-4" />
                Cetak Bukti
              </button>
            </div>
          </div>

          {/* Linimasa 4 Tahap (PRD §4 & FR-3) */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary" />
                Linimasa Proses Penanganan
              </h3>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                4 Tahapan Penanganan
              </span>
            </div>

            {/* Jika status laporan Ditolak / Gugur */}
            {reportData.status?.toLowerCase() === 'ditolak' && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-800">Status Laporan: Ditolak / Tidak Valid</div>
                  <p className="mt-1 text-red-700 leading-relaxed">
                    {reportData.linimasa?.find(l => l.status?.toLowerCase() === 'ditolak')?.catatan ||
                      'Laporan tidak dapat diproses lebih lanjut karena informasi/bukti tidak memenuhi ketentuan Satgas.'}
                  </p>
                </div>
              </div>
            )}

            {/* 4 Alur Tetap */}
            <div className="space-y-0">
              {(() => {
                const STAGES = [
                  {
                    key: 'diterima',
                    label: 'Diterima',
                    defaultDesc: 'Laporan berhasil masuk ke sistem Satgas Anti Narkoba Polinela.',
                  },
                  {
                    key: 'diverifikasi',
                    label: 'Diverifikasi',
                    defaultDesc: 'Satgas memeriksa bukti awal, kelengkapan informasi, dan validitas laporan.',
                  },
                  {
                    key: 'ditindaklanjuti',
                    label: 'Ditindaklanjuti',
                    defaultDesc: 'Satgas melakukan tindakan investigasi mendalam, koordinasi pihak terkait, dan penanganan perkara.',
                  },
                  {
                    key: 'selesai',
                    label: 'Selesai',
                    defaultDesc: 'Penanganan laporan tuntas diselesaikan oleh Satgas dan diarsipkan.',
                  },
                ];

                const STATUS_RANKS = {
                  diterima: 0,
                  diverifikasi: 1,
                  ditindaklanjuti: 2,
                  selesai: 3,
                };

                const currentStatus = reportData.status?.toLowerCase() || 'diterima';
                const isRejected = currentStatus === 'ditolak';
                const currentRank = STATUS_RANKS[currentStatus] !== undefined ? STATUS_RANKS[currentStatus] : 0;

                return STAGES.map((stage, idx) => {
                  const isLast = idx === STAGES.length - 1;
                  const stageRank = STATUS_RANKS[stage.key];

                  // Cari log spesifik di linimasa
                  const stageLogs = (reportData.linimasa || []).filter(
                    (l) => l.status && l.status.toLowerCase() === stage.key
                  );
                  const latestLog = stageLogs.length > 0 ? stageLogs[stageLogs.length - 1] : null;

                  // Tentukan apakah tahap ini sudah dilaksanakan
                  let isCompleted = false;
                  if (!isRejected) {
                    isCompleted = Boolean(latestLog) || currentRank >= stageRank;
                  } else {
                    // Jika ditolak, hanya 'diterima' yang dianggap selesai
                    isCompleted = stageRank === 0;
                  }

                  // Tentukan apakah tahap berikutnya juga sudah dilaksanakan (untuk pewarnaan garis penghubung)
                  const nextStage = !isLast ? STAGES[idx + 1] : null;
                  let nextStageCompleted = false;
                  if (nextStage && !isRejected) {
                    const nextRank = STATUS_RANKS[nextStage.key];
                    const nextHasLog = (reportData.linimasa || []).some(
                      (l) => l.status && l.status.toLowerCase() === nextStage.key
                    );
                    nextStageCompleted = nextHasLog || currentRank >= nextRank;
                  }

                  // Timestamp & Catatan
                  let timestamp = null;
                  let note = stage.defaultDesc;

                  if (latestLog) {
                    timestamp = new Date(latestLog.waktu).toLocaleString('id-ID');
                    if (latestLog.catatan) {
                      note = latestLog.catatan;
                    }
                  } else if (isCompleted) {
                    // Jika tahap sudah dilewati tapi belum ada catatan spesifik
                    timestamp = reportData.pembaruan_terakhir
                      ? new Date(reportData.pembaruan_terakhir).toLocaleString('id-ID')
                      : null;
                    if (stage.key === 'diverifikasi') {
                      note = 'Laporan telah diverifikasi dan diteruskan ke tahap penanganan.';
                    }
                  }

                  return (
                    <div key={stage.key} className="relative flex items-stretch gap-4 pb-6 last:pb-0">
                      {/* Kolom Indikator & Garis Penghubung */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm z-10 flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : isRejected
                              ? 'bg-slate-100 border-2 border-slate-300 text-slate-400'
                              : 'bg-slate-100 border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">{idx + 1}</span>
                          )}
                        </div>

                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 my-1.5 transition-all ${
                              isCompleted && nextStageCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      {/* Konten Tahapan */}
                      <div className="flex-1 pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm sm:text-base font-bold ${
                                isCompleted ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {stage.label}
                            </span>

                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sudah Dilaksanakan
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Tidak Dilanjutkan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Menunggu Tahapan Ini
                              </span>
                            )}
                          </div>

                          {timestamp && isCompleted && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {timestamp}
                            </span>
                          )}
                        </div>

                        {/* Kotak Catatan / Deskripsi Proses */}
                        <div
                          className={`mt-2 p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                            isCompleted
                              ? 'bg-emerald-50/50 border border-emerald-100 text-slate-700 shadow-xs'
                              : 'bg-slate-50 border border-dashed border-slate-200 text-slate-400'
                          }`}
                        >
                          {note}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Pesan Dua Arah (P1 - FR-3) */}
          {reportData.pesan && reportData.pesan.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-secondary" />
                Komunikasi dengan Satgas
              </h3>
              <div className="space-y-3">
                {reportData.pesan.map((msg, i) => (
                  <div key={i} className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Pesan Resmi Satgas
                      <span className="text-[10px] text-emerald-600 font-normal">
                        ({new Date(msg.waktu).toLocaleString('id-ID')})
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                      {msg.pesan}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catatan Privasi */}
          <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-500 border border-slate-100">
            Catatan: Hanya informasi publik dan non-sensitif yang ditampilkan di halaman pelacakan ini. Seluruh identitas pelapor tetap terlindungi dan tersimpan secara terenkripsi.
          </div>
        </div>
      )}

      {/* Jika Tidak Ditemukan */}
      {searched && !reportData && !loading && (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Kode Tiket Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Pastikan kode pelacakan yang Anda masukkan sesuai persis dengan saat Anda mengirim laporan. Kode ini bersifat rahasia dan tidak dapat dipulihkan jika hilang.
          </p>
        </div>
      )}
    </div>
  );
}
