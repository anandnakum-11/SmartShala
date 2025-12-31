import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import AnimatedCounter from './AnimatedCounter';

const SummaryCard = ({ title, value, change, changeType = 'positive', icon, color = '#667eea', iconBg }) => {
  return (
    <div className="summary-card stagger-item" style={{ borderLeftColor: color }}>
      <div className="summary-card-content">
        <div className="summary-card-icon icon-glow" style={{ background: iconBg || `${color}20`, color }}>
          {icon}
        </div>
        <div className="summary-card-info">
          <h3 className="summary-card-title">{title}</h3>
          <div className="summary-card-value">
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} />
            ) : (
              value
            )}
          </div>
          {change && (
            <div className={`summary-card-change ${changeType}`}>
              {changeType === 'positive' ? (
                <FiTrendingUp size={14} />
              ) : (
                <FiTrendingDown size={14} />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

