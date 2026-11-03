/** GPU-only views of the advanced states. Every trail vertex is a sampled state. */
import * as T from "../vendor/three.module.min.js";
import { SOLAR_MASS, stellarTime, doublePosition } from "./physics-advanced.js";
import { atmosphereMaterial, stellarMaterial } from "../atlas/visual-detail.js";
import { roundedBox } from "./scene-finish.js";
const PALETTE = [0xffc37d, 0x85d6ff, 0xc39aff];
function textSprite(text, color = "#b7cedf") {
  const canvas = document.createElement("canvas");
  const c = canvas.getContext("2d");
  const font = "600 48px Segoe UI,sans-serif";
  c.font = font;
  canvas.width = Math.ceil(c.measureText(text).width) + 40;
  canvas.height = 82;
  c.fillStyle = "#10243ce8";
  c.beginPath();
  c.roundRect(2, 2, canvas.width - 4, 78, 13);
  c.fill();
  c.strokeStyle = "#a7c2e144";
  c.lineWidth = 2;
  c.stroke();
  c.font = font;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(text, canvas.width / 2, 41);
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
  sprite.scale.set(0.48 * canvas.width / canvas.height, 0.48, 1);
  sprite.userData.role = "label";
  sprite.userData.text = text;
  return sprite;
}
function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const c = canvas.getContext("2d"),
    g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,.9)");
  g.addColorStop(0.12, "rgba(255,255,255,.7)");
  g.addColorStop(0.3, "rgba(255,255,255,.2)");
  g.addColorStop(0.65, "rgba(255,255,255,.035)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  return new T.CanvasTexture(canvas);
}
function stellarBody(color) {
  const group = new T.Group();
  const material = stellarMaterial(color);
  group.add(new T.Mesh(new T.SphereGeometry(1, 80, 48), material));
  const rim = atmosphereMaterial(color, 0.54);
  group.add(new T.Mesh(new T.SphereGeometry(1.1, 56, 36), rim));
  const halo = new T.Sprite(new T.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    opacity: 0.48,
  }));
  halo.scale.set(5.1, 5.1, 1);
  group.add(halo);
  return { group, material };
}
function bufferedTrail(color) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute(
    "position",
    new T.BufferAttribute(new Float32Array(1201 * 3), 3),
  );
  geometry.setAttribute(
    "color",
    new T.BufferAttribute(new Float32Array(1201 * 3), 3),
  );
  geometry.setDrawRange(0, 0);
  const line = new T.Line(
    geometry,
    new T.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: T.AdditiveBlending,
    }),
  );
  line.frustumCulled = false;
  return { line, color: new T.Color(color), lastTime: null };
}
function setTrail(trail, points, transform, t, visible) {
  trail.line.visible = visible;
  if (!visible) return;
  const position = trail.line.geometry.attributes.position,
    colors = trail.line.geometry.attributes.color;
  points.slice(-1201).forEach((p, i) => {
    const q = transform(p);
    position.setXYZ(i, ...q);
    const fade = 0.08 + 0.92 * (i / Math.max(1, points.length - 1)) ** 1.5;
    colors.setXYZ(
      i,
      trail.color.r * fade,
      trail.color.g * fade,
      trail.color.b * fade,
    );
  });
  position.needsUpdate = true;
  colors.needsUpdate = true;
  trail.line.geometry.setDrawRange(0, Math.min(1201, points.length));
  trail.lastTime = t;
}
function line(points, color, opacity = 0.3) {
  return new T.Line(
    new T.BufferGeometry().setFromPoints(
      points.map((q) => new T.Vector3(...q)),
    ),
    new T.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
}
function rod(color, radius = 0.035) {
  return new T.Mesh(
    new T.CylinderGeometry(radius, radius, 1, 16),
    new T.MeshStandardMaterial({
      color,
      metalness: 0.72,
      roughness: 0.26,
    }),
  );
}
function connect(mesh, a, b) {
  const first = new T.Vector3(...a),
    second = new T.Vector3(...b),
    delta = second.clone().sub(first);
  mesh.position.copy(first.add(second).multiplyScalar(0.5));
  mesh.scale.set(1, delta.length(), 1);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
}
function bob(color, radius) {
  return new T.Mesh(
    new T.SphereGeometry(radius, 40, 28),
    new T.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.17,
      emissive: color,
      emissiveIntensity: 0.16,
    }),
  );
}

