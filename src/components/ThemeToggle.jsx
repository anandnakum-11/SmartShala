import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{
                padding: '0.5rem',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-color)',
                background: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'white',
                color: theme === 'dark' ? '#fbbf24' : 'var(--text-secondary)',
                boxShadow: theme === 'dark' ? '0 0 15px rgba(251, 191, 36, 0.3)' : 'var(--shadow-sm)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
            }}
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>
    );
};

export default ThemeToggle;
