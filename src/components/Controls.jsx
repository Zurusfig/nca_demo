import { RotateCcw, Plus } from 'lucide-react';

const FERT_PRESETS = [
  { label: 'No Flowers', value: 0.0 },
  { label: '1 Flower',   value: 0.33 },
  { label: '2 Flowers',  value: 0.66 },
  { label: 'Full Bloom', value: 1.0 },
];

const SUN_PRESETS = [
  { label: 'Full Left',  value: -1.0 },
  { label: 'Center',     value: 0.0 },
  { label: 'Full Right', value: 1.0 },
];

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

      {/* Fertilizer */}
      <div className="bg-retro-card border border-retro-green p-4 rounded">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-retro-green text-sm">FERTILIZER</span>
          <span className="text-xs text-gray-400">{fertilizer.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={fertilizer}
          onChange={(e) => onFertilizerChange(parseFloat(e.target.value))}
          className="w-full mb-3"
        />
        <div className="grid grid-cols-2 gap-1">
          {FERT_PRESETS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => onFertilizerChange(value)}
              className={`text-xs px-2 py-1 border rounded transition ${
                Math.abs(fertilizer - value) < 0.01
                  ? 'bg-retro-green text-retro-dark border-retro-green'
                  : 'bg-transparent text-retro-green border-retro-green hover:bg-retro-green hover:text-retro-dark'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sun Direction (Phase 3 only) */}
      {phase === 3 && (
        <div className="bg-retro-card border border-retro-amber p-4 rounded">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-retro-amber text-sm">SUN DIRECTION</span>
            <span className="text-xs text-gray-400">
              {sunDir > 0.05 ? 'Right' : sunDir < -0.05 ? 'Left' : 'Center'} ({sunDir.toFixed(2)})
            </span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={sunDir}
            onChange={(e) => onSunDirChange(parseFloat(e.target.value))}
            className="w-full mb-3"
          />
          <div className="grid grid-cols-3 gap-1">
            {SUN_PRESETS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => onSunDirChange(value)}
                className={`text-xs px-2 py-1 border rounded transition ${
                  Math.abs(sunDir - value) < 0.01
                    ? 'bg-retro-amber text-retro-dark border-retro-amber'
                    : 'bg-transparent text-retro-amber border-retro-amber hover:bg-retro-amber hover:text-retro-dark'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

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
