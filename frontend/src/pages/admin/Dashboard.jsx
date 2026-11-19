import { useState, useEffect } from 'react';
import { 
  FileText, Clock, CheckCircle2, XCircle, 
  AlertTriangle, TrendingUp, BarChart3, PieChart
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Fetch dashboard stats error:', err);
      toast.error('Gagal memuat data statistik dari database.');
      setStats({
        ringkasan: { total: 0, baru: 0, dalam_proses: 0, selesai: 0, ditolak: 0 },
        urgensi_tinggi: 0,
        per_kategori: [],
        per_sumber: [],
        terbaru: []
      });
    } finally {
      setLoading(false);
    }
  };

  const ringkasan = stats?.ringkasan || { total: 0, baru: 0, dalam_proses: 0, selesai: 0, ditolak: 0 };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Dashboard Monitoring Kasus</h2>
          <p className="text-xs text-slate-500 mt-1">
            Data statistik laporan pengaduan anti narkotika Politeknik Negeri Lampung
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {stats?.urgensi_tinggi || 0} Kasus Perlu Perhatian Mendesak
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Laporan</span>
            <FileText className="w-5 h-5 text-secondary" />
          </div>
          <div className="text-3xl font-black text-slate-900">{ringkasan.total}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Seluruh laporan tercatat</span>
        </div>

        <div className="card p-5 bg-white border border-blue-100">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Laporan Baru</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-700">{ringkasan.baru}</div>
          <span className="text-[11px] text-blue-500 mt-1 block">Menunggu verifikasi</span>
        </div>

        <div className="card p-5 bg-white border border-purple-100">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Dalam Proses</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-700">{ringkasan.dalam_proses}</div>
          <span className="text-[11px] text-purple-500 mt-1 block">Sedang ditindaklanjuti</span>
        </div>

        <div className="card p-5 bg-white border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Selesai</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">{ringkasan.selesai}</div>
          <span className="text-[11px] text-emerald-500 mt-1 block">Tindakan tuntas</span>
        </div>

        <div className="card p-5 bg-white border border-red-100">
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ditolak / Gugur</span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-700">{ringkasan.ditolak}</div>
          <span className="text-[11px] text-red-500 mt-1 block">Tidak valid / spam</span>
        </div>
      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-secondary" />
            Distribusi Kasus per Kategori
          </h3>
          <div className="space-y-3">
            {stats?.per_kategori?.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{cat.kategori}</span>
                  <span>{cat.jumlah} laporan</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-secondary h-2.5 rounded-full" 
                    style={{ width: `${(cat.jumlah / (ringkasan.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sumber Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-secondary" />
            Laporan Berdasarkan Sumber & Mode
          </h3>
          <div className="space-y-3">
            {stats?.per_sumber?.map((src, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{src.sumber}</span>
                  <span>{src.jumlah} kasus</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-accent-dark h-2.5 rounded-full" 
                    style={{ width: `${(src.jumlah / (ringkasan.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Laporan Terbaru Masuk */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Laporan Terbaru Memerlukan Respon</h3>
          <a href="/admin/laporan" className="text-xs font-bold text-secondary hover:underline">
            Lihat Semua Antrean →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Tingkat Urgensi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.terbaru?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-semibold">#{item.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{item.kategori}</td>
                  <td className="py-3 px-4 text-slate-600">{item.location}</td>
                  <td className="py-3 px-4 capitalize font-medium">{item.mode}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.urgency === 'tinggi' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.urgency || 'sedang'}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize font-semibold">{item.status}</td>
                  <td className="py-3 px-4">
                    <a
                      href={`/admin/laporan/${item.id}`}
                      className="px-3 py-1 bg-secondary text-white text-[11px] font-bold rounded-lg hover:bg-secondary/90 transition"
                    >
                      Buka
                    </a>
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
