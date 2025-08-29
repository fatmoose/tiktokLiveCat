import './JoinInstructions.css';

function JoinInstructions({ raceState, racersCount, maxRacers, countdownTime, autoStartTimer, leaderboard }) {
  const isWaiting = raceState === 'waiting';
  
  return (
    <div className="join-instructions">
      <div className="instructions-content">
        {isWaiting ? (
          <>
            <h2 className="instructions-title">🏆 Top 8 Leaderboard Race 🏆</h2>
            <div className="race-info">
              <p className="info-text">The top 8 users from the leaderboard will compete!</p>
              <p className="info-subtext">Keep sending likes and gifts to climb the leaderboard!</p>
            </div>
            
            {leaderboard.length >= 3 && (
              <div className="auto-start-timer">
                <span className="timer-label">Next race starting in:</span>
                <span className="timer-value">{autoStartTimer}s</span>
              </div>
            )}
            
            {leaderboard.length < 3 && (
              <div className="min-users-notice">
                Need at least {3 - leaderboard.length} more {leaderboard.length === 2 ? 'user' : 'users'} in the leaderboard to start races!
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="instructions-title">🚦 Race Starting Soon! 🚦</h2>
            <div className="countdown-info">
              Starting in {Math.ceil(countdownTime / 1000)} seconds...
            </div>
          </>
        )}
        
        <div className="race-status">
          {raceState === 'countdown' && (
            <>
              <div className="status-item">
                <span className="status-label">Racers:</span>
                <span className="status-value">{racersCount}</span>
              </div>
              <div className="status-item">
                <span className="status-label">From Top:</span>
                <span className="status-value">8 Leaders</span>
              </div>
            </>
          )}
          {isWaiting && (
            <div className="status-item">
              <span className="status-label">Leaderboard Users:</span>
              <span className="status-value">{leaderboard.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinInstructions;
