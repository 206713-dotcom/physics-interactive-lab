import { createSceneKit } from "./scene-kit.js";
import { MECHANICAL_SCENES } from "./scene-mechanics.js";
import { THERMAL_SCENES } from "./scene-thermal.js";
import { WAVE_SCENES } from "./scene-waves.js";
import { ELECTRIC_SCENES } from "./scene-electric.js";
import { SPACE_SCENES } from "./scene-space.js";
import { sampleCurriculum } from "./curriculum-physics.js";
export const CURRICULUM_BUILDERS = {
  ...MECHANICAL_SCENES,
  ...THERMAL_SCENES,
  ...WAVE_SCENES,
  ...ELECTRIC_SCENES,
  ...SPACE_SCENES,
};
/** This controller only reads the authoritative model. It never steps it. The
 * labels:false option makes apparatus validation possible without a DOM/GPU. */
export function createCurriculumScene(type, params, root, options = {}) {
  const builder = CURRICULUM_BUILDERS[type];
  if (!builder) throw new RangeError("No 3D apparatus for " + type);
  const kit = createSceneKit(root, options),
    built = builder(params, kit),
    animate = typeof built === "function" ? built : built.update;
  return {
    kit,
    liveParams: !!built.liveParams,
    interaction: built.interaction,
    update(lab) {
      animate(
        lab.state,
        sampleCurriculum(
          type,
          lab.state,
          built.liveParams ? lab.params : params,
        ),
        lab,
      );
      kit.visibility(lab.showLabels !== false, lab.vectors !== false);
      built.afterVisibility?.(lab);
    },
  };
}
