# Neural Cellular Automata Demo - Development Guide

## Project Overview

A retro-themed React + Vite + TensorFlow.js web application demonstrating Neural Cellular Automata (NCA) that grow pixel art trees from a single seed cell. The system has 18 channels per cell and uses a neural network (54→256→18) to compute state updates.

## Architecture

### State Management
- **useNCA Hook** (`src/hooks/useNCA.js`): Core TensorFlow.js logic
  - Manages tensor lifecycle (creation, disposal, updates)
  - Implements step function (neural network forward pass)
  - Handles environmental signal injection (channels 16 & 17)
  - Provides canvas rendering and interaction methods

### Components
1. **App.jsx** - Main layout (sidebar + main content)
2. **DemoCanvas.jsx** - Canvas rendering + interaction handler
3. **Controls.jsx** - Fertilizer and sun direction sliders
4. **PhaseSelector.jsx** - Phase tabs
5. **Sidebar.jsx** - 6 explanation cards
6. **ExplanationCard.jsx** - Reusable card component

### Canvas System
- **Grid**: 104×104 pixels
- **Channels**: 18 per cell (channel 0 = alive/alpha)
- **Rendering**: Channel 0 determines visibility (white bg → green fg)
- **Scale**: Renders at 5x for 520×520px display

## How It Works

### Phase 2: Fertilizer Control
1. User adjusts fertilizer slider (0-1)
2. `injectSignals` sets channel 16 = fertilizer (uniform across grid)
3. Model forward pass with injected channels
4. Channel 0 output determines cell visibility

### Phase 3: Fertilizer + Sun Direction
1. Fertilizer slider sets channel 16 (uniform)
2. Sun direction slider (-1 to +1) creates tapered gradient
3. `injectSignals` creates channel 17 with gradient:
   - `sunDir * ramp * taper`
   - Left edge = -sunDir, right edge = +sunDir
   - Tapered at edges to prevent artifacts
4. Model perceives gradient through Sobel filters
5. Learns to lean tree toward sunlight

## Key Implementation Details

### Tensor Management
```javascript
// Always dispose old tensors before assigning new ones
if (stateRef.current) stateRef.current.dispose();
stateRef.current = newTensor;

// Use tf.tidy for automatic cleanup in scoped operations
return tf.tidy(() => {
  // Operations here
  return result;
});
```

### Environmental Signal Injection
- Channel 16: Uniform scalar (fertilizer)
- Channel 17: 2D gradient (sun direction)
- Both injected before each model step
- Original 16 channels + 2 signal channels = 18 total

### Canvas Rendering
- Extract channel 0 (alpha/alive) for each cell
- Map to color: white (dead) → green (alive)
- Use gamma correction for better visibility
- Apply CSS filter for contrast/saturation boost

## Important Constraints

1. **Model Execution**
   - Models must have inputs: `x`, `fire_rate`, `angle`, `step_size`
   - Models must output: `Identity` (18-channel state)
   - Graph models (not saved_model format)

2. **Tensor Shapes**
   - State: [104, 104, 18]
   - All operations assume this shape
   - Changing grid size requires refactoring

3. **CSS Styling**
   - Canvas: `image-rendering: pixelated`
   - No emoji - use Lucide React icons
   - Retro colors: #0a0a0a (bg), #7fff7f (green), #ffcc00 (amber)

## Testing Checklist

- [ ] Dev server runs: `npm run dev`
- [ ] Build succeeds: `npm run build`
- [ ] Canvas renders white background on load
- [ ] Phase 2 slider affects tree density
- [ ] Phase 3 sun slider affects tree lean
- [ ] Phase switching disposes old resources
- [ ] Click damages cells (creates dark area)
- [ ] Shift+click plants new seed
- [ ] Reset button clears grid
- [ ] No console errors
- [ ] Memory stable over time (no leaks)

## Common Issues & Solutions

### Models Not Loading
- Check file paths: `public/models/p2_final.json`
- Verify JSON format (valid TensorFlow.js graph model)
- Check browser console for CORS or parse errors

### Canvas Stays White
- Model may not be trained to produce alive cells
- Check if channel 0 output is non-zero
- Verify render function receives non-null state

### Memory Leaks
- Ensure all tensors are disposed
- Check that phase switching properly cleans up
- Use Chrome DevTools Memory profiler

### Slow Animation
- Reduce render scale (fewer pixels)
- Increase animation interval (reduce FPS)
- Check model size (large models = slow inference)

## Future Enhancements

1. **Advanced Interactions**
   - Paint mode (drag to draw)
   - Multiple brush sizes
   - Color picker for rendering

2. **Performance**
   - Worker threads for model execution
   - Dynamic resolution scaling
   - Model quantization

3. **Visualization**
   - Channel inspection (view individual channels)
   - Recording and playback
   - Export as image/video

4. **Training**
   - In-browser training UI
   - Custom target shapes
   - Hyperparameter tuning

## Dependencies

- **React 19**: UI framework with hooks
- **Vite 8**: Build tool with HMR
- **Tailwind CSS v4**: Utility-first styling
- **TensorFlow.js 4.22**: In-browser ML
- **Lucide React 1.14**: Icon library

All dependencies are up-to-date as of May 2026.
