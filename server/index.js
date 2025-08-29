// server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const { giftToCoins, LIKE_COINS } = require('./gifts');
const { GameState } = require('./gameState');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

const game = new GameState(io);

// User tracking for leaderboard
let userStats = new Map(); // uniqueId -> { uniqueId, nickname, profilePicture, likes, gifts, totalValue }
let totalLikes = 0;
let totalGifts = 0;
let currentConnectedUsername = null; // Track currently connected live stream

// Helper function to update user stats
function updateUserStats(uniqueId, nickname, profilePicture, likes = 0, gifts = 0, giftValue = 0) {
    if (!userStats.has(uniqueId)) {
        userStats.set(uniqueId, {
            uniqueId,
            nickname: nickname || uniqueId,
            profilePicture: profilePicture || '',
            likes: 0,
            gifts: 0,
            totalValue: 0
        });
    }
    
    const user = userStats.get(uniqueId);
    user.likes += likes;
    user.gifts += gifts;
    user.totalValue += giftValue;
    user.nickname = nickname || user.nickname; // Update nickname if provided
    
    return user;
}

// Get top 20 users for leaderboard
function getLeaderboard() {
    return Array.from(userStats.values())
        .sort((a, b) => (b.likes + b.totalValue * 10) - (a.likes + a.totalValue * 10)) // Weight gifts more heavily
        .slice(0, 20);
}

// Track client modes
const clientModes = new Map(); // socket.id -> mode

// Helper function to emit state updates only to boss battle clients
function emitStateUpdateToBossBattleClients(gameState) {
    const bossBattleClients = Array.from(clientModes.entries())
        .filter(([_, mode]) => mode === 'bossBattle')
        .map(([socketId, _]) => socketId);
    
    if (bossBattleClients.length > 0) {
        bossBattleClients.forEach(socketId => {
            const targetSocket = io.sockets.sockets.get(socketId);
            if (targetSocket) {
                targetSocket.emit('state:update', gameState);
            }
        });
    }
}

// Periodic state updates for boss battle clients
setInterval(() => {
    emitStateUpdateToBossBattleClients(game.getState());
}, 100); // 10 FPS updates

