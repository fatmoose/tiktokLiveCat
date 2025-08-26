import { useEffect, useState, useRef } from 'react';
import './WinnerDisplay.css';

const WinnerDisplay = ({ winner, onComplete }) => {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState([]);
  const [shouldRender, setShouldRender] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const countdownIntervalRef = useRef(null);
  
  useEffect(() => {
    let hideTimer;
    let completeTimer;
    
    // Clear any existing countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    if (winner) {
      console.log('WinnerDisplay: Showing winner popup for', winner.username);
      // Show the component
      setShouldRender(true);
      setCountdown(20);
      // Small delay to ensure CSS transition works properly
      setTimeout(() => setShow(true), 10);
      
      // Create confetti particles
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          rotation: Math.random() * 360,
          color: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'][Math.floor(Math.random() * 5)],
          size: Math.random() * 10 + 5,
          delay: Math.random() * 0.5
        });
      }
      setParticles(newParticles);
      
      // Start countdown timer
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          console.log('Countdown tick:', prev - 1);
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Auto-hide after 20 seconds
      hideTimer = setTimeout(() => {
        console.log('WinnerDisplay: Starting hide animation after 20 seconds');
        setShow(false);
        
        // Wait for fade-out animation then complete
        completeTimer = setTimeout(() => {
          console.log('WinnerDisplay: Completing hide and calling onComplete');
          setShouldRender(false);
          setParticles([]);
          if (onComplete) {
            console.log('WinnerDisplay: Calling onComplete callback');
            onComplete();
          } else {
            console.warn('WinnerDisplay: No onComplete callback provided');
          }
        }, 500);
      }, 20000);
    } else {
      // If winner is null, immediately hide
      console.log('WinnerDisplay: Winner is null, hiding immediately');
      setShow(false);
      setShouldRender(false);
      setParticles([]);
    }
    
    // Cleanup function
    return () => {
      console.log('WinnerDisplay: Cleaning up timers');
      if (hideTimer) clearTimeout(hideTimer);
      if (completeTimer) clearTimeout(completeTimer);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [winner, onComplete]);
  
  if (!shouldRender) return null;
  
  const getTitle = () => {
    if (winner.source === 'gift') return '🎁 Gift Champion';
    if (winner.source === 'likes') return '❤️ Like Legend';
    return '🎡 Wheel Warrior';
  };
  
  return (
    <div className={`winner-display ${show ? 'show' : ''}`}>
      {/* Confetti Background */}
      <div className="confetti-container">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="confetti-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: `rotate(${particle.rotation}deg)`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>
      
      {/* Winner Card */}
      <div className="winner-card">
        <div className="winner-crown">👑</div>
        
        <h1 className="winner-text">WINNER!</h1>
        
        <div className="winner-info">
          {winner.profilePicture ? (
            <img 
              src={winner.profilePicture} 
              alt={winner.username}
              className="winner-avatar"
            />
          ) : (
            <div className="winner-avatar-placeholder">
              {winner.username.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h2 className="winner-username">@{winner.username}</h2>
          <p className="winner-title">{getTitle()}</p>
          <p className="winner-entries">{winner.totalEntries} entries</p>
        </div>
        
        <div className="winner-celebration">
          <span className="celebration-emoji">🎉</span>
          <span className="celebration-emoji">🎊</span>
          <span className="celebration-emoji">✨</span>
        </div>
        
        {/* Circular countdown timer */}
        <div 
          className="winner-countdown-timer"
          onClick={() => {
            console.log('WinnerDisplay: Manual close clicked');
            setShow(false);
            setTimeout(() => {
              setShouldRender(false);
              setParticles([]);
              if (onComplete) onComplete();
            }, 500);
          }}
          style={{ cursor: 'pointer' }}
        >
          <svg className="countdown-svg" viewBox="0 0 100 100">
            <circle
              className="countdown-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
            />
            <circle
              className="countdown-progress"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#ffd700"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - countdown / 20)}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="countdown-text">{countdown}</div>
        </div>
      </div>
      
      {/* Spotlight Effect */}
      <div className="spotlight"></div>
    </div>
  );
};

export default WinnerDisplay;
