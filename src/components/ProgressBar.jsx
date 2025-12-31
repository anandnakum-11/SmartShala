const ProgressBar = ({ percentage, color = '#2563eb', animated = true }) => {
  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar"
        style={{
          width: `${percentage}%`,
          background: color,
          animation: animated ? 'progressBar 1s ease-out' : 'none'
        }}
      />
    </div>
  );
};

export default ProgressBar;




