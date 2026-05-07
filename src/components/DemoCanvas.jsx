import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useNCA } from '../hooks/useNCA';

const GRID_WIDTH = 104;
const GRID_HEIGHT = 104;
const SCALE = 5;

export const DemoCanvas = forwardRef(function DemoCanvas({ phase, fertilizer, sunDir }, ref) {
  const { canvasRef, state, model, loading, step, damage, plantSeed, reset, render, stateRef, injectSignals } = useNCA(phase);
  const animationRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useImperativeHandle(ref, () => ({
    reset,
    plantSeed,
    damage
  }));

  // Animation loop
  useEffect(() => {
    if (!model || !stateRef.current || paused) return;

    let isMounted = true;
    let frameId = null;

    const animate = async () => {
      if (stateRef.current && model && isMounted) {
        try {
          const newState = await step(stateRef.current, fertilizer, sunDir);
          if (newState && isMounted) {
            stateRef.current?.dispose();
            stateRef.current = newState;
            render(stateRef.current);
          }
        } catch (e) {
          console.error('Animation error:', e);
        }
      }
      if (isMounted) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [model, step, render, fertilizer, sunDir, paused]);

  // Canvas interaction
  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GRID_WIDTH / rect.width;
    const scaleY = GRID_HEIGHT / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (e.shiftKey) {
      plantSeed(x, y);
    } else {
      damage(x, y);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setPaused(!paused)}
          className="px-4 py-2 bg-retro-card border border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-dark transition"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {loading && (
        <div className="text-retro-amber">Loading model...</div>
      )}

      <canvas
        ref={canvasRef}
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        onClick={handleCanvasClick}
        className="retro-canvas border-2 border-retro-green cursor-crosshair"
        style={{
          width: `${GRID_WIDTH * SCALE}px`,
          height: `${GRID_HEIGHT * SCALE}px`,
        }}
      />

      <div className="text-xs text-gray-500 text-center">
        <div>Click: damage | Shift+Click: plant seed</div>
      </div>
    </div>
  );
});
