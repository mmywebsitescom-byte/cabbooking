import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Menu, X, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/cars', label: 'Browse Cars' },
    { to: '/policies', label: 'Policies' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <Car size={20} />
            </div>
            <span className="gold-gradient">DriveEase</span>
          </Link>

          <div className="navbar-nav" style={{ display: 'flex' }}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`navbar-link${isActive(l.to) ? ' active' : ''}`}>{l.label}</Link>
            ))}
          </div>

          <div className="navbar-actions" style={{ display: 'flex' }}>
            {user ? (
              <div style={{ position: 'relative' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} />
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name.split(' ')[0]}</span>
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, background: 'var(--bg-700)',
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)',
                    padding: '0.5rem', minWidth: 180, zIndex: 200, boxShadow: 'var(--shadow-card)'
                  }}>
                    <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <LayoutDashboard size={15} /> My Bookings
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <Settings size={15} /> Admin Panel
                      </Link>
                    )}
                    <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.4rem 0' }} />
                    <button onClick={() => { logout(); setUserMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.88rem', color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none', width: '100%', transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>

          <button className="btn btn-ghost btn-sm" style={{ display: 'none' }} onClick={() => setMenuOpen(true)}
            id="mobile-menu-btn">
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <Link to="/" className="navbar-logo">
              <div className="navbar-logo-icon"><Car size={20} /></div>
              <span className="gold-gradient">DriveEase</span>
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`navbar-link${isActive(l.to) ? ' active' : ''}`}
                style={{ fontSize: '1.1rem', padding: '0.85rem 1rem' }}>
                {l.label}
              </Link>
            ))}
            {user && <Link to="/dashboard" className="navbar-link" style={{ fontSize: '1.1rem', padding: '0.85rem 1rem' }}>My Bookings</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="navbar-link" style={{ fontSize: '1.1rem', padding: '0.85rem 1rem' }}>Admin Panel</Link>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user ? (
              <button className="btn btn-danger" onClick={() => { logout(); setMenuOpen(false); }}>
                <LogOut size={16} /> Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Sign In</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .navbar-nav, .navbar-actions { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
