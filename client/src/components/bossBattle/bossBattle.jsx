import { useGame } from '../../gameContext';
import './bossBattle.css';

const BossBattle = () => {
  const { state } = useGame();

  // Debug: Let's see what we're getting
  console.log('BossBattle state:', state);
  if (state) {
    console.log('Feed progress:', state.feed, '/ 1000 for first boss');
  }

  // Show progress toward next boss if not in boss phase
  if (!state || state.phase !== 'BOSS') {
    const levels = [
      { level: 1, feedRequired: 1000, bossHp: 300 },
      { level: 2, feedRequired: 5000, bossHp: 1000 },
      { level: 3, feedRequired: 15000, bossHp: 3000 },
    ];
    
    const currentLevel = levels[state?.levelIdx || 0];
    const currentFeed = state?.feed || 0;
    const progress = Math.min((currentFeed / currentLevel.feedRequired) * 100, 100);
    const feedNeeded = Math.max(0, currentLevel.feedRequired - currentFeed);
    
    return (
      <div className="boss-battle goal-mode">
        <div className="boss-container">
          <div className="boss-sprite">
            🎯
          </div>
          
          <div className="boss-info">
            <h2>🎯 Next Boss: Level {currentLevel.level}</h2>
            <div className="boss-hp-bar">
              <div className="hp-fill" style={{ width: `${progress}%` }}></div>
              <span className="hp-text">{currentFeed.toLocaleString()} / {currentLevel.feedRequired.toLocaleString()}</span>
            </div>
            <div className="boss-timer">
              {feedNeeded > 0 ? `${feedNeeded.toLocaleString()} feed needed` : '🚀 Boss Ready!'}
            </div>
          </div>
        </div>
        
        <div className="boss-instructions">
          <p>{feedNeeded > 0 ? 'Keep collecting likes and gifts to summon the boss!' : 'Boss battle starting soon...'}</p>
        </div>
      </div>
    );
  }

  const timeLeft = Math.max(0, state.bossEnds - Date.now());
  const secondsLeft = Math.ceil(timeLeft / 1000);
  const hpPercentage = (state.bossHp / getBossMaxHp(state.levelIdx)) * 100;

  return (
    <div className="boss-battle battle-mode">
      <div className="boss-container">
        {/* TODO: Add boss sprite asset */}
        <div className="boss-sprite">
          🐉 {/* Placeholder - replace with actual boss sprite */}
        </div>
        
        <div className="boss-info">
          <h2>⚔️ Boss Level {state.levelIdx + 1}</h2>
          <div className="boss-hp-bar">
            <div className="hp-fill" style={{ width: `${hpPercentage}%` }}></div>
            <span className="hp-text">{state.bossHp} HP</span>
          </div>
          <div className="boss-timer">
            ⏱️ {secondsLeft}s remaining
          </div>
        </div>
      </div>
      
      <div className="boss-instructions">
        <p>Type "defeat the boss" in chat to attack!</p>
      </div>
    </div>
  );
};

// Helper function to get max HP for boss level
function getBossMaxHp(levelIdx) {
  const levels = [
    { bossHp: 300 },
    { bossHp: 1000 },
    { bossHp: 3000 },
  ];
  return levels[levelIdx]?.bossHp || 300;
}

export default BossBattle; 