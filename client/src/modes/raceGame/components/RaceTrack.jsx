import { useEffect, useRef } from 'react';
import './RaceTrack.css';

function RaceTrack({ racers, raceProgress, raceState }) {
  const trackRef = useRef(null);

  useEffect(() => {
    // Add entrance animation when racers join
    if (trackRef.current) {
      const lanes = trackRef.current.querySelectorAll('.race-lane');
      lanes.forEach((lane, index) => {
        lane.style.animationDelay = `${index * 0.1}s`;
      });
    }
  }, [racers.length]);

  return (
    <div className="race-track" ref={trackRef}>
      <div className="track-background">
        {/* Start Line */}
        <div className="start-line">
          <div className="line-marker">START</div>
        </div>
        
        {/* Finish Line */}
        <div className="finish-line">
          <div className="line-marker">FINISH</div>
          <div className="checkered-flag">🏁</div>
        </div>

        {/* Track Lines */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="track-divider" style={{ top: `${(i + 1) * 12.5}%` }} />
        ))}
      </div>

      {/* Racing Lanes */}
      <div className="racing-lanes">
        {racers.map((racer, index) => {
          const progress = raceProgress[racer.username] || 0;
          const isWinner = raceState === 'celebrating' && progress >= 100;
          
          return (
            <div key={racer.username} className={`race-lane ${isWinner ? 'winner' : ''}`}>
              <div 
                className={`racer ${raceState === 'racing' ? 'racing' : ''}`}
                style={{ 
                  left: `${progress}%`,
                  transform: `translateX(-50%) ${raceState === 'racing' ? 'rotate(-10deg)' : 'rotate(0)'}`
                }}
              >
                <div className="racer-rank">#{index + 1}</div>
                <div className="racer-emoji">{racer.emoji}</div>
                <div className="racer-info">
                  <div className="racer-name">{racer.username}</div>
                  {racer.score && (
                    <div className="racer-score">{racer.score.toLocaleString()} pts</div>
                  )}
                </div>
              </div>
              
              {/* Speed particles */}
              {raceState === 'racing' && progress > 10 && (
                <div 
                  className="speed-particles"
                  style={{ left: `${progress - 5}%` }}
                >
                  <span>💨</span>
                  <span>✨</span>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Empty lanes */}
        {[...Array(Math.max(0, 8 - racers.length))].map((_, i) => (
          <div key={`empty-${i}`} className="race-lane empty">
            <div className="empty-slot">
              <span>Empty Slot</span>
              <span className="join-hint">Send gift to join!</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RaceTrack;
