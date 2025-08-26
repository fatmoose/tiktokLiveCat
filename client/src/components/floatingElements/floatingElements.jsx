import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './floatingElements.css';

const FloatingElements = ({ likeData, onElementHit }) => {
    const [floatingHearts, setFloatingHearts] = useState([]);

    useEffect(() => {
        if (likeData && likeData.likeCount) {
            // Create multiple hearts for each like
            for (let i = 0; i < likeData.likeCount; i++) {
                createFloatingHeart(i * 200); // Stagger the hearts
            }
        }
    }, [likeData]);



    const createFloatingHeart = (delay = 0) => {
        const id = Date.now() + Math.random();
        const startSide = Math.random() < 0.5 ? 'left' : 'right';
        const startY = Math.random() * 60 + 20; // 20% to 80% from top
        
        // Get toothless element position
        const toothlessElement = document.getElementById('toothless-gif');
        let targetX = window.innerWidth / 2; // fallback to center
        let targetY = window.innerHeight / 2;
        
        if (toothlessElement) {
            const rect = toothlessElement.getBoundingClientRect();
            // Calculate target position relative to viewport
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
            
            // Account for the heart's starting position
            // Hearts start at startY% from top, so we need to calculate transform offset
            const heartStartY = (startY / 100) * window.innerHeight;
            const heartStartX = startSide === 'left' ? -50 : window.innerWidth + 50;
            
            // Calculate the transform needed to reach target from start position
            targetX = targetX - heartStartX;
            targetY = targetY - heartStartY;
            

        }
        
        const heart = {
            id,
            startSide,
            startY,
            delay,
            targetX,
            targetY,
            profilePicture: likeData.profilePicture,
            nickname: likeData.nickname,
            type: 'heart'
        };

        setFloatingHearts(prev => [...prev, heart]);

        // Remove heart after animation
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== id));
            onElementHit('heart');
        }, 3000 + delay);
    };

    // createFloatingFood function removed

    return (
        <div className="floating-elements-container">
            {/* Floating Hearts */}
            {floatingHearts.map((heart) => (
                <div
                    key={heart.id}
                    className={`floating-heart ${heart.startSide} dynamic-target`}
                    style={{
                        top: `${heart.startY}%`,
                        animationDelay: `${heart.delay}ms`,
                        '--target-x': `${heart.targetX}px`,
                        '--target-y': `${heart.targetY}px`,
                    }}
                >
                    <span className="heart-emoji">❤️</span>
                    {heart.profilePicture && (
                        <img 
                            src={heart.profilePicture} 
                            alt={heart.nickname || 'User'} 
                            className="heart-profile-pic"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    )}
                    {heart.nickname && (
                        <span className="heart-username">{heart.nickname}</span>
                    )}
                </div>
            ))}
        </div>
    );
};

FloatingElements.propTypes = {
    likeData: PropTypes.object,
    onElementHit: PropTypes.func.isRequired,
};

export default FloatingElements; 