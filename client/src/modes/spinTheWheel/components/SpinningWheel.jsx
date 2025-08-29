import { useEffect, useRef, useState } from 'react';
import { Wheel } from 'spin-wheel';
import './SpinningWheel.css';

const SpinningWheel = ({ 
  entries = [], 
  isSpinning = false, 
  onSpinComplete,
  externalSpinResult = null // { winnerId, seed? }
}) => {
  const containerRef = useRef(null);
  const wheelRef = useRef(null);
  const [winner, setWinner] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [newEntryEffect, setNewEntryEffect] = useState(null);

  // Generate alternating vibrant colors for better contrast
  const generateVibrantColor = (index, total) => {
    // Define color pairs that alternate for maximum contrast
    const colorPairs = [
      ['#FF0080', '#00FFFF'], // Hot pink & Cyan
      ['#FFD700', '#9C27B0'], // Gold & Purple
      ['#00FF00', '#FF4500'], // Lime & Orange
      ['#FF1493', '#1E90FF'], // Deep pink & Blue
      ['#FFFF00', '#E91E63'], // Yellow & Pink
      ['#4CAF50', '#FF5722'], // Green & Red-orange
      ['#00CED1', '#FF6347'], // Turquoise & Tomato
      ['#8BC34A', '#9370DB'], // Light green & Medium purple
    ];
    
    // Pick alternating colors from pairs
    const pairIndex = Math.floor(index / 2) % colorPairs.length;
    const colorIndex = index % 2;
    
    return colorPairs[pairIndex][colorIndex];
  };

  // Process entries into wheel items
  const getWheelItems = () => {
    if (entries.length === 0) return [];
    
    // Group entries by username and calculate weights
    const userGroups = {};
    entries.forEach(entry => {
      if (!userGroups[entry.username]) {
        userGroups[entry.username] = {
          username: entry.username,
          profilePicture: entry.profilePicture || '',
          entries: [],
          weight: 0
        };
      }
      userGroups[entry.username].entries.push(entry);
      userGroups[entry.username].weight += (entry.weight || 1);
    });
    
    // Convert to wheel items with balanced weights
    const items = Object.values(userGroups);
    
    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    
    // Sort items by weight to ensure proper scaling
    items.sort((a, b) => b.weight - a.weight);
    
    // Apply smart scaling to prevent extreme domination
    return items.map((group, index) => {
      let displayWeight = group.weight;
      const weightPercentage = group.weight / totalWeight;
      
      // Progressive scaling based on dominance
      if (weightPercentage > 0.5) {
        // If someone has more than 50%, cap their visual size
        displayWeight = totalWeight * 0.35; // Cap at 35% visual size
      } else if (weightPercentage > 0.3) {
        // Scale down proportionally
        displayWeight = group.weight * 0.7;
      } else if (weightPercentage > 0.2) {
        // Slight scaling
        displayWeight = group.weight * 0.85;
      }
      
      // Boost small entries for visibility
      if (weightPercentage < 0.05 && totalWeight > 20) {
        // Ensure minimum 3% visual size for small entries
        displayWeight = Math.max(displayWeight, totalWeight * 0.03);
      }
      
      return {
        label: group.weight > 1 ? `${group.username} (${group.weight})` : group.username,
        value: group.username,
        weight: Math.max(1, Math.round(displayWeight)),
        originalWeight: group.weight, // Keep original for fairness
        backgroundColor: generateVibrantColor(index, items.length),
        labelColor: '#ffffff'
      };
    });
  };

  // Trigger entry effect when entries change
  useEffect(() => {
    if (entries.length > 0) {
      setNewEntryEffect(true);
      const timer = setTimeout(() => setNewEntryEffect(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [entries.length]);

  // Create animated pointer with dynamic effects - positioned to touch wheel edge
  const createAnimatedPointer = () => {
    const canvas = document.createElement('canvas');
    const size = 1000;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Calculate exact wheel positioning
    const centerX = size / 2;
    const centerY = size / 2;
    // The actual wheel radius needs adjustment for proper alignment
    // The wheel has radius 0.88 (88% of container), but we need half of that
    // Also accounting for container padding and actual rendering
    const wheelRadius = size * 0.88 * 0.5 * 0.85; // 0.88 radius * 0.5 for actual radius * 0.85 adjustment factor
    
    // Position pointer to touch the wheel edge exactly
    const pointerTipY = centerY - wheelRadius; // Tip exactly touches wheel edge
    const pointerBaseY = pointerTipY - 100; // Increased pointer length for bigger size
    
    // Outer glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw triangle pointer pointing down - touching wheel (bigger size)
    ctx.beginPath();
    ctx.moveTo(centerX - 65, pointerBaseY); // Left base point (increased from 50 to 65)
    ctx.lineTo(centerX + 65, pointerBaseY); // Right base point (increased from 50 to 65)
    ctx.lineTo(centerX, pointerTipY); // Tip touching wheel
    ctx.closePath();
    
    // Gradient fill
    const pointerGradient = ctx.createLinearGradient(centerX, pointerBaseY, centerX, pointerTipY);
    pointerGradient.addColorStop(0, '#FF1493');
    pointerGradient.addColorStop(0.5, '#FFD700');
    pointerGradient.addColorStop(1, '#FF4500');
    
    ctx.fillStyle = pointerGradient;
    ctx.fill();
    
    // White border for contrast (slightly thicker for bigger pointer)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 7;
    ctx.stroke();
    
    // Inner highlight for depth (scaled proportionally)
    ctx.beginPath();
    ctx.moveTo(centerX - 32, pointerBaseY + 18); // Scaled from 25 to 32
    ctx.lineTo(centerX + 32, pointerBaseY + 18); // Scaled from 25 to 32
    ctx.lineTo(centerX, pointerTipY - 12); // Scaled from 10 to 12
    ctx.closePath();
    
    const triangleHighlight = ctx.createLinearGradient(centerX, pointerBaseY + 18, centerX, pointerTipY - 12);
    triangleHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    triangleHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = triangleHighlight;
    ctx.fill();
    
    // Convert to image
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  };

  // Initialize wheel
  useEffect(() => {
    if (!containerRef.current) {
      console.log('SpinningWheel: Container ref not ready');
      return;
    }

    const items = getWheelItems();
    console.log('SpinningWheel: Initializing with', items.length, 'items');
    
    if (items.length === 0) {
      console.log('SpinningWheel: No items, skipping wheel creation');
      return;
    }

    // Clean up existing wheel
    if (wheelRef.current) {
      console.log('SpinningWheel: Removing existing wheel');
      wheelRef.current.remove();
      wheelRef.current = null;
    }

    // Clear container
    containerRef.current.innerHTML = '';

    // Force container dimensions to be correct
    const containerBounds = containerRef.current.getBoundingClientRect();
    console.log('SpinningWheel: Container dimensions:', containerBounds.width, 'x', containerBounds.height);

    // Create wheel with enhanced configuration
    const props = {
      items: items,
      radius: 0.88,
      itemBackgroundColors: items.map(item => item.backgroundColor),
      itemLabelColors: ['#ffffff'],
      itemLabelFont: '"Comic Sans MS", "Comic Sans", cursive',
      itemLabelFontSizeMax: 18,
      itemLabelRadius: 0.65,
      itemLabelRadiusMax: 0.35,
      itemLabelRotation: 0,
      itemLabelAlign: 'center',
      itemLabelBaselineOffset: 0,
      // Thicker text stroke for better readability
      itemLabelStrokeColor: '#000000',
      itemLabelStrokeWidth: 2,
      lineColor: '#ffffff',
      lineWidth: 3,
      rotationSpeedMax: 600,
      rotationResistance: -120,
      offset: 0,
      pointerAngle: 0, // Pointer at top (12 o'clock)
      onRest: (event) => {
        const winningItem = items[event.currentIndex];
        if (winningItem) {
          handleWinnerSelected(winningItem);
        }
        setIsAnimating(false);
      },
      onSpin: () => {
        setIsAnimating(true);
        setWinner(null);
        // Trigger confetti or effects here
      },
      // overlayImage: createAnimatedPointer(), // Disabled - using CSS pointer instead
      isInteractive: false,
    };

    // Create new wheel
    try {
      wheelRef.current = new Wheel(containerRef.current, props);
      console.log('SpinningWheel: Wheel created successfully');
      
      // Force a resize to ensure proper sizing
      setTimeout(() => {
        if (wheelRef.current && wheelRef.current.resize) {
          wheelRef.current.resize();
          console.log('SpinningWheel: Wheel resized');
        }
      }, 100);
    } catch (error) {
      console.error('SpinningWheel: Error creating wheel:', error);
    }

    return () => {
      if (wheelRef.current) {
        wheelRef.current.remove();
        wheelRef.current = null;
      }
    };
  }, [entries]);

  // Handle winner selection
  const handleWinnerSelected = (winningItem) => {
    const winnerData = {
      username: winningItem.value,
      totalEntries: winningItem.originalWeight || winningItem.weight, // Use original weight for accuracy
      source: 'spin',
      timestamp: Date.now()
    };
    
    setWinner(winnerData);
    
    if (onSpinComplete) {
      onSpinComplete(winnerData);
    }
  };

  // Handle spin trigger
  useEffect(() => {
    if (!isSpinning || !wheelRef.current || isAnimating) return;

    const items = getWheelItems();
    if (items.length === 0) return;

    // If we have an external result, spin to that winner
    if (externalSpinResult && externalSpinResult.winnerId) {
      const winnerIndex = items.findIndex(item => item.value === externalSpinResult.winnerId);
      if (winnerIndex !== -1) {
        // Spin to the specific item
        const duration = 4000 + Math.random() * 2000; // 4-6 seconds
        const rotations = 3 + Math.floor(Math.random() * 3); // 3-5 full rotations
        wheelRef.current.spinToItem(winnerIndex, duration, true, rotations, 1);
      } else {
        // Fallback to random spin if winner not found
        wheelRef.current.spin(300 + Math.random() * 200);
      }
    } else {
      // Random spin
      wheelRef.current.spin(300 + Math.random() * 200);
    }
  }, [isSpinning, isAnimating, externalSpinResult]);

  // Render empty state
  if (entries.length === 0) {
    return (
      <div className="spinning-wheel-container empty-state">
        <div className="empty-wheel-placeholder">
          <div className="empty-wheel-circle">
            <span className="empty-wheel-icon">🎯</span>
          </div>
          <h3>Ready to Spin!</h3>
          <p>Add participants to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spinning-wheel-container">
      <div 
        ref={containerRef} 
        className={`wheel-canvas-container ${newEntryEffect ? 'new-entry-effect' : ''}`}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Entry added effect */}
      {newEntryEffect && (
        <div className="entry-added-effect">
          <div className="entry-sparkle sparkle-1">✨</div>
          <div className="entry-sparkle sparkle-2">🌟</div>
          <div className="entry-sparkle sparkle-3">💫</div>
          <div className="entry-sparkle sparkle-4">⭐</div>
        </div>
      )}
      
      {/* Winner Banner */}
      {winner && !isAnimating && (
        <div className="winner-banner" aria-live="assertive">
          <div className="winner-content">
            <div className="winner-emoji">🎉</div>
            <div className="winner-name">{winner.username}</div>
            <div className="winner-entries">({winner.totalEntries} entries)</div>
          </div>
          <div className="confetti-container">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`confetti confetti-${i}`}>🎊</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinningWheel;
