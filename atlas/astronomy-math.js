// SI calculations; JPL's approximate J2000 elements are valid from 1800 to 2050.
export const G = 6.6743e-11,
  AU = 149597870700,
  C = 299792458,
  DAY = 86400,
  SUN_MASS = 1.98847e30;
export const SOLAR_LUMINOSITY = 3.828e26,
  STEFAN_BOLTZMANN = 5.670374419e-8;
const rad = Math.PI / 180;
export const ELEMENTS = {
  mercury: [
    [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
    [
      0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689,
      -0.12534081,
    ],
  ],
  venus: [
    [
      0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718,
      76.67984255,
    ],
    [
      0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329,
      -0.27769418,
    ],
  ],
  earth: [
    [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
    [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0],
  ],
  mars: [
    [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
    [
      0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088,
      -0.29257343,
    ],
  ],
  jupiter: [
    [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
    [
      -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668,
      0.20469106,
    ],
  ],
  saturn: [
    [
      9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831,
      113.66242448,
    ],
    [
      -0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216,
      -0.28867794,
    ],
  ],
  uranus: [
    [
      19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763,
      74.01692503,
    ],
    [
      -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281,
      0.04240589,
    ],
  ],
  neptune: [
    [
      30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227,
      131.78422574,
    ],
    [
      0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464,
      -0.00508664,
    ],
  ],
};
export function solveKepler(mean, e) {
  if (!Number.isFinite(mean) || !Number.isFinite(e) || e < 0 || e >= 1)
    throw new RangeError("Elliptic orbit required");
  const m =
    ((((mean + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
    Math.PI;
  let E = e > 0.8 ? Math.sign(m || 1) * Math.PI : m;
  for (let n = 0; n < 30; n++) {
    const delta = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-13) break;
  }
  return E;
}
export function elementsAt(id, daysJ2000 = 0) {
  const data = ELEMENTS[id];
  if (!data) throw new RangeError("No planetary elements");
  const t = daysJ2000 / 36525;
  return data[0].map((x, i) => x + data[1][i] * t);
}
export function ellipsePoint(elements, E) {
  const [a, e, I, , peri, node] = elements,
    i = I * rad,
    o = node * rad,
    w = (peri - node) * rad;
  const x = a * (Math.cos(E) - e),
    y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return [
    (Math.cos(w) * Math.cos(o) - Math.sin(w) * Math.sin(o) * Math.cos(i)) * x +
      (-Math.sin(w) * Math.cos(o) - Math.cos(w) * Math.sin(o) * Math.cos(i)) *
        y,
    (Math.cos(w) * Math.sin(o) + Math.sin(w) * Math.cos(o) * Math.cos(i)) * x +
      (-Math.sin(w) * Math.sin(o) + Math.cos(w) * Math.cos(o) * Math.cos(i)) *
        y,
    Math.sin(w) * Math.sin(i) * x + Math.cos(w) * Math.sin(i) * y,
  ];
}
export function planetPosition(id, daysJ2000) {
  const el = elementsAt(id, daysJ2000);
  return ellipsePoint(el, solveKepler((el[3] - el[4]) * rad, el[1]));
}
export function bodyPhysics(body, altitudeKm = 0) {
  if (!Number.isFinite(altitudeKm) || altitudeKm < 0)
    throw new RangeError("Non-negative altitude required");
  const r = (body.radius + altitudeKm) * 1000,
    mu = body.gm ? body.gm * 1e9 : G * body.mass;
  return {
    gravity: mu / (r * r),
    escape: Math.sqrt((2 * mu) / r) / 1000,
    circular: Math.sqrt(mu / r) / 1000,
    period: (2 * Math.PI * Math.sqrt((r * r * r) / mu)) / 3600,
    density: mu / G / (((4 * Math.PI) / 3) * (body.radius * 1000) ** 3) / 1000,
  };
}
export function orbitPhysics(aAU, rAU = aAU, mass = SUN_MASS) {
  const a = aAU * AU,
    r = rAU * AU,
    mu = G * mass;
  return {
    periodDays: (2 * Math.PI * Math.sqrt((a * a * a) / mu)) / DAY,
    speed: Math.sqrt(mu * (2 / r - 1 / a)) / 1000,
    lightMinutes: r / C / 60,
  };
}
export function energyBalance(distanceAU, albedo = 0.3) {
  if (
    !Number.isFinite(distanceAU) ||
    distanceAU <= 0 ||
    !Number.isFinite(albedo) ||
    albedo < 0 ||
    albedo > 1
  )
    throw new RangeError("Positive distance and albedo from 0 to 1 required");
  const incident = SOLAR_LUMINOSITY / (4 * Math.PI * (distanceAU * AU) ** 2),
    absorbed = (incident * (1 - albedo)) / 4;
  return {
    incident,
    absorbed,
    temperature: (absorbed / STEFAN_BOLTZMANN) ** 0.25,
  };
}
export function satellitePhysics(body, parent) {
  const muParent = parent.gm ? parent.gm * 1e9 : G * parent.mass,
    muMoon = body.gm * 1e9,
    a = body.orbitKm * 1000,
    mu = muParent + muMoon;
  return {
    periodDays: (2 * Math.PI * Math.sqrt(a ** 3 / mu)) / DAY,
    relativeSpeed: Math.sqrt(mu / a) / 1000,
    barycentreKm: (body.orbitKm * muMoon) / mu,
  };
}
export function daysFromDate(date) {
  return (
    (new Date(date + "T12:00:00Z").getTime() - Date.UTC(2000, 0, 1, 12)) /
    86400000
  );
}
export function dateFromDays(days) {
  return new Date(Date.UTC(2000, 0, 1, 12) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
