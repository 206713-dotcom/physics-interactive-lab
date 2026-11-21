/** Laboratory props modelled on real school apparatus: retort stands with boss
 * heads, slotted masses on a hanger, boxwood rules with a printed scale,
 * grooved pulleys, thick-walled glassware, bench meters. Scenes assemble
 * these instead of bare boxes and cylinders. Display only: a prop never reads
 * or changes a model. All props are built through the scene kit, so they pick
 * up its shadows, materials and roles. */
import * as T from "../vendor/three.module.min.js";

/* Neutral greys on purpose: the kit recolours blue-grey "structure" parts,
 * and these must stay the metal they are. */
export const FINISH = {
  chrome: [0xd4d4d4, { metalness: 1, roughness: 0.16, envMapIntensity: 1.5 }],
  steel: [0xa9a9a9, { metalness: 0.95, roughness: 0.34 }],
  iron: [0x2a2a2c, { metalness: 0.55, roughness: 0.55 }],
  brass: [0xc79a3e, { metalness: 1, roughness: 0.3, envMapIntensity: 1.3 }],
  rubber: [0x161616, { metalness: 0, roughness: 0.9 }],
  cork: [0xb48a58, { metalness: 0, roughness: 0.95 }],
  boxwood: [0xe2c489, { metalness: 0, roughness: 0.6 }],
  red: [0xb3262b, { metalness: 0.1, roughness: 0.4 }],
  thread: [0xe9e4d6, { metalness: 0, roughness: 0.9 }],
};
const made = new Map();
const hasCanvas = typeof document !== "undefined";

/** A turned (lathe) part from a profile of [radius, height] points. */
export function turned(k, profile, finish, pos = [0, 0, 0], segments = 40) {
  const [color, extra] = Array.isArray(finish) ? finish : [finish, {}];
  return k.mesh(new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), segments), color, pos, { ...extra, side: T.DoubleSide });
}
const part = (k, name, finish, ...args) => {
  const [color, extra] = finish;
  return name === "box" ? k.box(args[0], args[1], args[2], color, args[3], extra) : k.cylinder(args[0], args[1], color, args[2], extra);
};
/** An empty group in the scene; children are positioned relative to it. */
export function group(k, pos = [0, 0, 0]) {
  return k.add(new T.Group(), pos, "apparatus");
}
const into = (parent, ...children) => {
  for (const child of children) parent.add(child);
  return parent;
};

/** Retort stand: heavy enamelled base, chrome rod, boss head with two
 * thumbscrews and a horizontal arm. `arm` is signed (positive reaches +x). */
export function retortStand(k, { x = 0, z = 0, height = 4, arm = 2, armY = height - 0.25 } = {}) {
  const side = Math.sign(arm) || 1;
  part(k, "box", FINISH.iron, 1.5, 0.13, 0.95, [x + side * 0.38, 0.065, z]);
  for (const dx of [-0.25, 1.0]) for (const dz of [-0.36, 0.36])
    part(k, "cyl", FINISH.rubber, 0.07, 0.03, [x + side * dx, 0.012, z + dz]);
  part(k, "cyl", FINISH.steel, 0.085, 0.09, [x, 0.17, z]); // rod socket
  part(k, "cyl", FINISH.chrome, 0.052, height, [x, height / 2 + 0.1, z]);
  // Boss head: a block clamped to the rod, carrying the arm at right angles.
  part(k, "box", FINISH.iron, 0.24, 0.3, 0.24, [x, armY, z]);
  const screwA = part(k, "cyl", FINISH.brass, 0.05, 0.2, [x, armY + 0.08, z + 0.2]);
  screwA.rotation.x = Math.PI / 2;
  const screwB = part(k, "cyl", FINISH.brass, 0.05, 0.2, [x - side * 0.2, armY - 0.08, z]);
  screwB.rotation.z = Math.PI / 2;
  const rod = part(k, "cyl", FINISH.chrome, 0.042, Math.abs(arm) + 0.3, [x + arm / 2 - side * 0.05, armY, z]);
  rod.rotation.z = Math.PI / 2;
  return { tip: [x + arm, armY, z], armY };
}

