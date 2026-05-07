# Exporting Trained Models to TensorFlow.js

This guide explains how to convert your trained Keras CA models to TensorFlow.js JSON format for use in the React demo.

## Prerequisites

You must have:
- Trained model weights: `p2_final.weights.h5` and `p3_final.weights.h5`
- Your `CAModel` class definition (from your training notebook)
- TensorFlow installed: `pip install tensorflow`

## Export Process

### 1. Prepare `export_models.py`

The script `export_models.py` is already in the repo. Edit it to import your `CAModel` class:

```python
# Option A: If CAModel is in a separate file
from ca_model import CAModel

# Option B: If CAModel is defined inline, copy the class into export_models.py
class CAModel(tf.keras.Model):
    # ... your model code ...
```

### 2. Place Weights Files

Put your trained weights in the repo root:
```
nca_demo/
├── p2_final.weights.h5
├── p3_final.weights.h5
└── export_models.py
```

### 3. Run Export

```bash
python export_models.py
```

This will:
- Load each weights file
- Freeze the graph (convert variables to constants)
- Convert the graph_def to JSON
- Write `public/models/p2_final.json` and `public/models/p3_final.json`

Output will look like:
```
============================================================
Exporting Phase 2 (Fertilizer) Model
============================================================
📦 Loading weights from p2_final.weights.h5...
✓ Weights loaded
🔧 Creating concrete function...
❄️  Freezing graph constants...
📝 Converting to JSON...
💾 Writing to public/models/p2_final.json...
✓ Exported successfully (8.5 MB)

============================================================
✓ All models exported!
============================================================
```

### 4. Verify Export

The JSON files should be 5–15 MB each. Check:
```bash
ls -lh public/models/
# Should show p2_final.json and p3_final.json
```

### 5. Test in Browser

```bash
npm run dev
```

Open http://localhost:5173 and:
- Phase 2 should grow a tree that responds to the fertilizer slider
- Phase 3 should grow a tree that leans toward the sun direction slider

## Troubleshooting

**"Could not import CAModel"**
- Add your CAModel class definition to `export_models.py`
- Or place your training script in the same directory and import from it

**"Failed to load weights"**
- Check that `p2_final.weights.h5` and `p3_final.weights.h5` exist
- Verify they're valid Keras model weights files
- Check file paths are correct

**Models load but canvas stays white**
- Check browser console for errors
- Verify model output shape is `[1, 104, 104, 18]`
- Try rendering with a simple test tensor first

**File is very large (>20MB)**
- This is normal for models with millions of parameters
- You can optimize by quantizing the JSON (separate step)

## Model Architecture Requirements

The export script expects:
- Model inputs: `x` [1, H, W, 18], `fire_rate` (scalar), `angle` (scalar), `step_size` (scalar)
- Model output: `Identity` tensor of shape [1, H, W, 18]
- All weights frozen (converted to constants in the graph)

## What Happens in the Browser

Once the JSON is exported and placed in `public/models/`:

1. The React app fetches the JSON
2. `parseConsts()` extracts all Const nodes
3. Constants are injected into `model.weights`
4. `model.execute()` runs the forward pass
5. Canvas renders the output each frame

The parseConsts function handles:
- Scalar constants
- Array-encoded tensors
- Binary-encoded (base64) tensors

This matches the exact approach from the original Colab demo.
