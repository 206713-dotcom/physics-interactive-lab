/** Display-only surface finishes. Apparatus is still described by one colour
 * per part; this module decides what that colour is made of (brushed steel,
 * brass, wood, glass, satin paint, rubber) so that parts catch the light the
 * way laboratory equipment does. Nothing here touches a model or a reading. */
import * as T from "../vendor/three.module.min.js";

const cache = new Map();
const hasCanvas = typeof document !== "undefined";
/** Repeatable noise so every visit looks the same. */
const noise = (i, k = 0) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
function canvasTexture(key, size, draw, { repeat = [1, 1], color = false } = {}) {
  if (!hasCanvas) return null;
  if (!cache.has(key)) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    draw(canvas.getContext("2d"), size);
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.anisotropy = 4;
    if (color) texture.colorSpace = T.SRGBColorSpace;
    cache.set(key, texture);
  }
  return cache.get(key);
}
/** Fine streaks along one direction: the roughness of brushed metal. */
const brushedMap = () => canvasTexture("brushed", 256, (c, n) => {
  c.fillStyle = "#8a8a8a";
  c.fillRect(0, 0, n, n);
  for (let i = 0; i < 900; i++) {
    const y = noise(i, 1) * n, shade = 90 + noise(i, 2) * 110;
    c.fillStyle = `rgba(${shade},${shade},${shade},0.35)`;
    c.fillRect(noise(i, 3) * n - 60, y, 60 + noise(i, 4) * 180, 1);
  }
}, { repeat: [2, 2] });
/** Pale wood figure. It multiplies the part's colour, so hue is preserved. */
const grainMap = () => canvasTexture("grain", 512, (c, n) => {
  c.fillStyle = "#f2ebe0";
  c.fillRect(0, 0, n, n);
  for (let i = 0; i < 150; i++) {
    const x = noise(i, 5) * n, wobble = 4 + noise(i, 6) * 14, tone = 150 + noise(i, 7) * 70;
    c.strokeStyle = `rgba(${tone},${tone - 22},${tone - 50},${0.1 + noise(i, 8) * 0.22})`;
    c.lineWidth = 0.6 + noise(i, 9) * 2.4;
    c.beginPath();
    for (let y = -8; y <= n + 8; y += 16)
      c[y < 0 ? "moveTo" : "lineTo"](x + Math.sin(y / 70 + i) * wobble, y);
    c.stroke();
  }
}, { color: true });
/** Faint mottling for painted and moulded surfaces. */
const satinMap = () => canvasTexture("satin", 128, (c, n) => {
  const image = c.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = 150 + noise(i, 11) * 60;
    image.data.set([v, v, v, 255], i * 4);
  }
  c.putImageData(image, 0, 0);
}, { repeat: [3, 3] });

/** Oak bench top: planks with grain, used once under every apparatus. */
export function benchTexture() {
  return canvasTexture("bench", 1024, (c, n) => {
    const planks = 6, w = n / planks;
    for (let p = 0; p < planks; p++) {
      const base = 150 + noise(p, 21) * 26;
      c.fillStyle = `rgb(${base + 28},${base - 10},${base - 58})`;
      c.fillRect(p * w, 0, w, n);
      for (let i = 0; i < 70; i++) {
        const x = p * w + noise(i + p * 97, 22) * w, tone = 60 + noise(i + p * 31, 23) * 60;
        c.strokeStyle = `rgba(${tone + 30},${tone},${tone - 30},${0.06 + noise(i + p, 24) * 0.14})`;
        c.lineWidth = 0.6 + noise(i + p * 7, 25) * 2;
        c.beginPath();
        for (let y = -8; y <= n + 8; y += 24)
          c[y < 0 ? "moveTo" : "lineTo"](x + Math.sin(y / 110 + i + p) * (2 + noise(i, 26) * 7), y);
        c.stroke();
      }
      c.fillStyle = "rgba(40,22,8,0.55)";
      c.fillRect(p * w, 0, 2, n);
    }
  }, { repeat: [13, 13], color: true });
}
/** Soft circular fade so the bench has no hard edge or horizon line. */
export function benchFade() {
  if (!hasCanvas) return null;
  if (!cache.has("fade")) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const c = canvas.getContext("2d"), g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.42, "#fff");
    g.addColorStop(0.78, "#3a3a3a");
    g.addColorStop(1, "#000");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
    cache.set("fade", new T.CanvasTexture(canvas));
  }
  return cache.get("fade");
}

/** Real apparatus is not one colour scheme. Each experiment draws its kit from
 * one of these sets, chosen from its name, so benches differ from each other:
 * [base board, frame and rods, feet and clamps]. Teaching colours (the gold
 * mass, the cyan ray) are never touched, because labels refer to them. */
