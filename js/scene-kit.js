/** Reusable 3D apparatus. Display transforms never modify physical state. */
import * as T from "../vendor/three.module.min.js";
import { roundedBox } from "./scene-finish.js";
export const PALETTE = {
  cyan: 0x64e8d1,
  gold: 0xffc584,
  blue: 0x89baff,
  purple: 0xc3a6ff,
  white: 0xe1eff6,
  muted: 0x658a9f,
  red: 0xff8e7f,
  dark: 0x15344a,
};
const Y = new T.Vector3(0, 1, 0),
  aV = new T.Vector3(),
  bV = new T.Vector3(),
  delta = new T.Vector3();
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function putRod(mesh, a, b) {
  aV.set(...a);
  bV.set(...b);
  delta.subVectors(bV, aV);
  const length = delta.length();
  mesh.visible = length > 1e-9;
  mesh.position.copy(aV).add(bV).multiplyScalar(0.5);
  mesh.scale.y = Math.max(length, 1e-9);
  if (length) mesh.quaternion.setFromUnitVectors(Y, delta.divideScalar(length));
}
/** Reuse typed buffers throughout an animation instead of allocating per frame. */
export function setPath(line, points) {
  let attribute = line.geometry.getAttribute("position");
  if (!attribute || attribute.count < points.length) {
    const capacity = Math.max(points.length, attribute?.count * 2 || 2);
    attribute = new T.BufferAttribute(new Float32Array(capacity * 3), 3);
    attribute.setUsage(T.DynamicDrawUsage);
    line.geometry.setAttribute("position", attribute);
  }
  for (let i = 0; i < points.length; i++) attribute.setXYZ(i, ...points[i]);
  attribute.needsUpdate = true;
  line.geometry.setDrawRange(0, points.length);
  line.frustumCulled = false;
}
function textTexture(text, color) {
  const canvas = document.createElement("canvas"),
    c = canvas.getContext("2d");
  c.font = "600 60px Segoe UI,sans-serif";
  canvas.width = Math.max(
    128,
    Math.min(1900, Math.ceil(c.measureText(text).width) + 58),
  );
  canvas.height = 110;
  c.fillStyle = "rgba(8,19,31,.86)";
  c.beginPath();
  c.roundRect(3, 3, canvas.width - 6, 104, 16);
  c.fill();
  c.strokeStyle = "rgba(150,206,222,.16)";
  c.lineWidth = 2;
  c.stroke();
  c.font = "500 60px Segoe UI,sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(text, canvas.width / 2, 57, canvas.width - 35);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
export function createSceneKit(root, { labels = true } = {}) {
  const annotations = [],
    indicators = [],
    objects = [],
    shared = new Map();
  const material = (color, extra = {}) =>
    new T.MeshStandardMaterial({
      color,
      metalness: 0.16,
      roughness: 0.4,
      envMapIntensity: 0.6,
      ...extra,
    });
  const add = (mesh, pos = [0, 0, 0], role = "apparatus") => {
    mesh.position.set(...pos);
    mesh.userData.role = role;
    root.add(mesh);
    objects.push(mesh);
    return mesh;
  };
  const mat = (color) => {
    if (!shared.has(color)) shared.set(color, material(color));
    return shared.get(color);
  };
  const mesh = (geometry, color, pos, extra = {}) => {
    const o = new T.Mesh(
      geometry,
      Object.keys(extra).length ? material(color, extra) : mat(color),
    );
    o.castShadow = true;
    o.receiveShadow = true;
    return add(o, pos);
  };
  const box = (w, h, d, color, pos, extra) =>
    mesh(Math.min(w, h, d) >= 0.075 ? roundedBox(w, h, d) : new T.BoxGeometry(w, h, d), color, pos, extra);
  const ball = (r, color, pos, extra) =>
    mesh(new T.SphereGeometry(r, 40, 28), color, pos, extra);
  const cylinder = (r, h, color, pos, extra) =>
    mesh(new T.CylinderGeometry(r, r, h, 36), color, pos, extra);
  const line = (points, color = PALETTE.cyan, opacity = 1) => {
    const o = new T.Line(
      new T.BufferGeometry(),
      new T.LineBasicMaterial({
        color,
        opacity,
        transparent: opacity < 1,
        toneMapped: false,
      }),
    );
    setPath(o, points);
    return add(o, [0, 0, 0], "path");
  };
  const rod = (a, b, color = PALETTE.white, r = 0.035) => {
    const o = cylinder(r, 1, color);
    putRod(o, a, b);
    return o;
  };
  const setArrow = (o, origin, vector) => {
    const length = Math.hypot(...vector);
    o.position.set(...origin);
    o.userData.vectorLength = length;
    if (length) {
      o.quaternion.setFromUnitVectors(
        Y,
        new T.Vector3(...vector).divideScalar(length),
      );
      const head = Math.min(0.24, length * 0.3),
        shaft = Math.max(1e-8, length - head);
      o.children[0].scale.y = shaft;
      o.children[0].position.y = shaft / 2;
      o.children[1].scale.set(
        Math.min(1, length / 0.5),
        head / 0.24,
        Math.min(1, length / 0.5),
      );
      o.children[1].position.y = length - head / 2;
    }
    o.visible = length > 1e-8;
  };
  const arrow = (origin, vector, color = PALETTE.gold) => {
    const o = new T.Group(),
      // A small emission keeps the teaching colours legible while soft studio
      // reflections reveal the cylindrical shaft and conical arrow head.
      m = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.18, metalness: 0.18, roughness: 0.36 });
    o.add(
      new T.Mesh(new T.CylinderGeometry(0.032, 0.032, 1, 10), m),
      new T.Mesh(new T.ConeGeometry(0.09, 0.24, 16), m),
    );
    add(o, origin, "indicator");
    indicators.push(o);
    setArrow(o, origin, vector);
    return o;
  };
  const label = (text, pos, color = "#cfe6ef", width = 2.25) => {
    let o;
    if (labels) {
      const map = textTexture(text, color);
      o = new T.Sprite(
        new T.SpriteMaterial({
          map,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      o.scale.set(width, (width * map.image.height) / map.image.width, 1);
      o.renderOrder = 100;
    } else o = new T.Object3D();
    add(o, pos, "label");
    o.userData.text = text;
    o.userData.labelWidth = width;
    o.userData.labelColor = color;
    annotations.push(o);
    return o;
  };
  const setLabel = (o, text, color = "#cfe6ef", width = 2.25) => {
    if (
      o.userData.text === text &&
      o.userData.labelWidth === width &&
      o.userData.labelColor === color
    )
      return;
    o.userData.text = text;
    o.userData.labelWidth = width;
    o.userData.labelColor = color;
    if (!o.material) return;
    const old = o.material.map,
      map = textTexture(text, color);
    o.material.map = map;
    o.material.needsUpdate = true;
    o.scale.set(width, (width * map.image.height) / map.image.width, 1);
    old?.dispose();
  };
  const glass = (w, h, d, pos, color = 0x82c6df) =>
    box(w, h, d, color, pos, {
      transparent: true,
      opacity: 0.12,
      roughness: 0.12,
      metalness: 0,
      side: T.DoubleSide,
      depthWrite: false,
    });
  const ring = (radius, color, pos, axis = "y", opacity = 0.5) => {
    const o = mesh(new T.TorusGeometry(radius, 0.018, 6, 96), color, pos, {
      transparent: true,
      opacity,
      metalness: 0,
    });
    if (axis === "y") o.rotation.x = Math.PI / 2;
    return o;
  };
  const spring = (
    x,
    y,
    z,
    length,
    color = PALETTE.cyan,
    radius = 0.19,
    turns = 12,
  ) => {
    const pts = Array.from(
      { length: 161 },
      (_, i) =>
        new T.Vector3(
          radius * Math.cos((i / 160) * turns * Math.PI * 2),
          i / 160,
          radius * Math.sin((i / 160) * turns * Math.PI * 2),
        ),
    );
    const path = new T.CatmullRomCurve3(pts),
      coil = mesh(new T.TubeGeometry(path, 180, 0.024, 6, false), color, [
        x,
        y,
        z,
      ]);
    coil.scale.y = length;
    return coil;
  };
  const instances = (count, r, color) => {
    const o = new T.InstancedMesh(
      new T.SphereGeometry(r, 12, 8),
      material(color),
      count,
    );
    o.instanceMatrix.setUsage(T.DynamicDrawUsage);
    o.castShadow = true;
    add(o);
    return o;
  };
  const matrix = new T.Matrix4(),
    scale = new T.Vector3(1, 1, 1),
    quaternion = new T.Quaternion(),
    position = new T.Vector3();
  const instance = (o, i, xyz, color) => {
    position.set(...xyz);
    matrix.compose(position, quaternion, scale);
    o.setMatrixAt(i, matrix);
    if (color !== undefined) o.setColorAt(i, new T.Color(color));
  };
  const finishInstances = (o) => {
    o.instanceMatrix.needsUpdate = true;
    if (o.instanceColor) o.instanceColor.needsUpdate = true;
    o.computeBoundingSphere();
  };
  const stand = (w = 8, d = 3) => {
    const base = box(w, 0.2, d, 0x192b3b, [0, -0.1, 0], { roughness: 0.55, metalness: 0.35 });
    base.userData.role = "base";
    box(w - 0.14, 0.018, d - 0.14, 0x344e5e, [0, 0.009, 0], { roughness: 0.7 });
    for (const x of [-w / 2 + 0.3, w / 2 - 0.3])
      for (const z of [-d / 2 + 0.3, d / 2 - 0.3]) {
        cylinder(0.12, 0.18, 0x0d1721, [x, -0.27, z], { roughness: 0.88 });
        cylinder(0.038, 0.016, 0x98a8ad, [x, 0.027, z], { metalness: 0.8, roughness: 0.25 });
      }
    return base;
  };
  const resistor = (x, y, z, color = PALETTE.gold) => {
    const body = cylinder(0.16, 0.8, color, [x, y, z]);
    body.rotation.z = Math.PI / 2;
    for (const dx of [-0.2, 0, 0.2]) {
      const stripe = cylinder(0.166, 0.07, 0x6d4630, [x + dx, y, z]);
      stripe.rotation.z = Math.PI / 2;
    }
    rod([x - 0.8, y, z], [x + 0.8, y, z], 0x91acb8, 0.025);
    return body;
  };
  return {
    root,
    objects,
    annotations,
    indicators,
    material,
    add,
    mesh,
    box,
    ball,
    cylinder,
    line,
    rod,
    arrow,
    setArrow,
    label,
    setLabel,
    glass,
    ring,
    spring,
    instances,
    instance,
    finishInstances,
    stand,
    resistor,
    visibility(showLabels = true, showIndicators = true) {
      for (const o of annotations) o.visible = showLabels;
      for (const o of indicators)
        o.visible = showIndicators && o.userData.vectorLength > 1e-8;
    },
  };
}
