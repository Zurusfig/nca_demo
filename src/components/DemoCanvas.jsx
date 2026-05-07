import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useNCA } from '../hooks/useNCA';

const GRID_WIDTH = 104;
const GRID_HEIGHT = 104;
const SCALE = 5;

export const DemoCanvas = forwardRef(function DemoCanvas({ phase, fertilizer, sunDir }, ref) {
  const { canvasRef, model, loading, modelError, step, damage, plantSeed, reset, render, stateRef } = useNCA(phase);
  const [paused, setPaused] = useState(false);

  useImperativeHandle(ref, () => ({ reset, plantSeed, damage }));

  // Render the initial seed state once the canvas mounts
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
    }
    if (stateRef.current) {
      render(stateRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop — only runs when a model is loaded
  useEffect(() => {
    if (!model || paused) return;

    let isMounted = true;
    let frameId = null;

    const animate = () => {
      if (!isMounted) return;
      if (stateRef.current) {
        try {
          const newState = step(stateRef.current, fertilizer, sunDir);
          if (newState && isMounted) {
            stateRef.current.dispose();
            stateRef.current = newState;
            render(stateRef.current);
          }
        } catch (e) {
          console.error('Animation error:', e);
        }
      }
      if (isMounted) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      isMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [model, step, render, fertilizer, sunDir, paused, stateRef]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (GRID_WIDTH / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (GRID_HEIGHT / rect.height));
    if (e.shiftKey) plantSeed(x, y);
    else damage(x, y);
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
        <div className="text-retro-amber text-sm">Loading model...</div>
      )}
      {modelError && !loading && (
        <div className="text-red-400 text-xs max-w-xs text-center">
          Model not found. Place p{phase}_final.json in public/models/
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        onClick={handleCanvasClick}
        className="retro-canvas border-2 border-retro-green cursor-crosshair"
        style={{ width: `${GRID_WIDTH * SCALE}px`, height: `${GRID_HEIGHT * SCALE}px` }}
      />

      <div className="text-xs text-gray-500 text-center">
        Click: damage &nbsp;|&nbsp; Shift+Click: plant seed
      </div>
    </div>
  );
});
