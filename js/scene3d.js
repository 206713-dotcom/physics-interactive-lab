import { apparatusBounds, frameApparatus, frameOrbit, diagramLabelVisible } from './scene-framing.js';
import { sceneLabelAllowed } from './study-policy.js';
import { wavelengthRGB } from './diagram-theme.js';
/** Real WebGL scenes. Geometry follows the same state as graphs and the 2D view.
 * No physics is integrated here. Pointer/keyboard camera controls are visual only. */
import * as T from "../vendor/three.module.min.js";
import { createAdvancedScene } from "./scene-advanced.js";
import { ADVANCED_IDS } from "./physics-advanced.js";
import {
  createCurriculumScene,
  CURRICULUM_BUILDERS,
} from "./scene-curriculum.js";
import { setPath, createSceneKit } from "./scene-kit.js";
import { roundedBox, studioEnvironment, studioGrid } from "./scene-finish.js";
import { createDetailedMechanics } from "./scene-precision.js";
import { atmosphereMaterial, cloudShell, surfaceMaterial } from "../atlas/visual-detail.js";
import { orbitalDisplayReference, orbitalDisplayExtent } from "./orbital-reference.js";
import { createRefractionApparatus } from "./scene-optical-bench.js";
import { createWaveBench } from "./scene-wave-bench.js";
import { createRCBench } from "./scene-rc-bench.js";
import { createCollisionBench } from "./scene-motion-benches.js";
import { createProjectileBench } from "./scene-projectile-bench.js";
import { centralRadius, orbitAcceleration } from "./physics.js";
import {
  fieldLines,
  fieldAt,
  interferenceAt,
} from "./physics-extra.js";
const CYAN = 0x63efda,
  GOLD = 0xffc778,
  BLUE = 0x7baeff;
