/** Worked calculations derived from the same SI state as the model.
 * Raw results retain full precision; rounding belongs only to the view. */
import * as P from "./physics.js";
import * as E from "./physics-extra.js";
import { ADVANCED_IDS } from "./physics-advanced.js";
import { advancedCalculationSheet } from "./calculations-advanced.js";
import { CURRICULUM_IDS } from "./curriculum-physics.js";
import { curriculumCalculationSheet } from "./curriculum-simulations.js";

export function calculationNumber(value) {
  if (typeof value === "string") return value;
  if (value === null || !Number.isFinite(value)) return "Not defined";
  if (value === 0) return "0";
  const size = Math.abs(value);
  return size < 0.001 || size >= 1e5
    ? value.toExponential(3)
    : Number(value.toPrecision(4)).toString();
}
const n = calculationNumber;
// Equivalent phase in [−π, π] keeps the displayed sine substitution meaningful
// after many cycles, instead of rounding a very large angle by whole radians.
const phase = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const variable = (symbol, label, value, unit = "") => ({
  symbol,
  label,
  value,
  unit,
});
const calculation = (
  id,
  title,
  formula,
  substitution,
  value,
  unit = "",
  note = "",
) => ({ id, title, formula, substitution, value, unit, note });
const v = variable,
  c = calculation;

