import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useLizardNCA } from '../hooks/useLizardNCA';

const GRID_WIDTH = 72;
const GRID_HEIGHT = 72;
const SCALE = 6;

export const LizardCanvas = forwardRef(function LizardCanvas({ obstacle }, ref) {
  const { canvasRef, model, loading, modelError, step, damage, plantSeed, reset, render, stateRef, envRef, updateObstacle } = useLizardNCA();
  const [paused, setPaused] = useState(false);
  const isDraggingRef = useRef(false);
  const obstacleRef = useRef(obstacle);

  useImperativeHandle(ref, () => ({ reset, plantSeed, damage }));

  // Keep obstacleRef in sync
  useEffect(() => {
    obstacleRef.current = obstacle;
  }, [obstacle]);

  // Update env whenever obstacle changes
  useEffect(() => {
    updateObstacle(obstacle.x, obstacle.y, obstacle.size);
  }, [obstacle, updateObstacle]);

  // Render initial state once canvas mounts
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
    }
    if (stateRef.current && envRef.current) {
      render(stateRef.current, envRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop
  useEffect(() => {
    if (!model || paused) return;

    let isMounted = true;
    let frameId = null;

    const animate = () => {
      if (!isMounted) return;
      if (stateRef.current && envRef.current) {
        try {
          const newState = step(stateRef.current, envRef.current);
          if (newState && isMounted) {
            stateRef.current.assign(newState);
            newState.dispose();
            render(stateRef.current, envRef.current);
          }
        } catch (e) {
          console.error('Lizard animation error:', e);
        }
      }
      if (isMounted) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      isMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [model, step, render, paused, stateRef, envRef]);

  const getGridCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) * (GRID_WIDTH / rect.width)),
      y: Math.floor((e.clientY - rect.top) * (GRID_HEIGHT / rect.height)),
    };
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    isDraggingRef.current = true;
    const { x, y } = getGridCoords(e);
    if (e.shiftKey) plantSeed(x, y);
    else damage(x, y);
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !isDraggingRef.current || e.shiftKey) return;
    const { x, y } = getGridCoords(e);
    damage(x, y);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
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
          Model not found. Place lizard.json in public/models/
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="retro-canvas border-2 border-retro-green cursor-crosshair"
        style={{ width: `${GRID_WIDTH * SCALE}px`, height: `${GRID_HEIGHT * SCALE}px` }}
      />

      <div className="text-xs text-gray-500 text-center">
        Click/Drag: erase &nbsp;|&nbsp; Shift+Click: plant seed
      </div>
    </div>
  );
});
