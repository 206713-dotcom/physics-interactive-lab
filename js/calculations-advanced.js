import { G } from "./physics.js";
import * as A from "./physics-advanced.js";
const v = (symbol, label, value, unit = "") => ({ symbol, label, value, unit });
const c = (id, title, formula, substitution, value, unit = "", note = "") => ({
  id,
  title,
  formula,
  substitution,
  value,
  unit,
  note,
});

/** Share the original number formatter without a circular module dependency. */
export function advancedCalculationSheet(type, s, p, n) {
  let variables, calculations;
  if (type === "doublependulum") {
    const q = A.doubleSample(s, p),
      e = A.doubleEnergy(s, p),
      a = A.doubleAcceleration(s, p);
    const delta = s.theta1 - s.theta2;
    variables = [
      v("m₁", "Upper mass", p.m1, "kg"),
      v("m₂", "Lower mass", p.m2, "kg"),
      v("L₁", "Upper length", p.l1, "m"),
      v("L₂", "Lower length", p.l2, "m"),
      v("θ₁", "Upper angle", s.theta1, "rad"),
      v("θ₂", "Lower angle", s.theta2, "rad"),
      v("ω₁", "Upper angular speed", s.omega1, "rad/s"),
      v("ω₂", "Lower angular speed", s.omega2, "rad/s"),
      v("g", "Gravity", p.g, "m/s²"),
    ];
    calculations = [
      c(
        "lower-x",
        "Lower bob horizontal position",
        "x₂ = L₁ sin θ₁ + L₂ sin θ₂",
        `(${n(p.l1)}) sin(${n(s.theta1)}) + (${n(p.l2)}) sin(${n(s.theta2)})`,
        q.x,
        "m",
        "Angles in radians, lengths in metres; origin at the upper pivot.",
      ),
      c(
        "kinetic",
        "Main-run kinetic energy",
        "K = ½(m₁ + m₂)L₁²ω₁² + ½m₂L₂²ω₂² + m₂L₁L₂ω₁ω₂ cos Δ",
        `½(${n(p.m1 + p.m2)})(${n(p.l1)})²(${n(s.omega1)})² + ½(${n(p.m2)})(${n(p.l2)})²(${n(s.omega2)})² + (${n(p.m2 * p.l1 * p.l2 * s.omega1 * s.omega2)}) cos(${n(delta)})`,
        e.kinetic,
        "J",
        "Δ = θ₁ − θ₂. SI inputs. The cross term can be negative; total kinetic energy is nonnegative.",
      ),
      c(
        "potential",
        "Gravitational potential energy",
        "U = (m₁ + m₂)gL₁(1 − cos θ₁) + m₂gL₂(1 − cos θ₂)",
        `(${n((p.m1 + p.m2) * p.g * p.l1)})(1 − cos(${n(s.theta1)})) + (${n(p.m2 * p.g * p.l2)})(1 − cos(${n(s.theta2)}))`,
        e.potential,
        "J",
        "Zero at the lowest position; both angles are absolute angles from downward vertical.",
      ),
      c(
        "energy",
        "Total mechanical energy",
        "E = K + U",
        `(${n(e.kinetic)} J) + (${n(e.potential)} J)`,
        e.total,
        "J",
        "Main run only. The perturbed twin generally has a slightly different initial energy.",
      ),
      c(
        "acceleration",
        "Upper angular acceleration",
        "Aα₁ + Bα₂ = f₁; Cα₁ + Dα₂ = f₂",
        `α₁ = (f₁D − Bf₂)/(AD − BC) = ${n(a.alpha1)}`,
        a.alpha1,
        "rad/s²",
        "A=(m₁+m₂)L₁, B=m₂L₂cosΔ, C=L₁cosΔ, D=L₂. f₁=−(m₁+m₂)g sinθ₁−m₂L₂ω₂²sinΔ; f₂=L₁ω₁²sinΔ−g sinθ₂.",
      ),
    ];
  } else {
    const bodies = s.bodies,
      q = A.stellarInvariants(s),
      sample = A.stellarSample(s),
      a = A.stellarAccelerations(bodies),
      r = sample.r12;
    variables = bodies.map((b, i) =>
      v(`m${["₁", "₂", "₃"][i]}`, `Star ${"ABC"[i]} mass`, b.mass, "kg"),
    );
    variables.push(
      v("r₁₂", "A–B separation", r, "m"),
      v("G", "Gravity constant", G, "m³/(kg s²)"),
    );
    if (bodies.length === 3)
      variables.push(
        v("r₁₃", "A–C separation", sample.r13, "m"),
        v("r₂₃", "B–C separation", sample.r23, "m"),
      );
    else variables.push(v("d₀", "Initial separation", p.separation, "m"));
    const accTerms = bodies
      .slice(1)
      .map((b) => {
        const distance = Math.hypot(b.x - bodies[0].x, b.y - bodies[0].y);
        return `(${n(G)})(${n(b.mass)})(${n(b.x - bodies[0].x)})/(${n(distance)})³`;
      })
      .join(" + ");
    calculations = [
      c(
        "pair-force",
        "Force magnitude between A and B",
        "F₁₂ = Gm₁m₂/r₁₂²",
        `(${n(G)})(${n(bodies[0].mass)})(${n(bodies[1].mass)})/(${n(r)})²`,
        (G * bodies[0].mass * bodies[1].mass) / r ** 2,
        "N",
        "Equal and opposite forces on A and B. SI inputs; other pairs contribute separately.",
      ),
      c(
        "acceleration",
        "Star A horizontal acceleration",
        "a₁ₓ = G Σⱼ≠₁ mⱼ(xⱼ − x₁)/r₁ⱼ³",
        accTerms,
        a[0].x,
        "m/s²",
        "Signed x component of the vector sum, not a sum of force magnitudes.",
      ),
      c(
        "energy",
        "Total system energy",
        "E = Σ ½mᵢvᵢ² − Σᵢ<ⱼ Gmᵢmⱼ/rᵢⱼ",
        `K + U = (${n(q.kinetic)} J) + (${n(q.potential)} J)`,
        q.total,
        "J",
        "All barycentric kinetic energies and every distinct pair potential are included.",
      ),
      c(
        "barycentre",
        "Barycentre x coordinate",
        "Rₓ = Σ mᵢxᵢ / Σ mᵢ",
        `${bodies.map((b) => `(${n(b.mass)})(${n(b.x)})`).join(" + ")} divided by ${n(bodies.reduce((sum, b) => sum + b.mass, 0))}`,
        q.cx,
        "m",
        "The origin is set at the initial barycentre. Tiny nonzero values can reflect floating-point round-off; no frame-by-frame correction is applied.",
      ),
      type === "binary"
        ? c(
            "period",
            "Circular reference period",
            "T₀ = 2π√[d₀³/G(m₁ + m₂)]",
            `2π√[(${n(p.separation)})³/((${n(G)})(${n(p.m1 + p.m2)}))]`,
            2 * Math.PI * A.stellarTime(type, p),
            "s",
            "Reference at the chosen initial separation. Elliptical and escaping launches do not share this period.",
          )
        : c(
            "angular",
            "System angular momentum",
            "L_z = Σ mᵢ(xᵢvᵧᵢ − yᵢvₓᵢ)",
            bodies
              .map(
                (b) =>
                  `(${n(b.mass)})[(${n(b.x)})(${n(b.vy)}) − (${n(b.y)})(${n(b.vx)})]`,
              )
              .join(" + "),
            q.angular,
            "kg m²/s",
            "The unperturbed reference figure-eight has approximately zero angular momentum.",
          ),
    ];
  }
  return {
    type,
    time: s.t,
    variables,
    calculations,
    note: "Calculated from the current SI state. Displayed inputs are rounded; integration and results use full precision. Visual glow, bob sizes and stellar colours are illustrative.",
  };
}