/** Small open hook, hanging down from `pos`. */
export function hook(k, pos, finish = FINISH.chrome, radius = 0.06) {
  const [color, extra] = finish,
    o = k.mesh(new T.TorusGeometry(radius, 0.014, 8, 20, Math.PI * 1.5), color, pos, extra);
  o.rotation.z = Math.PI * 0.75;
  return o;
}

/** Slotted masses stacked on a hanger. The group's origin is the top of the
 * hook, so it can be hung from a spring or string by setting its position. */
export function slottedMasses(k, { count = 3, radius = 0.3, thickness = 0.085, pos = [0, 0, 0], finish = FINISH.brass, stem = 0.5 + count * thickness } = {}) {
  const g = group(k, pos);
  into(g, hook(k, [0, -0.06, 0]));
  into(g, part(k, "cyl", FINISH.chrome, 0.018, stem, [0, -0.12 - stem / 2, 0]));
  const disc = (y, r, finish) => turned(k, [[0, 0], [r - 0.012, 0], [r, 0.012], [r, thickness - 0.012], [r - 0.012, thickness], [0, thickness]], finish, [0, y, 0]);
  const foot = -0.12 - stem;
  into(g, disc(foot, radius * 0.92, FINISH.steel));
  for (let i = 0; i < count; i++) {
    const m = disc(foot + (i + 1) * (thickness + 0.004), radius, finish);
    // The loading slot, turned a little on each disc as it is in a real stack.
    const slot = part(k, "box", FINISH.iron, radius * 0.95, thickness * 0.5, 0.045, [radius * 0.5, thickness / 2, 0]);
    m.add(slot);
    m.rotation.y = i * 1.9;
    g.add(m);
  }
  g.userData.height = 0.12 + stem + thickness;
  return g;
}

/** A single hooked mass (brass cylinder with chamfered edges). Origin at the hook. */
export function hookedMass(k, { radius = 0.3, height = 0.5, pos = [0, 0, 0], finish = FINISH.brass } = {}) {
  const g = group(k, pos), c = 0.03;
  into(g, hook(k, [0, -0.06, 0]));
  into(g, part(k, "cyl", FINISH.chrome, 0.02, 0.1, [0, -0.15, 0]));
  into(g, turned(k, [[0, 0], [radius - c, 0], [radius, c], [radius, height - c], [radius - c, height], [radius * 0.45, height], [radius * 0.4, height + 0.03], [0, height + 0.03]], finish, [0, -0.2 - height - 0.03, 0]));
  g.userData.height = 0.2 + height + 0.03;
  return g;
}

function ruleTexture({ divisions, major, label, pixels = 2048 }) {
  const key = `rule:${divisions}:${major}:${label(major)}`;
  if (!hasCanvas) return null;
  if (!made.has(key)) {
    const c = document.createElement("canvas");
    c.width = pixels;
    c.height = 144;
    const g = c.getContext("2d"), pad = 34, span = pixels - 2 * pad;
    g.fillStyle = "#e6c98d";
    g.fillRect(0, 0, c.width, c.height);
    // Faint boxwood grain.
    for (let i = 0; i < 60; i++) {
      const y = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * c.height;
      g.fillStyle = `rgba(120,80,30,${0.03 + (i % 5) * 0.012})`;
      g.fillRect(0, y, c.width, 1.5);
    }
    g.fillStyle = "#24170c";
    g.font = "700 46px Manrope,Segoe UI,sans-serif";
    g.textAlign = "center";
    g.textBaseline = "top";
    for (let i = 0; i <= divisions; i++) {
      const x = pad + (span * i) / divisions, isMajor = i % major === 0, isHalf = i % (major / 2) === 0;
      g.fillRect(x - (isMajor ? 2.5 : 1.5), 0, isMajor ? 5 : 3, isMajor ? 62 : isHalf ? 46 : 30);
      if (isMajor) g.fillText(label(i), x, 74);
    }
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 8;
    made.set(key, texture);
  }
  return made.get(key);
}
/** Boxwood rule with a printed scale. Lies along +x from its zero end; the
 * printed face is on top. Returns a group you can move or stand upright. */
