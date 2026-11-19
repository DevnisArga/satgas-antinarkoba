import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getUploadUrl } from '../../lib/api';

export default function BeritaDetail() {
  const { slug } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/news/${slug}`);
      setNews(res.data);
    } catch {
      setNews({
        judul: 'Satgas Anti Narkoba Polinela Resmi Dibentuk Bersama BNN Lampung',
        tanggal: '2025-07-15',
        author: 'Humas Satgas Polinela',
        gambar: null,
        isi: `
          <p class="mb-4">Politeknik Negeri Lampung (Polinela) secara resmi membentuk Satuan Tugas (Satgas) Pencegahan dan Penanganan Narkoba pada Juli 2025 yang disahkan melalui keputusan bersama dengan Badan Narkotika Nasional (BNN) Provinsi Lampung.</p>
          <p class="mb-4">Wakil Direktur III Bidang Kemahasiswaan Polinela menegaskan bahwa pembentukan Satgas ini berorientasi proaktif, bukan reaktif. Tujuan intinya adalah memberikan rasa aman bagi seluruh mahasiswa, dosen, dan tenaga kependidikan untuk bersama-sama memerangi peredaran zat adiktif di kampus.</p>
          <p class="mb-4">Salah satu terobosan utamanya adalah peluncuran platform Sistem Informasi Pengaduan berbasis web dengan sistem pelaporan terenkripsi yang menjamin perlindungan privasi pelapor tanpa resiko kebocoran data identitas.</p>
        `
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (gambar) => {
    if (!gambar) return null;
    return getUploadUrl(gambar);
  };

  if (loading) {
    return (
      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
          <div className="h-10 bg-slate-200 rounded w-3/4" />
          <div className="aspect-video bg-slate-200 rounded-2xl w-full" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Link to="/berita" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-accent-dark transition">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Berita
      </Link>

      <article className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            {news.judul}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-b border-slate-100 pb-5 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <User className="w-4 h-4 text-secondary" /> {news.author || 'Humas Polinela'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-secondary" /> {news.tanggal ? news.tanggal.slice(0, 10) : '-'}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Tautan berita berhasil disalin!');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
            >
              <Share2 className="w-4 h-4" /> Bagikan Berita
            </button>
          </div>
        </div>

        {/* Featured Banner Image */}
        {news.gambar && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
            <img
              src={getImageSrc(news.gambar)}
              alt={news.judul}
              className="w-full max-h-[460px] object-cover"
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Article Body */}
        <div 
          className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: news.isi }}
        />
      </article>
    </div>
  );
}
