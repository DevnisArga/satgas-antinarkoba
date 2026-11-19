import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Lock, EyeOff, FileText, ArrowRight, 
  Search, CheckCircle2, ChevronRight, Calendar, AlertTriangle, BookOpen, Newspaper
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api, { getUploadUrl } from '../../lib/api';
import ScrollReveal from '../../lib/ScrollReveal';

export default function Beranda() {
  const [educations, setEducations] = useState([]);
  const [news, setNews] = useState([]);
  const [agendas, setAgendas] = useState([]);

  useEffect(() => {
    // Fetch preview data (3 edu, 2 news, 3 agendas per FR-4)
    const fetchData = async () => {
      try {
        const [eduRes, newsRes, agendaRes] = await Promise.allSettled([
          api.get('/education?limit=3'),
          api.get('/news?limit=2'),
          api.get('/agendas?limit=3')
        ]);
        if (eduRes.status === 'fulfilled' && eduRes.value.data?.data) {
          setEducations(eduRes.value.data.data);
        }
        if (newsRes.status === 'fulfilled' && newsRes.value.data?.data) {
          setNews(newsRes.value.data.data);
        }
        if (agendaRes.status === 'fulfilled' && agendaRes.value.data?.data) {
          setAgendas(agendaRes.value.data.data);
        }
      } catch (err) {
        console.error('Error fetching preview data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-24 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center bg-hero-pattern text-white overflow-hidden pt-20 px-4">
        {/* Glow circles & mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium tracking-wide animate-fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            Saluran Resmi Satgas Anti Narkoba Polinela & BNN Provinsi Lampung
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-balance">
            Bersama Wujudkan Kampus Polinela <span className="gradient-text">Bersih dari Narkoba dan Minuman Keras</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Laporkan dugaan penyalahgunaan dan peredaran narkoba secara rahasia dan aman. Identitas Anda terlindungi dengan enkripsi berlapis, tanpa pelacakan data pribadi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/laporkan" className="btn-primary w-full sm:w-auto text-sm sm:text-base !py-3.5 !px-6 shadow-xl flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Lapor Internal (Civitas)</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/laporkan/eksternal" className="btn-secondary w-full sm:w-auto text-sm sm:text-base !py-3.5 !px-6 bg-blue-600/90 hover:bg-blue-600 text-white border-blue-400/40 flex items-center justify-center gap-2 shadow-lg">
              <FileText className="w-5 h-5" />
              <span>Lapor Eksternal (Masyarakat)</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/lacak" className="btn-secondary w-full sm:w-auto text-sm sm:text-base !py-3.5 !px-6 bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              <span>Lacak Laporan</span>
            </Link>
          </div>

          {/* Micro Security Guarantee */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs sm:text-sm text-slate-300 border-t border-white/10">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-accent" />
              <span>Identitas Terlindungi Penuh</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              <span>Data Identitas Terenkripsi</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>Akses Khusus Verifikator Satgas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. JAMINAN KEAMANAN & PRIVASI (PRD §8) */}
      <ScrollReveal>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-secondary font-bold">Privasi Utama</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Mengapa Anda Aman Melapor di Sini?</h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Kami memprioritaskan rasa aman pelapor dengan standar sistem perlindungan data yang ketat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-secondary/40 transition">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-5">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Kerahasiaan Terenkripsi</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seluruh identitas pelapor disimpan terenkripsi (AES-256) di database sistem Satgas dan hanya dapat diakses pejabat berwenang.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-secondary/40 transition">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enkripsi Berlapis</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Untuk pelapor teridentifikasi, data kontak dienkripsi tingkat aplikasi (AES-256) dan hanya dibuka oleh Satgas yang berwenang.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-secondary/40 transition">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pembersihan Metadata</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bukti foto atau dokumen yang Anda unggah secara otomatis dibersihkan dari informasi EXIF lokasi dan nama file asli.
              </p>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* 3. 4 LANGKAH ALUR KERJA (PRD §4 & §6) */}
      <ScrollReveal delay={100}>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-widest text-secondary font-bold">Transparansi Penanganan</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">4 Langkah Tindak Lanjut</h2>
          <p className="text-slate-600 mt-3 text-sm">
            Setiap laporan yang masuk diproses dengan prosedur baku dan dapat dilacak kapan saja menggunakan kode tiket Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Laporan Diterima', desc: 'Sistem mencatat laporan dan memberikan kode pelacakan unik instan.' },
            { step: '02', title: 'Diverifikasi', desc: 'Satgas memverifikasi keabsahan informasi dan bukti yang dilampirkan.' },
            { step: '03', title: 'Ditindaklanjuti', desc: 'Koordinasi penanganan terpadu bersama pimpinan kampus dan BNN.' },
            { step: '04', title: 'Selesai & Arsip', desc: 'Tindakan selesai direalisasikan, rekomendasi diterbitkan secara aman.' },
          ].map((item, idx) => (
            <div key={idx} className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-secondary/30 block mb-3">{item.step}</span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </ScrollReveal>

      {/* 4. PREVIEW EDUKASI & BERITA (FR-4) */}
      <ScrollReveal delay={100}>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Edukasi */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-secondary font-bold">Wawasan & Pencegahan</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Edukasi Bahaya Narkoba</h2>
          </div>
          <Link to="/edukasi" className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-accent-dark">
            Lihat Semua Edukasi <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Edukasi Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {educations.length > 0 ? (
            educations.map((item) => (
              <div key={item.id} className="card p-6 flex flex-col justify-between hover:shadow-lg transition">
                <div>
                  <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full mb-4">
                    {item.kategori || 'Edukasi'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{item.judul}</h3>
                  <div className="text-xs text-slate-600 line-clamp-3 mb-6" dangerouslySetInnerHTML={{ __html: item.isi }} />
                </div>
                <Link to={`/edukasi/${item.slug}`} className="text-xs font-bold text-secondary inline-flex items-center gap-1 hover:underline">
                  Baca Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 bg-slate-50 rounded-2xl text-slate-500 text-sm">
              Memuat data edukasi terkini...
            </div>
          )}
        </div>

        {/* Berita & Agenda Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          {/* Berita Terbaru */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-secondary" />
                Kabar Terkini Satgas
              </h3>
              <Link to="/berita" className="text-xs font-bold text-secondary hover:underline">
                Semua Berita
              </Link>
            </div>
            <div className="space-y-4">
              {news.length > 0 ? (
                news.map((item) => (
                  <Link
                    key={item.id}
                    to={`/berita/${item.slug}`}
                    className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 hover:border-secondary/40 shadow-sm hover:shadow-md transition group"
                  >
                    {item.gambar ? (
                      <img
                        src={getUploadUrl(item.gambar)}
                        alt={item.judul}
                        className="w-20 h-20 sm:w-24 sm:h-20 object-cover rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform border border-slate-100"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-20 bg-linear-to-br from-secondary/10 to-accent/10 rounded-xl flex items-center justify-center text-secondary flex-shrink-0 border border-slate-100">
                        <Newspaper className="w-7 h-7 opacity-60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                        <Calendar className="w-3 h-3 text-secondary" />
                        <span>{item.tanggal ? item.tanggal.slice(0, 10) : 'Terbaru'}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
                        {item.judul}
                      </h4>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-slate-400 bg-white rounded-2xl">Belum ada berita baru.</div>
              )}
            </div>
          </div>

          {/* Agenda Kegiatan */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                Agenda Sosialisasi
              </h3>
              <Link to="/agenda" className="text-xs font-bold text-secondary hover:underline">
                Semua Agenda
              </Link>
            </div>
            <div className="space-y-4">
              {agendas.length > 0 ? (
                agendas.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-accent-dark block">{item.tanggal}</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{item.judul}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.lokasi || 'Kampus Polinela'}</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                      {item.kategori || 'Kegiatan'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-slate-400 bg-white rounded-2xl">Belum ada agenda terdekat.</div>
              )}
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* 5. CALL TO ACTION PIHAK EKSTERNAL (FR-2) */}
      <ScrollReveal delay={100}>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-primary-container text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 bg-white/10 text-accent-light text-xs font-semibold rounded-full inline-block">
              Masyarakat Umum & Instansi Mitra
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold">Laporan Pihak Eksternal & Masyarakat Umum</h3>
            <p className="text-sm text-slate-300">
              Formulir terdedikasi untuk masyarakat umum, warga sekitar, maupun pihak BNN dan Kepolisian RI untuk menyampaikan laporan resmi secara terstruktur.
            </p>
          </div>
          <Link to="/laporkan/eksternal" className="btn-secondary !bg-white !text-primary whitespace-nowrap !py-3 !px-6">
            Buka Form Eksternal
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </section>
      </ScrollReveal>
    </div>
  );
}
