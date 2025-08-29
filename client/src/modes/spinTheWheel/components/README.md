# Spinning Wheel Canvas Component

A high-performance, Canvas-based spinning wheel component built with React. Optimized for handling 0-1000 entries with dynamic readability tiers and smooth animations.

## 🎯 Key Features

### Three Readability Tiers
1. **0-24 entries**: All labels visible on wheel
2. **25-80 entries**: Windowed labels (only visible near pointer)
3. **81-1000 entries**: Outer label ring with leader lines

### Performance Optimizations
- HTML5 Canvas rendering at 60 FPS
- Offscreen canvas caching for segments
- Device pixel ratio support
- Efficient text rendering with binary search sizing
- Automatic ellipsis for long usernames

### Advanced Features
- **Weighted Entries**: Support for different entry weights
- **Deterministic Randomness**: Optional seed for reproducible spins
- **External Control**: API for predetermined winners
- **Micro-jitter**: ±0.5° randomness to prevent edge cases
- **Responsive Design**: Adapts to container size
- **Accessibility**: ARIA live regions for announcements

## 📦 Component Props

```jsx
<SpinningWheelCanvas 
  entries={[
    {
      id: 'user123',
      username: 'JohnDoe',
      profilePicture: 'url',
      weight: 1 // optional, defaults to 1
    }
  ]}
  isSpinning={false}
  onSpinComplete={(winner) => {
    // winner object contains:
    // - username
    // - profilePicture
    // - totalEntries
    // - source
    // - timestamp
  }}
  seed={12345} // optional, for deterministic spins
  externalSpinResult={{ 
    winnerId: 'user123', 
    seed: 12345 
  }} // optional, for predetermined winners
/>
```

## 🎨 Visual Design

### Color System
- Vibrant predefined colors for first 20 entries
- Golden angle distribution for 20+ entries
- HSL color generation with optimal saturation/lightness

### Ring Design
- Dynamic ring thickness based on entry count
- Gradient fills for depth
- White borders between segments
- Decorative outer ring and center circle

### Animations
- Smooth 7-10 second spin duration
- easeOutQuint easing function
- 12-20 full rotations
- Winner highlight effects

## 🚀 Performance Characteristics

### Entry Count Performance
- **0-100 entries**: Instant rendering, all features enabled
- **100-500 entries**: Fast rendering, optimized labels
- **500-1000 entries**: Good performance, minimal labels

### Memory Usage
- Segment caching reduces redraw overhead
- Offscreen canvas for complex operations
- Automatic cache clearing on segment changes

### Mobile Optimization
- Touch-friendly design
- Responsive sizing
- Reduced animations on low-end devices

## 🛠️ Implementation Details

### Canvas Architecture
```javascript
// Main canvas for display
<canvas ref={canvasRef} />

// Offscreen canvas for caching
offscreenCanvas = document.createElement('canvas');

// Segment cache for performance
segmentCache = new Map();
```

### Text Rendering Strategy
1. Calculate available arc length
2. Binary search for optimal font size
3. Ellipsize if text still too long
4. Apply shadow for readability

### Fairness Algorithm
```javascript
// Equal probability per entry
const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
const randomValue = Math.random() * totalWeight;

// Find winning segment
let accumulated = 0;
for (const segment of segments) {
  accumulated += segment.weight;
  if (randomValue <= accumulated) {
    return segment;
  }
}
```

## 📱 Responsive Behavior

### Breakpoints
- **Desktop (>768px)**: Full size wheel with all features
- **Tablet (480-768px)**: Scaled wheel, adjusted fonts
- **Mobile (<480px)**: Compact wheel, simplified labels

### Container Adaptation
- Automatically fits container
- Maintains aspect ratio
- Maximum size: 1000x1000px

## ♿ Accessibility

### ARIA Support
- Live regions for spin progress
- Winner announcements
- Keyboard navigation ready

### Motion Preferences
- Respects `prefers-reduced-motion`
- High contrast mode support
- Screen reader friendly

## 🔧 Customization

### Styling
The component uses CSS classes that can be overridden:
- `.spinning-wheel-canvas-container`
- `.wheel-canvas`
- `.now-passing-label`
- `.winner-banner`

### Configuration
Modify the `config` object for different behaviors:
```javascript
const config = {
  renderMode: 'all-labels',
  ringThickness: 120,
  maxVisibleLabels: 16,
  fontSize: { min: 8, max: 24 },
  animationDuration: 7000,
  rotations: 15,
  microJitter: 0.5
};
```

## 🐛 Troubleshooting

### Common Issues
1. **Blurry text**: Ensure device pixel ratio is considered
2. **Poor performance**: Reduce entry count or disable animations
3. **Labels overlapping**: Automatic ellipsis should handle this

### Debug Mode
Set `NODE_ENV=development` to see:
- FPS counter during animations
- Console logs for segment generation
- Performance metrics

## 📈 Future Enhancements

Potential improvements:
- WebGL rendering for 1000+ entries
- Sound effects integration
- Custom segment shapes
- Animation presets
- Multi-winner support
- Prize distribution modes