function material(color, extra = {}) {
  return new T.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.22,
    envMapIntensity: 0.6,
    ...extra,
  });
}
function sphere(r, color) {
  const m = new T.Mesh(new T.SphereGeometry(r, 32, 20), material(color));
  m.castShadow = true;
  return m;
}
function box(x, y, z, color) {
  const m = new T.Mesh(roundedBox(x, y, z), material(color));
  m.castShadow = true;
  return m;
}
function beam(points, color, opacity = 1) {
  const g = new T.BufferGeometry().setFromPoints(
    points.map((p) => new T.Vector3(...p)),
  );
  return new T.Line(
    g,
    new T.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
}
function updateLine(line, points) {
  setPath(line, points);
}
function label(value, color = "#a9c8d9") {
  const canvas = document.createElement("canvas");
  const word = value.length > 2;
  canvas.height = 128;
  canvas.width = word ? 320 : 128;
  const c = canvas.getContext("2d");
  c.beginPath();
  c.roundRect(20, 20, canvas.width-40, 88, 24);
  c.fillStyle = "#0a2035";
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.stroke();
  c.font = word ? "600 48px Segoe UI,sans-serif" : "italic 66px Georgia,serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(value, canvas.width/2, 61, canvas.width-55);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  const sprite = new T.Sprite(
    new T.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sprite.scale.set(word ? 1.18 : 0.64, word ? 0.472 : 0.64, 1);
  sprite.userData.role = "label";
  sprite.userData.text = value;
  return sprite;
}

function makeOrbitBackdrop() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const context = canvas.getContext("2d");
  const light = context.createRadialGradient(225, 145, 0, 225, 145, 310);
  light.addColorStop(0, "#182f51");
  light.addColorStop(0.46, "#0d1b33");
  light.addColorStop(1, "#050910");
  context.fillStyle = light;
  context.fillRect(0, 0, 512, 320);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

function buildOrbitalSatellite(group) {
  function part(width, height, depth, color, x, y, z) {
    const mesh = box(width, height, depth, color);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  const bus = part(0.28, 0.22, 0.33, 0xd6a44f, 0, 0, 0);
  part(0.255, 0.035, 0.3, 0xd5e3ec, 0, 0.113, 0);
  part(0.17, 0.13, 0.04, 0x142843, 0, 0, 0.175);
  part(0.015, 0.29, 0.015, 0xe9f1f3, 0.09, 0.18, -0.08);
  const dish = new T.Mesh(new T.SphereGeometry(.112,24,12,0,Math.PI*2,0,Math.PI/2),
    material(0xd9e7f5,{metalness:.48,roughness:.25,side:T.DoubleSide}));
  dish.scale.y=.29;
  dish.rotation.z=Math.PI*.8;
  dish.position.set(-.07,.18,-.047);
  group.add(dish);
  for (const x of [-.141,.141])
    for (let i=0;i<4;i++) part(.013,.125,.018,0x344560,x,.015,-.09+.055*i);
  for (const side of [-1, 1]) {
    part(0.28, 0.025, 0.048, 0x8395ac, side * 0.19, 0, 0);
    part(0.49, 0.026, 0.34, 0x98b7d5, side * 0.44, 0, 0);
    for (let column = 0; column < 4; column++) {
      for (const row of [-1, 1]) {
        const cell = part(0.107, 0.011, 0.143, column % 2 ? 0x336cbe : 0x245498,
          side * (0.27 + column * 0.113), 0.015, row * 0.077);
        cell.material.emissive.setHex(0x173d74);
        cell.material.emissiveIntensity = 0.34;
      }
    }
  }
  return bus;
}

export class SceneView {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.setAttribute("aria-busy", "true");
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x080f1b);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene = new T.Scene();
    // A quiet studio backdrop adds depth without adding anything to the model.
    const backdrop=document.createElement('canvas');backdrop.width=backdrop.height=512;
    const backdropContext=backdrop.getContext('2d'),backdropPaint=backdropContext.createRadialGradient(256,180,0,256,230,400);
    backdropPaint.addColorStop(0,'#31586b');
    backdropPaint.addColorStop(.47,'#18394f');
    backdropPaint.addColorStop(1,'#071522');
    backdropContext.fillStyle=backdropPaint;backdropContext.fillRect(0,0,512,512);
    this.studioBackdrop=new T.CanvasTexture(backdrop);this.studioBackdrop.colorSpace=T.SRGBColorSpace;
    this.scene.fog = new T.FogExp2(0x080f1b, 0.018);
    this.environmentTarget = studioEnvironment(this.renderer);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.9;
    this.camera = new T.PerspectiveCamera(38, 1, 0.05, 200);
    this.target = new T.Vector3(0, 1, 0);
    this.azimuth = -0.38;
    this.polar = 1.05;
    this.radius = 15;
    this.ambient = new T.HemisphereLight(0xd5eaf8, 0x182938, 0.88);
    this.scene.add(this.ambient);
    const key = new T.DirectionalLight(0xffefde, 2.6);
    key.position.set(-4, 9, 6);
    this.keyLight = key;
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.00015;
    key.shadow.radius = 3;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    this.scene.add(key);
    const rim = new T.PointLight(0x8acfea, 26, 25);
    rim.position.set(4, 5, -4);
    this.rimLight = rim;
    this.scene.add(rim);
    this.fillLight = new T.DirectionalLight(0x91b4d4, 0.75);
    this.fillLight.position.set(6, 3, 2);
    this.scene.add(this.fillLight);
    this.root = new T.Group();
    this.scene.add(this.root);
    this.addEnvironment();
    this.bindCamera();
  }
  addEnvironment() {
    const floor = new T.Mesh(
      new T.PlaneGeometry(200, 200),
      new T.ShadowMaterial({ color: 0x020b15, opacity: 0.42, depthWrite: false }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.82;
    floor.receiveShadow = true;
    // Catch shadows without an opaque horizon cutting across the apparatus.
    floor.renderOrder = -1;
    this.scene.add(floor);
    this.floor = floor;
    const grid = studioGrid();
    grid.position.y = -0.8;
    grid.material.transparent = true;
    grid.material.opacity = 0.23;
    this.scene.add(grid);
    this.grid = grid;
    const points = [];
    for (let i = 0; i < 650; i++) {
      const r = 27 + (i % 13),
        a = i * 2.39996,
        y = 1 - (2 * (i + 0.5)) / 650;
      const ring = Math.sqrt(1 - y * y);
      points.push(r * ring * Math.cos(a), 1 + r * y, r * ring * Math.sin(a));
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(points, 3));
    this.stars = new T.Points(
        g,
        new T.PointsMaterial({
          color: 0x83afc3,
          size: 0.055,
          transparent: true,
          opacity: 0.7,
        }),
      );
    this.scene.add(this.stars);
  }
  bindCamera() {
    const c = this.canvas;
    this.handlers = {};
    let down = null;
    const pointer = (e) => {
      const rect = c.getBoundingClientRect();
      return new T.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((e.clientY - rect.top) / rect.height) * 2,
      );
    };
    this.handlers.pointerdown = (e) => {
      if (e.button !== 0) return;
      this.cameraGoal = null;
      const handle = this.curriculum?.interaction?.pick(
        pointer(e),
        this.camera,
      );
      if (handle) {
        e.preventDefault();
        this.editingHandle = true;
        this.curriculum.interaction.begin(handle);
        c.setPointerCapture(e.pointerId);
        c.classList.add("editing-vector");
        this.onEditStart?.();
        return;
      }
      down = [e.clientX, e.clientY];
      c.setPointerCapture(e.pointerId);
      c.classList.add("dragging");
    };
    this.handlers.pointermove = (e) => {
      if (this.editingHandle) {
        const patch = this.curriculum?.interaction?.move(
          pointer(e),
          this.camera,
        );
        if (patch) this.onParameterEdit?.(patch);
        return;
      }
      if (!down) {
        c.classList.toggle(
          "over-handle",
          !!this.curriculum?.interaction?.pick(pointer(e), this.camera),
        );
        return;
      }
      const goal = this.cameraGoal || { azimuth: this.azimuth, polar: this.polar, radius: this.radius };
      goal.azimuth -= (e.clientX - down[0]) * 0.007;
      goal.polar = Math.max(
        0.15,
        Math.min(Math.PI - 0.15, goal.polar + (e.clientY - down[1]) * 0.006),
      );
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) Object.assign(this, goal);
      else this.cameraGoal = goal;
      down = [e.clientX, e.clientY];
    };
    this.handlers.pointerup = () => {
      if (this.editingHandle) {
        this.editingHandle = false;
        this.curriculum?.interaction?.end();
        this.onEditEnd?.();
      }
      c.classList.remove("editing-vector");
      down = null;
      c.classList.remove("dragging");
    };
    this.handlers.wheel = (e) => {
      e.preventDefault();
      const goal = this.cameraGoal || { azimuth: this.azimuth, polar: this.polar, radius: this.radius };
      goal.radius = Math.max(
        5,
        Math.min(34, goal.radius * Math.exp(e.deltaY * 0.001)),
      );
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) Object.assign(this, goal);
      else this.cameraGoal = goal;
    };
    this.handlers.keydown = (e) => {
      const k = e.key;
      this.cameraGoal = null;
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "-",
          "0",
        ].includes(k)
      )
        e.preventDefault();
      if (k === "ArrowLeft") this.azimuth -= 0.12;
      if (k === "ArrowRight") this.azimuth += 0.12;
      if (k === "ArrowUp") this.polar = Math.max(0.15, this.polar - 0.1);
      if (k === "ArrowDown")
        this.polar = Math.min(Math.PI - 0.15, this.polar + 0.1);
      if (k === "+") this.radius = Math.max(5, this.radius - 1);
      if (k === "-") this.radius = Math.min(34, this.radius + 1);
      if (k === "0") this.home();
    };
    for (const [name, fn] of Object.entries(this.handlers))
      c.addEventListener(name, fn, { passive: false });
    c.addEventListener("pointercancel", this.handlers.pointerup);
    c.addEventListener("lostpointercapture", this.handlers.pointerup);
  }
  home() {
    this.cameraGoal = null;
    this.azimuth = this.homeAzimuth ?? -0.38;
    this.polar = this.homePolar ?? 1.05;
    this.radius = this.homeRadius || 15;
  }
  cameraView(name) {
    const previous = {
      azimuth: this.azimuth,
      polar: this.polar,
      radius: this.radius,
    };
    this.home();
    if (name === "front") {
      this.azimuth = 0;
      this.polar = Math.PI / 2;
    }
    if (name === "above") {
      // A near-edge-on top view hides a vertical drawing board. Use an
      // isometric preset for planar apparatus while retaining free rotation.
      const planar=this.type==='vectors' || this.precision?.planar || this.curriculum?.planar;
      this.azimuth = planar ? -0.55 : 0;
      this.polar = planar ? 1.02 : 0.035;
    }
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const delta = Math.atan2(
        Math.sin(this.azimuth - previous.azimuth),
        Math.cos(this.azimuth - previous.azimuth),
      );
      this.cameraGoal = {
        azimuth: previous.azimuth + delta,
        polar: this.polar,
        radius: this.radius,
      };
      Object.assign(this, previous);
    }
  }
  clear() {
    this.advanced = null;
    this.curriculum = null;
    this.precision = null;
    this.trackedLabels = null;
    this.root.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) {
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.map?.dispose();
          m.dispose();
        }
      }
    });
    this.root.clear();
    this.objects = {};
  }
  build(type, p, studyMode) {
    const newModel = this.type !== type;
    this.clear();
    this.framingBounds = null;
    this.pendingFraming = null;
    this.orbitComposition = null;
    this.orbitNewModel = type === 'gravity' && newModel;
    this.type = type;
    this.key = JSON.stringify(p);
    const space = ["gravity", "earthmoon", "solarsystem", "stars", "binary", "threebody", "universe"].includes(type);
    this.scene.background = space ? (this.orbitBackdrop ??= makeOrbitBackdrop()) : this.studioBackdrop;
    this.scene.fog.color.set(space?0x080f1b:0x10283c);
    // Orbital lighting is illustrative, not a simulated day/night cycle.
    this.ambient.intensity = { gravity: 0.36, earthmoon: 0.38, solarsystem: 0.65 }[type] ?? 1.25;
    this.keyLight.intensity = type === "solarsystem" ? 0 : 3.2;
    this.keyLight.position.set(-4, 9, type === "gravity" ? 3 : 6);
    if (type === "gravity") this.keyLight.position.set(-9, 7, 2);
    if (type === "earthmoon") this.keyLight.position.set(-10, 0, 0);
    this.rimLight.intensity = space ? 0 : 26;
    this.fillLight.intensity = type === 'gravity' ? 0.45 : space ? 0.05 : 1.15;
    this.scene.environmentIntensity = type === 'gravity' ? 0.3 : space ? 0.08 : 0.9;
    this.stars.visible = space;
    const r = this.root,
      o = this.objects;
    this.floor.position.y =
      { gravity: -3.5, fields: -4.6 }[type] ??
      -0.38;
    this.grid.position.y = this.floor.position.y + 0.02;
    // A spatial reference in the orbital plane, not a ground beneath the planet.
    this.floor.visible = !space && type !== "vectors";
    this.grid.visible = !space && type !== "vectors";
    this.grid.position.y = type === "gravity" ? 1 : this.grid.position.y;
    this.grid.material.opacity = 0.23;
    const add = (name, mesh, pos) => {
      o[name] = mesh;
      if (pos) mesh.position.set(...pos);
      r.add(mesh);
      return mesh;
    };
    if (Object.hasOwn(CURRICULUM_BUILDERS, type)) {
      if (type === "buoyancy") {
        this.target.set(0, 2.15, 0);
        this.homeRadius = 10.4;
        this.homePolar = 1.24;
        this.homeAzimuth = -0.25;
        if (newModel) this.home();
      }
      this.curriculum = createCurriculumScene(type, p, r);
      if (!this.curriculum.camera && !space) this.pendingFraming = { newModel };
      if (this.curriculum.camera) {
        const camera = this.curriculum.camera;
        this.target.set(...camera.target);
        this.homeRadius = camera.radius;
        this.homePolar = camera.polar;
        this.homeAzimuth = camera.azimuth;
        if (newModel) this.home();
      }
      return;
    }
    if (["spring", "pendulum", "refraction", "waves", "circuits", "projectile", "collisions"].includes(type)) {
      this.precision = type === "refraction" ? createRefractionApparatus(p, r, new T.Color().setRGB(...wavelengthRGB(p.wavelength * 1e9), T.SRGBColorSpace), { studyMode })
        : type === "waves" ? createWaveBench(p, r, { studyMode })
        : type === "circuits" ? createRCBench(p, r)
        : type === "projectile" ? createProjectileBench(p, r)
        : type === "collisions" ? createCollisionBench(p, r)
        : createDetailedMechanics(type, p, r, { studyMode });
      this.target.set(...this.precision.target);
      this.homeRadius = this.precision.radius;
      this.homePolar = this.precision.polar ?? (type === "spring" ? 1.05 : 1.48);
      this.homeAzimuth = this.precision.azimuth ?? (type === "spring" ? -0.25 : -0.1);
      if (newModel) this.home();
      return;
    }
    if (ADVANCED_IDS.includes(type)) {
      this.ambient.intensity = type === "doublependulum" ? 1.4 : 0.35;
      this.advanced = createAdvancedScene(type, p, this);
      return;
    }
    if (type === "gravity") {
      const earth = { id: "earth", color: 0x4388bf };
      const geometry = new T.SphereGeometry(1, 96, 64);
      const planet = add("planet", new T.Group(), [0, 1, 0]);
      const surface = new T.Mesh(geometry, surfaceMaterial(earth, null));
      surface.rotation.z = 0.41;
      planet.add(surface);
      const earthMap = new T.TextureLoader().load(new URL("../atlas/assets/earth-blue-marble.png", import.meta.url).href, (texture) => {
        if (this.objects.planet !== planet) {
          texture.dispose();
          return;
        }
        surface.material.map = texture;
        surface.material.color.setHex(0xffffff);
        surface.material.needsUpdate = true;
      }, undefined, () => earthMap.dispose());
      earthMap.colorSpace = T.SRGBColorSpace;
      earthMap.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      const clouds = cloudShell(1.012);
      clouds.material.uniforms.opacity.value = .19;
      clouds.rotation.z = surface.rotation.z;
      planet.add(clouds);
      planet.add(new T.Mesh(new T.SphereGeometry(1.045, 96, 64), atmosphereMaterial(0x6bafff, 0.64)));
      const reference = add("reference", new T.Line(new T.BufferGeometry(), new T.LineDashedMaterial({
        color: 0x7f9ebd, transparent: true, opacity: 0.72, dashSize: 0.09, gapSize: 0.065, toneMapped: false,
      })));
      reference.frustumCulled = false;
      o.orbitGuide = orbitalDisplayReference(p);
      o.distanceRings = [1,2].map(multiple => {
        const points=Array.from({length:193},(_,i)=>{
          const a=i/192*Math.PI*2;
          return new T.Vector3(Math.cos(a),0,Math.sin(a));
        });
        const ring=new T.Line(new T.BufferGeometry().setFromPoints(points),
          new T.LineBasicMaterial({color:0x729cc7,transparent:true,opacity:multiple===1?.24:.34,toneMapped:false,depthWrite:false}));
        ring.position.y=.985;
        r.add(ring);
        return ring;
      });
      add("launch",new T.Mesh(new T.SphereGeometry(.047,16,12),
        new T.MeshBasicMaterial({color:0xb2d8fa})));
      add("launchLabel",label("Launch", "#b2d8fa"));
      const satellite = add("satellite", new T.Group());
      o.satelliteBody = buildOrbitalSatellite(satellite);
      add("radiusLabel", label("r", "#d4e6ef"));
      add("velocityLabel", label("v", "#ffcc84"));
      add("accelerationLabel", label("a", "#ff9d91"));
      add(
        "trail",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          CYAN,
          0.9,
        ),
      );
      add(
        "separation",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          0x9cbacb,
          0.65,
        ),
      );
      o.velocity = new T.ArrowHelper(
        new T.Vector3(0, 0, 1),
        new T.Vector3(),
        1,
        GOLD,
        0.22,
        0.1,
      );
      r.add(o.velocity);
      o.acceleration = new T.ArrowHelper(
        new T.Vector3(-1, 0, 0),
        new T.Vector3(),
        1,
        0xff9d91,
        0.2,
        0.1,
      );
      r.add(o.acceleration);
      // Reuse typed buffers for a fading history instead of rebuilding geometry
      // every frame. Every point is integrated, including the current endpoint.
      const trailGeometry = new T.BufferGeometry();
      trailGeometry.setAttribute(
        "position",
        new T.BufferAttribute(new Float32Array(1201 * 3), 3),
      );
      trailGeometry.setAttribute(
        "color",
        new T.BufferAttribute(new Float32Array(1201 * 3), 3),
      );
      trailGeometry.setDrawRange(0, 0);
      o.trail.geometry.dispose();
      o.trail.geometry = trailGeometry;
      o.trail.material.dispose();
      o.trail.material = new T.LineBasicMaterial({ vertexColors: true });
      o.trail.frustumCulled = false;
    } else if (type === "interference") {
      const [red, green, blue] = wavelengthRGB(p.wavelength * 1e9);
      add("screenFrame", box(0.1, 3.1, 4.2, 0x24465a), [3, 1.6, 0]);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 8;
      const ctx = canvas.getContext("2d");
      for (let i = 0; i < 512; i++) {
        const intensity = interferenceAt((i / 511 - 0.5) * 0.04, p).intensity,
          light = 255 * Math.sqrt(intensity);
        ctx.fillStyle = `rgb(${red * light},${green * light},${blue * light})`;
        ctx.fillRect(i, 0, 1, 8);
      }
      const map = new T.CanvasTexture(canvas);
      map.colorSpace = T.SRGBColorSpace;
      const screen = add(
        "screen",
        new T.Mesh(
          new T.PlaneGeometry(4, 2.8),
          new T.MeshBasicMaterial({
            map,
            side: T.DoubleSide,
            toneMapped: false,
          }),
        ),
        [2.93, 1.6, 0],
      );
      screen.rotation.y = -Math.PI / 2;
      add("slitBoard", box(0.17, 3.1, 0.76, 0x355d75), [-2.6, 1.6, 0]);
      for (const side of [-1, 1]) {
        add("slitWing" + side, box(0.17, 3.1, 1.15, 0x355d75), [-2.6, 1.6, side * 1.10]);
      }
      const kit = createSceneKit(r);
      o.interferenceFronts = [];
      for (const [z, ink] of [[-0.45, CYAN], [0.45, 0xc3a6ff]]) {
        kit.ball(0.074, ink, [-2.48, 1.6, z], { emissive: ink, emissiveIntensity: 0.32 });
        for (let i = 0; i < 9; i++) o.interferenceFronts.push({ line: kit.line([], ink, 0.80), i, z });
      }
    } else if (type === "fields") {
      const lines = fieldLines(p);
      for (const l of lines)
        for (const phi of [0, Math.PI / 3, (2 * Math.PI) / 3])
          r.add(
            beam(
              l.points.map(([x, y]) => [
                x * 1.4,
                1 + y * Math.cos(phi) * 1.4,
                y * Math.sin(phi) * 1.4,
              ]),
              l.sign > 0 ? CYAN : 0xff8aaa,
              0.35,
            ),
          );
      for (const [idx, x, q] of [
        [1, -p.separation / 2, p.q1],
        [2, p.separation / 2, p.q2],
      ])
        if (q !== 0) {
          const charge = add("q" + idx, sphere(0.2, q > 0 ? 0xff8aaa : BLUE), [
            x * 1.4,
            1,
            0,
          ]);
          const ring = new T.Mesh(
            new T.TorusGeometry(0.3, 0.008, 6, 70),
            new T.MeshBasicMaterial({
              color: q > 0 ? 0xff8aaa : BLUE,
              transparent: true,
              opacity: 0.5,
            }),
          );
          charge.add(ring);
        }
      add("probe", sphere(0.1, 0xffffff), [
        p.probeX * 1.4,
        1 + p.probeY * 1.4,
        0,
      ]);
      o.fieldArrow = new T.ArrowHelper(
        new T.Vector3(1, 0, 0),
        new T.Vector3(),
        1,
        GOLD,
        0.16,
        0.08,
      );
      r.add(o.fieldArrow);
    }
  }
  update(lab) {
    const p = lab.params,
      s = lab.state,
      type = lab.type;
    const key = JSON.stringify(p);
    if (
      this.type !== type ||
      (this.key !== key && !this.curriculum?.liveParams)
    )
      this.build(type, p, lab.studyMode);
    else this.key = key;
    const o = this.objects;
    // Restore label visibility before each model applies its own conditions
    // (for example a velocity label disappears when its vector is zero).
    this.root.traverse((node) => {
      if (node.userData.role === "label") node.visible = true;
    });
    if (this.curriculum) this.curriculum.update(lab);
    else if (this.precision) this.precision.update(lab);
    else if (this.advanced) this.advanced.update(lab);
    else if (type === "gravity") {
      const extent=orbitalDisplayExtent(p,s,lab.trail);
      const sc = 5 / extent,
        rad = centralRadius(p) * sc;
      const guide=o.orbitGuide.points;
      const stop=o.orbitGuide.closed ? -1 : guide.findIndex(([x,y])=>Math.hypot(x,y)>extent*1.23);
      const count=stop===-1?guide.length:stop;
      if (o.referenceScale !== sc || o.referenceCount !== count) {
        o.visibleGuide=guide.slice(0,count);
        setPath(o.reference, o.visibleGuide.map(([x, y]) => [x * sc, 1, -y * sc]));
        o.reference.computeLineDistances();
        o.referenceScale = sc;
        o.referenceCount = count;
      }
      this.orbitComposition = { reference: lab.showTrail ? o.visibleGuide : [], trail: lab.showTrail ? lab.trail || [] : [], state: s, scale: sc, radius: rad };
      o.distanceRings.forEach((ring,i)=>{
        const distance=p.distance*(i+1);
        ring.scale.setScalar(distance*sc);
        ring.visible=distance<=extent*1.06;
      });
      o.launch.position.set(p.distance*sc,1,0);
      o.launchLabel.position.set(p.distance*sc,1.3,0);
      o.launchLabel.visible=Math.hypot(s.x-p.distance,s.y)>.16*p.distance;
      o.reference.visible = lab.showTrail;
      o.planet.scale.setScalar(rad);
      o.satellite.position.set(s.x * sc, 1, -s.y * sc);
      const speed = Math.hypot(s.vx, s.vy),
        direction = new T.Vector3(s.vx, 0, -s.vy);
      if (speed > 0)
        o.satellite.quaternion.setFromUnitVectors(
          new T.Vector3(0, 0, 1),
          direction.clone().normalize(),
        );
      o.satelliteBody.material.emissive.setHex(s.collided ? 0x9b271d : 0);
      if (o.trailTime !== s.t || o.trailScale !== sc) {
        const points = [...(lab.trail || []).slice(-1200), s],
          g = o.trail.geometry;
        const position = g.attributes.position,
          color = g.attributes.color;
        const tail = new T.Color(0x306275),
          head = new T.Color(CYAN),
          shade = new T.Color();
        points.forEach((q, i) => {
          position.setXYZ(i, q.x * sc, 1, -q.y * sc);
          shade.copy(tail).lerp(head, (i + 1) / points.length);
          color.setXYZ(i, shade.r, shade.g, shade.b);
        });
        position.needsUpdate = true;
        color.needsUpdate = true;
        g.setDrawRange(0, points.length);
        o.trailTime = s.t;
        o.trailScale = sc;
      }
      o.trail.visible = lab.showTrail;
      updateLine(o.separation, [
        [0, 1, 0],
        [s.x * sc, 1, -s.y * sc],
      ]);
      o.velocity.position.copy(o.satellite.position);
      o.velocity.setDirection(
        speed > 0 ? direction.normalize() : new T.Vector3(0, 0, 1),
      );
      o.velocity.setLength(
        Math.max(0.001, Math.min(2, speed / 6000)),
        0.16,
        0.08,
      );
      o.velocity.visible = lab.vectors && speed > 1e-5 && !s.collided;
      const a = orbitAcceleration(s, p),
        aVector = new T.Vector3(a.x, 0, -a.y).normalize();
      o.acceleration.position.copy(o.satellite.position);
      o.acceleration.setDirection(aVector);
      // A separate, labelled display scale: 0.38 scene units per m/s².
      o.acceleration.setLength(
        Math.max(0.001, Math.min(2, Math.hypot(a.x, a.y) * 0.38)),
        0.16,
        0.08,
      );
      o.acceleration.visible = lab.vectors && !s.collided;
      o.velocityLabel.position
        .copy(o.satellite.position)
        .addScaledVector(direction, Math.min(2, speed / 6000) + 0.28);
      o.velocityLabel.position.y += 0.18;
      o.accelerationLabel.position
        .copy(o.satellite.position)
        .addScaledVector(
          aVector,
          Math.min(2, Math.hypot(a.x, a.y) * 0.38) + 0.25,
        );
      o.accelerationLabel.position.y += 0.18;
      o.velocityLabel.visible = o.velocity.visible;
      o.accelerationLabel.visible = o.acceleration.visible;
      o.radiusLabel.position.copy(o.satellite.position).multiplyScalar(0.5);
      o.radiusLabel.position.y = 1.16;
      o.radiusLabel.visible = Math.hypot(s.x, s.y) * sc > rad + 0.8;
    } else if (type === "interference") {
      for (const { line, i, z } of o.interferenceFronts) {
        const radius = ((s.t * 0.28 + i / 9) % 1) * 5.4;
        const first = -Math.asin(Math.min(1, (2.0 + z) / Math.max(1e-6, radius)));
        const last = Math.asin(Math.min(1, (2.0 - z) / Math.max(1e-6, radius)));
        setPath(line, Array.from({ length: 29 }, (_, j) => {
          const angle = first + (last - first) * j / 28;
          return [-2.48 + radius * Math.cos(angle), 1.6, z + radius * Math.sin(angle)];
        }));
      }
    } else if (type === "fields") {
      const f = fieldAt(p.probeX, p.probeY, p);
      o.fieldArrow.position.copy(o.probe.position);
      o.fieldArrow.visible = lab.vectors && f.valid && f.magnitude > 1e-8;
      if (o.fieldArrow.visible)
        o.fieldArrow.setDirection(new T.Vector3(f.ex, f.ey, 0).normalize());
    }
    if (!this.curriculum && !this.precision && !this.trackedLabels) {
      const specs =
        {
          spring: [["block", "Mass", [0, 0.85, 0]]],
          pendulum: [["bob", "Bob", [0, 0.65, 0]]],
          projectile: [["ball", "Projectile", [0, 0.6, 0]]],
          collisions: [
            ["a", "Cart A", [0, 0.65, 0]],
            ["b", "Cart B", [0, 0.65, 0]],
          ],
          waves: [["probe", "Probe", [0, 0.65, 0]]],
          interference: [
            ["slitBoard", "Two coherent slits", [0, 2, 0]],
            ["screen", "Fringe screen", [0, 2, 0]],
          ],
          fields: [["probe", "Field probe", [0, 0.7, 0]]],
        }[type] || [];
      const kit = createSceneKit(this.root);
      this.trackedLabels = specs
        .filter(([key]) => o[key])
        .map(([key, text, offset]) => ({
          mesh: o[key],
          offset,
          label: kit.label(text, [0, 0, 0], "#cfe6ef", 1.8),
        }));
    }
    for (const item of this.trackedLabels || [])
      item.label.position
        .copy(item.mesh.position)
        .add(new T.Vector3(...item.offset));
    this.root.traverse(node => {
      if (node.userData.role === 'label' && (lab.showLabels === false ||
          !sceneLabelAllowed(lab.type,lab.studyMode,node.userData.text) ||
          (lab.cleanPresentation && !diagramLabelVisible(node.userData.text,node.userData.labelWidth)))) node.visible = false;
    });
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    if (this.w !== w || this.h !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.w = w;
      this.h = h;
    }
    // Preserve room for the orbit on narrow screens; manual zoom remains a
    // camera-only control, and never changes distance or any physical state.
    if (this.cameraGoal) {
      const factor =
        1 -
        Math.exp(
          -12 *
            Math.min(
              0.05,
              (performance.now() -
                (this.lastCameraFrame || performance.now() - 16)) /
                1000,
            ),
        );
      for (const field of ["azimuth", "polar", "radius"])
        this[field] += (this.cameraGoal[field] - this[field]) * factor;
      if (
        ["azimuth", "polar", "radius"].every(
          (field) => Math.abs(this[field] - this.cameraGoal[field]) < 0.0001,
        )
      ) {
        Object.assign(this, this.cameraGoal);
        this.cameraGoal = null;
      }
    }
    this.lastCameraFrame = performance.now();
    if (this.pendingFraming) {
      this.framingBounds = apparatusBounds(this.root);
      // Keep short component labels clear above the apparatus.
      this.framingBounds.max.y += 0.55;
      this.framingAspect = null;
    }
    if (this.framingBounds && this.framingAspect !== this.camera.aspect) {
      const fit = frameApparatus(this.framingBounds,{aspect:this.camera.aspect}),
        zoom = this.pendingFraming?.newModel ? 1 : this.radius / this.homeRadius;
      this.target.set(...fit.target);
      this.homeRadius=fit.radius;this.homePolar=fit.polar;this.homeAzimuth=fit.azimuth;
      this.radius=fit.radius*(Number.isFinite(zoom)?zoom:1);
      if (this.pendingFraming?.newModel) {this.polar=fit.polar;this.azimuth=fit.azimuth;this.cameraGoal=null;}
      this.framingAspect=this.camera.aspect;
    }
    this.pendingFraming=null;
    if (type === 'gravity' && this.orbitComposition) {
      const { reference, trail, state, scale, radius } = this.orbitComposition;
      const fit = frameOrbit(reference, trail, state, scale, radius, this.camera.aspect),
        zoom=this.orbitNewModel ? 1 : this.radius / (this.homeRadius || fit.radius);
      this.target.set(...fit.target);
      this.homeRadius=fit.radius;this.homePolar=fit.polar;this.homeAzimuth=fit.azimuth;
      this.radius=fit.radius*(Number.isFinite(zoom)?zoom:1);
      if (this.orbitNewModel) {this.home();this.orbitNewModel=false;}
    }
    const cameraRadius =
      this.radius *
      (!this.framingBounds && !this.orbitComposition && (ADVANCED_IDS.includes(type) || this.curriculum || this.precision)
        ? Math.max(1, (this.curriculum?.camera?.fitAspect || this.precision?.fitAspect || (type === "buoyancy" ? 1.05 : type === "lenses" ? 1.55 : 1.35)) / this.camera.aspect)
        : 1);
    this.camera.position.set(
      this.target.x +
        cameraRadius * Math.sin(this.polar) * Math.sin(this.azimuth),
      this.target.y + cameraRadius * Math.cos(this.polar),
      this.target.z +
        cameraRadius * Math.sin(this.polar) * Math.cos(this.azimuth),
    );
    this.camera.lookAt(this.target);
    this.grid.material.uniforms.opacity.value = this.grid.material.opacity;
    this.renderer.render(this.scene, this.camera);
    if (!this.firstFrame) {
      this.firstFrame = true;
      this.canvas.setAttribute("aria-busy", "false");
    }
  }
  dispose() {
    this.clear();
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose?.();
    });
    for (const [name, fn] of Object.entries(this.handlers))
      this.canvas.removeEventListener(name, fn);
    this.canvas.removeEventListener("pointercancel", this.handlers.pointerup);
    this.canvas.removeEventListener(
      "lostpointercapture",
      this.handlers.pointerup,
    );
    this.renderer.dispose();
    this.environmentTarget.dispose();
    this.studioBackdrop.dispose();
    this.orbitBackdrop?.dispose();
    this.renderer.forceContextLoss();
  }
}
