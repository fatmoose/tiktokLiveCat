import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import './RaceWinner.css';

function RaceWinner({ winner }) {
  useEffect(() => {
    // Fire confetti when winner is announced
    const fireConfetti = () => {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Fire from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1']
        });
        
        // Fire from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1']
        });
      }, 250);
    };

    fireConfetti();
  }, []);

  return (
    <div className="race-winner">
      <div className="winner-content">
        <div className="winner-crown">👑</div>
        <h1 className="winner-title">WINNER!</h1>
        <div className="winner-racer">
          <div className="winner-emoji">{winner.emoji}</div>
          <div className="winner-name">{winner.username}</div>
        </div>
        <div className="winner-effects">
          <span className="star">⭐</span>
          <span className="star">🌟</span>
          <span className="star">✨</span>
          <span className="trophy">🏆</span>
          <span className="star">✨</span>
          <span className="star">🌟</span>
          <span className="star">⭐</span>
        </div>
      </div>
    </div>
  );
}

export default RaceWinner;
