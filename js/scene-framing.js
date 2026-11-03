/** Camera composition only. Fitting an apparatus changes no physical lengths,
 * positions, simulation state or reference scale. */
import * as T from '../vendor/three.module.min.js';

export function diagramLabelVisible(text='',width=2.25) {
  // Keep names, scale ticks and short ray labels on the apparatus. Paragraphs
  // and detached numerical banners belong in the HTML explanation/instruments.
  return text.length<=45 && !(width>3.5 && /[=≈]|\d.*(?:Pa|Hz|J|N|V|s)\b/.test(text));
}

export function apparatusBounds(root) {
  const bounds = new T.Box3(), box = new T.Box3();
  root.updateMatrixWorld(true);
  root.traverse(node => {
    if (node.userData.role==='label') {
      if (node.visible && diagramLabelVisible(node.userData.text,node.userData.labelWidth)) {
        const point=node.getWorldPosition(new T.Vector3()),pad=Math.min(.7,(node.userData.labelWidth||1)*.3);
        bounds.expandByPoint(point.clone().add(new T.Vector3(-pad,-.15,0)));
        bounds.expandByPoint(point.clone().add(new T.Vector3(pad,.15,0)));
      }
      return;
    }
    if (!node.isMesh || !node.geometry) return;
    for (let parent=node; parent && parent!==root; parent=parent.parent)
      if (['label','indicator','energy-kinetic','energy-potential','energy-dissipated'].includes(parent.userData.role)) return;
    if (node.isInstancedMesh) {
      if (!node.count) return;
      node.computeBoundingBox();
      box.copy(node.boundingBox);
    } else {
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      box.copy(node.geometry.boundingBox);
    }
    if (!box.isEmpty()) bounds.union(box.applyMatrix4(node.matrixWorld));
  });
  return bounds;
}

/** Fit all eight box corners in perspective, accounting for corner depth.
 * Unlike a bounding-sphere approximation this uses the actual view aspect. */
export function frameApparatus(bounds, {aspect=1.6,fov=38,azimuth=-0.28,polar=1.18,padding=1.13}={}) {
  if (!(aspect>0) || !(fov>0 && fov<179) || !(padding>=1) || bounds.isEmpty())
    throw new RangeError('A finite apparatus and a valid camera are required.');
  const target=bounds.getCenter(new T.Vector3()),
    outward=new T.Vector3(Math.sin(polar)*Math.sin(azimuth),Math.cos(polar),Math.sin(polar)*Math.cos(azimuth)),
    right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),outward).normalize(),
    up=new T.Vector3().crossVectors(outward,right).normalize(),
    tanV=Math.tan(fov*Math.PI/360),tanH=tanV*aspect;
  let radius=1;
  for (const x of [bounds.min.x,bounds.max.x]) for (const y of [bounds.min.y,bounds.max.y]) for (const z of [bounds.min.z,bounds.max.z]) {
    const relative=new T.Vector3(x,y,z).sub(target),depth=relative.dot(outward);
    radius=Math.max(radius,depth+padding*Math.abs(relative.dot(right))/tanH,depth+padding*Math.abs(relative.dot(up))/tanV);
  }
  if (![...target.toArray(),radius].every(Number.isFinite)) throw new RangeError('Non-finite apparatus bounds.');
  return {target:target.toArray(),radius,polar,azimuth};
}

/** Visible orbit and planet share one metres-to-scene scale. Frame their union,
 * including a small margin for the illustrative spacecraft and vector heads.
 * This adjusts only the camera: it cannot change the simulated trajectory. */
export function orbitBounds(reference, trail, state, scale, planetRadius) {
  if (!(scale>0) || !(planetRadius>0) || ![scale,planetRadius].every(Number.isFinite))
    throw new RangeError('A finite, positive orbital display scale is required.');
  const bounds=new T.Box3(new T.Vector3(-planetRadius,1-planetRadius,-planetRadius),new T.Vector3(planetRadius,1+planetRadius,planetRadius));
  const include=(x,y)=>{
    if (![x,y].every(Number.isFinite)) throw new RangeError('Non-finite orbital position.');
    bounds.expandByPoint(new T.Vector3(x*scale,1,-y*scale));
  };
  reference.forEach(([x,y])=>include(x,y));
  trail.forEach(point=>include(point.x,point.y));
  include(state.x,state.y);
  return bounds.expandByScalar(.45);
}

/** Fit the visible orbit samples directly. A rectangular box around an orbit
 * adds empty corners that take up much of a short workspace viewport. */
export function frameOrbit(reference, trail, state, scale, planetRadius, aspect) {
  const target = orbitBounds(reference, trail, state, scale, planetRadius).getCenter(new T.Vector3());
  const azimuth = -0.18, polar = 0.55;
  const outward = new T.Vector3(Math.sin(polar) * Math.sin(azimuth), Math.cos(polar), Math.sin(polar) * Math.cos(azimuth));
  const right = new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), outward).normalize();
  const up = new T.Vector3().crossVectors(outward, right);
  const verticalSlope = Math.tan(38 * Math.PI / 360) / 1.06;
  const horizontalSlope = verticalSlope * aspect;
  const relative = new T.Vector3();
  let radius = 1;
  function include(x, y, z, margin) {
    relative.set(x, y, z).sub(target);
    const depth = relative.dot(outward);
    radius = Math.max(
      radius,
      depth + (Math.abs(relative.dot(right)) + margin * Math.hypot(1, horizontalSlope)) / horizontalSlope,
      depth + (Math.abs(relative.dot(up)) + margin * Math.hypot(1, verticalSlope)) / verticalSlope,
    );
  }
  include(0, 1, 0, planetRadius * 1.05);
  for (const [x, y] of reference) include(x * scale, 1, -y * scale, 0.32);
  for (const { x, y } of trail) include(x * scale, 1, -y * scale, 0.32);
  include(state.x * scale, 1, -state.y * scale, 0.46);
  return { target: target.toArray(), radius, polar, azimuth };
}
