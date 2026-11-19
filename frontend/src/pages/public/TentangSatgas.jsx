import { Shield, Users, Phone, Mail, MapPin, Award, CheckCircle, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TentangSatgas() {
  const handleEmailClick = () => {
    const email = 'antinarkoba@polinela.ac.id';
    const subject = encodeURIComponent('Konsultasi Satgas Anti Narkoba Polinela');

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(email);
    }
    toast.success('Membuka Gmail & email disalin ke clipboard!', {
      icon: '✉️'
    });

    // Buka Gmail web langsung di tab baru agar tidak tergantung aplikasi email Windows
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}`, '_blank');
  };
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-5 flex items-center justify-center">
          <img src="/logo_satgas_anti_narkoba_HD.svg" alt="Logo Satgas Anti Narkoba Polinela" className="w-full h-full object-contain filter drop-shadow-xl" />
        </div>
        <span className="text-xs uppercase tracking-widest text-secondary font-bold">Profil Organisasi</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2">Satgas Anti Narkoba Polinela</h1>
        <p className="text-slate-600 mt-3 text-sm sm:text-base">
          Garda terdepan pencegahan, penindakan, dan pemulihan sivitas akademika Politeknik Negeri Lampung dari bahaya narkotika.
        </p>
      </div>

      {/* Profil & Dasar Pembentukan (PRD §1 & §4) */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Award className="w-6 h-6 text-secondary" />
          Dasar Pembentukan & Kolaborasi BNN
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Satgas Anti Narkoba Polinela resmi dibentuk pada <strong>Juli 2025</strong> melalui kolaborasi terpadu bersama <strong>Badan Narkotika Nasional (BNN) Provinsi Lampung</strong> serta pimpinan Politeknik Negeri Lampung via Wakil Direktur III Bidang Kemahasiswaan.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Platform website ini dibangun khusus untuk mengatasi kendala pelaporan konvensional. Melalui dukungan sistem enkripsi data dan tiket pelacakan aman, mahasiswa, dosen, dan tendik dapat berpartisipasi aktif menjaga integritas kampus dengan jaminan kerahasiaan penuh dari Satgas tanpa rasa takut akan kebocoran identitas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-2xl font-black text-secondary block">Juli 2025</span>
            <span className="text-xs text-slate-500">Tahun Resmi Dibentuk</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-2xl font-black text-secondary block">BNNP Lampung</span>
            <span className="text-xs text-slate-500">Mitra Penegakan Resmi</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-2xl font-black text-secondary block">100% Digital</span>
            <span className="text-xs text-slate-500">Sistem Pengaduan & Tracking</span>
          </div>
        </div>
      </div>

      {/* Struktur & Tim Pengembang Proyek Mandiri (PRD Tim) */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Tim Pengembang Proyek Mandiri</h2>
          <p className="text-xs text-slate-500 mt-1">Pengembang Sistem Informasi Satgas Anti Narkoba Polinela</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              nama: 'Devnis Arga Vanis Setiawan', 
              peran: 'Backend Developer & UI Integration'
            },
            { 
              nama: 'Nabila Ramadhani', 
              peran: 'UI/UX Designer & Dokumentasi Sistem'
            },
            { 
              nama: 'Shofiyyah Nabila Putri', 
              peran: 'System Analyst & Quality Assurance'
            },
            { 
              nama: 'Yuda Aditya Putra', 
              peran: 'Frontend Developer'
            },
          ].map((anggota, i) => (
            <div 
              key={i} 
              className="card p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md hover:border-secondary/30 transition flex flex-col items-center text-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg border border-secondary/20 shadow-xs">
                {anggota.nama.charAt(0)}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 leading-snug">{anggota.nama}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{anggota.peran}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kontak & Hotline Resmi */}
      <div className="p-8 sm:p-12 rounded-3xl bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="space-y-2 max-w-lg">
          <span className="text-xs text-accent font-bold tracking-widest uppercase">Hotline Bantuan Khusus</span>
          <h3 className="text-2xl font-bold">Butuh Bantuan Konseling atau Darurat?</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Hubungi kantor Satgas Anti Narkoba atau sambungan darurat BNN Lampung pada jam operasional kampus.
          </p>
        </div>
        <div className="space-y-3 w-full md:w-auto">
          <a
            href="https://wa.me/6282282147037?text=Halo%20Satgas%20Anti%20Narkoba%20Polinela,%20saya%20ingin%20berkonsultasi"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !bg-[#25D366] hover:!bg-[#20ba59] !text-white flex items-center justify-center gap-2.5 !py-3.5 !px-6 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all w-full md:w-auto cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white text-white" />
            <span>WhatsApp (+62 822 8214 7037)</span>
          </a>
          <button
            type="button"
            onClick={handleEmailClick}
            className="px-6 py-3 rounded-xl border border-white/20 text-xs font-semibold text-white hover:bg-white/15 hover:border-white/40 flex items-center justify-center gap-2 transition-all w-full md:w-auto cursor-pointer"
          >
            <Mail className="w-4 h-4 text-accent" />
            <span>Email: antinarkoba@polinela.ac.id</span>
          </button>
        </div>
      </div>
    </div>
  );
}
