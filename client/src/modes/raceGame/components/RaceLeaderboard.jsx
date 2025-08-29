import './RaceLeaderboard.css';

function RaceLeaderboard({ winners }) {
  if (winners.length === 0) return null;
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="race-leaderboard">
      <h3 className="leaderboard-title">🏆 Recent Winners 🏆</h3>
      <div className="winners-list">
        {winners.slice(0, 5).map((winner, index) => (
          <div key={`${winner.username}-${winner.timestamp}`} className="winner-entry">
            <div className="winner-rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </div>
            <div className="winner-info">
              <span className="winner-emoji-small">{winner.emoji}</span>
              <span className="winner-username">{winner.username}</span>
            </div>
            <div className="winner-time">{formatTime(winner.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RaceLeaderboard;
