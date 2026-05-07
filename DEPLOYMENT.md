# Deployment Guide

## Vercel Deployment

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to connect your GitHub repository or deploy from the current directory.

### Option 2: Connect via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import the GitHub repository
4. Vercel will auto-detect Vite and set up the build configuration
5. Click "Deploy"

### Environment Variables

No environment variables are needed for this project (client-side only).

## Build Optimization

The bundle includes TensorFlow.js (large library). To reduce the bundle size:

1. Dynamic imports for TensorFlow.js:
```javascript
const tf = await import('@tensorflow/tfjs');
```

2. Use TensorFlow.js via CDN instead (add to index.html):
```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
```

Then remove from package.json and update imports.

## Model Files

Place the trained CA models in `public/models/`:
- `p2_final.json` - Phase 2 model
- `p3_final.json` - Phase 3 model

These will be automatically served from the `/public` folder on Vercel.

## Performance Considerations

1. **Canvas Rendering**: Currently renders at 104×104px and scales to 520×520px (5x)
2. **Frame Rate**: Animation runs at requestAnimationFrame speed (~60fps)
3. **Memory**: TensorFlow.js tensors are disposed properly to prevent memory leaks
4. **Model Loading**: Happens on component mount (may take 5-15 seconds for 5-15MB models)

## Troubleshooting

### Models Not Loading
- Check that model JSON files are in `/public/models/`
- Verify CORS headers are correct (shouldn't be an issue on Vercel)
- Check browser console for specific errors

### Performance Issues
- Reduce animation frame rate by adding delays to requestAnimationFrame
- Increase canvas scale (reduces number of pixels to render)
- Profile with DevTools Performance tab

### Canvas Not Rendering
- Check that TensorFlow.js loads correctly
- Verify canvas context is 2D: `ctx = canvas.getContext('2d')`
- Ensure imageData dimensions match canvas size

## Production Checklist

- [ ] Models placed in `public/models/`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in dev: `npm run dev`
- [ ] Vercel deployment configured
- [ ] Models load correctly on deployed site
- [ ] Canvas renders without artifacts
- [ ] Sliders update correctly
- [ ] Phase switching works
- [ ] Click interactions (damage/plant) function
