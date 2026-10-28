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
import { cloudShell } from "../atlas/visual-detail.js";
import { orbitalReference } from "./orbital-reference.js";
import { createRefractionApparatus } from "./scene-optical-bench.js";
import { createWaveBench } from "./scene-wave-bench.js";
import { createRCBench } from "./scene-rc-bench.js";
import { centralRadius, orbitAcceleration } from "./physics.js";
import {
  fieldLines,
  fieldAt,
  interferenceAt,
  DEG,
  projectileReference,
} from "./physics-extra.js";
const CYAN = 0x63efda,
  GOLD = 0xffc778,
  BLUE = 0x7baeff;
export function wavelengthRGB(nm) {
  // Approximate visible-spectrum colour; this is not a colourimetry measurement.
  let r = 0,
    g = 0,
    b = 0;
  if (nm < 440) {
    r = (440 - nm) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = (510 - nm) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = (645 - nm) / 65;
  } else r = 1;
  return new T.Color().setRGB(
    Math.max(0, r),
    Math.max(0, g),
    Math.max(0, b),
    T.SRGBColorSpace,
  );
}
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
  canvas.width = 512;
  canvas.height = 96;
  const c = canvas.getContext("2d");
  c.font = "30px Segoe UI,sans-serif";
  c.textAlign = "center";
  c.fillStyle = color;
  c.fillText(value, 256, 55);
  const sprite = new T.Sprite(
    new T.SpriteMaterial({
      map: new T.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(2.5, 0.47, 1);
  sprite.userData.role = "label";
  return sprite;
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
    this.scene.fog = new T.FogExp2(0x080f1b, 0.018);
    this.environmentTarget = studioEnvironment(this.renderer);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.65;
    this.camera = new T.PerspectiveCamera(38, 1, 0.05, 200);
    this.target = new T.Vector3(0, 1, 0);
    this.azimuth = -0.38;
    this.polar = 1.05;
    this.radius = 15;
    this.ambient = new T.HemisphereLight(0xc6deed, 0x142033, 0.8);
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
    const rim = new T.PointLight(0x8acfea, 20, 25);
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
      material(0x101b29, { roughness: 0.95, metalness: 0, envMapIntensity: 0.15 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.82;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floor = floor;
    const grid = studioGrid();
    grid.position.y = -0.8;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
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
      this.azimuth = this.type === "vectors" ? -0.55 : 0;
      this.polar = this.type === "vectors" ? 1.02 : 0.035;
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
  build(type, p) {
    const newModel = this.type !== type;
    this.clear();
    this.type = type;
    this.key = JSON.stringify(p);
    const space = ["gravity", "earthmoon", "solarsystem", "stars", "binary", "threebody", "universe"].includes(type);
    this.ambient.intensity = type === "gravity" ? 0.12 : type === "earthmoon" ? 0.13 : 0.8;
    this.keyLight.intensity = type === "earthmoon" ? 0 : 2.6;
    this.rimLight.intensity = space ? 0 : 20;
    this.fillLight.intensity = space ? 0.05 : 0.75;
    this.scene.environmentIntensity = space ? 0.08 : 0.65;
    this.stars.visible = space;
    const r = this.root,
      o = this.objects;
    this.floor.position.y =
      { gravity: -3.5, fields: -4.6 }[type] ??
      -0.38;
    this.grid.position.y = this.floor.position.y + 0.02;
    // A spatial reference in the orbital plane, not a ground beneath the planet.
    this.floor.visible = !["gravity", "vectors"].includes(type);
    this.grid.visible = !["vectors", "gravity"].includes(type);
    this.grid.position.y = type === "gravity" ? 1 : this.grid.position.y;
    this.grid.material.opacity = 0.3;
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
      return;
    }
    if (["spring", "pendulum", "refraction", "waves", "circuits"].includes(type)) {
      this.precision = type === "refraction" ? createRefractionApparatus(p, r, wavelengthRGB(p.wavelength * 1e9))
        : type === "waves" ? createWaveBench(p, r)
        : type === "circuits" ? createRCBench(p, r)
        : createDetailedMechanics(type, p, r);
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
      const planet = add("planet", sphere(1, 0x398ca8), [0, 1, 0]);
      planet.geometry.dispose();
      planet.geometry = new T.SphereGeometry(1, 64, 48);
      planet.material.dispose();
      const earthMap = new T.TextureLoader().load(new URL("../atlas/assets/earth-blue-marble.png", import.meta.url).href, (texture) => {
        if (this.objects.planet !== planet) { texture.dispose(); return; }
        planet.material.map = texture;
        planet.material.color.setHex(0xffffff);
        planet.material.needsUpdate = true;
      }, undefined, () => earthMap.dispose());
      earthMap.colorSpace = T.SRGBColorSpace;
      earthMap.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      planet.material = new T.MeshStandardMaterial({
        color: 0x356f8a,
        metalness: 0.05,
        roughness: 0.78,
      });
      planet.add(cloudShell(1.012));
      const reference = add("reference", new T.Line(new T.BufferGeometry(), new T.LineDashedMaterial({ color: 0x80b4c7, transparent: true, opacity: 0.35, dashSize: 0.09, gapSize: 0.07 })));
      reference.frustumCulled = false;
      o.referencePoints = orbitalReference(p);
      // Procedural longitude/latitude lines are a coordinate texture, not surface data.
      for (let j = -2; j <= 2; j++) {
        const rr = Math.sqrt(1 - (j * 0.3) ** 2);
        const ring = new T.Mesh(
          new T.TorusGeometry(rr, 0.005, 6, 100),
          new T.MeshBasicMaterial({
            color: 0x78e0df,
            transparent: true,
            opacity: 0.025,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = j * 0.3;
        planet.add(ring);
      }
      for (let j = 0; j < 6; j++) {
        const ring = new T.Mesh(
          new T.TorusGeometry(1.002, 0.004, 6, 100),
          new T.MeshBasicMaterial({
            color: 0x7ac6df,
            transparent: true,
            opacity: 0.02,
          }),
        );
        ring.rotation.y = (j * Math.PI) / 6;
        planet.add(ring);
      }
      const atmosphere = add("atmosphere", sphere(1.06, 0x53d5f7), [0, 1, 0]);
      atmosphere.castShadow = false;
      atmosphere.material.dispose();
      atmosphere.material = new T.ShaderMaterial({
        uniforms: { glowColor: { value: new T.Color(0x54cfee) } },
        vertexShader: `varying vec3 n; varying vec3 eye;
          void main(){vec4 p=modelViewMatrix*vec4(position,1.0);
          n=normalize(normalMatrix*normal);eye=-p.xyz;gl_Position=projectionMatrix*p;}`,
        fragmentShader: `uniform vec3 glowColor; varying vec3 n; varying vec3 eye;
          void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(eye))),2.5);
          gl_FragColor=vec4(glowColor,rim*0.5);}`,
        transparent: true,
        side: T.BackSide,
        depthWrite: false,
        blending: T.AdditiveBlending,
      });
      const satellite = add("satellite", new T.Group());
      satellite.scale.setScalar(1.2);
      const body = box(0.18, 0.2, 0.24, 0xe8c889);
      satellite.add(body);
      o.satelliteBody = body;
      for (const side of [-1, 1]) {
        const panel = box(0.37, 0.025, 0.27, 0x3877b9);
        panel.position.x = side * 0.32;
        satellite.add(panel);
        for (let j = -1; j <= 1; j++) {
          const strip = box(0.004, 0.029, 0.27, 0x90bcdd);
          strip.position.x = side * 0.32 + j * 0.1;
          satellite.add(strip);
        }
      }
      const antenna = box(0.018, 0.24, 0.018, 0xe9f1f3);
      antenna.position.y = 0.2;
      satellite.add(antenna);
      add("radiusLabel", label("r", "#d4e6ef")).scale.set(3.8, 1, 1);
      add("velocityLabel", label("v", "#ffcc84")).scale.set(3.8, 1, 1);
      add("accelerationLabel", label("a", "#ff9d91")).scale.set(3.8, 1, 1);
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
    } else if (type === "projectile") {
      add("ball", sphere(0.12, 0xb7a6ff));
      add(
        "trail",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          0xa69bff,
        ),
      );
      add(
        "reference",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          0x456779,
          0.7,
        ),
      );
      add("launcher", box(0.3, 0.3, 0.5, 0x548c9c));
      o.velocity = new T.ArrowHelper(
        new T.Vector3(1, 1, 0).normalize(),
        new T.Vector3(),
        1,
        GOLD,
        0.2,
        0.1,
      );
      r.add(o.velocity);
    } else if (type === "collisions") {
      add("rail", box(13, 0.13, 1.1, 0x27485a), [0, 0.05, 0]);
      add("a", box(0.8, 0.5, 0.65, CYAN));
      add("b", box(0.8, 0.5, 0.65, GOLD));
      for (let cart of ["a", "b"])
        for (let j = 0; j < 4; j++) {
          const wheel = new T.Mesh(
            new T.CylinderGeometry(0.11, 0.11, 0.09, 16),
            material(0x839aab),
          );
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(j < 2 ? -0.25 : 0.25, -0.27, j % 2 ? -0.37 : 0.37);
          o[cart].add(wheel);
        }
      o.va = new T.ArrowHelper(
        new T.Vector3(1, 0, 0),
        new T.Vector3(),
        1,
        CYAN,
        0.2,
        0.1,
      );
      o.vb = new T.ArrowHelper(
        new T.Vector3(1, 0, 0),
        new T.Vector3(),
        1,
        GOLD,
        0.2,
        0.1,
      );
      r.add(o.va, o.vb);
    } else if (type === "interference") {
      const col = wavelengthRGB(p.wavelength * 1e9);
      o.opticalColor = col;
      add("screenFrame", box(0.1, 3.1, 4.2, 0x24465a), [3, 1.6, 0]);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 8;
      const ctx = canvas.getContext("2d");
      for (let i = 0; i < 512; i++) {
        const intensity = interferenceAt((i / 511 - 0.5) * 0.04, p).intensity,
          b = Math.sqrt(intensity);
        ctx.fillStyle = `rgb(${col.r * 255 * b},${col.g * 255 * b},${col.b * 255 * b})`;
        ctx.fillRect(i, 0, 1, 8);
      }
      const screen = add(
        "screen",
        new T.Mesh(
          new T.PlaneGeometry(4, 2.8),
          new T.MeshBasicMaterial({
            map: new T.CanvasTexture(canvas),
            side: T.DoubleSide,
          }),
        ),
        [2.93, 1.6, 0],
      );
      screen.rotation.y = -Math.PI / 2;
      add("slitBoard", box(0.16, 3.1, 3, 0x223c51), [-2.6, 1.6, 0]);
      for (const z of [-0.45, 0.45]) {
        add("gap" + z, box(0.2, 2, 0.08, col), [-2.7, 1.6, z]);
        const source = sphere(0.07, col);
        source.position.set(-2.45, 1.6, z);
        r.add(source);
      }
      o.rings = [];
      for (let source = 0; source < 2; source++)
        for (let i = 0; i < 7; i++) {
          const ring = new T.Mesh(
            new T.TorusGeometry(0.35, 0.009, 6, 80),
            new T.MeshBasicMaterial({
              color: col,
              transparent: true,
              opacity: 0.28,
            }),
          );
          ring.rotation.y = Math.PI / 2;
          r.add(ring);
          o.rings.push({ ring, i, z: source ? -0.45 : 0.45 });
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
      this.build(type, p);
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
      let extent = p.distance * 1.35;
      for (const q of lab.trail || [])
        extent = Math.max(extent, Math.abs(q.x) * 1.18, Math.abs(q.y) * 1.18);
      extent = Math.max(extent, Math.hypot(s.x, s.y) * 1.1);
      const sc = 5 / extent,
        rad = centralRadius(p) * sc;
      if (o.referenceScale !== sc) {
        setPath(o.reference, o.referencePoints.map(([x, y]) => [x * sc, 1, -y * sc]));
        o.reference.computeLineDistances();
        o.referenceScale = sc;
      }
      o.reference.visible = lab.showTrail;
      o.planet.scale.setScalar(rad);
      o.atmosphere.scale.setScalar(rad);
      o.satellite.position.set(s.x * sc, 1, -s.y * sc);
      const speed = Math.hypot(s.vx, s.vy),
        direction = new T.Vector3(s.vx, 0, -s.vy);
      if (speed > 0)
        o.satellite.quaternion.setFromUnitVectors(
          new T.Vector3(0, 0, 1),
          direction.clone().normalize(),
        );
      o.satelliteBody.material.emissive.setHex(s.collided ? 0x9b271d : 0);
      if (o.trailTime !== s.t) {
        const points = [...(lab.trail || []).slice(-1200), s],
          g = o.trail.geometry;
        const position = g.attributes.position,
          color = g.attributes.color;
        const tail = new T.Color(0x123341),
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
    } else if (type === "projectile") {
      const ref = projectileReference(p),
        sc = 9 / Math.max(10, ref.range, ref.maxHeight * 2),
        offset = (-ref.range * sc) / 2;
      const pt = (q) => [offset + q.x * sc, q.y * sc + 0.15, 0];
      o.ball.position.set(...pt(s));
      o.launcher.position.set(offset, p.height * sc, 0);
      updateLine(o.trail, (lab.trail || []).map(pt));
      o.trail.visible = lab.showTrail;
      const a = [];
      for (let i = 0; i <= 100; i++) {
        const t = (ref.flightTime * i) / 100;
        a.push(
          pt({
            x: p.speed * Math.cos(p.angle * DEG) * t,
            y:
              p.height +
              p.speed * Math.sin(p.angle * DEG) * t -
              0.5 * p.g * t * t,
          }),
        );
      }
      updateLine(o.reference, a);
      o.velocity.position.copy(o.ball.position);
      o.velocity.setDirection(new T.Vector3(s.vx, s.vy, 0).normalize());
      o.velocity.setLength(
        Math.min(1.5, Math.hypot(s.vx, s.vy) * 0.04),
        0.15,
        0.07,
      );
      o.velocity.visible = lab.vectors;
    } else if (type === "collisions") {
      const sc =
        5.5 / Math.max(5.5, Math.abs(s.x1) + 0.5, Math.abs(s.x2) + 0.5);
      o.a.position.set(s.x1 * sc, 0.48, 0);
      o.b.position.set(s.x2 * sc, 0.48, 0);
      o.a.scale.setScalar(sc);
      o.b.scale.setScalar(sc);
      for (const [key, v, mesh] of [
        ["va", s.v1, o.a],
        ["vb", s.v2, o.b],
      ]) {
        o[key].position.copy(mesh.position).add(new T.Vector3(0, 0.7, 0));
        o[key].setDirection(new T.Vector3(v < 0 ? -1 : 1, 0, 0));
        o[key].setLength(Math.max(0.01, Math.abs(v) * 0.5), 0.15, 0.08);
        o[key].visible = lab.vectors && Math.abs(v) > 0.001;
      }
    } else if (type === "interference") {
      for (const { ring, i, z } of o.rings) {
        const f = (s.t * 0.28 + i / 7) % 1;
        ring.position.set(-2.4 + f * 5.2, 1.6, z);
        ring.scale.setScalar(0.5 + f * 2.8);
        ring.material.opacity = (1 - f) * 0.35;
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
            ["slitBoard", "Coherent sources", [0, 2, 0]],
            ["screen", "Screen", [0, 2, 0]],
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
    if (lab.showLabels === false)
      this.root.traverse((node) => {
        if (node.userData.role === "label") node.visible = false;
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
    const cameraRadius =
      this.radius *
      (["gravity", ...ADVANCED_IDS].includes(type) || this.curriculum || this.precision
        ? Math.max(1, (this.precision?.fitAspect || (type === "buoyancy" ? 1.05 : type === "lenses" ? 1.55 : 1.35)) / this.camera.aspect)
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
    this.renderer.forceContextLoss();
  }
}
