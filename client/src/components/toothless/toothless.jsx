import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import toothlessGif from '../../assets/toothless.gif';
import { useGame } from '../../gameContext.jsx';
import DancingPodium from '../dancingPodium/dancingPodium';
import './toothless.css';

const Toothless = ({ activityLevel = 0, onElementHit, leaderboard = [] }) => {
    const [animationClass, setAnimationClass] = useState('calm');
    const [isFeeding, setIsFeeding] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);

    const [hitEffect, setHitEffect] = useState('');
    const { state } = useGame();

    useEffect(() => {
        // Update animation based on activity level
        if (activityLevel > 500) {
            setAnimationClass('legendary-dance');
        } else if (activityLevel > 200) {
            setAnimationClass('super-active-dance');
        } else if (activityLevel > 100) {
            setAnimationClass('very-active-dance');
        } else if (activityLevel > 50) {
            setAnimationClass('active-dance');
        } else if (activityLevel > 10) {
            setAnimationClass('gentle-sway');
        } else {
            setAnimationClass('calm');
        }

        // Show feeding animation when activity increases
        if (activityLevel > 0) {
            setIsFeeding(true);
            const timer = setTimeout(() => setIsFeeding(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [activityLevel]);

    useEffect(() => {
        if (onElementHit) {
            // Create the hit effect function and pass it to parent
            const handleHit = (type) => {
                if (type === 'heart') {
                    // Heart hit: gentle glow
                    setIsGlowing(true);
                    setHitEffect('heart-hit');
                    
                    setTimeout(() => {
                        setIsGlowing(false);
                        setHitEffect('');
                    }, 800);
                } else if (type === 'food') {
                    // Food hit: intense glow
                    setIsGlowing(true);
                    setHitEffect('food-hit');
                    
                    setTimeout(() => {
                        setIsGlowing(false);
                        setHitEffect('');
                    }, 1500);
                }
            };
            
            // Pass the handler to parent
            onElementHit(handleHit);
        }
    }, [onElementHit]);

    const getSizeClass = () => {
        if (activityLevel > 300) return 'size-huge';
        if (activityLevel > 150) return 'size-large';
        if (activityLevel > 75) return 'size-medium';
        return 'size-normal';
    };

    const getToothlessClasses = () => {
        let classes = `toothless-dragon ${isFeeding ? 'feeding' : ''}`;
        
        if (isGlowing) classes += ' glowing';
        if (hitEffect) classes += ` ${hitEffect}`;
        
        return classes;
    };



    return (
        <div className="toothless-and-podium-container">
            <div className={`toothless-container ${animationClass} ${getSizeClass()}`}>
                <div className="toothless-wrapper">
                    <img 
                        src={toothlessGif} 
                        alt="Toothless" 
                        id='toothless-gif'
                        className={getToothlessClasses()}
                    />
                    
                    {/* Activity indicators */}
                    {activityLevel > 50 && (
                        <div className="activity-indicators">
                            {[...Array(Math.min(Math.floor(activityLevel / 25), 8))].map((_, i) => (
                                <div
                                    key={i}
                                    className="activity-sparkle"
                                    style={{
                                        animationDelay: `${i * 0.2}s`,
                                        left: `${20 + (i % 4) * 20}%`,
                                        top: `${20 + Math.floor(i / 4) * 40}%`,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    
                    {/* Hit effects */}
                    {isGlowing && (
                        <div className={`hit-glow ${hitEffect}`}></div>
                    )}
                </div>
            </div>
            
            {/* Dancing Podium underneath Toothless */}
            <DancingPodium leaderboard={leaderboard} />
        </div>
    );
};

Toothless.propTypes = {
    activityLevel: PropTypes.number,
    onElementHit: PropTypes.func,
    leaderboard: PropTypes.array,
};

export default Toothless;
