import * as THREE from "../vendor/three.module.min.js";

const TAU = 2 * Math.PI;

// Deterministic painted maps suggest morphology, without pretending to be imagery.
const paintedMaps = new Map();
export function paintedTexture(body) {
  const key = `${body.id}:${body.color}`;
  let canvas = paintedMaps.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 384;
    const ctx = canvas.getContext("2d"),
      image = ctx.createImageData(canvas.width, canvas.height),
      rgb = new THREE.Color(body.color).convertLinearToSRGB();
    function noise(x, y) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return (n - Math.floor(n)) * 2 - 1;
    }
    function smooth(x, y) {
      const ix = Math.floor(x),
        iy = Math.floor(y),
        u = x - ix,
        v = y - iy,
        a = u * u * (3 - 2 * u),
        b = v * v * (3 - 2 * v);
      const h = (x, y) => noise(x, y) * 0.5 + 0.5;
      return (
        (h(ix, iy) * (1 - a) + h(ix + 1, iy) * a) * (1 - b) +
        (h(ix, iy + 1) * (1 - a) + h(ix + 1, iy + 1) * a) * b
      );
    }
    const bands = [
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "venus",
      "titan",
    ].includes(body.id);
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const n =
          smooth(x / 48, y / 48) * 0.5 +
          smooth(x / 13, y / 13) * 0.3 +
          smooth(x / 4, y / 4) * 0.2;
        const lat = y / canvas.height,
          belt = Math.sin(lat * 115 + Math.sin(x / 95) * 0.5 + n * 2);
        let f = 0.7 + n * 0.5;
        if (bands)
          f =
            body.id === "jupiter"
              ? 0.74 + 0.15 * belt + n * 0.2
              : body.id === "saturn"
                ? 0.86 + 0.055 * belt + n * 0.12
                : 0.93 + 0.045 * belt + n * 0.06;
        if (body.id === "sun") f = 0.7 + n * 0.8;
        const at = (y * canvas.width + x) * 4;
        // CSS palette colours are encoded in sRGB, rather than Three's linear space.
        image.data[at] = Math.min(255, rgb.r * 255 * f);
        image.data[at + 1] = Math.min(255, rgb.g * 255 * f);
        image.data[at + 2] = Math.min(255, rgb.b * 255 * f);
        image.data[at + 3] = 255;
      }
    ctx.putImageData(image, 0, 0);
    let rng = body.id.split("").reduce((a, c) => a + c.charCodeAt(0), 912);
    const random = () => {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      return rng / 4294967296;
    };
    if (!bands && body.id !== "sun")
      for (let j = 0; j < 230; j++) {
        const x = random() * 768,
          y = random() * 384,
          r = 1 + random() ** 3 * (body.id === "moon" ? 29 : 16);
        const grad = ctx.createRadialGradient(
          x - r * 0.15,
          y - r * 0.2,
          r * 0.1,
          x,
          y,
          r,
        );
        grad.addColorStop(0, "rgba(20,14,10,.25)");
        grad.addColorStop(0.74, "rgba(10,10,8,.08)");
        grad.addColorStop(0.88, "rgba(255,243,214,.2)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    if (body.id === "jupiter") {
      for (let j = 0; j < 35; j++) {
        const x = random() * 768,
          y = 35 + random() * 310,
          r = 4 + random() * 17;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.36);
        for (let k = 0; k < 4; k++) {
          ctx.strokeStyle =
            j % 2 ? "rgba(244,213,167,.27)" : "rgba(121,79,56,.20)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          const arcRadius = Math.max(1, r - k * 2);
          ctx.ellipse(0, 0, arcRadius, arcRadius, 0, 0.2 + k * 0.4, TAU - 0.3);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (let j = 0; j < 7; j++) {
        ctx.fillStyle = `rgba(172,93,53,${0.07 + j * 0.025})`;
        ctx.beginPath();
        ctx.ellipse(220, 239, 54 - j * 6, 23 - j * 2, 0.05, 0, TAU);
        ctx.fill();
      }
    }
    if (body.id === "neptune") {
      ctx.fillStyle = "rgba(25,44,83,.26)";
      ctx.beginPath();
      ctx.ellipse(320, 228, 42, 15, 0.12, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(219,240,255,.32)";
      ctx.beginPath();
      ctx.ellipse(365, 214, 38, 3, 0.08, 0, TAU);
      ctx.fill();
    }
    if (body.id === "mars") {
      ctx.fillStyle = "#eee6d4";
      ctx.fillRect(0, 0, 768, 8);
      ctx.fillRect(0, 378, 768, 6);
    }
    if (body.id === "europa")
      for (let j = 0; j < 45; j++) {
        ctx.strokeStyle = "#77544275";
        ctx.lineWidth = 0.4 + random();
        ctx.beginPath();
        const start = random() * 768,
          cy = random() * 384;
        ctx.moveTo(start, cy);
        for (let k = 1; k < 8; k++)
          ctx.lineTo(start + k * 18, cy + Math.sin(k * 1.7 + j) * 17);
        ctx.stroke();
      }
    if (body.id === "pluto") {
      ctx.fillStyle = "#e1d5c0";
      ctx.beginPath();
      ctx.ellipse(220, 210, 68, 50, 0.55, 0, TAU);
      ctx.ellipse(298, 210, 68, 50, -0.55, 0, TAU);
      ctx.fill();
    }
    paintedMaps.set(key, canvas);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
