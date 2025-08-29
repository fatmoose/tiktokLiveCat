import './RaceCountdown.css';

function RaceCountdown({ timeLeft }) {
  const seconds = Math.ceil(timeLeft / 1000);
  const displayNumber = seconds <= 3 ? seconds : null;
  
  return (
    <div className="race-countdown">
      {displayNumber ? (
        <div className="countdown-number big-number">{displayNumber}</div>
      ) : (
        <div className="countdown-content">
          <div className="countdown-text">Race Starting In</div>
          <div className="countdown-number">{seconds}s</div>
          <div className="countdown-bar">
            <div 
              className="countdown-progress"
              style={{ width: `${(timeLeft / 20000) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default RaceCountdown;
