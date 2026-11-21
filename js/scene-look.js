/** The shared look of every 3D experiment: a dark studio in the manner of the
 * team's "Since 1958" project. A graphite bench under a pool of light, a deep
 * backdrop, parts that glow where they are lit, and small crisp labels.
 * Display only: nothing here reads or changes a model. Everything is drawn
 * once into small canvases, so there is no post-processing cost per frame. */
import * as T from "../vendor/three.module.min.js";

const made = new Map();
const once = (key, make) => (made.has(key) ? made.get(key) : (made.set(key, make()), made.get(key)));
const canvas = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });
const noise = (i, k = 0) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const css = (color) => "#" + new T.Color(color).getHexString();
/** Deep-space stage backdrop: the world colour glows on the horizon behind the
 * apparatus, under a field of faint stars. One small canvas per colour. */
export function studioBackdropTexture(accent = 0xff8a3c) {
  return once("backdrop:" + css(accent), () => {
    const c = canvas(1024, 512), g = c.getContext("2d");
    const sky = g.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#03030b");
    sky.addColorStop(0.55, "#090823");
    sky.addColorStop(1, "#04040d");
    g.fillStyle = sky;
    g.fillRect(0, 0, 1024, 512);
    const blob = (x, y, r, color, alpha) => {
      const glow = g.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = alpha;
      g.fillStyle = glow;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    g.globalCompositeOperation = "lighter";
    blob(512, 330, 520, css(accent), 0.34);
    blob(230, 190, 330, "#5b3dff", 0.2);
    blob(840, 150, 300, "#1fb6ff", 0.13);
    for (let i = 0; i < 260; i++) {
      const size = noise(i, 3) < 0.9 ? 1 : 2;
      g.globalAlpha = 0.18 + noise(i, 4) * 0.5;
      g.fillStyle = noise(i, 5) < 0.8 ? "#ffffff" : css(accent);
      g.fillRect(noise(i, 1) * 1024, noise(i, 2) * 330, size, size);
    }
    g.globalAlpha = 1;
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  });
}

/** Honed graphite bench: faint mottling so reflections break up like stone. */
function benchRoughness() {
  return once("bench-rough", () => {
    const c = canvas(256, 256), g = c.getContext("2d"), image = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = 120 + noise(i, 3) * 50 + noise(Math.floor(i / 7), 5) * 28;
      image.data.set([v, v, v, 255], i * 4);
    }
    g.putImageData(image, 0, 0);
    const texture = new T.CanvasTexture(c);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  });
}
function radialTexture(key, stops) {
  return once(key, () => {
    const c = canvas(256, 256), g = c.getContext("2d"), fill = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (const [at, color] of stops) fill.addColorStop(at, color);
    g.fillStyle = fill;
    g.fillRect(0, 0, 256, 256);
    return new T.CanvasTexture(c);
  });
}
export function benchMaterial() {
  return new T.MeshStandardMaterial({
    color: 0x0b0a1c,
    roughness: 0.34,
    roughnessMap: benchRoughness(),
    metalness: 0.5,
    envMapIntensity: 0.75,
    alphaMap: radialTexture("bench-fade", [[0, "#fff"], [0.4, "#fff"], [0.8, "#333"], [1, "#000"]]),
    transparent: true,
    depthWrite: false,
  });
}
/** A pool of light on the deck under the apparatus, tinted by the world colour. */
export function lightPool() {
  const texture = radialTexture("pool", [[0, "rgba(255,255,255,0.6)"], [0.35, "rgba(255,255,255,0.2)"], [1, "rgba(255,255,255,0)"]]);
  texture.colorSpace = T.SRGBColorSpace;
  const pool = new T.Mesh(
    new T.CircleGeometry(12, 48),
    new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.3, toneMapped: false, fog: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.renderOrder = -1;
  return pool;
}

/** Landing-pad markings drawn once: rings, tick marks and four bracket arcs.
 * Additive and tinted through the material colour; it turns slowly. */
export function stageRings() {
  const texture = once("rings", () => {
    const n = 1024, c = canvas(n, n), g = c.getContext("2d"), m = n / 2;
    g.strokeStyle = "#fff";
    g.fillStyle = "#fff";
    const ring = (r, width, alpha, dash) => {
      g.globalAlpha = alpha;
      g.lineWidth = width;
      g.setLineDash(dash || []);
      g.beginPath();
      g.arc(m, m, r, 0, Math.PI * 2);
      g.stroke();
    };
    ring(250, 2, 0.5);
    ring(330, 5, 0.9);
    ring(346, 1.5, 0.45, [3, 9]);
    ring(440, 1.5, 0.3, [40, 22]);
    ring(500, 1, 0.22);
    g.setLineDash([]);
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, long = i % 6 === 0, r0 = 362, r1 = long ? 392 : 374;
      g.globalAlpha = long ? 0.85 : 0.4;
      g.lineWidth = long ? 3 : 1.5;
      g.beginPath();
      g.moveTo(m + r0 * Math.cos(a), m + r0 * Math.sin(a));
      g.lineTo(m + r1 * Math.cos(a), m + r1 * Math.sin(a));
      g.stroke();
    }
    g.globalAlpha = 0.95;
    g.lineWidth = 9;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      g.beginPath();
      g.arc(m, m, 414, a - 0.2, a + 0.2);
      g.stroke();
    }
    const texture = new T.CanvasTexture(c);
    texture.anisotropy = 8;
    return texture;
  });
  const rings = new T.Mesh(
    new T.PlaneGeometry(17, 17),
    new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.4, toneMapped: false }),
  );
  rings.rotation.x = -Math.PI / 2;
  rings.renderOrder = -1;
  rings.raycast = () => {};
  return rings;
}

