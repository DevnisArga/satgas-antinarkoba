import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Mohon isi email dan password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Selamat datang di Panel Satgas Polinela!');
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal login. Pastikan email dan password benar.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
            <img src="/logo_satgas_anti_narkoba_HD.svg" alt="Logo Satgas Anti Narkoba" className="w-full h-full object-contain filter drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Portal Petugas Satgas</h2>
          <p className="text-xs text-slate-500 mt-1">
            Khusus Petugas Satgas Anti Narkoba Polinela
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Petugas
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@satgas.polinela.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 text-xs sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3 !px-4 text-sm mt-4"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Pelapor tidak memerlukan akun untuk membuat atau melacak laporan.
          </p>
          <Link to="/" className="text-xs font-bold text-secondary hover:underline block">
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
