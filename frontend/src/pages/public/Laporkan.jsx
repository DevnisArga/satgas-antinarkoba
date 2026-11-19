import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, UserCheck, EyeOff, Upload, CheckCircle2, 
  Copy, AlertTriangle, ArrowRight, ArrowLeft, Download, Check,
  GraduationCap, Building, MapPin, ExternalLink, User, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function Laporkan() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(null);

  // Form State Internal (Civitas Akademika Polinela)
  const mode = 'teridentifikasi';

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
    category_id: '',
    location: '',
    incident_date: getTodayDate(),
    incident_time: getCurrentTime(),
    description: '',
    involved_parties: '',
    extra_info: '',
    // Identitas civitas pelapor (terenkripsi di DB)
    nama: '',
    nim_nip: '',
    telepon: '',
    email: '',
    agreement: false
  });

  // State validasi real-time identitas pelapor
  const [fieldErrors, setFieldErrors] = useState({
    nim_nip: '',
    telepon: '',
    email: ''
  });
  const [files, setFiles] = useState([]);
  const [selectedLocationOption, setSelectedLocationOption] = useState('');
  const [customLocationText, setCustomLocationText] = useState('');
  const [locationDetailText, setLocationDetailText] = useState('');

  const handleLocationOptionChange = (e) => {
    const val = e.target.value;
    setSelectedLocationOption(val);
    if (val === 'Lainnya / Di Luar Lingkungan Kampus') {
      setFormData(prev => ({ ...prev, location: customLocationText }));
    } else if (val) {
      const finalLoc = locationDetailText.trim() ? `${val} (${locationDetailText.trim()})` : val;
      setFormData(prev => ({ ...prev, location: finalLoc }));
    } else {
      setFormData(prev => ({ ...prev, location: '' }));
    }
  };

  const handleCustomLocationChange = (e) => {
    const text = e.target.value;
    setCustomLocationText(text);
    setFormData(prev => ({ ...prev, location: text }));
  };

  const handleLocationDetailChange = (e) => {
    const detail = e.target.value;
    setLocationDetailText(detail);
    if (selectedLocationOption && selectedLocationOption !== 'Lainnya / Di Luar Lingkungan Kampus') {
      const finalLoc = detail.trim() ? `${selectedLocationOption} (${detail.trim()})` : selectedLocationOption;
      setFormData(prev => ({ ...prev, location: finalLoc }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    // Validasi real-time khusus field identitas
    if (name === 'nim_nip') {
      // Hanya angka, blokir huruf
      if (/[^0-9]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, nim_nip: 'NPM/NIP hanya boleh berisi angka.' }));
      } else if (value.length > 0 && value.length !== 8) {
        setFieldErrors(prev => ({ ...prev, nim_nip: `NPM/NIP harus tepat 8 angka. (saat ini ${value.length} angka)` }));
      } else {
        setFieldErrors(prev => ({ ...prev, nim_nip: '' }));
      }
    }

    if (name === 'telepon') {
      // Hanya angka, blokir huruf
      if (/[^0-9]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, telepon: 'Nomor WhatsApp/HP hanya boleh berisi angka.' }));
      } else if (value.length > 0 && value.length < 11) {
        setFieldErrors(prev => ({ ...prev, telepon: `Nomor terlalu pendek, minimal 11 angka. (saat ini ${value.length})` }));
      } else if (value.length > 13) {
        setFieldErrors(prev => ({ ...prev, telepon: 'Nomor terlalu panjang, maksimal 13 angka.' }));
      } else {
        setFieldErrors(prev => ({ ...prev, telepon: '' }));
      }
    }

    if (name === 'email') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Format email tidak valid. Contoh: nama@gmail.com' }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      toast.error('Maksimal 5 berkas lampiran.');
      return;
    }
    for (const f of selectedFiles) {
      if (f.size > 25 * 1024 * 1024) {
        toast.error(`File ${f.name} melebihi batas 25MB.`);
        return;
      }
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.category_id) {
      toast.error('Pilih kategori laporan terlebih dahulu.');
      return false;
    }
    if (!formData.location.trim()) {
      toast.error('Lokasi kejadian wajib diisi.');
      return false;
    }
    if (!formData.incident_date) {
      toast.error('Tanggal kejadian wajib diisi.');
      return false;
    }
    if (formData.description.trim().length < 30) {
      toast.error('Deskripsi kejadian minimal 30 karakter agar dapat diproses.');
      return false;
    }
    return true;
  };

  // Step 2 Validation (Lampiran Bukti & Identitas Pelapor Wajib)
  const validateStep2 = () => {
    if (!formData.nama.trim()) {
      toast.error('Nama lengkap pelapor wajib diisi.');
      return false;
    }
    if (!formData.nim_nip.trim()) {
      toast.error('NPM / NIP pelapor wajib diisi.');
      return false;
    }
    if (!/^\d{8}$/.test(formData.nim_nip.trim())) {
      toast.error('NPM/NIP harus tepat 8 angka.');
      return false;
    }
    if (!formData.telepon.trim()) {
      toast.error('Nomor WhatsApp / HP wajib diisi agar tim Satgas dapat menghubungi Anda.');
      return false;
    }
    if (!/^\d{11,13}$/.test(formData.telepon.trim())) {
      toast.error('Nomor WhatsApp/HP harus berupa angka, minimal 11 dan maksimal 13 digit.');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Format email tidak valid.');
      return false;
    }
    if (files.length === 0) {
      toast.error('Lampiran bukti kejadian wajib diunggah minimal 1 berkas (foto/video/dokumen).');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Lampiran bukti kejadian wajib diunggah minimal 1 berkas.');
      return;
    }
    if (!formData.nim_nip.trim() || !/^\d{8}$/.test(formData.nim_nip.trim())) {
      toast.error('NPM / NIP harus berupa angka dan tepat 8 digit.');
      return;
    }
    if (!formData.telepon.trim() || !/^\d{11,13}$/.test(formData.telepon.trim())) {
      toast.error('Nomor WhatsApp / HP harus berupa angka dan berjumlah 11-13 digit.');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Format email tidak valid.');
      return;
    }
    if (!formData.agreement) {
      toast.error('Anda wajib menyetujui pernyataan kebenaran informasi.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('mode', mode);
      data.append('category_id', formData.category_id);
      data.append('location', formData.location);
      data.append('incident_date', formData.incident_date);
      if (formData.incident_time) data.append('incident_time', formData.incident_time);
      data.append('description', formData.description);
      if (formData.involved_parties) data.append('involved_parties', formData.involved_parties);
      if (formData.extra_info) data.append('extra_info', formData.extra_info);

      data.append('nama', formData.nama);
      data.append('nim_nip', formData.nim_nip);
      data.append('telepon', formData.telepon);
      data.append('email', formData.email || '');

      files.forEach((file) => {
        data.append('attachments', file);
      });

      const res = await api.post('/reports', data);

      setSubmittedCode(res.data.tracking_code);
      setStep(4); // Success step
      toast.success('Laporan internal berhasil dikirim!');
    } catch (err) {
      console.error('Submit report error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal mengirim laporan internal. Pastikan server backend dan database terhubung.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (submittedCode) {
      navigator.clipboard.writeText(submittedCode);
      setCopied(true);
      toast.success('Kode pelacakan disalin ke clipboard');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadProof = () => {
    const content = `BUKTI LAPORAN SATGAS ANTI NARKOBA POLINELA\n=========================================\nKode Pelacakan : ${submittedCode}\nKategori       : ${formData.category_id}\nTanggal Lapor  : ${new Date().toLocaleDateString('id-ID')}\nLokasi         : ${formData.location}\nMode Pelaporan : ${mode.toUpperCase()}\n\nPERINGATAN: Simpan kode tiket ini untuk memantau proses tindak lanjut di website resmi.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tiket-${submittedCode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Banner Switcher: Pengarah ke Jalur Eksternal */}
      <div className="mb-6 p-4 rounded-2xl bg-blue-50/90 border border-blue-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5 text-blue-950">
          <span className="p-1 px-2 rounded-md bg-blue-700 text-white font-black text-[10px] uppercase tracking-wide">
            Jalur Laporan
          </span>
          <span className="font-medium">
            Bukan bagian dari warga kampus Polinela? Untuk masyarakat sekitar, orang tua, atau instansi BNN/Polri:
          </span>
        </div>
        <Link
          to="/laporkan/eksternal"
          className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-xl border border-blue-200 hover:border-blue-300 transition shadow-xs shrink-0"
        >
          <span>Formulir Laporan Eksternal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Page Header Internal */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold mb-2.5">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span>KHUSUS INTERNAL CIVITAS AKADEMIKA POLINELA</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Formulir Laporan Internal Civitas</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
          Layanan pengaduan dugaan tindak pidana narkoba khusus bagi <strong>Mahasiswa, Dosen, dan Tenaga Kependidikan Polinela</strong>. Identitas Anda dijamin kerahasiaannya dengan enkripsi berlapis (AES-256) di database Satgas.
        </p>
      </div>

      {/* Progress Steps (1 to 3) */}
      {step < 4 && (
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-secondary -translate-y-1/2 -z-0 transition-all duration-300" 
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />

            {[
              { num: 1, title: 'Kejadian' },
              { num: 2, title: 'Pendukung' },
              { num: 3, title: 'Konfirmasi' }
            ].map((s) => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s.num ? 'bg-secondary text-white ring-4 ring-secondary/20 shadow-md' : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}>
                  {s.num}
                </div>
                <span className="text-xs font-semibold mt-2 text-slate-700">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-100">
        {/* STEP 1: DETAIL KEJADIAN */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            {/* Jaminan Kerahasiaan Satgas */}
            <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-secondary text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Jaminan Kerahasiaan Data Pelapor</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Identitas Anda disimpan secara terenkripsi (AES-256) di database sistem Satgas Polinela. Petugas Satgas terikat integritas kerahasiaan dan tidak akan menyebarluaskan data Anda kepada pihak luar kampus.
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Kategori Laporan */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Kategori Dugaan Kasus <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="select-field"
                >
                  <option value="">Pilih Kategori Kasus...</option>
                  <option value="Penyalahgunaan/Konsumsi di Kampus">Penyalahgunaan / Konsumsi di Lingkungan Kampus</option>
                  <option value="Dugaan Peredaran">Dugaan Peredaran / Transaksi Narkoba</option>
                  <option value="Kepemilikan Barang Terlarang">Kepemilikan Narkotika / Barang Terlarang</option>
                  <option value="Lainnya">Lainnya / Informasi Terkait Narkoba</option>
                </select>
              </div>

              {/* Lokasi Kejadian (Pilihan Dropdown seperti Kategori + Input Lainnya/Di Luar Kampus) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lokasi Kejadian <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLocationOption}
                  onChange={handleLocationOptionChange}
                  className="select-field"
                >
                  <option value="">Pilih Area / Lokasi Kejadian...</option>
                  <option value="Gedung Serba Guna (GSG)">Gedung Serba Guna (GSG)</option>
                  <option value="Gedung Kuliah Bersama (GKB)">Gedung Kuliah Bersama (GKB)</option>
                  <option value="Gedung SmartFood Security (SFS)">Gedung SmartFood Security (SFS)</option>
                  <option value="Gedung Sakura">Gedung Sakura</option>
                  <option value="Gedung Seroja">Gedung Seroja</option>
                  <option value="Gedung PPA">Gedung PPA</option>
                  <option value="Gedung QB">Gedung QB</option>
                  <option value="Gedung CB">Gedung CB</option>
                  <option value="Gedung Ki Hajar Dewantara (KHD)">Gedung Ki Hajar Dewantara (KHD)</option>
                  <option value="Gedung H">Gedung H</option>
                  <option value="Perpustakaan">Perpustakaan</option>
                  <option value="Gedung Jurusan Teknologi Informasi">Gedung Jurusan Teknologi Informasi</option>
                  <option value="Lainnya / Di Luar Lingkungan Kampus">Lainnya / Di Luar Lingkungan Kampus</option>
                </select>

                {/* Kolom Ketik Manual jika memilih "Lainnya / Di Luar Lingkungan Kampus" */}
                {selectedLocationOption === 'Lainnya / Di Luar Lingkungan Kampus' && (
                  <div className="mt-3 animate-fade-in p-4 rounded-2xl bg-amber-50/90 border border-amber-200">
                    <label className="block text-xs font-bold text-amber-950 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-700" />
                      <span>Sebutkan Lokasi Spesifik / Di Luar Kampus:</span> <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kosan dekat Polinela (Jl. Soekarno Hatta No. 12), Warung kopi depan kampus, Kontrakan Rajabasa..."
                      value={customLocationText}
                      onChange={handleCustomLocationChange}
                      className="input-field bg-white"
                      autoFocus
                    />
                    <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                      Silakan tuliskan nama jalan, nama kosan/kontrakan, atau patokan lokasi di luar kampus sedetail mungkin.
                    </p>
                  </div>
                )}

                {/* Detail Spesifik Ruangan/Lantai jika memilih lokasi dalam kampus */}
                {selectedLocationOption && selectedLocationOption !== 'Lainnya / Di Luar Lingkungan Kampus' && (
                  <div className="mt-2.5 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Detail spesifik ruangan/lantai (Opsional, contoh: Lantai 2 Ruang 204, Belakang Kantin)"
                      value={locationDetailText}
                      onChange={handleLocationDetailChange}
                      className="input-field text-xs bg-slate-50 border-dashed"
                    />
                  </div>
                )}
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tanggal Kejadian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="incident_date"
                    value={formData.incident_date}
                    onChange={handleChange}
                    className="input-field"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Otomatis terisi hari ini (dapat diubah sendiri jika kejadian terjadi di hari lain)</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Perkiraan Waktu (Opsional)
                  </label>
                  <input
                    type="time"
                    name="incident_time"
                    value={formData.incident_time}
                    onChange={handleChange}
                    className="input-field"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Otomatis terisi jam saat ini (dapat diubah sendiri jika kejadian terjadi di jam lain)</p>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Uraian Kejadian Kronologis <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-semibold ${
                    formData.description.length >= 30 ? 'text-secondary' : 'text-slate-400'
                  }`}>
                    {formData.description.length}/30 karakter minimum
                  </span>
                </div>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Jelaskan secara runtut apa yang Anda saksikan, bagaimana gelagatnya, ciri-ciri pelaku, dsb..."
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea-field"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={handleNext} className="btn-primary !py-3 !px-8">
                Lanjut ke Pendukung
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PENDUKUNG & KONTAK */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            {/* Pihak Terlibat & Info Tambahan */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pihak yang Terlibat / Terduga (Opsional)
                </label>
                <input
                  type="text"
                  name="involved_parties"
                  placeholder="Nama julukan, ciri fisik khusus, nomor plat motor jika ingat, dsb."
                  value={formData.involved_parties}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Upload Berkas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lampiran Bukti (Foto, Video, PDF) <span className="text-red-500 font-black">* (Wajib Diunggah)</span>
                </label>
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                  files.length === 0 ? 'border-amber-300 bg-amber-50/40 hover:border-secondary' : 'border-emerald-300 bg-emerald-50/30'
                }`}>
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${files.length === 0 ? 'text-amber-500' : 'text-emerald-600'}`} />
                  <p className="text-sm font-bold text-slate-700">Pilih berkas bukti dari perangkat Anda</p>
                  <p className="text-xs text-slate-500 mt-1">Mendukung format JPG, PNG, MP4, PDF (Maks 5 berkas, 25MB/berkas)</p>
                  {files.length === 0 && (
                    <p className="text-xs font-bold text-amber-600 mt-2">
                      ⚠️ Minimal 1 berkas bukti wajib dilampirkan agar laporan dapat dikirim.
                    </p>
                  )}
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.mp4,.pdf"
                    onChange={handleFileChange}
                    className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-white hover:file:bg-secondary/90 cursor-pointer"
                  />
                </div>

                {/* File list preview */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl text-xs">
                        <span className="truncate max-w-xs font-medium text-slate-700">{f.name} ({(f.size/1024/1024).toFixed(2)} MB)</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 font-bold px-2">
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DATA KONTAK PELAPOR INTERNAL (TERENKRIPSI) */}
            <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-secondary/15">
                <div className="flex items-center gap-2 text-secondary">
                  <UserCheck className="w-5 h-5 text-secondary" />
                  <h4 className="font-bold text-sm">Data Identitas Pelapor (Kerahasiaan Terenkripsi)</h4>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Terenkripsi AES-256
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identitas Anda disimpan secara terenkripsi di database sistem Satgas Polinela. Informasi ini dijaga kerahasiaannya dan tidak akan pernah disebarluaskan kepada pihak luar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-red-500 font-bold">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Nama lengkap Anda"
                    className="input-field bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NPM / NIP <span className="text-red-500 font-bold">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="nim_nip"
                    value={formData.nim_nip}
                    onChange={handleChange}
                    placeholder="Contoh: 21753001 (NPM) atau 19850101 (NIP)"
                    maxLength={8}
                    inputMode="numeric"
                    className={`input-field bg-white font-mono ${fieldErrors.nim_nip ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.nim_nip
                    ? <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.nim_nip}</span>
                    : <span className="text-[10px] text-slate-500 mt-0.5 block">Nomor Pokok Mahasiswa (NPM) bagi mahasiswa atau NIP bagi dosen/staf Polinela.</span>
                  }
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP Aktif <span className="text-red-500 font-bold">* (Wajib)</span>
                  </label>
                  <input
                    type="text"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleChange}
                    placeholder="Contoh: 08123456789"
                    maxLength={13}
                    inputMode="numeric"
                    className={`input-field bg-white ${fieldErrors.telepon ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.telepon
                    ? <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.telepon}</span>
                    : <span className="text-[10px] text-slate-500 mt-0.5 block">Diperlukan tim Satgas untuk koordinasi rahasia & pemanggilan saksi aman (11-13 angka).</span>
                  }
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Polinela / Email Aktif (Opsional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nama@polinela.ac.id"
                    className={`input-field bg-white ${fieldErrors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {fieldErrors.email
                    ? <span className="text-[10px] text-red-500 mt-0.5 block font-semibold">⚠ {fieldErrors.email}</span>
                    : <span className="text-[10px] text-slate-500 mt-0.5 block">Contoh: nama@polinela.ac.id atau nama@gmail.com</span>
                  }
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="btn-secondary !py-3 !px-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali
              </button>
              <button onClick={handleNext} className="btn-primary !py-3 !px-8">
                Lanjut Konfirmasi
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KONFIRMASI RINGKASAN DINAMIS */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-bold text-slate-900 text-lg">Ringkasan Konfirmasi Laporan Internal</h3>
            <p className="text-xs text-slate-500">Mohon periksa kembali rincian yang telah Anda isi sebelum mengirim.</p>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Jalur Laporan:</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-xs">
                  Internal Civitas Polinela
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Pelapor:</span>
                <span className="font-bold text-slate-800">
                  {formData.nama} {formData.nim_nip ? `(NPM/NIP: ${formData.nim_nip})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">No. Kontak WhatsApp:</span>
                <span className="font-bold text-slate-800">{formData.telepon}</span>
              </div>
              {formData.email && (
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Email Pelapor:</span>
                  <span className="font-bold text-slate-800">{formData.email}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Status Kerahasiaan:</span>
                <span className="font-bold text-emerald-700">Terenkripsi AES-256 di Database Satgas</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Kategori Kasus:</span>
                <span className="font-bold text-slate-800">{formData.category_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Lokasi Kejadian:</span>
                <span className="font-bold text-slate-800">{formData.location}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Waktu Kejadian:</span>
                <span className="font-bold text-slate-800">
                  {formData.incident_date} {formData.incident_time && `pukul ${formData.incident_time}`}
                </span>
              </div>
              <div className="py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium block mb-1">Uraian Kasus:</span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap">
                  {formData.description}
                </p>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Jumlah Berkas Lampiran:</span>
                <span className="font-bold text-slate-800">{files.length} berkas</span>
              </div>
            </div>

            {/* Checkbox Pernyataan */}
            <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 flex items-start gap-3">
              <input
                type="checkbox"
                id="agreement"
                name="agreement"
                checked={formData.agreement}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-secondary rounded focus:ring-secondary cursor-pointer"
              />
              <label htmlFor="agreement" className="text-xs text-slate-700 cursor-pointer leading-relaxed">
                Saya menyatakan dengan sungguh-sungguh bahwa informasi yang saya laporkan dibuat atas dasar itikad baik dan berdasarkan kejadian sebenarnya tanpa maksud fitnah atau merugikan pihak lain secara tidak sah.
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="btn-secondary !py-3 !px-6" disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Ubah Data
              </button>
              <button onClick={handleSubmit} className="btn-primary !py-3 !px-8" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Laporan Resmi'}
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: KODE PELACAKAN (PRD FR-1.6 & §4 Temuan 1) */}
        {step === 4 && (
          <div className="text-center py-6 space-y-6 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Laporan Berhasil Diterima!</h2>
              <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
                Laporan Anda telah tercatat ke antrean verifikasi Satgas Anti Narkoba Polinela.
              </p>
            </div>

            {/* Tracking Code Display */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl max-w-md mx-auto shadow-xl relative overflow-hidden">
              <span className="text-[11px] uppercase tracking-widest text-accent font-semibold block mb-2">
                KODE TIKET PELACAKAN ANDA
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white py-2">
                {submittedCode}
              </div>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin!' : 'Salin Kode'}
                </button>
                <button
                  onClick={handleDownloadProof}
                  className="px-4 py-2 bg-accent text-slate-900 hover:bg-accent-light text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  Unduh Tiket (.TXT)
                </button>
              </div>
            </div>

            {/* Peringatan Kritis */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 max-w-md mx-auto text-left flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                <strong>PENTING:</strong> Simpan kode ini sekarang juga. Kode tiket ini digunakan untuk memantau proses tindak lanjut laporan Anda secara aman di website resmi.
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-4">
              <a href="/lacak" className="btn-secondary !py-2.5 !px-6 text-sm">
                Buka Halaman Lacak
              </a>
              <a href="/" className="btn-primary !py-2.5 !px-6 text-sm">
                Selesai & Ke Beranda
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
