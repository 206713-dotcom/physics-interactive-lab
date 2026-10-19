// Classroom copy is separated from simulation and rendering logic.
export const LESSONS = {
  spring: {
    title: "Simple harmonic motion",
    eyebrow: "01 / OSCILLATIONS",
    description: "One spring. A world of motion.",
    intro:
      "Explore how a restoring force turns displacement into a repeating rhythm. Change the system, predict what happens, then test your idea.",
    objectives: [
      "Connect restoring force and acceleration to displacement.",
      "Investigate how mass and stiffness determine the period.",
      "Explain energy transfer and the effect of damping.",
    ],
    principles: [
      [
        "A force towards equilibrium",
        "For an ideal Hookean spring, F = −kx. The minus sign means that the force always points back towards the equilibrium position. This horizontal model has no friction unless damping is added.",
      ],
      [
        "Watch the phase difference",
        "For undamped motion, at maximum displacement the velocity is zero, but the acceleration has its greatest magnitude. At equilibrium the speed is greatest. Acceleration is always opposite to displacement.",
      ],
      [
        "Energy changes form",
        "Elastic potential energy becomes kinetic energy and back again. Without damping, their sum stays constant. With damping, mechanical energy transfers to the surroundings as thermal energy.",
      ],
    ],
    equations: [
      [
        "Equation of motion",
        "m ẍ + b ẋ + kx = 0",
        "m: mass (kg) · b: damping coefficient (kg s⁻¹) · k: spring constant (N m⁻¹)",
      ],
      [
        "Undamped motion, released from rest",
        "x(t) = A cos(ω₀t)",
        "v(t) = −Aω₀ sin(ω₀t) · a(t) = −ω₀²x(t)",
      ],
      [
        "Natural frequency and period",
        "ω₀ = √(k/m)     T₀ = 2π√(m/k)",
        "f₀ = 1/T₀ · ω₀ in rad s⁻¹ · T₀ in s · f₀ in Hz",
      ],
      [
        "Mechanical energy",
        "E = ½mv² + ½kx²",
        "dE/dt = −bv² · energy is in joules (J)",
      ],
      [
        "With damping",
        "ζ = b / (2√(km))",
        "For ζ < 1: ωd = √(k/m − (b/2m)²). For ζ ≥ 1 there is no repeating oscillation.",
      ],
    ],
    experiments: [
      {
        title: "Does a heavier mass move slower?",
        text: "Use k = 20 N/m, A = 0.50 m and no damping. Compare m = 1 kg with m = 4 kg. Use the displacement graph to measure one full cycle.",
        predict: "Predict the ratio of the periods before running.",
        result: "The period doubles: T ∝ √m. The amplitude does not change.",
        preset: { mass: 1, k: 20, displacement: 0.5, damping: 0 },
      },
      {
        title: "Follow the energy",
        text: "Use m = 1 kg, k = 20 N/m and A = 0.50 m. Switch to the energy graph. Pause at a turning point and again near equilibrium.",
        predict: "Where will kinetic energy be greatest?",
        result:
          "At equilibrium, kinetic energy is greatest. At a turning point, energy is elastic potential. Total energy is 2.50 J throughout (within numerical error).",
        preset: { mass: 1, k: 20, displacement: 0.5, damping: 0 },
      },
      {
        title: "Find the edge of oscillation",
        text: "Use m = 1 kg and k = 4 N/m. Compare damping b = 0, 2, 4 and 6 kg/s. Restart after each change.",
        predict:
          "Which damping value returns the mass without oscillating, at the critical boundary?",
        result:
          "Critical damping occurs at b = 2√(km) = 4 kg/s. Larger b gives overdamping; smaller positive b gives decaying oscillations.",
        preset: { mass: 1, k: 4, displacement: 0.5, damping: 4 },
      },
    ],
    questions: [
      [
        "A 0.50 kg mass is attached to a 20 N/m spring. What is its undamped period?",
        "T = 2π√(0.50/20) = 0.993 s (3 s.f.). The period depends on mass and stiffness, not amplitude in this ideal model.",
      ],
      [
        "The initial displacement doubles. What happens to the period and total energy?",
        "The period stays the same for an ideal linear spring. Initial energy E = ½kA² increases by a factor of four.",
      ],
      [
        "At which position is the acceleration greatest in magnitude?",
        "At either turning point, where |x| is greatest. With no damping, a = −kx/m, so maximum |a| = k|A|/m.",
      ],
      [
        "Why does the total mechanical energy decrease when damping is added?",
        "The damping force −bv opposes velocity. Its power is Fv = −bv², so mechanical energy transfers to thermal energy in the surroundings. Total energy, including the surroundings, is conserved.",
      ],
      [
        "If the spring constant is multiplied by four, how does the natural frequency change?",
        "f₀ = √(k/m)/(2π), so the frequency doubles and the period halves. The restoring acceleration at a given displacement becomes four times as large.",
      ],
    ],
    applications:
      "Car suspension uses springs and dampers to control vibrations. Similar oscillator models describe building motion, precision balances and atoms vibrating near stable positions.",
    model:
      "The mass is a point object on a horizontal, frictionless surface; the spring is massless and linear. Displacement is measured from equilibrium and the initial velocity is zero. Damping is proportional to velocity. Spring length and block size are illustrative; the displacement ruler is calibrated in metres. RK4 uses fixed 1/240 s steps, independent of animation speed. Natural period and frequency remain labelled as undamped values when damping is present.",
    source: [
      "OpenStax · Oscillations",
      "https://openstax.org/books/university-physics-volume-1/pages/15-introduction",
    ],
  },
  gravity: {
    title: "Newton’s law of gravitation",
    eyebrow: "02 / GRAVITATION",
    description: "A small push. A different orbit.",
    intro:
      "Launch a satellite and discover how gravity bends its path. Explore the delicate balance between falling, orbiting and escaping.",
    objectives: [
      "Test the inverse-square relationship between force and separation.",
      "Connect launch speed with circular, elliptical and escape paths.",
      "Interpret negative and positive orbital mechanical energy.",
    ],
    principles: [
      [
        "Every mass attracts every other mass",
        "The magnitude of the gravitational force is GMm/r². Here r is the distance between the centres, not the height above the surface. Both objects experience equal and opposite forces.",
      ],
      [
        "An orbit is continuous free fall",
        "A satellite has sideways velocity while accelerating towards the central body. For a circular orbit the force changes the direction of velocity without changing its magnitude.",
      ],
      [
        "Energy tells a story",
        "With zero potential energy at infinite separation, bound orbits have negative total energy. Zero energy marks the ideal escape threshold, and positive energy allows an unbound path. A trajectory can still intersect the surface.",
      ],
    ],
    equations: [
      [
        "Universal gravitation",
        "F = GMm / r²",
        "G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻² · r: centre-to-centre separation (m)",
      ],
      [
        "Relative two-body acceleration",
        "r̈ = −G(M + m) r / |r|³",
        "r points from the central body to the satellite. The display follows the central body.",
      ],
      [
        "Circular and escape speeds",
        "vc = √(G(M + m)/r₀)     ve = √2 vc",
        "These are relative speeds. For m ≪ M, M + m ≈ M. Initial velocity is perpendicular to the separation.",
      ],
      [
        "Two-body mechanical energy",
        "E = ½μv² − GMm/r",
        "μ = Mm/(M + m) is reduced mass; v is relative speed. Energy is measured in the centre-of-mass frame.",
      ],
      [
        "Circular orbital period",
        "T = 2π√(r³ / G(M + m))",
        "For an ellipse replace r with the semimajor axis a. This ideal model omits atmosphere and other bodies.",
      ],
    ],
    experiments: [
      {
        title: "Put the inverse-square law to the test",
        text: "Use the Earth-like central mass and a 1,000 kg satellite. Set the initial distance to 15,000 km and note the initial force. Double it to 30,000 km and compare at t = 0.",
        predict: "Does twice the separation mean half the force?",
        result:
          "The new force is one quarter as large: F₂/F₁ = (r₁/r₂)² = ¼. Compare force immediately after reset, before the bodies move.",
        preset: "circular",
      },
      {
        title: "Turn a circle into an ellipse",
        text: "Launch the circular preset. Then choose the elliptical preset at 0.80 times circular speed. Watch the speed and distance graphs over one orbit.",
        predict: "Where should the satellite be moving fastest?",
        result:
          "It moves fastest at its closest approach. Gravity transfers potential energy into kinetic energy as separation decreases; total energy stays approximately constant.",
        preset: "elliptical",
      },
      {
        title: "Cross the escape threshold",
        text: "Compare the circular and escape presets. The escape preset launches at 1.50 times circular speed, just above √2 times circular speed.",
        predict:
          "Will a satellite moving away eventually stop feeling gravity?",
        result:
          "The escape path has positive total energy. Gravity weakens with distance but does not switch off; speed decreases towards a non-zero value far away.",
        preset: "escape",
      },
    ],
    questions: [
      [
        "If the centre-to-centre distance is tripled, what happens to gravitational force?",
        "It becomes 1/9 of the original force, because F ∝ 1/r² when both masses are unchanged.",
      ],
      [
        "Does a heavier satellite fall faster in the same gravitational field?",
        "Its acceleration due to the central body is GM/r², independent of its own mass. In this full two-body model a large satellite also moves the central body, so their relative acceleration depends on M + m.",
      ],
      [
        "Find the circular speed at r = 15,000 km around Earth (M = 5.9722 × 10²⁴ kg), assuming m ≪ M.",
        "vc = √(GM/r) = √[(6.67430 × 10⁻¹¹)(5.9722 × 10²⁴)/(1.50 × 10⁷)] ≈ 5.15 km/s. Convert kilometres to metres before calculating.",
      ],
      [
        "Why is orbital gravitational potential energy negative?",
        "We define U = 0 at infinite separation. Attractive gravity means work must be supplied to separate the masses, so at finite separation U = −GMm/r is below zero.",
      ],
      [
        "How does escape speed compare with circular speed at the same initial distance?",
        "ve = √2 vc ≈ 1.414 vc. At this threshold the total mechanical energy is zero. The orbit must also avoid the surface; launch direction matters for collision.",
      ],
    ],
    applications:
      "Orbital mechanics guides communications and weather satellites, spacecraft transfers and planetary exploration. The same inverse-square law explains moons, binary stars and planetary motion.",
    model:
      "An isolated Newtonian two-body system is integrated in relative coordinates with velocity Verlet at fixed 2 s steps. The camera follows the central body and is not an inertial frame; energy belongs to the centre-of-mass frame. The central sphere has constant Earth-like density and an absorbing surface: the run stops at impact. There is no drag, thrust, softening or relativistic correction. At 1×, 1 real second represents 1 simulated hour. Motion is planar even in the rotatable 3D view. Distances share a linear scale that automatically zooms out; the spacecraft, coordinate grid and atmospheric rim are illustrative. Gold v is relative velocity and coral a is relative acceleration; arrow lengths use separate capped display scales, so compare directions rather than lengths. Trails contain calculated positions only. Circular and escape thresholds, closest approach and ideal period are predictions from the initial two-body conic. A surface-crossing warning means the ideal conic intersects the absorbing sphere. Scenario buttons keep your masses and initial separation while changing speed. Energy error is normalised by the magnitude of launch potential energy, so zero-energy escape remains well defined. The view pauses at 100 initial separations to keep an escaping trajectory readable.",
    source: [
      "OpenStax · Satellite orbits and energy",
      "https://openstax.org/books/university-physics-volume-1/pages/13-4-satellite-orbits-and-energy",
    ],
  },
};