/** Slow motes of dust caught in the light. One draw call; the cloud only
 * turns and bobs, so nothing is recomputed per particle. */
export function dustField(count = 150) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 3 + noise(i, 31) * 11, a = noise(i, 32) * Math.PI * 2;
    positions.set([r * Math.cos(a), 0.3 + noise(i, 33) * 7.5, r * Math.sin(a)], i * 3);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
  const dust = new T.Points(geometry, new T.PointsMaterial({
    map: haloTexture(), size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.5,
    blending: T.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  dust.raycast = () => {};
  dust.frustumCulled = false;
  return dust;
}

/** Soft halo for parts that emit light: lamps, hot filaments, charges, beams. */
function haloTexture() {
  const texture = radialTexture("halo", [[0, "rgba(255,255,255,0.9)"], [0.22, "rgba(255,255,255,0.32)"], [0.6, "rgba(255,255,255,0.07)"], [1, "rgba(255,255,255,0)"]]);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
const sphere = new T.Sphere(), size = new T.Vector3();
/** Give each small, strongly emissive mesh a halo. Returns how many were added. */
export function addGlow(root, { limit = 40 } = {}) {
  const targets = [];
  root.traverse((node) => {
    if (targets.length >= limit || !node.isMesh || node.isInstancedMesh || node.userData.halo) return;
    const m = node.material;
    if (!m || Array.isArray(m) || !m.emissive || (m.emissiveIntensity ?? 0) < 0.55) return;
    if (m.emissive.r + m.emissive.g + m.emissive.b < 0.25 || (m.transparent && m.opacity < 0.35)) return;
    node.geometry.computeBoundingSphere?.();
    const radius = node.geometry.boundingSphere?.radius ?? 0;
    node.getWorldScale(size);
    const world = radius * Math.max(size.x, size.y, size.z);
    if (world > 0.02 && world < 0.7) targets.push([node, radius]);
  });
  for (const [node, radius] of targets) {
    const halo = new T.Sprite(new T.SpriteMaterial({
      map: haloTexture(), color: node.material.emissive, transparent: true, opacity: 0.55,
      blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false,
    }));
    halo.scale.setScalar(radius * 5.5);
    halo.userData.role = "indicator";
    halo.raycast = () => {};
    node.userData.halo = halo;
    node.add(halo);
  }
  void sphere;
  return targets.length;
}

/** Label plate. "dark" floats over the scene, "paper" sits on a white board. */
export function paintLabelPlate(c, width, height, color, theme = "dark") {
  if (theme === "ink") return;
  const r = Math.min(height * 0.3, 22);
  c.beginPath();
  c.roundRect(3, 3, width - 6, height - 6, r);
  if (theme === "paper") {
    c.fillStyle = "rgba(252,252,250,0.97)";
    c.fill();
    c.strokeStyle = "rgba(40,44,52,0.18)";
    c.lineWidth = 2;
    c.stroke();
    return;
  }
  // Head-up tag: a dark plate with two cut corners and a solid colour bar.
  const cut = Math.min(height * 0.26, 24), x0 = 3, y0 = 3, x1 = width - 3, y1 = height - 3;
  c.beginPath();
  c.moveTo(x0 + cut, y0);
  c.lineTo(x1, y0);
  c.lineTo(x1, y1 - cut);
  c.lineTo(x1 - cut, y1);
  c.lineTo(x0, y1);
  c.lineTo(x0, y0 + cut);
  c.closePath();
  c.fillStyle = "rgba(8,7,26,0.84)";
  c.fill();
  c.globalAlpha = 0.8;
  c.strokeStyle = color;
  c.lineWidth = 2.5;
  c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = color;
  c.fillRect(x0, y0 + cut + 4, 7, y1 - y0 - cut - 8);
}
export const LABEL_FONT = '700 56px "Chakra Petch",Manrope,Segoe UI,sans-serif';
