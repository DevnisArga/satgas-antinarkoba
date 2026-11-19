import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ChevronRight, Tag, Scale, ShieldAlert, AlertTriangle, Users } from 'lucide-react';
import api from '../../lib/api';

const defaultCategories = [
  'Semua Kategori',
  'Jenis Narkotika',
  'Pencegahan Dini',
  'Regulasi & Hukum',
  'Kategori Hukuman'
];

export default function Edukasi() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState(['Semua Kategori']);
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducation();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?tipe=edukasi');
      const cats = res.data.data || [];
      if (cats.length > 0) {
        setCategories(['Semua Kategori', ...cats.map(c => c.nama)]);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchEducation = async () => {
    try {
      const res = await api.get('/education?limit=20');
      setArticles(res.data.data || []);
    } catch (err) {
      console.error('Fetch edu error:', err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = articles.filter(a => {
    const matchCat = selectedCategory === 'Semua Kategori' || a.kategori === selectedCategory;
    const matchSearch = a.judul.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-secondary font-bold">FR-4 Pusat Informasi</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Edukasi Bahaya Narkoba</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Materi ilmiah dan edukatif seputar jenis zat terlarang, pencegahan di kampus, dan regulasi hukum terkini.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-secondary text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari artikel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-secondary"
          />
        </div>
      </div>

      {/* Grid Articles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map(article => (
          <div key={article.id} className="card p-6 flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full mb-4">
                <Tag className="w-3 h-3" />
                {article.kategori || 'Edukasi'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 hover:text-secondary">
                {article.judul}
              </h3>
              <div 
                className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-6" 
                dangerouslySetInnerHTML={{ __html: article.isi }} 
              />
            </div>

            <Link
              to={`/edukasi/${article.slug}`}
              className="btn-primary !py-2.5 !px-4 text-xs font-semibold self-start"
            >
              Baca Selengkapnya
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        ))}
      </div>

      {/* 2. Matriks Penindakan Berdasarkan Kategori */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary-900 text-white shadow-sm">
              <Scale className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-secondary font-bold">Pedoman Disiplin Satgas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Resmi Polinela & BNN
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                2. Matriks Penindakan Berdasarkan Kategori
              </h2>
            </div>
          </div>
        </div>

        {/* Tabel Matriks Penindakan */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 w-32">Kategori</th>
                <th className="py-3.5 px-4 w-1/3">Kriteria Pelanggaran</th>
                <th className="py-3.5 px-4">Tindakan / Sanksi</th>
                <th className="py-3.5 px-4 w-56">Pelaksana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* RINGAN */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-4 px-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    RINGAN
                  </span>
                </td>
                <td className="py-4 px-4 align-top text-slate-700 leading-relaxed font-medium">
                  Pengguna pemula, coba-coba, tidak kecanduan berat, sukarela melapor.
                </td>
                <td className="py-4 px-4 align-top text-slate-800 leading-relaxed">
                  <div className="font-bold text-slate-900 mb-1">Mediasi & Pembinaan:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Wajib lapor diri secara berkala.</li>
                    <li>Pembinaan fisik melalui kegiatan olahraga terjadwal.</li>
                    <li>Konseling psikologis.</li>
                  </ul>
                </td>
                <td className="py-4 px-4 align-top font-bold text-slate-800">
                  Bidang Penyuluhan & Pencegahan
                </td>
              </tr>

              {/* SEDANG */}
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-4 px-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs bg-orange-100 text-orange-800 border border-orange-200">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    SEDANG
                  </span>
                </td>
                <td className="py-4 px-4 align-top text-slate-700 leading-relaxed font-medium">
                  Pengguna aktif, pernah diperingatkan, atau mengonsumsi di lingkungan kampus.
                </td>
                <td className="py-4 px-4 align-top text-slate-800 leading-relaxed">
                  <div className="font-bold text-slate-900 mb-1">Sanksi Akademik:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Skorsing (pemberhentian sementara) dari Polinela.</li>
                    <li>Pencabutan hak beasiswa (jika ada).</li>
                    <li>Syarat rehabilitasi medis sebelum kembali aktif.</li>
                  </ul>
                </td>
                <td className="py-4 px-4 align-top font-bold text-slate-800">
                  Ketua Satgas & Manajemen Polinela
                </td>
              </tr>

              {/* BERAT */}
              <tr className="hover:bg-slate-50/60 transition bg-rose-50/20">
                <td className="py-4 px-4 align-top">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs bg-rose-100 text-rose-800 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    BERAT
                  </span>
                </td>
                <td className="py-4 px-4 align-top text-slate-700 leading-relaxed font-medium">
                  Pengedar, bandar, kurir, atau ditemukan barang bukti dalam jumlah besar (untuk dijual).
                </td>
                <td className="py-4 px-4 align-top text-slate-800 leading-relaxed">
                  <div className="font-bold text-rose-900 mb-1">Tindakan Hukum & Pemecatan:</div>
                  <ul className="list-disc list-inside space-y-1 text-rose-950">
                    <li>Drop Out (DO) / Dikeluarkan secara tidak hormat.</li>
                    <li>Integrasi & Penyerahan kepada pihak eksternal (BNN/Kepolisian).</li>
                  </ul>
                </td>
                <td className="py-4 px-4 align-top font-bold text-slate-800">
                  Satgas & Bidang Hubungan Antar Lembaga
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
