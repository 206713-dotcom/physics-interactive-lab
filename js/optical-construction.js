/** Display constructions read the same SI models as the calculation inspector.
 * Fitted horizontal/vertical scales never feed back into those models. */
import { sampleCurriculum } from "./curriculum-physics.js";
import { refractionInfo, DEG } from "./physics-extra.js";
import { polarisationProjection } from "./practical-physics.js";

/** Independent reflection and image constructions. A fixed distance scale
 * makes the distance control visible without changing either ray angle. */
export function mirrorConstruction(p) {
  const hit = [-0.65, 2.6, 0.12], length = 1.8, a = p.angle * DEG,
    incident = [[hit[0] - length * Math.cos(a), hit[1] + length * Math.sin(a), 0.12], hit],
    reflected = [hit, [hit[0] - length * Math.cos(a), hit[1] - length * Math.sin(a), 0.12]],
    mirrorX = 2.6, scale = 0.36, axis = 2.4, height = 0.8,
    object = [mirrorX - p.distance * scale, axis + height, 0.12],
    image = [mirrorX + p.distance * scale, axis + height, 0.12],
    hits = [2.6, 3.65].map(y => [mirrorX, y, 0.12]),
    rays = hits.map(h => [object, h, [object[0], 2 * h[1] - object[1], 0.12]]),
    extensions = hits.map(h => [h, image]);
  return { hit, incident, reflected, mirrorX, scale, axis, height, object, image, rays, extensions };
}

/** True Snell angles at a single interface. Wavefront distances are enlarged
 * and time slowed by the same factors on both sides, preserving f, v and λ ratios. */
export function dispersionConstruction(p) {
  const q = sampleCurriculum("dispersion", { t: 0 }, p), hit = [-1.5, 2.2, 0.15],
    i = p.angle * DEG, r = q.refraction * DEG,
    airDirection = [Math.cos(i), -Math.sin(i), 0],
    materialDirection = [Math.cos(r), -Math.sin(r), 0],
    airLength = 2.25, materialLength = 2.5,
    incident = [hit.map((v, j) => v - airLength * airDirection[j]), hit],
    transmitted = [hit, hit.map((v, j) => v + materialLength * materialDirection[j])],
    spacing = 0.28 * (p.wavelength / 550e-9), displaySpeed = 0.65,
    references = [400, 550, 700].map(nm => ({ nm,
      ...sampleCurriculum("dispersion", { t: 0 }, { ...p, wavelength: nm * 1e-9 }) }));
  return { ...q, hit, incident, transmitted, airDirection, materialDirection,
    airLength, materialLength, spacing, displaySpeed, references };
}

export function dispersionFronts(q, t, material = false) {
  const n = material ? q.index : 1, spacing = q.spacing / n, speed = q.displaySpeed / n,
    length = material ? q.materialLength : q.airLength,
    start = material ? q.hit : q.incident[0],
    direction = material ? q.materialDirection : q.airDirection,
    // Delay through the air branch keeps the same crest continuous at the boundary.
    phase = speed * (t - (material ? q.airLength / q.displaySpeed : 0)),
    offset = ((phase % spacing) + spacing) % spacing, result = [];
  for (let d = offset; d <= length; d += spacing) {
    const center = start.map((v, j) => v + d * direction[j]),
      perpendicular = [-direction[1], direction[0], 0];
    result.push([-1, 1].map(sign => center.map((v, j) => v + sign * 0.11 * perpendicular[j])));
  }
  return result;
}

/** Signed E-field projections preserve phase as axes rotate past 90°.
 * Drawings are normalised to incident intensity, independently of the screen. */
export function polarisationConstruction(p) {
  const q = sampleCurriculum("polarisation", { t: 0 }, p),
    angles = p.mode ? [0, p.angle, p.thirdAngle] : [0, p.angle],
    xs = p.mode ? [-2.7, 0, 2.7] : [-2.7, 2.7],
    amplitudes = [Math.SQRT1_2];
  for (let i = 1; i < angles.length; i++)
    amplitudes.push(amplitudes[i - 1] * polarisationProjection(angles[i] - angles[i - 1]));
  return { ...q, angles, xs, amplitudes, intensities: p.mode ? [q.first, q.second, q.output] : [q.first, q.output] };
}

export function polarisationWave(q, stage, t, count = 121) {
  const start = q.xs[stage] + 0.12, end = (q.xs[stage + 1] ?? 4.5) - 0.12,
    angle = q.angles[stage] * DEG;
  return Array.from({ length: count }, (_, j) => {
    const x = start + (end - start) * j / (count - 1),
      e = 0.85 * q.amplitudes[stage] * Math.sin(2 * Math.PI * x / 1.7 - t * 3);
    return [x, 2.2 + e * Math.cos(angle), e * Math.sin(angle)];
  });
}

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
