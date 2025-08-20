import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './counter.css';

const Counter = ({ data, totalLikes, totalGifts, activityLevel }) => {
    const [displayLikes, setDisplayLikes] = useState(0);
    const [displayGifts, setDisplayGifts] = useState(0);

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

    // Animate the counters
    useEffect(() => {
        const animateCounter = (target, setter, current) => {
            if (current !== target) {
                const diff = target - current;
                const step = Math.max(1, Math.ceil(Math.abs(diff) / 10));
                const nextValue = current + (diff > 0 ? step : -step);
                
                setTimeout(() => {
                    setter(Math.max(0, nextValue));
                }, 50);
            }
        };

        animateCounter(totalLikes, setDisplayLikes, displayLikes);
        animateCounter(totalGifts, setDisplayGifts, displayGifts);
    }, [totalLikes, totalGifts, displayLikes, displayGifts]);

    return (
        <div className="container">
            <div className="stats-display">
                <div className="stat-item">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-details">
                        <div className="stat-value">{formatNumber(displayLikes)}</div>
                        <div className="stat-label">TOTAL<br/>LIKES</div>
                    </div>
                </div>
                
                <div className="stat-item">
                    <div className="stat-icon">🎁</div>
                    <div className="stat-details">
                        <div className="stat-value">{formatNumber(displayGifts)}</div>
                        <div className="stat-label">TOTAL<br/>GIFTS</div>
                    </div>
                </div>
                

            </div>



            {/* Recent activity indicator */}
            {data && data.likeCount && (
                <div className="recent-activity">
                    <div className="activity-burst">
                        +{data.likeCount} ❤️
                    </div>
                    {data.user && (
                        <div className="activity-user">
                            from {data.user.nickname}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

Counter.propTypes = {
    data: PropTypes.object,
    totalLikes: PropTypes.number,
    totalGifts: PropTypes.number,
    activityLevel: PropTypes.number,
};

Counter.defaultProps = {
    totalLikes: 0,
    totalGifts: 0,
    activityLevel: 0,
};

export default Counter;
