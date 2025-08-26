import React, { useState } from 'react';
import { getAllModes } from '../../modes/modeConfig';
import './modeSelection.css';

const ModeSelection = ({ onModeSelect, socket, isConnected, connectionState, connectedUsername, onConnect, onDisconnect }) => {
  const [username, setUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Get all modes from configuration
  const modes = getAllModes();

  const handleConnect = () => {
    if (username.trim()) {
      setIsConnecting(true);
      setConnectionError('');
      onConnect(username);
      
      // Clear connecting state after a timeout
      setTimeout(() => {
        setIsConnecting(false);
      }, 2000);
    }
  };

  const handleModeSelect = (modeId) => {
    if (!isConnected) {
      setConnectionError('Please connect to TikTok Live first!');
      return;
    }
    
    // Open in new tab
    const url = new URL(window.location.href);
    url.searchParams.set('mode', modeId);
    window.open(url.toString(), '_blank');
    
    // Don't change the current tab - it should stay on mode selection
    // Remove the onModeSelect call to keep selection screen
  };

  const getConnectionStatusClass = () => {
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const getConnectionStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return `Connected as @${connectedUsername}`;
    return 'Not Connected';
  };

  return (
    <div className="mode-selection">
      {/* Header Section */}
      <header className="mode-selection-header">
        <div className="app-info">
          <h1 className="app-title">TikTok Live Interactive Games</h1>
          <p className="app-description">
            Connect your TikTok Live stream and let your viewers interact with fun games!
          </p>
        </div>

        {/* Connection Section */}
        <div className="connection-section">
          <div className="connection-input-group">
            <input
              type="text"
              className="username-input"
              placeholder="Enter TikTok username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
              disabled={isConnected}
            />
            {!isConnected ? (
              <button 
                className="connect-btn"
                onClick={handleConnect}
                disabled={isConnecting || !username.trim()}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <button 
                className="disconnect-btn"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>
          
          <div className={`connection-status ${getConnectionStatusClass()}`}>
            <span className="status-indicator"></span>
            <span className="status-text">{getConnectionStatusText()}</span>
          </div>
          
          {connectionError && (
            <div className="connection-error">
              {connectionError}
            </div>
          )}
        </div>
      </header>

      {/* Mode Selection Grid */}
      <main className="mode-selection-content">
        <h2 className="section-title">Select a Game Mode</h2>
        <div className="modes-grid">
          {modes.map((mode) => (
            <div 
              key={mode.id} 
              className={`mode-card ${!mode.available ? 'disabled' : ''} ${!isConnected && mode.available ? 'requires-connection' : ''}`}
              onClick={() => mode.available && handleModeSelect(mode.id)}
            >
              <div className="mode-image">
                <img src={mode.image} alt={mode.title} />
                {!mode.available && (
                  <div className="coming-soon-overlay">
                    <span>Coming Soon</span>
                  </div>
                )}
              </div>
              <div className="mode-info">
                <h3 className="mode-title">{mode.title}</h3>
                <p className="mode-description">{mode.description}</p>
              </div>
              {mode.available && !isConnected && (
                <div className="connection-required">
                  Connect to TikTok Live to play
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mode-selection-footer">
        <p className="footer-text">
          Made with ❤️ for TikTok Live streamers | 
          <span className="demo-hint"> Tip: Use "demo" as username for demo mode</span>
        </p>
      </footer>
    </div>
  );
};

export default ModeSelection;
