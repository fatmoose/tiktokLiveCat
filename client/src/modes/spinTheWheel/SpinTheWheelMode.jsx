import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../gameContext.jsx';
import DynamicBackground from '../../components/dynamicBackground/dynamicBackground';
import GiftNotification from '../../components/giftNotification/giftNotification';
import SpinningWheel from './components/SpinningWheel';
import WinnerDisplay from './components/WinnerDisplay';
import EntryLeaderboard from './components/EntryLeaderboard';
import AdminControls from './components/AdminControls';
import EntryNotifications from './components/EntryNotifications';
import GalaxyProgress from './components/GalaxyProgress';
import EveryoneLosesDisplay from './components/EveryoneLosesDisplay';
import './SpinTheWheelMode.css';

// Enhanced gift value system - every gift gives at least 1 entry
// Based on TikTok diamond values with fair scaling for engagement
const GIFT_MULTIPLIERS = {
  'Rose': 1, // Every gift gives at least 1 entry
  'Ice Cream Cone': 1,
  'TikTok': 1,
  'Heart': 1,
  'GG': 1,
  'Finger Heart': 1, // Small gifts worth 1 entry
  'Perfume': 2,
  'Disco Ball': 3,
  'Galaxy': 50, // Reduced from 100
  'Lion': 55, // Reduced from 290
  'Sports Car': 70, // Reduced from 300
  'Whale Diving': 80, // Reduced from 500
  'TikTok Universe': 1000, // Reduced from 1000
  
  // Additional high-value gifts for better scaling
  'Diamond Ring': 75,
  'Crown': 125,
  'Super Car': 200,
  'Private Jet': 300,
  'Luxury Yacht': 500,
  'Space Station': 1000
};

// Enhanced diamond ranges for automatic scaling
const DIAMOND_RANGES = {
  MICRO: { max: 5, entries: 1 }, // 1-5 diamonds = 1 entry
  SMALL: { max: 20, entries: 1 }, // 6-20 diamonds
  MEDIUM: { max: 50, entries: 3 }, // 21-50 diamonds
  LARGE: { max: 100, entries: 6 }, // 51-100 diamonds
  HUGE: { max: 500, entries: 15 }, // 101-500 diamonds
  MEGA: { max: 1000, entries: 50 }, // 501-1000 diamonds
  ULTRA: { max: Infinity, entries: 100 } // 1000+ diamonds
};

