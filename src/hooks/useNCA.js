import { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

const GRID_WIDTH = 104;
const GRID_HEIGHT = 104;
const CHANNELS = 18;
const SEED_CHANNEL = 3;

export function useNCA(phase) {
  const [state, setState] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const modelRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize state
  const initializeState = useCallback(() => {
    return tf.tidy(() => {
      const s = tf.zeros([GRID_HEIGHT, GRID_WIDTH, CHANNELS]);
      const updates = tf.tensor3d(
        Array(GRID_HEIGHT).fill(null).flatMap((_, y) =>
          Array(GRID_WIDTH).fill(null).map((_, x) => {
            const row = new Array(CHANNELS).fill(0);
            if (x === Math.floor(GRID_WIDTH / 2) && y === Math.floor(GRID_HEIGHT / 2)) {
              row[SEED_CHANNEL] = 1.0;
            }
            return row;
          })
        ),
        [GRID_HEIGHT, GRID_WIDTH, CHANNELS]
      );
      return updates;
    });
  }, []);

  // Load model
  useEffect(() => {
    const modelPath = phase === 2
      ? 'models/p2_final.json'
      : 'models/p3_final.json';

    setLoading(true);
    tf.loadGraphModel(modelPath)
      .then(loadedModel => {
        modelRef.current = loadedModel;
        setModel(loadedModel);

        const initialState = initializeState();
        stateRef.current = initialState;
        setState(initialState);
      })
      .catch(err => {
        console.error('Failed to load model:', err);
        setLoading(false);
      })
      .finally(() => setLoading(false));

    return () => {
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [phase, initializeState]);

  // Inject environmental signals
  const injectSignals = useCallback((state, fertilizer, sunDir) => {
    return tf.tidy(() => {
      const updates = state.clone();

      // Channel 16: uniform fertilizer
      const ch16 = tf.fill([GRID_HEIGHT, GRID_WIDTH, 1], fertilizer);

      // Channel 17: tapered sun gradient
      let ch17;
      if (phase === 3) {
        const margin = 20;
        const gradient = Array(GRID_HEIGHT).fill(null).map(() =>
          Array(GRID_WIDTH).fill(null).map((_, i) => {
            const ramp = -1.0 + 2.0 * i / (GRID_WIDTH - 1);
            let taper = 1.0;
            if (i < margin) taper = i / margin;
            if (i >= GRID_WIDTH - margin) taper = (GRID_WIDTH - 1 - i) / margin;
            return sunDir * ramp * taper;
          })
        );
        ch17 = tf.tensor3d(
          gradient.map(row => row.map(val => [val])),
          [GRID_HEIGHT, GRID_WIDTH, 1]
        );
      } else {
        ch17 = tf.zeros([GRID_HEIGHT, GRID_WIDTH, 1]);
      }

      // Concatenate channels (assuming first 16 are from state, then add 16 and 17)
      const baseChannels = updates.slice([0, 0, 0], [GRID_HEIGHT, GRID_WIDTH, 16]);
      const newState = tf.concat([baseChannels, ch16, ch17], 2);

      return newState;
    });
  }, [phase]);

  // Step function
  const step = useCallback((state, fertilizer, sunDir) => {
    return tf.tidy(() => {
      const injected = injectSignals(state, fertilizer, sunDir);

      if (!modelRef.current) return state.clone();

      const inputs = {
        x: injected,
        fire_rate: tf.tensor(0.5),
        angle: tf.tensor(0.0),
        step_size: tf.tensor(1.0)
      };

      const output = modelRef.current.executeAsync(inputs, 'Identity');
      return output;
    });
  }, [injectSignals]);

  // Damage (click)
  const damage = useCallback((x, y, radius = 8) => {
    if (!stateRef.current) return;

    stateRef.current = tf.tidy(() => {
      const current = stateRef.current;
      const newState = current.clone();

      // Zero out channels in damage radius (keep RGBA for alpha)
      const dataArray = newState.dataSync();
      const rowStride = GRID_WIDTH * CHANNELS;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < GRID_HEIGHT && nx >= 0 && nx < GRID_WIDTH) {
              const idx = ny * GRID_WIDTH + nx;
              for (let c = 0; c < CHANNELS; c++) {
                dataArray[idx * CHANNELS + c] = 0;
              }
            }
          }
        }
      }

      return newState;
    });
  }, []);

  // Plant seed
  const plantSeed = useCallback((x, y) => {
    if (!stateRef.current) return;

    stateRef.current = tf.tidy(() => {
      const current = stateRef.current;
      const updates = current.clone();

      const dataArray = updates.dataSync();
      const idx = y * GRID_WIDTH + x;

      // Clear and plant seed
      for (let c = 0; c < CHANNELS; c++) {
        dataArray[idx * CHANNELS + c] = c === SEED_CHANNEL ? 1.0 : 0;
      }

      return updates;
    });
  }, []);

  // Reset
  const reset = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.dispose();
    }
    const newState = initializeState();
    stateRef.current = newState;
    setState(newState);
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
        const alpha = Math.min(1, Math.max(0, stateData[idx])); // Channel 0 = alpha

        const r = Math.min(255, Math.floor(255 * (1 - alpha)));
        const g = Math.min(255, Math.floor(255 * (1 - alpha)));
        const b = Math.min(255, Math.floor(255 * (1 - alpha)));

        const pixelIdx = (y * GRID_WIDTH + x) * 4;
        data[pixelIdx] = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = b;
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
