import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';
import api from '../../lib/api';

export default function Agenda() {
  const [agendas, setAgendas] = useState([]);

  useEffect(() => {
    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    try {
      const res = await api.get('/agendas?limit=20');
      setAgendas(res.data.data || []);
    } catch {
      setAgendas([
        {
          id: 1,
          judul: 'Workshop Deteksi & Pencegahan Narkoba Bagi Dosen/Tendik',
          tanggal: '2026-11-15',
          waktu: '08:00 WIB',
          lokasi: 'Aula Utama Polinela',
          kategori: 'Workshop',
          isi: 'Pelatihan teknis bagi para pembina kemahasiswaan dan dosen wali dalam mengenali indikasi perubahan perilaku mahasiswa terduga terpapar obat terlarang.'
        },
        {
          id: 2,
          judul: 'Seminar Nasional Bersama BNN RI: Kampus Bebas Narkoba',
          tanggal: '2026-12-01',
          waktu: '09:00 WIB',
          lokasi: 'Gedung Serba Guna (GSG) Polinela',
          kategori: 'Seminar',
          isi: 'Menghadirkan narasumber utama dari Deputi Pencegahan BNN RI untuk menyosialisasikan bahaya narkotika jenis baru (New Psychoactive Substances).'
        },
        {
          id: 3,
          judul: 'Aksi Kampanye Simpatik & Tes Urine Berkala',
          tanggal: '2026-12-15',
          waktu: '07:30 WIB',
          lokasi: 'Plaza Polinela & Seluruh Jurusan',
          kategori: 'Kampanye',
          isi: 'Kegiatan pembagian stiker edukasi dan pelaksanaan skrining deteksi dini secara humanis bersama tenaga medis poliklinik kampus.'
        }
      ]);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-secondary font-bold">FR-4 Kegiatan</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Agenda Kegiatan Satgas</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Jadwal seminar, workshop, kampanye, dan kegiatan sosialisasi anti narkotika di Politeknik Negeri Lampung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agendas.map((item) => (
          <div key={item.id} className="card p-6 flex flex-col justify-between hover:shadow-lg transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full">
                  {item.kategori || 'Agenda'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {item.judul}
              </h3>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>{item.tanggal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>{item.waktu || '08:00 WIB'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>{item.lokasi || 'Kampus Polinela'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed pt-2">
                {item.isi}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
