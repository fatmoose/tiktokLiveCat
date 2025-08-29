import { useState, useEffect } from 'react';
import './EveryoneLosesDisplay.css';

function EveryoneLosesDisplay({ username, onComplete }) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    setShowConfetti(true);
    
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="everyone-loses-overlay">
      <div className={`everyone-loses-display ${showConfetti ? 'show' : ''}`}>
        {/* Chaos effects */}
        <div className="chaos-background">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="chaos-particle" style={{ 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}>
              💀
            </div>
          ))}
        </div>
        
        {/* Main content */}
        <div className="loses-content">
          <h1 className="loses-title">
            <span className="skull">💀</span>
            EVERYBODY LOSES!
            <span className="skull">💀</span>
          </h1>
          
          <div className="loses-message">
            <p className="chaos-text">BRUH MOMENT DETECTED</p>
            <p className="username-text">
              <span className="highlight">@{username}</span>
            </p>
            <p className="action-text">
              just yeeted the 10th galaxy and 
              <span className="epic"> NUKED THE ENTIRE WHEEL</span>
            </p>
          </div>
          
          <div className="meme-section">
            <p className="meme-text">🎆 NO WINNERS 🎆</p>
            <p className="meme-text">🤡 ONLY CHAOS 🤡</p>
            <p className="meme-text">😂 GET REKT EVERYONE 😂</p>
          </div>
          
          <div className="galaxy-explosion">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="exploding-galaxy" style={{ 
                animationDelay: `${i * 0.1}s` 
              }}>
                🌌
              </span>
            ))}
          </div>
          
          <div className="bottom-text">
            <p>The wheel has been reset. Everyone's entries are gone.</p>
            <p className="troll-text">⚰️ RIP IN PEPPERONIS ⚰️</p>
          </div>
        </div>
        
        {/* Skip button */}
        <button 
          className="skip-button"
          onClick={onComplete}
        >
          Continue to emptiness →
        </button>
      </div>
    </div>
  );
}

export default EveryoneLosesDisplay;
