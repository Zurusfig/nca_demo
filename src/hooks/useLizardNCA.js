import { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { parseConsts } from '../lib/parseConsts';

const GRID_WIDTH = 72;
const GRID_HEIGHT = 72;
const CHANNELS = 24;
const SEED_CHANNEL = 3; // channels 3-23 = 1 for lizard seed

export function useLizardNCA() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const envRef = useRef(null);
  const modelRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelError, setModelError] = useState(null);

  const initializeState = useCallback(() => {
    return tf.zeros([1, GRID_HEIGHT, GRID_WIDTH, CHANNELS]);
  }, []);

  const initializeEnv = useCallback(() => {
    return tf.zeros([1, GRID_HEIGHT, GRID_WIDTH, 1]);
  }, []);

  // Load model
  useEffect(() => {
    const modelPath = 'models/lizard.json';
    setLoading(true);

    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
    }

    // Initialize state and env as tf.variable immediately
    if (stateRef.current) stateRef.current.dispose();
    if (envRef.current) envRef.current.dispose();

    stateRef.current = tf.variable(initializeState());
    envRef.current = tf.variable(initializeEnv());

    // Plant center seed inline (lizard seed: ch 3-23 = 1, ch 0-2 = 0)
    tf.tidy(() => {
      const cx = Math.floor(GRID_WIDTH / 2);
      const cy = Math.floor(GRID_HEIGHT / 2);
      const seedData = new Float32Array(CHANNELS);
      for (let c = SEED_CHANNEL; c < CHANNELS; c++) seedData[c] = 1.0;
      const seed = tf.tensor4d(seedData, [1, 1, 1, CHANNELS]);
      const padded = seed.pad([[0,0],[cy, GRID_HEIGHT-cy-1],[cx, GRID_WIDTH-cx-1],[0,0]]);
      stateRef.current.assign(stateRef.current.add(padded));
    });

    Promise.all([
      fetch(modelPath).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      tf.loadGraphModel(modelPath)
    ])
      .then(([json, loadedModel]) => {
        const consts = parseConsts(json);
        Object.assign(loadedModel.weights, consts);
        modelRef.current = loadedModel;
        setModel(loadedModel);
        setModelError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lizard model load error:', err);
        setModelError(err.message);
        setLoading(false);
      });

    return () => {};
  }, [initializeState, initializeEnv]);

  // Step function
  const step = useCallback((currentState, currentEnv) => {
    if (!modelRef.current) return currentState.clone();
    try {
      return tf.tidy(() => {
        const result = modelRef.current.execute(
          {
            x: currentState,
            env: currentEnv,
            fire_rate: tf.scalar(0.5),
            angle: tf.scalar(0.0),
            step_size: tf.scalar(1.0)
          },
          'Identity'
        );
        return result;
      });
    } catch (e) {
      console.error('Lizard model execution failed:', e);
      return currentState.clone();
    }
  }, []);

  // Update obstacle rectangle in envRef
  const updateObstacle = useCallback((ox, oy, os) => {
    if (!envRef.current) return;
    tf.tidy(() => {
      const envData = new Float32Array(GRID_HEIGHT * GRID_WIDTH);
      const x0 = Math.round(ox - os / 2);
      const y0 = Math.round(oy - os / 2);
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (x >= x0 && x < x0 + os && y >= y0 && y < y0 + os) {
            envData[y * GRID_WIDTH + x] = 1.0;
          }
        }
      }
      const newEnv = tf.tensor4d(envData, [1, GRID_HEIGHT, GRID_WIDTH, 1]);
      envRef.current.assign(newEnv);
    });
  }, []);

  // Damage (erase) cells in radius
  const damage = useCallback((x, y, radius = 6) => {
    if (!stateRef.current) return;
    tf.tidy(() => {
      const xx = tf.range(0, GRID_WIDTH).sub(x).div(radius).square().expandDims(0);
      const yy = tf.range(0, GRID_HEIGHT).sub(y).div(radius).square().expandDims(1);
      const distSq = xx.add(yy);
      const mask = tf.cast(distSq.greater(1.0).expandDims(0).expandDims(3), 'float32');
      stateRef.current.assign(stateRef.current.mul(mask));
    });
  }, []);

  // Plant seed at (x, y)
  const plantSeed = useCallback((px, py) => {
    if (!stateRef.current) return;
    const x = Math.max(0, Math.min(px, GRID_WIDTH - 1));
    const y = Math.max(0, Math.min(py, GRID_HEIGHT - 1));
    tf.tidy(() => {
      const seedData = new Float32Array(CHANNELS);
      for (let c = SEED_CHANNEL; c < CHANNELS; c++) seedData[c] = 1.0;
      const seed = tf.tensor4d(seedData, [1, 1, 1, CHANNELS]);
      const x2 = GRID_WIDTH - x - 1;
      const y2 = GRID_HEIGHT - y - 1;
      const padded = seed.pad([[0, 0], [y, y2], [x, x2], [0, 0]]);
      stateRef.current.assign(stateRef.current.add(padded));
    });
  }, []);

  // Reset state and replant center seed
  const reset = useCallback(() => {
    if (!stateRef.current) return;
    tf.tidy(() => {
      stateRef.current.assign(tf.zeros([1, GRID_HEIGHT, GRID_WIDTH, CHANNELS]));
    });
    setTimeout(() => plantSeed(Math.floor(GRID_WIDTH / 2), Math.floor(GRID_HEIGHT / 2)), 50);
  }, [plantSeed]);

  // Render to canvas — RGB from ch 0-2, alpha from ch 3, obstacle overlay
  const render = useCallback((state, env) => {
    if (!canvasRef.current || !state || !env) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    tf.tidy(() => {
      // Extract RGB [H,W,3] and alpha [H,W,1]
      const rgb = state.slice([0, 0, 0, 0], [1, -1, -1, 3]).squeeze([0]); // [H,W,3]
      const alpha = state.slice([0, 0, 0, 3], [1, -1, -1, 1]).squeeze([0]); // [H,W,1]

      // Composite: rgb*alpha + (1-alpha) white bg
      const invAlpha = tf.scalar(1.0).sub(alpha);
      const comp = rgb.mul(alpha).add(invAlpha); // [H,W,3]

      // Obstacle mask [H,W,1]
      const em = env.squeeze([0]); // [H,W,1]

      // Obstacle overlay: comp*(1-em*0.4) + red*em*0.4
      const red = tf.tensor3d([[[1.0, 0.3, 0.3]]]).tile([GRID_HEIGHT, GRID_WIDTH, 1]);
      const overlaid = comp.mul(tf.scalar(1.0).sub(em.mul(0.4))).add(red.mul(em.mul(0.4)));

      // Build RGBA: append full alpha channel
      const full = tf.ones([GRID_HEIGHT, GRID_WIDTH, 1]);
      const rgba = tf.concat([overlaid, full], 2).mul(255).clipByValue(0, 255);

      const bytes = new Uint8ClampedArray(rgba.dataSync());
      ctx.putImageData(new ImageData(bytes, GRID_WIDTH, GRID_HEIGHT), 0, 0);
    });
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
    envRef,
    updateObstacle,
  };
}
