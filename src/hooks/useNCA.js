import { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { parseConsts } from '../lib/parseConsts';

const GRID_WIDTH = 104;
const GRID_HEIGHT = 104;
const CHANNELS = 18;
const SEED_CHANNEL = 3;
const MARGIN = 20;

export function useNCA(phase) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const modelRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelError, setModelError] = useState(null);

  // Initialize state — always keep batch dimension [1, H, W, C]
  const initializeState = useCallback(() => {
    return tf.zeros([1, GRID_HEIGHT, GRID_WIDTH, CHANNELS]);
  }, []);

  // Load model
  useEffect(() => {
    const modelPath = phase === 2
      ? 'models/p2_final.json'
      : 'models/p3_final.json';

    setLoading(true);

    // Dispose old model and state when switching phases
    if (modelRef.current) {
      modelRef.current.dispose();
    }
    if (stateRef.current) {
      stateRef.current.dispose();
    }

    // Fetch JSON, parse constants, load model
    Promise.all([
      fetch(modelPath).then(r => r.json()),
      tf.loadGraphModel(modelPath)
    ])
      .then(([json, loadedModel]) => {
        // Parse and inject constants into model
        const consts = parseConsts(json);
        Object.assign(loadedModel.weights, consts);

        modelRef.current = loadedModel;
        setModel(loadedModel);
        setModelError(null);

        // Initialize state as a variable
        const initialState = initializeState();
        stateRef.current = tf.variable(initialState);

        // Plant center seed
        setTimeout(() => plantSeed(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2)), 50);
        setLoading(false);
      })
      .catch(err => {
        console.error('Model load error:', err);
        setModelError(err.message);

        // Fallback: initialize state even without model
        const initialState = initializeState();
        stateRef.current = tf.variable(initialState);
        setTimeout(() => plantSeed(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2)), 50);
        setLoading(false);
      });

    return () => {
      // Cleanup on unmount
    };
  }, [phase, initializeState]);

  // Inject environmental signals — state is [1, H, W, C]
  const injectSignals = useCallback((state, fertilizer, sunDir) => {
    return tf.tidy(() => {
      // Extract first 16 channels: [1, H, W, 16]
      const base = state.slice([0, 0, 0, 0], [1, -1, -1, 16]);

      // Channel 16: uniform fertilizer [1, H, W, 1]
      const ch16 = tf.ones([1, GRID_HEIGHT, GRID_WIDTH, 1]).mul(fertilizer);

      // Channel 17: tapered sun gradient [1, H, W, 1]
      const sunData = new Float32Array(GRID_HEIGHT * GRID_WIDTH);
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const ramp = -1.0 + 2.0 * x / (GRID_WIDTH - 1);
          let taper = 1.0;
          if (x < MARGIN) taper = x / MARGIN;
          if (x >= GRID_WIDTH - MARGIN) taper = (GRID_WIDTH - 1 - x) / MARGIN;
          const val = phase === 3 ? sunDir * ramp * taper : 0;
          sunData[y * GRID_WIDTH + x] = val;
        }
      }
      const ch17 = tf.tensor4d(sunData, [1, GRID_HEIGHT, GRID_WIDTH, 1]);

      // Concatenate along channel axis: [1, H, W, 16] + [1, H, W, 1] + [1, H, W, 1]
      const injected = tf.concat([base, ch16, ch17], 3);
      return injected;
    });
  }, [phase]);

  // Step function — synchronous execute with tf.tidy for cleanup
  const step = useCallback((currentState, fertilizer, sunDir) => {
    if (!modelRef.current) return currentState.clone();

    try {
      return tf.tidy(() => {
        const injected = injectSignals(currentState, fertilizer, sunDir);
        const result = modelRef.current.execute(
          {
            x: injected,
            fire_rate: tf.scalar(0.5),
            angle: tf.scalar(0.0),
            step_size: tf.scalar(1.0)
          },
          'Identity'
        );
        return result;
      });
    } catch (e) {
      console.error('Model execution failed:', e);
      return currentState.clone();
    }
  }, [injectSignals]);

  // Damage (click) — zero out cells in radius
  const damage = useCallback((x, y, radius = 8) => {
    if (!stateRef.current) return;
    tf.tidy(() => {
      // Create mask for damaged region
      const xx = tf.range(0, GRID_WIDTH).sub(x).div(radius).square().expandDims(0);
      const yy = tf.range(0, GRID_HEIGHT).sub(y).div(radius).square().expandDims(1);
      const distSq = xx.add(yy); // [H, W]
      const mask = distSq.greater(1.0).expandDims(0).expandDims(3); // [1, H, W, 1]
      const maskExpanded = tf.cast(mask, 'float32');
      stateRef.current.assign(stateRef.current.mul(maskExpanded));
    });
  }, []);

  // Plant seed at (x, y) using padding
  const plantSeed = useCallback((px, py) => {
    if (!stateRef.current) return;
    // Clamp to grid
    const x = Math.max(0, Math.min(px, GRID_WIDTH - 1));
    const y = Math.max(0, Math.min(py, GRID_HEIGHT - 1));

    tf.tidy(() => {
      // Create single seed cell [1, 1, 1, 18] with channel 3 = 1
      const seedData = new Float32Array(CHANNELS);
      seedData[SEED_CHANNEL] = 1.0;
      const seed = tf.tensor4d(seedData, [1, 1, 1, CHANNELS]);

      // Pad to place seed at (y, x)
      const x2 = GRID_WIDTH - x - 1;
      const y2 = GRID_HEIGHT - y - 1;
      const padded = seed.pad([[0, 0], [y, y2], [x, x2], [0, 0]]);

      // Add seed to state
      stateRef.current.assign(stateRef.current.add(padded));
    });
  }, []);

  // Reset to zeros and plant center seed
  const reset = useCallback(() => {
    tf.tidy(() => {
      stateRef.current.assign(tf.zeros([1, GRID_HEIGHT, GRID_WIDTH, CHANNELS]));
    });
    setTimeout(() => plantSeed(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2)), 50);
  }, [plantSeed]);

  // Render to canvas — state is [1, H, W, C], extract RGBA and apply alpha blending
  const render = useCallback((state) => {
    if (!canvasRef.current || !state) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(GRID_WIDTH, GRID_HEIGHT);
    const data = imageData.data;

    tf.tidy(() => {
      // Extract RGBA and alpha (channels 0-3 and channel 3)
      const rgba = state.slice([0, 0, 0, 0], [1, -1, -1, 4]).squeeze([0]); // [H, W, 4]
      const alpha = state.slice([0, 0, 0, 3], [1, -1, -1, 1]).squeeze([0]); // [H, W, 1]

      // Color math: white background (1.0) blended with alpha
      // Result = (1 - alpha) + rgba * alpha (approximation)
      const invAlpha = tf.scalar(1.0).sub(alpha); // [H, W, 1]
      const img = invAlpha.add(rgba).mul(255).clipByValue(0, 255); // [H, W, 4]

      const bytes = new Uint8ClampedArray(img.dataSync());
      ctx.putImageData(new ImageData(bytes, GRID_WIDTH, GRID_HEIGHT), 0, 0);
    });

    // Apply retro filter
    canvas.style.filter = 'contrast(1.3) saturate(1.2)';
  }, []);

  return {
    canvasRef,
    model,
    loading,
    modelError,
    step,
    damage,
    plantSeed,
    reset,
    render,
    stateRef,
    injectSignals
  };
}
