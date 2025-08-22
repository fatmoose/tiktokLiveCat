import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useGame } from '../../gameContext';
import './giftPopupQueue.css';

const GiftPopupQueue = ({ gifts, onGiftProcessed }) => {
    const [activePopups, setActivePopups] = useState([]);
    const [queue, setQueue] = useState([]);
    const [pausedDuringBattle, setPausedDuringBattle] = useState([]);
    const [giftCombos, setGiftCombos] = useState({}); // Track gift combos by user+gift
    const [popupTimers, setPopupTimers] = useState({}); // Track removal timers
    const MAX_POPUPS = 5;
    const POPUP_DURATION = 3000; // 3 seconds after last gift
    const COMBO_WINDOW = 5000; // 5 seconds to combine same gifts from same user
    
    // Get game state to detect boss battles
    const { state: gameState } = useGame();
    
    // More responsive boss battle detection
    const isBossBattle = gameState?.phase === 'BOSS';

    // Track processed gift IDs to prevent duplicates
    const [processedGiftIds, setProcessedGiftIds] = useState(new Set());
    
    // Process new gifts
    useEffect(() => {
        if (gifts && gifts.length > 0) {
            // Only process gifts that haven't been processed yet
            const newGifts = gifts.filter(gift => !processedGiftIds.has(gift.id));

            if (newGifts.length > 0) {
                console.log(`Processing ${newGifts.length} new gifts`); // Debug the gift data
                
                // Mark these gifts as processed immediately to prevent race conditions
                setProcessedGiftIds(prev => {
                    const newSet = new Set(prev);
                    newGifts.forEach(gift => newSet.add(gift.id));
                    return newSet;
                });
                
                // Process each new gift
                newGifts.forEach(gift => {
                    const comboKey = `${gift.user || gift.uniqueId}_${gift.giftName}`;
                    const existingCombo = giftCombos[comboKey];
                    console.log(`Processing gift - User: ${gift.user || gift.uniqueId}, Gift: ${gift.giftName}, ComboKey: ${comboKey}`);
                    
                    // Check if we have an active combo for this user+gift (either in combos, active popups, or queue)
                    const activePopup = activePopups.find(p => p.comboKey === comboKey);
                    const queuedGift = queue.find(q => q.comboKey === comboKey);
                    const shouldCombine = (existingCombo && (Date.now() - existingCombo.lastUpdate) < COMBO_WINDOW) || activePopup || queuedGift;
                    
                    if (shouldCombine) {
                        // Update or create combo data
                        const newCount = (existingCombo?.count || (activePopup?.comboCount || 1)) + (gift.giftCount || gift.repeatCount || 1);
                        const newValue = (existingCombo?.totalValue || (activePopup?.comboValue || ((gift.diamondValue || 1) * (gift.giftCount || gift.repeatCount || 1)))) + ((gift.diamondValue || 1) * (gift.giftCount || gift.repeatCount || 1));
                        
                        setGiftCombos(prev => ({
                            ...prev,
                            [comboKey]: {
                                count: newCount,
                                totalValue: newValue,
                                lastUpdate: Date.now(),
                                scale: 1 // Keep scale constant at 1
                            }
                        }));
                        
                        if (activePopup) {
                            // Update existing active popup
                            const activePopupId = activePopup.id;
                            
                            // Cancel existing timer - use callback to ensure we get latest timer
                            setPopupTimers(prev => {
                                const existingTimer = prev[activePopupId];
                                if (existingTimer) {
                                    clearTimeout(existingTimer);
                                    console.log(`Cleared existing timer for popup ${activePopupId}`);
                                }
                                // Return previous state for now, will be updated below
                                return prev;
                            });
                            
                            // Update popup data
                            setActivePopups(prev => prev.map(popup => {
                                if (popup.comboKey === comboKey) {
                                    return {
                                        ...popup,
                                        comboCount: newCount,
                                        comboValue: newValue,
                                        scale: 1, // Keep scale constant at 1
                                        lastComboTime: Date.now(),
                                        isComboActive: true
                                    };
                                }
                                return popup;
                            }));
                            
                            // Clear the active flag after a short delay
                            setTimeout(() => {
                                setActivePopups(prev => prev.map(popup => {
                                    if (popup.id === activePopupId) {
                                        return { ...popup, isComboActive: false };
                                    }
                                    return popup;
                                }));
                            }, 300);
                            
                            // Set new timer based on total combo value (use higher of individual gift or combo value)
                            const timerValue = Math.max(gift.diamondValue || 1, newValue);
                            const duration = calculateDuration(timerValue);
                            console.log(`Setting new timer for ${duration}ms based on value ${timerValue} for popup ${activePopupId}`);
                            const newTimer = setTimeout(() => {
                                console.log(`Timer expired for popup ${activePopupId}, removing...`);
                                removePopup(activePopupId);
                                // Clean up combo data after popup is removed
                                setTimeout(() => {
                                    setGiftCombos(prev => {
                                        const newCombos = { ...prev };
                                        delete newCombos[comboKey];
                                        return newCombos;
                                    });
                                    // Clean up timer reference
                                    setPopupTimers(prev => {
                                        const newTimers = { ...prev };
                                        delete newTimers[activePopupId];
                                        return newTimers;
                                    });
                                }, 1000);
                            }, duration);
                            
                            setPopupTimers(prev => {
                                const newTimers = {
                                    ...prev,
                                    [activePopupId]: newTimer
                                };
                                console.log(`Stored timer for popup ${activePopupId}, total active timers:`, Object.keys(newTimers).length);
                                return newTimers;
                            });
                        } else if (queuedGift) {
                            // Gift already in queue with same combo key - update the queued gift's data
                            setQueue(prev => prev.map(queueItem => {
                                if (queueItem.comboKey === comboKey) {
                                    return {
                                        ...queueItem,
                                        comboCount: newCount,
                                        comboValue: newValue
                                    };
                                }
                                return queueItem;
                            }));
                            console.log(`Updated queued gift for combo key: ${comboKey}`);
                        } else {
                            // No active popup or queued gift - create new popup with combo data
                            setQueue(prev => [...prev, { ...gift, comboKey }]);
                        }
                        
                        // Mark this gift as processed
                        if (onGiftProcessed) {
                            onGiftProcessed(gift.id);
                        }
                    } else {
                        // Start new combo and add to queue
                        setGiftCombos(prev => ({
                            ...prev,
                            [comboKey]: {
                                count: gift.giftCount || gift.repeatCount || 1,
                                totalValue: (gift.diamondValue || 1) * (gift.giftCount || gift.repeatCount || 1),
                                lastUpdate: Date.now(),
                                scale: 1 // Keep scale constant
                            }
                        }));
                        
                        // Add to queue with combo key
                        setQueue(prev => [...prev, { ...gift, comboKey }]);
                    }
                });
            }
        }
    }, [gifts]); // Keep simple dependency to prevent loops - combo logic uses latest state via closures

    // Handle boss battle state changes
    useEffect(() => {
        if (isBossBattle) {
            // Boss battle started - pause all active popups and move them to paused queue
            if (activePopups.length > 0) {
                console.log('Boss battle started - pausing gift popups');
                setPausedDuringBattle(prev => [...prev, ...activePopups]);
                setActivePopups([]);
            }
        } else {
            // Boss battle ended - resume paused popups immediately
            if (pausedDuringBattle.length > 0) {
                console.log('Boss battle ended - resuming gift popups immediately');
                setQueue(prev => [...pausedDuringBattle, ...prev]);
                setPausedDuringBattle([]);
            }
        }
    }, [isBossBattle]); // Simplified dependency array to prevent loops

    // Safety mechanism: Force resume if paused for more than 10 seconds
    useEffect(() => {
        if (pausedDuringBattle.length > 0) {
            const forceResumeTimer = setTimeout(() => {
                console.log('🔧 Force resuming gift popups - timeout exceeded');
                setQueue(prev => [...pausedDuringBattle, ...prev]);
                setPausedDuringBattle([]);
            }, 10000); // 10 seconds timeout
            
            return () => clearTimeout(forceResumeTimer);
        }
    }, [pausedDuringBattle.length]);

    // Process queue when space is available and not in boss battle
    useEffect(() => {
        if (!isBossBattle && queue.length > 0 && activePopups.length < MAX_POPUPS) {
            const nextGift = queue[0];
            
            // Check if there's already an active popup for this combo key
            const existingActivePopup = activePopups.find(p => p.comboKey === nextGift.comboKey);
            
            if (existingActivePopup) {
                // Don't create duplicate popup, just remove from queue
                setQueue(prev => prev.slice(1));
                console.log(`Skipping duplicate popup for combo key: ${nextGift.comboKey}`);
                return;
            }
            
            setQueue(prev => prev.slice(1));
            
            // Calculate duration based on combo value (or individual gift value if no combo)
            const comboData = nextGift.comboKey ? giftCombos[nextGift.comboKey] : null;
            const timerValue = comboData ? Math.max(comboData.totalValue, nextGift.diamondValue || 1) : (nextGift.diamondValue || 1);
            const duration = calculateDuration(timerValue);
            console.log(`Creating new popup for ${nextGift.comboKey} with duration ${duration}ms based on value ${timerValue}`);
            
            const popupData = {
                ...nextGift,
                startTime: Date.now(),
                duration: duration,
                isVisible: false,
                comboCount: comboData?.count || (nextGift.giftCount || nextGift.repeatCount || 1),
                comboValue: comboData?.totalValue || ((nextGift.diamondValue || 1) * (nextGift.giftCount || nextGift.repeatCount || 1)),
                scale: comboData?.scale || 1,
                lastComboTime: Date.now(),
                isComboActive: false
            };

            setActivePopups(prev => [...prev, popupData]);

            // Trigger entrance animation and special effects
            setTimeout(() => {
                setActivePopups(prev => 
                    prev.map(popup => 
                        popup.id === nextGift.id 
                            ? { ...popup, isVisible: true }
                            : popup
                    )
                );

                // Add special effects for high-value gifts
                const diamondValue = nextGift.diamondValue || 1;
                
                // TODO: Add sound effects here
                // if (diamondValue >= 1000) playSound('legendary');
                // else if (diamondValue >= 500) playSound('epic');
                // else if (diamondValue >= 100) playSound('rare');
                // else playSound('common');
                if (diamondValue >= 1000) {
                    // LEGENDARY - Ultimate screen effects
                    document.body.style.animation = 'screenShake 0.8s ease-in-out';
                    
                    // Golden flash effect
                    const flash = document.createElement('div');
                    flash.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
                        z-index: 9998;
                        pointer-events: none;
                        animation: flashEffect 0.6s ease-out;
                    `;
                    document.body.appendChild(flash);
                    
                    // Add rainbow border effect to screen
                    const rainbowBorder = document.createElement('div');
                    rainbowBorder.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        border: 8px solid transparent;
                        background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) border-box;
                        background-clip: padding-box;
                        z-index: 9997;
                        pointer-events: none;
                        animation: rainbowPulse 1s ease-in-out;
                        box-sizing: border-box;
                    `;
                    document.body.appendChild(rainbowBorder);
                    
                    setTimeout(() => {
                        document.body.style.animation = '';
                        if (document.body.contains(flash)) document.body.removeChild(flash);
                        if (document.body.contains(rainbowBorder)) document.body.removeChild(rainbowBorder);
                    }, 800);
                } else if (diamondValue >= 500) {
                    // EPIC - Screen flash and shake
                    document.body.style.animation = 'screenShake 0.4s ease-in-out';
                    
                    const flash = document.createElement('div');
                    flash.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: radial-gradient(circle, rgba(255, 68, 68, 0.5) 0%, transparent 60%);
                        z-index: 9998;
                        pointer-events: none;
                        animation: flashEffect 0.4s ease-out;
                    `;
                    document.body.appendChild(flash);
                    setTimeout(() => {
                        document.body.style.animation = '';
                        if (document.body.contains(flash)) document.body.removeChild(flash);
                    }, 400);
                } else if (diamondValue >= 100) {
                    // RARE - Subtle purple flash
                    const flash = document.createElement('div');
                    flash.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: rgba(170, 68, 255, 0.2);
                        z-index: 9998;
                        pointer-events: none;
                        animation: flashEffect 0.2s ease-out;
                    `;
                    document.body.appendChild(flash);
                    setTimeout(() => {
                        if (document.body.contains(flash)) document.body.removeChild(flash);
                    }, 200);
                }
            }, 100);

            // Schedule removal
            const removalTimer = setTimeout(() => {
                removePopup(nextGift.id);
                // Clean up combo data after popup is removed
                if (nextGift.comboKey) {
                    setTimeout(() => {
                        setGiftCombos(prev => {
                            const newCombos = { ...prev };
                            delete newCombos[nextGift.comboKey];
                            return newCombos;
                        });
                    }, 1000); // Give a 1 second grace period after removal
                }
                // Clean up timer reference
                setPopupTimers(prev => {
                    const newTimers = { ...prev };
                    delete newTimers[nextGift.id];
                    return newTimers;
                });
            }, duration);
            
            // Store timer reference
            setPopupTimers(prev => {
                const newTimers = {
                    ...prev,
                    [nextGift.id]: removalTimer
                };
                console.log(`Stored initial timer for popup ${nextGift.id}, duration: ${duration}ms`);
                return newTimers;
            });
        }
    }, [isBossBattle, queue.length, activePopups.length]); // Use lengths to prevent object comparison loops

    const calculateDuration = (diamondValue) => {
        // Higher value gifts stay longer on screen
        if (diamondValue >= 1000) return 8000; // 8 seconds for legendary
        if (diamondValue >= 500) return 6000;  // 6 seconds for epic
        if (diamondValue >= 100) return 5000;  // 5 seconds for rare
        if (diamondValue >= 50) return 4000;   // 4 seconds for uncommon
        return POPUP_DURATION; // 3 seconds for common
    };

    const removePopup = useCallback((giftId) => {
        setActivePopups(prev => 
            prev.map(popup => 
                popup.id === giftId 
                    ? { ...popup, isVisible: false, isRemoving: true }
                    : popup
            )
        );

        // Actually remove after animation
        setTimeout(() => {
            setActivePopups(prev => prev.filter(popup => popup.id !== giftId));
            if (onGiftProcessed) {
                onGiftProcessed(giftId);
            }
        }, 500);
    }, [onGiftProcessed]);
    
    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            // Clean up all timers when component unmounts
            Object.values(popupTimers).forEach(timer => {
                if (timer) clearTimeout(timer);
            });
        };
    }, []); // Empty dependency to only run on unmount
    
    // Clean up old processed gift IDs periodically to prevent memory leaks
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            // Keep only gift IDs from the last 30 seconds
            if (gifts && gifts.length > 0) {
                const recentGiftIds = new Set(
                    gifts
                        .filter(gift => gift.timestamp && (Date.now() - gift.timestamp) < 30000)
                        .map(gift => gift.id)
                );
                setProcessedGiftIds(recentGiftIds);
            }
        }, 30000); // Run cleanup every 30 seconds
        
        return () => clearInterval(cleanupInterval);
    }, [gifts]);

    const getGiftTier = (diamondValue) => {
        if (diamondValue >= 1000) return 'legendary';
        if (diamondValue >= 500) return 'epic';
        if (diamondValue >= 100) return 'rare';
        if (diamondValue >= 50) return 'uncommon';
        return 'common';
    };

    const getThankYouMessage = (diamondValue) => {
        if (diamondValue >= 1000) return 'LEGENDARY GENEROSITY! 🏆';
        if (diamondValue >= 500) return 'EPIC CONTRIBUTION! 🎉';
        if (diamondValue >= 100) return 'Amazing support! 🌟';
        if (diamondValue >= 50) return 'Thank you so much! 💖';
        return 'Thanks for feeding Toothless! 🐉';
    };

    const getTierHue = (diamondValue) => {
        if (diamondValue >= 1000) return '45'; // Gold
        if (diamondValue >= 500) return '0';   // Red
        if (diamondValue >= 100) return '270'; // Purple
        if (diamondValue >= 50) return '120';  // Green
        return '200'; // Blue
    };

    const getPopupHeight = (diamondValue) => {
        if (diamondValue >= 1000) return '95px';  // Legendary - tallest
        if (diamondValue >= 500) return '85px';   // Epic - taller
        if (diamondValue >= 100) return '80px';   // Rare - slightly taller
        if (diamondValue >= 50) return '78px';    // Uncommon - a bit taller
        return '75px'; // Common - standard height
    };

    const getGiftImage = (gift) => {
        // Return emoji fallbacks only - actual images are handled separately
        const giftEmojis = {
            'Rose': '🌹',
            'Heart': '❤️',
            'Heart Me': '💗',
            'Love you': '💖',
            'Ice Cream': '🍦',
            'Cake': '🎂',
            'Diamond': '💎',
            'Crown': '👑',
            'Star': '⭐',
            'Fire': '🔥',
            'Lightning': '⚡',
            'Rainbow': '🌈',
            'Unicorn': '🦄',
            'Dragon': '🐲',
            'Lion': '🦁',
            'Rocket': '🚀',
            'Doughnut': '🍩',
            'Perfume': '🌸',
            'XL Flowers': '💐',
            'Flowers': '🌺',
            'Coffee': '☕',
            'Pizza': '🍕'
        };

        // Try to match gift name to emoji
        const giftName = gift.giftName || '';
        for (const [key, emoji] of Object.entries(giftEmojis)) {
            if (giftName.toLowerCase().includes(key.toLowerCase())) {
                return emoji;
            }
        }

        // Default gift emoji
        return '🎁';
    };

    return (
        <div className="gift-popup-queue">
            {/* Show paused indicator during boss battles */}
            {isBossBattle && (pausedDuringBattle.length > 0 || queue.length > 0) && (
                <div className="battle-pause-indicator">
                    🐉 Gift recognition paused during boss battle - will resume after! 
                    ({pausedDuringBattle.length + queue.length} pending)
                </div>
            )}
            
            {activePopups.map((gift, index) => (
                <div
                    key={gift.id}
                    className={`tiktok-gift-popup ${getGiftTier(gift.diamondValue || 1)} ${gift.isComboActive ? 'combo-receiving' : ''} ${
                        gift.isVisible ? 'visible' : ''
                    } ${gift.isRemoving ? 'removing' : ''}`}
                    style={{
                        '--popup-index': index,
                        '--popup-delay': `${index * 0.1}s`,
                        '--tier-hue': getTierHue(gift.diamondValue || 1),
                        height: getPopupHeight(gift.diamondValue || 1)
                    }}
                >
                    {/* DOPAMINE-MAXIMIZING TikTok Layout */}
                    <div className="popup-content">
                        {/* PROMINENT User Section - Left Side */}
                        <div className="user-section">
                            <div className="user-avatar-large">
                                {gift.profilePicture ? (
                                    <img 
                                        src={gift.profilePicture} 
                                        alt={gift.user || 'User'}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className="avatar-fallback-large" style={{display: gift.profilePicture ? 'none' : 'flex'}}>
                                    👤
                                </div>
                                {/* Avatar glow effect */}
                                <div className="avatar-glow"></div>
                            </div>
                            
                            {/* HUGE USERNAME - Main dopamine trigger */}
                            <div className={`username-hero ${gift.uniqueId && !gift.uniqueId.includes('demo') ? 'real-user' : 'demo-user'}`}>
                                {gift.user || gift.nickname || gift.uniqueId || 'TEST USER'}
                            </div>
                            <div className="sent-text">sent a gift!</div>
                        </div>

                        {/* Center: Gift Visual */}
                        <div className="gift-section">
                            <div className="gift-visual-large">
                                {gift.giftPictureUrl ? (
                                    <img 
                                        src={gift.giftPictureUrl} 
                                        alt={gift.giftName || 'Gift'}
                                        className="gift-image-large"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                <span 
                                    className="gift-emoji-large" 
                                    style={{display: gift.giftPictureUrl ? 'none' : 'block'}}
                                >
                                    {getGiftImage(gift)}
                                </span>
                            </div>
                            <div className="gift-info-compact">
                                <div className="gift-name-bold">{gift.giftName || 'Gift'}</div>
                            </div>
                        </div>

                        {/* Right: Value with Emphasis */}
                        <div className="value-section">
                            <div className="diamond-count-large">
                                💎{gift.comboValue || ((gift.diamondValue || 1) * (gift.giftCount || gift.repeatCount || 1))}
                            </div>
                            <div className="thank-you-mini">Thank you!</div>
                        </div>
                    </div>

                    {/* Explosive Effects Based on Value */}
                    {(gift.diamondValue || 1) >= 1000 && (
                        <div className="mega-effects">
                            <div className="explosion-ring"></div>
                            <div className="mega-sparkles">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className={`mega-sparkle mega-sparkle-${i}`}>✨</div>
                                ))}
                            </div>
                            <div className="mega-fireworks">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className={`mega-firework mega-firework-${i}`}>🎆</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(gift.diamondValue || 1) >= 500 && (gift.diamondValue || 1) < 1000 && (
                        <div className="epic-effects">
                            <div className="epic-burst"></div>
                            <div className="epic-sparkles">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className={`epic-sparkle epic-sparkle-${i}`}>⭐</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(gift.diamondValue || 1) >= 100 && (gift.diamondValue || 1) < 500 && (
                        <div className="rare-effects">
                            <div className="rare-glow"></div>
                            <div className="rare-sparkles">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className={`rare-sparkle rare-sparkle-${i}`}>✨</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(gift.diamondValue || 1) >= 50 && (gift.diamondValue || 1) < 100 && (
                        <div className="uncommon-effects">
                            <div className="uncommon-shimmer"></div>
                        </div>
                    )}

                    {/* Pulsing border for all gifts */}
                    <div className="pulse-border"></div>
                    
                    {/* Epic Hit Counter - positioned at top right */}
                    {(gift.comboCount || gift.giftCount || gift.repeatCount) > 1 && (
                        <div className={`epic-hit-counter ${gift.comboCount >= 10 ? 'epic-combo' : gift.comboCount >= 5 ? 'mega-combo' : 'combo'}`}>
                            <span className="combo-multiplier">x{gift.comboCount || gift.giftCount || gift.repeatCount}</span>
                            <span className="combo-hit-text">HIT!</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

GiftPopupQueue.propTypes = {
    gifts: PropTypes.array,
    onGiftProcessed: PropTypes.func,
};

export default GiftPopupQueue;
