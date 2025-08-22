import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './dancingPodium.css';

const DancingPodium = ({ leaderboard }) => {
    const [displayedUsers, setDisplayedUsers] = useState([]);
    const [newUsers, setNewUsers] = useState(new Set());
    const prevTopThreeRef = useRef([]);
    
    // Get top 3 users
    const topThree = leaderboard.slice(0, 3);
    
    // Track position changes
    useEffect(() => {
        const prevTopThree = prevTopThreeRef.current;
        const newUserSet = new Set();
        
        const hasPositionChange = topThree.some((user, index) => {
            const prevUser = prevTopThree[index];
            const isNewPosition = !prevUser || prevUser.uniqueId !== user?.uniqueId;
            
            // Track if this user is new to the podium entirely
            if (user && isNewPosition && !prevTopThree.some(p => p?.uniqueId === user.uniqueId)) {
                newUserSet.add(user.uniqueId);
            }
            
            return isNewPosition;
        });
        
        // Only update if positions actually changed
        if (hasPositionChange || prevTopThree.length !== topThree.length) {
            setDisplayedUsers(topThree);
            setNewUsers(newUserSet);
            prevTopThreeRef.current = topThree;
            
            // Clear new users after animation
            setTimeout(() => {
                setNewUsers(new Set());
            }, 600);
        } else {
            // Update scores without re-rendering the whole component
            setDisplayedUsers(current => 
                current.map(user => {
                    const updated = topThree.find(u => u.uniqueId === user.uniqueId);
                    return updated || user;
                })
            );
        }
    }, [leaderboard]);
    
    // Format number display
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };
    
    // Calculate score
    const getScore = (user) => {
        return user.likes + (user.totalValue || 0) * 10;
    };
    
    if (displayedUsers.length === 0 && topThree.length === 0) {
        return (
            <div className="dancing-podium-container">
                <div className="empty-podium">
                    <div className="empty-message">
                        <span className="crown-icon">👑</span>
                        <p>Be the first to claim the podium!</p>
                        <p className="sub-message">Send gifts to get on stage! 🎁</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Reorder for podium display: [silver, gold, bronze]
    const podiumOrder = [
        displayedUsers[1], // Silver (2nd place)
        displayedUsers[0], // Gold (1st place)
        displayedUsers[2]  // Bronze (3rd place)
    ].filter(Boolean); // Remove undefined entries if less than 3 users
    
    return (
        <div className="dancing-podium-container">
            <div className="podium-title">
                <span className="title-sparkle">✨</span>
                <h3>Top Feeders Stage</h3>
                <span className="title-sparkle">✨</span>
            </div>
            
            <div className="podium-wrapper">
                {podiumOrder.map((user, index) => {
                    if (!user) return null;
                    
                    // Determine actual rank based on position
                    const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
                    const podiumClass = actualRank === 1 ? 'gold' : actualRank === 2 ? 'silver' : 'bronze';
                    const medal = actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉';
                    
                    const isNew = newUsers.has(user.uniqueId);
                    
                    return (
                        <div 
                            key={user.uniqueId}
                            className={`podium-spot ${podiumClass} rank-${actualRank} ${isNew ? 'entering' : ''}`}
                        >
                            <div className="dancer-container">
                                {/* Spotlight effect */}
                                <div className="spotlight"></div>
                                
                                {/* Dancing stick figure with user avatar head */}
                                <div className="dancing-figure">
                                    <div className="figure__head">
                                        {user.profilePicture ? (
                                            <img 
                                                src={user.profilePicture} 
                                                alt={user.nickname}
                                                className="figure__face"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="figure__face-fallback" 
                                            style={{ display: user.profilePicture ? 'none' : 'flex' }}
                                        >
                                            {user.nickname?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        
                                        {/* Medal badge */}
                                        <div className="medal-badge">{medal}</div>
                                        
                                        <div className="figure__right-arm">
                                            <div className="figure__right-lower-arm">
                                                <div className="figure__right-hand"></div>
                                            </div>
                                        </div>
                                        <div className="figure__left-arm">
                                            <div className="figure__left-lower-arm">
                                                <div className="figure__left-hand"></div>
                                            </div>
                                        </div>
                                        <div className="figure__upper-body">
                                            <div className="figure__lower-body">
                                                <div className="figure__right-thigh">
                                                    <div className="figure__right-lower-leg">
                                                        <div className="figure__right-foot"></div>
                                                    </div>
                                                </div>
                                                <div className="figure__left-thigh">
                                                    <div className="figure__left-lower-leg">
                                                        <div className="figure__left-foot"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Effects */}
                                    <div className="pulse-ring"></div>
                                    <div className="dance-floor-glow"></div>
                                    
                                    {/* Score burst effect */}
                                    <div className="score-burst">
                                        +{formatNumber(getScore(user))}
                                    </div>
                                </div>
                                
                                {/* Podium stand with integrated info */}
                                <div className={`podium-stand ${podiumClass}`}>
                                    <div className="podium-content">
                                        <div className="rank-badge">
                                            <span className="rank-number">{actualRank}</span>
                                        </div>
                                        
                                        <div className="user-info-section">
                                            <div className="username">{user.nickname}</div>
                                            <div className="score-display">
                                                <span className="score-number">{formatNumber(getScore(user))}</span>
                                                <span className="score-label">pts</span>
                                            </div>
                                            <div className="stats-grid">
                                                <div className="stat-item">
                                                    <span className="stat-icon">❤️</span>
                                                    <span className="stat-value">{formatNumber(user.likes)}</span>
                                                </div>
                                                {user.gifts > 0 && (
                                                    <div className="stat-item">
                                                        <span className="stat-icon">🎁</span>
                                                        <span className="stat-value">{formatNumber(user.gifts)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="podium-shine"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            

        </div>
    );
};

DancingPodium.propTypes = {
    leaderboard: PropTypes.array.isRequired,
};

export default DancingPodium;
