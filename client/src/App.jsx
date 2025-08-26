import { useState, useEffect, lazy, Suspense } from 'react';
import io from 'socket.io-client';
import { config } from './config';
import GameProvider from './gameContext.jsx';
import { getModeById } from './modes/modeConfig';

// Components
import ModeSelection from './components/modeSelection/modeSelection';

// Mode components are now loaded dynamically from modeConfig

import './App.css';

function App({ socket }) {
    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState('DISCONNECTED');
    const [connectedUsername, setConnectedUsername] = useState('');
    const [connectionError, setConnectionError] = useState('');
    const [demoMode, setDemoMode] = useState(false);
    
    // Mode state
    const [currentMode, setCurrentMode] = useState(null);
    
    // Check URL parameters on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        if (mode) {
            setCurrentMode(mode);
        }
    }, []);


    // Initialize socket connection
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('Connected to server');
        };

        const handleDisconnect = () => {
            console.log('Disconnected from server');
            setIsConnected(false);
            setConnectionState('DISCONNECTED');
        };

        const handleTikTokConnected = (state) => {
            console.log('TikTok connected:', state);
            setIsConnected(true);
            setConnectionState('CONNECTED');
            setConnectedUsername(state.uniqueId);
            setConnectionError('');
        };

        const handleTikTokDisconnected = (reason) => {
            console.log('TikTok disconnected:', reason);
            setIsConnected(false);
            setConnectionState('DISCONNECTED');
            setConnectedUsername('');
        };

        const handleConnectionError = (error) => {
            console.error('Connection error:', error);
            setConnectionError(error.message || 'Failed to connect to TikTok Live');
            setConnectionState('DISCONNECTED');
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('tiktokConnected', handleTikTokConnected);
        socket.on('tiktokDisconnected', handleTikTokDisconnected);
        socket.on('connectionError', handleConnectionError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('tiktokConnected', handleTikTokConnected);
            socket.off('tiktokDisconnected', handleTikTokDisconnected);
            socket.off('connectionError', handleConnectionError);
        };
    }, [socket]);

    // Handle connection
    const handleConnect = (username) => {
        setConnectionError('');
        
        // Check if demo mode
        if (username.toLowerCase() === 'demo' || username.toLowerCase() === 'test') {
            setDemoMode(true);
            setIsConnected(true);
            setConnectionState('DEMO MODE');
            setConnectedUsername('Demo Mode');
            return;
        }
        
        // Connect to TikTok
        if (socket) {
            socket.emit('setUniqueId', username);
        }
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
        setCurrentMode(null);
        
        // Clear URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        window.history.replaceState({}, '', url);
    };

    // Handle mode selection
    const handleModeSelect = (mode) => {
        setCurrentMode(mode);
        
        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set('mode', mode);
        window.history.pushState({}, '', url);
    };

    // Render mode selection or game mode
    if (!currentMode) {
        return (
            <ModeSelection 
                onModeSelect={handleModeSelect}
                socket={socket}
                isConnected={isConnected}
                connectionState={connectionState}
                connectedUsername={connectedUsername}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
            />
        );
    }

    // Render selected mode
    const modeConfig = getModeById(currentMode);
    
    if (!modeConfig || !modeConfig.available) {
        // Fallback to mode selection if invalid mode
        setCurrentMode(null);
        return null;
    }
    
    // Dynamically load the mode component
    const ModeComponent = lazy(modeConfig.component);
    
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontSize: '2rem',
                color: 'white'
            }}>
                Loading game mode...
            </div>
        }>
            <ModeComponent 
                socket={socket}
                isConnected={isConnected}
                connectionState={connectionState}
                connectedUsername={connectedUsername}
                demoMode={demoMode}
            />
        </Suspense>
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
