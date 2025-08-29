import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../gameContext.jsx';

// Components
import Toothless from '../../components/toothless/toothless';
import Counter from '../../components/counter/counter';
import Leaderboard from '../../components/leaderboard/leaderboard';
import GiftNotification from '../../components/giftNotification/giftNotification';
import GiftPopupQueue from '../../components/giftPopupQueue/giftPopupQueue';
import DynamicBackground from '../../components/dynamicBackground/dynamicBackground';
import FloatingElements from '../../components/floatingElements/floatingElements';

import './BossBattleMode.css';

function BossBattleMode({ socket, isConnected, connectionState, connectedUsername, demoMode }) {
    // Add useGame hook to get server state
    const { state: gameState } = useGame();
    
    // Notify server that this client is in boss battle mode
    useEffect(() => {
        if (socket) {
            socket.emit('setMode', 'bossBattle');
        }
    }, [socket]);
    
    // Game state
    const [likeCount, setLikeCount] = useState(0);
    const [giftCount, setGiftCount] = useState(0);
    const [activityLevel, setActivityLevel] = useState(0);
    
    // Gift counter for unique IDs
    const giftCounterRef = useRef(0);
    
    // Recent activity and leaderboard
    const [recentLikes, setRecentLikes] = useState([]);
    const [recentGifts, setRecentGifts] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [giftNotifications, setGiftNotifications] = useState([]);
    const [giftPopups, setGiftPopups] = useState([]);
    
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
        
        setLastLikeData({ 
            likeCount: likeAmount, 
            timestamp: Date.now(),
            profilePicture: `https://picsum.photos/50/50?random=${Math.floor(Math.random() * 100)}`,
            nickname: `DemoUser${Math.floor(Math.random() * 100)}`
        });
        
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

        // Add to new gift popup queue for demo mode
        const demoUser = `DemoUser${Math.floor(Math.random() * 100)}`;
        giftCounterRef.current += 1;
        setGiftPopups(prev => [
            ...prev,
            {
                id: `demo-gift-${Date.now()}-${giftCounterRef.current}-${demoUser}-${gift.name}`,
                user: demoUser,
                nickname: demoUser,
                uniqueId: demoUser.toLowerCase(),
                profilePicture: '',
                giftName: gift.name,
                giftCount: giftAmount,
                repeatCount: giftAmount,
                diamondValue: gift.value,
                coins: gift.value * giftAmount,
                giftPictureUrl: '',
                giftId: null,
                timestamp: Date.now()
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

    // Handler for when gift popup is processed
    const handleGiftProcessed = (giftId) => {
        setGiftPopups(prev => prev.filter(gift => gift.id !== giftId));
    };

    const resetDemo = () => {
        setLikeCount(0);
        setGiftCount(0);
        setActivityLevel(0);
        setRecentLikes([]);
        setRecentGifts([]);
        setGiftNotifications([]);
        setGiftPopups([]);
        setLastLikeData(null);
        setLastGiftData(null);
    };

    // Initialize socket listeners
    useEffect(() => {
        if (!socket || demoMode) return;

        const handleLike = (data) => {
            console.log('Like received:', data);
            const newLikeCount = data.likeCount || 1;
            setLikeCount(data.totalLikes || 0);
            setActivityLevel(prev => prev + newLikeCount);
            
            setLastLikeData({ 
                likeCount: newLikeCount, 
                timestamp: Date.now(),
                profilePicture: data.profilePictureUrl,
                nickname: data.nickname 
            });
            
            setRecentLikes(prev => [
                { 
                    id: Date.now(), 
                    user: data.nickname || 'Anonymous', 
                    count: newLikeCount,
                    timestamp: Date.now()
                },
                ...prev.slice(0, 4)
            ]);
        };

        const handleGift = (data) => {
            console.log('Gift received:', data);
            const giftValue = (data.diamondCount || 1) * (data.repeatCount || 1);
            setGiftCount(data.totalGifts || 0);
            setActivityLevel(prev => prev + giftValue * 10);
            
            setLastGiftData({ 
                repeatCount: data.repeatCount || 1, 
                giftName: data.giftName,
                timestamp: Date.now() 
            });
            
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

            setGiftNotifications(prev => [
                ...prev,
                {
                    id: Date.now(),
                    user: data.nickname || 'Anonymous',
                    profilePicture: data.profilePictureUrl,
                    giftName: data.giftName || 'Gift',
                    giftCount: data.repeatCount || 1,
                    diamondValue: data.diamondCount || 1,
                    coins: data.coins || giftValue
                }
            ]);

            giftCounterRef.current += 1;
            setGiftPopups(prev => [
                ...prev,
                {
                    id: `gift-${Date.now()}-${giftCounterRef.current}-${data.uniqueId}-${data.giftName}`,
                    user: data.user?.nickname || data.nickname || data.uniqueId || 'Anonymous',
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePicture: data.user?.profilePicture || data.profilePictureUrl || '',
                    giftName: data.giftName || 'Gift',
                    giftCount: data.repeatCount || 1,
                    repeatCount: data.repeatCount || 1,
                    diamondValue: data.diamondCount || 1,
                    coins: data.coins || giftValue,
                    giftPictureUrl: data.giftPictureUrl || '',
                    giftId: data.giftId || null,
                    timestamp: Date.now()
                }
            ]);
        };

        const handleLeaderboardUpdate = (data) => {
            setLeaderboard(data);
        };

        const handleStatsUpdate = (data) => {
            console.log('Stats update received:', data);
            setLikeCount(data.totalLikes || 0);
            setGiftCount(data.totalGifts || 0);
            setLeaderboard(data.leaderboard || []);
        };

        const handleConnectionReset = (data) => {
            console.log('Connection reset:', data.message);
            setLikeCount(0);
            setGiftCount(0);
            setActivityLevel(0);
            setRecentLikes([]);
            setRecentGifts([]);
            setLeaderboard([]);
            setGiftNotifications([]);
            setGiftPopups([]);
            setLastLikeData(null);
            setLastGiftData(null);
        };

        // Add listeners
        socket.on('like', handleLike);
        socket.on('gift', handleGift);
        socket.on('leaderboardUpdate', handleLeaderboardUpdate);
        socket.on('statsUpdate', handleStatsUpdate);
        socket.on('connectionReset', handleConnectionReset);

        // Cleanup
        return () => {
            socket.off('like', handleLike);
            socket.off('gift', handleGift);
            socket.off('leaderboardUpdate', handleLeaderboardUpdate);
            socket.off('statsUpdate', handleStatsUpdate);
            socket.off('connectionReset', handleConnectionReset);
        };
    }, [socket, demoMode]);

    // Activity level decay
    useEffect(() => {
        const interval = setInterval(() => {
            setActivityLevel(prev => Math.max(0, prev * 0.98));
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

    return (
        <div className="boss-battle-mode">
            {/* Dynamic Background */}
            <DynamicBackground activityLevel={activityLevel} />
            
            {/* Floating Elements */}
            <FloatingElements 
                likeData={lastLikeData}
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
                {/* Left Side - Stats & Connection Controls */}
                <div className="left-panel">
                    {/* Stats Display */}
                    <Counter 
                        data={lastLikeData}
                        totalLikes={likeCount}
                        totalGifts={giftCount}
                        activityLevel={activityLevel}
                        recentLikes={recentLikes}
                        isActiveBossMode={true}
                        recentGifts={recentGifts}
                    />
                    
                    {/* Demo Controls */}
                    {demoMode && (
                        <div className="demo-controls">
                            <h3>🎮 Demo Controls</h3>
                            <div className="demo-buttons">
                                <button onClick={simulateLike} className="demo-btn like-btn">
                                    ❤️ Like
                                </button>
                                <button onClick={simulateGift} className="demo-btn gift-btn">
                                    🎁 Gift
                                </button>
                                <button onClick={resetDemo} className="demo-btn reset-btn">
                                    🔄 Reset Demo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Gift Popup Queue */}
                    <GiftPopupQueue 
                        gifts={giftPopups}
                        onGiftProcessed={handleGiftProcessed}
                    />
                </div>
                
                {/* Center - Toothless */}
                <div className="center-content">
                    <Toothless 
                        activityLevel={activityLevel}
                        onElementHit={handleElementHit}
                        leaderboard={leaderboard}
                    />
                </div>
                
                {/* Right Side - Leaderboard */}
                <div className="right-panel">
                    <Leaderboard 
                        leaderboard={leaderboard}
                    />
                </div>
            </div>
        </div>
    );
}

export default BossBattleMode;
