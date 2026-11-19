import { useState } from 'react';
import { FileText, Printer, Download, X, AlertCircle } from 'lucide-react';

export default function ModalSuratRekomendasi({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null;

  // Tentukan rekomendasi berdasarkan tingkat urgensi kasus
  // Urgensi rendah/sedang: Ringan (Komitmen & Wajib Lapor)
  // Urgensi tinggi: Berat (Berita Acara Pemeriksaan / BAP & Tindakan Hukum)
  const isKategoriRingan = (report.urgency === 'rendah' || report.urgency === 'sedang');
  const [tipeSurat, setTipeSurat] = useState(isKategoriRingan ? 'ringan' : 'berat');

  // Input data dinamis yang bisa disesuaikan
  const [jadwalLapor, setJadwalLapor] = useState('Senin & Kamis');
  const [waktuLapor, setWaktuLapor] = useState('09.00 - 11.00 WIB');
  const [pemeriksa, setPemeriksa] = useState(report.assigned_name || 'Tim Pemeriksa / Bidang Organisasi');
  const [ketuaSatgas, setKetuaSatgas] = useState('Fathurrahman Kurniawan Ikhsan, S.Kom., M.T.I.');

  // Data terlapor / identitas pelapor jika teridentifikasi
  const namaTerlapor = report.involved_parties || (report.reporter && !report.reporter.restricted ? report.reporter.nama : '................................................');
  const npmTerlapor = (report.reporter && !report.reporter.restricted ? report.reporter.nim_nip : '................................................');
  const nomorBap = `${String(report.id).padStart(3, '0')}/BAP/SATGAS-AN/${new Date().getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal (Tidak Tercetak) */}
        <div className="flex items-center justify-between border-b pb-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Surat Resmi & Rekomendasi Penanganan
              </h3>
              <p className="text-xs text-slate-500">
                Otomatis dibuat berdasarkan tiket laporan #{report.id} ({report.urgency ? report.urgency.toUpperCase() : 'SEDANG'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pilihan Template (Tidak Tercetak) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTipeSurat('ringan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                tipeSurat === 'ringan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Surat Pernyataan Wajib Lapor (Kasus Ringan)
            </button>
            <button
              onClick={() => setTipeSurat('berat')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                tipeSurat === 'berat'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Berita Acara Pemeriksaan / BAP (Kasus Berat/Sedang)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-secondary/20"
          >
            <Printer className="w-4 h-4" /> Cetak / Unduh PDF
          </button>
        </div>

        {/* ============================================================ */}
        {/* AREA DOKUMEN CETAK RESMI (SESUAI TEMPLATE WORD SATGAS)       */}
        {/* ============================================================ */}
        <div className="border border-slate-200 rounded-2xl p-6 sm:p-10 bg-white text-slate-900 font-serif leading-relaxed text-xs sm:text-sm print:border-none print:p-0 print:m-0" id="print-surat-area">
          
          {/* KOP SURAT POLINELA SATGAS */}
          <div className="border-b-2 border-black pb-3 mb-6 text-center">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">KEMENTERIAN PENDIDIKAN TINGGI, SAINS DAN TEKNOLOGI</h4>
            <h2 className="font-extrabold text-sm sm:text-base uppercase text-black">POLITEKNIK NEGERI LAMPUNG</h2>
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-800">SATUAN TUGAS (SATGAS) ANTI NARKOBA</h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Jl. Soekarno Hatta No. 10 Rajabasa, Bandar Lampung 35144 | Telp (0721) 703995 | Email: antinarkoba@polinela.ac.id</p>
          </div>

          {/* 1. TEMPLATE SURAT PERNYATAAN WAJIB LAPOR (RINGAN) */}
          {tipeSurat === 'ringan' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-5">
                <h3 className="font-black text-sm sm:text-base underline uppercase tracking-wide">
                  SURAT PERNYATAAN & KOMITMEN WAJIB LAPOR
                </h3>
                <p className="text-xs font-sans text-slate-600 font-semibold">
                  (Penanganan Kasus Kategori Ringan - Restorative Justice)
                </p>
                <p className="text-[11px] font-sans text-slate-500">
                  Referensi Laporan Kasus: #{report.id} / Satgas-AN / {new Date().getFullYear()}
                </p>
              </div>

              <p className="text-justify">
                Saya yang bertanda tangan di bawah ini selaku mahasiswa Politeknik Negeri Lampung:
              </p>

              <div className="pl-6 space-y-1.5 font-sans text-xs">
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">Nama Terduga / Terperiksa</span>
                  <span className="col-span-2 font-bold">: {namaTerlapor}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">NPM / Program Studi</span>
                  <span className="col-span-2">: {npmTerlapor}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">Lokasi / Tanggal Kejadian</span>
                  <span className="col-span-2">: {report.location} ({report.incident_date})</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-600">Perkara Aduan</span>
                  <span className="col-span-2">: {report.kategori}</span>
                </div>
              </div>

              <p className="text-justify mt-3">
                Dengan penuh kesadaran dan tanpa paksaan dari pihak manapun, menyatakan berjanji dan berkomitmen untuk:
              </p>

              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Wajib Lapor:</strong> Hadir di Sekretariat Satgas Anti Narkoba Polinela secara berkala setiap hari <strong>{jadwalLapor}</strong> pukul <strong>{waktuLapor}</strong>.
                </li>
                <li>
                  <strong>Kegiatan Positif:</strong> Bersedia mengikuti dan menyelesaikan seluruh program kebugaran fisik/olahraga dan sesi konseling psikologis rutin di bawah pengawasan Satgas.
                </li>
                <li>
                  <strong>Bebas Narkoba:</strong> Bersedia dilakukan tes urine sewaktu-waktu oleh Satgas Anti Narkoba Polinela dan/atau BNN Provinsi Lampung tanpa pemberitahuan terlebih dahulu.
                </li>
              </ol>

              <p className="text-justify mt-3 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                <strong>Ketentuan Tambahan:</strong> Apabila saya melanggar salah satu poin komitmen di atas, saya bersedia status pelanggaran saya ditingkatkan menjadi <strong>Kategori Sedang (Skorsing Akademik)</strong> atau <strong>Kategori Berat (Putus Studi / Drop Out)</strong> sesuai Peraturan Direktur Polinela Nomor 5 Tahun 2025.
              </p>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 pt-8 text-center text-xs font-sans">
                <div>
                  <p>Bandar Lampung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-semibold mt-1">Yang Membuat Pernyataan,</p>
                  <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Materai Rp10.000)
                  </div>
                  <p className="font-bold underline uppercase">{namaTerlapor}</p>
                  <p className="text-slate-500 text-[11px]">Mahasiswa Terperiksa</p>
                </div>

                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold mt-1">Ketua Satgas Anti Narkoba Polinela</p>
                  <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Tanda Tangan & Cap Satgas)
                  </div>
                  <p className="font-bold underline uppercase">{ketuaSatgas}</p>
                  <p className="text-slate-500 text-[11px]">NIP. 19920818202203 1 007</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. TEMPLATE BERITA ACARA PEMERIKSAAN (BAP) (BERAT / SEDANG) */}
          {tipeSurat === 'berat' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-5">
                <h3 className="font-black text-sm sm:text-base underline uppercase tracking-wide">
                  BERITA ACARA PEMERIKSAAN (BAP) INTERNAL SATGAS
                </h3>
                <p className="text-xs font-mono font-bold text-slate-800">
                  Nomor: {nomorBap}
                </p>
              </div>

              <p className="text-justify">
                Pada hari ini, tanggal <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, bertempat di Ruang Satgas Anti Narkoba Politeknik Negeri Lampung, telah dilakukan pemeriksaan perkara dugaan pelanggaran tata tertib dan peredaran narkotika/obat terlarang:
              </p>

              {/* I. Identitas */}
              <div>
                <h4 className="font-bold text-xs uppercase text-slate-800 border-b pb-1 mb-2">I. IDENTITAS TERPERIKSA / TERLAPOR</h4>
                <div className="pl-4 space-y-1 font-sans text-xs">
                  <div className="grid grid-cols-3">
                    <span className="font-semibold text-slate-600">Nama Lengkap</span>
                    <span className="col-span-2 font-bold">: {namaTerlapor}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-semibold text-slate-600">NPM / Program Studi</span>
                    <span className="col-span-2">: {npmTerlapor}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-semibold text-slate-600">Kategori Temuan</span>
                    <span className="col-span-2 font-bold text-red-600 uppercase">: {report.urgency === 'tinggi' ? 'Kategori Berat (Tindakan Hukum / DO)' : 'Kategori Sedang (Sanksi Akademik Skorsing)'}</span>
                  </div>
                </div>
              </div>

              {/* II. Hasil Pemeriksaan */}
              <div>
                <h4 className="font-bold text-xs uppercase text-slate-800 border-b pb-1 mb-2">II. HASIL PEMERIKSAAN & TEMUAN FAKTA</h4>
                <div className="pl-4 space-y-2 font-sans text-xs">
                  <div>
                    <span className="font-semibold text-slate-600 block">1. Waktu & Tempat Kejadian:</span>
                    <p className="text-slate-800">{report.incident_date} | Lokasi: {report.location}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600 block">2. Barang Bukti (Lampiran Kasus):</span>
                    <p className="text-slate-800">
                      {report.attachments && report.attachments.length > 0 
                        ? `${report.attachments.length} berkas bukti terunggah di sistem (${report.attachments.map(a => a.original_name).join(', ')})`
                        : 'Hasil konfirmasi investigasi lapangan / pengakuan saksi.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600 block">3. Keterangan Singkat / Kronologis Kasus:</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-wrap text-[11px] leading-relaxed">
                      {report.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* III. Pernyataan & Rekomendasi Sanksi */}
              <div>
                <h4 className="font-bold text-xs uppercase text-slate-800 border-b pb-1 mb-2">III. PERNYATAAN & REKOMENDASI TINDAKAN</h4>
                <p className="text-justify pl-4 text-xs">
                  Berdasarkan hasil pemeriksaan di atas serta mengacu pada <strong>Peraturan Direktur Polinela Nomor 5 Tahun 2025 Pasal 65, 67, dan 68</strong>, Tim Satgas merekomendasikan:
                </p>
                <div className="pl-4 mt-2">
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-semibold">
                    {report.urgency === 'tinggi' 
                      ? 'Rekomendasi Kategori Berat: Pemutusan hak studi secara tidak hormat (Drop Out) oleh Direktur Polinela dan penyerahan kasus secara resmi kepada aparat penegak hukum (BNN / Kepolisian).' 
                      : 'Rekomendasi Kategori Sedang: Penerbitan SK Skorsing Akademik selama 2 semester dan kewajiban rehabilitasi medis resmi sebelum diizinkan aktif kembali.'}
                  </div>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs font-sans">
                <div>
                  <p className="font-semibold">Mahasiswa Terperiksa,</p>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Tanda Tangan)
                  </div>
                  <p className="font-bold underline uppercase">{namaTerlapor}</p>
                </div>

                <div>
                  <p className="font-semibold">Mengetahui,</p>
                  <p className="text-[11px] text-slate-500">Pemeriksa / Bidang Organisasi Satgas</p>
                  <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                    (Tanda Tangan)
                  </div>
                  <p className="font-bold underline uppercase">{pemeriksa}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal Action */}
        <div className="flex items-center justify-between border-t pt-4 print:hidden text-xs">
          <span className="text-slate-400">
            Format resmi sesuai pedoman SOP Notulen Satgas Anti Narkoba Polinela
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