io.on('connection', (socket) => {
    let tiktokConnectionWrapper;
    let username = '';
    let clientMode = 'bossBattle'; // Default mode

    console.info('New connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

    // Send current stats to new client
    socket.emit('statsUpdate', {
        totalLikes,
        totalGifts,
        leaderboard: getLeaderboard()
    });
    
    // Handle mode setting
    socket.on('setMode', (mode) => {
        clientMode = mode;
        clientModes.set(socket.id, mode);
        console.log(`Client ${socket.id} set mode to: ${mode}`);
    });
    
    // Race mode specific events
    socket.on('race:winner', (data) => {
        console.log(`Race winner: ${data.username} (${data.racers} racers)`);
        // Broadcast to all race mode clients
        const raceClients = Array.from(clientModes.entries())
            .filter(([_, mode]) => mode === 'racing-game')
            .map(([id, _]) => id);
        
        raceClients.forEach(clientId => {
            io.to(clientId).emit('race:winnerAnnounced', data);
        });
    });
    
    // Clean up on disconnect
    socket.on('disconnect', () => {
        clientModes.delete(socket.id);
    });

    const startTikTokConnection = async () => {
        const options = { };
        // sessionId: '01f79eac9190a58c4ea63d2c67562759'

        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(username, options, true);
            tiktokConnectionWrapper.connect();

            tiktokConnectionWrapper.once('connected', (state) => {
                console.info(`Connected to TikTok live stream of ${username}`);
                socket.emit('tiktokConnected', { message: 'Connected to TikTok live stream' });
            });

            tiktokConnectionWrapper.once('disconnected', (reason) => {
                console.warn(`Disconnected from TikTok: ${reason}`);
                // Clear current connection when disconnected
                currentConnectedUsername = null;
                socket.emit('tiktokDisconnected', reason);
            });

            tiktokConnectionWrapper.connection.on('like', (msg) => {
                console.log('Like event:', msg.likeCount, 'from', msg.uniqueId);
                totalLikes += msg.likeCount;
                
                // Update user stats
                const user = updateUserStats(
                    msg.uniqueId,
                    msg.nickname,
                    msg.profilePictureUrl,
                    msg.likeCount
                );

                // Game integration - likes give coins (only for boss battle mode clients)
                const coins = msg.likeCount * LIKE_COINS;
                game.addCoins(msg.uniqueId, coins);
                
                // Emit updated game state only to boss battle mode clients
                emitStateUpdateToBossBattleClients(game.getState());

                // Broadcast like event with user info
                io.emit('like', {
                    ...msg,
                    user: user,
                    totalLikes: totalLikes
                });

                // Broadcast updated leaderboard
                io.emit('leaderboardUpdate', getLeaderboard());
            });

            tiktokConnectionWrapper.connection.on('comment', (msg) => {
                console.log('Comment:', msg.comment, 'from', msg.uniqueId);
                
                // Update user stats (for tracking active users)
                const user = updateUserStats(
                    msg.uniqueId,
                    msg.nickname,
                    msg.profilePictureUrl
                );

                socket.emit('comment', {
                    ...msg,
                    user: user
                });
            });

            tiktokConnectionWrapper.connection.on('gift', (msg) => {
                console.log('Gift:', msg.giftName, 'x', msg.repeatCount, 'from', msg.uniqueId);
                console.log('Gift diamondCount:', msg.diamondCount); // Debug diamond value
                totalGifts += msg.repeatCount;
                
                // Use diamondCount directly for both game and leaderboard scoring
                const giftValue = (msg.diamondCount || 1) * msg.repeatCount;
                const user = updateUserStats(
                    msg.uniqueId,
                    msg.nickname,
                    msg.profilePictureUrl,
                    0,
                    msg.repeatCount,
                    giftValue
                );

                // Game integration - use diamondCount directly (higher value = more feed points)
                // For better gameplay, multiply small gifts to make progress more visible
                let coins = giftValue;
                if (coins <= 5) {
                    coins *= 10; // Boost small gifts (1-5 diamonds) by 10x for better gameplay
                    console.log(`Boosted small gift: ${giftValue} -> ${coins} coins`);
                }
                
                console.log(`Adding ${coins} coins to game state`); // Debug coins added
                game.addCoins(msg.uniqueId, coins);
                
                // Emit updated game state only to boss battle mode clients
                emitStateUpdateToBossBattleClients(game.getState());
                
                io.emit("fx:gift", { user: msg.uniqueId, coins });

                // Broadcast gift event with enhanced data
                io.emit('gift', {
                    ...msg,
                    user: user,
                    totalGifts: totalGifts,
                    giftValue: giftValue,
                    coins: coins, // Include the actual coins awarded
                    giftPictureUrl: msg.giftPictureUrl || '', // Include gift image if available
                    giftId: msg.giftId || null // Include gift ID for fallback images
                });

                // Broadcast updated leaderboard
                io.emit('leaderboardUpdate', getLeaderboard());
            });

            tiktokConnectionWrapper.connection.on('follow', (msg) => {
                console.log('Follow:', msg.uniqueId);
                
                // Update user stats
                const user = updateUserStats(
                    msg.uniqueId,
                    msg.nickname,
                    msg.profilePictureUrl
                );

                socket.emit('follow', {
                    ...msg,
                    user: user
                });
            });

            tiktokConnectionWrapper.connection.on('share', (msg) => {
                console.log('Share:', msg.uniqueId);
                
                // Update user stats
                const user = updateUserStats(
                    msg.uniqueId,
                    msg.nickname,
                    msg.profilePictureUrl
                );

                socket.emit('share', {
                    ...msg,
                    user: user
                });
            });

            tiktokConnectionWrapper.connection.on('roomUser', (msg) => {
                console.log('Room users:', msg.viewersCount);
                socket.emit('roomUser', msg);
            });

            tiktokConnectionWrapper.connection.on('streamEnd', () => {
                console.log('Stream ended - broadcasting to all clients');
                // Broadcast to ALL connected clients that the stream has ended
                io.emit('streamEnd', { message: 'Stream ended' });
            });

        } catch (err) {
            console.error('Error connecting to TikTok:', err);
            socket.emit('tiktokDisconnected', err.toString());
        }
    };

    // Handle demo feeding
    socket.on('demoFeed', (data) => {
        console.log('Demo feed:', data);
        const { type, amount, user, giftName } = data;
        
        if (type === 'like') {
            const coins = amount * LIKE_COINS;
            game.addCoins(user, coins);
            
            // Update user stats for demo
            updateUserStats(user, user, '', amount);
            totalLikes += amount;
            
            // Emit updated game state so progress bars update
            io.emit('state:update', game.getState());
            
            // Broadcast like event for demo
            io.emit('like', {
                uniqueId: user,
                nickname: user,
                likeCount: amount,
                totalLikes: totalLikes
            });
        } else if (type === 'gift') {
            game.addCoins(user, amount);
            
            // Update user stats for demo
            updateUserStats(user, user, '', 0, 1, amount);
            totalGifts += 1;
            
            // Emit updated game state only to boss battle mode clients
            emitStateUpdateToBossBattleClients(game.getState());
            
            // Broadcast gift event for demo
            io.emit('gift', {
                uniqueId: user,
                nickname: user,
                giftName: giftName,
                diamondCount: amount,
                repeatCount: 1,
                coins: amount,
                totalGifts: totalGifts
            });
        }
        
        // Broadcast updated leaderboard
        io.emit('leaderboardUpdate', getLeaderboard());
    });

    // Boss battle attack via chat command
    socket.on('chat', msg => {
        if (/defeat\s+the\s+boss/i.test(msg.text))
            game.bossHit(msg.user);
    });

    // Reset totals and start fresh connection when connecting to new live stream
    const resetStatsForNewConnection = () => {
        console.info('Resetting stats for new live stream connection');
        
        // Reset global totals
        totalLikes = 0;
        totalGifts = 0;
        
        // Clear user statistics
        userStats.clear();
        
        // Reset game state for fresh start
        game.reset();
        
        // Emit updated game state only to boss battle mode clients after reset
        emitStateUpdateToBossBattleClients(game.getState());
        
        // Notify all clients about the reset
        io.emit('statsUpdate', {
            totalLikes: 0,
            totalGifts: 0,
            leaderboard: []
        });
        
        // Also emit a specific reset event
        io.emit('connectionReset', {
            message: 'Connected to new live stream - stats reset'
        });
    };

    // Automatically start the connection when a client connects
    socket.on('setUniqueId', (text) => {
        username = text;
        
        // Only reset stats when connecting to a DIFFERENT live stream
        if (currentConnectedUsername && currentConnectedUsername !== username) {
            console.info(`Switching from ${currentConnectedUsername} to ${username} - resetting stats`);
            resetStatsForNewConnection();
        } else if (!currentConnectedUsername) {
            console.info(`First connection to ${username} - resetting stats`);
            resetStatsForNewConnection();
        } else {
            console.info(`Reconnecting to same live stream: ${username} - keeping stats`);
        }
        
        // Update the current connected username
        currentConnectedUsername = username;
        
        startTikTokConnection();
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

// Broadcast stats every 10 seconds
setInterval(() => {
    io.emit('statsUpdate', {
        totalLikes,
        totalGifts,
        leaderboard: getLeaderboard(),
        globalConnectionCount: getGlobalConnectionCount()
    });
}, 10000);

// Development simulator endpoint
app.post("/dev/simulate", express.json(), (req, res) => {
    const { type, user, coins } = req.body;
    if (type === "gift") {
        // Use coins as diamond value directly (new system)
        game.addCoins(user, coins);
        
        // Emit updated game state so progress bars update
        io.emit('state:update', game.getState());
        
        // Also update user stats for leaderboard
        updateUserStats(user, `SimUser_${user}`, null, 0, 1, coins);
        io.emit('leaderboardUpdate', getLeaderboard());
    }
    res.sendStatus(204);
});

app.use(express.static('public'));

const port = process.env.PORT || 8081;

httpServer.listen(port, () => {
    console.info(`✅ Server running! Please visit http://localhost:${port}`);
});
