import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Edit2,
  Users,
  ShieldCheck,
  FileText,
  Upload,
  Calendar,
  AlertTriangle,
  Download,
  ExternalLink,
  Archive,
  X,
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getUploadUrl } from '../../lib/api';

export default function KelolaUsers() {
  const { user } = useAuth();

  // Anggota tidak diizinkan mengakses halaman Kelola Pengguna
  if (user?.role === 'anggota') {
    return <Navigate to="/admin" replace />;
  }

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'terminations'
  const [users, setUsers] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'anggota'
  });

  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'anggota'
  });

  // Termination modal state
  const [terminateUser, setTerminateUser] = useState(null);
  const [terminateData, setTerminateData] = useState({
    nomor_surat: '',
    tanggal_surat: new Date().toISOString().split('T')[0],
    alasan: '',
    file: null
  });
  const [isSubmittingTerminate, setIsSubmittingTerminate] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTerminations();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('Gagal memuat daftar pengguna.');
      setUsers([]);
    }
  };

  const fetchTerminations = async () => {
    try {
      const res = await api.get('/admin/users/terminations');
      setTerminations(res.data.data || []);
    } catch (err) {
      console.error('Fetch terminations error:', err);
      // Jangan ganggu dengan toast error jika endpoint baru pertama kali dibuat
    }
  };

  // Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/users', createFormData);
      toast.success('Pengguna baru berhasil didaftarkan');
      setModalCreateOpen(false);
      setCreateFormData({ nama: '', email: '', password: '', role: 'anggota' });
      fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal mendaftarkan akun.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (item) => {
    setEditUser(item);
    setEditFormData({
      nama: item.nama || '',
      email: item.email || '',
      role: item.role || 'anggota',
      password: ''
    });
  };

  // Update User
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nama: editFormData.nama,
        email: editFormData.email,
        role: editFormData.role
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }
      await api.put(`/admin/users/${editUser.id}`, payload);
      toast.success('Data akun berhasil diperbarui!');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Update user error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal memperbarui akun.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open Termination Modal
  const handleOpenTerminate = (user) => {
    setTerminateUser(user);
    setTerminateData({
      nomor_surat: '',
      tanggal_surat: new Date().toISOString().split('T')[0],
      alasan: '',
      file: null
    });
  };

  // Submit Termination with SK
  const handleTerminateSubmit = async (e) => {
    e.preventDefault();
    if (!terminateData.nomor_surat.trim()) {
      toast.error('Nomor Surat Keputusan (SK) wajib diisi.');
      return;
    }
    if (!terminateData.tanggal_surat) {
      toast.error('Tanggal SK wajib diisi.');
      return;
    }
    if (!terminateData.alasan.trim()) {
      toast.error('Alasan pemberhentian wajib diisi.');
      return;
    }
    if (!terminateData.file) {
      toast.error('Berkas surat pemberhentian (PDF / Foto) wajib diunggah.');
      return;
    }

    setIsSubmittingTerminate(true);
    try {
      const form = new FormData();
      form.append('nomor_surat', terminateData.nomor_surat.trim());
      form.append('tanggal_surat', terminateData.tanggal_surat);
      form.append('alasan', terminateData.alasan.trim());
      form.append('surat_pemberhentian', terminateData.file);

      const res = await api.post(`/admin/users/${terminateUser.id}/terminate`, form);
      toast.success(res.data.message || 'Pemberhentian resmi berhasil diproses dan diarsipkan.');
      setTerminateUser(null);
      fetchUsers();
      fetchTerminations();
    } catch (err) {
      console.error('Termination error:', err);
      const errMsg = err.response?.data?.error || 'Gagal memproses pemberhentian petugas.';
      toast.error(errMsg);
    } finally {
      setIsSubmittingTerminate(false);
    }
  };

  // Helper Badge Role
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            SUPER ADMIN
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            ADMIN SATGAS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            ANGGOTA SATGAS
          </span>
        );
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.nama?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const filteredTerminations = terminations.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.nama_user?.toLowerCase().includes(q) ||
      t.email_user?.toLowerCase().includes(q) ||
      t.nomor_surat?.toLowerCase().includes(q) ||
      t.alasan?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Akun & Personel Satgas</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              RBAC & Arsip SK
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan hak akses petugas aktif dan dokumentasi resmi surat keputusan pemberhentian.
          </p>
        </div>

        {activeTab === 'active' && (
          <button
            onClick={() => setModalCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Akun Petugas
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Petugas Aktif</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-extrabold ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('terminations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'terminations'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Arsip Surat Pemberhentian</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-extrabold ${
                activeTab === 'terminations' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {terminations.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'active' ? 'Cari nama, email, role...' : 'Cari nomor SK, nama...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Content Tab 1: Petugas Aktif */}
      {activeTab === 'active' && (
        <div className="space-y-4">


          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-black tracking-wider">
                    <th className="py-3.5 px-4">Nama Lengkap & Petugas</th>
                    <th className="py-3.5 px-4">Email Resmi</th>
                    <th className="py-3.5 px-4">Hak Akses (Role)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Tindakan Administratif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                        Tidak ada petugas ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-black flex items-center justify-center text-xs">
                              {item.nama ? item.nama.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{item.nama}</div>
                              <div className="text-xs text-slate-400">ID #{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                          {item.email}
                        </td>
                        <td className="py-3.5 px-4">
                          {getRoleBadge(item.role)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Aktif
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all shadow-sm"
                              title="Edit Data Akun"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleOpenTerminate(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all shadow-sm"
                              title="Pemberhentian Resmi Petugas dengan Surat Keputusan (SK)"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pemberhentian (SK)</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab 2: Arsip Surat Pemberhentian */}
      {activeTab === 'terminations' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Archive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">Arsip Resmi Surat Keputusan (SK) Pemberhentian</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Semua berkas SK fisik yang diunggah tersimpan aman di server dan dapat diunduh untuk keperluan pemeriksaan,
                  akreditasi, dan audit kelembagaan Satgas Anti Narkoba.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-amber-400">{terminations.length}</span>
              <span className="block text-[11px] text-slate-400 font-semibold uppercase">Total Berkas Diarsip</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-black tracking-wider">
                    <th className="py-3.5 px-4">No. SK & Tanggal</th>
                    <th className="py-3.5 px-4">Petugas Yang Diberhentikan</th>
                    <th className="py-3.5 px-4">Peran Terakhir</th>
                    <th className="py-3.5 px-4">Alasan / Dasar Keputusan</th>
                    <th className="py-3.5 px-4">Pejabat Pemroses</th>
                    <th className="py-3.5 px-4 text-center">Berkas Fisik SK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTerminations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                        Belum ada arsip surat pemberhentian yang diterbitkan.
                      </td>
                    </tr>
                  ) : (
                    filteredTerminations.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md inline-block border border-slate-200">
                            {t.nomor_surat}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {t.tanggal_surat ? new Date(t.tanggal_surat).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : '-'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{t.nama_user}</div>
                          <div className="text-xs text-slate-500">{t.email_user}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {getRoleBadge(t.role_user)}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed line-clamp-3">
                            {t.alasan}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-slate-800">{t.diberhentikan_oleh_nama || 'Admin'}</span>
                          <div className="text-[11px] text-slate-400">
                            Diproses: {new Date(t.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {t.file_surat ? (
                            <a
                              href={getUploadUrl(t.file_surat)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold transition-all shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                              <span>Unduh Dokumen SK</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tidak ada berkas</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Petugas */}
      {modalCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Tambah Akun Petugas Satgas</h3>
              <button
                onClick={() => setModalCreateOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Petugas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Fathurrahman K I, S.Kom., M.T.I"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={createFormData.nama}
                  onChange={(e) => setCreateFormData({ ...createFormData, nama: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi Polinela</label>
                <input
                  type="email"
                  required
                  placeholder="nama@polinela.ac.id"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Baru (Min. 8 Karakter)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role / Peran Otorisasi</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                >
                  <option value="anggota">Anggota Satgas (Dapat Membuat Draf Berita)</option>
                  <option value="admin">Admin Satgas (Kelola Laporan & Konten)</option>
                  <option value="super_admin">Super Admin (Hak Akses Penuh Sistem)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Petugas */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Perbarui Data Akun Petugas</h3>
              <button
                onClick={() => setEditUser(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Petugas</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={editFormData.nama}
                  onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi Polinela</label>
                <input
                  type="email"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubah Kata Sandi (Opsional, kosongkan jika tidak ingin ganti)
                </label>
                <input
                  type="password"
                  minLength={8}
                  placeholder="Isi sandi baru jika ingin diubah"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role / Peran Otorisasi</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="anggota">Anggota Satgas (Dapat Membuat Draf Berita)</option>
                  <option value="admin">Admin Satgas (Kelola Laporan & Konten)</option>
                  <option value="super_admin">Super Admin (Hak Akses Penuh Sistem)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pemberhentian Resmi dengan Surat Keputusan (SK) */}
      {terminateUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Formulir SK Pemberhentian Petugas</h3>
                  <p className="text-xs text-slate-500">Prosedur resmi pemutusan hak akses keanggotaan</p>
                </div>
              </div>
              <button
                onClick={() => setTerminateUser(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Peringatan & Petugas Terpilih */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Akun yang akan diberhentikan:</p>
                <p className="mt-0.5 text-amber-950 font-semibold">{terminateUser.nama} ({terminateUser.email})</p>
                <p className="mt-1 text-[11px] text-amber-800">
                  Sesuai instruksi ketua satgas dan tata tertib administrasi, berkas SK yang diunggah akan disimpan di arsip permanen dan dapat diaudit.
                </p>
              </div>
            </div>

            <form onSubmit={handleTerminateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Surat Keputusan (SK) / Berita Acara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SK/045/SATGAS-PL/XI/2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  value={terminateData.nomor_surat}
                  onChange={(e) => setTerminateData({ ...terminateData, nomor_surat: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Surat Keputusan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  value={terminateData.tanggal_surat}
                  onChange={(e) => setTerminateData({ ...terminateData, tanggal_surat: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan / Keterangan Resmi Pemberhentian <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Tuliskan dasar pertimbangan pemberhentian (misal: habis masa jabatan, mutasi dinas, pelanggaran disiplin)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  value={terminateData.alasan}
                  onChange={(e) => setTerminateData({ ...terminateData, alasan: e.target.value })}
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unggah Berkas Fisik SK (PDF / Gambar) <span className="text-rose-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-2xl p-4 text-center bg-slate-50/50 transition-colors">
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setTerminateData({ ...terminateData, file: e.target.files[0] })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-rose-500 mb-2" />
                    {terminateData.file ? (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{terminateData.file.name}</span>
                        <span className="text-slate-400 font-normal">
                          ({(terminateData.file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-700">Klik atau geser file SK ke sini</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Format: PDF, JPG, PNG (Maks 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTerminateUser(null)}
                  disabled={isSubmittingTerminate}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTerminate}
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingTerminate ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan & Mengarsipkan...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Arsipkan & Berhentikan</span>
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
