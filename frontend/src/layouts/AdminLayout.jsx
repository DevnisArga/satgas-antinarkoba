import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, FileText, BookOpen, 
  Newspaper, Calendar, Users, LogOut, ChevronRight,
  Menu, X, Bell, UserCheck
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Berhasil keluar dari sistem');
      navigate('/login');
    } catch {
      toast.error('Gagal logout');
    }
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/laporan', label: 'Manajemen Laporan', icon: FileText },
    { to: '/admin/edukasi', label: 'Artikel Edukasi', icon: BookOpen },
    { to: '/admin/berita', label: 'Berita Satgas', icon: Newspaper },
    { to: '/admin/agenda', label: 'Agenda Kegiatan', icon: Calendar },
    { to: '/admin/regulasi', label: 'Kelola Dokumen Unduhan', icon: FileText },
    ...(user?.role !== 'anggota' ? [
      { to: '/admin/users', label: 'Kelola Pengguna', icon: Users }
    ] : [])
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary text-white border-r border-slate-800">
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <img src="/logo_satgas_anti_narkoba_HD.svg" alt="Logo Satgas" className="w-11 h-11 object-contain filter drop-shadow" />
          </div>
          <div>
            <span className="font-black text-base block text-white tracking-wide">PANEL SATGAS</span>
            <span className="text-[10px] text-accent tracking-widest block font-semibold">ADMIN POLINELA</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm shadow">
            {user?.nama?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.nama || 'Admin Satgas'}</p>
            <p className="text-xs text-accent-light capitalize flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin Satgas' : 'Anggota Satgas'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-accent-light' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition"
          >
            <span>Lihat Website Publik</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-16 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Buka menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              Sistem Informasi Manajemen Satgas
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-700">{user?.email}</span>
              <span className="text-[11px] text-slate-500">Tahun Aktif: {new Date().getFullYear()}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
              {user?.nama?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-primary text-white flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img src="/logo_satgas_anti_narkoba_HD.svg" alt="Logo Satgas" className="w-8 h-8 object-contain" />
                <span className="font-bold text-sm">PANEL SATGAS POLINELA</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      active ? 'bg-secondary text-white' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              Keluar Sistem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
