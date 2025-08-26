import './EntryLeaderboard.css';

const EntryLeaderboard = ({ entries }) => {
  const getEmoji = (position) => {
    switch(position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🎯';
    }
  };
  
  const getEntryIcon = (user) => {
    if (user.gifts > user.likes) return '🎁';
    if (user.likes > 0) return '❤️';
    return '🎡';
  };
  
  return (
    <div className="entry-leaderboard">
      <div className="leaderboard-header">
        <h3>🏆 Top Players</h3>
        <p className="leaderboard-subtitle">Most wheel entries</p>
      </div>
      
      <div className="leaderboard-list">
        {entries.length === 0 ? (
          <div className="empty-leaderboard">
            <p>No entries yet!</p>
            <p className="hint">Send likes or gifts to join</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div 
              key={entry.username} 
              className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="rank">
                <span className="rank-emoji">{getEmoji(index)}</span>
                <span className="rank-number">#{index + 1}</span>
              </div>
              
              <div className="player-info">
                {entry.profilePicture ? (
                  <img 
                    src={entry.profilePicture} 
                    alt={entry.username}
                    className="player-avatar"
                  />
                ) : (
                  <div className="player-avatar-placeholder">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="player-name">@{entry.username}</span>
              </div>
              
              <div className="entry-stats">
                <span className="entry-count">{entry.entries}</span>
                <span className="entry-icon">{getEntryIcon(entry)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      {entries.length > 0 && (
        <div className="leaderboard-footer">
          <div className="total-stats">
            <span>Total Players: {entries.length}</span>
            <span>Total Entries: {entries.reduce((sum, e) => sum + e.entries, 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryLeaderboard;
