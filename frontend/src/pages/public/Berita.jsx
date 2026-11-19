import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ChevronRight, User, Image } from 'lucide-react';
import api, { getUploadUrl } from '../../lib/api';

export default function Berita() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await api.get('/news?limit=20');
      setNewsList(res.data.data || []);
    } catch {
      setNewsList([
        {
          id: 1,
          judul: 'Satgas Anti Narkoba Polinela Resmi Dibentuk Bersama BNN Lampung',
          slug: 'satgas-resmi-dibentuk',
          tanggal: '2025-07-15',
          isi: '<p>Politeknik Negeri Lampung bersama BNN Provinsi Lampung meresmikan pembentukan satuan tugas penanganan dan pencegahan narkoba di lingkungan sivitas akademika.</p>'
        },
        {
          id: 2,
          judul: 'Sosialisasi Bahaya Narkoba Bersama Ribuan Mahasiswa Baru 2026',
          slug: 'sosialisasi-bnn-lampung',
          tanggal: '2026-09-01',
          isi: '<p>Kegiatan pengenalan sistem pelaporan terpadu dan materi bahaya narkotika disampaikan langsung oleh narasumber BNN Provinsi Lampung di GSG Polinela.</p>'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (gambar) => {
    if (!gambar) return null;
    return getUploadUrl(gambar);
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-secondary font-bold">Publikasi Resmi</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2">Kabar & Berita Satgas</h1>
        <p className="text-slate-600 mt-3 text-sm sm:text-base">
          Informasi terkini mengenai kegiatan, kerjasama pencegahan, rilis pers, dan agenda penegakan hukum Satgas Anti Narkoba Polinela.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-5 animate-pulse space-y-4">
              <div className="aspect-video w-full bg-slate-200 rounded-2xl" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-12 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsList.map((item) => (
            <article
              key={item.id}
              className="group card overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/80"
            >
              <div>
                {/* Image / Cover */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  {item.gambar ? (
                    <img
                      src={getImageSrc(item.gambar)}
                      alt={item.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`${item.gambar ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-linear-to-br from-primary-900/10 via-secondary/10 to-accent/10 text-secondary`}>
                    <div className="text-center p-4">
                      <Newspaper className="w-10 h-10 mx-auto text-secondary/60 mb-1" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Berita Satgas</span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-primary-900 shadow-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-secondary" />
                      {item.tanggal ? item.tanggal.slice(0, 10) : 'Terbaru'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
                    <Link to={`/berita/${item.slug}`}>
                      {item.judul}
                    </Link>
                  </h3>
                  <div
                    className="text-xs text-slate-600 line-clamp-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.isi }}
                  />
                </div>
              </div>

              {/* Footer CTA */}
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                <Link
                  to={`/berita/${item.slug}`}
                  className="btn-primary !py-2.5 !px-4 text-xs font-semibold w-full justify-center group-hover:shadow-md"
                >
                  Baca Berita Lengkap
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
