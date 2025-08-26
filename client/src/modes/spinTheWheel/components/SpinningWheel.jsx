import { useEffect, useRef, useState, useCallback } from 'react';
import './SpinningWheel.css';

const SpinningWheel = ({ entries, isSpinning, onSpinComplete }) => {
  const wheelRef = useRef(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [segments, setSegments] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showParticles, setShowParticles] = useState(false);
  const animationRef = useRef(null);
  
  const size = 800;
  const radius = (size / 2) - 40;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Generate vibrant TikTok-style colors
  const generateVibrantColor = (index, total) => {
    const colors = [
      '#FF0050', // TikTok Pink
      '#00F5FF', // Cyan
      '#FFD700', // Gold
      '#FF6B35', // Orange
      '#7B68EE', // Purple
      '#00FF87', // Green
      '#FF1493', // Deep Pink
      '#1E90FF', // Dodger Blue
      '#FF4500', // Red Orange
      '#9370DB', // Medium Purple
      '#00CED1', // Dark Turquoise
      '#FF69B4', // Hot Pink
      '#32CD32', // Lime Green
      '#FF6347', // Tomato
      '#20B2AA', // Light Sea Green
      '#DA70D6', // Orchid
    ];
    
    if (total <= colors.length) {
      return colors[index % colors.length];
    }
    
    // Generate consistent HSL colors for larger arrays
    const hue = (index * 137.5) % 360; // Use golden angle for better distribution
    const saturation = 75 + (index % 3) * 8; // 75-91%
    const lightness = 45 + (index % 4) * 5; // 45-60%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Create wheel segments from entries
  useEffect(() => {
    if (entries.length === 0) {
      setSegments([]);
      return;
    }
    
    // Group entries by username
    const userGroups = {};
    entries.forEach(entry => {
      if (!userGroups[entry.username]) {
        userGroups[entry.username] = {
          username: entry.username,
          profilePicture: entry.profilePicture || '',
          count: 0
        };
      }
      userGroups[entry.username].count++;
      // Update profile picture if we get a newer one
      if (entry.profilePicture && !userGroups[entry.username].profilePicture) {
        userGroups[entry.username].profilePicture = entry.profilePicture;
      }
    });
    
    // Create segments with proper sizing
    const participants = Object.values(userGroups);
    const segmentAngle = 360 / participants.length;
    
    const newSegments = participants.map((participant, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      
      return {
        id: `${participant.username}-${index}`,
        username: participant.username,
        profilePicture: participant.profilePicture,
        count: participant.count,
        color: generateVibrantColor(index, participants.length),
        angle: segmentAngle,
        startAngle,
        endAngle,
      };
    });
    
    setSegments(newSegments);
  }, [entries]);
  
  // Animation utilities
  const easeOutCubic = (t) => {
    return 1 - Math.pow(1 - t, 3);
  };

  const generateSpinDuration = () => {
    return Math.random() * 2000 + 3000; // 3-5 seconds
  };

  const generateSpinRotations = () => {
    return Math.random() * 5 + 8; // 8-13 full rotations
  };

  // Get winner from angle
  const getWinnerFromAngle = (segments, finalAngle) => {
    if (segments.length === 0) return null;
    
    // Normalize angle to 0-360
    const normalizedAngle = ((finalAngle % 360) + 360) % 360;
    
    // The wheel spins clockwise, so we need to find the segment that the pointer hits
    // The pointer is at the top (0 degrees), so we look for the segment at that position
    const targetAngle = (360 - normalizedAngle) % 360;
    
    return segments.find(segment => 
      targetAngle >= segment.startAngle && targetAngle < segment.endAngle
    ) || segments[0];
  };
  
  // Reset rotation when wheel entries change (after a spin completes)
  useEffect(() => {
    if (!isSpinning && entries.length > 0) {
      setCurrentRotation(0);
      setWinner(null);
      setShowParticles(false);
    }
  }, [entries, isSpinning]);
  
  // Spin animation
  useEffect(() => {
    if (!isSpinning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }
    
    setWinner(null);
    setShowParticles(false);
    
    const duration = generateSpinDuration();
    const rotations = generateSpinRotations();
    const finalAngle = currentRotation + (rotations * 360);
    
    let startTime;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentAngle = currentRotation + (rotations * 360 * easedProgress);
      
      setCurrentRotation(currentAngle);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentRotation(finalAngle);
        
        const winningSegment = getWinnerFromAngle(segments, finalAngle);
        if (winningSegment && onSpinComplete) {
          setWinner(winningSegment);
          setShowParticles(true);
          onSpinComplete(winningSegment);
        }
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, currentRotation, segments, onSpinComplete]);
  
  // Particle system component
  const ParticleSystem = ({ active }) => {
    if (!active) return null;
    
    return (
      <div className="particle-system">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              '--delay': `${i * 0.1}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    );
  };

  if (segments.length === 0) {
    return (
      <div className="spinning-wheel-container empty-wheel" style={{ width: size, height: size }}>
        <div className="empty-wheel-content">
          <div 
            className="empty-wheel-circle"
            style={{ width: size, height: size }}
          >
            <div className="empty-wheel-gradient" />
            <div className="empty-wheel-text">
              <div className="ready-emoji">🎯 Ready to Spin!</div>
              <div className="add-participants">Add participants to start</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spinning-wheel-container" style={{ width: size, height: size }}>
      <ParticleSystem active={showParticles} />
      
      <svg
        ref={wheelRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="wheel-svg"
        style={{
          transform: `rotate(${currentRotation}deg)`,
          transition: isSpinning ? 'none' : 'transform 0.5s ease-out',
        }}
      >
        {/* Outer animated border */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 15}
          fill="none"
          stroke="url(#animatedBorder)"
          strokeWidth="8"
          opacity="0.8"
        />
        
        {/* Main border */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 8}
          fill="none"
          stroke="url(#mainBorder)"
          strokeWidth="6"
        />
        
        {/* Inner border */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 2}
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          opacity="0.9"
        />
        
        {/* Wheel segments */}
        {segments.map((segment) => {
          const startAngle = segment.startAngle - 90;
          const endAngle = segment.endAngle - 90;
          const largeArcFlag = segment.angle > 180 ? 1 : 0;
          
          const startRadian = (startAngle * Math.PI) / 180;
          const endRadian = (endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startRadian);
          const y1 = centerY + radius * Math.sin(startRadian);
          const x2 = centerX + radius * Math.cos(endRadian);
          const y2 = centerY + radius * Math.sin(endRadian);
          
          const pathData = `
            M ${centerX} ${centerY}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            Z
          `;
          
          // Calculate content positioning
          const textAngle = (startAngle + endAngle) / 2;
          const textRadian = (textAngle * Math.PI) / 180;
          
          // Position profile picture in the middle area of the slice
          const profileRadius = radius * 0.45;
          const profileX = centerX + profileRadius * Math.cos(textRadian);
          const profileY = centerY + profileRadius * Math.sin(textRadian);
          
          // Position text further out but closer to the edge
          const textRadius = radius * 0.7;
          
          // Calculate dynamic sizing based on segment size and username length
          const segmentWidthAtText = 2 * Math.PI * textRadius * (segment.angle / 360);
          const usernameLength = segment.username.length;
          
          // Dynamic font size based on both segment width and username length
          let fontSize = Math.min(20, Math.max(10, segmentWidthAtText / (usernameLength * 0.7)));
          
          // Adjust for very small segments
          if (segment.angle < 30) {
            fontSize = Math.min(fontSize, 14);
          } else if (segment.angle < 60) {
            fontSize = Math.min(fontSize, 16);
          }
          
          // Profile size scales with segment angle but has reasonable bounds
          const profileSize = Math.min(50, Math.max(20, segment.angle * 1.2));
          
          return (
            <g key={segment.id}>
              {/* Segment path with gradient */}
              <defs>
                <radialGradient id={`gradient-${segment.id}`} cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor={segment.color} stopOpacity="1"/>
                  <stop offset="100%" stopColor={segment.color} stopOpacity="0.8"/>
                </radialGradient>
              </defs>
              
              <path
                d={pathData}
                fill={`url(#gradient-${segment.id})`}
                stroke="#ffffff"
                strokeWidth="3"
                className="wheel-segment"
                style={{
                  filter: winner?.id === segment.id 
                    ? 'brightness(1.8) saturate(2) drop-shadow(0 0 30px rgba(255,255,255,0.9))' 
                    : isSpinning 
                    ? 'brightness(1.3) saturate(1.5) drop-shadow(0 0 10px rgba(255,255,255,0.3))'
                    : 'brightness(1.1) saturate(1.2) drop-shadow(0 0 5px rgba(0,0,0,0.3))',
                }}
              />
              
              {/* Profile picture group positioned in slice center */}
              <g transform={`translate(${centerX}, ${centerY}) rotate(${textAngle})`}>
                {/* Profile picture background circle */}
                <circle
                  cx={profileRadius}
                  cy={0}
                  r={profileSize / 2 + 2}
                  fill="white"
                  stroke={segment.color}
                  strokeWidth="2"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                />
                
                {/* Profile picture */}
                <circle
                  cx={profileRadius}
                  cy={0}
                  r={profileSize / 2}
                  fill={`url(#profile-${segment.id})`}
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                  }}
                />
              </g>
              
              {/* Profile picture pattern */}
              <defs>
                <pattern id={`profile-${segment.id}`} x="0" y="0" width="100%" height="100%">
                  {segment.profilePicture ? (
                    <image 
                      href={segment.profilePicture} 
                      x="0" 
                      y="0" 
                      width="100%" 
                      height="100%" 
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <>
                      <circle cx="50%" cy="50%" r="45%" fill={segment.color} opacity="0.4"/>
                      <text 
                        x="50%" 
                        y="58%" 
                        textAnchor="middle" 
                        fontSize={profileSize * 0.45}
                        fill="white"
                        fontWeight="bold"
                        fontFamily="Arial, sans-serif"
                        style={{
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        {segment.username.charAt(0).toUpperCase()}
                      </text>
                    </>
                  )}
                </pattern>
              </defs>
              
              {/* Username text aligned with radius */}
              <g transform={`translate(${centerX}, ${centerY}) rotate(${textAngle})`}>
                <text
                  x={textRadius}
                  y={-5}
                  fill="white"
                  fontSize={fontSize}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={textAngle > 90 && textAngle < 270 ? `rotate(180, ${textRadius}, -5)` : ''}
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                    filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.9))',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {segment.username}
                </text>
                
                {/* Entry count aligned with radius */}
                <text
                  x={textRadius}
                  y={fontSize * 0.8}
                  fill="rgba(255,255,255,0.9)"
                  fontSize={Math.max(10, fontSize * 0.7)}
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={textAngle > 90 && textAngle < 270 ? `rotate(180, ${textRadius}, ${fontSize * 0.8})` : ''}
                  style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {segment.count} {segment.count === 1 ? 'entry' : 'entries'}
                </text>
              </g>
            </g>
          );
        })}
        
        {/* Center circle with improved design */}
        <circle
          cx={centerX}
          cy={centerY}
          r={size / 8}
          fill="url(#centerGradient)"
          stroke="#ffffff"
          strokeWidth="6"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
          }}
        />
        
        {/* Center logo/icon */}
        <circle
          cx={centerX}
          cy={centerY}
          r={size / 12}
          fill="url(#centerLogoGradient)"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="2"
        />
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY + 5}
          fill="white"
          fontSize={size / 25}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          🎯
        </text>
        
        {/* Gradients and animations */}
        <defs>
          <linearGradient id="animatedBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="25%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="75%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F59E0B" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              values="0 400 400;360 400 400"
              dur="4s"
              repeatCount="indefinite"
            />
          </linearGradient>
          
          <linearGradient id="mainBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
          
          <radialGradient id="centerGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#111827" />
          </radialGradient>
          
          <radialGradient id="centerLogoGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </radialGradient>
        </defs>
      </svg>
      
      {/* Modern Pointer */}
      <div className="wheel-pointer">
        <div className="pointer-glow" />
        <div className="pointer-shadow" />
        <div className="pointer-main" />
        <div className="pointer-highlight" />
      </div>
    </div>
  );
};

export default SpinningWheel;
