import { useState, useRef } from 'react';
import { DemoCanvas } from './components/DemoCanvas';
import { Controls } from './components/Controls';
import { PhaseSelector } from './components/PhaseSelector';
import { Sidebar } from './components/Sidebar';
import { DemoTabs } from './components/DemoTabs';
import { LizardCanvas } from './components/LizardCanvas';
import { LizardControls } from './components/LizardControls';
import { LizardSidebar } from './components/LizardSidebar';

const DEFAULT_OBSTACLE = { x: 36, y: 36, size: 16 };

function App() {
  const [activeDemo, setActiveDemo] = useState('tree');

  // Tree state
  const [phase, setPhase] = useState(2);
  const [fertilizer, setFertilizer] = useState(0.5);
  const [sunDir, setSunDir] = useState(0);
  const demoCanvasRef = useRef(null);

  // Lizard state
  const [obstacle, setObstacle] = useState(DEFAULT_OBSTACLE);
  const lizardCanvasRef = useRef(null);

  const handleTreeReset = () => demoCanvasRef.current?.reset();
  const handleTreePlantSeed = () => {
    const centerX = 52;
    const centerY = 52;
    demoCanvasRef.current?.plantSeed(centerX, centerY);
  };

  const handleLizardReset = () => lizardCanvasRef.current?.reset();
  const handleLizardPlantSeed = () => lizardCanvasRef.current?.plantSeed(36, 36);

  return (
    <div className="bg-retro-dark text-gray-300 flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      {/* Sidebar — mobile: normal flow; desktop: fixed height, own scroll */}
      <aside className="w-full lg:w-72 lg:h-full lg:overflow-y-auto shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-retro-green order-last lg:order-first">
        <h2 className="text-retro-green font-bold mb-4 text-lg">Background</h2>
        {activeDemo === 'tree' ? <Sidebar /> : <LizardSidebar />}
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:h-full lg:overflow-y-auto p-6 flex flex-col items-center justify-start">
        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-bold text-retro-green mb-2 text-center">
          {activeDemo === 'tree'
            ? 'Growing Trees with Environmental Awareness'
            : 'Lizard Obstacle Avoidance'}
        </h1>
        <p className="text-retro-amber text-sm mb-6 text-center max-w-2xl">
          {activeDemo === 'tree'
            ? 'Neural Cellular Automata that respond to fertilizer and sunlight'
            : 'Neural Cellular Automata that grow around obstacles'}
        </p>

        {/* Demo Tabs */}
        <div className="mb-6 w-full max-w-xs">
          <DemoTabs active={activeDemo} onChange={setActiveDemo} />
        </div>

        {activeDemo === 'tree' && (
          <>
            {/* Phase Selector */}
            <div className="mb-8 w-full max-w-md">
              <PhaseSelector phase={phase} onPhaseChange={setPhase} />
            </div>

            {/* Demo area */}
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-4xl mb-8">
              <div className="flex-1">
                <DemoCanvas
                  ref={demoCanvasRef}
                  phase={phase}
                  fertilizer={fertilizer}
                  sunDir={phase === 3 ? sunDir : 0}
                />
              </div>
              <div className="w-full lg:w-auto">
                <Controls
                  phase={phase}
                  fertilizer={fertilizer}
                  onFertilizerChange={setFertilizer}
                  sunDir={sunDir}
                  onSunDirChange={setSunDir}
                  onReset={handleTreeReset}
                  onPlantSeed={handleTreePlantSeed}
                />
              </div>
            </div>
          </>
        )}

        {activeDemo === 'lizard' && (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-4xl mb-8">
            <div className="flex-1">
              <LizardCanvas
                ref={lizardCanvasRef}
                obstacle={obstacle}
              />
            </div>
            <div className="w-full lg:w-auto">
              <LizardControls
                obstacle={obstacle}
                onObstacleChange={setObstacle}
                onReset={handleLizardReset}
                onPlantSeed={handleLizardPlantSeed}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-xs text-gray-500 text-center mt-8 border-t border-gray-700 pt-4">
          <p>Neural Cellular Automata • TensorFlow.js</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
