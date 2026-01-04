import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiLogOut } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const Unauthorized = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="auth-container" style={{ background: 'var(--bg-color)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
        <ThemeToggle />
      </div>
      <div className="auth-card animate-scale-in" style={{ width: '100%', maxWidth: '450px', background: 'var(--card-bg)', borderRadius: '1.5rem', padding: '3rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <img
            src="/logo.jpeg"
            alt="SmartShala Logo"
            style={{ height: '50px', borderRadius: '0.75rem', boxShadow: 'var(--shadow-md)' }}
          />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--primary-dark)', margin: 0 }}>SmartShala</h2>
        </div>
        <div className="icon-circle" style={{ width: '80px', height: '80px', background: '#fee2e2', color: '#ef4444', fontSize: '3rem', margin: '0 auto 1.5rem' }}>
          <FiAlertCircle />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Access Restricted</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.05rem' }}>You do not have the required administrative clearance to view this secure sector.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/login" className="teacher-action-btn-modern btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
            Return to Login
          </Link>
          <button
            onClick={handleLogout}
            className="teacher-action-btn-modern btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <FiLogOut /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;




