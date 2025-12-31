import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiLogOut, FiUser, FiSearch, FiBell } from 'react-icons/fi';

const Layout = ({ children }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent'
    };
    return roleNames[role] || role;
  };

  const getDashboardPath = () => {
    return `/${userRole}`;
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="header animate-fade-in-down">
        <div className="header-content">
          <div className="header-left">
            <button
              className="menu-toggle icon-glow"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <div className="logo-container">
              <img
                src="/logo.jpeg"
                alt="SmartShala Logo"
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const container = e.target.parentElement;
                  if (container) {
                    container.classList.add('logo-fallback');
                  }
                }}
              />
              <div className="logo-text">
                <h1 className="logo">SmartShala</h1>
                <p className="logo-tagline">Simple Tools. Strong Schools.</p>
              </div>
            </div>
          </div>
          <div className="header-center">
            <div className="search-bar">
              <FiSearch size={20} />
              <input
                type="text"
                placeholder="Search for student, teacher or document..."
                className="search-input"
              />
            </div>
          </div>
          <div className="header-right">
            <button className="header-icon-btn" title="Notifications">
              <FiBell size={20} />
              <span className="notification-badge">3</span>
            </button>
            <div className="user-info">
              <FiUser size={20} />
              <span>{currentUser?.email}</span>
              <span className="role-badge">{getRoleName(userRole)}</span>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              <FiLogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            <a href="/" className="nav-item">
              <FiHome size={20} />
              <span>Home</span>
            </a>
            <a href={getDashboardPath()} className="nav-item">
              <FiHome size={20} />
              <span>Dashboard</span>
            </a>
            {/* Additional nav items will be added by each dashboard */}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

