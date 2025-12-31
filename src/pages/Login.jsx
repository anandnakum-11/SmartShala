import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn, FiCheckCircle } from 'react-icons/fi';
import { showToast } from '../components/ToastContainer';

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
      // Small delay for toast to show
      setTimeout(() => {
        navigate(getDashboardPath(role), { replace: true });
      }, 1000);
    } catch (err) {
      let errorMsg = err.message || 'Failed to login. Please check your credentials.';

      // Handle Firebase configuration errors
      if (err.code === 'auth/invalid-api-key' || err.message?.includes('api-key-not-valid')) {
        errorMsg = 'Firebase configuration error: Invalid API Key. Please check your .env file.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your internet connection.';
      }

      setError(errorMsg);
      showToast(errorMsg, 'error');
      // Add shake animation to form
      const form = document.querySelector('.auth-form');
      if (form) {
        form.classList.add('shake-error');
        setTimeout(() => form.classList.remove('shake-error'), 500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'var(--bg-color)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="auth-card animate-scale-in" style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
        <div className="auth-header animate-fade-in-down" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="auth-logo-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
            <img
              src="/logo.jpeg"
              alt="SmartShala Logo"
              className="auth-logo animate-scale-in"
              style={{ height: '70px', borderRadius: '1rem', border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
            />
            <div className="auth-logo-text" style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--primary-dark)', letterSpacing: '-0.05em', lineHeight: 1 }}>SmartShala</h1>
              <p className="auth-tagline" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.95rem' }}>Institutional Portal Access</p>
            </div>
          </div>
        </div>

        {error && (
          <div className={`alert alert-error animate-slide-in-right ${error ? 'shake-error' : ''}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form animate-fade-in-up">
          <div className="form-group">
            <label className="form-label">
              <FiMail size={18} />
              Email Address or ID
            </label>
            <input
              type="text"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email or ID (STU-xxx, PAR-xxx, TEA-xxx)"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              You can login with your email address or your assigned ID
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiLock size={18} />
              Password
            </label>
            <input
              type="password"
              className="form-input"
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
          >
            <FiLogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
