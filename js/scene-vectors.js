/** A reactive vector workbench: meshes survive parameter edits. Construction
 * animation translates / reveals fixed vectors; it is never force evolution. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, setPath } from "./scene-kit.js";
import {
  vectorConstruction,
  parametersFromVectorPoint,
} from "./vector-geometry.js";
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t),
  n = (x) => Number(x.toFixed(2)).toString();
export function createVectorApparatus(params, k) {
  const plane = k.box(9.1, 5.9, 0.09, 0x0b2334, [0, 2.65, -0.19], {
    metalness: 0.05,
    roughness: 0.9,
  });
  plane.receiveShadow = false;
  const border = k.line(
    [
      [-4.55, -0.3, -0.12],
      [-4.55, 5.6, -0.12],
      [4.55, 5.6, -0.12],
      [4.55, -0.3, -0.12],
      [-4.55, -0.3, -0.12],
    ],
    0x37566b,
    0.7,
  );
  const grid = new T.Group(),
    guides = new T.Group(),
    angleGroup = new T.Group();
  k.add(grid);
  k.add(guides);
  k.add(angleGroup);
  const gridLines = Array.from({ length: 22 }, () => {
    const o = k.line([], 0x557d90, 0.17);
    grid.add(o);
    return o;
  });
  const tickLabels = Array.from({ length: 10 }, () => {
    const o = k.label("", [0, 0, 0], "#7c9cae", 0.55);
    grid.add(o);
    return o;
  });
  const xAxis = k.line([], 0x719aaa, 0.65),
    yAxis = k.line([], 0x719aaa, 0.65);
  const xLabel = k.label("+x / N", [4.1, 0.25, 0], "#91aebf", 1.1),
    yLabel = k.label("+y / N", [-4.1, 5.3, 0], "#91aebf", 1.1);
  const A = k.arrow([0, 0, 0], [1, 0, 0], C.cyan),
    B = k.arrow([0, 0, 0], [1, 0, 0], C.gold),
    R = k.arrow([0, 0, 0], [1, 0, 0], C.purple);
  R.children[0].geometry.dispose();
  R.children[0].geometry = new T.CylinderGeometry(0.048, 0.048, 1, 14);
  R.renderOrder = 1;
  A.renderOrder = B.renderOrder = 2;
  const projectionX = k.line([], C.blue, 0.6),
    projectionY = k.line([], C.blue, 0.6),
    ghostA = k.line([], C.cyan, 0.35),
    ghostB = k.line([], C.gold, 0.35);
  [projectionX, projectionY, ghostA, ghostB].forEach((o) => guides.add(o));
  const arc = k.line([], C.gold, 0.85);
  angleGroup.add(arc);
  const theta = k.label("", [0, 0, 0], "#ffc584", 1.3);
  angleGroup.add(theta);
  const labels = [
    k.label("A", [0, 0, 0], "#64e8d1", 2),
    k.label("B", [0, 0, 0], "#ffc584", 2),
    k.label("R", [0, 0, 0], "#c3a6ff", 2.2),
  ];
  const rx = k.label("", [0, 0, 0], "#89baff", 1.8),
    ry = k.label("", [0, 0, 0], "#89baff", 1.8);
  guides.add(rx, ry);
  const origin = k.ball(0.065, C.white, [0, 0, 0], { metalness: 0 }),
    end = k.ball(0.065, C.purple, [0, 0, 0], {
      emissive: C.purple,
      emissiveIntensity: 0.3,
    });
  const handles = ["a", "b"].map((id, i) => {
    const ring = k.mesh(
      new T.TorusGeometry(0.16, 0.022, 8, 40),
      i ? C.gold : C.cyan,
      [0, 0, 0.04],
      { emissive: i ? C.gold : C.cyan, emissiveIntensity: 0.25, metalness: 0 },
    );
    ring.userData.handle = id;
    const target = new T.Mesh(
      new T.SphereGeometry(0.25, 16, 12),
      new T.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      }),
    );
    target.userData.handle = id;
    k.add(target);
    return { ring, target, id };
  });
  const state = {
    layout: null,
    method: "triangle",
    params,
    progress: 1,
    drag: null,
  };
  let gridKey = "";
  // Reuse separate segment buffers for projections and parallelogram guides.
  const segmentLines = [projectionX, projectionY, ghostA, ghostB].map(
    (line) => {
      const next = new T.LineSegments(line.geometry, line.material);
      guides.add(next);
      guides.remove(line);
      const index = k.objects.indexOf(line);
      k.objects[index] = next;
      return next;
    },
  );
  const dotted = (line, a, b) => {
    const pts = [];
    for (let i = 0; i < 24; i += 2)
      pts.push(mix(a, b, i / 24), mix(a, b, (i + 1) / 24));
    setPath(line, pts);
  };
  function update(s, q, lab) {
    const p = lab.params || params,
      method = lab.vectorMethod || "triangle",
      progress = lab.vectorProgress ?? 1,
      construction = vectorConstruction(p, method, progress),
      layout = state.drag?.layout || construction.layout;
    const { bx, by } = construction.layout,
      point = (x, y) => [
        layout.origin[0] + x * layout.scale,
        layout.origin[1] + y * layout.scale,
        0,
      ],
      O = layout.origin,
      headA = point(p.a, 0),
      tip = point(q.x, q.y),
      headB = point(bx, by),
      tail =
        method === "parallelogram" ? O : point(p.a * construction.slide, 0);
    state.layout = layout;
    state.params = p;
    state.method = method;
    state.progress = progress;
    k.setArrow(A, O, [p.a * layout.scale * construction.aGrow, 0, 0]);
    k.setArrow(B, tail, [
      bx * layout.scale * (progress <= 0.2 ? 0 : 1),
      by * layout.scale * (progress <= 0.2 ? 0 : 1),
      0,
    ]);
    k.setArrow(R, O, [
      q.x * layout.scale * construction.rGrow,
      q.y * layout.scale * construction.rGrow,
      0,
    ]);
    const key = [...Object.values(p), ...O, layout.scale].join("|");
    if (key !== gridKey) {
      gridKey = key;
      const step = layout.scale < 0.3 ? 5 : 2;
      let j = 0,
        l = 0;
      for (let value = -30; value <= 40; value += step) {
        const x = O[0] + value * layout.scale;
        if (x >= -4.3 && x <= 4.3) {
          setPath(gridLines[j++], [
            [x, 0.1, -0.11],
            [x, 5.25, -0.11],
          ]);
          if (value % (step * 2) === 0 && l < 6) {
            k.setLabel(tickLabels[l], String(value), "#7c9cae", 0.55);
            tickLabels[l++].position.set(x, 0.35, -0.04);
          }
        }
        if (j >= 16) break;
      }
      for (let value = 0; value <= 25; value += step) {
        const y = O[1] + value * layout.scale;
        if (y > 0.4 && y < 5.3 && j < 22)
          setPath(gridLines[j++], [
            [-4.3, y, -0.11],
            [4.3, y, -0.11],
          ]);
      }
      for (; j < 22; j++) setPath(gridLines[j], []);
      for (; l < 10; l++) k.setLabel(tickLabels[l], "", "#7c9cae", 0.55);
    }
    setPath(xAxis, [
      [-4.25, O[1], -0.06],
      [4.25, O[1], -0.06],
    ]);
    setPath(yAxis, [
      [O[0], 0.3, -0.06],
      [O[0], 5.3, -0.06],
    ]);
    xLabel.position.set(3.9, O[1] - 0.35, 0);
    yLabel.position.set(O[0] + 0.55, 5.25, 0);
    dotted(segmentLines[0], O, [tip[0], O[1], 0]);
    dotted(segmentLines[1], [tip[0], O[1], 0], tip);
    dotted(segmentLines[2], headB, tip);
    dotted(segmentLines[3], headA, tip);
    guides.visible =
      lab.vectorComponents !== false ||
      method === "parallelogram" ||
      method === "components";
    segmentLines[0].visible = segmentLines[1].visible =
      (method === "components" || lab.vectorComponents !== false) &&
      construction.components > 0.01;
    segmentLines[2].visible = segmentLines[3].visible =
      method === "parallelogram";
    k.setLabel(rx, "Rₓ = " + n(q.x) + " N", "#89baff", 2);
    rx.position.set((O[0] + tip[0]) / 2, O[1] - 0.55, 0.02);
    k.setLabel(ry, "Rᵧ = " + n(q.y) + " N", "#89baff", 2);
    ry.position.set(
      tip[0] + (tip[0] > 2 ? -1.05 : 1.05),
      (O[1] + tip[1]) / 2,
      0.02,
    );
    rx.visible = ry.visible = segmentLines[0].visible && q.y > 1e-8;
    const labelA = mix(O, headA, 0.45),
      labelB = mix(
        tail,
        tail.map((v, i) => v + [bx * layout.scale, by * layout.scale, 0][i]),
        0.55,
      ),
      labelR = mix(O, tip, 0.56),
      angle = Math.atan2(q.y, q.x);
    labels[0].position.set(labelA[0], labelA[1] + 0.55, 0.09);
    labels[1].position.set(labelB[0] + 0.35, labelB[1] + 0.4, 0.09);
    labels[2].position.set(
      labelR[0] - 0.65 * Math.sin(angle),
      labelR[1] + 0.65 * Math.cos(angle),
      0.1,
    );
    if (q.y < 1e-6) {
      labels[2].position.set((O[0] + tip[0]) / 2, O[1] + 1.45, 0.1);
      labels[0].position.y = O[1] + 0.45;
      labels[1].position.y = O[1] - 0.65;
    }
    if (p.a * layout.scale < 1.3)
      labels[0].position.set(O[0] - 1.1, O[1] + 0.4, 0.09);
    if (p.b * layout.scale < 1.3)
      labels[1].position.set(headA[0] + 1.1, headA[1] + 0.4, 0.09);
    if (q.resultant * layout.scale < 1.3)
      labels[2].position.set(O[0], O[1] + 1.4, 0.1);
    k.setLabel(labels[0], "A · " + n(p.a) + " N", "#64e8d1", 1.9);
    k.setLabel(labels[1], "B · " + n(p.b) + " N", "#ffc584", 1.9);
    k.setLabel(labels[2], "R · " + n(q.resultant) + " N", "#c3a6ff", 2.15);
    const radius = Math.min(0.75, Math.max(0.3, p.b * layout.scale * 0.3)),
      center = tail;
    setPath(
      arc,
      Array.from({ length: 49 }, (_, i) => {
        const a = (((p.angle * Math.PI) / 180) * i) / 48;
        return [
          center[0] + radius * Math.cos(a),
          center[1] + radius * Math.sin(a),
          0.07,
        ];
      }),
    );
    k.setLabel(theta, n(p.angle) + "°", "#ffc584", 1);
    const halfAngle = (p.angle * Math.PI) / 360;
    theta.position.set(
      center[0] + (radius + 0.2) * Math.cos(halfAngle),
      center[1] + (radius + 0.2) * Math.sin(halfAngle),
      0.1,
    );
    angleGroup.visible = lab.vectorAngle !== false && p.b > 0 && p.angle > 0;
    for (const label of [...labels, rx, ry, theta]) {
      const half = label.scale.x / 2;
      label.position.x = T.MathUtils.clamp(
        label.position.x,
        -4.45 + half,
        4.45 - half,
      );
    }
    origin.position.set(...O);
    end.position.set(...tip);
    end.visible = construction.rGrow > 0.99;
    grid.visible = lab.vectorGrid !== false;
    handles[0].ring.position.set(...headA);
    handles[1].ring.position.set(...(method === "parallelogram" ? headB : tip));
    handles.forEach((h) => {
      h.target.position.copy(h.ring.position);
      h.ring.visible = progress >= 1;
      h.target.visible = progress >= 1;
    });
    // Parent-group visibility survives the common label/indicator visibility pass.
    rx.userData.vectorVisible = rx.visible;
    ry.userData.vectorVisible = ry.visible;
  }
  const raycaster = new T.Raycaster(),
    planeHit = new T.Plane(new T.Vector3(0, 0, 1), 0),
    hit = new T.Vector3();
  const interaction = {
    pick(ndc, camera) {
      if (state.progress < 1) return null;
      k.root.updateMatrixWorld(true);
      raycaster.setFromCamera(ndc, camera);
      return (
        raycaster.intersectObjects(
          handles.map((h) => h.target),
          false,
        )[0]?.object.userData.handle || null
      );
    },
    begin(handle) {
      state.drag = {
        handle,
        layout: state.layout,
        params: { ...state.params },
        method: state.method,
      };
    },
    move(ndc, camera) {
      if (!state.drag) return null;
      raycaster.setFromCamera(ndc, camera);
      if (
        Math.abs(raycaster.ray.direction.z) < 0.08 ||
        !raycaster.ray.intersectPlane(planeHit, hit)
      )
        return null;
      return parametersFromVectorPoint(
        state.drag.handle,
        [hit.x, hit.y, 0],
        state.drag.layout,
        state.drag.params,
        state.drag.method,
      );
    },
    end() {
      state.drag = null;
    },
  };
  return {
    liveParams: true,
    interaction,
    update,
    afterVisibility(lab) {
      labels[1].visible = lab.showLabels !== false && state.progress > 0.2;
      labels[2].visible = lab.showLabels !== false && state.progress > 0.55;
      for (const label of tickLabels)
        label.visible = lab.showLabels !== false && label.userData.text !== "";
      rx.visible = lab.showLabels !== false && rx.userData.vectorVisible;
      ry.visible = lab.showLabels !== false && ry.userData.vectorVisible;
    },
    get layout() {
      return state.layout;
    },
  };
}
