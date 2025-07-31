import { useState } from 'react';
import PropTypes from 'prop-types';
import './connect.css';

const Connect = ({ tiktokConnection }) => {
    const [username, setUsername] = useState('');
    const [connected, setConnected] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const handleConnect = () => {
        if (username.trim()) {
            tiktokConnection.connect(username);
            tiktokConnection.on('tiktokConnected', () => setConnected(true));
            tiktokConnection.on('tiktokDisconnected', () => setConnected(false));
        }
    };

    return (
        <div>
            <button className="connect-button" onClick={() => setShowPopup(true)}>Connect</button>
            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <button className="close-button" onClick={() => setShowPopup(false)}>X</button>
                        <h2>Enter TikTok Username</h2>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@username"
                        />
                        <button onClick={handleConnect}>Connect</button>
                        <div className="connection-status">
                            {connected ? 'Connected' : 'Not Connected'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

Connect.propTypes = {
    tiktokConnection: PropTypes.object.isRequired,
};

export default Connect;
