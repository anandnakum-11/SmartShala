import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { showToast } from '../components/ToastContainer';
import Snowfall from '../components/Snowfall';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { role } = await login(email, password);

      const getDashboardPath = (userRole) => {
        switch (userRole) {
          case 'admin':
            return '/admin';
          case 'teacher':
            return '/teacher';
          case 'student':
            return '/student';
          case 'parent':
            return '/parent';
          default:
            return '/';
        }
      };

      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        navigate(getDashboardPath(role), { replace: true });
      }, 1000);
    } catch (err) {
      let errorMsg = err.message || 'Failed to login. Please check your credentials.';

      if (err.code === 'auth/invalid-api-key' || err.message?.includes('api-key-not-valid')) {
        errorMsg = 'Firebase configuration error: Invalid API Key. Please check your .env file.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your internet connection.';
      }

      setError(errorMsg);
      showToast(errorMsg, 'error');
      const form = document.querySelector('.glass-card-form');
      if (form) {
        form.classList.add('shake-error');
        setTimeout(() => form.classList.remove('shake-error'), 500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-glass-container">
      <Snowfall />
      {/* Background Shapes */}
      <div className="glass-shape glass-shape-1"></div>
      <div className="glass-shape glass-shape-2"></div>
      <div className="glass-shape glass-shape-3"></div>



      <div className="glass-card-form animate-scale-in">
        <div className="auth-header animate-fade-in-down" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="auth-logo-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
            <img
              src="/logo.jpeg"
              alt="SmartShala Logo"
              className="auth-logo animate-scale-in"
              style={{ height: '70px', borderRadius: '1rem', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
            />
            <div className="auth-logo-text glass-logo-text" style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1 }}>SmartShala</h1>
              <p className="glass-text-secondary" style={{ fontWeight: 700, fontSize: '0.95rem' }}>Institutional Portal Access</p>
            </div>
          </div>
        </div>

        {error && (
          <div className={`alert alert-error animate-slide-in-right ${error ? 'shake-error' : ''}`} style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form animate-fade-in-up">
          <div className="form-group">
            <label className="form-label glass-label">
              <FiMail size={18} />
              Email Address or ID
            </label>
            <input
              type="text"
              className="form-input glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email or ID"
            />
            <small className="glass-text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              You can login with your email address or your assigned ID
            </small>
          </div>

          <div className="form-group">
            <label className="form-label glass-label">
              <FiLock size={18} />
              Password
            </label>
            <input
              type="password"
              className="form-input glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', border: 'none', padding: '1rem', fontSize: '1.1rem' }}
          >
            <FiLogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer glass-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 'bold' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
