import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGame } from '../../gameContext';
import bossGif from '../../assets/boss.gif';
import toothlessGif from '../../assets/toothless.gif';
import './counter.css';

const Counter = ({ data, totalLikes, totalGifts, activityLevel, isActiveBossMode = true }) => {
    const [displayLikes, setDisplayLikes] = useState(0);
    const [displayGifts, setDisplayGifts] = useState(0);
    const { state, socket } = useGame();
    
    // Boss battle states
    const [isStreetFighterMode, setIsStreetFighterMode] = useState(false);
    const [toothlessHealth, setToothlessHealth] = useState(100);
    const [bossHealthSF, setBossHealthSF] = useState(100);
    const [toothlessProjectiles, setToothlessProjectiles] = useState([]);
    const [bossProjectiles, setBossProjectiles] = useState([]);
    const [nextToothlessProjectileId, setNextToothlessProjectileId] = useState(0);
    const [nextBossProjectileId, setNextBossProjectileId] = useState(0);
    const [battleAnimations, setBattleAnimations] = useState({ toothless: 'idle', boss: 'idle' });
    const [battleStatus, setBattleStatus] = useState('fighting');
    const [hitEffects, setHitEffects] = useState([]);
    const [projectileHits, setProjectileHits] = useState(new Set());
    const [battleEnded, setBattleEnded] = useState(false);

    // Format numbers without abbreviation and determine dynamic font size
    const formatNumber = (num) => {
        return num.toLocaleString();
    };

    // Calculate dynamic font size based on number length
    const getDynamicFontSize = (num) => {
        const numStr = num.toLocaleString();
        const length = numStr.length;
        
        if (length <= 3) return '24px';      // Small numbers
        if (length <= 6) return '22px';      // Medium numbers
        if (length <= 9) return '20px';      // Large numbers
        if (length <= 12) return '18px';     // Very large numbers
        return '16px';                       // Extremely large numbers
    };

    // Force exit battle mode - immediate cleanup
    const forceExitBattleMode = () => {
        console.log('🎮 Force exiting battle mode - immediate cleanup');
        setIsStreetFighterMode(false);
        setBattleEnded(false);
        setBattleStatus('fighting');
        setToothlessHealth(100);
        setBossHealthSF(100);
        setToothlessProjectiles([]);
        setBossProjectiles([]);
        setHitEffects([]);
        setProjectileHits(new Set());
    };

    // Boss battle activation
    useEffect(() => {
        // Debug logging
        if (state && state.phase === 'BOSS') {
            console.log('🔍 Boss phase detected, isActiveBossMode:', isActiveBossMode, 'Current mode:', window.location.search);
        }
        
        if (state && state.phase === 'BOSS' && isActiveBossMode) {
            // Only start battle if not already in progress and we're in boss mode
            if (!isStreetFighterMode) {
                console.log('🎮 Starting Street Fighter Battle Mode');
                setIsStreetFighterMode(true);
                setToothlessHealth(100);
                setBossHealthSF(100);
                setToothlessProjectiles([]);
                setBossProjectiles([]);
                setBattleStatus('fighting');
                setHitEffects([]);
                setProjectileHits(new Set());
                setBattleEnded(false);
            }
        } else {
            // Immediately exit battle mode when phase changes
            if (isStreetFighterMode || battleEnded) {
                console.log('🎮 Exiting Street Fighter Battle Mode - Phase:', state?.phase);
                setIsStreetFighterMode(false);
                setBattleEnded(false);
                setBattleStatus('fighting');
                setToothlessProjectiles([]);
                setBossProjectiles([]);
                setHitEffects([]);
                setProjectileHits(new Set());
            }
        }
    }, [state?.phase, isStreetFighterMode, battleEnded, isActiveBossMode]);

    // Safety cleanup: if we're showing Street Fighter mode but state says we're not in boss phase
    useEffect(() => {
        if (isStreetFighterMode && state && state.phase !== 'BOSS') {
            console.log('🔧 Safety cleanup: Force exiting stale battle mode');
            forceExitBattleMode();
        }
    }, [isStreetFighterMode, state?.phase]);

    // Listen for server boss events
    useEffect(() => {
        if (!socket) return;

        const handleBossHit = (data) => {
            console.log('💥 Server confirmed boss hit by:', data.user);
            // Server hit confirmation - used for level progression tracking
        };

        // Note: We no longer listen for fx:bossDefeat or fx:bossFail 
        // because battle end is determined by client-side health bars reaching 0%
        socket.on('fx:bossHit', handleBossHit);

        return () => {
            socket.off('fx:bossHit', handleBossHit);
        };
    }, [socket, isStreetFighterMode]);

    // Animate the counters
    useEffect(() => {
        const animateCounter = (target, setter, current) => {
            if (current !== target) {
                const diff = target - current;
                const step = Math.max(1, Math.ceil(Math.abs(diff) / 10));
                const nextValue = current + (diff > 0 ? step : -step);
                
                setTimeout(() => {
                    setter(Math.max(0, nextValue));
                }, 50);
            }
        };

        animateCounter(totalLikes, setDisplayLikes, displayLikes);
        animateCounter(totalGifts, setDisplayGifts, displayGifts);
    }, [totalLikes, totalGifts, displayLikes, displayGifts]);

    // Track server boss HP for accurate visual representation
    const [serverBossHp, setServerBossHp] = useState(null);
    const [maxBossHp, setMaxBossHp] = useState(null);

    // Reset boss health when entering battle mode
    useEffect(() => {
        if (state && state.phase === 'BOSS' && !isStreetFighterMode) {
            // Battle is starting - reset health to 100%
            setBossHealthSF(100);
            setToothlessHealth(100);
            console.log('🎮 Boss battle starting - health reset to 100%');
        }
    }, [state?.phase, isStreetFighterMode]);

    // Boss battle collision detection
    useEffect(() => {
        if (!isStreetFighterMode) return;

        const checkCollisions = () => {
            const currentTime = Date.now();
            
            // Check Toothless projectiles hitting Boss
            toothlessProjectiles.forEach(projectile => {
                const timeElapsed = currentTime - projectile.createdAt;
                const animationDuration = (3 / projectile.speed) * 1000;
                const progress = timeElapsed / animationDuration;
                
                if (progress >= 0.75 && !projectileHits.has(projectile.id) && battleStatus === 'fighting') {
                    setProjectileHits(prev => new Set(prev).add(projectile.id));
                    
                    // Communicate with server for level progression (but don't rely on it for battle ending)
                    if (socket) {
                        console.log('🎯 Toothless projectile hit boss - notifying server');
                        socket.emit('chat', { 
                            text: 'defeat the boss', 
                            user: 'toothless_attack' 
                        });
                    }
                    
                    // Client-side health management for visual battle
                    setBossHealthSF(prev => {
                        const newHealth = Math.max(0, prev - 8);
                        console.log(`💥 Boss health: ${prev.toFixed(1)}% → ${newHealth.toFixed(1)}%`);
                        
                        // Check if boss is defeated in client battle
                        if (newHealth === 0) {
                            console.log('🎉 Boss health reached 0% - VICTORY!');
                            setBattleStatus('victory');
                            setTimeout(() => handleBattleVictory(), 500); // Small delay for visual effect
                        }
                        
                        return newHealth;
                    });
                    
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
                    
                    setBattleAnimations(prev => ({ ...prev, boss: 'hit' }));
                    setTimeout(() => {
                        setBattleAnimations(prev => ({ ...prev, boss: 'idle' }));
                    }, 300);
                }
            });

            // Check Boss projectiles hitting Toothless
            bossProjectiles.forEach(projectile => {
                const timeElapsed = currentTime - projectile.createdAt;
                const animationDuration = (3 / projectile.speed) * 1000;
                const progress = timeElapsed / animationDuration;
                
                if (progress >= 0.75 && !projectileHits.has(projectile.id) && battleStatus === 'fighting') {
                    setProjectileHits(prev => new Set(prev).add(projectile.id));
                    
                    setToothlessHealth(prev => {
                        const newHealth = Math.max(0, prev - 12);
                        if (newHealth === 0) {
                            setBattleStatus('defeat');
                            handleBattleDefeat();
                        }
                        return newHealth;
                    });
                    
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
                    
                    setBattleAnimations(prev => ({ ...prev, toothless: 'hit' }));
                    setTimeout(() => {
                        setBattleAnimations(prev => ({ ...prev, toothless: 'idle' }));
                    }, 300);
                }
            });
        };

        const collisionInterval = setInterval(checkCollisions, 50);
        return () => clearInterval(collisionInterval);
    }, [isStreetFighterMode, toothlessProjectiles, bossProjectiles, battleStatus, projectileHits]);

    // Boss shooting mechanics
    useEffect(() => {
        if (isStreetFighterMode && battleStatus === 'fighting') {
            const bossShootInterval = setInterval(() => {
                const bossEmojis = ['💀', '⚡', '🔥', '👹', '⚔️'];
                const newProjectile = {
                    id: nextBossProjectileId,
                    emoji: bossEmojis[Math.floor(Math.random() * bossEmojis.length)],
                    x: 80,
                    y: 35 + Math.random() * 30,
                    speed: 1.5 + Math.random() * 1,
                    createdAt: Date.now()
                };
                
                setBossProjectiles(prev => [...prev, newProjectile]);
                setNextBossProjectileId(prev => prev + 1);
                setBattleAnimations(prev => ({ ...prev, boss: 'attack' }));
                
                setTimeout(() => {
                    setBattleAnimations(prev => ({ ...prev, boss: 'idle' }));
                }, 400);
                
                setTimeout(() => {
                    setBossProjectiles(prev => prev.filter(p => p.id !== newProjectile.id));
                }, 4000);
            }, 1200 + Math.random() * 800);

            return () => clearInterval(bossShootInterval);
        }
    }, [isStreetFighterMode, battleStatus, nextBossProjectileId]);

    // Battle victory handler
    const handleBattleVictory = () => {
        console.log('🎉 VICTORY! Boss defeated! Advancing to next level...');
        setBattleStatus('victory');
        
        // Send enough hits to server to ensure boss is actually defeated for level progression
        if (socket && state) {
            const serverBossHp = state.bossHp || 0;
            console.log(`🎯 Ensuring server boss defeat - sending ${serverBossHp} hits to finish boss`);
            
            // Send rapid hits to finish off the server boss
            for (let i = 0; i < Math.max(serverBossHp, 50); i++) {
                setTimeout(() => {
                    socket.emit('chat', { 
                        text: 'defeat the boss', 
                        user: 'victory_finisher' 
                    });
                }, i * 10); // 10ms apart to avoid spam limits
            }
        }
        
        // Show victory message for 2 seconds, then exit
        setTimeout(() => {
            console.log('🎮 Victory sequence complete - exiting battle mode');
            forceExitBattleMode();
        }, 2000);
    };

    // Battle defeat handler  
    const handleBattleDefeat = () => {
        console.log('💀 DEFEAT! Toothless was defeated! Try again...');
        setBattleStatus('defeat');
        
        // Show defeat message for 1.5 seconds, then immediately exit
        setTimeout(() => {
            console.log('🎮 Defeat sequence complete - exiting battle mode');
            forceExitBattleMode();
        }, 1500);
    };

    // User comment triggers Toothless attack
    const triggerToothlessAttack = (commentText) => {
        if (!isStreetFighterMode || battleStatus !== 'fighting') return;
        
        const triggerPhrases = ['attack', 'fight', 'battle', 'strike', 'hit'];
        const hasAttackPhrase = triggerPhrases.some(phrase => 
            commentText.toLowerCase().includes(phrase)
        );
        
        if (!hasAttackPhrase) {
            console.log(`💬 Comment "${commentText}" doesn't contain attack phrase - no attack triggered`);
            return;
        }
        
        console.log(`⚔️ Attack triggered by comment: "${commentText}"`);
        
        const attackEmojis = ['❤️', '🍖', '✨', '⭐', '💫', '🎉', '🎊', '💝'];
        let selectedEmoji = attackEmojis[Math.floor(Math.random() * attackEmojis.length)];
        
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
            x: 20,
            y: 40 + Math.random() * 20,
            speed: 2 + Math.random() * 2,
            createdAt: Date.now()
        };
        
        setToothlessProjectiles(prev => [...prev, newProjectile]);
        setNextToothlessProjectileId(prev => prev + 1);
        setBattleAnimations(prev => ({ ...prev, toothless: 'attack' }));
        
        setTimeout(() => {
            setBattleAnimations(prev => ({ ...prev, toothless: 'idle' }));
        }, 500);
        
        setTimeout(() => {
            setToothlessProjectiles(prev => prev.filter(p => p.id !== newProjectile.id));
        }, 3000);
    };

    // Calculate boss progress
    const getBossProgress = () => {
        if (!state) return { progress: 0, feedNeeded: 1000, level: 1, currentFeed: 0 };
        
        const levels = [
            { level: 1, feedRequired: 1_000 },
            { level: 2, feedRequired: 5_000 },
            { level: 3, feedRequired: 15_000 },
        ];
        
        const currentLevel = levels[state.levelIdx || 0];
        const currentFeed = state.feed || 0;
        const progress = Math.min((currentFeed / currentLevel.feedRequired) * 100, 100);
        const feedNeeded = Math.max(0, currentLevel.feedRequired - currentFeed);
        
        return {
            progress,
            feedNeeded,
            level: currentLevel.level,
            currentFeed,
            feedRequired: currentLevel.feedRequired
        };
    };

    const bossProgress = getBossProgress();
    
    // Debug boss progression
    useEffect(() => {
        if (state) {
            console.log('🎮 Boss Progress Update:', {
                levelIdx: state.levelIdx,
                feed: state.feed,
                phase: state.phase,
                nextLevel: bossProgress.level,
                progress: bossProgress.progress.toFixed(1) + '%',
                clientBossHealth: bossHealthSF.toFixed(1) + '%',
                toothlessHealth: toothlessHealth.toFixed(1) + '%'
            });
        }
    }, [state?.levelIdx, state?.feed, state?.phase, bossHealthSF, toothlessHealth]);

    // Street Fighter Mode - Full Screen Battle
    if (isStreetFighterMode && isActiveBossMode && state?.phase === 'BOSS') {
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
                            <h3>BOSS LEVEL {(state?.levelIdx || 0) + 1}</h3>
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

    return (
        <div className="container">
            <div className="stats-display">
                <div className="stat-item">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-details">
                        <div className="stat-value" style={{ fontSize: getDynamicFontSize(displayLikes) }}>{formatNumber(displayLikes)}</div>
                        <div className="stat-label">TOTAL<br/>LIKES</div>
                    </div>
                </div>
                
                <div className="stat-item">
                    <div className="stat-icon">🎁</div>
                    <div className="stat-details">
                        <div className="stat-value" style={{ fontSize: getDynamicFontSize(displayGifts) }}>{formatNumber(displayGifts)}</div>
                        <div className="stat-label">TOTAL<br/>GIFTS</div>
                    </div>
                </div>
            </div>

            {/* Boss Level Progress */}
            <div className="boss-level-section">
                <div className="boss-header">
                    <div className="boss-avatar">
                        <img src={bossGif} alt="Boss" className="boss-image" />
                    </div>
                    <div className="boss-info">
                        <div className="boss-level">🔥 Next Boss: Level {bossProgress.level}</div>
                        <div className="boss-progress-text">{formatNumber(bossProgress.currentFeed)} / {formatNumber(bossProgress.feedRequired)}</div>
                        <div className="boss-needed">{bossProgress.feedNeeded > 0 ? `${formatNumber(bossProgress.feedNeeded)} feed needed` : '🚀 Boss Ready!'}</div>
                    </div>
                </div>
                <div className="boss-progress-bar">
                    <div className="boss-progress-fill" style={{ width: `${bossProgress.progress}%` }}></div>
                </div>
            </div>

            {/* Recent activity indicator */}
            {data && data.likeCount && (
                <div className="recent-activity">
                    <div className="activity-burst">
                        +{data.likeCount} ❤️
                    </div>
                    {data.user && (
                        <div className="activity-user">
                            from {data.user.nickname}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

Counter.propTypes = {
    data: PropTypes.object,
    totalLikes: PropTypes.number,
    totalGifts: PropTypes.number,
    activityLevel: PropTypes.number,
};

Counter.defaultProps = {
    totalLikes: 0,
    totalGifts: 0,
    activityLevel: 0,
};

export default Counter;