export function calculationSheet(type, s, p) {
  if (CURRICULUM_IDS.includes(type))
    return curriculumCalculationSheet(type, s, p, n);
  if (ADVANCED_IDS.includes(type))
    return advancedCalculationSheet(type, s, p, n);
  let variables = [],
    calculations = [],
    note =
      "Values are calculated from this run. Displayed numbers are rounded; calculations use full precision.";
  if (type === "spring") {
    const energy = P.springEnergy(s, p),
      q = P.springInfo(p),
      a = P.springAcceleration(s, p);
    variables = [
      v("m", "Mass", p.mass, "kg"),
      v("k", "Stiffness", p.k, "N/m"),
      v("b", "Damping", p.damping, "kg/s"),
      v("x", "Displacement", s.x, "m"),
      v("v", "Velocity", s.v, "m/s"),
    ];
    calculations = [
      c(
        "force",
        "Net force on the mass",
        "F = −kx − bv",
        `−(${n(p.k)} N/m)(${n(s.x)} m) − (${n(p.damping)} kg/s)(${n(s.v)} m/s)`,
        p.mass * a,
        "N",
      ),
      c(
        "acceleration",
        "Acceleration",
        "a = (−kx − bv)/m",
        `(${n(p.mass * a)} N) / (${n(p.mass)} kg)`,
        a,
        "m/s²",
      ),
      c(
        "period",
        "Natural period",
        "T₀ = 2π√(m/k)",
        `2π√[(${n(p.mass)} kg)/(${n(p.k)} N/m)]`,
        q.period,
        "s",
        "Undamped reference; damping can change or remove oscillation.",
      ),
      c(
        "energy",
        "Mechanical energy",
        "E = ½mv² + ½kx²",
        `½(${n(p.mass)})(${n(s.v)})² + ½(${n(p.k)})(${n(s.x)})²`,
        energy.total,
        "J",
        "SI inputs: kilograms, metres and seconds.",
      ),
    ];
  } else if (type === "gravity") {
    const r = Math.hypot(s.x, s.y),
      speed = Math.hypot(s.vx, s.vy),
      reduced = (p.centralMass * p.bodyMass) / (p.centralMass + p.bodyMass),
      acceleration = P.orbitAcceleration(s, p);
    variables = [
      v("M", "Central mass", p.centralMass, "kg"),
      v("m", "Satellite mass", p.bodyMass, "kg"),
      v("r", "Current separation", r, "m"),
      v("v", "Relative speed", speed, "m/s"),
      v("r₀", "Launch separation", p.distance, "m"),
      v("G", "Gravitational constant", P.G, "m³/(kg s²)"),
    ];
    calculations = [
      c(
        "force",
        "Gravitational force",
        "F = GMm/r²",
        `(${n(P.G)})(${n(p.centralMass)})(${n(p.bodyMass)}) / (${n(r)})²`,
        P.gravityForce(p.centralMass, p.bodyMass, r),
        "N",
        "r is measured between centres; all substituted inputs are SI.",
      ),
      c(
        "acceleration",
        "Relative acceleration magnitude",
        "|aᵣₑₗ| = G(M + m)/r²",
        `(${n(P.G)})(${n(p.centralMass)} + ${n(p.bodyMass)}) / (${n(r)})²`,
        Math.hypot(acceleration.x, acceleration.y),
        "m/s²",
        "Points toward the central body. Both masses contribute to relative motion.",
      ),
      c(
        "circular",
        "Circular launch speed",
        "v_c,0 = √[G(M + m)/r₀]",
        `√[(${n(P.G)})(${n(p.centralMass)} + ${n(p.bodyMass)}) / (${n(p.distance)})]`,
        P.circularSpeed(p),
        "m/s",
        "Reference for the chosen launch separation; the current orbit need not be circular.",
      ),
      c(
        "energy",
        "Two-body mechanical energy",
        "E = ½μv² − GMm/r",
        `½(${n(reduced)})(${n(speed)})² − (${n(P.G)})(${n(p.centralMass)})(${n(p.bodyMass)})/(${n(r)})`,
        P.orbitEnergy(s, p).total,
        "J",
        `Centre-of-mass frame; reduced mass μ = Mm/(M + m) = ${n(reduced)} kg. SI inputs.`,
      ),
    ];
    if (s.collided)
      note =
        "The model has stopped at the surface. Values describe the instant of contact; impact and deformation are not simulated.";
  } else if (type === "pendulum") {
    const alpha = -(p.g / p.length) * Math.sin(s.theta) - p.damping * s.omega;
    variables = [
      v("L", "Length", p.length, "m"),
      v("θ", "Angle", s.theta, "rad"),
      v("ω", "Angular velocity", s.omega, "rad/s"),
      v("g", "Gravity", p.g, "m/s²"),
      v("β", "Angular damping", p.damping, "s⁻¹"),
      v("m", "Bob mass", p.mass, "kg"),
    ];
    calculations = [
      c(
        "acceleration",
        "Angular acceleration",
        "α = −(g/L) sin θ − βω",
        `−(${n(p.g)}/${n(p.length)}) sin(${n(s.theta)} rad) − (${n(p.damping)})(${n(s.omega)})`,
        alpha,
        "rad/s²",
      ),
      c(
        "speed",
        "Bob speed",
        "v = |Lω|",
        `|(${n(p.length)} m)(${n(s.omega)} rad/s)|`,
        Math.abs(p.length * s.omega),
        "m/s",
      ),
      c(
        "period",
        "Small-angle period",
        "T ≈ 2π√(L/g)",
        `2π√[(${n(p.length)} m)/(${n(p.g)} m/s²)]`,
        2 * Math.PI * Math.sqrt(p.length / p.g),
        "s",
        "Approximation for small oscillations without damping.",
      ),
      c(
        "energy",
        "Mechanical energy",
        "E = ½mL²ω² + mgL(1 − cos θ)",
        `½(${n(p.mass)})(${n(p.length)})²(${n(s.omega)})² + (${n(p.mass)})(${n(p.g)})(${n(p.length)})(1 − cos(${n(s.theta)} rad))`,
        E.pendulumEnergy(s, p).total,
        "J",
        "SI inputs; zero potential energy at the lowest point.",
      ),
    ];
  } else if (type === "projectile") {
    const speed = Math.hypot(s.vx, s.vy);
    variables = [
      v("vₓ", "Horizontal velocity", s.vx, "m/s"),
      v("vᵧ", "Vertical velocity", s.vy, "m/s"),
      v("y", "Height", s.y, "m"),
      v("g", "Gravity", p.g, "m/s²"),
      v("β", "Drag per unit mass", p.drag, "m⁻¹"),
    ];
    calculations = [
      c(
        "speed",
        "Resultant speed",
        "v = √(vₓ² + vᵧ²)",
        `√[(${n(s.vx)})² + (${n(s.vy)})²]`,
        speed,
        "m/s",
      ),
      c(
        "ax",
        "Horizontal acceleration",
        "aₓ = −βvvₓ",
        `−(${n(p.drag)})(${n(speed)})(${n(s.vx)})`,
        -p.drag * speed * s.vx,
        "m/s²",
      ),
      c(
        "ay",
        "Vertical acceleration",
        "aᵧ = −g − βvvᵧ",
        `−(${n(p.g)}) − (${n(p.drag)})(${n(speed)})(${n(s.vy)})`,
        -p.g - p.drag * speed * s.vy,
        "m/s²",
      ),
      c(
        "energy",
        "Specific mechanical energy",
        "E/m = ½v² + gy",
        `½(${n(speed)})² + (${n(p.g)})(${n(s.y)})`,
        0.5 * speed ** 2 + p.g * s.y,
        "J/kg",
        "Energy per unit mass. Drag dissipates mechanical energy; inputs are SI.",
      ),
    ];
    if (s.landed)
      note =
        "The run has stopped at ground contact. Velocity and energy are the values just before impact.";
  } else if (type === "collisions") {
    const prediction = E.collisionVelocities(
        p.m1,
        p.m2,
        p.u1,
        p.u2,
        p.restitution,
      ),
      willMeet = p.u1 > p.u2,
      denom = p.m1 + p.m2;
    variables = [
      v("m₁", "Mass A", p.m1, "kg"),
      v("m₂", "Mass B", p.m2, "kg"),
      v("u₁", "Initial velocity A", p.u1, "m/s"),
      v("u₂", "Initial velocity B", p.u2, "m/s"),
      v("v₁", "Current velocity A", s.v1, "m/s"),
      v("v₂", "Current velocity B", s.v2, "m/s"),
      v("e", "Restitution", p.restitution),
    ];
    calculations = [
      c(
        "momentum",
        "Current total momentum",
        "p = m₁v₁ + m₂v₂",
        `(${n(p.m1)})(${n(s.v1)}) + (${n(p.m2)})(${n(s.v2)})`,
        p.m1 * s.v1 + p.m2 * s.v2,
        "kg m/s",
      ),
      c(
        "energy",
        "Current kinetic energy",
        "K = ½m₁v₁² + ½m₂v₂²",
        `½(${n(p.m1)})(${n(s.v1)})² + ½(${n(p.m2)})(${n(s.v2)})²`,
        0.5 * p.m1 * s.v1 ** 2 + 0.5 * p.m2 * s.v2 ** 2,
        "J",
      ),
      c(
        "v1",
        "Predicted A after contact",
        "v₁′ = [m₁u₁ + m₂u₂ − m₂e(u₁ − u₂)]/(m₁ + m₂)",
        willMeet
          ? `[(${n(p.m1)})(${n(p.u1)}) + (${n(p.m2)})(${n(p.u2)}) − (${n(p.m2)})(${n(p.restitution)})(${n(p.u1)} − ${n(p.u2)})]/(${n(denom)})`
          : "The carts are not approaching, so no contact is scheduled.",
        willMeet ? prediction.v1 : null,
        "m/s",
        willMeet
          ? s.hit
            ? "Contact has occurred."
            : "Prediction for contact, not the current velocity."
          : "No collision in this run.",
      ),
      c(
        "v2",
        "Predicted B after contact",
        "v₂′ = [m₁u₁ + m₂u₂ + m₁e(u₁ − u₂)]/(m₁ + m₂)",
        willMeet
          ? `[(${n(p.m1)})(${n(p.u1)}) + (${n(p.m2)})(${n(p.u2)}) + (${n(p.m1)})(${n(p.restitution)})(${n(p.u1)} − ${n(p.u2)})]/(${n(denom)})`
          : "The carts are not approaching, so no contact is scheduled.",
        willMeet ? prediction.v2 : null,
        "m/s",
        willMeet
          ? s.hit
            ? "Contact has occurred."
            : "Prediction for contact, not the current velocity."
          : "No collision in this run.",
      ),
    ];
  } else if (type === "waves") {
    const k = (2 * Math.PI) / p.wavelength,
      omega = k * p.speed,
      q = E.waveAt(p.probe, s.t, p);
    variables = [
      v("A", "Amplitude", p.amplitude, "m"),
      v("λ", "Wavelength", p.wavelength, "m"),
      v("c", "Wave speed", p.speed, "m/s"),
      v("R", "Counter-wave ratio", p.reflection),
      v("xₚ", "Probe position", p.probe, "m"),
      v("t", "Elapsed time", s.t, "s"),
    ];
    calculations = [
      c(
        "frequency",
        "Frequency",
        "f = c/λ",
        `(${n(p.speed)} m/s)/(${n(p.wavelength)} m)`,
        p.speed / p.wavelength,
        "Hz",
      ),
      c(
        "incident",
        "Incident displacement at probe",
        "yᵢ = A sin(kxₚ − ωt)",
        `(${n(p.amplitude)} m) sin(${n(phase(k * p.probe - omega * s.t))} rad)`,
        q.incident,
        "m",
        `k = ${n(k)} rad/m; ω = ${n(omega)} rad/s. The displayed phase is equivalent modulo 2π.`,
      ),
      c(
        "reflected",
        "Counter-wave displacement",
        "yᵣ = RA sin(kxₚ + ωt)",
        `(${n(p.reflection)})(${n(p.amplitude)} m) sin(${n(phase(k * p.probe + omega * s.t))} rad)`,
        q.reflected,
        "m",
        "The displayed phase is equivalent modulo 2π.",
      ),
      c(
        "resultant",
        "Resultant displacement",
        "y = yᵢ + yᵣ",
        `(${n(q.incident)} m) + (${n(q.reflected)} m)`,
        q.resultant,
        "m",
      ),
    ];
  } else if (type === "interference") {
    const spacing = (p.wavelength * p.screenDistance) / p.separation,
      theta = Math.asin(p.wavelength / p.slitWidth);
    variables = [
      v("λ", "Wavelength", p.wavelength, "m"),
      v("d", "Slit separation", p.separation, "m"),
      v("L", "Screen distance", p.screenDistance, "m"),
      v("a", "Slit width", p.slitWidth, "m"),
    ];
    calculations = [
      c(
        "spacing",
        "Near-axis fringe spacing",
        "Δy ≈ λL/d",
        `(${n(p.wavelength)} m)(${n(p.screenDistance)} m)/(${n(p.separation)} m)`,
        spacing,
        "m",
        "Small-angle approximation.",
      ),
      c(
        "dark",
        "First interference minimum",
        "y_dark ≈ λL/(2d)",
        `(${n(p.wavelength)})(${n(p.screenDistance)})/[2(${n(p.separation)})]`,
        spacing / 2,
        "m",
        "Positive side of the centre; small-angle approximation. SI inputs.",
      ),
      c(
        "diffraction",
        "First diffraction-envelope minimum",
        "y = L tan[asin(λ/a)]",
        `(${n(p.screenDistance)} m) tan[asin(${n(p.wavelength)}/${n(p.slitWidth)})]`,
        p.screenDistance * Math.tan(theta),
        "m",
        "Finite-width slit envelope; angles are evaluated consistently in radians.",
      ),
      c(
        "centre",
        "Normalised central intensity",
        "I(0)/I₀ = sinc²(0) cos²(0)",
        `1 × 1`,
        E.interferenceAt(0, p).intensity,
        "",
        "The sinc limit at zero is 1. This is a model intensity ratio, not measured detector counts.",
      ),
    ];
  } else if (type === "refraction") {
    const q = E.refractionInfo(p),
      ratio = (p.n1 * Math.sin(p.angle * E.DEG)) / p.n2;
    variables = [
      v("n₁", "Incident index", p.n1),
      v("n₂", "Transmitted index", p.n2),
      v("i", "Incidence angle", p.angle, "°"),
      v("λ₀", "Vacuum wavelength", p.wavelength, "m"),
      v("c", "Vacuum light speed", E.C_LIGHT, "m/s"),
    ];
    let reflection = "R = 1 under total internal reflection.";
    if (!q.tir) {
      const ci = Math.cos(p.angle * E.DEG),
        cr = Math.cos(q.refracted * E.DEG),
        rs = ((p.n1 * ci - p.n2 * cr) / (p.n1 * ci + p.n2 * cr)) ** 2,
        rp = ((p.n2 * ci - p.n1 * cr) / (p.n2 * ci + p.n1 * cr)) ** 2;
      reflection = `[${n(rs)} + ${n(rp)}]/2`;
    }
    calculations = [
      c(
        "angle",
        "Refracted angle",
        "r = asin[(n₁/n₂) sin i]",
        q.tir
          ? `(${n(p.n1)}/${n(p.n2)}) sin(${n(p.angle)}°) = ${n(ratio)} > 1; no real transmitted angle.`
          : `asin[(${n(p.n1)}/${n(p.n2)}) sin(${n(p.angle)}°)]`,
        q.refracted,
        "°",
        q.tir
          ? "Total internal reflection; no transmitted ray."
          : "Angles are measured from the normal.",
      ),
      c(
        "critical",
        "Critical angle",
        "i_c = asin(n₂/n₁)",
        q.critical === null
          ? "n₁ ≤ n₂: no critical angle for this direction."
          : `asin(${n(p.n2)}/${n(p.n1)})`,
        q.critical,
        "°",
      ),
      c(
        "reflection",
        "Unpolarised reflected fraction",
        "R = (Rₛ + Rₚ)/2",
        reflection,
        q.reflectance,
        "",
        "Fresnel intensity reflectance for lossless, non-magnetic media.",
      ),
      c(
        "speed",
        "Light speed in medium 2",
        "v₂ = c/n₂",
        `(${n(E.C_LIGHT)} m/s)/(${n(p.n2)})`,
        E.C_LIGHT / p.n2,
        "m/s",
        q.tir
          ? "Material property only; no transmitted ray under total internal reflection."
          : "Phase speed for the chosen refractive index.",
      ),
    ];
  } else if (type === "circuits") {
    const q = E.circuitAt(s.t, p),
      decay = Math.exp(-s.t / q.tau);
    variables = [
      v("V₀", "Source / initial voltage", p.voltage, "V"),
      v("R", "Resistance", p.resistance, "Ω"),
      v("C", "Capacitance", p.capacitance, "F"),
      v("t", "Elapsed time", s.t, "s"),
      v("Mode", "Switch position", p.discharge ? "Discharging" : "Charging"),
    ];
    calculations = [
      c(
        "tau",
        "Time constant",
        "τ = RC",
        `(${n(p.resistance)} Ω)(${n(p.capacitance)} F)`,
        q.tau,
        "s",
      ),
      c(
        "voltage",
        "Capacitor voltage",
        p.discharge ? "V_C = V₀ e^(−t/τ)" : "V_C = V₀(1 − e^(−t/τ))",
        p.discharge
          ? `(${n(p.voltage)} V)(${n(decay)})`
          : `(${n(p.voltage)} V)[1 − ${n(decay)}]`,
        q.voltage,
        "V",
        `e^(−t/τ) = exp[−(${n(s.t)})/(${n(q.tau)})].`,
      ),
      c(
        "current",
        "Signed current",
        "I = ±(V₀/R) e^(−t/τ)",
        `${p.discharge ? "−" : "+"}(${n(p.voltage)} V/${n(p.resistance)} Ω)(${n(decay)})`,
        q.current,
        "A",
        "Positive charges the capacitor; negative discharges it.",
      ),
      c(
        "charge",
        "Stored charge",
        "Q = CV_C",
        `(${n(p.capacitance)} F)(${n(q.voltage)} V)`,
        q.charge,
        "C",
      ),
      c(
        "energy",
        "Stored energy",
        "U = ½CV_C²",
        `½(${n(p.capacitance)} F)(${n(q.voltage)} V)²`,
        q.energy,
        "J",
      ),
    ];
  } else if (type === "fields") {
    const x = p.probeX,
      y = p.probeY,
      r1 = Math.hypot(x + p.separation / 2, y),
      r2 = Math.hypot(x - p.separation / 2, y),
      q = E.fieldAt(x, y, p);
    const terms = (component) =>
      [
        [-p.separation / 2, p.q1, r1],
        [p.separation / 2, p.q2, r2],
      ]
        .map(([cx, charge, r]) =>
          charge === 0
            ? "0 (zero charge)"
            : component === "V"
              ? `(${n(E.K_E)})(${n(charge)})/(${n(r)})`
              : `(${n(E.K_E)})(${n(charge)})(${n(component === "x" ? x - cx : y)})/(${n(r)})³`,
        )
        .join(" + ");
    variables = [
      v("q₁", "Left charge", p.q1, "C"),
      v("q₂", "Right charge", p.q2, "C"),
      v("d", "Charge separation", p.separation, "m"),
      v("xₚ", "Probe x", x, "m"),
      v("yₚ", "Probe y", y, "m"),
      v("kₑ", "Coulomb constant", E.K_E, "N m²/C²"),
    ];
    const excluded = "Not evaluated within 0.16 m of a nonzero point charge.";
    calculations = [
      c(
        "r1",
        "Distance to left charge",
        "r₁ = √[(xₚ + d/2)² + yₚ²]",
        `√[(${n(x)} + ${n(p.separation)}/2)² + (${n(y)})²]`,
        r1,
        "m",
      ),
      c(
        "r2",
        "Distance to right charge",
        "r₂ = √[(xₚ − d/2)² + yₚ²]",
        `√[(${n(x)} − ${n(p.separation)}/2)² + (${n(y)})²]`,
        r2,
        "m",
      ),
      c(
        "ex",
        "Horizontal electric field",
        "Eₓ = Σ kₑqᵢ(xₚ − xᵢ)/rᵢ³",
        q.valid ? terms("x") : excluded,
        q.ex,
        "N/C",
        "SI inputs. Left and right charges are at x = −d/2 and +d/2.",
      ),
      c(
        "ey",
        "Vertical electric field",
        "Eᵧ = Σ kₑqᵢyₚ/rᵢ³",
        q.valid ? terms("y") : excluded,
        q.ey,
        "N/C",
        "SI inputs; the charges lie on y = 0.",
      ),
      c(
        "potential",
        "Electric potential",
        "V = Σ kₑqᵢ/rᵢ",
        q.valid ? terms("V") : excluded,
        q.potential,
        "V",
        "Zero potential at infinite distance; SI inputs.",
      ),
    ];
    if (!q.valid)
      note = excluded + " Move the probe away to resume field calculations.";
  } else throw new RangeError(`Unknown model: ${type}`);
  return { type, time: s.t, variables, calculations, note };
}
