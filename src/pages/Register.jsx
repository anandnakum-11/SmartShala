import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { generateIdByRole, getIdFieldName } from '../utils/idGenerator';
import Snowfall from '../components/Snowfall';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    name: '',
    studentId: '',
    parentId: '',
    teacherId: '',
    childEmail: '',
    childStudentId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const generateId = async () => {
      setGeneratingId(true);
      try {
        const idFieldName = getIdFieldName(formData.role);
        const generatedId = await generateIdByRole(formData.role);
        setFormData(prev => ({
          ...prev,
          [idFieldName]: generatedId
        }));
      } catch (err) {
        console.error('Error generating ID:', err);
        setError('Failed to generate ID. Please try again.');
      } finally {
        setGeneratingId(false);
      }
    };

    generateId();
  }, [formData.role]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const idFieldName = getIdFieldName(formData.role);
      const userId = formData[idFieldName];

      if (!userId) {
        setError(`${idFieldName} is required. Please try again.`);
        return;
      }

      if (formData.role === 'parent') {
        if (!formData.childEmail && !formData.childStudentId) {
          setError('Child email or Student ID is required for parent registration.');
          setLoading(false);
          return;
        }
      }

      const additionalData = {
        name: formData.name,
        [idFieldName]: userId
      };

      if (formData.role === 'parent') {
        if (formData.childEmail) {
          additionalData.childEmail = formData.childEmail;
        }
        if (formData.childStudentId) {
          additionalData.childStudentId = formData.childStudentId;
        }
      }

      await register(formData.email, formData.password, formData.role, additionalData);

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

      navigate(getDashboardPath(formData.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
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

      <div className="glass-card-form animate-scale-in" style={{ maxWidth: '550px' }}>
        <div className="auth-header animate-fade-in-down" style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
          <div className="alert alert-error" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label glass-label">
              <FiUser size={18} />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              className="form-input glass-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label glass-label">
              <FiMail size={18} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="form-input glass-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label glass-label">Role</label>
            <select
              name="role"
              className="form-select glass-input"
              value={formData.role}
              onChange={handleChange}
              required
              style={{ color: 'var(--text-primary)' }} // Ensure dropdown options are readable if system select is used
            >
              <option value="student" style={{ color: 'black' }}>Student</option>
              <option value="teacher" style={{ color: 'black' }}>Teacher</option>
              <option value="parent" style={{ color: 'black' }}>Parent</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div className="form-group">
              <label className="form-label glass-label">Student ID</label>
              <input
                type="text"
                name="studentId"
                className="form-input glass-input"
                value={formData.studentId}
                onChange={handleChange}
                required
                readOnly
                disabled={generatingId}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <small className="glass-text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Your Student ID: {formData.studentId || 'Generating...'}
              </small>
            </div>
          )}

          {formData.role === 'parent' && (
            <>
              <div className="form-group">
                <label className="form-label glass-label">Parent ID</label>
                <input
                  type="text"
                  name="parentId"
                  className="form-input glass-input"
                  value={formData.parentId}
                  onChange={handleChange}
                  required
                  readOnly
                  disabled={generatingId}
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label glass-label">
                  Child's Email <span style={{ color: '#fca5a5' }}>*</span>
                </label>
                <input
                  type="email"
                  name="childEmail"
                  className="form-input glass-input"
                  value={formData.childEmail}
                  onChange={handleChange}
                  placeholder="Enter child's email"
                />
              </div>
              <div className="form-group">
                <label className="form-label glass-label">
                  Child's ID <span style={{ color: '#fca5a5' }}>*</span>
                </label>
                <input
                  type="text"
                  name="childStudentId"
                  className="form-input glass-input"
                  value={formData.childStudentId}
                  onChange={handleChange}
                  placeholder="Enter child's Student ID"
                />
              </div>
            </>
          )}

          {formData.role === 'teacher' && (
            <div className="form-group">
              <label className="form-label glass-label">Teacher ID</label>
              <input
                type="text"
                name="teacherId"
                className="form-input glass-input"
                value={formData.teacherId}
                onChange={handleChange}
                required
                readOnly
                disabled={generatingId}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label glass-label">
              <FiLock size={18} />
              Password
            </label>
            <input
              type="password"
              name="password"
              className="form-input glass-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min 6 chars"
            />
          </div>

          <div className="form-group">
            <label className="form-label glass-label">
              <FiLock size={18} />
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input glass-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '1.5rem', fontSize: '1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', border: 'none' }}
          >
            <FiUserPlus size={18} />
            {loading ? 'Creating account...' : 'Finalize Registration'}
          </button>
        </form>

        <div className="auth-footer glass-footer" style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
            Already registered?{' '}
            <Link to="/login" style={{ fontWeight: 'bold' }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
