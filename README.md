# Neural Cellular Automata Demo

A retro-themed React website showcasing Neural Cellular Automata that grow pixel art trees from a single seed cell. The CA has 18 channels per cell and uses TensorFlow.js to run neural network updates in the browser.

## Features

- **Phase 2: Fertilizer Control** - Adjust fertilizer level (0–1) to grow sparse to bushy trees
- **Phase 3: Fertilizer + Sun Direction** - Add directional sunlight to make trees lean toward the sun
- **Interactive Canvas** - Click to damage cells, Shift+Click to plant seeds
- **Retro Terminal Aesthetic** - Dark theme with green text and scanline effects
- **Client-Side Only** - Runs entirely in the browser using TensorFlow.js

## Project Structure

```
src/
├── components/
│   ├── DemoCanvas.jsx       # Main canvas renderer and interaction handler
│   ├── Controls.jsx          # Fertilizer and sun direction sliders
│   ├── PhaseSelector.jsx    # Phase tabs (2 vs 3)
│   ├── ExplanationCard.jsx  # Reusable explanation card
│   └── Sidebar.jsx          # 6 background explanation cards
├── hooks/
│   └── useNCA.js            # TensorFlow.js CA logic, state, rendering
├── lib/
│   └── parseConsts.js       # Utility for frozen graph constants
├── App.jsx
├── main.jsx
└── index.css
```

## Development

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Build & Deploy

Build for production:
```bash
npm run build
```

Deploy to Vercel:
```bash
npm i -g vercel
vercel
```

The dist/ folder contains the production build, ready for static hosting.

## Model Files

Place trained TensorFlow.js models in `public/models/`:
- `p2_final.json` - Phase 2 (Fertilizer only)
- `p3_final.json` - Phase 3 (Fertilizer + Sun Direction)

Both are graph models with inputs: `x`, `fire_rate`, `angle`, `step_size` and output: `Identity`

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **TensorFlow.js** - In-browser neural network execution
- **Lucide React** - Icons (no emoji)
