import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { config } from './config';
import GameProvider, { useGame } from './gameContext.jsx';

// Components
import LoginScreen from './components/loginScreen/loginScreen';
import Toothless from './components/toothless/toothless';
import Counter from './components/counter/counter';
import Leaderboard from './components/leaderboard/leaderboard';
import GiftNotification from './components/giftNotification/giftNotification';
import DynamicBackground from './components/dynamicBackground/dynamicBackground';
import UserEngagement from './components/userEngagement/userEngagement';
import FloatingElements from './components/floatingElements/floatingElements';
import BossBattle from './components/bossBattle/bossBattle';

import './App.css';

function App({ socket }) {
    // Add useGame hook to get server state
    const { state: gameState } = useGame();
    
    // Connection state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState('DISCONNECTED');
    const [connectedUsername, setConnectedUsername] = useState('');

    // Demo mode state
    const [demoMode, setDemoMode] = useState(false);

    // Socket and data state - now using passed socket
    const [likeCount, setLikeCount] = useState(0);
    const [giftCount, setGiftCount] = useState(0);

    const [activityLevel, setActivityLevel] = useState(0);
    
    // Recent activity and leaderboard
    const [recentLikes, setRecentLikes] = useState([]);
    const [recentGifts, setRecentGifts] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [giftNotifications, setGiftNotifications] = useState([]);
    
    // Floating elements
    const [lastLikeData, setLastLikeData] = useState(null);
    const [lastGiftData, setLastGiftData] = useState(null);
    const [hitHandlerRef, setHitHandlerRef] = useState(null);



    // Demo functions
    const simulateLike = () => {
        const likeAmount = Math.floor(Math.random() * 5) + 1; // 1-5 likes
        const newTotal = likeCount + likeAmount;
        setLikeCount(newTotal);
        setActivityLevel(prev => prev + likeAmount);
        
        setLastLikeData({ likeCount: likeAmount, timestamp: Date.now() });
        
        setRecentLikes(prev => [
            { 
                id: Date.now(), 
                user: `DemoUser${Math.floor(Math.random() * 100)}`, 
                count: likeAmount,
                timestamp: Date.now()
            },
            ...prev.slice(0, 4)
        ]);

        // In demo mode, also simulate feeding the game
        if (demoMode && socket) {
            socket.emit('demoFeed', { 
                type: 'like', 
                amount: likeAmount, 
                user: `DemoUser${Math.floor(Math.random() * 100)}` 
            });
        }
    };

    const simulateGift = () => {
        const gifts = [
            { name: 'Rose', value: 1 },
            { name: 'Heart', value: 5 },
            { name: 'Star', value: 10 },
            { name: 'Crown', value: 50 },
            { name: 'Galaxy', value: 1000 }
        ];
        
        const gift = gifts[Math.floor(Math.random() * gifts.length)];
        const giftAmount = Math.floor(Math.random() * 3) + 1; // 1-3 gifts
        const newTotal = giftCount + giftAmount;
        setGiftCount(newTotal);
        setActivityLevel(prev => prev + gift.value * giftAmount * 10);
        
        setLastGiftData({ 
            repeatCount: giftAmount, 
            giftName: gift.name,
            timestamp: Date.now() 
        });
        
        setRecentGifts(prev => [
            { 
                id: Date.now(), 
                user: `DemoUser${Math.floor(Math.random() * 100)}`, 
                gift: gift.name,
                count: giftAmount,
                timestamp: Date.now()
            },
            ...prev.slice(0, 4)
        ]);

        // Show gift notification
        setGiftNotifications(prev => [
            ...prev,
            {
                id: Date.now(),
                user: `DemoUser${Math.floor(Math.random() * 100)}`,
                profilePicture: '',
                giftName: gift.name,
                giftCount: giftAmount,
                diamondValue: gift.value,
                coins: gift.value * giftAmount
            }
        ]);

        // In demo mode, also simulate feeding the game
        if (demoMode && socket) {
            socket.emit('demoFeed', { 
                type: 'gift', 
                amount: gift.value * giftAmount, 
                user: `DemoUser${Math.floor(Math.random() * 100)}`,
                giftName: gift.name
            });
        }
    };

    const resetDemo = () => {
        setLikeCount(0);
        setGiftCount(0);
        setActivityLevel(0);
        setRecentLikes([]);
        setRecentGifts([]);
        setGiftNotifications([]);
        setLastLikeData(null);
        setLastGiftData(null);
    };

    // Initialize socket connection
    useEffect(() => {
        if (isLoggedIn && socket && !demoMode) {
            setupSocketListeners();
        }
    }, [isLoggedIn, socket, demoMode]);

    const setupSocketListeners = () => {
        if (!socket) return;

        socket.on('connect', () => {
            console.log('Connected to server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
            setConnectionState('DISCONNECTED');
        });

        socket.on('tiktokConnected', (state) => {
            console.log('TikTok connected:', state);
            setIsConnected(true);
            setConnectionState('CONNECTED');
            setConnectedUsername(state.uniqueId);
            setConnectionError('');
        });

        socket.on('tiktokDisconnected', (reason) => {
            console.log('TikTok disconnected:', reason);
            setIsConnected(false);
            setConnectionState('DISCONNECTED');
            setConnectedUsername('');
        });

        socket.on('connectionError', (error) => {
            console.error('Connection error:', error);
            setConnectionError(error.message || 'Failed to connect to TikTok Live');
            setIsConnecting(false);
            setConnectionState('DISCONNECTED');
        });

        // Data events
        socket.on('like', (data) => {
            console.log('Like received:', data);
            const newLikeCount = data.likeCount || 1;
            // Use server's totalLikes instead of incrementing locally
            setLikeCount(data.totalLikes || 0);
            setActivityLevel(prev => prev + newLikeCount);
            
            // Update floating elements
            setLastLikeData({ likeCount: newLikeCount, timestamp: Date.now() });
            
            // Add to recent activity
            setRecentLikes(prev => [
                { 
                    id: Date.now(), 
                    user: data.nickname || 'Anonymous', 
                    count: newLikeCount,
                    timestamp: Date.now()
                },
                ...prev.slice(0, 4)
            ]);
        });

        socket.on('gift', (data) => {
            console.log('Gift received:', data);
            const giftValue = (data.diamondCount || 1) * (data.repeatCount || 1);
            // Use server's totalGifts instead of incrementing locally
            setGiftCount(data.totalGifts || 0);
            setActivityLevel(prev => prev + giftValue * 10); // Gifts worth more activity
            
            // Update floating elements
            setLastGiftData({ 
                repeatCount: data.repeatCount || 1, 
                giftName: data.giftName,
                timestamp: Date.now() 
            });
            
            // Add to recent activity
            setRecentGifts(prev => [
                { 
                    id: Date.now(), 
                    user: data.nickname || 'Anonymous', 
                    gift: data.giftName || 'Gift',
                    count: data.repeatCount || 1,
                    timestamp: Date.now()
                },
                ...prev.slice(0, 4)
            ]);

            // Show gift notification
            setGiftNotifications(prev => [
                ...prev,
                {
                    id: Date.now(),
                    user: data.nickname || 'Anonymous',
                    profilePicture: data.profilePictureUrl,
                    giftName: data.giftName || 'Gift',
                    giftCount: data.repeatCount || 1,
                    diamondValue: data.diamondCount || 1,
                    coins: data.coins || giftValue // Include coins for display
                }
            ]);
        });

        socket.on('leaderboardUpdate', (data) => {
            setLeaderboard(data);
        });

        // Listen for statsUpdate events from server (sent every 10 seconds)
        socket.on('statsUpdate', (data) => {
            console.log('Stats update received:', data);
            // Update overall stats from server
            setLikeCount(data.totalLikes || 0);
            setGiftCount(data.totalGifts || 0);
            setLeaderboard(data.leaderboard || []);
        });

        socket.on('connectionReset', (data) => {
            console.log('Connection reset:', data.message);
            // Reset all local state for fresh start
            setLikeCount(0);
            setGiftCount(0);
            setActivityLevel(0);
            setRecentLikes([]);
            setRecentGifts([]);
            setLeaderboard([]);
            setGiftNotifications([]);
            setLastLikeData(null);
            setLastGiftData(null);
        });
    };

    // Handle login
    const handleLogin = (username) => {
        setIsConnecting(true);
        setConnectionError('');
        
        // Check if demo mode
        if (username.toLowerCase() === 'demo' || username.toLowerCase() === 'test') {
            setDemoMode(true);
            setIsLoggedIn(true);
            setIsConnecting(false);
            setIsConnected(true);
            setConnectionState('DEMO MODE');
            setConnectedUsername('Demo Mode');
            return;
        }
        
        // Simulate connection process
        setTimeout(() => {
            setIsLoggedIn(true);
            setIsConnecting(false);
            
            // Connect to TikTok after login
            setTimeout(() => {
                if (socket) {
                    socket.emit('setUniqueId', username);
                }
            }, 500);
        }, 1000);
    };

    // Handle disconnect
    const handleDisconnect = () => {
        if (socket) {
            socket.emit('disconnect');
        }
        setIsConnected(false);
        setConnectionState('DISCONNECTED');
        setConnectedUsername('');
        setDemoMode(false);
    };

    // Activity level decay
    useEffect(() => {
        const interval = setInterval(() => {
            setActivityLevel(prev => Math.max(0, prev * 0.98)); // Gradual decay
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Remove old notifications
    useEffect(() => {
        const cleanup = setInterval(() => {
            setGiftNotifications(prev => 
                prev.filter(notification => Date.now() - notification.id < 5000)
            );
        }, 1000);

        return () => clearInterval(cleanup);
    }, []);

    // Handle floating element hits
    const handleElementHit = (hitHandler) => {
        setHitHandlerRef(() => hitHandler);
    };

    // If not logged in, show login screen
    if (!isLoggedIn) {
        return (
            <LoginScreen 
                onConnect={handleLogin}
                isConnecting={isConnecting}
                connectionError={connectionError}
            />
        );
    }

    return (
        <div className="app">
            {/* Dynamic Background */}
            <DynamicBackground activityLevel={activityLevel} />
            
            {/* Floating Elements */}
            <FloatingElements 
                likeData={lastLikeData}
                giftData={lastGiftData}
                onElementHit={hitHandlerRef}
            />
            
            {/* Gift Notifications */}
            {giftNotifications.map((notification) => (
                <GiftNotification 
                    key={notification.id}
                    {...notification}
                />
            ))}
            
            {/* Main Content */}
            <div className="main-content">
                {/* Left Side - Boss Battle & Connection Controls */}
                <div className="left-panel">
                    {/* Boss Battle & Goal Progress */}
                    <BossBattle />
                    
                    {/* Stats Display */}
                    <Counter 
                        data={lastLikeData}
                        totalLikes={likeCount}
                        totalGifts={giftCount}
                        activityLevel={activityLevel}
                        recentLikes={recentLikes}
                        recentGifts={recentGifts}
                    />
                    
                    {/* Demo Controls */}
                    {demoMode && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '20px',
                            borderRadius: '15px',
                            marginBottom: '20px',
                            border: '2px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <h3 style={{ color: 'white', marginBottom: '15px', textAlign: 'center' }}>🎮 Demo Controls</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                marginBottom: '15px'
                            }}>
                                <button 
                                    onClick={simulateLike}
                                    style={{
                                        background: '#ff6b6b',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ❤️ Like
                                </button>
                                <button 
                                    onClick={simulateGift}
                                    style={{
                                        background: '#4caf50',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🎁 Gift
                                </button>
                                <button 
                                    onClick={resetDemo}
                                    style={{
                                        background: '#ffa726',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🔄 Reset Demo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* User Engagement Tips */}
                    <UserEngagement 
                        isConnected={isConnected || demoMode}
                        activityLevel={activityLevel}
                    />
                </div>
                
                {/* Center - Toothless */}
                <div className="center-content">
                    <Toothless 
                        activityLevel={activityLevel}
                        onElementHit={handleElementHit}
                    />
                </div>
                
                {/* Right Side - Leaderboard */}
                <div className="right-panel">
                    {(isConnected || demoMode) && (
                        <Leaderboard 
                            leaderboard={leaderboard}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AppWithGameProvider() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(config.serverUrl, {
        transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  if (!socket) {
    return <div>Connecting...</div>;
  }

  return (
    <GameProvider socket={socket}>
      <App socket={socket} />
    </GameProvider>
  );
}
