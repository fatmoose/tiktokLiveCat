import { useState, useEffect } from 'react';
import './GalaxyProgress.css';

function GalaxyProgress({ galaxyCount = 0, maxGalaxies = 10, onMaxReached }) {
  const [showAnimation, setShowAnimation] = useState(false);
  const percentage = Math.min((galaxyCount / maxGalaxies) * 100, 100);
  
  useEffect(() => {
    if (galaxyCount >= maxGalaxies && onMaxReached) {
      setShowAnimation(true);
      setTimeout(() => {
        onMaxReached();
        setShowAnimation(false);
      }, 500);
    }
  }, [galaxyCount, maxGalaxies, onMaxReached]);
  
  return (
    <div className={`galaxy-progress ${showAnimation ? 'max-reached' : ''}`}>
      <div className="galaxy-header">
        <h3>🌌 GALAXY CHAOS METER 🌌</h3>
        <p className="galaxy-subtitle">
          {galaxyCount < maxGalaxies 
            ? `${galaxyCount}/${maxGalaxies} galaxies to total annihilation`
            : 'UNIVERSE IMPLODING!'
          }
        </p>
      </div>
      
      <div className="progress-container">
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          >
            <div className="progress-glow" />
            {galaxyCount >= maxGalaxies * 0.7 && (
              <div className="fire-effect">
                <div className="flame flame-1"></div>
                <div className="flame flame-2"></div>
                <div className="flame flame-3"></div>
              </div>
            )}
          </div>
          
          {/* Progress labels */}
          <div className="progress-labels">
            <span className="progress-label">0</span>
            <span className="progress-label">{Math.floor(maxGalaxies / 2)}</span>
            <span className="progress-label">{maxGalaxies}</span>
          </div>
        </div>
        
        {/* Galaxy count display */}
        <div className="galaxy-count-display">
          <span className="count-number">{galaxyCount}</span>
          <span className="count-separator">/</span>
          <span className="count-total">{maxGalaxies}</span>
          <span className="galaxy-emoji">🌌</span>
        </div>
      </div>
      
      <div className="galaxy-warning">
        {galaxyCount === 0 && (
          <p className="warning-text">Gifting galaxies fills this meter...</p>
        )}
        {galaxyCount > 0 && galaxyCount < maxGalaxies * 0.5 && (
          <p className="warning-text mild">The cosmos trembles...</p>
        )}
        {galaxyCount >= maxGalaxies * 0.5 && galaxyCount < maxGalaxies * 0.8 && (
          <p className="warning-text moderate">Reality is bending! 😰</p>
        )}
        {galaxyCount >= maxGalaxies * 0.8 && galaxyCount < maxGalaxies && (
          <p className="warning-text severe">THE END IS NEAR! 💀</p>
        )}
        {galaxyCount >= maxGalaxies && (
          <p className="warning-text critical">EVERYONE LOSES! 🎆💥</p>
        )}
      </div>
    </div>
  );
}

export default GalaxyProgress;