function SpinTheWheelMode({ socket, isConnected, connectionState, connectedUsername, demoMode }) {
  const { state: gameState } = useGame();
  
  // Filter out boss battle state for spin the wheel mode
  const filteredGameState = gameState && gameState.phase === 'BOSS' ? { ...gameState, phase: 'FEEDING' } : gameState;
  
  // Notify server that this client is in spin the wheel mode (not boss battle mode)
  useEffect(() => {
    if (socket) {
      socket.emit('setMode', 'spinTheWheel');
    }
  }, [socket]);
  
  // Wheel state
  const [wheelEntries, setWheelEntries] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [spinCountdown, setSpinCountdown] = useState(900); // 15 minutes default
  const [lastSpinTime, setLastSpinTime] = useState(Date.now());
  const [showingWinner, setShowingWinner] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState({
    spinInterval: 900, // 15 minutes (900 seconds)
    likesPerEntry: 100,
    clearAfterSpins: 1, // Always clear after each spin
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
  
  // Galaxy tracking
  const [galaxyCount, setGalaxyCount] = useState(0);
  const [showEveryoneLoses, setShowEveryoneLoses] = useState(false);
  const [galaxyGifter, setGalaxyGifter] = useState(null);
  
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
  const addEntries = useCallback((username, count, source, profilePicture = '', extraData = {}) => {
    console.log(`SpinTheWheel: addEntries called - ${username}, ${count} entries, source: ${source}`);
    
    const newEntries = Array(count).fill(null).map((_, index) => ({
      id: `${username}-${Date.now()}-${index}`,
      username,
      profilePicture,
      source,
      timestamp: Date.now(),
      ...extraData
    }));
    
    setWheelEntries(prev => {
      const updated = [...prev, ...newEntries];
      console.log(`SpinTheWheel: Wheel entries updated. Total entries: ${updated.length}`);
      return updated;
    });
    
    // Update or add entry notification with full data
    setEntryNotifications(prev => {
      // Always create a new notification for better visibility
      const newNotification = {
        id: `${username}-${Date.now()}-${Math.random()}`,
        username,
        profilePicture,
        entries: count,
        source,
        totalEntries: calculateUserEntries(username) + count,
        timestamp: Date.now(),
        ...extraData
      };
      
      return [...prev, newNotification];
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
      
      addEntries(username, entriesEarned, 'likes', data.profilePictureUrl, {
        likeCount: likesUsed
      });
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
    
    // Track galaxy gifts
    if (giftName === 'Galaxy') {
      const newGalaxyCount = galaxyCount + repeatCount;
      setGalaxyCount(newGalaxyCount);
      
      // Check if this is the 10th galaxy
      if (newGalaxyCount >= 10 && galaxyCount < 10) {
        setGalaxyGifter(username);
        setShowEveryoneLoses(true);
        console.log(`SpinTheWheel: ${username} gifted the 10th galaxy! Everyone loses!`);
      }
    }
    
    // Calculate entries based on gift value using enhanced scaling system
    let entriesPerGift;
    
    // First try our predefined multipliers for known gifts
    if (GIFT_MULTIPLIERS[giftName] !== undefined) {
      entriesPerGift = GIFT_MULTIPLIERS[giftName];
      console.log(`SpinTheWheel: Known gift "${giftName}" = ${entriesPerGift} entries`);
    } else if (diamondCount > 0) {
      // Enhanced automatic scaling for unknown gifts based on diamond value
      if (diamondCount <= DIAMOND_RANGES.MICRO.max) {
        entriesPerGift = DIAMOND_RANGES.MICRO.entries;
      } else if (diamondCount <= DIAMOND_RANGES.SMALL.max) {
        entriesPerGift = DIAMOND_RANGES.SMALL.entries;
      } else if (diamondCount <= DIAMOND_RANGES.MEDIUM.max) {
        // Medium gifts: 21-50 diamonds = 3-5 entries
        entriesPerGift = Math.max(3, Math.ceil(diamondCount / 10));
      } else if (diamondCount <= DIAMOND_RANGES.LARGE.max) {
        // Large gifts: 51-100 diamonds = 6-10 entries
        entriesPerGift = Math.max(6, Math.ceil(diamondCount / 10));
      } else if (diamondCount <= DIAMOND_RANGES.HUGE.max) {
        // Huge gifts: 101-500 diamonds = 15-25 entries
        entriesPerGift = Math.max(15, Math.ceil(diamondCount / 20));
      } else if (diamondCount <= DIAMOND_RANGES.MEGA.max) {
        // Mega gifts: 501-1000 diamonds = 50-100 entries
        entriesPerGift = Math.max(50, Math.ceil(diamondCount / 10));
      } else {
        // Ultra gifts: 1000+ diamonds = 100+ entries
        entriesPerGift = Math.max(100, Math.ceil(diamondCount / 15));
      }
      console.log(`SpinTheWheel: Unknown gift "${giftName}" (${diamondCount} diamonds) = ${entriesPerGift} entries`);
    } else {
      // Fallback: give 1 entry for gifts without diamond value
      entriesPerGift = 1;
      console.log(`SpinTheWheel: Gift "${giftName}" has no diamond value, giving 1 entry as fallback`);
    }
    
    const entries = entriesPerGift * repeatCount;
    
    console.log(`SpinTheWheel: Adding ${entries} entries for ${username} (${giftName} x${repeatCount})`);
    
    // Only add entries if the amount is greater than 0
    if (entries > 0) {
      addEntries(username, entries, 'gift', data.profilePictureUrl, {
        giftName,
        giftCount: repeatCount,
        diamondCount
      });
      setActivityLevel(prev => prev + entries * 10);
    }
    
    setTotalGifts(prev => prev + repeatCount);
    
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
  }, [settings.enableGifts, addEntries, galaxyCount]);
  
  // Spin the wheel
  const spinWheel = useCallback(() => {
    console.log('SpinWheel called - entries:', wheelEntries.length, 'isSpinning:', isSpinning, 'showingWinner:', showingWinner);
    
    if (wheelEntries.length === 0 || isSpinning || showingWinner) {
      console.log('SpinWheel cancelled - conditions not met');
      return;
    }
    
    console.log('Starting wheel spin animation');
    setIsSpinning(true);
    
    // Select random winner after spin animation
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * wheelEntries.length);
      const winner = wheelEntries[winnerIndex];
      
      console.log('Wheel spin complete, winner selected:', winner.username);
      
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
    }, 8000); // 8 second spin animation
  }, [wheelEntries, isSpinning, showingWinner, calculateUserEntries]);
  
  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't count down while showing winner or spinning
      if (showingWinner || isSpinning) {
        console.log('Timer paused - showingWinner:', showingWinner, 'isSpinning:', isSpinning);
        return;
      }
      
      const elapsed = Math.floor((Date.now() - lastSpinTime) / 1000);
      const remaining = Math.max(0, settings.spinInterval - elapsed);
      setSpinCountdown(remaining);
      
      if (remaining === 0 && wheelEntries.length > 0) {
        console.log('Timer reached 0, triggering spin - entries:', wheelEntries.length);
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
    const likeAmount = settings.likesPerEntry; // Exactly enough for 1 entry
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
  
  // Add mass entries for testing with realistic user distribution
  const simulateMassEntries = (count = 100) => {
    console.log(`Adding ${count} demo entries`);
    
    // Create a realistic distribution of users (some with many entries, some with few)
    const userCounts = {};
    const totalUsers = Math.max(5, Math.floor(count / 10)); // 5-10% of entries will be unique users
    
    for (let i = 0; i < count; i++) {
      // 70% chance to use existing user, 30% chance to create new user
      let user;
      if (Math.random() < 0.7 && Object.keys(userCounts).length > 0) {
        // Use existing user
        const existingUsers = Object.keys(userCounts);
        user = existingUsers[Math.floor(Math.random() * existingUsers.length)];
      } else {
        // Create new user
        user = `TestUser${Math.floor(Math.random() * 1000)}`;
      }
      
      if (!userCounts[user]) {
        userCounts[user] = 0;
      }
      userCounts[user]++;
      
      // Randomly decide if it's a gift or likes
      if (Math.random() > 0.5) {
        // Gift entry
        const gifts = Object.keys(GIFT_MULTIPLIERS);
        const gift = gifts[Math.floor(Math.random() * gifts.length)];
        addEntries(user, 1, 'gift', `https://picsum.photos/40/40?random=${Math.random()}`, {
          giftName: gift,
          giftCount: 1
        });
      } else {
        // Like entry
        addEntries(user, 1, 'likes', `https://picsum.photos/40/40?random=${Math.random()}`, {
          likeCount: 100
        });
      }
    }
    
    console.log(`Created ${Object.keys(userCounts).length} unique users with entry distribution:`, userCounts);
  };
  
  const clearAllEntries = () => {
    setWheelEntries([]);
    likeAccumulatorRef.current = {};
  };
  
  // Reset wheel when galaxy limit is reached
  const handleGalaxyMaxReached = useCallback(() => {
    console.log('Galaxy limit reached! Resetting wheel...');
    // The popup is already shown, just need to handle the reset after
  }, []);
  
  // Activity decay
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityLevel(prev => Math.max(0, prev * 0.95));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Clean old gift notifications only (entry notifications are handled by queue system)
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 8000; // Keep gift notifications for 8 seconds
      setGiftNotifications(prev => prev.filter(n => n.timestamp > cutoff));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get leaderboard data
  const getLeaderboard = () => {
    console.log('Getting leaderboard data, wheelEntries:', wheelEntries.length);
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
    
    const leaderboardData = Object.values(entryCounts)
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 10);
    
    console.log('Leaderboard data:', leaderboardData);
    return leaderboardData;
  };
  
  return (
    <div className="spin-the-wheel-mode">
      {/* DynamicBackground removed to prevent interference with boss battle mode */}
      
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
            onSpinComplete={(winner) => {
              setCurrentWinner(winner);
              // Don't clear immediately - let WinnerDisplay handle it
            }}
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
                <button onClick={() => {
                  // Simulate galaxy gift
                  const user = `GalaxyGifter${Math.floor(Math.random() * 100)}`;
                  handleGifts({
                    nickname: user,
                    giftName: 'Galaxy',
                    repeatCount: 1,
                    diamondCount: 1000,
                    profilePictureUrl: `https://picsum.photos/50/50?random=${Math.random()}`
                  });
                }}>🌌 Gift Galaxy</button>
              </div>
              <div className="demo-buttons">
                <button onClick={() => simulateMassEntries(10)}>📦 Add 10 Entries</button>
                <button onClick={() => simulateMassEntries(50)}>📦 Add 50 Entries</button>
                <button onClick={() => simulateMassEntries(100)}>📦 Add 100 Entries</button>
                <button onClick={() => simulateMassEntries(500)}>🎯 Add 500 Entries</button>
                <button onClick={() => {
                  // Test single user with many entries
                                  for (let i = 0; i < 50; i++) {
                  addEntries('SuperUser', 1, 'gift', `https://picsum.photos/40/40?random=${Math.random()}`, {
                    giftName: 'Galaxy',
                    giftCount: 1
                  });
                }
                }}>👑 SuperUser (50 entries)</button>
                <button onClick={clearAllEntries}>🗑️ Clear All</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - All UI Elements */}
        <div className="right-panel">
          {/* Left Column - Everything except leaderboard */}
          <div className="left-column">
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
                <div className="stat-box">
                  <h3>SPINS<br/>TODAY</h3>
                  <p>{spinCount}</p>
                </div>
              </div>
              <div className="stats-row">
                <div className="stat-box timer-box full-width">
                  <h3>NEXT<br/>SPIN</h3>
                  <div className="countdown">
                    {Math.floor(spinCountdown / 60)}:{(spinCountdown % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
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
          
          {/* Right Column - Leaderboard Only */}
          <div className="right-column">
            <EntryLeaderboard entries={getLeaderboard()} />
            <GalaxyProgress 
              galaxyCount={galaxyCount}
              maxGalaxies={10}
              onMaxReached={handleGalaxyMaxReached}
            />
          </div>
        </div>
        

      </div>
      
      {/* Winner Display - moved outside wheel-content to avoid stacking context issues */}
      {currentWinner && (
        <WinnerDisplay 
          winner={currentWinner}
          socket={socket}
          onComplete={() => {
            console.log('WinnerDisplay onComplete called');
            
            // Clear winner state
            setCurrentWinner(null);
            setShowingWinner(false);
            
            // Clear wheel entries after showing winner
            console.log('Clearing wheel entries');
            setWheelEntries([]);
            likeAccumulatorRef.current = {};
            
            // Restart timer after winner screen disappears
            console.log('Restarting timer with interval:', settings.spinInterval);
            setLastSpinTime(Date.now());
            setSpinCountdown(settings.spinInterval);
            
            // Force a re-render to ensure wheel updates
            setTimeout(() => {
              console.log('Forcing component update after winner display');
            }, 100);
          }}
        />
      )}
      
      {/* Dimming overlay when winner is shown - moved to end to ensure proper layering */}
      {currentWinner && (
        <div className="winner-dimming-overlay" />
      )}
      
      {/* Everyone Loses Display */}
      {showEveryoneLoses && galaxyGifter && (
        <EveryoneLosesDisplay 
          username={galaxyGifter}
          onComplete={() => {
            console.log('EveryoneLosesDisplay onComplete called');
            
            // Clear all state
            setShowEveryoneLoses(false);
            setGalaxyGifter(null);
            setGalaxyCount(0);
            
            // Clear all entries
            setWheelEntries([]);
            likeAccumulatorRef.current = {};
            
            // Reset timer
            setLastSpinTime(Date.now());
            setSpinCountdown(settings.spinInterval);
          }}
        />
      )}
    </div>
  );
}

export default SpinTheWheelMode;
