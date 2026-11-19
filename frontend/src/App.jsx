import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Beranda from './pages/public/Beranda';
import Laporkan from './pages/public/Laporkan';
import LaporkanEksternal from './pages/public/LaporkanEksternal';
import LacakLaporan from './pages/public/LacakLaporan';
import Edukasi from './pages/public/Edukasi';
import EdukasiDetail from './pages/public/EdukasiDetail';
import RegulasiUnduhan from './pages/public/RegulasiUnduhan';
import Berita from './pages/public/Berita';
import BeritaDetail from './pages/public/BeritaDetail';
import Agenda from './pages/public/Agenda';
import TentangSatgas from './pages/public/TentangSatgas';
import Login from './pages/auth/Login';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import DaftarLaporan from './pages/admin/DaftarLaporan';
import DetailLaporan from './pages/admin/DetailLaporan';
import KelolaEdukasi from './pages/admin/KelolaEdukasi';
import KelolaBerita from './pages/admin/KelolaBerita';
import KelolaAgenda from './pages/admin/KelolaAgenda';
import KelolaUsers from './pages/admin/KelolaUsers';
import KelolaRegulasi from './pages/admin/KelolaRegulasi';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0a2540',
              color: '#fff',
              borderRadius: '12px',
              padding: '14px 20px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#00BFA5', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ba1a1a', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Beranda />} />
            <Route path="/laporkan" element={<Laporkan />} />
            <Route path="/laporkan/eksternal" element={<LaporkanEksternal />} />
            <Route path="/lapor-eksternal" element={<LaporkanEksternal />} />
            <Route path="/laporkan-eksternal" element={<LaporkanEksternal />} />
            <Route path="/lacak" element={<LacakLaporan />} />
            <Route path="/edukasi" element={<Edukasi />} />
            <Route path="/edukasi/:slug" element={<EdukasiDetail />} />
            <Route path="/regulasi" element={<RegulasiUnduhan />} />
            <Route path="/berita" element={<Berita />} />
            <Route path="/berita/:slug" element={<BeritaDetail />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/tentang" element={<TentangSatgas />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="laporan" element={<DaftarLaporan />} />
            <Route path="laporan/:id" element={<DetailLaporan />} />
            <Route path="edukasi" element={<KelolaEdukasi />} />
            <Route path="berita" element={<KelolaBerita />} />
            <Route path="agenda" element={<KelolaAgenda />} />
            <Route path="users" element={<KelolaUsers />} />
            <Route path="regulasi" element={<KelolaRegulasi />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-hero-pattern">
              <div className="text-center text-white">
                <h1 className="text-8xl font-bold mb-4">404</h1>
                <p className="text-xl text-gray-300 mb-8">Halaman tidak ditemukan</p>
                <a href="/" className="btn-primary">Kembali ke Beranda</a>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
