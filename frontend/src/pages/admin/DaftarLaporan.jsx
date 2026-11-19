import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Eye, ChevronLeft, ChevronRight, 
  FileSpreadsheet, ShieldAlert, FileDown, X, CalendarRange
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function DaftarLaporan() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  // Modal PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfMode, setPdfMode] = useState('bulan'); // 'bulan' | 'range'
  const [pdfBulan, setPdfBulan] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [pdfTahun, setPdfTahun] = useState(String(new Date().getFullYear()));
  const [pdfDateFrom, setPdfDateFrom] = useState('');
  const [pdfDateTo, setPdfDateTo] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, sourceFilter, urgencyFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (urgencyFilter) params.append('urgency', urgencyFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/admin/reports?${params.toString()}`);
      setReports(res.data.data || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
      toast.error('Gagal memuat antrean laporan dari database.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleExportCSV = () => {
    toast.success('Mengunduh rekapitulasi data laporan...');
    const header = "ID,Kategori,Sumber,Mode,Lokasi,Tanggal,Urgensi,Status\n";
    const rows = reports.map(r => 
      `"${r.id}","${r.kategori}","${r.source}","${r.mode}","${r.location}","${r.incident_date}","${r.urgency}","${r.status}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Laporan_Satgas_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const BULAN_LIST = [
    { v: '01', l: 'Januari' }, { v: '02', l: 'Februari' }, { v: '03', l: 'Maret' },
    { v: '04', l: 'April' }, { v: '05', l: 'Mei' }, { v: '06', l: 'Juni' },
    { v: '07', l: 'Juli' }, { v: '08', l: 'Agustus' }, { v: '09', l: 'September' },
    { v: '10', l: 'Oktober' }, { v: '11', l: 'November' }, { v: '12', l: 'Desember' },
  ];

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams();
      if (pdfMode === 'bulan') {
        params.append('bulan', parseInt(pdfBulan).toString());
        params.append('tahun', pdfTahun);
      } else {
        if (pdfDateFrom) params.append('date_from', pdfDateFrom);
        if (pdfDateTo) params.append('date_to', pdfDateTo);
      }

      const response = await api.get(`/admin/reports/rekap-pdf?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const bulanLabel = BULAN_LIST.find(b => b.v === pdfBulan)?.l || pdfBulan;
      const namaFile = pdfMode === 'bulan'
        ? `Rekap_Laporan_${bulanLabel}_${pdfTahun}.pdf`
        : `Rekap_Laporan_${pdfDateFrom || 'awal'}_sd_${pdfDateTo || 'akhir'}.pdf`;
      link.download = namaFile;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Rekap PDF berhasil diunduh!');
      setShowPdfModal(false);
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Gagal mengunduh PDF. Coba lagi.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Antrean Laporan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Kelola verifikasi, penugasan, dan status penanganan kasus</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start">
          <button
            onClick={handleExportCSV}
            className="btn-secondary !py-2.5 !px-4 text-xs font-bold flex items-center gap-2 border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Ekspor CSV
          </button>
          <button
            onClick={() => setShowPdfModal(true)}
            className="btn-secondary !py-2.5 !px-4 text-xs font-bold flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            Rekap PDF
          </button>
        </div>
      </div>

      {/* Modal Filter PDF */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Unduh Rekap Laporan PDF</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pilih periode data yang ingin diekspor</p>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Tab Mode */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-5">
              <button
                onClick={() => setPdfMode('bulan')}
                className={`flex-1 py-2 text-xs font-bold transition ${
                  pdfMode === 'bulan' ? 'bg-secondary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Per Bulan
              </button>
              <button
                onClick={() => setPdfMode('range')}
                className={`flex-1 py-2 text-xs font-bold transition ${
                  pdfMode === 'range' ? 'bg-secondary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Rentang Tanggal
              </button>
            </div>

            {pdfMode === 'bulan' ? (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bulan</label>
                  <select
                    value={pdfBulan}
                    onChange={e => setPdfBulan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-secondary"
                  >
                    {BULAN_LIST.map(b => (
                      <option key={b.v} value={b.v}>{b.l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tahun</label>
                  <select
                    value={pdfTahun}
                    onChange={e => setPdfTahun(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-secondary"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <CalendarRange className="w-3.5 h-3.5 inline mr-1" />
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={pdfDateFrom}
                    onChange={e => setPdfDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <CalendarRange className="w-3.5 h-3.5 inline mr-1" />
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={pdfDateTo}
                    onChange={e => setPdfDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPdfModal(false)}
                className="flex-1 btn-secondary !py-2.5 text-xs font-bold border-slate-300"
              >
                Batal
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {pdfLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                {pdfLoading ? 'Memproses...' : 'Unduh PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari deskripsi atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-secondary"
            />
          </div>
          <button type="submit" className="btn-primary !py-2 !px-5 text-xs font-bold">
            Cari
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="diterima">Diterima (Baru)</option>
            <option value="diverifikasi">Diverifikasi</option>
            <option value="ditindaklanjuti">Ditindaklanjuti</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
          >
            <option value="">Semua Sumber</option>
            <option value="internal">Internal (Kampus)</option>
            <option value="eksternal">Eksternal (Instansi / Masyarakat)</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
          >
            <option value="">Semua Urgensi</option>
            <option value="tinggi">Urgensi Tinggi</option>
            <option value="sedang">Urgensi Sedang</option>
            <option value="rendah">Urgensi Rendah</option>
          </select>

          {(statusFilter || sourceFilter || urgencyFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setSourceFilter('');
                setUrgencyFilter('');
                setSearch('');
              }}
              className="text-red-500 hover:underline font-semibold ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tiket</th>
                <th className="py-3 px-4">Kategori Perkara</th>
                <th className="py-3 px-4">Sumber / Mode</th>
                <th className="py-3 px-4">Lokasi & Tanggal</th>
                <th className="py-3 px-4">Urgensi</th>
                <th className="py-3 px-4">Penugasan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">#{item.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{item.kategori}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.source === 'eksternal' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.source === 'eksternal' ? 'Eksternal' : 'Internal'}
                      </span>
                      <span className="block text-[11px] text-slate-400 capitalize">{item.mode}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 block truncate max-w-[180px]">{item.location}</span>
                    <span className="text-[10px] text-slate-400">{item.incident_date}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.urgency === 'tinggi' 
                        ? 'bg-red-100 text-red-700 ring-1 ring-red-200' 
                        : item.urgency === 'sedang' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.urgency || 'sedang'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {item.assigned_name || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge badge-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      to={`/admin/laporan/${item.id}`}
                      className="px-3 py-1.5 bg-secondary text-white rounded-lg font-bold hover:bg-secondary/90 transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
