import { useState } from 'react';
import './AdminControls.css';

const AdminControls = ({ settings, onSettingsChange, onSpinNow, isSpinning, entriesCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };
  
  return (
    <div className={`admin-controls ${isExpanded ? 'expanded' : ''}`}>
      <div 
        className="admin-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>⚙️ Admin Controls</h3>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="admin-content">
          {/* Quick Actions */}
          <div className="admin-section">
            <h4>Quick Actions</h4>
            <button 
              className="admin-button spin-now"
              onClick={onSpinNow}
              disabled={isSpinning || entriesCount === 0}
            >
              🎡 Spin Now
            </button>
          </div>
          
          {/* Timer Settings */}
          <div className="admin-section">
            <h4>Timer Settings</h4>
            <div className="setting-group">
              <label>Spin Interval (seconds)</label>
              <input 
                type="number"
                min="30"
                max="600"
                value={settings.spinInterval}
                onChange={(e) => handleChange('spinInterval', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          {/* Entry Settings */}
          <div className="admin-section">
            <h4>Entry Requirements</h4>
            <div className="setting-group">
              <label>Likes per Entry</label>
              <input 
                type="number"
                min="10"
                max="1000"
                step="10"
                value={settings.likesPerEntry}
                onChange={(e) => handleChange('likesPerEntry', parseInt(e.target.value))}
              />
            </div>
            
            <div className="setting-group">
              <label>Clear After X Spins (0 = never)</label>
              <input 
                type="number"
                min="0"
                max="10"
                value={settings.clearAfterSpins}
                onChange={(e) => handleChange('clearAfterSpins', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          {/* Entry Sources */}
          <div className="admin-section">
            <h4>Entry Sources</h4>
            <div className="toggle-group">
              <label className="toggle-label">
                <input 
                  type="checkbox"
                  checked={settings.enableLikes}
                  onChange={(e) => handleChange('enableLikes', e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span>Enable Likes</span>
              </label>
              
              <label className="toggle-label">
                <input 
                  type="checkbox"
                  checked={settings.enableGifts}
                  onChange={(e) => handleChange('enableGifts', e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span>Enable Gifts</span>
              </label>
              
              <label className="toggle-label">
                <input 
                  type="checkbox"
                  checked={settings.enableFollows}
                  onChange={(e) => handleChange('enableFollows', e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span>Enable Follows</span>
              </label>
            </div>
          </div>
          
          {/* Current Stats */}
          <div className="admin-section stats">
            <h4>Current Stats</h4>
            <div className="stat-row">
              <span>Total Entries:</span>
              <span className="stat-value">{entriesCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControls;
