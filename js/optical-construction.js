/** Display constructions read the same SI models as the calculation inspector.
 * Fitted horizontal/vertical scales never feed back into those models. */
import { sampleCurriculum } from "./curriculum-physics.js";
import { refractionInfo, DEG } from "./physics-extra.js";

export function lensConstruction(p) {
  const q = sampleCurriculum("lenses", { t: 0 }, p), f = p.kind * p.focal,
    offBench = q.image !== null && Math.abs(q.image) > 6 * Math.max(p.object, p.focal),
    extent = Math.max(p.object, 2 * p.focal, offBench ? 0 : Math.abs(q.image ?? 0)),
    scale = 3.7 / extent, axis = 2.05,
    height = Math.min(1.15, Math.max(0.25, p.height / 0.04 * 0.85)) /
      (offBench ? 1 : Math.max(1, Math.abs(q.magnification ?? 1))),
    object = [-p.object * scale, axis + height, 0],
    image = q.image === null ? null : [q.image * scale, axis + q.magnification * height, 0],
    rays = [], extensions = [];
  for (const central of [false, true]) {
    const y = central ? axis : axis + height,
      slope = central ? -height / (p.object * scale) : -height / (f * scale);
    let x = 4.15, endY = y + slope * x;
    if (endY < 0.3 || endY > 4.25) {
      endY = Math.max(0.3, Math.min(4.25, endY));
      x = (endY - y) / slope;
    }
    rays.push([object, [0, y, 0], [x, endY, 0]]);
    if (image && q.image < 0 && !offBench) extensions.push([[0, y, 0], image]);
  }
  return { ...q, f, scale, axis, height, object, image, offBench, rays, extensions };
}

export function refractionConstruction(p) {
  const q = refractionInfo(p), hit = [0, 2.2, 0], length = 2.1, i = p.angle * DEG,
    incident = [[-length * Math.sin(i), hit[1] + length * Math.cos(i), 0], hit],
    reflected = [hit, [length * Math.sin(i), hit[1] + length * Math.cos(i), 0]],
    r = q.refracted === null ? null : q.refracted * DEG,
    transmitted = r === null ? null : [hit, [length * Math.sin(r), hit[1] - length * Math.cos(r), 0]];
  return { ...q, hit, incident, reflected, transmitted, transmission: 1 - q.reflectance };
}
