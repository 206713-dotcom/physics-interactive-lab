/** Nuclear and astronomical displays. Nucleus / stellar sizes are schematic;
 * decay colours use the seeded decay event times, not invented detector hits. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, clamp, setPath } from "./scene-kit.js";
import { PLANETS, AU, G, SUN, YEAR } from "./curriculum-physics.js";
import { planckSpectrum } from "./practical-physics.js";
import { lunarLitInterval, solarDisplayRadius } from "./space-display.js";
import { BODY_MAP } from "../atlas/astronomy-data.js";
import { paintedTexture } from "../atlas/planet-texture.js";
import { atmosphereMaterial, cloudShell, plasmaShell, stellarMaterial, surfaceMaterial } from "../atlas/visual-detail.js";
const TAU = Math.PI * 2;
function starColor(temperature) {
  const u = clamp((temperature - 2500) / 7500, 0, 1);
  return new T.Color(0xffa775).lerp(new T.Color(0xa9caff), u);
}

function world(k, id, radius, position) {
  const data = BODY_MAP[id];
  const group = k.add(new T.Group(), position);
  group.userData.world = id;
  const tilt = new T.Group();
  group.add(tilt);
  tilt.rotation.z = (data.tilt || 0) * Math.PI / 180;
  const map = typeof document !== "undefined" && id !== "earth" ? paintedTexture(data) : null;
  const material = surfaceMaterial(data, map);
  const globe = new T.Mesh(new T.SphereGeometry(radius, 64, 40), material);
  tilt.add(globe);
  if (id === "earth") {
    if (typeof document !== "undefined") {
      const texture = new T.TextureLoader().load(new URL("../atlas/assets/earth-blue-marble.png", import.meta.url).href, (loaded) => {
        if (group.parent !== k.root) {
          loaded.dispose();
          return;
        }
        material.map = loaded;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
      }, undefined, () => texture.dispose());
      texture.colorSpace = T.SRGBColorSpace;
    }
    tilt.add(cloudShell(radius * 1.011));
  }
  if (["earth", "venus", "uranus", "neptune"].includes(id)) {
    group.add(new T.Mesh(new T.SphereGeometry(radius * 1.045, 48, 32), atmosphereMaterial(id === "earth" ? 0x6bafff : data.color, 0.52)));
  }
  if (id === "saturn") {
    const ring = new T.Group();
    ring.rotation.x = -Math.PI / 2;
    tilt.add(ring);
    for (const [inner, outer, color, opacity] of [[1.25, 1.52, 0xd4b283, 0.64], [1.54, 1.84, 0xf5d7a0, 0.83], [1.9, 2.15, 0xd5b58e, 0.56]]) {
      ring.add(new T.Mesh(new T.RingGeometry(radius * inner, radius * outer, 96),
        new T.MeshBasicMaterial({ color, transparent: true, opacity, side: T.DoubleSide, depthWrite: false })));
    }
  }
  return { group, globe, tilt };
}

function luminousBody(k, radius, color, position, opacity = 0.43) {
  const group = k.add(new T.Group(), position);
  const surface = stellarMaterial(color);
  group.add(new T.Mesh(new T.SphereGeometry(radius, 80, 48), surface));
  group.add(new T.Mesh(new T.SphereGeometry(radius * 1.08, 56, 36), atmosphereMaterial(color, opacity)));
  return { group, surface };
}

function orbitRing(k, radius, position, color, opacity) {
  const ring = new T.Mesh(new T.TorusGeometry(radius, 0.013, 6, 128),
    new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, fog: false }));
  ring.rotation.x = Math.PI / 2;
  return k.add(ring, position);
}

// The disc is an Earth-facing view. At new Moon the projected lit area is zero.
function lunarDisc(k, position) {
  if (typeof document === "undefined") return () => {};
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 160;
  const ctx = canvas.getContext("2d");
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const disc = k.add(new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })), position);
  disc.scale.set(1.72, 1.72, 1);
  let lastPhase;
  return (phase) => {
    const sample = Math.round(phase * 180 / Math.PI) % 360;
    if (sample === lastPhase) return;
    lastPhase = sample;
    ctx.clearRect(0, 0, 160, 160);
    ctx.fillStyle = "#14243c";
    ctx.beginPath();
    ctx.arc(80, 80, 72, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e5edf4";
    for (let y = -71; y <= 71; y++) {
      const half = Math.sqrt(72 ** 2 - y ** 2);
      const [left, right] = lunarLitInterval(half, phase);
      ctx.fillRect(80 + left, 80 + y, right - left, 1);
    }
    ctx.strokeStyle = "#8ca6bf";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(80, 80, 72, 0, TAU);
    ctx.stroke();
    texture.needsUpdate = true;
  };
}
export const SPACE_SCENES = {
  atom(p, k) {
    k.stand(8, 5);
    const count = p.protons + p.neutrons,
      nucleons = k.instances(count, 0.15, C.gold);
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996,
        r = 0.24 * Math.cbrt(i + 1),
        z = 1 - (2 * (i + 0.5)) / count;
      k.instance(
        nucleons,
        i,
        [
          r * Math.sqrt(1 - z * z) * Math.cos(a),
          2 + r * z,
          r * Math.sqrt(1 - z * z) * Math.sin(a),
        ],
        i < p.protons ? C.gold : C.blue,
      );
    }
    k.finishInstances(nucleons);
    k.label("Protons + neutrons form the nucleus", [0, 4.5, 0], "#cfe6ef", 5);
    k.label(
      "No classical electron orbits implied",
      [0, 0.3, 1.5],
      "#b7cedc",
      4.6,
    );
    const cloud = k.ball(1.6, C.cyan, [0, 2, 0], {
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      wireframe: true,
    });
    cloud.visible = p.protons - p.charge > 0;
    return () => {};
  },
  radioactivity(p, k) {
    k.stand(9, 5);
    const dots = k.instances(p.nuclei, 0.055, C.cyan),
      cols = Math.ceil(Math.sqrt(p.nuclei)),
      rows = Math.ceil(p.nuclei / cols);
    k.label("Cyan: undecayed · muted: decayed", [0, 4.6, 0], "#64e8d1", 5);
    k.label(
      "Each nucleus has its own seeded event time",
      [0, 0.2, 1.3],
      "#b7cedc",
      5.8,
    );
    return (s) => {
      for (let i = 0; i < p.nuclei; i++)
        k.instance(
          dots,
          i,
          [
            -3.5 + ((i % cols) / Math.max(1, cols - 1)) * 7,
            0.65 + (Math.floor(i / cols) / Math.max(1, rows - 1)) * 3,
            0,
          ],
          s.decayTimes[i] > s.t ? C.cyan : 0x29485a,
        );
      k.finishInstances(dots);
    };
  },
  earthmoon(p, k) {
    const y = 1.8, orbit = 2.85;
    const earth = world(k, "earth", 1.13, [0, y, 0]);
    const moon = world(k, "moon", 0.36, [-orbit, y, 0]);
    const sun = luminousBody(k, 0.67, 0xffbb63, [-5.1, y, 0]);
    orbitRing(k, orbit, [0, y, 0], 0x86b5e0, 0.42);
    for (const z of [-0.62, 0, 0.62]) k.arrow([-4.24, y, z], [0.93, 0, 0], C.gold);
    const axis = new T.Line(
      new T.BufferGeometry().setFromPoints([new T.Vector3(0, -1.43, 0), new T.Vector3(0, 1.43, 0)]),
      new T.LineBasicMaterial({ color: 0x9dcdf3 }),
    );
    earth.tilt.add(axis);
    k.label("Sun", [-5.1, 0.83, 0], "#ffcc90", 1.1);
    k.label("Earth", [0, 0.22, 0], "#a4d5ff", 1.22);
    const moonLabel = k.label("Moon", [0, 0, 0], "#d6e8f5", 1.12);
    const phase = lunarDisc(k, [4.5, 2.0, 0]);
    k.label("View from Earth", [4.5, 0.93, 0], "#d1e6f7", 2.12);
    const north = new T.Vector3(), vertical = new T.Vector3(0, 1, 0);
    const tilt = p.tilt * Math.PI / 180;
    return {
      camera: { target: [-0.2, y, 0], radius: 11.2, polar: 0.91, azimuth: -0.53 },
      update(s, q) {
        moon.group.position.set(-orbit * Math.cos(q.phase), y, orbit * Math.sin(q.phase));
        moon.globe.rotation.y = q.phase;
        moonLabel.position.copy(moon.group.position).add(new T.Vector3(0, 0.64, 0));
        const towardSun = Math.sin(q.declination * Math.PI / 180);
        north.set(-towardSun, Math.cos(tilt), Math.sign(Math.cos(q.longitude - TAU * 80 / 365.25)) *
          Math.sqrt(Math.max(0, Math.sin(tilt) ** 2 - towardSun ** 2)));
        earth.tilt.quaternion.setFromUnitVectors(vertical, north);
        earth.globe.rotation.y = s.t * 0.3;
        sun.surface.uniforms.time.value = s.t;
        phase(q.phase);
      },
    };
  },
  solarsystem(p, k) {
    const y = 1.7;
    const sun = luminousBody(k, 0.58, 0xffbf69, [0, y, 0]);
    // Constant intensity keeps all eight small bodies readable despite compressed distances.
    k.add(new T.PointLight(0xffebd4, 2.9, 0, 0), [0, y, 0]);
    const bodies = PLANETS.map(([name, distance], i) => {
      const selected = i === p.planet;
      const au = distance * (selected ? p.scale : 1);
      const radius = solarDisplayRadius(au);
      const period = TAU * Math.sqrt((au * AU) ** 3 / (G * SUN)) / YEAR;
      orbitRing(k, radius, [0, y, 0], selected ? C.cyan : 0x547396, selected ? 0.8 : 0.38);
      const size = [0.12, 0.17, 0.18, 0.14, 0.38, 0.31, 0.23, 0.23][i];
      const planet = world(k, name.toLowerCase(), size * (selected ? 1.28 : 1), [radius, y, 0]);
      return { ...planet, radius, period, size, name };
    });
    const chosen = bodies[p.planet];
    const marker = k.label(chosen.name, [0, 0, 0], "#adf6ed", 1.64);
    return {
      camera: { target: [0, y, 0], radius: 17.5 + Math.max(0, Math.max(...bodies.map(({ radius }) => radius)) - 5.16) * 3,
        polar: 0.53, azimuth: -0.14 },
      update(s) {
        sun.surface.uniforms.time.value = s.t;
        bodies.forEach(({ group, globe, radius, period }, i) => {
          const angle = TAU * s.t / period + i * 0.9;
          group.position.set(radius * Math.cos(angle), y, -radius * Math.sin(angle));
          globe.rotation.y = 0.6 + s.t * 0.09;
        });
        marker.position.copy(chosen.group.position);
        marker.position.y += chosen.size + 0.56;
      },
    };
  },
  stars(p, k) {
    const heavy = p.mass >= 8, stage = p.stage, centre = [0, 2.35, 0];
    const colors = [0xffb177, starColor(p.temperature), 0xff9565, 0xadd5ff, 0xb6d8ff];
    const sizes = [0.5, 1.22, 1.85, 0.32, 0.29];
    const core = luminousBody(k, sizes[stage], colors[stage], centre);
    const layers = [];
    if (stage === 0 || stage === 3) {
      const colors = stage === 0 ? [0x9562e3, 0x4a99d9, 0xefaa80] : [0x58c9e2, 0x8563f4, 0xff9c78];
      for (let i = 0; i < colors.length; i++) {
        const material = plasmaShell(colors[i], stage === 0 ? 0.56 : 0.62);
        const shell = k.add(new T.Mesh(new T.SphereGeometry(1.2 + i * 0.45, 48, 32), material), centre);
        shell.scale.set(1, stage === 0 ? 0.54 + i * 0.09 : 0.64 + i * 0.08, 0.8 + i * 0.1);
        shell.rotation.set(0.45 + i * 0.47, i * 1.7, 0.2 + i * 0.36);
        layers.push(shell);
      }
    }
    const stageName = [
      "Cloud and protostar", "Main sequence", heavy ? "Red supergiant" : "Red giant",
      heavy ? "Supernova ejecta" : "Planetary nebula", heavy ? "Compact remnant" : "White dwarf",
    ][stage];
    k.label(stageName, [0, 4.64, 0], "#d3e9f8", 2.9);
    return {
      camera: { target: [0, 2.52, 0], radius: 9.0, polar: 1.19, azimuth: -0.16 },
      update(s) {
        core.surface.uniforms.time.value = s.t;
        for (const shell of layers) shell.material.uniforms.time.value = s.t;
      },
    };
  },
  universe(p, k) {
    const points = k.instances(25, 0.1, C.blue);
    for (let i = 0; i < 25; i++) {
      const a = i * 2.39996,
        r = 0.45 + Math.sqrt(i / 24) * 3;
      k.instance(points, i, [
        r * Math.cos(a),
        2 + r * 0.6 * Math.sin(a),
        Math.sin(i * 4) * 1.6,
      ]);
      if (i % 4 === 0 && i)
        k.arrow(
          [r * Math.cos(a), 2 + r * 0.6 * Math.sin(a), Math.sin(i * 4) * 1.6],
          [0.5 * Math.cos(a), 0.3 * Math.sin(a), 0],
          C.gold,
        );
    }
    k.finishInstances(points);
    k.ball(0.14, C.white, [0, 2, 0]);
    k.label("More distant galaxies recede faster", [0, 4.8, 0], "#ffc584", 5);
    k.label(
      "Hubble-law snapshot · no expansion history integrated",
      [0, 0.1, 1.8],
      "#b7cedc",
      6.5,
    );
    const wave = k.line([], C.purple);
    return (s, q) =>
      setPath(
        wave,
        Array.from({ length: 161 }, (_, i) => [
          -3.7 + (i / 160) * 7.4,
          1.8 +
            0.3 * Math.sin(((i / 160) * TAU * 4) / (1 + q.redshift) - s.t * 3),
          2,
        ]),
      );
  },
  blackbody(p, k) {
    k.stand(9, 4);
    const body = k.ball(1.15, starColor(p.temperature), [-2.4, 1.8, 0], {
      emissive: starColor(p.temperature),
      emissiveIntensity: clamp(p.temperature / 5000, 0.05, 2),
    });
    const screen = k.glass(3.2, 2.7, 0.1, [2, 1.8, 0]);
    k.label("Emitter", [-2.4, 3.7, 0], "#ffc584", 1.7);
    k.label("Thermal spectrum", [2.1, 3.7, 0], "#c3a6ff", 2.8);
    const curve = k.line([], C.purple);
    return (s, q) => {
      const lo = q.peak * 0.12,
        hi = q.peak * 5,
        peak = Math.max(q.peakRadiance, 1e-30);
      setPath(
        curve,
        Array.from({ length: 161 }, (_, i) => [
          0.55 + (i / 160) * 2.9,
          0.7 +
            ((p.emissivity *
              planckSpectrum(lo + ((hi - lo) * i) / 160, p.temperature)) /
              peak) *
              2,
          0,
        ]),
      );
    };
  },
};
