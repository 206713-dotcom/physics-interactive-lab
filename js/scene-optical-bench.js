/** Optical apparatus, not a ray-traced rendering engine. Principal rays use
 * the authoritative thin-lens/Snell calculations; glass shapes are illustrative. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, createSceneKit } from "./scene-kit.js";
import { lensConstruction, refractionConstruction } from "./optical-construction.js";
import { opticalBench, opticalMount, solidRay, dashedPath, angleArc } from "./scene-instruments.js";

export function lensGeometry(kind) {
  const profile = [], radius = 1.17, halfWidth = (r) => kind > 0
    ? 0.045 + 0.16 * Math.sqrt(Math.max(0, 1 - (r / radius) ** 2))
    : 0.035 + 0.17 * (r / radius) ** 2;
  for (let i = 0; i <= 40; i++) {
    const r = radius * i / 40; profile.push(new T.Vector2(r, -halfWidth(r)));
  }
  for (let i = 40; i >= 0; i--) {
    const r = radius * i / 40; profile.push(new T.Vector2(r, halfWidth(r)));
  }
  const g = new T.LatheGeometry(profile, 80);
  g.rotateZ(-Math.PI / 2); return g;
}

export function createLensApparatus(p, k) {
  const q = lensConstruction(p);
  opticalBench(k); opticalMount(k, 0, q.axis - 1.22);
  const lens = k.mesh(lensGeometry(p.kind), 0x9edfea, [0, q.axis, 0], { metalness: 0, roughness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide });
  lens.userData.role = "optical-lens";
  const frame = k.mesh(new T.TorusGeometry(1.22, 0.045, 12, 96), 0x91a9b7, [0, q.axis, 0], { metalness: 0.8, roughness: 0.22 });
  frame.rotation.y = Math.PI / 2;
  // Optical axis and both focal points share the horizontal distance scale.
  dashedPath(k, [[-4.6, q.axis, 0], [4.6, q.axis, 0]], C.muted, 0.45);
  for (const sign of [-1, 1]) {
    const x = sign * p.focal * q.scale;
    k.ball(0.045, C.white, [x, q.axis, 0]);
    k.label(sign < 0 ? "F₁" : "F₂", [x, q.axis - 0.35, 0], "#a7c4d5", 0.5);
  }
  const object = k.arrow([q.object[0], q.axis, 0], [0, q.height, 0], C.cyan);
  object.userData.role = "optical-object";
  opticalMount(k, q.object[0], q.axis);
  k.label("Object", [q.object[0], q.axis + q.height + 0.42, 0], "#64e8d1", 1.35);
  const flows = q.rays.map((points, i) => solidRay(k, points, i ? 0xa9d5f2 : C.gold));
  for (const points of q.extensions) dashedPath(k, points, C.purple, 0.65);
  if (q.image && !q.offBench) {
    const image = k.arrow([q.image[0], q.axis, 0], [0, q.image[1] - q.axis, 0], C.purple);
    image.userData.role = "optical-image";
    k.label(q.image[0] > 0 ? "Real · inverted" : "Virtual · upright", [q.image[0], q.image[0] > 0 ? 3.7 : 4.3, 0], "#c3a6ff", 2.2);
    if (q.image[0] > 0) {
      opticalMount(k, q.image[0], q.axis - 1.35);
      k.glass(0.025, 2.7, 1.45, [q.image[0], q.axis, 0]);
    }
  }
  const outcome = q.image === null ? "Object at focus · outgoing rays parallel"
    : q.offBench ? `Image beyond the bench · v = ${q.image[0] / q.scale > 100 ? (q.image[0] / q.scale).toExponential(2) : (q.image[0] / q.scale).toFixed(2)} m`
    : p.kind > 0 ? "Two rays. One image." : "Back-project the diverging rays.";
  k.label(outcome, [0, 4.95, 0], "#d4e4ed", 5.3);
  k.label(p.kind > 0 ? "CONVERGING" : "DIVERGING", [0, 0.52, 1.35], "#94c1d5", 2.1);
  return {
    construction: q,
    update(s, values, lab) { flows.forEach((flow) => flow(s.t * 0.28, lab.vectors !== false)); },
  };
}

/** A protractor board puts the normal, angle sectors and ray junction in one
 * plane. Path colours are a teaching key; the small source face retains the
 * selected wavelength colour. All endpoints still come from Snell's law. */
