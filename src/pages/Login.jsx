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
      const errorMsg = err.message || 'Failed to login. Please check your credentials.';
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
    <div className="auth-container">
      <div className="auth-card animate-scale-in">
        <div className="auth-header animate-fade-in-down">
          <div className="auth-logo-container">
            <img src="/logo.jpeg" alt="SmartShala Logo" className="auth-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="auth-logo-text">
              <h1>SmartShala</h1>
              <p className="auth-tagline">Simple Tools. Strong Schools.</p>
            </div>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sign in to your account</p>
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

