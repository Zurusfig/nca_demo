import { useState, useRef } from 'react';
import { DemoCanvas } from './components/DemoCanvas';
import { Controls } from './components/Controls';
import { PhaseSelector } from './components/PhaseSelector';
import { Sidebar } from './components/Sidebar';

function App() {
  const [phase, setPhase] = useState(2);
  const [fertilizer, setFertilizer] = useState(0.5);
  const [sunDir, setSunDir] = useState(0);
  const canvasRef = useRef(null);

  const handleReset = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 104, 104);
    }
  };

  const handlePlantSeed = () => {
    // This will be handled by the DemoCanvas component
  };

  return (
    <div className="min-h-screen bg-retro-dark text-gray-300 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 lg:overflow-y-auto lg:max-h-screen p-6 border-b lg:border-b-0 lg:border-r border-retro-green order-last lg:order-first">
        <h2 className="text-retro-green font-bold mb-4 text-lg">Background</h2>
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 flex flex-col items-center justify-start overflow-y-auto">
        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-bold text-retro-green mb-2 text-center">
          Growing Trees with Environmental Awareness
        </h1>
        <p className="text-retro-amber text-sm mb-8 text-center max-w-2xl">
          Neural Cellular Automata that respond to fertilizer and sunlight
        </p>

        {/* Phase Selector */}
        <div className="mb-8 w-full max-w-md">
          <PhaseSelector phase={phase} onPhaseChange={setPhase} />
        </div>

        {/* Demo area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-4xl mb-8">
          {/* Canvas */}
          <div className="flex-1">
            <DemoCanvas
              ref={canvasRef}
              phase={phase}
              fertilizer={fertilizer}
              sunDir={phase === 3 ? sunDir : 0}
            />
          </div>

          {/* Controls */}
          <div className="w-full lg:w-auto">
            <Controls
              phase={phase}
              fertilizer={fertilizer}
              onFertilizerChange={setFertilizer}
              sunDir={sunDir}
              onSunDirChange={setSunDir}
              onReset={handleReset}
              onPlantSeed={handlePlantSeed}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-xs text-gray-500 text-center mt-8 border-t border-gray-700 pt-4">
          <p>Neural Cellular Automata • TensorFlow.js</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
