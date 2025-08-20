import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useGame } from '../../gameContext';
import './giftPopupQueue.css';

const GiftPopupQueue = ({ gifts, onGiftProcessed }) => {
    const [activePopups, setActivePopups] = useState([]);
    const [queue, setQueue] = useState([]);
    const [pausedDuringBattle, setPausedDuringBattle] = useState([]);
    const MAX_POPUPS = 5;
    const POPUP_DURATION = 6000; // 6 seconds base duration (increased from 4)
    
    // Get game state to detect boss battles
    const { state: gameState } = useGame();
    const isBossBattle = gameState?.phase === 'BOSS';

    // Process new gifts
    useEffect(() => {
        if (gifts && gifts.length > 0) {
            const newGifts = gifts.filter(gift => 
                !activePopups.some(popup => popup.id === gift.id) &&
                !queue.some(queuedGift => queuedGift.id === gift.id)
            );

            if (newGifts.length > 0) {
                console.log('Gift popup data:', newGifts[0]); // Debug the gift data
                setQueue(prev => [...prev, ...newGifts]);
            }
        }
    }, [gifts, activePopups, queue]);

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
            // Boss battle ended - resume paused popups
            if (pausedDuringBattle.length > 0) {
                console.log('Boss battle ended - resuming gift popups');
                setQueue(prev => [...pausedDuringBattle, ...prev]);
                setPausedDuringBattle([]);
            }
        }
    }, [isBossBattle]); // Simplified dependency array to prevent loops

    // Process queue when space is available and not in boss battle
    useEffect(() => {
        if (!isBossBattle && queue.length > 0 && activePopups.length < MAX_POPUPS) {
            const nextGift = queue[0];
            setQueue(prev => prev.slice(1));
            
            // Calculate duration based on gift value
            const duration = calculateDuration(nextGift.diamondValue || 1);
            
            const popupData = {
                ...nextGift,
                startTime: Date.now(),
                duration: duration,
                isVisible: false
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
            setTimeout(() => {
                removePopup(nextGift.id);
            }, duration);
        }
    }, [isBossBattle, queue, activePopups]);

    const calculateDuration = (diamondValue) => {
        // Higher value gifts stay longer - increased all durations
        if (diamondValue >= 1000) return 12000; // 12 seconds for very high value (was 8)
        if (diamondValue >= 500) return 10000;  // 10 seconds for high value (was 6.5)
        if (diamondValue >= 100) return 8000;   // 8 seconds for medium value (was 5.5)
        if (diamondValue >= 50) return 7000;    // 7 seconds for low-medium value (was 5)
        return 6000; // 6 seconds for low value (was 4)
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
                    className={`tiktok-gift-popup ${getGiftTier(gift.diamondValue || 1)} ${
                        gift.isVisible ? 'visible' : ''
                    } ${gift.isRemoving ? 'removing' : ''}`}
                    style={{
                        '--popup-index': index,
                        '--popup-delay': `${index * 0.1}s`,
                        '--tier-hue': getTierHue(gift.diamondValue || 1)
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
                                {(gift.giftCount || gift.repeatCount) > 1 && (
                                    <div className="gift-count-large">x{gift.giftCount || gift.repeatCount}</div>
                                )}
                            </div>
                        </div>

                        {/* Right: Value with Emphasis */}
                        <div className="value-section">
                            <div className="diamond-count-large">
                                💎{(gift.diamondValue || 1) * (gift.giftCount || gift.repeatCount || 1)}
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
