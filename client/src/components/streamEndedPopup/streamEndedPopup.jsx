import './streamEndedPopup.css';

function StreamEndedPopup({ onClose }) {
    return (
        <>
            {/* Backdrop/Overlay */}
            <div className="stream-ended-backdrop" onClick={onClose}></div>
            
            {/* Popup */}
            <div className="stream-ended-popup">
                <div className="stream-ended-content">
                    <h2>Stream Has Ended</h2>
                    <p>The TikTok Live stream has ended. You can try connecting to a different stream or wait for the streamer to go live again.</p>
                    <button 
                        className="stream-ended-close-btn"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}

export default StreamEndedPopup;
