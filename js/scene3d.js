/** Real WebGL scenes. Geometry follows the same state as graphs and the 2D view.
 * No physics is integrated here. Pointer/keyboard camera controls are visual only. */
import * as T from "../vendor/three.module.min.js";
import { createAdvancedScene } from "./scene-advanced.js";
import { ADVANCED_IDS } from "./physics-advanced.js";
import { centralRadius, orbitAcceleration } from "./physics.js";
import {
  waveAt,
  fieldLines,
  fieldAt,
  refractionInfo,
  circuitAt,
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
    roughness: 0.3,
    metalness: 0.3,
    ...extra,
  });
}
function sphere(r, color) {
  const m = new T.Mesh(new T.SphereGeometry(r, 32, 20), material(color));
  m.castShadow = true;
  return m;
}
function box(x, y, z, color) {
  const m = new T.Mesh(new T.BoxGeometry(x, y, z), material(color));
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
  line.geometry.dispose();
  line.geometry = new T.BufferGeometry().setFromPoints(
    points.map((p) => new T.Vector3(...p)),
  );
}
function rodBetween(mesh, a, b) {
  const av = new T.Vector3(...a),
    bv = new T.Vector3(...b),
    delta = bv.clone().sub(av);
  mesh.position.copy(av.add(bv).multiplyScalar(0.5));
  mesh.scale.set(1, delta.length(), 1);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
}
function ribbonGeometry() {
  const g = new T.PlaneGeometry(8, 1.5, 160, 1);
  return g;
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
  return sprite;
}

let illustratedSurface;
/** A deterministic, seamless, Earth-like illustration. These continents and
 * clouds are decorative geometry/colour, never geographic or atmospheric data.
 * Cache pixels, but make a fresh GPU texture for each disposable scene. */
