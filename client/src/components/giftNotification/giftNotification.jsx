import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './giftNotification.css';

const GiftNotification = ({ gift, onAnimationComplete }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        if (gift) {
            setIsVisible(true);
            
            // Hide after animation completes
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => {
                    onAnimationComplete();
                }, 500); // Wait for fade out animation
            }, 3000); // Show for 3 seconds
            
            return () => clearTimeout(timer);
        }
    }, [gift, onAnimationComplete]);

    if (!gift) return null;

    return (
        <div className={`gift-notification ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="gift-notification-content">
                <div className="gift-header">
                    <div className="user-info">
                        {gift.user.profilePicture && (
                            <img 
                                src={gift.user.profilePicture} 
                                alt={gift.user.nickname}
                                className="gift-profile-pic"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        <div className="gift-user-details">
                            <div className="gift-nickname">{gift.user.nickname}</div>
                            <div className="gift-action">sent a gift!</div>
                        </div>
                    </div>
                    <div className="gift-celebration">🎉</div>
                </div>
                
                <div className="gift-details">
                    <div className="gift-item">
                        <div className="gift-icon">🎁</div>
                        <div className="gift-info">
                            <div className="gift-name">{gift.giftName}</div>
                            <div className="gift-count">x{gift.repeatCount}</div>
                        </div>
                    </div>
                    
                    {gift.diamondCount && (
                        <div className="gift-value">
                            <span className="diamond-icon">💎</span>
                            <span className="diamond-count">{gift.diamondCount * gift.repeatCount}</span>
                        </div>
                    )}
                    
                    {gift.coins && (
                        <div className="gift-coins">
                            <span className="coin-icon">🪙</span>
                            <span className="coin-count">+{gift.coins} Feed Points!</span>
                        </div>
                    )}
                </div>
                
                <div className="gift-thank-you">
                    Thank you for feeding Toothless! 🐉
                </div>
            </div>
            
            <div className="gift-particles">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className={`particle particle-${i}`}></div>
                ))}
            </div>
        </div>
    );
};

GiftNotification.propTypes = {
    gift: PropTypes.object,
    onAnimationComplete: PropTypes.func.isRequired,
};

export default GiftNotification; 