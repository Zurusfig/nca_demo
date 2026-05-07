import { ExplanationCard } from './ExplanationCard';
import { Cpu, Shield, Eye, Zap, Sprout, MousePointer } from 'lucide-react';

export function LizardSidebar() {
  return (
    <div className="flex flex-col gap-4">
      <ExplanationCard icon={Cpu} title="Lizard Neural CA">
        <p>A Neural Cellular Automata trained to grow a lizard-shaped creature that learns to detect and avoid obstacles placed in its environment.</p>
      </ExplanationCard>

      <ExplanationCard icon={Eye} title="24-Channel State">
        <p>Each cell holds 24 channels. Channels 0–2 encode RGB color, channel 3 is the alive signal. Channels 4–23 are hidden "memory" states the network uses freely.</p>
      </ExplanationCard>

      <ExplanationCard icon={Shield} title="Obstacle Channel">
        <p>An "env" input — a [H×W×1] binary mask — is injected each step alongside the cell state. Cells overlapping the obstacle mask learn to stop growing, causing the creature to route around it.</p>
      </ExplanationCard>

      <ExplanationCard icon={Zap} title="Self-Repair">
        <p>Click or drag to erase cells. The lizard regenerates from surviving cells, regrowing around the obstacle. Damage resistance and obstacle avoidance are learned simultaneously.</p>
      </ExplanationCard>

      <ExplanationCard icon={Sprout} title="Seed Cell">
        <p>Growth begins from a single seed with channels 3–23 set to 1. Shift+Click plants a new seed anywhere on the canvas to start a second growth front.</p>
      </ExplanationCard>

      <ExplanationCard icon={MousePointer} title="Try It">
        <p>Drag the obstacle X/Y sliders to reposition the red block mid-growth. Watch the creature dynamically reroute. Enlarge the obstacle to stress-test avoidance behavior.</p>
      </ExplanationCard>
    </div>
  );
}
