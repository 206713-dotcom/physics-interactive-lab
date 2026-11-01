/** A calibrated, open-top laboratory tank. Every vertical position (including
 * the cube and waterline) uses the same six scene units per metre. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, setPath } from "./scene-kit.js";
import { waterSurface } from "./scene-finish.js";
import { TANK_DEPTH, SUPPORT_HEIGHT, BUOYANCY_STATUS } from "./buoyancy-physics.js";

export function createBuoyancyApparatus(p, k) {
  const scale = 6, floor = 0.14,
    surface = floor + TANK_DEPTH * scale,
    side = Math.cbrt(p.volume) * scale,
    width = 4.1, depth = 2.5, height = 3.65;
  k.stand(5.8, 3.8);
  const metal = { metalness: 0.72, roughness: 0.26 },
    glass = { transparent: true, opacity: 0.065, depthWrite: false, metalness: 0.05, roughness: 0.18 };
  // Separate panes keep the front clear; the highlights describe the edges.
  k.box(width, 0.09, depth, 0x7b9da9, [0, floor - 0.045, 0], metal);
  for (const x of [-width / 2, width / 2]) {
    k.box(0.035, height, depth, 0xc0e9ef, [x, floor + height / 2, 0], glass);
    for (const z of [-depth / 2, depth / 2])
      k.rod([x, floor, z], [x, floor + height, z], 0xb1d7de, 0.018);
  }
  for (const z of [-depth / 2, depth / 2]) {
    k.box(width, height, 0.018, 0xa2d7e6, [0, floor + height / 2, z], { ...glass, opacity: z > 0 ? 0.025 : 0.075 });
    k.rod([-width / 2, floor + height, z], [width / 2, floor + height, z], 0x90bcc8, 0.025);
  }
  for (const x of [-width / 2, width / 2])
    k.rod([x, floor + height, -depth / 2], [x, floor + height, depth / 2], 0x90bcc8, 0.025);
  k.box(width - 0.05, TANK_DEPTH * scale, depth - 0.05, 0x2b9dbc, [0, floor + TANK_DEPTH * scale / 2, 0], {
    transparent: true, opacity: 0.085, depthWrite: false, roughness: 0.35, metalness: 0,
  });
  const water = waterSurface(width - 0.04, depth - 0.04);
  water.rotation.x = -Math.PI / 2;
  k.add(water, [0, surface, 0]);
  k.line([[-width / 2, surface, depth / 2], [width / 2, surface, depth / 2]], 0x91e8ed, 0.6);
  k.line([[-width / 2, surface, -depth / 2], [width / 2, surface, -depth / 2]], 0x91e8ed, 0.4);
  k.line([[width/2,surface,depth/2],[width/2+.48,surface,depth/2]],0x8be5ed,.8);
  k.label('Liquid surface',[width/2+.52,surface+.2,depth/2],'#a6e9ec',1.35);
  // Permeable support: the actual solver permits liquid below the cube.
  for (let x = -1.8; x <= 1.8; x += 0.24)
    k.box(0.045, SUPPORT_HEIGHT * scale, depth - 0.12, 0x5f7b86, [x, floor + SUPPORT_HEIGHT * scale / 2, 0], metal);
  for (const z of [-0.95, 0, 0.95])
    k.box(width - 0.14, 0.012, 0.045, 0xabc3ca, [0, floor + SUPPORT_HEIGHT * scale, z], metal);
  const rulerX = -2.38;
  k.box(0.17, 3.15, 0.075, 0xc5dbe4, [rulerX, surface - 1.5, 1.31], { metalness: 0.15, roughness: 0.7 });
  for (let i = 0; i <= 20; i++) {
    const y = surface - i * 0.15;
    k.line([[rulerX - 0.06, y, 1.36], [rulerX + (i % 4 ? 0.07 : 0.15), y, 1.36]], 0x345971, 0.95);
    if (!(i % 4)) k.label((i / 40).toFixed(1) + " m", [-2.85, y, 1.35], "#a8c7d8", 0.67);
  }
  const body = k.box(side, side, side, C.gold, [0, 2, 0], { metalness: 0.55, roughness: 0.28 }),
    bodyDetail = new T.Group();
  body.add(bodyDetail);
  const edge=new T.LineSegments(new T.EdgesGeometry(body.geometry,32),new T.LineBasicMaterial({color:0xffe0a3,transparent:true,opacity:.65}));
  body.add(edge);
  // Tint only the actual submerged portion of each cube face. These overlays
  // use the solver's immersion fraction; they do not move the reservoir surface
  // or add an imagined water wave / displaced-volume measurement.
  const immersedFaces=[];
  for(let i=0;i<4;i++) {
    const face=new T.Mesh(new T.PlaneGeometry(side,1),new T.MeshBasicMaterial({color:0x32bdd0,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    face.userData.role='buoyancy-submerged-face';face.rotation.y=i*Math.PI/2;
    face.position.set(Math.sin(i*Math.PI/2)*(side/2+.006),0,Math.cos(i*Math.PI/2)*(side/2+.006));
    bodyDetail.add(face);immersedFaces.push(face);
  }
  const immersionLine=k.line([],0x99f6f4,.95);immersionLine.userData.role='buoyancy-immersion-line';
  for (const z of [-side / 2 - 0.001, side / 2 + 0.001]) {
    const inset = k.box(side * 0.72, side * 0.72, 0.004, 0xab743d, [0, 0, z], { metalness: 0.6, roughness: 0.4 });
    bodyDetail.add(inset);
    const face = k.box(side * 0.64, side * 0.64, 0.005, 0xd8a567, [0, 0, z * 1.01], { metalness: 0.4, roughness: 0.45 });
    bodyDetail.add(face);
    for (const x of [-0.25, 0.25]) {
      const screw = k.ball(side * 0.022, 0x4a4540, [x * side, side * 0.25, z * 1.025]);
      bodyDetail.add(screw);
    }
  }
  const up = k.arrow([1, 2, 0], [0, 1, 0], C.cyan),
    weight = k.arrow([-1, 2, 0], [0, -1, 0], C.gold),
    drag = k.arrow([1.5, 2, 0], [0, 1, 0], C.blue),
    normal = k.arrow([0, 0.3, 0], [0, 1, 0], C.purple),
    status = k.label("Release from rest", [0, 4.65, 0], "#cfdee9", 4.2),
    wl = k.label("Weight", [-1.35, 4.07, 0], "#ffc584", 2),
    ul = k.label("Upthrust", [1.35, 4.07, 0], "#64e8d1", 2),
    supportLabel = k.label("Support force", [1.65, floor + 0.25, 1.75], "#c3a6ff", 1.65);
  const weightLeader=k.line([],C.gold,.5);
  const supportGuide=k.line([],C.purple,.55);
  weightLeader.userData.role='buoyancy-force-leader';
  for(const [arrow,quantity] of [[up,'upthrust'],[weight,'weight'],[drag,'drag'],[normal,'normal']]) {
    arrow.userData.quantity=quantity;
    arrow.children[0].material.emissiveIntensity=.28;
  }
  body.userData.role = "buoyancy-body";
  return {
    update(s, q) {
      const y = floor + q.y * scale,
        unit = 1.35 / Math.max(q.weight, q.capacity, 1e-8);
      body.position.y = y;
      const immersedHeight=side*q.fraction;
      for(const face of immersedFaces) {
        face.scale.y=immersedHeight;
        face.position.y=(immersedHeight-side)/2;
        face.visible=q.fraction>1e-8;
      }
      const edgeOffset=side/2+.009;
      setPath(immersionLine,[[-edgeOffset,surface,-edgeOffset],[edgeOffset,surface,-edgeOffset],[edgeOffset,surface,edgeOffset],[-edgeOffset,surface,edgeOffset],[-edgeOffset,surface,-edgeOffset]]);
      immersionLine.visible=q.fraction>1e-8 && q.fraction<1-1e-8;
      water.material.uniforms.time.value = s.t;
      water.material.uniforms.motion.value = Math.min(1, Math.abs(q.v) * 3) * Math.exp(-Math.abs(y - surface) * 1.6);
      // Move a long weight arrow upward when the cube rests on the floor.
      // Its length and direction retain the same force scale; a leader makes
      // this display offset explicit rather than hiding the tip below the base.
      const weightY=Math.max(y,floor+.08+q.weight*unit);
      k.setArrow(weight, [-side / 2 - 0.36, weightY, 0.7], [0, -q.weight * unit, 0]);
      setPath(weightLeader,[[-side/2,y,.7],[-side/2-.36,weightY,.7]]);
      weightLeader.visible=weightY-y>1e-8;
      k.setArrow(up, [side / 2 + 0.36, y, 0.7], [0, q.upthrust * unit, 0]);
      k.setArrow(drag, [side / 2 + 0.92, y, 0.7], [0, q.drag * unit, 0]);
      k.setArrow(normal, [0, floor + 0.04, 0.85], [0, q.normal * unit, 0]);
      setPath(supportGuide,[[0,floor+.04+q.normal*unit,.85],[.87,floor+.25,1.75]]);
      supportGuide.visible=q.normal>1e-8;
      k.setLabel(status, BUOYANCY_STATUS[q.status] + " · " + q.immersion.toFixed(1) + "% immersed", "#cfdee9", 4.2);
      k.setLabel(wl, "Weight ↓", "#ffc584", 1.45);
      wl.position.set(-side/2-.68,Math.max(floor+.22,y-.65),1.05);
      k.setLabel(ul, "Upthrust ↑", "#64e8d1", 1.6);
      ul.position.set(side/2+.73,y+.75,1.05);
      supportLabel.userData.show = q.normal > 1e-8;
    },
    afterVisibility(lab) {
      weightLeader.visible=weightLeader.visible && lab.vectors!==false;
      supportLabel.visible = lab.showLabels !== false && supportLabel.userData.show;
      supportGuide.visible=supportLabel.visible && lab.vectors!==false;
      status.visible = lab.showLabels !== false && !lab.cleanPresentation;
    },
  };
}
