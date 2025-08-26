import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../gameContext.jsx';
import DynamicBackground from '../../components/dynamicBackground/dynamicBackground';
import GiftNotification from '../../components/giftNotification/giftNotification';
import SpinningWheel from './components/SpinningWheel';
import WinnerDisplay from './components/WinnerDisplay';
import EntryLeaderboard from './components/EntryLeaderboard';
import AdminControls from './components/AdminControls';
import EntryNotifications from './components/EntryNotifications';
import './SpinTheWheelMode.css';

// Gift value multipliers based on TikTok gift values
// This is a simplified list - for unknown gifts we'll use diamond count
const GIFT_MULTIPLIERS = {
  'Rose': 1,
  'Ice Cream Cone': 1,
  'TikTok': 1,
  'Heart': 1,
  'GG': 1,
  'Finger Heart': 5,
  'Perfume': 20,
  'Disco Ball': 30,
  'Galaxy': 100,
  'Lion': 290,
  'Sports Car': 300,
  'Whale Diving': 500,
  'TikTok Universe': 1000
};

function SpinTheWheelMode({ socket, isConnected, connectionState, connectedUsername, demoMode }) {
  const { state: gameState } = useGame();
  
  // Wheel state
  const [wheelEntries, setWheelEntries] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [spinCountdown, setSpinCountdown] = useState(120); // 2 minutes default
  const [lastSpinTime, setLastSpinTime] = useState(Date.now());
  const [showingWinner, setShowingWinner] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState({
    spinInterval: 120, // seconds
    likesPerEntry: 100,
    clearAfterSpins: 3,
    enableLikes: true,
    enableGifts: true,
    enableFollows: false
  });
  
  // Stats
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  const [activityLevel, setActivityLevel] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [recentWinners, setRecentWinners] = useState([]);
  
  // Notifications
  const [entryNotifications, setEntryNotifications] = useState([]);
  const [giftNotifications, setGiftNotifications] = useState([]);
  
  // Refs
  const giftCounterRef = useRef(0);
  const likeAccumulatorRef = useRef({});
  
  // Calculate entries for a user
  const calculateUserEntries = useCallback((username) => {
    return wheelEntries.filter(entry => entry.username === username).length;
  }, [wheelEntries]);
  
  // Add entries to the wheel
  const addEntries = useCallback((username, count, source, profilePicture = '') => {
    console.log(`SpinTheWheel: addEntries called - ${username}, ${count} entries, source: ${source}`);
    
    const newEntries = Array(count).fill(null).map((_, index) => ({
      id: `${username}-${Date.now()}-${index}`,
      username,
      profilePicture,
      source,
      timestamp: Date.now()
    }));
    
    setWheelEntries(prev => {
      const updated = [...prev, ...newEntries];
      console.log(`SpinTheWheel: Wheel entries updated. Total entries: ${updated.length}`);
      return updated;
    });
    
    // Update or add entry notification
    setEntryNotifications(prev => {
      const existingIndex = prev.findIndex(n => n.username === username && Date.now() - n.timestamp < 3000);
      
      if (existingIndex >= 0) {
        // Update existing notification
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          entries: updated[existingIndex].entries + count,
          totalEntries: calculateUserEntries(username) + count,
          timestamp: Date.now(),
          updated: true
        };
        return updated;
      } else {
        // Add new notification
        return [...prev, {
          id: `${username}-${Date.now()}`,
          username,
          entries: count,
          source,
          totalEntries: calculateUserEntries(username) + count,
          timestamp: Date.now(),
          updated: false
        }];
      }
    });
    
    // Increase activity
    setActivityLevel(prev => prev + count * 5);
  }, [calculateUserEntries]);
  
  // Handle likes
  const handleLikes = useCallback((data) => {
    if (!settings.enableLikes) return;
    
    const username = data.nickname || data.uniqueId || 'Anonymous';
    const likeCount = data.likeCount || 1;
    
    // Accumulate likes for this user
    if (!likeAccumulatorRef.current[username]) {
      likeAccumulatorRef.current[username] = 0;
    }
    likeAccumulatorRef.current[username] += likeCount;
    
    // Check if user has enough likes for entries
    const entriesEarned = Math.floor(likeAccumulatorRef.current[username] / settings.likesPerEntry);
    if (entriesEarned > 0) {
      const likesUsed = entriesEarned * settings.likesPerEntry;
      likeAccumulatorRef.current[username] -= likesUsed;
      
      addEntries(username, entriesEarned, 'likes', data.profilePictureUrl);
    }
    
    setTotalLikes(prev => prev + likeCount);
    setActivityLevel(prev => prev + likeCount);
  }, [settings.enableLikes, settings.likesPerEntry, addEntries]);
  
  // Handle gifts
  const handleGifts = useCallback((data) => {
    console.log('SpinTheWheel: Received gift data:', data);
    
    if (!settings.enableGifts) {
      console.log('SpinTheWheel: Gifts disabled in settings');
      return;
    }
    
    const username = data.nickname || data.uniqueId || 'Anonymous';
    const giftName = data.giftName || 'Gift';
    const repeatCount = data.repeatCount || 1;
    const diamondCount = data.diamondCount || 0;
    
    // Calculate entries based on gift value
    let entriesPerGift;
    
    // First try our predefined multipliers
    if (GIFT_MULTIPLIERS[giftName] !== undefined) {
      entriesPerGift = GIFT_MULTIPLIERS[giftName];
    } else if (diamondCount > 0) {
      // For unknown gifts, use diamond count with scaling
      if (diamondCount <= 10) {
        entriesPerGift = diamondCount; // 1:1 for small gifts
      } else if (diamondCount <= 100) {
        entriesPerGift = Math.ceil(diamondCount / 2); // Scale down medium gifts
      } else {
        entriesPerGift = Math.ceil(diamondCount / 5); // Scale down large gifts more
      }
      console.log(`SpinTheWheel: Gift "${giftName}" (${diamondCount} diamonds) = ${entriesPerGift} entries per gift`);
    } else {
      // Fallback: at least 1 entry per gift
      entriesPerGift = 1;
      console.log(`SpinTheWheel: Gift "${giftName}" has no diamond value, defaulting to 1 entry`);
    }
    
    const entries = entriesPerGift * repeatCount;
    
    console.log(`SpinTheWheel: Adding ${entries} entries for ${username} (${giftName} x${repeatCount})`);
    
    addEntries(username, entries, 'gift', data.profilePictureUrl);
    
    setTotalGifts(prev => prev + repeatCount);
    setActivityLevel(prev => prev + entries * 10);
    
    // Show gift notification
    setGiftNotifications(prev => [...prev, {
      id: Date.now() + Math.random(), // Ensure unique ID
      user: username,
      profilePicture: data.profilePictureUrl,
      giftName,
      giftCount: repeatCount,
      entries,
      timestamp: Date.now()
    }]);
  }, [settings.enableGifts, addEntries]);
  
  // Spin the wheel
  const spinWheel = useCallback(() => {
    if (wheelEntries.length === 0 || isSpinning || showingWinner) return;
    
    setIsSpinning(true);
    
    // Select random winner after spin animation
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * wheelEntries.length);
      const winner = wheelEntries[winnerIndex];
      
      setCurrentWinner({
        username: winner.username,
        profilePicture: winner.profilePicture,
        totalEntries: calculateUserEntries(winner.username),
        source: winner.source,
        timestamp: Date.now()
      });
      
      setRecentWinners(prev => [winner.username, ...prev.slice(0, 4)]);
      setSpinCount(prev => prev + 1);
      setIsSpinning(false);
      setShowingWinner(true); // Pause timer while showing winner
      
      // Failsafe: Force hide winner after 21 seconds in case onComplete doesn't fire
      setTimeout(() => {
        console.log('SpinTheWheelMode: Failsafe timer - clearing winner display');
        setCurrentWinner(null);
        setShowingWinner(false);
        setLastSpinTime(Date.now());
        setSpinCountdown(settings.spinInterval);
      }, 21000);
      
      // Clear entries if needed
      if (settings.clearAfterSpins > 0 && (spinCount + 1) % settings.clearAfterSpins === 0) {
        setTimeout(() => {
          setWheelEntries([]);
          likeAccumulatorRef.current = {};
        }, 20500); // Clear after winner screen disappears (20s + 0.5s fade)
      }
    }, 8000); // 8 second spin animation
  }, [wheelEntries, isSpinning, showingWinner, calculateUserEntries, spinCount, settings.clearAfterSpins, settings.spinInterval]);
  
  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't count down while showing winner
      if (showingWinner) return;
      
      const elapsed = Math.floor((Date.now() - lastSpinTime) / 1000);
      const remaining = Math.max(0, settings.spinInterval - elapsed);
      setSpinCountdown(remaining);
      
      if (remaining === 0 && wheelEntries.length > 0 && !isSpinning && !showingWinner) {
        spinWheel();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastSpinTime, settings.spinInterval, wheelEntries.length, isSpinning, showingWinner, spinWheel]);
  
  // Socket listeners
  useEffect(() => {
    if (!socket || demoMode) {
      console.log('SpinTheWheel: Socket not available or in demo mode', { socket: !!socket, demoMode });
      return;
    }
    
    console.log('SpinTheWheel: Setting up socket listeners');
    
    const onGift = (data) => {
      console.log('SpinTheWheel: Gift event received from socket:', data);
      handleGifts(data);
    };
    
    const onLike = (data) => {
      console.log('SpinTheWheel: Like event received from socket:', data);
      handleLikes(data);
    };
    
    socket.on('like', onLike);
    socket.on('gift', onGift);
    
    return () => {
      console.log('SpinTheWheel: Cleaning up socket listeners');
      socket.off('like', onLike);
      socket.off('gift', onGift);
    };
  }, [socket, demoMode, handleLikes, handleGifts]);
  
  // Demo mode functions
  const simulateLike = () => {
    const likeAmount = Math.floor(Math.random() * 50) + 50; // 50-100 likes
    const user = `DemoUser${Math.floor(Math.random() * 20)}`;
    handleLikes({
      nickname: user,
      likeCount: likeAmount,
      profilePictureUrl: `https://picsum.photos/50/50?random=${Math.random()}`
    });
  };
  
  const simulateGift = () => {
    const gifts = Object.keys(GIFT_MULTIPLIERS);
    const gift = gifts[Math.floor(Math.random() * gifts.length)];
    const user = `DemoUser${Math.floor(Math.random() * 20)}`;
    
    handleGifts({
      nickname: user,
      giftName: gift,
      repeatCount: 1,
      diamondCount: GIFT_MULTIPLIERS[gift],
      profilePictureUrl: `https://picsum.photos/50/50?random=${Math.random()}`
    });
  };
  
  // Activity decay
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityLevel(prev => Math.max(0, prev * 0.95));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Clean old notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 5000;
      setEntryNotifications(prev => prev.filter(n => n.timestamp > cutoff));
      setGiftNotifications(prev => prev.filter(n => n.timestamp > cutoff));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get leaderboard data
  const getLeaderboard = () => {
    const entryCounts = {};
    wheelEntries.forEach(entry => {
      if (!entryCounts[entry.username]) {
        entryCounts[entry.username] = {
          username: entry.username,
          profilePicture: entry.profilePicture,
          entries: 0,
          likes: 0,
          gifts: 0
        };
      }
      entryCounts[entry.username].entries++;
      if (entry.source === 'likes') entryCounts[entry.username].likes++;
      if (entry.source === 'gift') entryCounts[entry.username].gifts++;
    });
    
    return Object.values(entryCounts)
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 10);
  };
  
  return (
    <div className="spin-the-wheel-mode">
      <DynamicBackground activityLevel={activityLevel} />
      
      {/* Gift Notifications */}
      {giftNotifications.map((notification) => (
        <GiftNotification 
          key={notification.id}
          {...notification}
          customMessage={`+${notification.entries} wheel entries!`}
        />
      ))}
      
      {/* Main Content */}
      <div className="wheel-content">
        {/* Left Panel - Wheel */}
        <div className="left-panel">
          <SpinningWheel 
            entries={wheelEntries}
            isSpinning={isSpinning}
            onSpinComplete={(winner) => setCurrentWinner(winner)}
          />
          
          {/* Demo Controls */}
          {demoMode && (
            <div className="demo-controls">
              <h3>🎮 Demo Controls</h3>
              <div className="demo-buttons">
                <button onClick={simulateLike}>❤️ Simulate Likes</button>
                <button onClick={simulateGift}>🎁 Simulate Gift</button>
                <button onClick={spinWheel} disabled={isSpinning || wheelEntries.length === 0}>
                  🎡 Spin Now
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Stats & Leaderboard Side by Side */}
        <div className="right-panel">
          {/* Top Row - Stats and Leaderboard */}
          <div className="top-row">
            {/* Stats Display */}
            <div className="stats-display">
              <div className="stats-row">
                <div className="stat-box">
                  <h3>TOTAL<br/>ENTRIES</h3>
                  <p>{wheelEntries.length}</p>
                </div>
                <div className="stat-box">
                  <h3>UNIQUE<br/>PLAYERS</h3>
                  <p>{new Set(wheelEntries.map(e => e.username)).size}</p>
                </div>
              </div>
              <div className="stats-row">
                <div className="stat-box">
                  <h3>SPINS<br/>TODAY</h3>
                  <p>{spinCount}</p>
                </div>
                <div className="stat-box timer-box">
                  <h3>NEXT<br/>SPIN</h3>
                  <div className="countdown">
                    {Math.floor(spinCountdown / 60)}:{(spinCountdown % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Leaderboard */}
            <EntryLeaderboard entries={getLeaderboard()} />
          </div>
          
          {/* Recent Winners */}
          <div className="recent-winners">
            <h3>🏆 Recent Winners</h3>
            {recentWinners.length > 0 ? (
              <div className="winner-list">
                {recentWinners.map((winner, index) => (
                  <div key={index} className="recent-winner">
                    @{winner}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-winners">
                <p>No winners yet</p>
              </div>
            )}
          </div>
          
          {/* Entry Notifications */}
          <EntryNotifications notifications={entryNotifications} />
          
          {/* Admin Controls - Only show for streamer */}
          {isConnected && connectedUsername && (
            <AdminControls 
              settings={settings}
              onSettingsChange={setSettings}
              onSpinNow={spinWheel}
              isSpinning={isSpinning}
              entriesCount={wheelEntries.length}
            />
          )}
        </div>
        

      </div>
      
      {/* Winner Display - moved outside wheel-content to avoid stacking context issues */}
      {currentWinner && (
        <WinnerDisplay 
          winner={currentWinner}
          onComplete={() => {
            setCurrentWinner(null);
            setShowingWinner(false);
            // Restart timer after winner screen disappears
            setLastSpinTime(Date.now());
            setSpinCountdown(settings.spinInterval);
          }}
        />
      )}
      
      {/* Dimming overlay when winner is shown - moved to end to ensure proper layering */}
      {currentWinner && (
        <div className="winner-dimming-overlay" />
      )}
    </div>
  );
}

export default SpinTheWheelMode;
