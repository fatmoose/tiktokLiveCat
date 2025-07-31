import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './leaderboard.css';

const Leaderboard = ({ leaderboard }) => {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <div className={`leaderboard ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="leaderboard-header">
                <h2>🏆 Top 12 Feeders</h2>
                <button 
                    className="toggle-btn"
                    onClick={() => setIsVisible(!isVisible)}
                >
                    {isVisible ? '−' : '+'}
                </button>
            </div>
            
            {isVisible && (
                <div className="leaderboard-content">
                    <div className="leaderboard-list">
                        {leaderboard.slice(0, 12).map((user, index) => (
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
                                            <span className="likes">❤️ {user.likes}</span>
                                            {user.gifts > 0 && (
                                                <span className="gifts">🎁 {user.gifts}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="score-section">
                                    <div className="score">
                                        {user.likes + user.totalValue * 10}
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
            )}
        </div>
    );
};

Leaderboard.propTypes = {
    leaderboard: PropTypes.array.isRequired,
};

export default Leaderboard; 