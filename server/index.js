// server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

const hardcodedUsername = 'kayzedra'; // Replace with the actual TikTok username

io.on('connection', (socket) => {
    let tiktokConnectionWrapper;

    console.info('New connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

    const startTikTokConnection = async () => {
        const options = { };
        // sessionId: '01f79eac9190a58c4ea63d2c67562759'

        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(hardcodedUsername, options, true);
            tiktokConnectionWrapper.connect();

            tiktokConnectionWrapper.once('connected', (state) => {
                console.info(`Connected to TikTok live stream of ${hardcodedUsername}`);
                socket.emit('tiktokConnected', { message: 'Connected to TikTok live stream' });
            });

            tiktokConnectionWrapper.once('disconnected', (reason) => {
                console.warn(`Disconnected from TikTok: ${reason}`);
                socket.emit('tiktokDisconnected', reason);
            });

            tiktokConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));

            tiktokConnectionWrapper.connection.on('streamEnd', () => {
                socket.emit('streamEnd', { message: 'Stream ended' });
            });



        } catch (err) {
            console.error('Error connecting to TikTok:', err);
            socket.emit('tiktokDisconnected', err.toString());
        }
    };

    // Automatically start the connection when a client connects
    startTikTokConnection();

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
}, 5000);

app.use(express.static('public'));

const port = process.env.PORT || 8081;
httpServer.listen(port, () => {
    console.info(`Server running! Please visit http://localhost:${port}`);
});
