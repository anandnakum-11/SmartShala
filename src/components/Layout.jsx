import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiLogOut, FiUser, FiSearch, FiBell, FiBarChart, FiClipboard, FiCheckCircle, FiUpload, FiCalendar, FiUsers, FiBook } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';

const Layout = ({ children }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  // Initialize based on screen width (safe for Client Side Rendering)
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : false);
  const location = useLocation();

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

  const getSidebarItems = (role) => {
    switch (role) {
      case 'student':
        return [
          { key: 'overview', label: 'Overview', icon: <FiBarChart size={20} /> },
          { key: 'assignments', label: 'Assignments', icon: <FiClipboard size={20} /> },
          { key: 'attendance', label: 'Attendance', icon: <FiCheckCircle size={20} /> },
          { key: 'marks', label: 'Marks', icon: <FiUpload size={20} /> },
          { key: 'timetable', label: 'Timetable', icon: <FiCalendar size={20} /> },
          { key: 'announcements', label: 'Announcements', icon: <FiBell size={20} /> }
        ];
      case 'teacher':
        return [
          { key: 'overview', label: 'Overview', icon: <FiBarChart size={20} /> },
          { key: 'attendance', label: 'Attendance', icon: <FiCheckCircle size={20} /> },
          { key: 'assignments', label: 'Assignments', icon: <FiClipboard size={20} /> },
          { key: 'marks', label: 'Marks', icon: <FiUpload size={20} /> },
          { key: 'timetable', label: 'Timetable', icon: <FiCalendar size={20} /> }
        ];
      case 'admin':
        return [
          { key: 'overview', label: 'Overview', icon: <FiBarChart size={20} /> },
          { key: 'users', label: 'Users', icon: <FiUsers size={20} /> },
          { key: 'classes', label: 'Classes', icon: <FiBook size={20} /> },
          { key: 'timetable', label: 'Timetable', icon: <FiCalendar size={20} /> },
          { key: 'announcements', label: 'Announcements', icon: <FiBell size={20} /> }
        ];
      case 'parent':
        return [
          { key: 'overview', label: 'Overview', icon: <FiBarChart size={20} /> },
          { key: 'attendance', label: 'Attendance', icon: <FiCheckCircle size={20} /> },
          { key: 'marks', label: 'Marks', icon: <FiBook size={20} /> },
          { key: 'announcements', label: 'Announcements', icon: <FiBell size={20} /> }
        ];
      // Add other roles as needed
      default:
        return [{ key: 'overview', label: 'Dashboard', icon: <FiHome size={20} /> }];
    }
  };

  const menuItems = getSidebarItems(userRole);
  const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';

  const handleLinkClick = () => {
    // Only close on mobile
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
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
            <ThemeToggle />
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
              <span className="hide-text-mobile">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">


            {menuItems.map((item) => (
              <Link
                key={item.key}
                to={`${getDashboardPath()}?tab=${item.key}`}
                className={`nav-item ${currentTab === item.key && location.pathname === getDashboardPath() ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
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
