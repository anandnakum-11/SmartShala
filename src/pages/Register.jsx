import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { generateIdByRole, getIdFieldName } from '../utils/idGenerator';

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

  // Auto-generate ID on mount and when role changes
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

      // For parent role, child email or student ID is compulsory
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

      // Store child information for parent
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
    <div className="auth-container" style={{ background: 'var(--bg-color)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="auth-card animate-scale-in" style={{ width: '100%', maxWidth: '550px', background: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
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

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <FiUser size={18} />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiMail size={18} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="form-group">
                <label className="form-label">Student ID (Auto-generated)</label>
                <input
                  type="text"
                  name="studentId"
                  className="form-input"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  placeholder={generatingId ? "Generating ID..." : "Student ID will be auto-generated"}
                  readOnly
                  disabled={generatingId}
                  style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Your Student ID: {formData.studentId || 'Generating...'}. Save this for login.
                </small>
              </div>
            </>
          )}

          {formData.role === 'parent' && (
            <>
              <div className="form-group">
                <label className="form-label">Parent ID (Auto-generated)</label>
                <input
                  type="text"
                  name="parentId"
                  className="form-input"
                  value={formData.parentId}
                  onChange={handleChange}
                  required
                  placeholder={generatingId ? "Generating ID..." : "Parent ID will be auto-generated"}
                  readOnly
                  disabled={generatingId}
                  style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Your Parent ID: {formData.parentId || 'Generating...'}. Save this for login.
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Child's Email Address <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="email"
                  name="childEmail"
                  className="form-input"
                  value={formData.childEmail}
                  onChange={handleChange}
                  placeholder="Enter your child's email address"
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Required: Enter either child's email OR student ID below
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Child's Student ID <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="childStudentId"
                  className="form-input"
                  value={formData.childStudentId}
                  onChange={handleChange}
                  placeholder="Enter your child's Student ID (e.g., STU-1)"
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Required: Enter either child's email OR student ID above
                </small>
              </div>
            </>
          )}

          {formData.role === 'teacher' && (
            <div className="form-group">
              <label className="form-label">Teacher ID (Auto-generated)</label>
              <input
                type="text"
                name="teacherId"
                className="form-input"
                value={formData.teacherId}
                onChange={handleChange}
                required
                placeholder={generatingId ? "Generating ID..." : "Teacher ID will be auto-generated"}
                readOnly
                disabled={generatingId}
                style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Your Teacher ID: {formData.teacherId || 'Generating...'}. Save this for login.
              </small>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <FiLock size={18} />
              Password
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiLock size={18} />
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className="teacher-action-btn-modern btn-primary btn-block"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '1.5rem', fontSize: '1rem' }}
          >
            <FiUserPlus size={18} />
            {loading ? 'Creating account...' : 'Finalize Registration'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;


