import { RotateCcw, Plus } from 'lucide-react';

const GRID_WIDTH = 72;
const GRID_HEIGHT = 72;

const SIZE_PRESETS = [
  { label: 'Small',  value: 8 },
  { label: 'Medium', value: 16 },
  { label: 'Large',  value: 24 },
];

export function LizardControls({
  obstacle,
  onObstacleChange,
  onReset,
  onPlantSeed,
}) {
  const { x, y, size } = obstacle;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">

      {/* Obstacle X position */}
      <div className="bg-retro-card border border-retro-green p-4 rounded">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-retro-green text-sm">OBSTACLE X</span>
          <span className="text-xs text-gray-400">{x}</span>
        </div>
        <input
          type="range"
          min="0"
          max={GRID_WIDTH - 1}
          step="1"
          value={x}
          onChange={(e) => onObstacleChange({ ...obstacle, x: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Obstacle Y position */}
      <div className="bg-retro-card border border-retro-green p-4 rounded">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-retro-green text-sm">OBSTACLE Y</span>
          <span className="text-xs text-gray-400">{y}</span>
        </div>
        <input
          type="range"
          min="0"
          max={GRID_HEIGHT - 1}
          step="1"
          value={y}
          onChange={(e) => onObstacleChange({ ...obstacle, y: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Obstacle size */}
      <div className="bg-retro-card border border-retro-amber p-4 rounded">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-retro-amber text-sm">OBSTACLE SIZE</span>
          <span className="text-xs text-gray-400">{size}px</span>
        </div>
        <input
          type="range"
          min="4"
          max="32"
          step="1"
          value={size}
          onChange={(e) => onObstacleChange({ ...obstacle, size: parseInt(e.target.value) })}
          className="w-full mb-3"
        />
        <div className="grid grid-cols-3 gap-1">
          {SIZE_PRESETS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => onObstacleChange({ ...obstacle, size: value })}
              className={`text-xs px-2 py-1 border rounded transition ${
                size === value
                  ? 'bg-retro-amber text-retro-dark border-retro-amber'
                  : 'bg-transparent text-retro-amber border-retro-amber hover:bg-retro-amber hover:text-retro-dark'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-retro-card border border-retro-amber text-retro-amber hover:bg-retro-amber hover:text-retro-dark transition flex-1"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          onClick={onPlantSeed}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-retro-card border border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-dark transition flex-1"
        >
          <Plus size={16} />
          Plant Seed
        </button>
      </div>
    </div>
  );
}
