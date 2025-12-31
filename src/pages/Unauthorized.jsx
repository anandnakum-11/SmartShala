import { Link } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <FiAlertCircle size={64} className="unauthorized-icon" />
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <Link to="/" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;




