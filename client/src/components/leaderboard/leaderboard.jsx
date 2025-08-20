import PropTypes from 'prop-types';
import './leaderboard.css';

const Leaderboard = ({ leaderboard }) => {
    // Format large numbers with K, M, B abbreviations
    const formatNumber = (num) => {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };
    return (
        <div className="leaderboard">
            <div className="leaderboard-header">
                <h2>🏆 Top 10 Feeders</h2>
            </div>
            
            <div className="leaderboard-content">
                <div className="leaderboard-list">
                    {leaderboard.slice(0, 10).map((user, index) => (
                            <div key={user.uniqueId} className={`leaderboard-item rank-${index + 1}`}>
                                <div className="rank-section">
                                    {index + 1 <= 3 ? (
                                        <span className={`medal medal-${index + 1}`}>
                                            {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : '🥉'}
                                        </span>
                                    ) : (
                                        <span className="rank-number">#{index + 1}</span>
                                    )}
                                </div>
                                
                                <div className="user-section">
                                    {user.profilePicture && (
                                        <img 
                                            src={user.profilePicture} 
                                            alt={user.nickname}
                                            className="profile-pic"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <div className="user-details">
                                        <div className="nickname">{user.nickname}</div>
                                        <div className="stats">
                                            <span className="likes">❤️ {formatNumber(user.likes)}</span>
                                            {user.gifts > 0 && (
                                                <span className="gifts">🎁 {formatNumber(user.gifts)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="score-section">
                                    <div className="score">
                                        {formatNumber(user.likes + user.totalValue * 10)}
                                    </div>
                                    <div className="score-label">points</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {leaderboard.length === 0 && (
                        <div className="empty-leaderboard">
                            <p>No feeders yet! Be the first to like! ❤️</p>
                        </div>
                    )}
                </div>
        </div>
    );
};

Leaderboard.propTypes = {
    leaderboard: PropTypes.array.isRequired,
};

export default Leaderboard; 