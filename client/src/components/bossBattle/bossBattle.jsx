import { useGame } from '../../gameContext';
import { useState, useEffect } from 'react';
import bossGif from '../../assets/boss.gif';
import toothlessGif from '../../assets/toothless.gif';
import susImg from '../../assets/sus.png';
import './bossBattle.css';

const BossBattle = () => {
  const { state } = useGame();
  const [projectiles, setProjectiles] = useState([]);
  const [nextProjectileId, setNextProjectileId] = useState(0);
  
  // Street Fighter Battle Mode States
  const [isStreetFighterMode, setIsStreetFighterMode] = useState(false);
  const [toothlessHealth, setToothlessHealth] = useState(100);
  const [bossHealthSF, setBossHealthSF] = useState(100);
  const [toothlessProjectiles, setToothlessProjectiles] = useState([]);
  const [bossProjectiles, setBossProjectiles] = useState([]);
  const [nextToothlessProjectileId, setNextToothlessProjectileId] = useState(0);
  const [nextBossProjectileId, setNextBossProjectileId] = useState(0);
  const [battleAnimations, setBattleAnimations] = useState({ toothless: 'idle', boss: 'idle' });
  const [battleStatus, setBattleStatus] = useState('fighting'); // 'fighting', 'victory', 'defeat'
  const [hitEffects, setHitEffects] = useState([]);
  const [projectileHits, setProjectileHits] = useState(new Set()); // Track which projectiles have already hit
  const [battleEnded, setBattleEnded] = useState(false); // Track if battle just ended

  // Street Fighter Mode Activation
  useEffect(() => {
    if (state && state.phase === 'BOSS') {
      // Activate Street Fighter mode when boss battle starts
      setIsStreetFighterMode(true);
      setToothlessHealth(100);
      setBossHealthSF(100);
      setToothlessProjectiles([]);
      setBossProjectiles([]);
      setBattleStatus('fighting');
      setHitEffects([]);
      setProjectileHits(new Set());
      setBattleEnded(false); // Reset battle ended state for new battle
    } else {
      setIsStreetFighterMode(false);
      setBattleEnded(false); // Reset when not in boss phase
    }
  }, [state?.phase]);

  // Time-based Collision Detection and Health Management
  useEffect(() => {
    if (!isStreetFighterMode) return;

    const checkCollisions = () => {
      const currentTime = Date.now();
      
      // Check Toothless projectiles hitting Boss (travel time ~2 seconds to hit at 75% progress)
      toothlessProjectiles.forEach(projectile => {
        const timeElapsed = currentTime - projectile.createdAt;
        const animationDuration = (3 / projectile.speed) * 1000; // Convert to milliseconds
        const progress = timeElapsed / animationDuration; // 0 to 1
        
        // Hit occurs at ~75% of the animation (when projectile reaches boss position)
        if (progress >= 0.75 && !projectileHits.has(projectile.id) && battleStatus === 'fighting') {
          console.log(`🎯 Boss hit by projectile! Progress: ${(progress * 100).toFixed(1)}%`);
          
          // Mark this projectile as having hit
          setProjectileHits(prev => new Set(prev).add(projectile.id));
          
          // Hit detected! Damage boss
          setBossHealthSF(prev => {
            const newHealth = Math.max(0, prev - 8); // 8 damage per hit
            console.log(`🎯 Boss health: ${prev} → ${newHealth}`);
            if (newHealth === 0) {
              setBattleStatus('victory');
              handleBattleVictory();
            }
            return newHealth;
          });
          
          // Add hit effect
          const hitEffect = {
            id: Date.now(),
            x: 75,
            y: projectile.y,
            type: 'boss-hit'
          };
          setHitEffects(prev => [...prev, hitEffect]);
          setTimeout(() => {
            setHitEffects(prev => prev.filter(h => h.id !== hitEffect.id));
          }, 1000);
          
          // Remove projectile immediately on hit for better visual feedback
          setToothlessProjectiles(prev => prev.filter(p => p.id !== projectile.id));
          
          // Boss hit animation
          setBattleAnimations(prev => ({ ...prev, boss: 'hit' }));
          setTimeout(() => {
            setBattleAnimations(prev => ({ ...prev, boss: 'idle' }));
          }, 300);
        }
      });

      // Check Boss projectiles hitting Toothless (travel time ~2 seconds to hit at 75% progress)
      bossProjectiles.forEach(projectile => {
        const timeElapsed = currentTime - projectile.createdAt;
        const animationDuration = (3 / projectile.speed) * 1000; // Convert to milliseconds
        const progress = timeElapsed / animationDuration; // 0 to 1
        
        // Hit occurs at ~75% of the animation (when projectile reaches toothless position)
        if (progress >= 0.75 && !projectileHits.has(projectile.id) && battleStatus === 'fighting') {
          console.log(`💥 Toothless hit by projectile! Progress: ${(progress * 100).toFixed(1)}%`);
          
          // Mark this projectile as having hit
          setProjectileHits(prev => new Set(prev).add(projectile.id));
          
          // Hit detected! Damage Toothless
          setToothlessHealth(prev => {
            const newHealth = Math.max(0, prev - 12); // 12 damage per hit
            console.log(`💥 Toothless health: ${prev} → ${newHealth}`);
            if (newHealth === 0) {
              setBattleStatus('defeat');
              handleBattleDefeat();
            }
            return newHealth;
          });
          
          // Add hit effect
          const hitEffect = {
            id: Date.now(),
            x: 25,
            y: projectile.y,
            type: 'toothless-hit'
          };
          setHitEffects(prev => [...prev, hitEffect]);
          setTimeout(() => {
            setHitEffects(prev => prev.filter(h => h.id !== hitEffect.id));
          }, 1000);
          
          // Remove projectile immediately on hit for better visual feedback
          setBossProjectiles(prev => prev.filter(p => p.id !== projectile.id));
          
          // Toothless hit animation
          setBattleAnimations(prev => ({ ...prev, toothless: 'hit' }));
          setTimeout(() => {
            setBattleAnimations(prev => ({ ...prev, toothless: 'idle' }));
          }, 300);
        }
      });
    };

    const collisionInterval = setInterval(checkCollisions, 50); // Check every 50ms for better precision
    return () => clearInterval(collisionInterval);
  }, [isStreetFighterMode, toothlessProjectiles, bossProjectiles, battleStatus, projectileHits]);

  // Battle Victory Handler
  const handleBattleVictory = () => {
    setTimeout(() => {
      setIsStreetFighterMode(false);
      setBattleEnded(true); // Mark battle as ended - waiting for backend to update phase
      console.log('🎉 VICTORY! Boss defeated! Advancing to next level...');
      
      // Reset battle state
      setToothlessHealth(100);
      setBossHealthSF(100);
      setToothlessProjectiles([]);
      setBossProjectiles([]);
      setBattleStatus('fighting');
      setHitEffects([]);
      setProjectileHits(new Set());
      
      // Safety timeout - reset battleEnded after 5 seconds in case backend doesn't update
      setTimeout(() => {
        setBattleEnded(false);
        console.log('⏰ Battle ended timeout - resetting state');
      }, 5000);
      
      // Note: Boss level advancement should be handled by the game's backend
      // The Street Fighter battle is purely visual/interactive
      // The actual game progression is managed by the original boss system
    }, 2000); // 2 second delay to show victory
  };

  // Battle Defeat Handler  
  const handleBattleDefeat = () => {
    setTimeout(() => {
      setIsStreetFighterMode(false);
      setBattleEnded(true); // Mark battle as ended - waiting for backend to update phase
      // Stay at current boss level - no advancement
      console.log('💀 DEFEAT! Toothless was defeated! Try again...');
      
      // Reset battle state
      setToothlessHealth(100);
      setBossHealthSF(100);
      setToothlessProjectiles([]);
      setBossProjectiles([]);
      setBattleStatus('fighting');
      setHitEffects([]);
      setProjectileHits(new Set());
      
      // Safety timeout - reset battleEnded after 5 seconds in case backend doesn't update
      setTimeout(() => {
        setBattleEnded(false);
        console.log('⏰ Battle ended timeout - resetting state');
      }, 5000);
    }, 2000); // 2 second delay to show defeat
  };

  // Boss shooting mechanics (Street Fighter Mode) - Steady stream of attacks
  useEffect(() => {
    if (isStreetFighterMode && battleStatus === 'fighting') {
      const bossShootInterval = setInterval(() => {
        // Boss shoots emoji projectiles - steady stream
        const bossEmojis = ['💀', '⚡', '🔥', '👹', '⚔️'];
        const newProjectile = {
          id: nextBossProjectileId,
          emoji: bossEmojis[Math.floor(Math.random() * bossEmojis.length)],
          x: 80, // Start from boss side (right)
          y: 35 + Math.random() * 30, // Random height across middle area
          speed: 1.5 + Math.random() * 1, // Slightly slower for more strategic gameplay
          createdAt: Date.now() // Timestamp for collision detection
        };
        
        setBossProjectiles(prev => [...prev, newProjectile]);
        setNextBossProjectileId(prev => prev + 1);
        setBattleAnimations(prev => ({ ...prev, boss: 'attack' }));
        
        // Reset boss animation
        setTimeout(() => {
          setBattleAnimations(prev => ({ ...prev, boss: 'idle' }));
        }, 400);
        
        // Remove projectile after animation
        setTimeout(() => {
          setBossProjectiles(prev => prev.filter(p => p.id !== newProjectile.id));
        }, 4000);
      }, 1200 + Math.random() * 800); // Boss attacks every 1.2-2 seconds (steady stream)

      return () => clearInterval(bossShootInterval);
    }
  }, [isStreetFighterMode, battleStatus, nextBossProjectileId]);

  // Toothless attacks ONLY when triggered by user comments with "ATTACK" phrase - no auto-attacks!

  // User comment triggers Toothless attack - ONLY if comment contains "ATTACK" phrase!
  const triggerToothlessAttack = (commentText) => {
    if (!isStreetFighterMode || battleStatus !== 'fighting') return;
    
    // Check if comment contains the trigger phrase "ATTACK" (case insensitive)
    const triggerPhrases = ['attack', 'fight', 'battle', 'strike', 'hit'];
    const hasAttackPhrase = triggerPhrases.some(phrase => 
      commentText.toLowerCase().includes(phrase)
    );
    
    // Only proceed if the comment contains an attack phrase
    if (!hasAttackPhrase) {
      console.log(`💬 Comment "${commentText}" doesn't contain attack phrase - no attack triggered`);
      return;
    }
    
    console.log(`⚔️ Attack triggered by comment: "${commentText}"`);
    
    // Determine emoji based on comment content
    const attackEmojis = ['❤️', '🍖', '✨', '⭐', '💫', '🎉', '🎊', '💝'];
    let selectedEmoji = attackEmojis[Math.floor(Math.random() * attackEmojis.length)];
    
    // Special emojis for certain comment keywords
    if (commentText.toLowerCase().includes('love')) selectedEmoji = '💖';
    if (commentText.toLowerCase().includes('food')) selectedEmoji = '🍖';
    if (commentText.toLowerCase().includes('attack')) selectedEmoji = '⚔️';
    if (commentText.toLowerCase().includes('fire')) selectedEmoji = '🔥';
    if (commentText.toLowerCase().includes('fight')) selectedEmoji = '👊';
    if (commentText.toLowerCase().includes('battle')) selectedEmoji = '⚔️';
    if (commentText.toLowerCase().includes('strike')) selectedEmoji = '⚔️';
    if (commentText.toLowerCase().includes('hit')) selectedEmoji = '💫';
    
    const newProjectile = {
      id: nextToothlessProjectileId,
      emoji: selectedEmoji,
      x: 20, // Start from toothless side (left)
      y: 40 + Math.random() * 20, // Random height
      speed: 2 + Math.random() * 2,
      createdAt: Date.now() // Timestamp for collision detection
    };
    
    setToothlessProjectiles(prev => [...prev, newProjectile]);
    setNextToothlessProjectileId(prev => prev + 1);
    setBattleAnimations(prev => ({ ...prev, toothless: 'attack' }));
    
    // Reset toothless animation
    setTimeout(() => {
      setBattleAnimations(prev => ({ ...prev, toothless: 'idle' }));
    }, 500);
    
    // Remove projectile after animation
    setTimeout(() => {
      setToothlessProjectiles(prev => prev.filter(p => p.id !== newProjectile.id));
    }, 3000);
  };

  // Boss shooting mechanics (Original Mode - for compatibility)
  useEffect(() => {
    if (state && state.phase === 'BOSS' && !isStreetFighterMode) {
      const shootInterval = setInterval(() => {
        const newProjectile = {
          id: nextProjectileId,
          x: Math.random() * 80 + 10,
          y: 0,
          speed: 2 + Math.random() * 2
        };
        
        setProjectiles(prev => [...prev, newProjectile]);
        setNextProjectileId(prev => prev + 1);
        
        setTimeout(() => {
          setProjectiles(prev => prev.filter(p => p.id !== newProjectile.id));
        }, 3000);
      }, 1000 + Math.random() * 2000);

      return () => clearInterval(shootInterval);
    }
  }, [state, nextProjectileId, isStreetFighterMode]);

  // Debug: Let's see what we're getting
  console.log('BossBattle state:', state);
  if (state) {
    console.log('Feed progress:', state.feed, '/ 1000 for first boss');
  }
  
  // Debug: Street Fighter battle state (remove in production)
  if (isStreetFighterMode && Math.random() < 0.1) { // Only log occasionally to avoid spam
    console.log('🎮 SF Battle State:', {
      toothlessHealth,
      bossHealthSF,
      battleStatus,
      toothlessProjectiles: toothlessProjectiles.length,
      bossProjectiles: bossProjectiles.length
    });
  }

  // Street Fighter Mode - Full Screen Battle
  if (isStreetFighterMode) {
    return (
      <div className="street-fighter-battle-overlay">
        <div className="sf-background">
          <div className="sf-health-bars">
            <div className="sf-fighter-info left">
              <h3>TOOTHLESS</h3>
              <div className="sf-health-bar">
                <div className="sf-health-fill toothless" style={{ width: `${toothlessHealth}%` }}></div>
                <span className="sf-health-text">{Math.round(toothlessHealth)}%</span>
              </div>
            </div>
            
            <div className="sf-vs-indicator">VS</div>
            
            <div className="sf-fighter-info right">
              <h3>BOSS LEVEL {state.levelIdx + 1}</h3>
              <div className="sf-health-bar">
                <div className="sf-health-fill boss" style={{ width: `${bossHealthSF}%` }}></div>
                <span className="sf-health-text">{Math.round(bossHealthSF)}%</span>
              </div>
            </div>
          </div>
          
          <div className="sf-battle-arena">
            {/* Toothless Fighter */}
            <div className={`sf-fighter toothless-fighter ${battleAnimations.toothless}`}>
              <img src={toothlessGif} alt="Toothless Fighter" className="sf-sprite" />
              <div className="sf-fighter-glow toothless-glow"></div>
            </div>
            
            {/* Boss Fighter */}
            <div className={`sf-fighter boss-fighter ${battleAnimations.boss}`}>
              <img src={bossGif} alt="Boss Fighter" className="sf-sprite" />
              <div className="sf-fighter-glow boss-glow"></div>
              <div className="sf-boss-aura"></div>
            </div>
            
            {/* Hit Effects */}
            {hitEffects.map(effect => (
              <div
                key={effect.id}
                className={`sf-hit-effect ${effect.type}`}
                style={{
                  left: `${effect.x}%`,
                  top: `${effect.y}%`
                }}
              >
                {effect.type === 'boss-hit' ? '💥' : '💫'}
              </div>
            ))}
            
            {/* Battle Status Messages */}
            {battleStatus === 'victory' && (
              <div className="sf-battle-message victory">
                <h1>🎉 VICTORY! 🎉</h1>
                <p>Boss Defeated! Advancing to next level...</p>
              </div>
            )}
            
            {battleStatus === 'defeat' && (
              <div className="sf-battle-message defeat">
                <h1>💀 DEFEAT! 💀</h1>
                <p>Toothless was defeated! Try again...</p>
              </div>
            )}
            
            {/* Toothless Projectiles */}
            {toothlessProjectiles.map(projectile => (
              <div
                key={projectile.id}
                className="sf-projectile toothless-projectile power-attack"
                style={{
                  left: `${projectile.x}%`,
                  top: `${projectile.y}%`,
                  animationDuration: `${3 / projectile.speed}s`
                }}
              >
                <span className="sf-emoji">{projectile.emoji}</span>
              </div>
            ))}
            
            {/* Boss Projectiles */}
            {bossProjectiles.map(projectile => (
              <div
                key={projectile.id}
                className="sf-projectile boss-projectile"
                style={{
                  left: `${projectile.x}%`,
                  top: `${projectile.y}%`,
                  animationDuration: `${3 / projectile.speed}s`
                }}
              >
                <span className="sf-emoji">{projectile.emoji}</span>
              </div>
            ))}
          </div>
          
          <div className="sf-instructions">
            <p>⚔️ EPIC HEALTH-BASED BATTLE! Fight until one fighter falls! ⚔️</p>
            <p>💬 Type comments with <strong>"ATTACK"</strong>, <strong>"FIGHT"</strong>, <strong>"BATTLE"</strong>, <strong>"STRIKE"</strong>, or <strong>"HIT"</strong> to trigger Toothless attacks!</p>
            <p>✨ Special emojis: "attack" = ⚔️, "fire" = 🔥, "love" = 💖, "food" = 🍖, "fight" = 👊, "strike" = ⚔️, "hit" = 💫</p>
            <button 
              className="sf-demo-attack" 
              onClick={() => triggerToothlessAttack('Demo attack!')}
            >
              🎮 Trigger Power Attack!
            </button>
          </div>
        </div>
      </div>
    );
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
          <div className="boss-sprite goal-mode-sprite">
            <img src={bossGif} alt="Boss" className="boss-image preview" />
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
          <p>{feedNeeded > 0 ? 'Keep liking and giving gifts to summon the boss!' : 'Boss battle starting soon...'}</p>
        </div>
      </div>
    );
  }

  // Handle transitional state - battle ended but backend hasn't updated phase yet
  if (battleEnded && state && state.phase === 'BOSS') {
    // Don't show anything while waiting for backend to update the phase
    // This prevents the "Loading Battle..." from appearing after battle ends
    return null;
  }

  // If we reach here, there's an issue - Street Fighter mode should handle all boss battles
  // This is a fallback that shouldn't normally be reached
  return (
    <div className="boss-battle battle-mode">
      <div className="boss-container">
        <div className="boss-sprite battle-mode-sprite">
          <div className="fiery-aura"></div>
          <img src={bossGif} alt="Boss" className="boss-image active" />
          <div className="threat-glow"></div>
        </div>
        
        <div className="boss-info">
          <h2>⚔️ Loading Battle...</h2>
          <div className="boss-hp-bar">
            <div className="hp-fill" style={{ width: '100%' }}></div>
            <span className="hp-text">Preparing Street Fighter Battle...</span>
          </div>
        </div>
      </div>
      
      <div className="boss-instructions">
        <p>Activating epic battle mode...</p>
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