const KITS = [
  { base: [0x23263a, "deck"], frame: [0xcfd3d8, "steel"], foot: [0x101014, "rubber"] },   // midnight deck, bright steel
  { base: [0x2a2c31, "deck"], frame: [0xc79a3e, "brass"], foot: [0x8f1f2b, "satin"] },    // gunmetal, brass, oxblood clamps
  { base: [0x1c2430, "deck"], frame: [0x9aa3ad, "steel"], foot: [0xc4682c, "satin"] },    // blue steel, titanium, copper paint
  { base: [0x2e2a36, "deck"], frame: [0xd5d9dd, "steel"], foot: [0x1f3a5f, "satin"] },    // aubergine, aluminium, navy
  { base: [0x1f2a2a, "deck"], frame: [0xb88a4a, "brass"], foot: [0x15181a, "rubber"] },   // dark teal, bronze, black
  { base: [0x30303a, "deck"], frame: [0x4a4f57, "steel"], foot: [0xb8323a, "satin"] },    // graphite, black nickel, red
];
let kit = KITS[0], accent = 0xff8a3c;
/** The colour of the world this experiment belongs to (glowing trims, rim light). */
export const sceneAccent = () => accent;
/** Choose the kit for the experiment about to be built. */
export function setSceneTheme(type, world) {
  if (world !== undefined) accent = world;
  let hash = 0;
  for (const ch of String(type)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  kit = KITS[hash % KITS.length];
  return KITS.indexOf(kit);
}
/** Structural blue-greys (boards, rods, feet) become real materials from the kit. */
export function kitColour(color, extra = {}, hint = null) {
  if (extra.emissive !== undefined || extra.map || extra.transparent) return null;
  probe.set(color).getHSL(hsl);
  const { h, s, l } = hsl;
  if (h < 0.5 || h > 0.63 || s < 0.1 || s > 0.5 || l >= 0.88) return null;
  // The wide board an apparatus stands on is always the kit's board material,
  // so strong colours stay on small parts such as clamps and feet.
  if (hint === "board") return kit.base;
  return l >= 0.62 ? kit.base : l >= 0.36 ? kit.frame : kit.foot;
}

const probe = new T.Color(), hsl = { h: 0, s: 0, l: 0 };
/** What a part of this colour is made of. */
export function finishFor(color, extra = {}) {
  if (extra.emissive !== undefined || extra.map) return "plain";
  if (extra.transparent && (extra.opacity ?? 1) < 0.75) return "glass";
  probe.set(color).getHSL(hsl);
  const { h, s, l } = hsl;
  if (l <= 0.2) return "rubber";
  if (l >= 0.9 && s < 0.5) return "ceramic";
  if (s < 0.3) return "steel";
  if (h > 0.06 && h < 0.16 && s > 0.35 && l > 0.45) return "brass";
  if (h > 0.03 && h < 0.13 && l <= 0.45) return "wood";
  return "satin";
}
const RECIPES = {
  plain: () => ({ roughness: 0.4, metalness: 0.2, envMapIntensity: 0.6 }),
  glass: () => ({ roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.5, reflectivity: 0.6 }),
  rubber: () => ({ roughness: 0.78, metalness: 0.12, envMapIntensity: 0.55, roughnessMap: satinMap() }),
  ceramic: () => ({ roughness: 0.22, metalness: 0.02, envMapIntensity: 1.0 }),
  deck: () => ({ roughness: 0.36, metalness: 0.78, envMapIntensity: 1.25, roughnessMap: brushedMap() }),
  steel: () => ({ roughness: 0.5, metalness: 0.86, envMapIntensity: 1.25, roughnessMap: brushedMap() }),
  brass: () => ({ roughness: 0.42, metalness: 0.92, envMapIntensity: 1.3, roughnessMap: brushedMap() }),
  wood: () => ({ roughness: 0.62, metalness: 0, envMapIntensity: 0.45, map: grainMap() }),
  // No clear coat: a second highlight per pixel costs more than it shows.
  satin: () => ({ roughness: 0.3, metalness: 0.06, envMapIntensity: 1.0, roughnessMap: satinMap() }),
};
/** One material per part. Anything the caller sets explicitly wins. */
export function realMaterial(color, extra = {}, hint = null) {
  const swap = kitColour(color, extra, hint);
  if (swap) color = swap[0];
  const finish = swap ? swap[1] : finishFor(color, extra), recipe = RECIPES[finish]();
  for (const key of Object.keys(recipe)) if (recipe[key] === null) delete recipe[key];
  const physical = "clearcoat" in recipe,
    material = new (physical ? T.MeshPhysicalMaterial : T.MeshStandardMaterial)({ color, ...recipe, ...extra });
  material.userData.finish = finish;
  return material;
}
