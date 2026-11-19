import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, User, Phone, FileText, Upload, CheckCircle2, 
  AlertTriangle, Download, Copy, Check, Users, ShieldCheck, X, ExternalLink, MapPin, BadgeCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function LaporkanEksternal() {
  const [loading, setLoading] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tipePelapor, setTipePelapor] = useState('masyarakat'); // 'masyarakat' | 'instansi'
  const [ktpFile, setKtpFile] = useState(null);

  // Otomatis terisi tanggal hari ini & jam saat ini (dapat diedit sendiri oleh pelapor)
  const getTodayDate = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  const [formData, setFormData] = useState({
    instansi: '',
    domisili: '',
    nama_petugas: '',
    kontak: '',
    email: '',
    no_referensi: '',
    pangkat_nrp: '',
    category_id: 'Dugaan Peredaran',
    location: '',
    incident_date: getTodayDate(),
    incident_time: getCurrentTime(),
    description: '',
    involved_parties: '',
  });
  const [files, setFiles] = useState([]);

  // State validasi real-time
  const [fieldErrors, setFieldErrors] = useState({
    kontak: '',
    email: '',
    no_referensi: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validasi real-time field identitas eksternal
    if (name === 'kontak') {
      if (/[^0-9]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, kontak: 'Nomor WhatsApp hanya boleh berisi angka (tanpa huruf/simbol).' }));
      } else if (value.length > 0 && value.length < 11) {
        setFieldErrors(prev => ({ ...prev, kontak: `Nomor terlalu pendek, minimal 11 angka (saat ini ${value.length} angka).` }));
      } else if (value.length > 13) {
        setFieldErrors(prev => ({ ...prev, kontak: `Nomor terlalu panjang, maksimal 13 angka.` }));
      } else {
        setFieldErrors(prev => ({ ...prev, kontak: '' }));
      }
    }

    if (name === 'email') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Format email tidak valid (contoh: nama@gmail.com).' }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    }

    if (name === 'no_referensi' && tipePelapor === 'masyarakat') {
      if (value && /[^0-9]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, no_referensi: 'NIK KTP hanya boleh berisi angka.' }));
      } else if (value && value.length !== 16) {
        setFieldErrors(prev => ({ ...prev, no_referensi: `NIK KTP harus 16 angka (saat ini ${value.length} angka).` }));
      } else {
        setFieldErrors(prev => ({ ...prev, no_referensi: '' }));
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 5) {
      toast.error('Maksimal 5 berkas lampiran.');
      return;
    }
    setFiles(prev => [...prev, ...selected].slice(0, 5));
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_petugas.trim()) {
      toast.error('Nama lengkap pelapor / petugas wajib diisi.');
      return;
    }
    if (!formData.kontak.trim()) {
      toast.error('Nomor WhatsApp / HP wajib diisi agar Satgas dapat menghubungi Anda.');
      return;
    }
    if (!/^\d{11,13}$/.test(formData.kontak.trim())) {
      toast.error('Nomor WhatsApp / HP harus berupa angka dan berjumlah 11 sampai 13 digit.');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Format email tidak valid.');
      return;
    }
    if (tipePelapor === 'masyarakat' && formData.no_referensi && !/^\d{16}$/.test(formData.no_referensi.trim())) {
      toast.error('NIK KTP harus berupa 16 digit angka.');
      return;
    }
    if (tipePelapor === 'masyarakat' && !ktpFile) {
      toast.error('Foto / Scan asli KTP pelapor wajib diunggah untuk verifikasi identitas.');
      return;
    }
    if (files.length === 0) {
      toast.error('Lampiran bukti atau surat dinas wajib diunggah minimal 1 berkas (foto/PDF).');
      return;
    }
    if (tipePelapor === 'instansi' && !formData.instansi.trim()) {
      toast.error('Mohon isi nama instansi pelapor.');
      return;
    }
    if (formData.description.trim().length < 30) {
      toast.error('Ringkasan kasus minimal 30 karakter.');
      return;
    }

    setLoading(true);
    try {
      const finalInstansi = tipePelapor === 'masyarakat'
        ? (formData.domisili?.trim() ? `Masyarakat (Domisili: ${formData.domisili.trim()})` : 'Masyarakat Umum')
        : `${formData.instansi.trim()}${formData.pangkat_nrp?.trim() ? ` (${formData.pangkat_nrp.trim()})` : ''}`;

      const data = new FormData();
      data.append('instansi', finalInstansi);
      data.append('nama_petugas', formData.nama_petugas.trim());
      data.append('kontak', formData.kontak.trim());
      if (formData.email) data.append('email', formData.email.trim());
      data.append('no_referensi', formData.no_referensi?.trim() || '');
      data.append('category_id', formData.category_id);
      data.append('location', formData.location?.trim() || '');
      data.append('incident_date', formData.incident_date || '');
      data.append('incident_time', formData.incident_time || '');
      data.append('description', formData.description.trim());
      data.append('involved_parties', formData.involved_parties?.trim() || '');

      // Lampirkan Foto KTP jika pelapor masyarakat umum
      if (tipePelapor === 'masyarakat' && ktpFile) {
        const cleanName = formData.nama_petugas.trim().replace(/[^a-zA-Z0-9]/g, '_');
        const renamedKtp = new File([ktpFile], `Foto_KTP_${cleanName}_${ktpFile.name}`, { type: ktpFile.type });
        data.append('attachments', renamedKtp);
      }

      files.forEach(file => {
        data.append('attachments', file);
      });

      const res = await api.post('/reports/external', data);
      setSubmittedCode(res.data.tracking_code);
      toast.success('Laporan pihak eksternal berhasil diterima');
    } catch (err) {
      console.error('Eksternal report error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal mengirim laporan eksternal ke database.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (submittedCode) {
    return (
      <div className="pt-28 pb-20 px-4 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Laporan Eksternal Berhasil Didaftarkan</h2>
        <p className="text-sm text-slate-600">
          Laporan dari Anda telah masuk ke sistem Satgas Anti Narkoba Polinela dengan penanda "Eksternal".
        </p>

        <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl">
          <span className="text-[10px] text-accent font-bold tracking-widest block mb-2">KODE TIKET EKSTERNAL</span>
          <div className="text-3xl font-mono font-black py-2">{submittedCode}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(submittedCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl inline-flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin' : 'Salin Kode Tiket'}
          </button>
        </div>

        <div className="pt-4">
          <a href="/lacak" className="btn-primary !py-2.5 !px-6 text-sm">
            Pantau Status Penanganan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Banner Switcher: Pengarah ke Jalur Internal Civitas */}
      <div className="mb-6 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5 text-emerald-950">
          <span className="p-1 px-2 rounded-md bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wide">
            Jalur Civitas
          </span>
          <span className="font-medium">
            Merupakan Mahasiswa, Dosen, atau Pegawai Politeknik Negeri Lampung? Silakan gunakan:
          </span>
        </div>
        <Link
          to="/laporkan"
          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 hover:border-emerald-300 transition shadow-xs shrink-0"
        >
          <span>Formulir Laporan Internal (Civitas)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Header Eksternal */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold mb-2.5">
          <Building2 className="w-4 h-4 text-blue-700" />
          <span>KHUSUS EKSTERNAL KAMPUS & MASYARAKAT MITRA</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Formulir Laporan Eksternal & Mitra</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
          Saluran pelaporan terstruktur bagi <strong>Masyarakat Umum, Warga Sekitar Rajabasa, Orang Tua Mahasiswa, serta Instansi Penegak Hukum (BNN dan Kepolisian RI)</strong>.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pilihan Jenis Pelapor Eksternal */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kategori Pelapor Eksternal <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipePelapor('masyarakat')}
                className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3.5 transition-all ${
                  tipePelapor === 'masyarakat'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl ${tipePelapor === 'masyarakat' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Masyarakat Umum & Warga</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Warga sekitar kampus Rajabasa, orang tua mahasiswa, tokoh masyarakat, atau pemerhati.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipePelapor('instansi')}
                className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3.5 transition-all ${
                  tipePelapor === 'instansi'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl ${tipePelapor === 'instansi' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Instansi Mitra / APH (BNN / Polri)</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Aparat Penegak Hukum (BNN, Polda/Polresta/Polsek) atau instansi kedinasan pemerintah.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Data Identitas Pelapor (Masyarakat Umum) */}
          {tipePelapor === 'masyarakat' ? (
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/50">
                <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-700" />
                  Identitas Pelapor (Masyarakat Umum & Warga)
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Kerahasiaan Terjamin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pelapor <span className="text-red-500 font-bold">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="nama_petugas"
                    required
                    placeholder="Nama lengkap Anda"
                    value={formData.nama_petugas}
                    onChange={handleChange}
                    className="input-field bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP Aktif <span className="text-red-500 font-bold">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="kontak"
                    required
                    placeholder="Contoh: 08123456789"
                    maxLength={13}
                    inputMode="numeric"
                    value={formData.kontak}
                    onChange={handleChange}
                    className={`input-field bg-white ${fieldErrors.kontak ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.kontak
                    ? <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.kontak}</span>
                    : <span className="text-[10px] text-slate-500 mt-0.5 block">Diperlukan tim Satgas untuk koordinasi (11-13 angka).</span>
                  }
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah Domisili / Alamat Tempat Tinggal <span className="text-red-500">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="domisili"
                    required
                    placeholder="Contoh: Jl. ZA Pagar Alam, Kel. Rajabasa, Bandar Lampung"
                    value={formData.domisili}
                    onChange={handleChange}
                    className="input-field bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor KTP / NIK (Opsional)</label>
                  <input
                    type="text"
                    name="no_referensi"
                    placeholder="16 digit NIK KTP (opsional)"
                    maxLength={16}
                    inputMode="numeric"
                    value={formData.no_referensi}
                    onChange={handleChange}
                    className={`input-field bg-white font-mono ${fieldErrors.no_referensi ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.no_referensi && (
                    <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.no_referensi}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Aktif (Opsional)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="nama@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field bg-white ${fieldErrors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.email && (
                    <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.email}</span>
                  )}
                </div>

                {/* Unggah Foto / Scan Asli KTP Pelapor (WAJIB) */}
                <div className="sm:col-span-2 pt-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex flex-wrap items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-700" />
                      <span>Foto / Scan Asli KTP Pelapor</span> <span className="text-red-500 font-black">* (Wajib Diunggah)</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">Format: JPG, PNG, PDF (Maks 10MB)</span>
                  </label>

                  <div className={`p-4 rounded-2xl border-2 border-dashed transition flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    ktpFile 
                      ? 'border-emerald-400 bg-emerald-50/50' 
                      : 'border-amber-300 bg-amber-50/40 hover:border-blue-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${ktpFile ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        {ktpFile ? (
                          <div>
                            <span className="text-xs font-bold text-emerald-950 block truncate max-w-xs">{ktpFile.name}</span>
                            <span className="text-[11px] text-emerald-700">
                              {(ktpFile.size / 1024).toFixed(1)} KB — Berkas KTP berhasil dilampirkan
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Pilih berkas foto/scan KTP fisik Anda</span>
                            <span className="text-[11px] text-slate-500">
                              Wajib diunggah sebagai bukti sah identitas pelapor masyarakat umum
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ktpFile && (
                        <button
                          type="button"
                          onClick={() => setKtpFile(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition"
                        >
                          Hapus
                        </button>
                      )}
                      <label className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer transition shadow-xs">
                        <span>{ktpFile ? 'Ganti Foto KTP' : 'Unggah Foto KTP'}</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const f = e.target.files[0];
                              if (f.size > 10 * 1024 * 1024) {
                                toast.error('Ukuran file KTP maksimal 10MB.');
                                return;
                              }
                              setKtpFile(f);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {!ktpFile && (
                    <p className="text-[11px] font-semibold text-amber-700 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Lampiran foto KTP asli wajib diunggah agar laporan masyarakat umum dapat diproses oleh Satgas.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Data Petugas / Instansi */
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/50">
                <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  Identitas Instansi / Aparat Penegak Hukum (BNN / Polri)
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-700" />
                  Saluran Kedinasan Resmi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Instansi / Lembaga / Satuan <span className="text-red-500 font-bold">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="instansi"
                    required={tipePelapor === 'instansi'}
                    placeholder="Contoh: BNNP Lampung / Polresta Bandar Lampung / Polsek Kedaton"
                    value={formData.instansi}
                    onChange={handleChange}
                    className="input-field bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Petugas / Penyidik / Pelapor <span className="text-red-500 font-bold">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="nama_petugas"
                    required
                    placeholder="Nama lengkap & gelar petugas"
                    value={formData.nama_petugas}
                    onChange={handleChange}
                    className="input-field bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pangkat / Jabatan / NRP / NIP (Opsional)
                  </label>
                  <input
                    type="text"
                    name="pangkat_nrp"
                    placeholder="Contoh: AIPDA / Penyidik BNNP / NRP 8501..."
                    value={formData.pangkat_nrp}
                    onChange={handleChange}
                    className="input-field bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kontak WhatsApp / Telepon Resmi Petugas <span className="text-red-500 font-black">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="kontak"
                    required
                    placeholder="Contoh: 08123456789"
                    maxLength={13}
                    inputMode="numeric"
                    value={formData.kontak}
                    onChange={handleChange}
                    className={`input-field bg-white ${fieldErrors.kontak ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.kontak
                    ? <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.kontak}</span>
                    : <span className="text-[10px] text-slate-500 mt-0.5 block">Diperlukan tim Satgas untuk koordinasi (11-13 angka).</span>
                  }
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi / Kedinasan (Opsional)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="nama@instansi.go.id"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field bg-white ${fieldErrors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.email && (
                    <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.email}</span>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Surat Tugas / Nomor Laporan Informasi / Rujukan (Opsional)
                  </label>
                  <input
                    type="text"
                    name="no_referensi"
                    placeholder="Contoh: B/124/X/2026/BNNP atau R/LI/04/XI/2026/Resnarkoba"
                    value={formData.no_referensi}
                    onChange={handleChange}
                    className="input-field bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rincian Kasus */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Perkara</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="select-field"
                >
                  <option value="Dugaan Peredaran">Dugaan Peredaran Jaringan</option>
                  <option value="Penyalahgunaan/Konsumsi di Kampus">Penyalahgunaan / Konsumsi</option>
                  <option value="Kepemilikan Barang Terlarang">Kepemilikan Barang Terlarang</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kejadian / Temuan</label>
                <input
                  type="date"
                  name="incident_date"
                  value={formData.incident_date}
                  onChange={handleChange}
                  className="input-field"
                />
                <p className="text-[10px] text-slate-400 mt-1">Otomatis hari ini (bisa diedit)</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perkiraan Waktu (Opsional)</label>
                <input
                  type="time"
                  name="incident_time"
                  value={formData.incident_time}
                  onChange={handleChange}
                  className="input-field"
                />
                <p className="text-[10px] text-slate-400 mt-1">Otomatis jam sekarang (bisa diedit)</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Terkait / Kampus Polinela</label>
              <input
                type="text"
                name="location"
                placeholder="Lokasi penangkapan/dugaan di area kampus atau sekitar Polinela"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Terduga Sivitas yang Terkait (Jika Ada)</label>
              <input
                type="text"
                name="involved_parties"
                placeholder="Nama mahasiswa / pegawai / pihak terduga (jika diketahui)"
                value={formData.involved_parties}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan Kronologi Kasus / Uraian Laporan *</label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="Rincian informasi kasus untuk ditindaklanjuti oleh pimpinan Polinela dan Satgas Anti Narkoba (min 30 karakter)..."
                value={formData.description}
                onChange={handleChange}
                className="textarea-field"
              />
            </div>

            {/* Lampiran Berkas Bukti */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tipePelapor === 'masyarakat' 
                  ? 'Lampiran Berkas Bukti / Foto (Maks 5 File, PDF / Foto)' 
                  : 'Lampiran Berkas / Surat Dinas (PDF / Foto)'}{' '}
                <span className="text-red-500 font-black">* (Wajib Diunggah)</span>
              </label>
              {files.length === 0 && (
                <p className="text-xs font-bold text-amber-600 mb-2">
                  ⚠️ Minimal 1 berkas bukti wajib dilampirkan agar laporan dapat dikirim.
                </p>
              )}
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer border rounded-xl p-2 ${
                  files.length === 0 ? 'border-amber-300 bg-amber-50/30' : 'border-emerald-300 bg-emerald-50/20'
                }`}
              />

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="truncate max-w-xs font-medium text-slate-700">{f.name} ({(f.size/1024/1024).toFixed(2)} MB)</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 font-bold px-2 inline-flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary !bg-blue-900 !py-3 !px-8">
              {loading ? 'Mengirim...' : (tipePelapor === 'masyarakat' ? 'Kirim Laporan Masyarakat Umum' : 'Kirim Laporan Resmi Eksternal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
