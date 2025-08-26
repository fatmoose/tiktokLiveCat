import { useEffect, useState } from 'react';
import './EntryNotifications.css';

const EntryNotifications = ({ notifications }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  
  useEffect(() => {
    // Keep only the latest 5 notifications
    setVisibleNotifications(notifications.slice(-5));
  }, [notifications]);
  
  const getNotificationText = (notification) => {
    const entryText = notification.entries === 1 ? 'entry' : 'entries';
    const sourceEmoji = notification.source === 'gift' ? '🎁' : '❤️';
    
    return (
      <>
        <span className="notification-user">@{notification.username}</span>
        <span className="notification-action"> just earned </span>
        <span className={`notification-entries ${notification.updated ? 'updated' : ''}`}>
          {notification.entries} {entryText}
        </span>
        <span className="notification-source"> {sourceEmoji}</span>
      </>
    );
  };
  
  return (
    <div className="entry-notifications">
      {visibleNotifications.map((notification, index) => (
        <div 
          key={notification.id}
          className={`entry-notification ${notification.updated ? 'pulse' : ''}`}
          style={{
            top: `${index * 70}px`
          }}
        >
          <div className="notification-content">
            {getNotificationText(notification)}
          </div>
          <div className="notification-glow"></div>
        </div>
      ))}
    </div>
  );
};

export default EntryNotifications;
