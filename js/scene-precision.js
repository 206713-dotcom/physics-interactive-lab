/** Compatibility entry point for the two calibrated oscillation benches. */
export { createHelix } from './spring-helix.js';
import { createSpringBench, createPendulumBench } from './scene-oscillation-benches.js';
export function createDetailedMechanics(type,p,root,options={}) {
  return type==='spring'?createSpringBench(p,root,options):createPendulumBench(p,root,options);
}
