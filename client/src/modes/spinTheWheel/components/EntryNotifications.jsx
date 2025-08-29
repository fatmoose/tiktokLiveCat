import { useState, useEffect, useRef } from 'react';
import './EntryNotifications.css';

// Gift emoji mapping for common TikTok gifts
const GIFT_EMOJIS = {
  'Rose': '🌹',
  'Ice Cream Cone': '🍦',
  'TikTok': '🎵',
  'Heart': '❤️',
  'Heart Me': '❤️',
  'GG': '🎮',
  'Finger Heart': '🫰',
  'Perfume': '💐',
  'Disco Ball': '🪩',
  'Galaxy': '🌌',
  'Lion': '🦁',
  'Sports Car': '🏎️',
  'Whale Diving': '🐋',
  'TikTok Universe': '🌟',
  'Diamond Ring': '💍',
  'Crown': '👑',
  'Super Car': '🚗',
  'Private Jet': '✈️',
  'Luxury Yacht': '🛥️',
  'Space Station': '🚀'
};

const EntryNotification = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(notification);
  const onRemoveRef = useRef(onRemove);
  const removeTimerRef = useRef(null);
  const removalTimerRef = useRef(null);
  
  // Update ref when onRemove changes
  useEffect(() => {
    onRemoveRef.current = onRemove;
  }, [onRemove]);
  
  // Update notification data when it changes (user gets more entries)
  useEffect(() => {
    setCurrentNotification(notification);
    
    // Reset removal timer when notification updates
    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
    }
    if (removalTimerRef.current) {
      clearTimeout(removalTimerRef.current);
    }
    
    // If already removing, cancel removal
    if (isRemoving) {
      setIsRemoving(false);
    }
    
    // Restart the 5-second timer
    removeTimerRef.current = setTimeout(() => {
      setIsRemoving(true);
      
      // Trigger removal after animation
      removalTimerRef.current = setTimeout(() => {
        if (onRemoveRef.current) {
          onRemoveRef.current(notification.username);
        }
      }, 400); // Slightly after CSS transition completes
    }, 5000);
  }, [notification]); // Re-run when notification changes
  
  // Initial visibility animation
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => {
      clearTimeout(showTimer);
      if (removeTimerRef.current) {
        clearTimeout(removeTimerRef.current);
      }
      if (removalTimerRef.current) {
        clearTimeout(removalTimerRef.current);
      }
    };
  }, []); // Only run once on mount
  
  const getGiftEmoji = (giftName) => {
    return GIFT_EMOJIS[giftName] || '🎁';
  };
  
  const getEntrySourceDisplay = () => {
    if (currentNotification.source === 'gift') {
      return {
        icon: getGiftEmoji(currentNotification.giftName),
        text: currentNotification.giftName || 'Gift',
        count: currentNotification.giftCount > 1 ? `x${currentNotification.giftCount}` : ''
      };
    } else {
      return {
        icon: '❤️',
        text: '100 Likes',
        count: ''
      };
    }
  };
  
  const sourceInfo = getEntrySourceDisplay();
  
  return (
    <div className={`wheel-entry-notification ${isVisible ? 'visible' : ''} ${isRemoving ? 'removing' : ''}`}>
      <div className="wheel-entry-content">
        <div className="wheel-entry-header">
          <div className="wheel-entry-user">
            {currentNotification.profilePicture && (
              <img 
                src={currentNotification.profilePicture} 
                alt={currentNotification.username}
                className="wheel-entry-avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="wheel-entry-user-info">
              <div className="wheel-entry-username">{currentNotification.username}</div>
              <div className="wheel-entry-action">earned entries!</div>
            </div>
          </div>
          <div className="wheel-entry-celebrate">🎯</div>
        </div>
        
        <div className="wheel-entry-details">
          <div className="wheel-entry-source">
            <div className="wheel-entry-source-icon">{sourceInfo.icon}</div>
            <div className="wheel-entry-source-info">
              <div className="wheel-entry-source-name">{sourceInfo.text}</div>
              {sourceInfo.count && (
                <div className="wheel-entry-source-count">{sourceInfo.count}</div>
              )}
            </div>
          </div>
          
          <div className="wheel-entry-reward">
            <span className="wheel-entry-wheel-icon">🎡</span>
            <span className="wheel-entry-count">+{currentNotification.totalEntries}</span>
          </div>
        </div>
        
        <div className="wheel-entry-message">
          {currentNotification.updateCount > 1 ? 'Still earning entries! 🔥' : 'Added to the wheel! 🎰'}
        </div>
      </div>
      
      <div className="wheel-entry-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`wheel-particle wheel-particle-${i}`}></div>
        ))}
      </div>
    </div>
  );
};

const EntryNotifications = ({ notifications }) => {
  const [userNotifications, setUserNotifications] = useState({});
  const processedIds = useRef(new Set());
  
  useEffect(() => {
    // Process new notifications
    const newNotifications = notifications.filter(
      n => !processedIds.current.has(n.id)
    );
    
    if (newNotifications.length > 0) {
      // Mark these as processed
      newNotifications.forEach(n => processedIds.current.add(n.id));
      
      // Update user notifications - one per user
      setUserNotifications(prev => {
        const updated = { ...prev };
        
        newNotifications.forEach(notif => {
          const existing = updated[notif.username];
          
          if (existing) {
            // Update existing notification with new totals
            updated[notif.username] = {
              ...notif,
              totalEntries: (existing.totalEntries || existing.entries) + notif.entries,
              updateCount: (existing.updateCount || 1) + 1,
              timestamp: Date.now()
            };
          } else {
            // Create new notification for this user
            updated[notif.username] = {
              ...notif,
              totalEntries: notif.entries,
              updateCount: 1,
              timestamp: Date.now()
            };
          }
        });
        
        return updated;
      });
    }
  }, [notifications]);
  
  const handleRemove = (username) => {
    setUserNotifications(prev => {
      const updated = { ...prev };
      delete updated[username];
      return updated;
    });
  };
  
  return (
    <div className="wheel-entry-notifications">
      {Object.values(userNotifications).map((notification) => (
        <EntryNotification
          key={notification.username}
          notification={notification}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
};

export default EntryNotifications;