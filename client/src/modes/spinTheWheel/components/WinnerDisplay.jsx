import { useEffect, useState, useRef } from 'react';
import './WinnerDisplay.css';

// Simple cat image placeholder - removed random-cat-img dependency
const getRandomCat = () => {
  // Using larger placekitten images that are more likely to load
  const width = 400 + Math.floor(Math.random() * 10); // 400-409
  const height = 300 + Math.floor(Math.random() * 10); // 300-309
  
  return Promise.resolve({
    success: true,
    message: `https://placekitten.com/${width}/${height}`
  });
};

const WinnerDisplay = ({ winner, onComplete, socket }) => {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState([]);
  const [shouldRender, setShouldRender] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const countdownIntervalRef = useRef(null);
  const [catImageUrl, setCatImageUrl] = useState('');
  const [memeyText, setMemeyText] = useState('');
  const [liveComments, setLiveComments] = useState([]);
  const [latestComment, setLatestComment] = useState('');
  
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
  
  // Generate random cat image and memey text when winner changes
  useEffect(() => {
    if (winner) {
      // Generate cat image
      getRandomCat().then(data => {
        console.log('Cat image data:', data);
        if (data.success) {
          setCatImageUrl(data.message);
          console.log('Cat image URL set to:', data.message);
        }
      }).catch(error => {
        console.error('Failed to fetch cat image:', error);
        // Fallback to a guaranteed working image
        setCatImageUrl('https://placekitten.com/400/300');
      });
      
      // Generate memey text
      const memeyAdjectives = [
        'absolutely legendary', 'mind-blowingly epic', 'impossibly cool', 'ridiculously awesome',
        'super duper amazing', 'incredibly based', 'monumentally poggers', 'supremely goated',
        'extremely sigma', 'unbelievably cracked', 'totally fire', 'massively W', 'genuinely iconic'
      ];
      
      const memeyVerbs = [
        'slaying the game', 'absolutely crushing it', 'dominating the vibes', 'winning at life',
        'being a total legend', 'serving main character energy', 'hitting different',
        'living their best life', 'being an absolute unit', 'touching grass professionally',
        'manifesting success', 'being the moment', 'understanding the assignment'
      ];
      
      const randomAdjective = memeyAdjectives[Math.floor(Math.random() * memeyAdjectives.length)];
      const randomVerb = memeyVerbs[Math.floor(Math.random() * memeyVerbs.length)];
      
      setMemeyText(`${winner.username} is ${randomAdjective} and really good at ${randomVerb}`);
      console.log('Memey text set to:', `${winner.username} is ${randomAdjective} and really good at ${randomVerb}`);
    }
  }, [winner]);
  
  // Listen for comments from the specific winner
  useEffect(() => {
    if (!socket || !winner) return;
    
    const handleComment = (data) => {
      // Only show comments from the current winner
      if (data.uniqueId === winner.username || data.nickname === winner.username) {
        setLatestComment(data.comment);
        setLiveComments(prev => [{
          id: Date.now(),
          comment: data.comment,
          timestamp: Date.now()
        }, ...prev.slice(0, 4)]); // Keep last 5 comments
      }
    };
    
    socket.on('comment', handleComment);
    
    return () => {
      socket.off('comment', handleComment);
    };
  }, [socket, winner]);
  
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
        
        {/* Follow Call-to-Action */}
        <div className="follow-cta">
          <div className="follow-arrow">👆</div>
          <h3 className="follow-text">FOLLOW THIS PERSON</h3>
          <h4 className="follow-subtext">BECAUSE THEY WON!</h4>
        </div>
        
        {/* Live Comments Section */}
        <div className="live-comments-section">
          <h4 className="comments-title">💬 Live from the Winner:</h4>
          <div className="latest-comment">
            {latestComment ? (
              <p className="comment-text">"{latestComment}"</p>
            ) : (
              <p className="comment-placeholder">Waiting for their next comment...</p>
            )}
          </div>
        </div>
        
        {/* Cat Image with Memey Text */}
        <div className="cat-section">
          <div className="cat-container">
            <div className="memey-text-top">
              {memeyText ? memeyText.split(' and really good at ')[0] : `${winner.username} is amazing`}
            </div>
            {catImageUrl ? (
              <img 
                src={catImageUrl} 
                alt="Random celebration cat" 
                className="celebration-cat"
                onError={(e) => {
                  console.error('Cat image failed to load:', catImageUrl);
                  e.target.src = 'https://placekitten.com/400/300'; // Fallback
                }}
              />
            ) : (
              <div className="cat-placeholder">
                <span>🐱</span>
                <p>Loading cat...</p>
              </div>
            )}
            <div className="memey-text-bottom">
              {memeyText ? `and really good at ${memeyText.split(' and really good at ')[1]}` : 'and really good at winning!'}
            </div>
          </div>
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
