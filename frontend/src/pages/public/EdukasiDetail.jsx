import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, User, Shield, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function EdukasiDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/education/${slug}`);
      setArticle(res.data);
    } catch {
      setArticle({
        judul: 'Mengenal Jenis-Jenis Narkotika dan Bahaya Ketergantungannya',
        kategori: 'Jenis Narkotika',
        author: 'Satgas Anti Narkoba Polinela',
        created_at: '2026-09-15',
        isi: `
          <p class="mb-4">Narkotika adalah zat atau obat yang berasal dari tanaman atau bukan tanaman, baik sintetis maupun semi sintetis, yang dapat menyebabkan penurunan atau perubahan kesadaran, hilangnya rasa, mengurangi sampai menghilangkan rasa nyeri, dan dapat menimbulkan ketergantungan yang diatur dalam Undang-Undang Nomor 35 Tahun 2009.</p>
          <h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">1. Narkotika Golongan I</h3>
          <p class="mb-4">Hanya dapat digunakan untuk tujuan pengembangan ilmu pengetahuan dan tidak digunakan dalam terapi medis, serta mempunyai potensi sangat tinggi mengakibatkan ketergantungan. Contoh: Tanaman Ganja, Heroin, Kokain, Sabu-sabu (Metamfetamin), dan Ekstasi.</p>
          <h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">2. Narkotika Golongan II</h3>
          <p class="mb-4">Berkhasiat pengobatan digunakan sebagai pilihan terakhir dan dapat digunakan dalam terapi atau untuk tujuan pengembangan ilmu pengetahuan. Memiliki potensi tinggi ketergantungan. Contoh: Morfin, Petidin, Fentanil.</p>
          <h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">3. Narkotika Golongan III</h3>
          <p class="mb-4">Berkhasiat pengobatan dan banyak digunakan dalam terapi dan/atau untuk tujuan pengembangan ilmu pengetahuan serta mempunyai potensi ringan mengakibatkan ketergantungan. Contoh: Kodein.</p>
          <div class="p-6 bg-red-50 rounded-2xl border border-red-100 mt-8">
            <h4 class="font-bold text-red-900 text-sm mb-2">Ingat dan Waspada!</h4>
            <p class="text-xs text-red-700">Peredaran narkoba di lingkungan kampus dapat merusak masa depan akademik, kesehatan fisik, dan membawa konsekuensi hukum pidana penjara minimal 4 hingga 20 tahun.</p>
          </div>
        `
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan artikel berhasil disalin!');
  };

  if (!article) return null;

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <Link to="/edukasi" className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-accent-dark">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Edukasi
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-xl space-y-6">
        <div className="space-y-3">
          <span className="px-3.5 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full inline-block">
            {article.kategori}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            {article.judul}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-slate-100 pb-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-secondary" /> {article.author || 'Satgas Polinela'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-secondary" /> {new Date(article.created_at).toLocaleDateString('id-ID')}
              </span>
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
            >
              <Share2 className="w-3.5 h-3.5" /> Bagikan
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div 
          className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: article.isi }}
        />
      </div>
    </div>
  );
}
