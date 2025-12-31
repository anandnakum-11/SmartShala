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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header animate-fade-in-down">
          <div className="auth-logo-container">
            <img src="/logo.jpeg" alt="SmartShala Logo" className="auth-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="auth-logo-text">
              <h1>SmartShala</h1>
              <p className="auth-tagline">Simple Tools. Strong Schools.</p>
            </div>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Create your account</p>
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
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            <FiUserPlus size={18} />
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;


