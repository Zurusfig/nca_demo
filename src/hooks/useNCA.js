import { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

const GRID_WIDTH = 104;
const GRID_HEIGHT = 104;
const CHANNELS = 18;
const SEED_CHANNEL = 3;

export function useNCA(phase) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const modelRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize state
  const initializeState = useCallback(() => {
    const data = new Float32Array(GRID_HEIGHT * GRID_WIDTH * CHANNELS);
    const seedX = Math.floor(GRID_WIDTH / 2);
    const seedY = Math.floor(GRID_HEIGHT / 2);
    const seedIdx = (seedY * GRID_WIDTH + seedX) * CHANNELS;
    data[seedIdx + SEED_CHANNEL] = 1.0;
    return tf.tensor3d(data, [GRID_HEIGHT, GRID_WIDTH, CHANNELS]);
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

    tf.loadGraphModel(modelPath)
      .then(loadedModel => {
        modelRef.current = loadedModel;
        setModel(loadedModel);
        const initialState = initializeState();
        stateRef.current = initialState;
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load model:', err);
        setLoading(false);
      });

    return () => {
      // Cleanup on unmount
    };
  }, [phase, initializeState]);

  // Inject environmental signals
  const injectSignals = useCallback((state, fertilizer, sunDir) => {
    return tf.tidy(() => {
      // Channel 16: uniform fertilizer
      const ch16 = tf.fill([GRID_HEIGHT, GRID_WIDTH, 1], fertilizer);

      // Channel 17: tapered sun gradient
      const margin = 20;
      const gradientData = new Float32Array(GRID_HEIGHT * GRID_WIDTH);
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const ramp = -1.0 + 2.0 * x / (GRID_WIDTH - 1);
          let taper = 1.0;
          if (x < margin) taper = x / margin;
          if (x >= GRID_WIDTH - margin) taper = (GRID_WIDTH - 1 - x) / margin;
          const val = phase === 3 ? sunDir * ramp * taper : 0;
          gradientData[y * GRID_WIDTH + x] = val;
        }
      }
      const ch17 = tf.tensor3d(gradientData, [GRID_HEIGHT, GRID_WIDTH, 1]);

      // Concatenate: first 16 channels from state, then 16, then 17
      const ch0to15 = tf.slice(state, [0, 0, 0], [GRID_HEIGHT, GRID_WIDTH, 16]);
      const newState = tf.concat([ch0to15, ch16, ch17], 2);

      return newState;
    });
  }, [phase]);

  // Step function
  const step = useCallback(async (state, fertilizer, sunDir) => {
    if (!modelRef.current) return state.clone();

    return tf.tidy(() => {
      const injected = injectSignals(state, fertilizer, sunDir);

      const inputs = {
        x: injected,
        fire_rate: tf.tensor(0.5),
        angle: tf.tensor(0.0),
        step_size: tf.tensor(1.0)
      };

      try {
        const output = modelRef.current.executeAsync(inputs);
        return output;
      } catch (e) {
        console.error('Model execution failed:', e);
        return state.clone();
      }
    });
  }, [injectSignals]);

  // Damage (click)
  const damage = useCallback((x, y, radius = 8) => {
    if (!stateRef.current) return;

    const current = stateRef.current;
    const data = new Float32Array(GRID_HEIGHT * GRID_WIDTH * CHANNELS);
    const currentData = current.dataSync();

    // Copy current state
    data.set(currentData);

    // Zero out damaged area
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < GRID_HEIGHT && nx >= 0 && nx < GRID_WIDTH) {
            const idx = (ny * GRID_WIDTH + nx) * CHANNELS;
            for (let c = 0; c < CHANNELS; c++) {
              data[idx + c] = 0;
            }
          }
        }
      }
    }

    current.dispose();
    stateRef.current = tf.tensor3d(data, [GRID_HEIGHT, GRID_WIDTH, CHANNELS]);
  }, []);

  // Plant seed
  const plantSeed = useCallback((x, y) => {
    if (!stateRef.current) return;

    const current = stateRef.current;
    const data = new Float32Array(GRID_HEIGHT * GRID_WIDTH * CHANNELS);

    // Zero out everything and plant seed
    const idx = (y * GRID_WIDTH + x) * CHANNELS;
    data[idx + SEED_CHANNEL] = 1.0;

    current.dispose();
    stateRef.current = tf.tensor3d(data, [GRID_HEIGHT, GRID_WIDTH, CHANNELS]);
  }, []);

  // Reset
  const reset = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.dispose();
    }
    stateRef.current = initializeState();
  }, [initializeState]);

  // Render to canvas
  const render = useCallback((state) => {
    if (!canvasRef.current || !state) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(GRID_WIDTH, GRID_HEIGHT);
    const data = imageData.data;

    const stateData = state.dataSync();

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const idx = (y * GRID_WIDTH + x) * CHANNELS;
        const alpha = Math.min(1, Math.max(0, stateData[idx])); // Channel 0 = alive

        // White background for dead cells, green tint for living cells
        const alive = alpha > 0.1; // Threshold for visibility
        const intensity = Math.pow(alpha, 0.5); // Gamma correction

        let r, g, b;
        if (alive) {
          // Green (#7fff7f) with intensity
          r = Math.floor(127 * intensity);
          g = Math.floor(255 * intensity);
          b = Math.floor(127 * intensity);
        } else {
          // White background
          r = 255;
          g = 255;
          b = 255;
        }

        const pixelIdx = (y * GRID_WIDTH + x) * 4;
        data[pixelIdx] = Math.min(255, r);
        data[pixelIdx + 1] = Math.min(255, g);
        data[pixelIdx + 2] = Math.min(255, b);
        data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  return {
    canvasRef,
    state,
    model,
    loading,
    step,
    damage,
    plantSeed,
    reset,
    render,
    stateRef,
    injectSignals
  };
}
