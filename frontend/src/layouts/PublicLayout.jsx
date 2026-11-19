import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/laporkan', label: 'Lapor Internal' },
  { to: '/laporkan/eksternal', label: 'Lapor Eksternal' },
  { to: '/lacak', label: 'Lacak Laporan' },
  { to: '/edukasi', label: 'Edukasi' },
  { to: '/regulasi', label: 'Regulasi' },
  { to: '/berita', label: 'Berita' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/tentang', label: 'Tentang' },
];

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/laporkan') return location.pathname === '/laporkan';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-100'
            : 'bg-primary-900/80 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3.5 group" id="nav-logo">
              <div className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-300">
                <img src="/logo_satgas_anti_narkoba_HD.svg" alt="Logo Satgas" className="w-full h-full object-contain filter drop-shadow-sm" />
              </div>
              <div className="flex flex-col justify-center">
                <span className={`font-black text-lg lg:text-xl leading-tight block transition-colors tracking-tight ${
                  scrolled ? 'text-primary-900' : 'text-white'
                }`}>
                  SATGAS
                </span>
                <span className={`text-[10px] lg:text-[11px] font-semibold tracking-wider leading-none block transition-colors mt-0.5 ${
                  scrolled ? 'text-secondary' : 'text-accent-light'
                }`}>
                  ANTI NARKOBA POLINELA
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  id={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive(link.to)
                      ? scrolled
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-white/15 text-white'
                      : scrolled
                        ? 'text-gray-600 hover:text-primary-900 hover:bg-gray-100'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Login & CTA */}
            <div className="hidden xl:flex items-center gap-2.5">
              <Link
                to="/login"
                id="nav-login"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scrolled ? 'text-gray-600 hover:text-primary-900' : 'text-white/80 hover:text-white'
                }`}
              >
                Login
              </Link>
              <Link to="/laporkan" className="btn-primary text-xs !py-2 !px-4 whitespace-nowrap" id="nav-cta-laporkan">
                Buat Laporan
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`xl:hidden p-2 rounded-lg transition-colors ${
                scrolled ? 'text-primary-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
              id="nav-mobile-toggle"
              aria-label="Menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div className={`xl:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white border-t border-gray-100 shadow-xl px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-secondary/10 text-secondary font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-100" />
            <Link to="/login" className="block px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl">
              Login Admin
            </Link>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-1">
              <Link to="/laporkan" className="btn-primary text-center text-xs !py-2.5 !px-2 justify-center">
                Lapor Internal
              </Link>
              <Link to="/laporkan/eksternal" className="btn-secondary !bg-blue-600 hover:!bg-blue-700 !text-white text-center text-xs !py-2.5 !px-2 justify-center">
                Lapor Eksternal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top */}
          <div className="py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
                  <img src="/logo_satgas_anti_narkoba_HD.svg" alt="Logo Satgas" className="w-full h-full object-contain filter drop-shadow-md" />
                </div>
                <div>
                  <span className="font-extrabold text-xl block text-white tracking-tight">SATGAS</span>
                  <span className="text-xs text-accent-light tracking-wider font-semibold block mt-0.5">ANTI NARKOBA POLINELA</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Satuan Tugas Anti Narkoba Politeknik Negeri Lampung. Dibentuk Juli 2025 bekerja sama dengan BNN Provinsi Lampung.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-accent">Tautan Cepat</h4>
              <ul className="space-y-2">
                {[
                  { to: '/laporkan', label: 'Lapor Internal (Civitas)' },
                  { to: '/laporkan/eksternal', label: 'Lapor Eksternal (Masyarakat/Mitra)' },
                  { to: '/lacak', label: 'Lacak Laporan' },
                  { to: '/edukasi', label: 'Edukasi Pencegahan' },
                  { to: '/regulasi', label: 'Regulasi & Unduhan' },
                  { to: '/tentang', label: 'Tentang Satgas' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" /> {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontak */}
            <div>
              <h4 className="font-semibold mb-4 text-accent">Kontak</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                  <span>Jl. Soekarno Hatta No.10, Rajabasa, Bandar Lampung</span>
                </li>
                <li>
                  <a
                    href="https://wa.me/6282282147037?text=Halo%20Satgas%20Anti%20Narkoba%20Polinela,%20saya%20ingin%20berkonsultasi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-400 hover:text-white transition group text-sm"
                  >
                    <Phone className="w-4 h-4 text-accent flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:underline">+62 822 8214 7037 (WhatsApp)</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=antinarkoba@polinela.ac.id&su=Konsultasi%20Satgas%20Anti%20Narkoba%20Polinela"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (navigator?.clipboard) navigator.clipboard.writeText('antinarkoba@polinela.ac.id');
                      toast.success('Membuka Gmail & email disalin ke clipboard!', { icon: '✉️' });
                    }}
                    className="flex items-center gap-3 text-gray-400 hover:text-white transition group text-sm"
                  >
                    <Mail className="w-4 h-4 text-accent flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:underline">antinarkoba@polinela.ac.id</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Keamanan */}
            <div>
              <h4 className="font-semibold mb-4 text-accent">Jaminan Keamanan</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Data identitas pelapor dienkripsi secara aman di database dan hanya dapat diakses oleh pihak berwenang di Satgas. Kerahasiaan data Anda terlindungi dan tidak disebarluaskan.
              </p>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Satgas Anti Narkoba — Politeknik Negeri Lampung
            </p>
            <p className="text-gray-600 text-xs">
              Dibuat oleh Tim Proyek Mandiri
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
