/** GPU-only views of the advanced states. Every trail vertex is a sampled state. */
import * as T from "../vendor/three.module.min.js";
import { SOLAR_MASS, stellarTime, doublePosition } from "./physics-advanced.js";
const PALETTE = [0xffc37d, 0x85d6ff, 0xc39aff];
function textSprite(text, color = "#b7cedf") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const c = canvas.getContext("2d");
  c.font = "500 31px Segoe UI";
  c.textAlign = "center";
  c.fillStyle = color;
  c.fillText(text, 256, 60);
  const sprite = new T.Sprite(
    new T.SpriteMaterial({
      map: new T.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(2.6, 0.49, 1);
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
const starVertex = `varying vec3 pos; varying vec3 normalView; varying vec3 eye;
void main(){pos=position; vec4 p=modelViewMatrix*vec4(position,1.0); normalView=normalize(normalMatrix*normal);eye=-p.xyz;gl_Position=projectionMatrix*p;}`;
const noise = `float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
function stellarBody(color) {
  const group = new T.Group(),
    base = new T.Color(color);
  const material = new T.ShaderMaterial({
    uniforms: { t: { value: 0 }, tint: { value: base } },
    vertexShader: starVertex,
    fragmentShader: `uniform float t; uniform vec3 tint;varying vec3 pos;varying vec3 normalView;varying vec3 eye;${noise}
void main(){vec3 p=normalize(pos);float grain=noise(p*9.0+vec3(t*.12,0.,0.));float flow=noise(p*4.0+vec3(0.,t*.16,0.));float limb=pow(max(0.0,dot(normalize(normalView),normalize(eye))),.3);float hot=smoothstep(.15,.9,grain+flow*.2);vec3 surface=mix(tint*.8,vec3(1.25,1.22,1.16),.2+hot*.4);gl_FragColor=vec4(surface*(.72+.4*limb),1.);}`,
  });
  group.add(new T.Mesh(new T.SphereGeometry(1, 64, 48), material));
  const coronaMaterial = new T.ShaderMaterial({
    uniforms: { t: { value: 0 }, tint: { value: base } },
    vertexShader: starVertex,
    fragmentShader: `uniform float t;uniform vec3 tint;varying vec3 pos;varying vec3 normalView;varying vec3 eye;${noise}
void main(){float rim=pow(1.-abs(dot(normalize(normalView),normalize(eye))),2.2);float rays=.5+.5*noise(normalize(pos)*12.+vec3(0.,t*.15,0.));gl_FragColor=vec4(tint,rim*rays*.5);}`,
    transparent: true,
    depthWrite: false,
    side: T.BackSide,
    blending: T.AdditiveBlending,
  });
  const corona = new T.Mesh(new T.SphereGeometry(1.22, 48, 32), coronaMaterial);
  group.add(corona);
  const halo = new T.Sprite(
    new T.SpriteMaterial({
      map: glowTexture(),
      color,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      opacity: 0.9,
    }),
  );
  halo.scale.set(8, 8, 1);
  group.add(halo);
  return { group, material, coronaMaterial };
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
    view.grid.visible = true;
    view.grid.position.y = 0.96;
    view.grid.material.opacity = 0.085;
    view.target.set(0, 1, 0);
    view.homeRadius = 12.5;
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
        name.scale.set(3.2, 0.6, 1);
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
    const centreLabel = add(textSprite("BARYCENTRE", "#7795ac"));
    centreLabel.position.set(0, 0.7, 0.6);
    centreLabel.scale.set(1.8, 0.34, 1);
    const triangle = add(
      line(
        Array.from({ length: type === "binary" ? 2 : 4 }, () => [0, 1, 0]),
        0xaec6dd,
        0.18,
      ),
    );
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
          star.material.uniforms.t.value = s.t / stellarTime(type, p);
          star.coronaMaterial.uniforms.t.value = star.material.uniforms.t.value;
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