export function rule(k, { length = 6, width = 0.42, thickness = 0.07, divisions = 100, major = 10, label = (i) => String(i), pos = [0, 0, 0], pad = 0.1 } = {}) {
  const g = group(k, pos), full = length + 2 * pad;
  into(g, part(k, "box", FINISH.boxwood, full, thickness, width, [length / 2, 0, 0]));
  const map = ruleTexture({ divisions, major, label });
  if (map) {
    // The texture carries its own margin so the zero mark sits at x = 0.
    const face = k.mesh(new T.PlaneGeometry(length * (2048 / (2048 - 68)), width * 0.98), 0xffffff, [length / 2, thickness / 2 + 0.002, 0], { map, roughness: 0.55, metalness: 0 });
    face.rotation.x = -Math.PI / 2;
    face.castShadow = false;
    g.add(face);
  }
  return g;
}

/** Grooved pulley on a fork bracket. The wheel turns about z; returns it. */
export function pulley(k, { pos = [0, 0, 0], radius = 0.34, bracket = 0.5 } = {}) {
  const [x, y, z] = pos, w = 0.09, lip = radius, groove = radius - 0.06;
  const wheel = turned(k, [[0.04, -w], [lip, -w], [lip, -w * 0.55], [groove, 0], [lip, w * 0.55], [lip, w], [0.04, w]], FINISH.steel, [x, y, z]);
  wheel.rotation.x = Math.PI / 2;
  const axle = part(k, "cyl", FINISH.chrome, 0.035, 0.34, [x, y, z]);
  axle.rotation.x = Math.PI / 2;
  for (const dz of [-0.14, 0.14]) part(k, "box", FINISH.iron, 0.09, bracket, 0.03, [x, y + bracket / 2 - 0.05, z + dz]);
  part(k, "box", FINISH.iron, 0.12, 0.05, 0.31, [x, y + bracket - 0.05, z]);
  return wheel;
}

/** Thick-walled glass cylinder, open at the top, with a rolled rim. */
export function glassCylinder(k, { radius = 0.6, height = 3, pos = [0, 0, 0], base = true } = {}) {
  const [x, y, z] = pos, glass = { transparent: true, opacity: 0.2, roughness: 0.04, metalness: 0, depthWrite: false, side: T.DoubleSide };
  const wall = k.mesh(new T.CylinderGeometry(radius, radius, height, 48, 1, true), 0xcfe9f2, [x, y + height / 2, z], glass);
  wall.castShadow = false;
  const rim = k.mesh(new T.TorusGeometry(radius, 0.028, 10, 48), 0xe6f6fb, [x, y + height, z], { transparent: true, opacity: 0.55, roughness: 0.05, depthWrite: false });
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = false;
  if (base) {
    const foot = k.cylinder(radius + 0.03, 0.07, 0xcfe9f2, [x, y + 0.035, z], { transparent: true, opacity: 0.4, roughness: 0.05, depthWrite: false });
    foot.castShadow = false;
  }
  return wall;
}

/** Piston with a rubber seal and a rod ending in a load platform. Origin at the piston face. */
export function piston(k, { radius = 0.5, rod = 1.2, pos = [0, 0, 0] } = {}) {
  const g = group(k, pos);
  into(g, part(k, "cyl", FINISH.steel, radius * 0.97, 0.16, [0, 0.08, 0]));
  const seal = k.mesh(new T.TorusGeometry(radius * 0.97, 0.035, 8, 40), ...[FINISH.rubber[0], [0, 0.08, 0], FINISH.rubber[1]]);
  seal.rotation.x = Math.PI / 2;
  into(g, seal);
  into(g, part(k, "cyl", FINISH.chrome, 0.06, rod, [0, 0.16 + rod / 2, 0]));
  into(g, part(k, "cyl", FINISH.iron, Math.min(radius * 0.8, 0.45), 0.05, [0, 0.16 + rod + 0.025, 0]));
  return g;
}

