import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Calendar, Clock, MapPin, 
  CheckCircle, XCircle, AlertTriangle, UserCheck, Search, Filter 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function KelolaAgenda() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isAnggota = user?.role === 'anggota';

  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    tanggal: new Date().toISOString().slice(0, 10),
    waktu: '08:00',
    lokasi: '',
    category_id: '9',
    status: isAnggota ? 'menunggu_verifikasi' : 'terbit'
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchAgendas();
  }, [filterStatus]);

  const fetchAgendas = async () => {
    try {
      setLoading(true);
      const url = filterStatus ? `/admin/agendas?status=${filterStatus}` : '/admin/agendas';
      const res = await api.get(url);
      setAgendas(res.data.data || []);
    } catch (err) {
      console.error('Fetch agendas error:', err);
      toast.error('Gagal memuat agenda dari server');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      judul: '',
      isi: '',
      tanggal: new Date().toISOString().slice(0, 10),
      waktu: '08:00',
      lokasi: '',
      category_id: '9',
      status: isAnggota ? 'menunggu_verifikasi' : 'terbit'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setFormData({
      judul: item.judul || '',
      isi: item.isi || '',
      tanggal: item.tanggal ? item.tanggal.slice(0, 10) : new Date().toISOString().slice(0, 10),
      waktu: item.waktu ? item.waktu.slice(0, 5) : '08:00',
      lokasi: item.lokasi || '',
      category_id: item.category_id ? String(item.category_id) : '9',
      status: item.status || (isAnggota ? 'menunggu_verifikasi' : 'terbit')
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.tanggal || !formData.lokasi.trim()) {
      toast.error('Mohon lengkapi judul, tanggal, dan lokasi kegiatan.');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/agendas/${editId}`, formData);
        toast.success('Agenda berhasil diperbarui!');
      } else {
        await api.post('/admin/agendas', formData);
        if (formData.status === 'menunggu_verifikasi') {
          toast.success('Usulan agenda berhasil diajukan! Menunggu verifikasi Admin/Super Admin.');
        } else {
          toast.success('Agenda baru berhasil disimpan dan diterbitkan!');
        }
      }
      setModalOpen(false);
      fetchAgendas();
    } catch (err) {
      console.error('Submit agenda error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal menyimpan agenda.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id, title, action = 'terbitkan') => {
    const isApprove = action === 'terbitkan';
    const confirmMsg = isApprove
      ? `Verifikasi dan terbitkan agenda "${title}" secara resmi ke publik?`
      : `Tolak pengajuan agenda "${title}"?`;

    if (confirm(confirmMsg)) {
      try {
        const res = await api.patch(`/admin/agendas/${id}/verify`, { action });
        toast.success(res.data.message || 'Status agenda berhasil diperbarui');
        fetchAgendas();
      } catch (err) {
        console.error('Verify error:', err);
        const errMsg = err.response?.data?.error || 'Gagal memverifikasi agenda';
        toast.error(errMsg);
      }
    }
  };

  const handleDelete = async (id, title) => {
    if (confirm(`Yakin ingin menghapus agenda "${title}"?`)) {
      try {
        await api.delete(`/admin/agendas/${id}`);
        toast.success('Agenda berhasil dihapus');
        fetchAgendas();
      } catch (err) {
        console.error('Delete error:', err);
        const errMsg = err.response?.data?.error || 'Gagal menghapus agenda';
        toast.error(errMsg);
      }
    }
  };

  const pendingCount = agendas.filter(a => a.status === 'menunggu_verifikasi').length;

  const filteredAgendas = agendas.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.judul && item.judul.toLowerCase().includes(term)) ||
      (item.lokasi && item.lokasi.toLowerCase().includes(term)) ||
      (item.author && item.author.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Agenda & Sosialisasi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAnggota
              ? 'Ajukan usulan jadwal seminar, workshop, dan kegiatan sosialisasi untuk diverifikasi oleh Admin'
              : 'Kelola jadwal kegiatan resmi, verifikasi usulan agenda dari anggota, dan publikasikan ke website'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          {isAnggota ? 'Ajukan Usulan Agenda' : 'Buat Agenda Baru'}
        </button>
      </div>

      {/* Filter Status Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterStatus === '' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('menunggu_verifikasi')}
            className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
              filterStatus === 'menunggu_verifikasi'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Menunggu Verifikasi
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterStatus === 'menunggu_verifikasi' ? 'bg-white text-amber-700' : 'bg-amber-200 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterStatus('terbit')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterStatus === 'terbit' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Terbit (Publik)
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterStatus === 'draft' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Draf
          </button>
          <button
            onClick={() => setFilterStatus('ditolak')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterStatus === 'ditolak' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ditolak
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari agenda atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field !py-1.5 !pl-8 text-xs w-full sm:w-60"
          />
        </div>
      </div>

      {/* Table Agendas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Kegiatan</th>
                <th className="py-3.5 px-4">Jadwal & Lokasi</th>
                <th className="py-3.5 px-4">Pengusul / Penulis</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Memuat data agenda...
                  </td>
                </tr>
              ) : filteredAgendas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Tidak ada agenda yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredAgendas.map((item) => {
                  const canEdit = isSuperAdmin || isAdmin;
                  const canDelete = isSuperAdmin || isAdmin;
                  const isPending = item.status === 'menunggu_verifikasi';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{item.judul}</span>
                        {item.isi && (
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                            {item.isi}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-secondary" />
                          <span>{item.tanggal ? item.tanggal.slice(0, 10) : '—'}</span>
                          <span className="text-slate-400">({item.waktu ? item.waktu.slice(0, 5) : '08:00'})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.lokasi || 'Kampus Polinela'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                          {item.author || 'Satgas'}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {item.author_role === 'super_admin' ? 'Super Admin' : item.author_role === 'admin' ? 'Admin' : 'Anggota'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.status === 'terbit' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Terbit (Publik)
                          </span>
                        ) : item.status === 'menunggu_verifikasi' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Menunggu Verifikasi
                          </span>
                        ) : item.status === 'ditolak' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" /> Ditolak
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Draf
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Tombol Verifikasi Khusus Admin / Super Admin jika status Menunggu Verifikasi */}
                        {(isAdmin || isSuperAdmin) && isPending && (
                          <>
                            <button
                              onClick={() => handleVerify(item.id, item.judul, 'terbitkan')}
                              title="Setujui & Terbitkan Agenda Ini"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-xs transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
                            </button>
                            <button
                              onClick={() => handleVerify(item.id, item.judul, 'tolak')}
                              title="Tolak Pengajuan Agenda"
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Tombol Edit */}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Agenda"
                            className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Tombol Hapus */}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id, item.judul)}
                            title="Hapus Agenda"
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Usul Agenda */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editId 
                ? 'Edit Agenda Kegiatan' 
                : (isAnggota ? 'Formulir Usulan Agenda Baru' : 'Tambah Agenda Kegiatan Baru')}
            </h3>

            {isAnggota && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                ⚠️ Usulan kegiatan ini akan masuk status <strong>Menunggu Verifikasi</strong> dan memerlukan persetujuan Admin/Super Admin sebelum dipublikasikan.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama / Judul Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sosialisasi Bahaya Narkoba Tingkat Jurusan"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="input-field !py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="input-field !py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    value={formData.waktu}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    className="input-field !py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lokasi Kampus / Ruangan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung GSG Polinela / Aula Pertanian"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="input-field !py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi & Rincian Agenda</label>
                <textarea
                  rows={4}
                  placeholder="Rincian narasumber, target peserta, susunan acara, dsb..."
                  value={formData.isi}
                  onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                  className="textarea-field !py-2 text-xs"
                />
              </div>

              {/* Status Selector khusus Admin/Super Admin */}
              {!isAnggota && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Publikasi</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="select-field !py-2 text-xs"
                  >
                    <option value="terbit">Langsung Terbit (Tampil di Website Publik)</option>
                    <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                    <option value="draft">Simpan Sebagai Draf</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary !py-2 !px-5 text-xs font-bold"
                >
                  {saving ? 'Menyimpan...' : (isAnggota ? 'Kirimkan Usulan' : 'Simpan Agenda')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
