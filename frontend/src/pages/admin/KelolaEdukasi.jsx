import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Clock, CheckCircle2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function KelolaEdukasi() {
  const { user } = useAuth();
  const isAnggota = user?.role === 'anggota';

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ judul: '', isi: '', category_id: '', status: 'draft' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?tipe=edukasi');
      const cats = res.data.data || [];
      setCategories(cats);
      if (cats.length > 0) {
        setFormData(prev => ({ ...prev, category_id: String(cats[0].id) }));
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await api.get('/admin/education');
      setArticles(res.data.data || []);
    } catch (err) {
      console.error('Fetch education articles error:', err);
      toast.error('Gagal memuat artikel edukasi dari database.');
      setArticles([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      // Anggota: kalau pilih "ajukan verifikasi", set ke menunggu_verifikasi
      // Admin/Super Admin: bisa langsung terbit
      if (editId) {
        await api.put(`/admin/education/${editId}`, payload);
        toast.success('Artikel berhasil diperbarui!');
      } else {
        const res = await api.post('/admin/education', payload);
        const resStatus = res.data.status;
        if (resStatus === 'menunggu_verifikasi') {
          toast.success('Artikel diajukan dan menunggu persetujuan Super Admin.');
        } else {
          toast.success('Artikel baru berhasil disimpan!');
        }
      }
      setModalOpen(false);
      setEditId(null);
      setFormData({ judul: '', isi: '', category_id: categories[0]?.id ? String(categories[0].id) : '', status: 'draft' });
      fetchArticles();
    } catch (err) {
      console.error('Save education error:', err);
      const errMsg = err.response?.data?.error || 'Gagal menyimpan artikel ke database.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus artikel ini?')) {
      try {
        await api.delete(`/admin/education/${id}`);
        toast.success('Artikel berhasil dihapus');
        fetchArticles();
      } catch (err) {
        console.error('Delete education error:', err);
        const errMsg = err.response?.data?.error || 'Gagal menghapus artikel.';
        toast.error(errMsg);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'terbit':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" />Terbit</span>;
      case 'menunggu_verifikasi':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Menunggu Verifikasi</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Draft</span>;
    }
  };

  const canEdit = (item) => {
    if (!isAnggota) return true;
    return item.author_id === user?.id && item.status !== 'terbit';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Konten Edukasi</h2>
          <p className="text-xs text-slate-500 mt-1">Kelola artikel edukasi dan pencegahan narkoba untuk sivitas</p>
        </div>
        <button
          onClick={() => {
            setEditId(null);
            setFormData({ judul: '', isi: '', category_id: categories[0]?.id ? String(categories[0].id) : '', status: isAnggota ? 'menunggu_verifikasi' : 'terbit' });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          {isAnggota ? 'Ajukan Artikel Baru' : 'Tambah Artikel'}
        </button>
      </div>



      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Judul Artikel</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Penulis</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">Belum ada artikel edukasi.</td>
                </tr>
              ) : (
                articles.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs">
                      <span className="line-clamp-2">{item.judul}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.kategori || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.author || '-'}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit(item) && (
                          <button
                            onClick={() => {
                              setEditId(item.id);
                              setFormData({
                                judul: item.judul,
                                isi: item.isi || '',
                                category_id: item.category_id ? String(item.category_id) : '',
                                status: item.status
                              });
                              setModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            title="Edit Artikel"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isAnggota && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            title="Hapus Artikel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editId ? 'Edit Artikel Edukasi' : (isAnggota ? 'Ajukan Artikel Edukasi Baru' : 'Tambah Artikel Edukasi')}
            </h3>

            {isAnggota && !editId && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                Artikel yang kamu ajukan akan masuk status <strong>Menunggu Verifikasi</strong> dan ditinjau Super Admin sebelum tayang.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Artikel <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Tulis judul artikel yang informatif..."
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Artikel <span className="text-red-500">*</span></label>
                <textarea
                  rows={6}
                  required
                  placeholder="Tulis isi artikel edukasi..."
                  value={formData.isi}
                  onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-y"
                />
              </div>

              {/* Status hanya untuk admin/super_admin */}
              {!isAnggota && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Publikasi</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="draft">Draft (Belum Tayang)</option>
                    <option value="menunggu_verifikasi">Menunggu Verifikasi Super Admin</option>
                    <option value="terbit">Terbit (Langsung Tayang)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : (isAnggota && !editId ? 'Ajukan untuk Verifikasi' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
