export function PhaseSelector({ phase, onPhaseChange }) {
  return (
    <div className="flex gap-2 border border-retro-green rounded overflow-hidden">
      <button
        onClick={() => onPhaseChange(2)}
        className={`flex-1 px-4 py-2 transition ${
          phase === 2
            ? 'bg-retro-green text-retro-dark'
            : 'bg-retro-card text-retro-green hover:bg-retro-card'
        }`}
      >
        Phase 2: Fertilizer
      </button>
      <button
        onClick={() => onPhaseChange(3)}
        className={`flex-1 px-4 py-2 transition ${
          phase === 3
            ? 'bg-retro-green text-retro-dark'
            : 'bg-retro-card text-retro-green hover:bg-retro-card'
        }`}
      >
        Phase 3: Fertilizer + Sun
      </button>
    </div>
  );
}
