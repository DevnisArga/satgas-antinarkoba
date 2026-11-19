import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Newspaper, Image, Upload, X, 
  Calendar, CheckCircle, Clock, XCircle, ShieldCheck, UserCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getUploadUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function KelolaBerita() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isAnggota = user?.role === 'anggota';

  const [news, setNews] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    tanggal: new Date().toISOString().slice(0, 10),
    status: isAnggota ? 'menunggu_verifikasi' : 'terbit'
  });
  const [editId, setEditId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchNews();
  }, [filterStatus]);

  const fetchNews = async () => {
    try {
      const url = filterStatus ? `/admin/news?status=${filterStatus}` : '/admin/news';
      const res = await api.get(url);
      setNews(res.data.data || []);
    } catch (err) {
      console.error('Fetch news error:', err);
      toast.error('Gagal memuat berita dari server');
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      judul: '',
      isi: '',
      tanggal: new Date().toISOString().slice(0, 10),
      status: isAnggota ? 'menunggu_verifikasi' : 'terbit'
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingImage(null);
    setRemoveImage(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setFormData({
      judul: item.judul || '',
      isi: item.isi || '',
      tanggal: item.tanggal ? item.tanggal.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: item.status || (isAnggota ? 'menunggu_verifikasi' : 'terbit')
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingImage(item.gambar || null);
    setRemoveImage(false);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (existingImage) {
      setRemoveImage(true);
      setExistingImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.isi.trim()) {
      toast.error('Judul dan isi berita wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('judul', formData.judul);
      data.append('isi', formData.isi);
      data.append('tanggal', formData.tanggal);
      data.append('status', formData.status);

      if (selectedFile) {
        data.append('gambar', selectedFile);
      } else if (removeImage) {
        data.append('remove_gambar', 'true');
      }

      if (editId) {
        await api.put(`/admin/news/${editId}`, data);
        toast.success('Berita berhasil diperbarui!');
      } else {
        const res = await api.post('/admin/news', data);
        if (formData.status === 'menunggu_verifikasi') {
          toast.success('Berita berhasil diajukan! Menunggu verifikasi Super Admin.');
        } else {
          toast.success('Berita baru berhasil disimpan/diterbitkan!');
        }
      }

      setModalOpen(false);
      fetchNews();
    } catch (err) {
      console.error('Submit news error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal menyimpan berita';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id, title, action = 'terbitkan') => {
    const isApprove = action === 'terbitkan';
    const confirmMsg = isApprove
      ? `Verifikasi dan terbitkan berita "${title}" secara resmi ke publik?`
      : `Tolak penerbitan berita "${title}"?`;

    if (confirm(confirmMsg)) {
      try {
        const res = await api.patch(`/admin/news/${id}/verify`, { action });
        toast.success(res.data.message || 'Status berita berhasil diperbarui');
        fetchNews();
      } catch (err) {
        console.error('Verify error:', err);
        const errMsg = err.response?.data?.error || 'Gagal memverifikasi berita';
        toast.error(errMsg);
      }
    }
  };

  const handleDelete = async (id, title) => {
    if (confirm(`Yakin ingin menghapus berita "${title}"?`)) {
      try {
        await api.delete(`/admin/news/${id}`);
        toast.success('Berita berhasil dihapus');
        fetchNews();
      } catch (err) {
        console.error('Delete news error:', err);
        const errMsg = err.response?.data?.error || 'Gagal menghapus berita';
        toast.error(errMsg);
      }
    }
  };

  const getImageSrc = (gambar) => {
    if (!gambar) return null;
    return getUploadUrl(gambar);
  };

  const pendingCount = news.filter(n => n.status === 'menunggu_verifikasi').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Berita Satgas</h2>
          <p className="text-xs text-slate-500">
            {isAnggota
              ? 'Tulis dan ajukan draf berita kegiatan Satgas untuk diverifikasi oleh Super Admin'
              : 'Publikasikan kabar terbaru, rilis pers, serta verifikasi berita yang diajukan anggota'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary !py-2.5 !px-4 text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" /> Tulis Berita Baru
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {[
          { label: 'Semua Berita', value: '' },
          { label: 'Terbit', value: 'terbit' },
          { 
            label: `Menunggu Verifikasi ${pendingCount > 0 ? `(${pendingCount})` : ''}`, 
            value: 'menunggu_verifikasi',
            highlight: pendingCount > 0
          },
          { label: 'Draft', value: 'draft' },
          { label: 'Ditolak', value: 'ditolak' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterStatus === tab.value
                ? 'bg-secondary text-white shadow-xs'
                : tab.highlight
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 ring-1 ring-amber-300'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info Banner untuk Super Admin jika ada yang perlu diverifikasi */}
      {isSuperAdmin && pendingCount > 0 && filterStatus !== 'menunggu_verifikasi' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
            <div>
              <strong>Perhatian Super Admin:</strong> Terdapat {pendingCount} berita yang diajukan oleh Anggota dan menunggu persetujuan verifikasi Anda.
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('menunggu_verifikasi')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs whitespace-nowrap shadow-xs"
          >
            Lihat Antrean
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-20">Gambar</th>
                <th className="py-3.5 px-4">Judul Berita</th>
                <th className="py-3.5 px-4 w-36">Penulis</th>
                <th className="py-3.5 px-4 w-32">Tanggal Rilis</th>
                <th className="py-3.5 px-4 w-36">Status</th>
                <th className="py-3.5 px-4 text-right w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {news.length > 0 ? (
                news.map((item) => {
                  const canEdit = isSuperAdmin || isAdmin || (isAnggota && item.author_id === user?.id && item.status !== 'terbit');
                  const canDelete = isSuperAdmin || isAdmin || (isAnggota && item.author_id === user?.id && item.status !== 'terbit');
                  const isPending = item.status === 'menunggu_verifikasi';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        {item.gambar ? (
                          <img
                            src={getImageSrc(item.gambar)}
                            alt={item.judul}
                            className="w-14 h-11 object-cover rounded-lg border border-slate-200 shadow-xs"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement.innerHTML = '<div class="w-14 h-11 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">Foto</div>';
                            }}
                          />
                        ) : (
                          <div className="w-14 h-11 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                            <Image className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs sm:max-w-md">
                        <div className="truncate">{item.judul}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block truncate max-w-[120px]">
                          {item.author || 'Satgas'}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {item.author_role === 'super_admin' ? 'Super Admin' : item.author_role === 'admin' ? 'Admin' : 'Anggota'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {item.tanggal ? item.tanggal.slice(0, 10) : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.status === 'terbit' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Terbit (Publik)
                          </span>
                        ) : item.status === 'menunggu_verifikasi' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" /> Menunggu Verifikasi
                          </span>
                        ) : item.status === 'ditolak' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Ditolak
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Tombol Verifikasi Khusus Super Admin jika status Menunggu Verifikasi */}
                        {isSuperAdmin && isPending && (
                          <>
                            <button
                              onClick={() => handleVerify(item.id, item.judul, 'terbitkan')}
                              title="Verifikasi & Terbitkan Berita Ini"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-xs transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
                            </button>
                            <button
                              onClick={() => handleVerify(item.id, item.judul, 'tolak')}
                              title="Tolak Berita"
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Tombol Edit (Super Admin & Admin bisa edit semua, Anggota edit miliknya yang belum terbit) */}
                        {canEdit ? (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Berita"
                            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        {/* Tombol Hapus */}
                        {canDelete ? (
                          <button
                            onClick={() => handleDelete(item.id, item.judul)}
                            title="Hapus Berita"
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada berita ditemukan. Klik tombol "Tulis Berita Baru" untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <Newspaper className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editId ? 'Edit Berita Satgas' : 'Tulis Berita Satgas Baru'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Keterangan Khusus Anggota */}
            {isAnggota && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Verifikasi Publikasi Super Admin:</strong>
                  Berita yang Anda tulis akan masuk ke antrean verifikasi dan membutuhkan persetujuan Super Admin sebelum resmi terbit di portal publik.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Judul */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Berita <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Satgas Anti Narkoba Resmikan Posko Pengaduan Terpadu"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="input-field !py-2.5 text-xs w-full"
                />
              </div>

              {/* Tanggal & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Rilis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="input-field !py-2 text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Publikasi
                  </label>
                  {isAnggota ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-field !py-2 text-xs w-full"
                    >
                      <option value="menunggu_verifikasi">Ajukan Verifikasi (Super Admin)</option>
                      <option value="draft">Simpan Draft Pribadi</option>
                    </select>
                  ) : (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-field !py-2 text-xs w-full"
                    >
                      <option value="terbit">Terbit Langsung (Publik)</option>
                      <option value="menunggu_verifikasi">Menunggu Verifikasi Super Admin</option>
                      <option value="draft">Draft (Disimpan saja)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Upload Gambar Berita */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Foto / Cover Berita</span>
                  <span className="text-[10px] font-normal text-slate-400">JPG, PNG, WEBP (Maks 5MB)</span>
                </label>

                {/* Preview Area jika ada gambar */}
                {(previewUrl || existingImage) ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center gap-4">
                    <img
                      src={previewUrl || getImageSrc(existingImage)}
                      alt="Preview Cover"
                      className="w-28 h-20 object-cover rounded-xl border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {selectedFile ? selectedFile.name : 'Gambar saat ini'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : 'Tersimpan di server'}
                      </p>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="mt-2 text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-secondary rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary mx-auto flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Klik untuk unggah foto berita
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Rasio 16:9 disarankan untuk tampilan terbaik
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Isi Berita */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Isi Berita <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Tulis narasi berita lengkap di sini..."
                  value={formData.isi}
                  onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                  className="textarea-field !py-2.5 text-xs w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">Dapat memuat teks narasi, kutipan siaran pers, dan paragraf kegiatan.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary !py-2 !px-5 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {isAnggota ? 'Kirim Pengajuan Berita' : 'Simpan Berita'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
