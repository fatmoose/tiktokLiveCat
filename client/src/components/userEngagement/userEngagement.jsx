import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './userEngagement.css';

const UserEngagement = ({ totalLikes, totalGifts, isConnected }) => {
    const [currentTip, setCurrentTip] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const tips = [
        {
            icon: "❤️",
            title: "Give Likes!",
            description: "Tap the heart to feed Toothless and climb the leaderboard!",
            action: "Like = 1 Feed Point"
        },
        {
            icon: "🎁",
            title: "Send Gifts!",
            description: "Send gifts for massive feeding power and special effects!",
            action: "Higher Value Gifts = More Feed Points!"
        },
        {
            icon: "🏆",
            title: "Climb the Leaderboard!",
            description: "Be one of the top 20 feeders and earn eternal glory!",
            action: "Compete for the crown!"
        },
        {
            icon: "💫",
            title: "Create Magic!",
            description: "More activity = more spectacular background effects!",
            action: "Keep the party going!"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % tips.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [tips.length]);

    const getEngagementLevel = () => {
        const total = totalLikes + (totalGifts * 10);
        if (total > 500) return "legendary";
        if (total > 200) return "epic";
        if (total > 100) return "great";
        if (total > 50) return "good";
        return "getting-started";
    };

    const getEngagementMessage = () => {
        const level = getEngagementLevel();
        const messages = {
            "getting-started": "Let's start feeding Toothless! 🐉",
            "good": "Great start! Keep the likes coming! 🔥",
            "great": "Amazing! The party is heating up! 🎉",
            "epic": "EPIC! Toothless is dancing with joy! 💃",
            "legendary": "LEGENDARY! You're a feeding master! 👑"
        };
        return messages[level];
    };

    if (!isConnected) {
        return (
            <div className="user-engagement disconnected">
                <div className="engagement-content">
                    <div className="connection-prompt">
                        <div className="connection-icon">🔗</div>
                        <h3>Connect to TikTok Live!</h3>
                        <p>Enter a TikTok username to start the feeding frenzy!</p>
                        <div className="connection-steps">
                            <div className="step">1. Click "Connect" button</div>
                            <div className="step">2. Enter @username</div>
                            <div className="step">3. Start feeding Toothless!</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`user-engagement ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="engagement-header">
                <div className="engagement-stats">
                    <div className="stat">
                        <span className="stat-icon">❤️</span>
                        <span className="stat-value">{totalLikes}</span>
                        <span className="stat-label">Likes</span>
                    </div>
                    <div className="stat">
                        <span className="stat-icon">🎁</span>
                        <span className="stat-value">{totalGifts}</span>
                        <span className="stat-label">Gifts</span>
                    </div>
                </div>
                
                <button 
                    className="toggle-engagement"
                    onClick={() => setIsVisible(!isVisible)}
                    title={isVisible ? "Hide instructions" : "Show instructions"}
                >
                    {isVisible ? '−' : '📋'}
                </button>
            </div>

            {isVisible && (
                <div className="engagement-content">
                    <div className="engagement-message">
                        <div className={`message-indicator ${getEngagementLevel()}`}></div>
                        <span>{getEngagementMessage()}</span>
                    </div>

                    <div className="tips-carousel">
                        <div className="tip active">
                            <div className="tip-icon">{tips[currentTip].icon}</div>
                            <div className="tip-content">
                                <h4>{tips[currentTip].title}</h4>
                                <p>{tips[currentTip].description}</p>
                                <div className="tip-action">{tips[currentTip].action}</div>
                            </div>
                        </div>
                    </div>

                    <div className="engagement-indicators">
                        {tips.map((_, index) => (
                            <div
                                key={index}
                                className={`indicator ${index === currentTip ? 'active' : ''}`}
                                onClick={() => setCurrentTip(index)}
                            />
                        ))}
                    </div>

                    <div className="engagement-footer">
                        <div className="participation-call">
                            <span className="pulse-dot"></span>
                            <span>Join the TikTok Live and start feeding!</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

UserEngagement.propTypes = {
    totalLikes: PropTypes.number,
    totalGifts: PropTypes.number,
    isConnected: PropTypes.bool,
};

UserEngagement.defaultProps = {
    totalLikes: 0,
    totalGifts: 0,
    isConnected: false,
};

export default UserEngagement; 