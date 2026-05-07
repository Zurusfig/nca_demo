import { RotateCcw, Plus } from 'lucide-react';

export function Controls({
  phase,
  fertilizer,
  onFertilizerChange,
  sunDir,
  onSunDirChange,
  onReset,
  onPlantSeed
}) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="bg-retro-card border border-retro-green p-4 rounded">
        <div className="text-retro-green text-sm mb-3">FERTILIZER</div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={fertilizer}
          onChange={(e) => onFertilizerChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-400 mt-1">{fertilizer.toFixed(2)}</div>
      </div>

      {phase === 3 && (
        <div className="bg-retro-card border border-retro-green p-4 rounded">
          <div className="text-retro-green text-sm mb-3">SUN DIRECTION</div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={sunDir}
            onChange={(e) => onSunDirChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-400 mt-1">
            {sunDir > 0 ? 'Right' : sunDir < 0 ? 'Left' : 'Center'} ({sunDir.toFixed(2)})
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-retro-card border border-retro-amber text-retro-amber hover:bg-retro-amber hover:text-retro-dark transition flex-1"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          onClick={onPlantSeed}
          className="flex items-center gap-2 px-4 py-2 bg-retro-card border border-retro-green text-retro-green hover:bg-retro-green hover:text-retro-dark transition"
        >
          <Plus size={16} />
          Seed
        </button>
      </div>
    </div>
  );
}
