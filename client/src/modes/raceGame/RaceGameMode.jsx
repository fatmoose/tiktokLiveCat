import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../gameContext.jsx';
import DynamicBackground from '../../components/dynamicBackground/dynamicBackground';
import GiftNotification from '../../components/giftNotification/giftNotification';
import RaceTrack from './components/RaceTrack';
import RaceCountdown from './components/RaceCountdown';
import RaceWinner from './components/RaceWinner';
import RaceLeaderboard from './components/RaceLeaderboard';
import JoinInstructions from './components/JoinInstructions';
import './RaceGameMode.css';

// Race configuration
const RACE_CONFIG = {
  MIN_RACERS: 3,
  MAX_RACERS: 8,
  WAIT_TIME: 10000, // 10 seconds countdown
  RACE_DURATION: 10000, // 10 seconds average
  COOLDOWN_TIME: 10000, // 10 seconds between races
  AUTO_START_TIME: 30 // 30 seconds auto-start
};

// Racer emojis pool
const RACER_EMOJIS = ['🐎', '🦄', '🐕', '🐈', '🦁', '🐅', '🦊', '🐺', '🦝', '🐇', '🦘', '🦓'];

function RaceGameMode({ socket, isConnected, connectionState, connectedUsername, demoMode }) {
  const { state: gameState } = useGame();
  const [raceState, setRaceState] = useState('waiting'); // waiting, countdown, racing, celebrating, cooldown
  const [racers, setRacers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [pastWinners, setPastWinners] = useState([]);
  const [countdownTime, setCountdownTime] = useState(0);
  const [raceProgress, setRaceProgress] = useState({});
  const [giftNotifications, setGiftNotifications] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [autoStartTimer, setAutoStartTimer] = useState(RACE_CONFIG.AUTO_START_TIME);
  
  const countdownTimerRef = useRef(null);
  const raceStartTimerRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const raceAnimationRef = useRef(null);
  const autoStartIntervalRef = useRef(null);

  // Start race countdown
  const startCountdown = useCallback(() => {
    setRaceState('countdown');
    setCountdownTime(RACE_CONFIG.WAIT_TIME);
    setAutoStartTimer(30); // Reset auto-start timer
    
    // Clear auto-start timer
    if (autoStartIntervalRef.current) {
      clearInterval(autoStartIntervalRef.current);
    }
    
    countdownTimerRef.current = setInterval(() => {
      setCountdownTime(prev => {
        if (prev <= 1000) {
          clearInterval(countdownTimerRef.current);
          startRace();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  }, []);

  // Populate racers from leaderboard
  const populateRacersFromLeaderboard = useCallback(() => {
    if (raceState !== 'waiting') return;
    
    // Get top 8 users from leaderboard
    const topUsers = leaderboard.slice(0, 8);
    
    if (topUsers.length < 3) {
      // Not enough users in leaderboard
      return;
    }
    
    const newRacers = topUsers.map((user, index) => ({
      username: user.nickname || user.uniqueId,
      emoji: RACER_EMOJIS[index % RACER_EMOJIS.length],
      score: user.likes + (user.totalValue || 0) * 10,
      profilePicture: user.profilePictureUrl || user.profilePicture,
      joinTime: Date.now(),
      position: 0
    }));
    
    setRacers(newRacers);
    startCountdown();
  }, [leaderboard, raceState, startCountdown]);

  // Start the race
  const startRace = useCallback(() => {
    if (racers.length < RACE_CONFIG.MIN_RACERS && !demoMode) {
      // Not enough racers, go back to waiting
      setRaceState('waiting');
      return;
    }
    
    setRaceState('racing');
    setWinner(null);
    
    // Initialize progress
    const initialProgress = {};
    racers.forEach(racer => {
      initialProgress[racer.username] = 0;
    });
    setRaceProgress(initialProgress);
    
    // Animate race
    let raceFinished = false;
    const animateRace = () => {
      if (raceFinished) return;
      
      setRaceProgress(prev => {
        const newProgress = { ...prev };
        let hasWinner = false;
        
        Object.keys(newProgress).forEach(username => {
          if (newProgress[username] < 100) {
            // Random speed with slight variations
            const baseSpeed = Math.random() * 3 + 1;
            const burst = Math.random() < 0.1 ? 5 : 0; // 10% chance of speed burst
            newProgress[username] = Math.min(100, newProgress[username] + baseSpeed + burst);
            
            if (newProgress[username] >= 100 && !hasWinner) {
              hasWinner = true;
              raceFinished = true;
              declareWinner(username);
            }
          }
        });
        
        return newProgress;
      });
      
      if (!raceFinished) {
        raceAnimationRef.current = requestAnimationFrame(animateRace);
      }
    };
    
    raceAnimationRef.current = requestAnimationFrame(animateRace);
  }, [racers, demoMode]);

  // Declare winner
  const declareWinner = useCallback((username) => {
    const winnerRacer = racers.find(r => r.username === username);
    setWinner(winnerRacer);
    setRaceState('celebrating');
    
    // Add to past winners
    setPastWinners(prev => [{
      ...winnerRacer,
      timestamp: Date.now()
    }, ...prev].slice(0, 10)); // Keep last 10 winners
    
    // Emit winner event
    if (socket && isConnected) {
      socket.emit('race:winner', {
        username,
        racers: racers.length
      });
    }
    
    // Start cooldown after celebration
    setTimeout(() => {
      setRaceState('cooldown');
      setCountdownTime(RACE_CONFIG.COOLDOWN_TIME);
      
      cooldownTimerRef.current = setInterval(() => {
        setCountdownTime(prev => {
          if (prev <= 1000) {
            clearInterval(cooldownTimerRef.current);
            resetRace();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, 5000); // 5 seconds celebration
  }, [racers, socket, isConnected]);

  // Reset race
  const resetRace = useCallback(() => {
    setRaceState('waiting');
    setRacers([]);
    setRaceProgress({});
    setWinner(null);
    setCountdownTime(0);
    
    // Clear any running timers
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    if (raceAnimationRef.current) cancelAnimationFrame(raceAnimationRef.current);
  }, []);

  // Set mode on connection
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('setMode', 'racing-game');
    }
  }, [socket, isConnected]);

  // Handle leaderboard updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleLeaderboardUpdate = (data) => {
      setLeaderboard(data);
    };

    socket.on('leaderboardUpdate', handleLeaderboardUpdate);

    return () => {
      socket.off('leaderboardUpdate', handleLeaderboardUpdate);
    };
  }, [socket, isConnected]);

  // Auto-start timer when waiting
  useEffect(() => {
    if (raceState === 'waiting' && leaderboard.length >= 3) {
      // Start auto-start countdown
      autoStartIntervalRef.current = setInterval(() => {
        setAutoStartTimer(prev => {
          if (prev <= 1) {
            clearInterval(autoStartIntervalRef.current);
            populateRacersFromLeaderboard();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear timer if not waiting or not enough users
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
        setAutoStartTimer(30);
      }
    }

    return () => {
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
      }
    };
  }, [raceState, leaderboard, populateRacersFromLeaderboard]);

  // Demo mode - generate fake leaderboard
  useEffect(() => {
    if (demoMode && leaderboard.length === 0) {
      const demoUsers = [
        { nickname: 'SpeedyGonzales', likes: 1500, totalValue: 250, profilePictureUrl: null },
        { nickname: 'RacingChamp', likes: 1200, totalValue: 180, profilePictureUrl: null },
        { nickname: 'FastAndFurious', likes: 800, totalValue: 320, profilePictureUrl: null },
        { nickname: 'TurboBoost', likes: 2000, totalValue: 50, profilePictureUrl: null },
        { nickname: 'LightningBolt', likes: 500, totalValue: 400, profilePictureUrl: null },
        { nickname: 'QuickSilver', likes: 1800, totalValue: 120, profilePictureUrl: null },
        { nickname: 'ZoomZoom', likes: 600, totalValue: 280, profilePictureUrl: null },
        { nickname: 'FlashRunner', likes: 1100, totalValue: 150, profilePictureUrl: null },
        { nickname: 'NeedForSpeed', likes: 900, totalValue: 200, profilePictureUrl: null },
        { nickname: 'DashMaster', likes: 1300, totalValue: 100, profilePictureUrl: null }
      ];
      setLeaderboard(demoUsers);
    }
  }, [demoMode, leaderboard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (raceAnimationRef.current) cancelAnimationFrame(raceAnimationRef.current);
    };
  }, []);

  return (
    <div className="race-game-mode">
      <DynamicBackground />
      
      <div className="race-container">
        {/* Header */}
        <div className="race-header">
          <h1 className="race-title">🏁 Emoji Race 🏁</h1>
          {!isConnected && (
            <div className="connection-warning">
              {demoMode ? '🎮 Demo Mode' : '⚠️ Not Connected to TikTok'}
            </div>
          )}
        </div>

        {/* Join Instructions */}
        {(raceState === 'waiting' || raceState === 'countdown') && (
          <JoinInstructions 
            raceState={raceState}
            racersCount={racers.length}
            maxRacers={RACE_CONFIG.MAX_RACERS}
            countdownTime={countdownTime}
            autoStartTimer={autoStartTimer}
            leaderboard={leaderboard}
          />
        )}

        {/* Race Track */}
        <RaceTrack 
          racers={racers}
          raceProgress={raceProgress}
          raceState={raceState}
        />

        {/* Race Countdown */}
        {raceState === 'countdown' && (
          <RaceCountdown timeLeft={countdownTime} />
        )}

        {/* Winner Display */}
        {raceState === 'celebrating' && winner && (
          <RaceWinner winner={winner} />
        )}

        {/* Cooldown Timer */}
        {raceState === 'cooldown' && (
          <div className="cooldown-display">
            <h2>Next Race Starting In...</h2>
            <div className="cooldown-timer">{Math.ceil(countdownTime / 1000)}s</div>
          </div>
        )}

        {/* Leaderboard */}
        <RaceLeaderboard winners={pastWinners} />
      </div>

      {/* Gift Notifications */}
      <div className="gift-notifications">
        {giftNotifications.slice(-5).map(notif => (
          <GiftNotification
            key={notif.id}
            username={notif.username}
            giftName={notif.giftName}
            message={notif.message}
            onComplete={() => {
              setGiftNotifications(prev => prev.filter(n => n.id !== notif.id));
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default RaceGameMode;
