import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogIn, FiUserPlus, FiLogOut, FiLayout } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const navClass = `navbar ${scrolled ? 'glass shadow-sm' : ''}`;

  return (
    <nav className={navClass} style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '1rem 0',
      transition: 'all 0.3s ease',
      background: scrolled ? 'var(--glass-bg)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ position: 'relative' }}>
            <img
              src="/logo.jpeg"
              alt="SmartShala"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <span style={{
            fontWeight: 700,
            fontSize: '1.5rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            SmartShala
          </span>
        </Link>

        <div className="navbar-menu" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {currentUser ? (
            <>
              <Link to={`/${userRole}`} className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                <FiLayout /> Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