export function createAdvancedScene(type, p, view) {
  const root = view.root;
  const add = (mesh) => {
    root.add(mesh);
    return mesh;
  };
  if (type === "binary" || type === "threebody") {
    view.floor.visible = false;
    view.grid.visible = false;
    view.target.set(0, 1, 0);
    view.homeRadius = type === "binary" ? 11.8 : 13.6;
    view.homePolar = 0.55;
    view.homeAzimuth = -0.05;
    view.home();
    const stars = [p.m1, p.m2, ...(type === "threebody" ? [p.m3] : [])].map(
      (mass, i) => {
        const core = stellarBody(PALETTE[i]);
        add(core.group);
        core.group.scale.setScalar(0.42 + 0.17 * Math.cbrt(mass / SOLAR_MASS));
        const name = add(
          textSprite(
            `${"ABC"[i]} · ${(mass / SOLAR_MASS).toFixed(2)} M☉`,
            ["#ffdab0", "#b6eaff", "#dfc8ff"][i],
          ),
        );
        const trail = bufferedTrail(PALETTE[i]);
        add(trail.line);
        const arrow = add(
          new T.ArrowHelper(
            new T.Vector3(1, 0, 0),
            new T.Vector3(),
            1,
            PALETTE[i],
            0.18,
            0.09,
          ),
        );
        return { ...core, name, trail, arrow };
      },
    );
    add(
      line(
        [
          [-0.18, 1, 0],
          [0.18, 1, 0],
        ],
        0xe1ecfa,
        0.7,
      ),
    );
    add(
      line(
        [
          [0, 1, -0.18],
          [0, 1, 0.18],
        ],
        0xe1ecfa,
        0.7,
      ),
    );
    const centreLabel = add(textSprite("Centre of mass", "#c9d9ef"));
    centreLabel.position.set(0, 0.7, 0.6);
    const triangle = add(
      line(
        Array.from({ length: type === "binary" ? 2 : 4 }, () => [0, 1, 0]),
        0xaec6dd,
        0.18,
      ),
    );
    triangle.frustumCulled = false;
    return {
      update(lab) {
        const { state: s, params: p } = lab;
        let extent =
          p.separation *
          (type === "threebody" ? (p.layout === 2 ? 5.5 : 1.3) : 1);
        for (const q of lab.trail || [])
          for (const b of q.bodies)
            extent = Math.max(
              extent,
              Math.abs(b.x) * 1.15,
              Math.abs(b.y) * 1.15,
            );
        for (const b of s.bodies)
          extent = Math.max(extent, Math.abs(b.x) * 1.15, Math.abs(b.y) * 1.15);
        const scale = 5.2 / extent,
          unitVelocity = p.separation / stellarTime(type, p);
        stars.forEach((star, i) => {
          const b = s.bodies[i];
          star.group.position.set(b.x * scale, 1, -b.y * scale);
          star.material.uniforms.time.value = s.t / stellarTime(type, p);
          // Billboard the offset as well as the label, keeping it above the star
          // on screen when the student rotates the orbital plane.
          star.name.position
            .copy(star.group.position)
            .add(
              new T.Vector3(0, 1, 0)
                .applyQuaternion(view.camera.quaternion)
                .multiplyScalar(0.95),
            );
          const speed = Math.hypot(b.vx, b.vy);
          star.arrow.position.copy(star.group.position);
          if (speed > 0)
            star.arrow.setDirection(new T.Vector3(b.vx, 0, -b.vy).normalize());
          star.arrow.setLength(
            Math.max(0.01, Math.min(1.8, (speed / unitVelocity) * 0.7)),
            0.15,
            0.075,
          );
          star.arrow.visible = lab.vectors && speed > 1e-12;
          // Shorter choreography tails preserve each star's identity when their
          // complete tracks would overlap into one white curve.
          const duration = lab.definition.trailDuration(p);
          const points = [
            ...(lab.trail || [])
              .filter((q) => s.t - q.t <= duration)
              .map((q) => q.bodies[i]),
            b,
          ];
          if (star.trail.lastTime !== s.t || star.trail.scale !== scale) {
            setTrail(
              star.trail,
              points,
              (q) => [q.x * scale, 1, -q.y * scale],
              s.t,
              lab.showTrail,
            );
            star.trail.scale = scale;
          }
          star.trail.line.visible = lab.showTrail;
        });
        const path = [
          ...s.bodies,
          ...(s.bodies.length === 3 ? [s.bodies[0]] : []),
        ];
        const positions = triangle.geometry.attributes.position;
        path.forEach((b, i) =>
          positions.setXYZ(i, b.x * scale, 1, -b.y * scale),
        );
        positions.needsUpdate = true;
      },
    };
  }
  view.floor.visible = true;
  view.floor.position.y = -0.75;
  view.grid.visible = true;
  view.grid.position.y = -0.73;
  view.grid.material.opacity = 0.18;
  view.target.set(0, 2, 0);
  view.homeRadius = 11.8;
  view.homePolar = 1.36;
  view.homeAzimuth = -0.07;
  view.home();

  const reach = 2.22, pivotY = 1.98;
  const scale = reach / (p.l1 + p.l2);
  const point = (x, y) => [x * scale, pivotY + y * scale, 0];
  function makeStand(title, colors) {
    const stand = add(new T.Group());
    function component(mesh, position) {
      stand.add(mesh);
      if (position) mesh.position.set(...position);
      return mesh;
    }
    function housing(width, height, depth, color, position) {
      return component(new T.Mesh(roundedBox(width, height, depth),
        new T.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.26 })), position);
    }
    housing(4.84, 5.08, 0.15, 0x294962, [0, pivotY, -0.59]);
    housing(4.66, 4.9, 0.035, 0x152e46, [0, pivotY, -0.492]);
    housing(4.98, 0.15, 1.12, 0x314e64, [0, -0.61, -0.28]);
    housing(4.56, 0.035, 0.04, colors[1], [0, 4.35, -0.45]);
    const origin = [0, pivotY, 0];
    const mount = component(rod(0xa8bdcb, 0.14));
    connect(mount, [0, pivotY, -0.47], [0, pivotY, 0.08]);
    component(bob(0xd7e3ee, 0.105), origin);
    component(line([[0, pivotY - reach, -0.46], [0, pivotY + reach, -0.46]], 0x91b4cd, 0.32));
    component(line(Array.from({ length: 121 }, (_, i) => {
      const angle = i * 2 * Math.PI / 120;
      return [reach * Math.cos(angle), pivotY + reach * Math.sin(angle), -0.46];
    }), 0x7199b9, 0.23));
    const label = component(textSprite(title, colors[2]), [0, 4.81, -0.2]);
    label.scale.multiplyScalar(1.04);
    const upper = component(rod(0xc2d7e6, 0.033));
    const lower = component(rod(colors[1], 0.032));
    const first = component(bob(colors[0], 0.127 + 0.023 * Math.sqrt(p.m1)));
    const second = component(bob(colors[1], 0.14 + 0.024 * Math.sqrt(p.m2)));
    const trail = bufferedTrail(colors[1]);
    component(trail.line);
    return {
      stand, trail,
      update(positions) {
        const joint = point(positions.x1, positions.y1);
        const tip = point(positions.x, positions.y);
        connect(upper, origin, joint);
        connect(lower, joint, tip);
        first.position.set(...joint);
        second.position.set(...tip);
      },
    };
  }
  const main = makeStand("MAIN RUN", [0xffc77e, 0x63efda, "#b1fff0"]);
  const twin = makeStand("COMPARISON TWIN", [0xddb9ff, 0xb790ff, "#e6d3ff"]);
  twin.stand.position.x = 2.53;

  return {
    update(lab) {
      const { state: s } = lab;
      const mainPosition = doublePosition(s, p);
      const twinPosition = doublePosition(s.twin, p);
      main.stand.position.x = lab.vectors ? -2.53 : 0;
      twin.stand.visible = lab.vectors;
      main.update(mainPosition);
      twin.update(twinPosition);
      if (main.trail.lastTime !== s.t || (lab.vectors && twin.trail.lastTime !== s.t)) {
        const points = [...(lab.trail || []), {
          x: mainPosition.x, y: mainPosition.y, tx: twinPosition.x, ty: twinPosition.y,
        }];
        setTrail(main.trail, points, (q) => point(q.x, q.y), s.t, lab.showTrail);
        setTrail(twin.trail, points, (q) => point(q.tx, q.ty), s.t, lab.showTrail && lab.vectors);
      }
      main.trail.line.visible = lab.showTrail;
      twin.trail.line.visible = lab.showTrail && lab.vectors;
    },
  };
}
