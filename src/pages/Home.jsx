import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  FiBook,
  FiUsers,
  FiCheckCircle,
  FiArrowRight,
  FiBarChart2,
  FiShield,
  FiAward
} from 'react-icons/fi';

const Home = () => {
  const features = [
    {
      icon: <FiUsers size={24} />,
      title: 'Portal Management',
      description: 'Dedicated spaces for Admins, Teachers, Students, and Parents.',
      color: 'var(--primary-color)'
    },
    {
      icon: <FiBook size={24} />,
      title: 'Digital Assignments',
      description: 'Paperless assignment tracking and submission system.',
      color: 'var(--secondary-color)'
    },
    {
      icon: <FiBarChart2 size={24} />,
      title: 'Analytics',
      description: 'Real-time performance insights and academic tracking.',
      color: 'var(--accent-color)'
    }
  ];

  return (
    <div className="home-page" style={{ overflowX: 'hidden', background: 'var(--bg-color)' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        padding: '10rem 0 8rem',
        background: 'radial-gradient(circle at top center, rgba(15, 118, 110, 0.12) 0%, transparent 70%)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container">
          <div className="animate-fade-in-up">
            <span className="status-indicator success" style={{ marginBottom: '2rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
              <FiCheckCircle size={16} /> Advanced Institutional Intelligence
            </span>

            <h1 className="hero-title" style={{
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              fontWeight: 900,
              marginBottom: '2rem',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: 'var(--primary-dark)'
            }}>
              Empowering the <br className="hidden-mobile" />
              <span className="text-gradient" style={{ background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modern Academy</span>
            </h1>

            <p style={{
              fontSize: '1.35rem',
              color: 'var(--text-secondary)',
              maxWidth: '700px',
              margin: '0 auto 3.5rem',
              lineHeight: 1.7,
              fontWeight: 500
            }}>
              The unified operating system for schools. Experience world-class administration, teaching, and parent engagement in one seamless, high-performance platform.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="teacher-action-btn-modern btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                Initiate Enrollment <FiArrowRight />
              </Link>
              <a href="#features" className="teacher-action-btn-modern" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 0', background: 'white' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 850, color: 'var(--primary-dark)', marginBottom: '1.25rem' }}>Integrated Infrastructure</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>All the mission-critical tools required to steer your academic institution towards success.</p>
          </div>

          <div className="summary-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {features.map((feature, index) => (
              <div key={index} className="card hover-scale" style={{
                padding: '2.5rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                boxShadow: 'none',
                background: 'var(--bg-color)'
              }}>
                <div className="icon-circle" style={{
                  width: '56px',
                  height: '56px',
                  background: 'white',
                  borderRadius: '1rem',
                  color: feature.color,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.05rem' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Stats/Trust Section */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '4rem',
            textAlign: 'center'
          }}>
            <div className="animate-fade-in">
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '-0.05em' }}>100%</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>Military-Grade Security</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent-color)', letterSpacing: '-0.05em' }}>24/7</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>Global Support</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--secondary-color)', letterSpacing: '-0.05em' }}>FREE</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>Enterprise Edition</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