export function createRefractionApparatus(p, root, color = C.gold, options = {}) {
  const k=createSceneKit(root,options),q=refractionConstruction(p),introductory=options.studyMode==='igcse',
    gold=0xa77827,teal=0x087d79,purple=0x7d59a8,flows=[],cx=q.hit[0],cy=q.hit[1];
  k.stand(9.1,2.7);
  k.box(8.5,4.8,.13,0x3a5c73,[0,2.25,-.3],{metalness:.25,roughness:.5});
  // Refractive index changes only a qualitative tint, not an absorption model.
  for(const [n,y,tint] of [[p.n1,3.35,0xc5dceb],[p.n2,1.05,0xb5dde1]]) {
    const fill=new T.Color(0xf2f7fb).lerp(new T.Color(tint),Math.min(1,(n-1)/1.4)*.65+.1),
      panel=k.box(8.3,2.3,.02,0xffffff,[0,y,-.21]);
    panel.material.dispose();panel.material=new T.MeshBasicMaterial({color:fill,toneMapped:false});
    panel.userData.role='optical-medium';panel.userData.refractiveIndex=n;
  }
  for(const x of [-4,4])for(const y of [.08,4.42])k.ball(.035,0x7a99ac,[x,y,-.17]);
  k.line([[-4.1,cy,-.16],[4.1,cy,-.16]],0x4a8298,.8);
  // 0 degrees is the normal in each medium; 90 degrees is the boundary.
  const rim=Array.from({length:145},(_,i)=>{
    const a=i/144*Math.PI*2;return [cx+2.04*Math.sin(a),cy+2.04*Math.cos(a),-.14];
  });
  k.line(rim,0x799cac,.45);
  for(let deg=0;deg<360;deg+=5) {
    const a=deg*Math.PI/180,r=deg%30===0?1.91:deg%10===0?1.97:2.0;
    k.line([[cx+r*Math.sin(a),cy+r*Math.cos(a),-.12],[cx+2.04*Math.sin(a),cy+2.04*Math.cos(a),-.12]],0x5f8499,.8);
    if(deg%30===0) {
      const mod=deg%180,label=Math.min(mod,180-mod);
      k.label(label+'°',[cx+1.77*Math.sin(a),cy+1.77*Math.cos(a),-.08],'#40647a',.4,'ink');
    }
  }
  dashedPath(k,[[cx,.12,.03],[cx,4.32,.03]],0x3d687f,.8);
  k.label('Normal',[.65,4.4,.1],'#426a80',1.0,'ink');
  k.label(`n₁ = ${p.n1.toFixed(2)}`,[-3.0,3.25,.1],'#3f647d',1.65,'paper');
  k.label(`n₂ = ${p.n2.toFixed(2)}`,[-3.0,1.1,.1],'#286c78',1.65,'paper');
  const sector=(radius,start,end,ink)=>{
    const points=[new T.Vector2(0,0)];
    for(let i=0;i<=48;i++) {
      const a=start+(end-start)*i/48;points.push(new T.Vector2(radius*Math.sin(a),radius*Math.cos(a)));
    }
    const mesh=new T.Mesh(new T.ShapeGeometry(new T.Shape(points)),new T.MeshBasicMaterial({color:ink,transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false,toneMapped:false}));
    k.add(mesh,[cx,cy,-.05],'angle-sector');
  };
  sector(.72,-p.angle*Math.PI/180,0,gold);
  angleArc(k,q.hit,.72,-p.angle*Math.PI/180,0,gold);
  k.label(`i = ${p.angle.toFixed(1)}°`,[3.0,2.85,.15],'#8d641f',1.5,'paper');
  k.label('i',[-.26,cy+.55,.12],'#8d641f',.22,'ink');
  const incident=solidRay(k,q.incident,gold);flows.push([incident,p.n1]);
  const reflectionVisible=q.reflectance>1e-8,transmissionVisible=!!q.transmitted && q.transmission>1e-8;
  if(reflectionVisible)flows.push([solidRay(k,q.reflected,purple,Math.max(.45,q.reflectance)),p.n1]);
  if(transmissionVisible) {
    flows.push([solidRay(k,q.transmitted,teal,Math.max(.45,q.transmission)),p.n2]);
    sector(.72,Math.PI-q.refracted*Math.PI/180,Math.PI,teal);
    angleArc(k,q.hit,.72,Math.PI-q.refracted*Math.PI/180,Math.PI,teal);
    k.label(`r = ${q.refracted.toFixed(1)}°`,[3.0,1.7,.15],'#076e69',1.5,'paper');
    k.label('r',[.23,cy-.55,.12],'#076e69',.22,'ink');
  }
  k.label('Incident',[-2.95,4.05,.12],'#8d641f',1.35,'paper');
  k.label(reflectionVisible?'Reflected':'No reflection',[2.95,4.05,.12],reflectionVisible?'#72519a':'#617d8c',1.55,'paper');
  k.label(transmissionVisible?'Refracted':q.tir?'No refracted ray':'No transmitted beam',[2.95,.55,.12],transmissionVisible?'#076e69':'#617d8c',1.8,'paper');
  // The lamp face shows physical wavelength colour. The path inks above are
  // kept distinct and legible so a weak reflected path is still identifiable.
  const source=new T.Vector3(...q.incident[0]),towards=new T.Vector3(...q.hit).sub(source).normalize(),
    housing=k.cylinder(.11,.3,0x3b5b70,source.clone().addScaledVector(towards,-.15).toArray(),{metalness:.5,roughness:.35});
  housing.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),towards);
  k.ball(.065,color,source.toArray(),{emissive:color,emissiveIntensity:.6,metalness:0,roughness:.3});
  if(!introductory) {
    k.label(`R = ${(q.reflectance*100).toFixed(1)}%`,[3.0,3.6,.12],'#72519a',1.4,'paper');
    k.label(`T = ${(q.transmission*100).toFixed(1)}%`,[3.0,1.0,.12],'#076e69',1.4,'paper');
  }
  const status=q.tir?'Total internal reflection':p.n1===p.n2?'Equal indices · no bending':p.n2>p.n1?'Bends towards the normal':'Bends away from the normal';
  k.label(status,[0,.02,.9],'#426a80',3.6,'paper');
  return {
    target:[0,2.25,0],radius:8.5,fitAspect:1.7,polar:1.35,azimuth:-.08,kit:k,construction:q,planar:true,
    branches:{reflected:reflectionVisible,transmitted:transmissionVisible},
    update(lab) {
      flows.forEach(([flow,n])=>flow(lab.state.t*.3/n,lab.vectors!==false));
      k.visibility(lab.showLabels!==false,lab.vectors!==false);
    },
  };
}