/** Pipe between two points with a flange at each end. */
export function pipe(k, a, b, { radius = 0.12, color = 0x8a8a8a } = {}) {
  const rod = k.rod(a, b, color, radius);
  rod.material.metalness = 0.9;
  rod.material.roughness = 0.35;
  for (const end of [a, b]) {
    const flange = part(k, "cyl", FINISH.steel, radius * 1.5, 0.07, end);
    flange.rotation.z = Math.PI / 2;
  }
  return rod;
}

/** Thin red pointer needle, like the one on a balance. `length` is signed:
 * positive points along +x from `pos`. */
export function pointer(k, pos, length = 0.5) {
  const g = group(k, pos), needle = part(k, "box", FINISH.red, Math.abs(length), 0.03, 0.03, [length / 2, 0, 0]);
  into(g, needle, part(k, "cyl", FINISH.iron, 0.045, 0.06, [0, 0, 0]));
  return g;
}

/** Steel helical spring. Its origin is the bottom coil; scale `y` to stretch it. */
export function coilSpring(k, x, y, z, length, { color = 0xbfc3c7, radius = 0.17, turns = 14, wire = 0.026 } = {}) {
  const points = Array.from({ length: 12 * turns + 1 }, (_, i) => {
    const u = i / (12 * turns), a = u * turns * Math.PI * 2;
    return new T.Vector3(radius * Math.cos(a), u, radius * Math.sin(a));
  });
  const coil = k.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 12 * turns, wire, 7, false), color, [x, y, z],
    { metalness: 0.95, roughness: 0.26, envMapIntensity: 1.5 });
  coil.scale.y = length;
  return coil;
}

const qx = new T.Quaternion(), qz = new T.Quaternion(), X = new T.Vector3(1, 0, 0), Z = new T.Vector3(0, 0, 1);
/** Stand a rule upright: zero at the top, scale running down, face towards +z. */
export function upright(g) {
  qx.setFromAxisAngle(X, Math.PI / 2);
  qz.setFromAxisAngle(Z, -Math.PI / 2);
  g.quaternion.copy(qz).multiply(qx);
  return g;
}

/** Small electric motor with a winding drum on its shaft (axis along z). Returns the drum. */
export function winchMotor(k, pos, color = 0x2d4a7c) {
  const [x, y, z] = pos;
  part(k, "box", FINISH.iron, 0.9, 0.08, 0.8, [x, y + 0.04, z]);
  for (const dz of [-0.22, 0.12]) part(k, "box", FINISH.iron, 0.5, 0.3, 0.05, [x, y + 0.2, z + dz]);
  const body = k.cylinder(0.25, 0.5, color, [x, y + 0.42, z - 0.08], { metalness: 0.2, roughness: 0.4 });
  body.rotation.x = Math.PI / 2;
  const cap = part(k, "cyl", FINISH.steel, 0.2, 0.06, [x, y + 0.42, z - 0.36]);
  cap.rotation.x = Math.PI / 2;
  const drum = turned(k, [[0.03, -0.12], [0.16, -0.12], [0.16, -0.1], [0.08, -0.09], [0.08, 0.09], [0.16, 0.1], [0.16, 0.12], [0.03, 0.12]], FINISH.brass, [x, y + 0.42, z + 0.32]);
  drum.rotation.x = Math.PI / 2;
  for (const [dx, c] of [[-0.14, 0xb3262b], [0.14, 0x1b1b1d]]) {
    const post = k.cylinder(0.04, 0.1, c, [x + dx, y + 0.7, z - 0.1], { roughness: 0.5 });
    post.userData.role = "terminal";
  }
  return drum;
}
