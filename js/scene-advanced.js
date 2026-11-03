/** GPU-only views of the advanced states. Every trail vertex is a sampled state. */
import * as T from "../vendor/three.module.min.js";
import { SOLAR_MASS, stellarTime, doublePosition } from "./physics-advanced.js";
import { atmosphereMaterial, stellarMaterial } from "../atlas/visual-detail.js";
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
function rod(color, radius = 0.035, transparent = false) {
  return new T.Mesh(
    new T.CylinderGeometry(radius, radius, 1, 16),
    new T.MeshStandardMaterial({
      color,
      metalness: 0.72,
      roughness: 0.26,
      transparent,
      depthWrite: !transparent,
      opacity: transparent ? 0.25 : 1,
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
function bob(color, radius, ghost = false) {
  return new T.Mesh(
    new T.SphereGeometry(radius, 40, 28),
    new T.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.17,
      emissive: color,
      emissiveIntensity: ghost ? 0.1 : 0.16,
      transparent: ghost,
      depthWrite: !ghost,
      opacity: ghost ? 0.35 : 1,
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
  view.floor.position.y = -1.3;
  view.grid.visible = true;
  view.grid.position.y = -1.28;
  view.grid.material.opacity = 0.16;
  view.target.set(0, 2.3, 0);
  view.homeRadius = 10.5;
  view.homePolar = 1.23;
  view.homeAzimuth = -0.1;
  view.home();
  const pivot = [0, 2.3, 0],
    sc = 3.5 / (p.l1 + p.l2);
  const top = add(rod(0x708594, 0.075));
  connect(top, [-2.7, 2.7, -0.7], [2.7, 2.7, -0.7]);
  for (const x of [-2.7, 2.7]) {
    const post = add(rod(0x344d63, 0.075));
    connect(post, [x, -1.3, -0.7], [x, 2.7, -0.7]);
    const foot = add(
      new T.Mesh(
        new T.BoxGeometry(0.75, 0.1, 1.2),
        new T.MeshStandardMaterial({
          color: 0x213b50,
          metalness: 0.6,
          roughness: 0.35,
        }),
      ),
    );
    foot.position.set(x, -1.25, -0.65);
  }
  const mount = add(rod(0xd1ad70, 0.14));
  connect(mount, [0, 2.3, -0.7], [0, 2.3, 0.12]);
  const arm1 = add(rod(0xc7dae6, 0.038)),
    arm2 = add(rod(0x91c8c6, 0.035));
  const first = add(bob(0xffc77e, 0.15 + 0.025 * Math.sqrt(p.m1))),
    second = add(bob(0x63efda, 0.16 + 0.025 * Math.sqrt(p.m2)));
  const ghost1 = add(rod(0xbb98ff, 0.025, true)),
    ghost2 = add(rod(0xbb98ff, 0.025, true));
  const ghostBob1 = add(bob(0xbb98ff, 0.17, true)),
    ghostBob2 = add(bob(0xbb98ff, 0.18, true));
  const mainTrail = bufferedTrail(0x67ead4),
    ghostTrail = bufferedTrail(0xc49aff);
  add(mainTrail.line);
  add(ghostTrail.line);
  const lowerLabel = add(textSprite("MAIN RUN", "#91e8d8"));
  lowerLabel.scale.set(1.4, 0.265, 1);
  const reference = add(
    line(
      [
        [0, 2.3, 0],
        [0, 2.3 - 3.5, 0],
      ],
      0x58778d,
      0.2,
    ),
  );
  return {
    update(lab) {
      const { state: s } = lab,
        main = doublePosition(s, p),
        ghost = doublePosition(s.twin, p);
      const pt = (x, y, z = 0) => [x * sc, 2.3 + y * sc, z],
        a = pt(main.x1, main.y1),
        b = pt(main.x, main.y),
        ga = pt(ghost.x1, ghost.y1, 0.045),
        gb = pt(ghost.x, ghost.y, 0.045);
      connect(arm1, pivot, a);
      connect(arm2, a, b);
      first.position.set(...a);
      second.position.set(...b);
      connect(ghost1, [0, 2.3, 0.045], ga);
      connect(ghost2, ga, gb);
      ghostBob1.position.set(...ga);
      ghostBob2.position.set(...gb);
      [ghost1, ghost2, ghostBob1, ghostBob2].forEach(
        (mesh) => (mesh.visible = lab.vectors),
      );
      lowerLabel.position.set(b[0], b[1] - 0.35, b[2]);
      reference.visible = lab.vectors;
      const points = [
        ...(lab.trail || []),
        { x: main.x, y: main.y, tx: ghost.x, ty: ghost.y },
      ];
      if (mainTrail.lastTime !== s.t)
        setTrail(mainTrail, points, (q) => pt(q.x, q.y), s.t, lab.showTrail);
      if (ghostTrail.lastTime !== s.t)
        setTrail(
          ghostTrail,
          points,
          (q) => pt(q.tx, q.ty, 0.045),
          s.t,
          lab.showTrail && lab.vectors,
        );
      mainTrail.line.visible = lab.showTrail;
      ghostTrail.line.visible = lab.showTrail && lab.vectors;
    },
  };
}
