import { ExplanationCard } from './ExplanationCard';
import {
  Cpu,
  Sprout,
  Droplet,
  Sun,
  AlertCircle,
  Grid3x3
} from 'lucide-react';

export function Sidebar() {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      <ExplanationCard icon={Cpu} title="What is Neural Cellular Automata?">
        <p>Each cell in the grid is a pixel. Every cell sees its 3×3 neighborhood through Sobel filters. A neural network (54→256→18) processes these sensory inputs and decides the next state. The same rule applies everywhere. Complex patterns emerge from this simplicity.</p>
      </ExplanationCard>

      <ExplanationCard icon={Sprout} title="Phase 1: Growing from a Seed">
        <p>We start with a single live cell at the center. Through backpropagation through time, the network learns to grow a tree target shape. The CA discovers regeneration: if cells are damaged, neighboring cells restore them. Self-healing emerges.</p>
      </ExplanationCard>

      <ExplanationCard icon={Droplet} title="Phase 2: Fertilizer Control">
        <p>Channel 16 becomes an environmental input: the fertilizer level (0–1, uniform across the grid). We trained on 4 target shapes: sparse trees (low fertilizer) to bushy trees (high fertilizer). The network learns smooth interpolation between them.</p>
      </ExplanationCard>

      <ExplanationCard icon={Sun} title="Phase 3: Sun Direction">
        <p>Channel 17 is a spatial gradient: the sun direction signal. Left edge = -1, right edge = +1, center = 0. Tapered at edges. The network perceives this through Sobel filters and learns to lean the tree toward the sun using a quadratic curve.</p>
      </ExplanationCard>

      <ExplanationCard icon={AlertCircle} title="How We Prevented Blur">
        <p>Naive interpolation blurs targets. We tried warping and loss blending—both failed. The solution: integer shifts using np.roll. No blur, no interpolation. Targets stay crisp. Training converges faster and the CA learns sharper geometry.</p>
      </ExplanationCard>

      <ExplanationCard icon={Grid3x3} title="Key Insight: Spatial Gradient">
        <p>A uniform sun value is invisible to Sobel filters (zero derivative everywhere). But a gradient? The neighborhood sees left vs. right. This breaks symmetry. Tapered edges prevent artifacts at boundaries. Environmental inputs are most powerful when they create gradients.</p>
      </ExplanationCard>
    </div>
  );
}
