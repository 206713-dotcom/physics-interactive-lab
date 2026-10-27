import { equation, inlineMath, numberTex } from "./math-typesetting.js";
import * as THREE from "../vendor/three.module.min.js";
import {
  WORLDS,
  MOONS,
  BODIES,
  BODY_MAP,
  SATELLITES,
} from "./astronomy-data.js";
import {
  AU,
  C,
  DAY,
  G,
  SOLAR_LUMINOSITY,
  STEFAN_BOLTZMANN,
  energyBalance,
  satellitePhysics,
  bodyPhysics,
  orbitPhysics,
  planetPosition,
  elementsAt,
  ellipsePoint,
  solveKepler,
  daysFromDate,
  dateFromDays,
} from "./astronomy-math.js";
import { INTERIORS, INTERIOR_SOURCES } from "./world-interiors.js";
import {
  stellarMaterial,
  surfaceMaterial,
  atmosphereMaterial,
  cloudShell,
  interiorFace,
} from "./visual-detail.js";

const V = (...p) => new THREE.Vector3(...p),
  TAU = Math.PI * 2;
const scientific = (n) => inlineMath(numberTex(n.toExponential(3)));
const fmt = (n, d = 2) =>
  n.toLocaleString("en", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
const card = (label, value, unit = "") =>
  `<div><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`;
const evidenceLink = (b) =>
  INTERIOR_SOURCES[b.id]
    ? `<a class="solar-source" href="${INTERIOR_SOURCES[b.id][1]}" target="_blank" rel="noopener">${INTERIOR_SOURCES[b.id][0]} ↗</a>`
    : "";
const toDisplay = (point) => {
  const r = Math.hypot(...point);
  return r
    ? V(point[0], point[2], -point[1]).multiplyScalar(
        (38 + 133 * Math.log1p(r)) / r,
      )
    : V(0, 0, 0);
};
const fallbackElements = {
  ceres: [2.7675, 0.0758, 10.59, 95.99, 73.6, 80.3],
  pluto: [39.482, 0.2488, 17.16, 238.93, 224.07, 110.3],
};
const radiusFor = (b) =>
  b.id === "sun"
    ? 19
    : b.id === "jupiter"
      ? 12
      : b.id === "saturn"
        ? 10
        : b.id === "uranus" || b.id === "neptune"
          ? 8
          : b.id === "ceres" || b.id === "pluto"
            ? 3.5
            : b.id === "mercury"
              ? 4
              : 5.5;

// Deterministic painted maps suggest morphology, without pretending to be imagery.
export function paintedTexture(body) {
  const canvas = document.createElement("canvas");
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
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d"),
    g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  g.addColorStop(0, "#fff8");
  g.addColorStop(0.35, "#fff5");
  g.addColorStop(0.65, "#fff1");
  g.addColorStop(1, "#fff0");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createAstronomy(adapter) {
  const { group, camera, controls, canvas, flyTo, goToScene } = adapter;
  const root = document.createElement("div");
  root.className = "solar-ui";
  root.hidden = true;
  root.innerHTML = `<section class="solar-intro"><div class="eyebrow">BEYOND THE OBSERVATORY</div><h1>Our cosmic<br><em>neighbourhood.</em></h1><p>Follow a world. Find its moons.<br>See where the muon story takes place.</p><div class="solar-catalog" aria-label="Choose a solar-system object"></div><button class="solar-lab-link" data-solar-action="lab">↙ Back to physics labs</button></section>
 <div class="solar-labels" aria-label="Clickable planet labels"></div>
 <aside class="solar-desk" aria-label="Solar-system field guide"><div class="solar-desk-heading">FIELD GUIDE <span>NASA / JPL</span></div><button class="solar-reading reading-toggle" aria-label="Expand field guide" aria-pressed="false">↔ Read wider</button><div id="solar-detail"></div></aside>
 <div class="solar-breadcrumb"><button data-solar-action="overview">Solar system</button><span id="solar-crumb"></span></div>
 <div class="solar-status" role="status" aria-live="polite"></div>
 <div class="solar-clock"><button id="solar-play" aria-label="Play planetary orbits" aria-pressed="false">▶</button><label>Date<input id="solar-date" type="date" min="2000-01-01" max="2049-12-31"></label><label>Time scale<select id="solar-speed"><option value="1">1 day / second</option><option value="30" selected>30 days / second</option><option value="365">1 year / second</option></select></label><div class="solar-scale-note">DISTANCES COMPRESSED · SIZES ENLARGED<small>Approximate planet positions · illustrative spin and moon placement</small></div></div>`;
  document.getElementById("exploration-page").append(root);
  const $ = (id) => root.querySelector("#" + id),
    detail = $("solar-detail"),
    labelRoot = root.querySelector(".solar-labels");
  const catalog = root.querySelector(".solar-catalog");
  catalog.innerHTML = WORLDS.map(
    (b) =>
      `<button data-body="${b.id}" style="--body-color:${b.color}" aria-label="Explore ${b.name}"><i></i>${b.name}${b.id === "earth" ? "<small>MUON LAB</small>" : ""}</button>`,
  ).join("");
  const overview = new THREE.Group(),
    focus = new THREE.Group();
  group.add(overview, focus);
  focus.visible = false;
  const textures = new Map(),
    loader = new THREE.TextureLoader();
  const earthTexture = loader.load(
    new URL("./assets/earth-blue-marble.png", import.meta.url).href,
  );
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  textures.set("earth", earthTexture);
  const geometry = new THREE.SphereGeometry(1, 128, 80),
    haloMap = haloTexture(),
    rims = [],
    rings = [],
    labels = [],
    models = new Map(),
    orbitLines = [];
  let selected = null,
    depth = "overview",
    active = false,
    running = false,
    speed = 30,
    uiClock = 0,
    altitude = 100,
    localLabels = [],
    moonGroup = null,
    cutaway = null,
    selectedLayer = 0,
    albedo = 0.3,
    layerSpread = 0,
    isolateLayer = false,
    testOrbit = null,
    orbitPlaying = false,
    orbitPhase = 0;
  const initial = new Date().toISOString().slice(0, 10);
  let days = daysFromDate(
    initial < "2000-01-01" || initial > "2049-12-31" ? "2026-10-10" : initial,
  );
  $("solar-date").value = dateFromDays(days);
  function makeBody(body, radius) {
    if (!textures.has(body.id)) textures.set(body.id, paintedTexture(body));
    const container = new THREE.Group(),
      tilted = new THREE.Group();
    container.add(tilted);
    tilted.rotation.z = (body.tilt * Math.PI) / 180;
    const material =
      body.id === "sun"
        ? stellarMaterial()
        : surfaceMaterial(body, textures.get(body.id));
    const sphere = new THREE.Mesh(geometry, material);
    sphere.scale.setScalar(radius);
    sphere.userData.body = body.id;
    tilted.add(sphere);
    if (
      ["earth", "venus", "titan", "uranus", "neptune", "sun"].includes(body.id)
    ) {
      const shell = new THREE.Mesh(
        geometry,
        atmosphereMaterial(
          body.id === "earth" ? 0x6bafff : body.color,
          body.id === "sun" ? 0.5 : 0.3,
        ),
      );
      shell.scale.setScalar(radius * 1.035);
      container.add(shell);
      rims.push(shell.material);
    }
    if (body.id === "earth") {
      const clouds = cloudShell(radius * 1.009);
      tilted.add(clouds);
      container.userData.clouds = clouds;
    }
    if (body.id === "sun") {
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloMap,
          color: 0xf3a655,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      halo.scale.setScalar(radius * 4.5);
      container.add(halo);
      container.userData.halo = halo;
    }
    if (["saturn", "uranus"].includes(body.id)) {
      const inner = body.id === "saturn" ? 1.25 : 1.7,
        outer = body.id === "saturn" ? 2.32 : 2.05;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * inner, radius * outer, 160, 4),
        new THREE.ShaderMaterial({
          uniforms: {
            color: {
              value: new THREE.Color(
                body.id === "saturn" ? 0xd4bb91 : 0x87aaa7,
              ),
            },
            inner: { value: radius * inner },
            outer: { value: radius * outer },
            alpha: { value: 0.74 },
          },
          vertexShader:
            "varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
          fragmentShader:
            "uniform vec3 color;uniform float inner;uniform float outer;uniform float alpha;varying vec2 p;void main(){float r=(length(p)-inner)/(outer-inner);float band=.55+.2*sin(r*75.)+.12*sin(r*211.);float gap=1.-smoothstep(.56,.575,r)+smoothstep(.61,.63,r);gl_FragColor=vec4(color*(.8+band*.4),alpha*band*gap);}",
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      tilted.add(ring);
      rings.push(ring.material);
    }
    container.userData.sphere = sphere;
    return container;
  }
  function line(points, color, opacity) {
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    return l;
  }
  function bodyElements(body) {
    return fallbackElements[body.id] || elementsAt(body.id, days);
  }
  function physicalPoint(body) {
    if (body.id === "sun") return [0, 0, 0];
    if (!fallbackElements[body.id]) return planetPosition(body.id, days);
    const el = [...fallbackElements[body.id]];
    el[3] += (days / orbitPhysics(el[0]).periodDays) * 360;
    return ellipsePoint(
      el,
      solveKepler(((el[3] - el[4]) * Math.PI) / 180, el[1]),
    );
  }
  for (const body of WORLDS) {
    const model = makeBody(body, radiusFor(body));
    models.set(body.id, model);
    overview.add(model);
    if (body.a) {
      const points = Array.from({ length: 241 }, (_, i) =>
        toDisplay(ellipsePoint(bodyElements(body), (i / 240) * TAU)),
      );
      const orbit = line(
        points,
        body.id === "earth" ? 0x72e4e2 : 0x8796a8,
        body.id === "earth" ? 0.4 : 0.2,
      );
      overview.add(orbit);
      orbitLines.push(orbit);
    }
    const button = document.createElement("button");
    button.className = "solar-object-label";
    button.dataset.body = body.id;
    button.innerHTML = `<i style="background:${body.color}"></i><span>${body.name}</span>`;
    button.setAttribute("aria-label", "Zoom in on " + body.name);
    labelRoot.append(button);
    labels.push({ model, button, radius: radiusFor(body) });
  }
  // Belts are a statistical illustration, not actual small-body positions.
  let seed = 43209;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function belt(aMin, aMax, count) {
    const coords = [];
    for (let i = 0; i < count; i++) {
      const a = rand() * TAU,
        r = 38 + 133 * Math.log1p(aMin + (aMax - aMin) * rand());
      coords.push(Math.cos(a) * r, (rand() - 0.5) * 9, Math.sin(a) * r);
    }
    const points = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xa69780,
        size: 1.1,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    points.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(coords, 3),
    );
    overview.add(points);
    return points;
  }
  const belts = [belt(2.1, 3.3, 1600), belt(32, 45, 2200)];
  const starCoords = [];
  for (let i = 0; i < 1700; i++) {
    const a = rand() * TAU,
      z = rand() * 2 - 1,
      s = Math.sqrt(1 - z * z),
      r = 1700 + rand() * 550;
    starCoords.push(r * s * Math.cos(a), r * z, r * s * Math.sin(a));
  }
  const stars = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color: 0xbbcfe1,
      size: 1.8,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  stars.geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starCoords, 3),
  );
  group.add(stars);
  function disposeFocus() {
    for (const l of localLabels) l.button.remove();
    localLabels = [];
    moonGroup = null;
    cutaway = null;
    testOrbit = null;
    orbitPlaying = false;
    focus.traverse((o) => {
      if (o.geometry && !o.isSprite && o.geometry !== geometry)
        o.geometry.dispose();
      if (o.material) {
        const mat = o.material;
        rims.splice(rims.indexOf(mat), rims.includes(mat) ? 1 : 0);
        rings.splice(rings.indexOf(mat), rings.includes(mat) ? 1 : 0);
        mat.dispose();
      }
    });
    focus.clear();
  }
  function overviewInfo() {
    detail.innerHTML = `<div class="solar-guide-number">01 — 20 WORLDS</div><h2>A star.<br>Eight planets.<br><em>Countless stories.</em></h2><p>Select a planet in the scene or the world list. Drag to orbit and scroll to change scale.</p><div class="solar-guide-rule"></div><h3>Choose a world. Follow the physics.</h3><p>Open a world to inspect its interior, calculate gravity and escape speed, or experiment with sunlight and temperature.</p><p>Adapted from your <a href="https://muon-atlas-observatory.pepe7520.chatgpt.site/" target="_blank" rel="noopener">Muon Atlas project ↗</a>.</p><button class="solar-primary" data-body="earth">Explore Earth <span>↗</span></button><button class="solar-secondary" data-solar-action="lab">Back to physics labs <span>↙</span></button><details class="solar-model"><summary>How to read this model</summary><p>Planet positions use JPL’s approximate Keplerian elements and rates, with UTC used as an approximation to dynamical time. Earth is represented by the Earth–Moon barycentre. Orbits are not suitable for navigation.</p><p>Distances use a logarithmic display scale; radii are enlarged independently. Painted surfaces, illumination, spin, belt dots, and satellite placements are illustrative. Earth’s map is NASA’s Blue Marble. Ceres and Pluto use fixed illustrative orbital elements.</p><a href="https://ssd.jpl.nasa.gov/planets/approx_pos.html" target="_blank" rel="noopener">JPL · Planet position model ↗</a></details>`;
  }
  function selectBody(id) {
    const body = BODY_MAP[id];
    if (!body) return;
    selected = body;
    depth = "overview";
    altitude = 100;
    selectedLayer = 0;
    albedo = 0.3;
    layerSpread = 0;
    isolateLayer = false;
    orbitPhase = 0;
    running = false;
    updatePlay();
    overview.visible = false;
    focus.visible = true;
    disposeFocus();
    const parent = body.parent ? BODY_MAP[body.parent] : body,
      position = toDisplay(physicalPoint(parent));
    focus.position.copy(position);
    const main = makeBody(body, 42);
    focus.add(main);
    main.userData.main = true;
    const siblings = SATELLITES(body.id);
    if (siblings.length) {
      moonGroup = new THREE.Group();
      focus.add(moonGroup);
      siblings.forEach((m, i) => {
        const angle = 0.5 + (i / siblings.length) * TAU,
          r = 94 + i * 23,
          model = makeBody(
            m,
            Math.max(3, Math.min(8, (m.radius / body.radius) * 42 * 2.4)),
          );
        model.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        moonGroup.add(model);
        const path = line(
          Array.from({ length: 121 }, (_, k) =>
            V(Math.cos((k / 120) * TAU) * r, 0, Math.sin((k / 120) * TAU) * r),
          ),
          0x8796a8,
          0.2,
        );
        moonGroup.add(path);
        const button = document.createElement("button");
        button.className = "solar-object-label solar-moon-label";
        button.dataset.body = m.id;
        button.textContent = m.name;
        button.setAttribute("aria-label", "Explore " + m.name);
        labelRoot.append(button);
        localLabels.push({ model, button, radius: 8 });
      });
    }
    controls.minDistance = 58;
    controls.maxDistance = 2200;
    controls.maxPolarAngle = Math.PI * 0.96;
    controls.autoRotate = false;
    root.dataset.view = "body";
    root.querySelector(".solar-intro h1").innerHTML =
      `Closer to<br><em>${body.name}.</em>`;
    root.querySelector(".solar-intro>p").textContent = body.lead;
    $("solar-crumb").innerHTML =
      `<span> / </span>${body.parent ? `<button data-body="${body.parent}">${parent.name}</button><span> / </span>` : ""}<strong>${body.name}</strong>`;
    renderBody();
    root.querySelector(".solar-desk").scrollTop = 0;
    applyTheme();
    updateCatalog();
    flyTo(position.clone().add(V(-75, 80, 155)), position);
    root.querySelector(".solar-status").textContent =
      "Exploring " + body.name + ". Drag to orbit; scroll to zoom.";
    if (canvas.clientWidth < 900)
      window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function showOverview(instant = false) {
    selected = null;
    depth = "overview";
    overview.visible = true;
    focus.visible = false;
    root.dataset.view = "overview";
    root.querySelector(".solar-intro h1").innerHTML =
      "Our cosmic<br><em>neighbourhood.</em>";
    root.querySelector(".solar-intro>p").innerHTML =
      "Follow a world. Find its moons.<br>See where the muon story takes place.";
    $("solar-crumb").textContent = "";
    controls.minDistance = 120;
    controls.maxDistance = 2300;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.autoRotate = false;
    updateCatalog();
    overviewInfo();
    const w = canvas.clientWidth,
      position = w < 900 ? V(900, 1350, 1150) : V(520, 830, 930);
    flyTo(position, V(0, 0, 0), instant);
    root.querySelector(".solar-status").textContent =
      "Solar-system overview. Drag to orbit, scroll to zoom, and select a world to inspect it.";
  }
  function updateCatalog() {
    catalog.querySelectorAll("[data-body]").forEach((b) => {
      const match = b.dataset.body === (selected?.parent || selected?.id);
      b.classList.toggle("selected", match);
      b.setAttribute("aria-pressed", String(match));
    });
  }
  function makeCutaway() {
    if (cutaway) return;
    cutaway = new THREE.Group();
    focus.add(cutaway);
    const layers = INTERIORS[selected.id].layers;
    layers.forEach((l, i) => {
      const inner = i ? layers[i - 1].edge * 42 : 0,
        outer = l.edge * 42,
        outermost = i === layers.length - 1;
      const geo = new THREE.SphereGeometry(
        outer,
        72,
        48,
        Math.PI / 2,
        Math.PI * 1.5,
      );
      if (outermost) {
        const uv = geo.attributes.uv;
        for (let j = 0; j < uv.count; j++) uv.setX(j, 0.25 + 0.75 * uv.getX(j));
      }
      const surface = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: outermost ? 0xffffff : l.color,
          map: outermost ? textures.get(selected.id) : null,
          roughness: 0.85,
          emissive: l.color,
          emissiveIntensity: 0.05,
          side: THREE.DoubleSide,
        }),
      );
      surface.userData.layer = i;
      cutaway.add(surface);
      for (let side = 0; side < 2; side++) {
        const face = new THREE.Mesh(
          new THREE.RingGeometry(
            inner,
            outer,
            128,
            8,
            side ? -Math.PI / 2 : Math.PI / 2,
            Math.PI,
          ),
          interiorFace(l.color, inner, outer),
        );
        if (side) face.rotation.y = -Math.PI / 2;
        face.userData.layer = i;
        face.userData.layerColor = l.color;
        cutaway.add(face);
      }
    });
  }
  function applyLayerView() {
    if (!cutaway) return;
    cutaway.children.forEach((o) => {
      const i = o.userData.layer;
      o.position.set(-i * layerSpread * 13, i * layerSpread * 13, 0);
      o.visible = !isolateLayer || i === selectedLayer;
    });
    frameLayerView();
  }
  function frameLayerView() {
    if (!cutaway) return;
    const bounds = new THREE.Box3();
    cutaway.children
      .filter((o) => o.visible)
      .forEach((o) => {
        o.updateWorldMatrix(true, false);
        bounds.expandByObject(o);
      });
    if (bounds.isEmpty()) return;
    const target = bounds.getCenter(V()),
      distance = Math.max(125, bounds.getSize(V()).length() * 1.65);
    flyTo(
      target
        .clone()
        .add(V(-0.38, 0.48, 0.8).normalize().multiplyScalar(distance)),
      target,
    );
  }
  function updateTestOrbit() {
    if (!selected || depth !== "physics") return;
    if (!testOrbit) {
      testOrbit = new THREE.Group();
      focus.add(testOrbit);
      const ring = line(
        Array.from({ length: 241 }, (_, i) =>
          V(Math.cos((i / 240) * TAU), 0, Math.sin((i / 240) * TAU)),
        ),
        0x72e4e2,
        0.65,
      );
      testOrbit.add(ring);
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 24, 16),
        new THREE.MeshBasicMaterial({ color: 0xdfbb7b }),
      );
      testOrbit.add(particle);
    }
    testOrbit.visible = true;
    const radius = 42 * (1 + altitude / selected.radius);
    testOrbit.children[0].scale.setScalar(radius);
    testOrbit.children[1].position.set(
      Math.cos(orbitPhase * TAU) * radius,
      0,
      Math.sin(orbitPhase * TAU) * radius,
    );
    updateOrbitClock();
    const slider = $("solar-orbit-phase");
    if (slider) {
      if (document.activeElement !== slider) slider.value = orbitPhase;
      slider.oninput = (e) => {
        orbitPhase = +e.target.value;
        orbitPlaying = false;
        updateTestOrbit();
      };
    }
  }
  function updateOrbitClock() {
    const clock = $("solar-orbit-clock"),
      button = $("solar-test-play");
    if (!clock) return;
    const p = bodyPhysics(selected, altitude);
    clock.textContent = `${fmt(orbitPhase * 360, 1)}° · model elapsed ${fmt(orbitPhase * p.period, 3)} h / ${fmt(p.period, 3)} h · ${fmt((p.period * 3600) / 20, 1)}× clock`;
    button.textContent = orbitPlaying ? "Pause test orbit" : "Play test orbit";
    button.setAttribute("aria-pressed", String(orbitPlaying));
  }
  function frameTestOrbit() {
    const r = 42 * (1 + altitude / selected.radius),
      distance = Math.max(185, r * 2.6);
    flyTo(
      focus.position
        .clone()
        .add(V(-0.38, 0.48, 0.8).normalize().multiplyScalar(distance)),
      focus.position,
    );
  }
  function showLayer(index, scroll = false) {
    selectedLayer = index;
    const l = INTERIORS[selected.id].layers[index];
    root
      .querySelectorAll("[data-solar-layer]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(+b.dataset.solarLayer === index)),
      );
    const previous = index ? INTERIORS[selected.id].layers[index - 1].edge : 0;
    $("solar-layer-reading").innerHTML =
      `<div class="solar-layer-kicker">LAYER ${index + 1} · CENTRE TO SURFACE</div><h3>${l.name}</h3><p>${l.text}</p>${equation([String.raw`\text{Drawn radial interval:}\ ${(previous * 100).toFixed(0)}\%\text{--}${(l.edge * 100).toFixed(0)}\%`, String.raw`\frac{V_{\mathrm{shell}}}{V}=\left(\frac{r_2}{R}\right)^3-\left(\frac{r_1}{R}\right)^3`, String.raw`\text{Volume share:}\ ${(100 * (l.edge ** 3 - previous ** 3)).toFixed(1)}\%`], "solar-formula")}<p class="solar-small">This volume follows the displayed schematic boundaries. It is not a measured mass fraction: density varies between and within layers. The surface grain and cross-section texture are visual aids.</p>`;
    applyLayerView();
    cutaway.traverse((o) => {
      if (o.userData.layerColor)
        o.material.uniforms.selected.value = o.userData.layer === index ? 1 : 0;
    });
    root.querySelector(".solar-status").textContent =
      selected.name + " · " + l.name + ". Cutaway boundaries are illustrative.";
    if (scroll)
      $("solar-layer-reading").scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }
  function renderBody() {
    const b = selected,
      p = bodyPhysics(b),
      parent = b.parent ? BODY_MAP[b.parent] : null,
      r = b.a ? Math.hypot(...physicalPoint(b)) : parent?.a;
    const year = b.a ? orbitPhysics(b.a).periodDays : b.periodDays;
    detail.innerHTML = `<div class="solar-guide-number">${b.type.toUpperCase()}</div><h2>${b.name}</h2><div class="solar-facts">${card("Mean radius", fmt(b.radius, 0), "km")}${card("Reference gravity", fmt(p.gravity), "m/s²")}${card(b.parent ? "Orbit around " + parent.name : b.a ? "Year length" : "Photosphere", b.id === "sun" ? "~5,770" : fmt(year, b.parent || year < 10 ? 2 : 0), b.id === "sun" ? "K" : "days")}${card(b.parent ? "Parent distance" : b.a ? "Sun distance now" : "Earth light delay", b.id === "sun" ? "~8.3" : b.parent ? fmt(b.orbitKm, 0) : fmt(r, 3), b.id === "sun" ? "min" : b.parent ? "km" : "AU")}</div>
  <nav class="solar-tabs" role="tablist" aria-label="${b.name} explanation"><button role="tab" data-solar-depth="overview" aria-selected="${depth === "overview"}">Discover</button><button role="tab" data-solar-depth="inside" aria-selected="${depth === "inside"}">Inside</button><button role="tab" data-solar-depth="physics" aria-selected="${depth === "physics"}">Calculate</button><button role="tab" data-solar-depth="moons" aria-selected="${depth === "moons"}">${b.parent ? "Related" : "Moons"}</button></nav>
  <div id="solar-body-content" role="tabpanel" aria-label="${b.name} ${depth}"></div>`;
    renderDepth();
  }
  function renderDepth() {
    if (!selected) return;
    const b = selected,
      c = $("solar-body-content"),
      moons = SATELLITES(b.id),
      interior = INTERIORS[b.id];
    root.dataset.depth = depth;
    orbitPlaying = false;
    if (testOrbit) testOrbit.visible = depth === "physics";
    focus.children.find((o) => o.userData.main).visible = depth !== "inside";
    if (moonGroup) moonGroup.visible = depth !== "inside";
    if (cutaway) cutaway.visible = depth === "inside";
    root
      .querySelectorAll(".solar-tabs [data-solar-depth]")
      .forEach((button) => {
        const chosen = button.dataset.solarDepth === depth;
        button.setAttribute("aria-selected", String(chosen));
        button.setAttribute("aria-controls", "solar-body-content");
        button.id = "solar-tab-" + button.dataset.solarDepth;
        button.tabIndex = chosen ? 0 : -1;
      });
    c.setAttribute("aria-label", b.name + " " + depth);
    c.setAttribute("aria-labelledby", "solar-tab-" + depth);
    if (depth === "overview")
      c.innerHTML = `<p class="solar-lead">${b.lead}</p><h3>${b.id === "sun" ? "A living star" : "What makes it different"}</h3><p>${b.science}</p><h3>Below the first impression</h3><p>${b.inside}</p><h3>How do we know?</h3><p>${interior.evidence}</p>${evidenceLink(b)}<details class="solar-question"><summary>${interior.question}</summary><p>${interior.answer}</p></details><button class="solar-secondary" data-solar-depth="inside">Open the 3D interior ↗</button><div class="solar-connection"><span>THE MUON CONNECTION</span><p>${b.connection}</p>${b.id === "earth" ? '<button class="solar-primary" data-solar-action="lab">Back to physics labs ↙</button>' : b.id === "sun" ? "" : ""}</div><a class="solar-source" href="${b.source}" target="_blank" rel="noopener">NASA · ${b.name} science ↗</a>`;
    else if (depth === "inside") {
      makeCutaway();
      cutaway.visible = true;
      c.innerHTML = `<p class="solar-lead">Beneath ${b.name}.</p><p>Click a coloured face in 3D or choose a layer. Drag to orbit the cutaway.</p><div class="experiment-box"><div class="experiment-kicker">HANDLE THE INTERIOR</div><label for="solar-layer-spread">Separate the shells <output id="solar-layer-spread-value">${Math.round(layerSpread * 100)}%</output></label><input id="solar-layer-spread" aria-label="Interior visual shell separation" type="range" min="0" max="1" step=".05" value="${layerSpread}"><label><input id="solar-layer-isolate" type="checkbox" ${isolateLayer ? "checked" : ""}> Show only the selected layer</label><p>Shells move apart for inspection. Their physical radii and calculated volume shares stay fixed.</p></div><div class="solar-layer-list">${interior.layers.map((l, i) => `<button data-solar-layer="${i}" aria-pressed="${i === selectedLayer}"><i style="background:${l.color}"></i><span>${String(i + 1).padStart(2, "0")}<strong>${l.name}</strong></span></button>`).join("")}</div><div id="solar-layer-reading" aria-live="polite"></div><h3>How the interior is inferred</h3><p>${interior.evidence}</p>${evidenceLink(b)}<div class="solar-connection"><span>READ THIS CUTAWAY CAREFULLY</span><p>These layer radii are chosen for readability. Thin shells are exaggerated; uncertain boundaries are drawn sharply. This is a schematic cross-section, not a measured density map.</p><p>${b.id === "earth" ? "Seismic waves constrain Earth’s global interior. Muons instead investigate local targets such as the pyramid." : b.id === "sun" ? "Energy flows outward through the star. This is a different process from a cosmic-ray shower producing muons at Earth." : "The Earth muon model does not infer these layers or predict detector rates on this world."}</p></div><details class="solar-question" open><summary>${interior.question}</summary><p>${interior.answer}</p></details><a class="solar-source" href="${b.source}" target="_blank" rel="noopener">NASA · ${b.name} science ↗</a>`;
      $("solar-layer-spread").oninput = (e) => {
        layerSpread = +e.target.value;
        $("solar-layer-spread-value").textContent =
          Math.round(layerSpread * 100) + "%";
        applyLayerView();
      };
      $("solar-layer-isolate").onchange = (e) => {
        isolateLayer = e.target.checked;
        applyLayerView();
      };
      showLayer(selectedLayer);
    } else if (depth === "physics") {
      c.innerHTML = `<h3>Gravity, escape, and orbit</h3><p>Move a hypothetical test particle above ${b.name}. The calculations use a spherical body and Newtonian gravity, with no atmosphere, drag, or third-body forces.</p><label class="solar-altitude-label" for="solar-altitude">Altitude above mean radius <output id="solar-altitude-value"></output></label><input id="solar-altitude" type="range" min="0" max="${Math.max(1000, Math.round(b.radius * 3))}" step="10" value="${altitude}" aria-label="Test particle altitude in kilometres"><div class="experiment-box"><div class="experiment-kicker">PUT THE EQUATIONS IN MOTION</div><h3>A test particle around ${b.name}</h3><div class="experiment-actions"><button id="solar-test-play" aria-pressed="false">Play test orbit</button><button id="solar-test-reset">Reset orbit</button><button id="solar-test-fit">Frame the orbit</button></div><label for="solar-orbit-phase">Orbital phase</label><input id="solar-orbit-phase" aria-label="Test orbit phase" type="range" min="0" max="1" step=".001" value="${orbitPhase}"><div id="solar-orbit-clock" class="experiment-clock"></div><p>One orbit takes 20 seconds on screen. The model clock uses the calculated Newtonian period. Radius is drawn on the same scale as this enlarged world; the particle itself is enlarged. At zero altitude this is only a mathematical reference.</p></div><div id="solar-calculated" class="solar-calculated"></div>${equation([String.raw`r=(R_{\mathrm{km}}+h_{\mathrm{km}})\times10^3\,\mathrm m`, String.raw`g=\frac{GM}{r^2}`, String.raw`v_{\mathrm{esc}}=\sqrt{\frac{2GM}{r}}`, String.raw`v_{\mathrm{circ}}=\sqrt{\frac{GM}{r}}`, String.raw`P=2\pi\sqrt{\frac{r^3}{GM}}`], "solar-formula")}<svg id="solar-gravity-chart" viewBox="0 0 310 140" role="img" aria-label="Gravity and altitude graph"></svg><p class="solar-small">${["Gas giant", "Ice giant"].includes(b.type) ? "A reference radius, not a solid surface. " : ""}Mean-radius gravity differs from equatorial effective gravity, which includes shape and rotation. A zero-altitude orbit is a mathematical reference and may intersect terrain, the atmosphere, or plasma.</p><div class="solar-input-data"><span>R = ${fmt(b.radius, 2)} km</span><span>${b.gm ? "GM = " + fmt(b.gm, 4) + " km³/s²" : "M = " + scientific(b.mass) + " kg"}</span><span>G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻²</span></div><div id="solar-worked-gravity"></div><div id="solar-orbit-calculation"></div><div id="solar-energy-calculation"></div><a class="solar-source" href="https://ssd.jpl.nasa.gov/${b.parent ? "sats/phys_par/sep.html" : "planets/phys_par.html"}" target="_blank" rel="noopener">JPL · Physical parameters ↗</a>`;
      $("solar-altitude").oninput = (e) => {
        altitude = +e.target.value;
        renderCalculations();
      };
      renderCalculations();
      renderOrbitalDetails();
      renderEnergyBalance();
    } else {
      const related = b.parent
        ? [
            BODY_MAP[b.parent],
            ...SATELLITES(b.parent).filter((m) => m.id !== b.id),
          ]
        : moons;
      c.innerHTML = `<h3>${b.parent ? "The " + BODY_MAP[b.parent].name + " system" : moons.length ? "Explore selected moons" : "A different kind of system"}</h3><p>${b.id === "sun" ? "All eight planets orbit our star. Choose one from the world list." : moons.length ? "Click a moon here or beside the planet in 3D. Satellite sizes and orbital separations are enlarged independently; their displayed locations are illustrative." : b.parent ? "Return to the parent world, or follow another moon." : "No moons are included for this world in the explorer. Mercury and Venus have no natural moons; Ceres has no known moon. Uranus and Mars have moons that are not rendered in this edition."}</p><div class="solar-moon-list">${related.map((m) => `<button data-body="${m.id}" style="--body-color:${m.color}"><i></i><div><strong>${m.name}</strong><small>${m.parent ? fmt(m.periodDays) + " day orbit" : m.type} · ${fmt(m.radius, 0)} km radius</small></div><span>↗</span></button>`).join("")}</div>${b.id === "earth" ? '<div class="solar-connection"><span>BACK AT THE OBSERVATORY</span><p>The atmosphere above Earth makes the secondary muons that our detector measures.</p><button class="solar-primary" data-solar-action="lab">Back to physics labs ↙</button></div>' : ""}`;
      if (moons.length)
        flyTo(focus.position.clone().add(V(-180, 160, 310)), focus.position);
    }
  }
  function renderCalculations() {
    updateTestOrbit();
    const b = selected,
      p = bodyPhysics(b, altitude),
      max = +$("solar-altitude").max;
    $("solar-altitude-value").textContent = fmt(altitude, 0) + " km";
    const pct = (altitude / max) * 100;
    $("solar-altitude").style.background =
      `linear-gradient(90deg,var(--gold) ${pct}%,var(--range-track) ${pct}%)`;
    $("solar-calculated").innerHTML =
      card("Gravity", fmt(p.gravity, 3), "m/s²") +
      card("Escape speed", fmt(p.escape, 3), "km/s") +
      card("Circular speed", fmt(p.circular, 3), "km/s") +
      card("Orbital period", fmt(p.period, 3), "hours");
    const mu = b.gm ? b.gm * 1e9 : G * b.mass,
      r = (b.radius + altitude) * 1000;
    $("solar-worked-gravity").innerHTML =
      `<h3>Follow the substitution</h3>${equation([String.raw`\mu=GM=${numberTex(mu.toExponential(3))}\,\mathrm{m^3\,s^{-2}}`, String.raw`r=(${numberTex(fmt(b.radius, 2))}+${numberTex(fmt(altitude, 0))})\times10^3\,\mathrm m`, String.raw`=${numberTex(fmt(r, 0))}\,\mathrm m`, String.raw`g=\frac\mu{r^2}=${numberTex(fmt(p.gravity, 5))}\,\mathrm{m\,s^{-2}}`, String.raw`\frac{v_{\mathrm{esc}}}{v_{\mathrm{circ}}}=\sqrt2`], "solar-formula")}<div class="solar-calculated">${card("Mean body density", fmt(p.density, 3), "g/cm³")}${card("Gravity / Earth surface", fmt(p.gravity / bodyPhysics(BODY_MAP.earth).gravity, 3), "×")}</div><h3>Why gravity and escape differ</h3><p>Gravity is the local acceleration. Escape speed is set by the energy needed to reach infinity with zero remaining speed. A circular orbit instead requires inward acceleration equal to v²/r.</p><p class="solar-small">Doubling distance from the centre reduces gravity to one quarter, escape speed to 1/√2, and increases circular period by 2√2. Doubling altitude is different because distance is R + h.</p>`;
    const base = bodyPhysics(b).gravity,
      plot = Array.from({ length: 81 }, (_, i) => {
        const h = (i / 80) * max;
        return `${i ? "L" : "M"}${36 + (i / 80) * 256},${112 - (bodyPhysics(b, h).gravity / base) * 94}`;
      }).join(" "),
      x = 36 + (altitude / max) * 256,
      y = 112 - (p.gravity / base) * 94;
    $("solar-gravity-chart").innerHTML =
      `<path d="M36 16V112H292" fill="none" stroke="var(--line)"/><path d="${plot}" fill="none" stroke="var(--cyan)" stroke-width="2"/><path d="M${x} 112V${y}" stroke="var(--gold)" stroke-dasharray="3 3"/><circle cx="${x}" cy="${y}" r="4" fill="var(--gold)"/><g fill="var(--muted)" font-family="monospace" font-size="9"><text x="0" y="22">${fmt(base, 1)}</text><text x="14" y="114">0</text><text x="36" y="131">0</text><text x="212" y="131">${fmt(max, 0)} km</text><text x="38" y="11">g (m/s²)</text></g>`;
  }
  function renderOrbitalDetails() {
    const b = selected,
      c = $("solar-orbit-calculation");
    if (b.id === "sun") {
      c.innerHTML = `<h3>Radiating star, rather than orbiting planet</h3><p>The solar luminosity assumed in the energy-balance examples is 3.828 × 10²⁶ W. At a radius of ${fmt(b.radius, 0)} km, L/(4πR²) gives approximately ${fmt(SOLAR_LUMINOSITY / (4 * Math.PI * (b.radius * 1000) ** 2), 0)} W/m². A blackbody with this outward flux has an effective temperature of approximately ${fmt((SOLAR_LUMINOSITY / (4 * Math.PI * (b.radius * 1000) ** 2) / STEFAN_BOLTZMANN) ** 0.25, 0)} K.</p><p class="solar-small">This effective temperature characterizes emitted power. It is not the core temperature or the temperature of every part of the photosphere.</p>`;
      return;
    }
    if (b.parent) {
      const parent = BODY_MAP[b.parent],
        p = satellitePhysics(b, parent);
      c.innerHTML = `<h3>Orbiting ${parent.name}</h3><div class="solar-calculated">${card("Reference separation", fmt(b.orbitKm, 0), "km")}${card("Relative circular speed", fmt(p.relativeSpeed, 3), "km/s")}${card("Two-body period", fmt(p.periodDays, 4), "days")}${card("Parent → barycentre", fmt(p.barycentreKm, 1), "km")}</div>${equation([String.raw`P=2\pi\sqrt{\frac{a^3}{\mu_{\mathrm{parent}}+\mu_{\mathrm{moon}}}}`, String.raw`r_{\mathrm{bary}}=\frac{a\mu_{\mathrm{moon}}}{\mu_{\mathrm{parent}}+\mu_{\mathrm{moon}}}`], "solar-formula")}<p>Both bodies move around their common centre of mass. ${p.barycentreKm > parent.radius ? "For this pair the centre lies outside the parent world." : "For this pair the centre lies inside the parent world."} The listed reference period is ${fmt(b.periodDays, 4)} days.</p><p class="solar-small">This estimate assumes a circular isolated pair and the reference separation. Solar perturbations, eccentricity, resonances, and other moons are omitted. The 3D moon positions remain illustrative.</p>`;
      return;
    }
    const el = bodyElements(b),
      a = el[0],
      e = el[1],
      r = Math.hypot(...physicalPoint(b)),
      p = orbitPhysics(a, r);
    c.innerHTML = `<h3>Its journey around the Sun</h3><div class="solar-calculated">${card("Semi-major axis", fmt(a, 4), "AU")}${card("Eccentricity", fmt(e, 5))}${card("Perihelion", fmt(a * (1 - e), 4), "AU")}${card("Aphelion", fmt(a * (1 + e), 4), "AU")}${card("Orbital speed now", fmt(p.speed, 3), "km/s")}${card("One-way solar light time", fmt(p.lightMinutes, 2), "min")}</div>${equation([String.raw`q=a(1-e),\qquad Q=a(1+e)`, String.raw`v^2=GM_\odot\left(\frac2r-\frac1a\right)`, String.raw`P^2=\frac{4\pi^2a^3}{GM_\odot}`], "solar-formula")}<p>Closer to perihelion, orbital speed increases. Equal areas are swept in equal times, so a planet does not travel at a constant speed around an ellipse.</p><p class="solar-small">These values use ${fallbackElements[b.id] ? "fixed illustrative dwarf-planet elements" : "the selected date’s JPL approximate elements"} and a two-body solar-mass calculation. The orbit display compresses distances; these numerical distances do not.</p>`;
  }
  function renderEnergyBalance() {
    const b = selected,
      c = $("solar-energy-calculation");
    if (b.id === "sun") {
      c.innerHTML = "";
      return;
    }
    const r = Math.hypot(...physicalPoint(b.parent ? BODY_MAP[b.parent] : b));
    c.innerHTML = `<h3>Sunlight and equilibrium</h3><p>Change the assumed Bond albedo: the fraction of total sunlight reflected. This is an energy-balance experiment, not an observed surface-temperature prediction.</p><label class="solar-altitude-label" for="solar-albedo">Assumed reflectivity <output id="solar-albedo-value"></output></label><input id="solar-albedo" type="range" min="0" max="1" step=".01" value="${albedo}" aria-label="Assumed Bond albedo"><div id="solar-thermal-values" class="solar-calculated"></div><div id="solar-thermal-equation"></div><svg id="solar-thermal-chart" viewBox="0 0 310 145" role="img" aria-label="Equilibrium temperature versus assumed albedo"></svg><p>The body intercepts light over a disc, πR², and emits over a sphere, 4πR². That gives the factor of four for uniform redistribution. At fixed albedo, sunlight falls as 1/r² and equilibrium temperature as 1/√r.</p><p class="solar-small">Emissivity is 1. No greenhouse effect, internal heat, thermal lag, eclipse, or uneven day/night temperature is included. ${b.parent ? "Sun distance is approximated by the parent planet’s distance. " : ""}The default albedo 0.30 is an assumption for every world. Temperature in this ideal model is not a habitability test.</p><details class="solar-question"><summary>Constants and radiation assumptions</summary><p>L☉ = 3.828 × 10²⁶ W is the IAU nominal solar luminosity. σ = 5.670374419 × 10⁻⁸ W m⁻² K⁻⁴ is the Stefan–Boltzmann constant. Albedo is the total reflected fraction, not simply visible brightness.</p><a class="solar-source" href="https://arxiv.org/abs/1510.07674" target="_blank" rel="noopener">IAU · Nominal constants ↗</a><a class="solar-source" href="https://physics.nist.gov/cuu/Constants/index.html" target="_blank" rel="noopener">NIST · Physical constants ↗</a></details><a class="solar-source" href="https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/" target="_blank" rel="noopener">NASA · Energy balance ↗</a>`;
    const update = () => {
      const p = energyBalance(r, albedo),
        maxT = energyBalance(r, 0).temperature;
      $("solar-albedo-value").textContent =
        fmt(albedo * 100, 0) + "% reflected";
      $("solar-thermal-values").innerHTML =
        card("Incident sunlight", fmt(p.incident, 2), "W/m²") +
        card("Absorbed global average", fmt(p.absorbed, 2), "W/m²") +
        card("Equilibrium temperature", fmt(p.temperature, 2), "K") +
        card("Solar distance", fmt(r, 4), "AU");
      $("solar-thermal-equation").innerHTML = equation(
        [
          String.raw`S=\frac{L_\odot}{4\pi r^2}=${numberTex(fmt(p.incident, 3))}\,\mathrm{W\,m^{-2}}`,
          String.raw`T_{\mathrm{eq}}=\left[\frac{(1-A)S}{4\sigma}\right]^{1/4}`,
          String.raw`=\left[\frac{${numberTex(fmt(1 - albedo, 2))}\times${numberTex(fmt(p.incident, 3))}}{4\times5.670374419\times10^{-8}}\right]^{1/4}\,\mathrm K`,
          String.raw`=${numberTex(fmt(p.temperature, 3))}\,\mathrm K`,
        ],
        "solar-formula",
      );
      const curve = Array.from(
          { length: 101 },
          (_, i) =>
            `${i ? "L" : "M"}${36 + i * 2.56},${116 - (energyBalance(r, i / 100).temperature / maxT) * 96}`,
        ).join(" "),
        x = 36 + albedo * 256,
        y = 116 - (p.temperature / maxT) * 96;
      $("solar-thermal-chart").innerHTML =
        `<path d="M36 16V116H292" fill="none" stroke="var(--line)"/><path d="${curve}" fill="none" stroke="var(--cyan)" stroke-width="2"/><circle cx="${x}" cy="${y}" r="4" fill="var(--gold)"/><g fill="var(--muted)" font-family="monospace" font-size="9"><text x="0" y="24">${fmt(maxT, 0)}</text><text x="21" y="118">0</text><text x="36" y="135">0</text><text x="273" y="135">1.0</text><text x="40" y="11">T (K)</text><text x="125" y="135">Bond albedo</text></g>`;
    };
    $("solar-albedo").oninput = (e) => {
      albedo = +e.target.value;
      update();
    };
    update();
  }
  function updatePositions() {
    for (const b of WORLDS)
      models.get(b.id).position.copy(toDisplay(physicalPoint(b)));
    if (selected)
      focus.position.copy(
        toDisplay(
          physicalPoint(selected.parent ? BODY_MAP[selected.parent] : selected),
        ),
      );
  }
  function updatePlay() {
    const button = $("solar-play");
    button.textContent = running ? "Ⅱ" : "▶";
    button.setAttribute("aria-pressed", String(running));
    button.setAttribute(
      "aria-label",
      running ? "Pause planetary orbits" : "Play planetary orbits",
    );
  }
  root.addEventListener("click", (e) => {
    const body = e.target.closest("[data-body]");
    if (body) {
      selectBody(body.dataset.body);
      return;
    }
    const layer = e.target.closest("[data-solar-layer]");
    if (layer) {
      showLayer(+layer.dataset.solarLayer, true);
      return;
    }
    const reading = e.target.closest(".solar-reading");
    if (reading) {
      const expanded = root.classList.toggle("reading-wide");
      reading.setAttribute("aria-pressed", String(expanded));
      reading.setAttribute(
        "aria-label",
        expanded ? "Narrow field guide" : "Expand field guide",
      );
      reading.textContent = expanded ? "↔ Compact" : "↔ Read wider";
      return;
    }
    const tab = e.target.closest("[data-solar-depth]");
    if (tab) {
      depth = tab.dataset.solarDepth;
      renderDepth();
      return;
    }
    if (e.target.id === "solar-test-play") {
      orbitPlaying = !orbitPlaying;
      updateOrbitClock();
      return;
    }
    if (e.target.id === "solar-test-reset") {
      orbitPhase = 0;
      orbitPlaying = false;
      updateTestOrbit();
      return;
    }
    if (e.target.id === "solar-test-fit") {
      frameTestOrbit();
      return;
    }
    const action = e.target.closest("[data-solar-action]")?.dataset.solarAction;
    if (action === "overview") {
      showOverview();
      return;
    }
    if (
      ["lab", "atmosphere", "supernova", "universe", "future"].includes(action)
    )
      goToScene(action === "lab" ? "pyramid" : action);
  });
  root.addEventListener("keydown", (e) => {
    if (
      !e.target.matches(".solar-tabs [data-solar-depth]") ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
    )
      return;
    e.preventDefault();
    const tabs = [...root.querySelectorAll(".solar-tabs [data-solar-depth]")],
      i = tabs.indexOf(e.target),
      next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? tabs.length - 1
            : (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) %
              tabs.length;
    depth = tabs[next].dataset.solarDepth;
    renderDepth();
    tabs[next].focus();
  });
  $("solar-play").onclick = () => {
    if (selected) showOverview();
    running = !running;
    updatePlay();
  };
  $("solar-speed").onchange = (e) => (speed = +e.target.value);
  $("solar-date").onchange = (e) => {
    if (!e.target.value || !e.target.validity.valid) {
      e.target.value = dateFromDays(days);
      return;
    }
    days = daysFromDate(e.target.value);
    running = false;
    updatePlay();
    updatePositions();
    if (selected) selectBody(selected.id);
  };
  const raycaster = new THREE.Raycaster();
  let start = null;
  function pick(e) {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const meshes = [];
    (selected ? focus : overview).traverse((o) => {
      if (
        o.isMesh &&
        (o.userData.body ||
          (depth === "inside" && o.userData.layer !== undefined))
      )
        meshes.push(o);
    });
    return raycaster.intersectObjects(
      meshes.filter((o) => {
        for (let p = o; p; p = p.parent) if (!p.visible) return false;
        return true;
      }),
      false,
    )[0]?.object.userData;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (active) start = [e.clientX, e.clientY];
  });
  canvas.addEventListener("pointerup", (e) => {
    if (
      !active ||
      !start ||
      Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6
    )
      return;
    const id = pick(e);
    start = null;
    if (id?.layer !== undefined) {
      showLayer(id.layer, true);
      return;
    }
    if (id?.body) selectBody(id.body);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (active && !e.buttons)
      canvas.style.cursor = pick(e) ? "pointer" : "grab";
  });
  function placeLabels() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      occupied = [];
    for (const l of [...labels, ...localLabels]) {
      const isLocal = localLabels.includes(l),
        show = selected ? isLocal : !isLocal;
      l.button.hidden = !active || !show || w < 900 || depth === "inside";
      if (l.button.hidden) continue;
      const pos = l.model
          .getWorldPosition(V())
          .add(V(0, l.radius + 2, 0))
          .project(camera),
        x = (pos.x * 0.5 + 0.5) * w,
        y = (-pos.y * 0.5 + 0.5) * h;
      const left = x + 8,
        top = y - 8,
        ww = l.button.offsetWidth || 80,
        hh = 28;
      const desk = root.querySelector(".solar-desk"),
        boundary = w - desk.offsetWidth - 48;
      const visible =
        pos.z < 1 &&
        left > (root.classList.contains("reading-wide") ? 30 : 235) &&
        left + ww < boundary &&
        top > 80 &&
        top < h - 100 &&
        !occupied.some(
          ([a, b, c, d]) =>
            left < c && left + ww > a && top < d && top + hh > b,
        );
      l.button.hidden = !visible;
      if (visible) {
        l.button.style.left = left + "px";
        l.button.style.top = top + "px";
        occupied.push([left - 6, top - 6, left + ww + 6, top + hh + 6]);
      }
    }
  }
  function applyTheme() {
    const light = document.documentElement.dataset.theme === "light";
    for (const path of orbitLines) {
      path.material.color.set(light ? 0x688286 : 0x8796a8);
      path.material.opacity = light ? 0.3 : 0.2;
    }
    stars.material.color.set(light ? 0x7a8e98 : 0xbbcfe1);
    stars.material.opacity = light ? 0.22 : 0.55;
    for (const b of belts) {
      b.material.color.set(light ? 0x7e7669 : 0xa69780);
      b.material.opacity = light ? 0.28 : 0.32;
    }
    for (const material of rims)
      material.uniforms.strength.value = light ? 0.12 : 0.3;
    for (const container of [overview, focus])
      container.traverse((o) => {
        if (o.userData.halo) {
          o.userData.halo.material.blending = light
            ? THREE.NormalBlending
            : THREE.AdditiveBlending;
          o.userData.halo.material.opacity = light ? 0.16 : 0.24;
          o.userData.halo.material.needsUpdate = true;
        }
      });
  }
  document.addEventListener("themechange", applyTheme);
  updatePositions();
  overviewInfo();
  applyTheme();
  return {
    setActive(value) {
      orbitPlaying = false;
      active = value;
      root.hidden = !value;
      if (value) {
        running = false;
        updatePlay();
        showOverview(true);
      } else {
        running = false;
        updatePlay();
      }
    },
    pause() {
      orbitPlaying = false;
      running = false;
      updatePlay();
    },
    selectBody,
    reset() {
      selected ? selectBody(selected.id) : showOverview();
    },
    overview: showOverview,
    update(dt) {
      if (!active) return;
      if (canvas.clientWidth < 900 && camera.view?.enabled)
        camera.clearViewOffset();
      if (canvas.clientWidth >= 900) {
        if (selected) {
          const w = canvas.clientWidth,
            h = canvas.clientHeight,
            left = root.classList.contains("reading-wide") ? 30 : 250,
            right = w - root.querySelector(".solar-desk").offsetWidth - 48,
            offset = w / 2 - (left + right) / 2;
          if (!camera.view?.enabled || camera.view.offsetX !== offset)
            camera.setViewOffset(w, h, offset, 0, w, h);
        } else if (camera.view?.enabled) camera.clearViewOffset();
      }
      if (running) {
        days += dt * speed;
        if (days > daysFromDate("2049-12-31")) {
          days = daysFromDate("2049-12-31");
          running = false;
          updatePlay();
        }
        updatePositions();
      }
      (selected ? focus : overview).traverse((o) => {
        if (o.userData.sphere && depth !== "inside") {
          o.userData.sphere.rotation.y += dt * 0.045;
          if (o.userData.sphere.material.uniforms?.time)
            o.userData.sphere.material.uniforms.time.value += dt;
        }
        if (o.userData.clouds) o.userData.clouds.rotation.y += dt * 0.05;
      });
      if (selected && depth === "physics" && orbitPlaying) {
        orbitPhase = (orbitPhase + dt / 20) % 1;
        updateTestOrbit();
      }
      placeLabels();
      uiClock += dt;
      if (uiClock > 0.3) {
        uiClock = 0;
        $("solar-date").value = dateFromDays(days);
      }
    },
    read() {
      return {
        selectedBody: selected?.id || null,
        depth,
        testOrbit:
          selected && depth === "physics"
            ? {
                phase: orbitPhase,
                playing: orbitPlaying,
                elapsedSeconds:
                  orbitPhase * bodyPhysics(selected, altitude).period * 3600,
                displaySecondsPerOrbit: 20,
              }
            : null,
        interiorView: { separation: layerSpread, isolated: isolateLayer },
        interiorLayer:
          selected && depth === "inside"
            ? INTERIORS[selected.id].layers[selectedLayer].name
            : null,
        albedo,
        energyBalance:
          selected && selected.id !== "sun"
            ? energyBalance(
                Math.hypot(
                  ...physicalPoint(
                    selected.parent ? BODY_MAP[selected.parent] : selected,
                  ),
                ),
                albedo,
              )
            : null,
        date: dateFromDays(days),
        running,
        model: "JPL approximate planets; illustrative moons and dwarf planets",
        altitudeKm: altitude,
        calculated: selected ? bodyPhysics(selected, altitude) : null,
        cameraDistance: camera.position.distanceTo(controls.target),
      };
    },
  };
}
