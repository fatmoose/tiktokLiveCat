import { useState } from 'react';
import PropTypes from 'prop-types';
import './loginScreen.css';

const LoginScreen = ({ onConnect, isConnecting, connectionError }) => {
    const [username, setUsername] = useState('');
    const [isValid, setIsValid] = useState(true);

    const validateUsername = (value) => {
        // Basic TikTok username validation
        const trimmed = value.trim();
        if (!trimmed) return false;
        
        // Check if it's a valid TikTok username format
        const tikTokUsernameRegex = /^[a-zA-Z0-9._-]+$/;
        return tikTokUsernameRegex.test(trimmed) && trimmed.length >= 1 && trimmed.length <= 24;
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        setIsValid(validateUsername(value));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = username.trim();
        
        if (validateUsername(trimmed)) {
            onConnect(trimmed);
        } else {
            setIsValid(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isConnecting && validateUsername(username.trim())) {
            handleSubmit(e);
        }
    };



    return (
        <div className="login-screen">
            <div className="login-container">
                <div className="login-header">
                    <h1>🎯 TikTok Live Connector</h1>
                    <p>Connect to a TikTok Live stream to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">TikTok Username</label>
                        <div className="input-wrapper">
                            <span className="input-prefix">@</span>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={isConnecting ? "Connecting..." : "Enter TikTok username"}
                                className={`username-input ${!isValid ? 'invalid' : ''} ${isConnecting ? 'connecting' : ''}`}
                                disabled={isConnecting}
                                autoFocus
                                maxLength={24}
                            />
                        </div>
                        {!isValid && (
                            <span className="error-message">
                                Please enter a valid TikTok username
                            </span>
                        )}
                        {connectionError && (
                            <span className="error-message">
                                {connectionError}
                            </span>
                        )}
                    </div>
                    <div className="connect-hint">
                        <p>✨ Press Enter when ready to connect!</p>
                    </div>
                </form>

                <div className="login-info">
                    <div className="info-section">
                        <h3>📋 How it works:</h3>
                        <ul>
                            <li>Enter a TikTok username that's currently live</li>
                            <li>Press Enter to connect to their live stream</li>
                            <li>Watch Toothless dance to likes and gifts!</li>
                        </ul>
                    </div>
                    
                    <div className="info-section">
                        <h3>🎮 Features:</h3>
                        <ul>
                            <li>🎵 Dancing animations</li>
                            <li>❤️ Floating heart effects</li>
                            <li>🍕 Food animations</li>
                            <li>🏆 Live leaderboards</li>
                        </ul>
                    </div>
                </div>




            </div>
        </div>
    );
};

LoginScreen.propTypes = {
    onConnect: PropTypes.func.isRequired,
    isConnecting: PropTypes.bool,
    connectionError: PropTypes.string,
};

export default LoginScreen; 