function planetSurface() {
  if (!illustratedSurface) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext("2d"),
      pixels = context.createImageData(canvas.width, canvas.height);
    const mix = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
    for (let row = 0; row < canvas.height; row++) {
      const latitude = (0.5 - row / (canvas.height - 1)) * Math.PI;
      const y = Math.sin(latitude),
        ring = Math.cos(latitude);
      for (let column = 0; column < canvas.width; column++) {
        const longitude = (column / canvas.width) * Math.PI * 2;
        const x = ring * Math.cos(longitude),
          z = ring * Math.sin(longitude);
        const terrain =
          0.82 *
            Math.sin(3.4 * x + 1.7 * Math.sin(2.4 * y)) *
            Math.cos(3.8 * z - 0.9 * y) +
          0.4 * Math.sin(7.5 * x + 3.1 * z) * Math.cos(6.2 * y - 2.8 * z) +
          0.18 * Math.sin(17 * x + 8 * z) * Math.cos(14 * y + 3 * x) +
          0.07 * Math.sin(41 * z - 22 * x) * Math.cos(36 * y + 11 * z);
        const land = terrain > 0.17,
          height = Math.max(0, terrain - 0.17);
        let color = land
          ? [mix(37, 133, height), mix(111, 146, height), mix(100, 116, height)]
          : [
              mix(6, 22, (terrain + 0.5) * 0.8),
              mix(37, 99, (terrain + 0.5) * 0.8),
              mix(69, 121, (terrain + 0.5) * 0.8),
            ];
        // Pale coast, polar ice and thin stationary cloud patterns add depth.
        if (Math.abs(terrain - 0.17) < 0.025)
          color = color.map((c, i) => mix(c, [72, 151, 143][i], 0.55));
        const ice = Math.max(0, (Math.abs(y) - 0.935) * 17);
        const cloud =
          Math.max(
            0,
            Math.sin(12 * x + 7 * z + 2 * Math.sin(8 * y)) *
              Math.cos(11 * y - 5 * z) +
              0.3 * Math.sin(28 * z + 14 * x) * Math.cos(27 * y) -
              0.48,
          ) * 0.32;
        const index = (row * canvas.width + column) * 4;
        for (let channel = 0; channel < 3; channel++)
          pixels.data[index + channel] = mix(
            mix(color[channel], [218, 235, 233][channel], ice),
            [224, 239, 242][channel],
            cloud,
          );
        pixels.data[index + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    illustratedSurface = canvas;
  }
  const texture = new T.CanvasTexture(illustratedSurface);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export class SceneView {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
    this.renderer.setClearColor(0x071522);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.scene = new T.Scene();
    this.scene.fog = new T.FogExp2(0x071522, 0.022);
    this.camera = new T.PerspectiveCamera(38, 1, 0.05, 200);
    this.target = new T.Vector3(0, 1, 0);
    this.azimuth = -0.38;
    this.polar = 1.05;
    this.radius = 15;
    this.ambient = new T.HemisphereLight(0xc6edff, 0x0d2438, 2.0);
    this.scene.add(this.ambient);
    const key = new T.DirectionalLight(0xe2f4ff, 3.2);
    key.position.set(-4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    this.scene.add(key);
    const rim = new T.PointLight(CYAN, 18, 20);
    rim.position.set(4, 2, -4);
    this.scene.add(rim);
    this.root = new T.Group();
    this.scene.add(this.root);
    this.addEnvironment();
    this.bindCamera();
  }
  addEnvironment() {
    const floor = new T.Mesh(
      new T.CircleGeometry(14, 72),
      material(0x0b2031, { roughness: 0.9, metalness: 0.15 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.82;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floor = floor;
    const grid = new T.GridHelper(24, 32, 0x26526a, 0x153346);
    grid.position.y = -0.8;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
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
    this.scene.add(
      new T.Points(
        g,
        new T.PointsMaterial({
          color: 0x83afc3,
          size: 0.055,
          transparent: true,
          opacity: 0.7,
        }),
      ),
    );
  }
  bindCamera() {
    const c = this.canvas;
    this.handlers = {};
    let down = null;
    this.handlers.pointerdown = (e) => {
      if (e.button !== 0) return;
      down = [e.clientX, e.clientY];
      c.setPointerCapture(e.pointerId);
      c.classList.add("dragging");
    };
    this.handlers.pointermove = (e) => {
      if (!down) return;
      this.azimuth -= (e.clientX - down[0]) * 0.007;
      this.polar = Math.max(
        0.15,
        Math.min(Math.PI - 0.15, this.polar + (e.clientY - down[1]) * 0.006),
      );
      down = [e.clientX, e.clientY];
    };
    this.handlers.pointerup = () => {
      down = null;
      c.classList.remove("dragging");
    };
    this.handlers.wheel = (e) => {
      e.preventDefault();
      this.radius = Math.max(
        5,
        Math.min(34, this.radius * Math.exp(e.deltaY * 0.001)),
      );
    };
    this.handlers.keydown = (e) => {
      const k = e.key;
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
  }
  home() {
    this.azimuth = this.homeAzimuth ?? -0.38;
    this.polar = this.homePolar ?? 1.05;
    this.radius = this.homeRadius || 15;
  }
  clear() {
    this.advanced = null;
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
    this.clear();
    this.type = type;
    this.key = JSON.stringify(p);
    this.ambient.intensity = type === "gravity" ? 0.65 : 2;
    const r = this.root,
      o = this.objects;
    this.floor.position.y =
      { gravity: -3.5, fields: -4.6, waves: -2, refraction: -2.5 }[type] ??
      -0.82;
    this.grid.position.y = this.floor.position.y + 0.02;
    // A spatial reference in the orbital plane, not a ground beneath the planet.
    this.floor.visible = type !== "gravity";
    this.grid.position.y = type === "gravity" ? 1 : this.grid.position.y;
    this.grid.material.opacity = type === "gravity" ? 0.1 : 0.55;
    const add = (name, mesh, pos) => {
      o[name] = mesh;
      if (pos) mesh.position.set(...pos);
      r.add(mesh);
      return mesh;
    };
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
      planet.material = new T.MeshStandardMaterial({
        map: planetSurface(),
        color: 0xffffff,
        metalness: 0.05,
        roughness: 0.78,
      });
      // Procedural longitude/latitude lines are a coordinate texture, not surface data.
      for (let j = -2; j <= 2; j++) {
        const rr = Math.sqrt(1 - (j * 0.3) ** 2);
        const ring = new T.Mesh(
          new T.TorusGeometry(rr, 0.005, 6, 100),
          new T.MeshBasicMaterial({
            color: 0x78e0df,
            transparent: true,
            opacity: 0.1,
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
            opacity: 0.08,
          }),
        );
        ring.rotation.y = (j * Math.PI) / 6;
        planet.add(ring);
      }
      const atmosphere = add("atmosphere", sphere(1.06, 0x53d5f7), [0, 1, 0]);
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
    } else if (type === "spring") {
      add("wall", box(0.2, 2, 1.1, 0x285268), [-4.7, 1.1, 0]);
      add("rail", box(10, 0.15, 1.4, 0x203c50), [0, 0.12, 0]);
      add("block", box(0.9, 0.9, 0.9, CYAN));
      add(
        "coil",
        beam(
          [
            [0, 0, 0],
            [1, 0, 0],
          ],
          CYAN,
        ),
      );
      add(
        "equilibrium",
        beam(
          [
            [1, 0.22, -1],
            [1, 0.22, 1],
          ],
          0x4b6f86,
          0.5,
        ),
      );
      o.velocity = new T.ArrowHelper(
        new T.Vector3(1, 0, 0),
        new T.Vector3(),
        1,
        GOLD,
        0.2,
        0.1,
      );
      r.add(o.velocity);
    } else if (type === "pendulum") {
      add("base", box(3, 0.2, 2.5, 0x19394d), [0, -0.65, 0]);
      add("support", box(0.14, 5, 0.14, 0x3a596d), [0, 1.8, -0.65]);
      add("top", box(1.8, 0.12, 1.4, 0x6e8e9c), [0, 4.2, 0]);
      add("pivot", sphere(0.1, 0xd7e8ef), [0, 4, 0]);
      add("bob", sphere(0.2 + 0.03 * Math.sqrt(p.mass), GOLD));
      add("lengthLabel", label(`L = ${p.length.toFixed(2)} m`), [1.5, 3, 0]);
      add(
        "rod",
        new T.Mesh(
          new T.CylinderGeometry(0.018, 0.018, 1, 12),
          material(0x99becb),
        ),
      );
      add(
        "trail",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          GOLD,
          0.45,
        ),
      );
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
    } else if (type === "waves") {
      const mesh = add(
        "ribbon",
        new T.Mesh(
          ribbonGeometry(),
          new T.MeshStandardMaterial({
            color: CYAN,
            transparent: true,
            opacity: 0.5,
            side: T.DoubleSide,
            metalness: 0.25,
            roughness: 0.28,
          }),
        ),
      );
      mesh.castShadow = true;
      add(
        "incident",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          BLUE,
          0.85,
        ),
      );
      add(
        "reflected",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          GOLD,
          0.85,
        ),
      );
      add(
        "result",
        beam(
          [
            [0, 0, 0],
            [0, 0, 0],
          ],
          CYAN,
        ),
      );
      add("probe", sphere(0.1, 0xffffff));
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
    } else if (type === "refraction") {
      const q = refractionInfo(p),
        col = wavelengthRGB(p.wavelength * 1e9);
      o.opticalColor = col;
      const glass = add("glass", box(8, 2.4, 3, 0x2d90bd), [0, 0.2, 0]);
      glass.material = new T.MeshPhysicalMaterial({
        color: 0x378ab5,
        transparent: true,
        opacity: 0.24,
        roughness: 0.15,
        metalness: 0.15,
        side: T.DoubleSide,
      });
      add(
        "medium1",
        label(`MEDIUM 1 · n = ${p.n1.toFixed(2)}`),
        [-2.8, 3.5, 0],
      );
      add(
        "medium2",
        label(`MEDIUM 2 · n = ${p.n2.toFixed(2)}`),
        [-2.8, 0.2, 0.2],
      );
      add(
        "normal",
        beam(
          [
            [0, -1.2, 0],
            [0, 4.5, 0],
          ],
          0x688da2,
          0.6,
        ),
      );
      const i = p.angle * DEG,
        c = [0, 1.4, 0],
        a = [-3 * Math.sin(i), 1.4 + 3 * Math.cos(i), 0],
        b = [3 * Math.sin(i), 1.4 + 3 * Math.cos(i), 0];
      add("incoming", beam([a, c], col));
      o.paths = [[a, c]];
      if (q.reflectance > 1e-8) {
        add("reflection", beam([c, b], col, Math.max(0.2, q.reflectance)));
        o.paths.push([c, b]);
      }
      if (!q.tir && q.reflectance < 1 - 1e-8) {
        const rr = q.refracted * DEG,
          d = [3 * Math.sin(rr), 1.4 - 3 * Math.cos(rr), 0];
        add("transmitted", beam([c, d], col));
        o.paths.push([c, d]);
      }
      o.pulses = o.paths.map((path, i) => add("pulse" + i, sphere(0.065, col)));
    } else if (type === "circuits") {
      const path = [
        [3, 1.5, 0],
        [3, 2.8, 0],
        [1, 2.8, 0],
        [-1, 2.8, 0],
        [-3, 2.8, 0],
        [-3, 0.1, 0],
        [3, 0.1, 0],
        [3, 1.2, 0],
      ];
      add("wire", beam(path, 0x60899d));
      o.path = path;
      const zig = [];
      for (let i = 0; i <= 16; i++)
        zig.push([
          -1 + i / 8,
          2.8 + (i === 0 || i === 16 ? 0 : i % 2 ? 0.18 : -0.18),
          0,
        ]);
      add("resistor", beam(zig, GOLD));
      add("plate1", box(0.9, 0.08, 1.0, CYAN), [3, 1.5, 0]);
      add("plate2", box(0.9, 0.08, 1.0, 0xff8aaa), [3, 1.2, 0]);
      add("battery", box(0.5, 1.1, 0.6, p.discharge ? 0x344657 : 0x57a5b8), [
        p.discharge ? -4.2 : -3,
        1.5,
        0,
      ]);
      add(
        "resistanceLabel",
        label(`${p.resistance.toLocaleString()} Ω`),
        [0, 3.4, 0],
      );
      add(
        "capacitanceLabel",
        label(`${(p.capacitance * 1e6).toFixed(0)} µF`),
        [3.8, 1.4, 0],
      );
      if (p.discharge)
        add("sourceLabel", label("SOURCE DISCONNECTED"), [-4.2, 0.5, 0]);
      o.dots = Array.from({ length: 16 }, (_, i) =>
        add("current" + i, sphere(0.045, GOLD)),
      );
      const glow = add("chargeGlow", box(0.86, 0.25, 0.9, CYAN), [3, 1.35, 0]);
      glow.material = new T.MeshBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0,
      });
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
    if (this.type !== type || this.key !== JSON.stringify(p))
      this.build(type, p);
    const o = this.objects;
    if (this.advanced) this.advanced.update(lab);
    else if (type === "gravity") {
      let extent = p.distance * 1.35;
      for (const q of lab.trail || [])
        extent = Math.max(extent, Math.abs(q.x) * 1.18, Math.abs(q.y) * 1.18);
      extent = Math.max(extent, Math.hypot(s.x, s.y) * 1.1);
      const sc = 5 / extent,
        rad = centralRadius(p) * sc;
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
    } else if (type === "spring") {
      const x = 1 + s.x * 3.5;
      o.block.position.set(x, 0.65, 0);
      const pts = [[-4.6, 0.65, 0]];
      for (let i = 0; i <= 220; i++) {
        const f = i / 220;
        pts.push([
          -4.4 + (x - 0.5 + 4.4) * f,
          0.65 + 0.18 * Math.cos(f * Math.PI * 24),
          0.18 * Math.sin(f * Math.PI * 24),
        ]);
      }
      pts.push([x - 0.45, 0.65, 0]);
      updateLine(o.coil, pts);
      o.velocity.position.set(x, 1.45, 0);
      o.velocity.setDirection(new T.Vector3(s.v < 0 ? -1 : 1, 0, 0));
      o.velocity.setLength(
        Math.max(0.001, Math.min(2, Math.abs(s.v) * 0.5)),
        0.15,
        0.08,
      );
      o.velocity.visible = lab.vectors && Math.abs(s.v) > 0.01;
    } else if (type === "pendulum") {
      const b = [
        1.3 * p.length * Math.sin(s.theta),
        4 - 1.3 * p.length * Math.cos(s.theta),
        0,
      ];
      o.bob.position.set(...b);
      rodBetween(o.rod, [0, 4, 0], b);
      updateLine(
        o.trail,
        (lab.trail || []).map((q) => [1.3 * q.x, 4 + 1.3 * q.y, 0]),
      );
      o.trail.visible = lab.showTrail;
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
    } else if (type === "waves") {
      const pos = o.ribbon.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setY(i, 1.1 + waveAt(x + 4, s.t, p).resultant * 2);
        pos.setZ(i, i < 161 ? -0.65 : 0.65);
      }
      pos.needsUpdate = true;
      o.ribbon.geometry.computeVertexNormals();
      const a = [],
        b = [],
        sum = [];
      for (let i = 0; i <= 160; i++) {
        const x = i / 20,
          q = waveAt(x, s.t, p);
        a.push([x - 4, 1.1 + q.incident * 2, -1]);
        b.push([x - 4, 1.1 + q.reflected * 2, 1]);
        sum.push([x - 4, 1.1 + q.resultant * 2, 0]);
      }
      updateLine(o.incident, a);
      updateLine(o.reflected, b);
      updateLine(o.result, sum);
      o.probe.position.set(
        p.probe - 4,
        1.1 + waveAt(p.probe, s.t, p).resultant * 2,
        0,
      );
    } else if (type === "interference") {
      for (const { ring, i, z } of o.rings) {
        const f = (s.t * 0.28 + i / 7) % 1;
        ring.position.set(-2.4 + f * 5.2, 1.6, z);
        ring.scale.setScalar(0.5 + f * 2.8);
        ring.material.opacity = (1 - f) * 0.35;
      }
    } else if (type === "refraction") {
      o.paths.forEach(([a, b], i) => {
        const f = (s.t * 0.5 + (i === 0 ? 0 : 0.2)) % 1;
        o.pulses[i].position.set(...a.map((v, k) => v + (b[k] - v) * f));
      });
    } else if (type === "fields") {
      const f = fieldAt(p.probeX, p.probeY, p);
      o.fieldArrow.position.copy(o.probe.position);
      o.fieldArrow.visible = lab.vectors && f.valid && f.magnitude > 1e-8;
      if (o.fieldArrow.visible)
        o.fieldArrow.setDirection(new T.Vector3(f.ex, f.ey, 0).normalize());
    } else if (type === "circuits") {
      const q = circuitAt(s.t, p),
        phase =
          (p.discharge ? 1 : -1) * q.tau * 1.3 * (1 - Math.exp(-s.t / q.tau));
      const lengths = o.path
          .slice(1)
          .map((b, i) =>
            new T.Vector3(...b).distanceTo(new T.Vector3(...o.path[i])),
          ),
        total = lengths.reduce((a, b) => a + b, 0);
      o.dots.forEach((dot, i) => {
        let d = ((((i / 16 + phase) % 1) + 1) % 1) * total,
          j = 0;
        while (j < lengths.length - 1 && d > lengths[j]) d -= lengths[j++];
        const a = o.path[j],
          b = o.path[j + 1],
          f = d / lengths[j];
        dot.position.set(...a.map((v, k) => v + (b[k] - v) * f));
        dot.material.emissive.setHex(GOLD);
        dot.material.emissiveIntensity = 0.3;
      });
      o.chargeGlow.material.opacity = (0.3 * q.voltage) / p.voltage;
      o.plate1.material.emissive.setHex(CYAN);
      o.plate1.material.emissiveIntensity = (q.voltage / p.voltage) * 0.6;
    }
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
    const cameraRadius =
      this.radius *
      (["gravity", ...ADVANCED_IDS].includes(type)
        ? Math.max(1, 1.35 / this.camera.aspect)
        : 1);
    this.camera.position.set(
      this.target.x +
        cameraRadius * Math.sin(this.polar) * Math.sin(this.azimuth),
      this.target.y + cameraRadius * Math.cos(this.polar),
      this.target.z +
        cameraRadius * Math.sin(this.polar) * Math.cos(this.azimuth),
    );
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
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
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
