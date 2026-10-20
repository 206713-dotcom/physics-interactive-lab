/** Extension material: original explanations; reference equations linked below. */
export const ADVANCED_LESSONS = {
  binary: {
    description: "Gravity has no favourite centre.",
    intro:
      "A binary system contains two stars orbiting their shared centre of mass. Even the heavier star moves. This model follows both bodies in an inertial frame whose origin is the barycentre, so the symmetry and the mass ratio become visible.",
    objectives: [
      "Locate a barycentre using the two masses.",
      "Connect mass ratio to orbital radii and speeds.",
      "Distinguish circular, elliptical and unbound two-body trajectories.",
    ],
    principles: [
      [
        "Equal force, different acceleration",
        "Newton’s third law gives equal and opposite pair forces. Since a = F/m, the lower-mass star has the larger acceleration, orbital radius and speed. Equal force does not imply equal motion.",
      ],
      [
        "The centre of mass keeps moving uniformly",
        "Internal gravity cannot accelerate the system’s centre of mass. We choose initial positions and velocities with zero total momentum, placing the barycentre at rest at the origin. The integrator does not artificially recenter the stars each frame.",
      ],
      [
        "One separation, two paths",
        "For a circular binary, the relative separation is constant while each star traces a circle about the barycentre. Lower tangential launch speed gives an ellipse; above the escape threshold the relative path is unbound.",
      ],
      [
        "What the light means",
        "Glowing surfaces and coronas make each star identifiable. Colour and apparent size are illustrative, not a calculation of surface temperature, luminosity, spectral class or stellar radius. Trails contain actual integrated positions.",
      ],
    ],
    equations: [
      [
        "Centre of mass",
        "R = (m₁r₁ + m₂r₂)/(m₁ + m₂)",
        "Positions are vectors in metres. This frame has R = 0 and zero total momentum initially.",
      ],
      [
        "Orbital-radius ratio",
        "r₁/r₂ = m₂/m₁",
        "For a two-body system measured from its barycentre; r₁ + r₂ is the star separation.",
      ],
      [
        "Circular relative speed",
        "v_c = √[G(m₁ + m₂)/d]",
        "The relative speed is the sum of the oppositely directed barycentric speeds.",
      ],
      [
        "Circular reference period",
        "T₀ = 2π√[d³/G(m₁ + m₂)]",
        "A circular reference for the initial separation. For an ellipse, replace d by the relative semimajor axis.",
      ],
      [
        "Total mechanical energy",
        "E = ½m₁v₁² + ½m₂v₂² − Gm₁m₂/r₁₂",
        "Both kinetic terms use barycentric velocities. Gravitational potential is zero at infinity.",
      ],
    ],
    experiments: [
      {
        title: "Which star does the travelling?",
        text: "Choose Circular. Set A = 1 M☉ and B = 2 M☉. Compare their distances from the central cross and their speeds.",
        predict: "Which orbit is larger?",
        result:
          "A travels twice as far from the barycentre as B and has twice its speed. Both have the same period.",
        preset: "Circular",
      },
      {
        title: "Stretch a circle into an ellipse",
        text: "Load Elliptical. Watch both stars approach and recede. Compare separation, star speeds and total energy.",
        predict: "Where do they move fastest?",
        result:
          "They move fastest when closest. Kinetic and potential energy exchange while total mechanical energy remains approximately constant.",
        preset: "Elliptical",
      },
      {
        title: "Break the pair apart",
        text: "Load Escape. Compare the 1.50× launch with the ideal threshold √2 ≈ 1.414×.",
        predict: "Does gravitational attraction switch off as they escape?",
        result:
          "No. Attraction acts throughout the run and slows their separation. Positive total energy allows them to remain unbound.",
        preset: "Escape",
      },
    ],
    questions: [
      [
        "Stars of 1 M☉ and 2 M☉ are separated by 3 AU. Where is their barycentre?",
        "It is 2 AU from the 1 M☉ star and 1 AU from the 2 M☉ star: m₁r₁ = m₂r₂ and r₁ + r₂ = 3 AU.",
      ],
      [
        "Which star experiences the larger gravitational force?",
        "Neither. The two forces have equal magnitudes and opposite directions. Their accelerations differ because the masses differ.",
      ],
      [
        "How does doubling a circular binary’s separation affect its period?",
        "With fixed masses, T ∝ d^(3/2), so the period increases by 2√2 ≈ 2.83.",
      ],
      [
        "What is the period of two 1 M☉ stars separated by 1 AU in a circular orbit?",
        "About 0.707 yr, using T = 2π√[AU³/(2GM☉)]. The total mass is twice one solar mass.",
      ],
      [
        "Does negative total energy guarantee that two extended stars cannot collide?",
        "No. Negative energy indicates a bound ideal point-mass orbit, which might still pass through real stellar surfaces. This model omits extended-star structure and pauses near numerical close encounters.",
      ],
    ],
    applications:
      "Binary-star motions let astronomers infer stellar masses. Eclipses and Doppler shifts provide complementary information about orientation, period and velocities. This lab calculates orbital mechanics only; it does not simulate a light curve or a telescope observation.",
    model:
      "Unsoftened Newtonian point masses, no drag, radiation reaction, mass transfer or general relativity. Velocity Verlet uses a base step of 0.002 characteristic times and subdivides to at most 0.001 of the shortest pair dynamical time. A guard pauses before separation falls below 0.01 initial separations; it is a numerical exclusion, not a stellar surface or a merger. Auto-fit changes only the linear visual scale. Energy error is (E − E₀)/|U₀|; the run ends at 100 initial length scales from the origin.",
    source: [
      "OpenStax: satellite orbits and energy",
      "https://openstax.org/books/university-physics-volume-1/pages/13-4-satellite-orbits-and-energy",
    ],
  },
  threebody: {
    description: "Order is possible. Predictability is conditional.",
    intro:
      "Adding a third body creates a continuously changing force triangle. Most initial conditions do not produce a simple repeating path, yet special arrangements can. Explore a reference figure-eight choreography, a Lagrange equilateral configuration and a hierarchical triple, then perturb them.",
    objectives: [
      "Add gravitational acceleration as vectors from every other mass.",
      "Explain why the figure-eight is a special initial condition.",
      "Track total energy, momentum and pair separations in a three-body system.",
    ],
    principles: [
      [
        "Every pair matters",
        "Each star accelerates toward both other stars. The net acceleration is their vector sum. Individual stars can exchange energy while the total mechanical energy of the isolated system remains approximately conserved.",
      ],
      [
        "A remarkable figure eight",
        "The default uses equal masses and Simó’s published initial conditions. Each star follows the same planar curve at a different phase. The pattern is produced by integrating gravity; the animation never constrains a body to that curve.",
      ],
      [
        "Symmetry can be fragile",
        "An equilateral configuration has a rotating solution, but the equal-mass triangle is unstable to perturbations. The exact arrangement is not evidence that nearby triples remain triangular forever. Small numerical and physical disturbances can grow.",
      ],
      [
        "A hierarchy creates two time scales",
        "In the hierarchical preset, two stars begin as an inner binary and a third starts farther away. Their initial circular estimates are approximate: the third star still perturbs the inner pair, and the full three-body equations determine the later motion.",
      ],
      [
        "What a chaotic simulation can tell us",
        "A long-term detailed trajectory can become sensitive to initial values and numerical error. Conserved quantities and convergence tests help assess the calculation. A striking path alone is not a proof of chaos or long-term stability.",
      ],
    ],
    equations: [
      [
        "Acceleration of star i",
        "aᵢ = G Σⱼ≠ᵢ mⱼ(rⱼ − rᵢ)/|rⱼ − rᵢ|³",
        "Vector positions and SI units. There is no fixed central star.",
      ],
      [
        "All pair potentials",
        "U = −G(m₁m₂/r₁₂ + m₁m₃/r₁₃ + m₂m₃/r₂₃)",
        "Count each unordered pair once. U is not the sum of three independent central-star energies.",
      ],
      [
        "Momentum and angular momentum",
        "P = Σ mᵢvᵢ; L_z = Σ mᵢ(xᵢvᵧᵢ − yᵢvₓᵢ)",
        "No external force or torque: these are conserved in the continuous model.",
      ],
      [
        "Dimensionless to SI",
        "t* = √(ℓ³/GM_A); v* = √(GM_A/ℓ)",
        "The figure-eight reference has G = m₁ = m₂ = m₃ = 1. Scaling length and mass sets physical seconds and metres per second.",
      ],
    ],
    experiments: [
      {
        title: "Trace the choreography",
        text: "Load Figure eight and leave the masses equal, speed multiplier 1 and kick 0. Follow the coloured trails for several cycles.",
        predict: "Do all stars use the same path?",
        result:
          "Approximately yes: this special solution has a common figure-eight track with different phases. Small integration and initial-condition rounding errors remain.",
        preset: "Figure eight",
      },
      {
        title: "Disturb the symmetry",
        text: "Load Triangle, then set the Star C velocity kick to 1%. Follow the changing shape and compare total energy with each star’s speed.",
        predict: "Must energy conservation preserve the triangle?",
        result:
          "No. Conservation constrains the total energy; it does not preserve shape. The equal-mass equilateral relative equilibrium is unstable to perturbations.",
        preset: "Triangle",
      },
      {
        title: "A star beyond a binary",
        text: "Load Hierarchical. Compare the inner pair’s quick motion with the outer star’s slower path. Try a modest mass change.",
        predict: "Can the inner orbit be treated as entirely isolated?",
        result:
          "Only as an approximation. All three pair forces remain active, so the outer star perturbs the inner binary and can exchange energy with it.",
        preset: "Hierarchical",
      },
    ],
    questions: [
      [
        "How many distinct gravitational pairs are there in a three-star system?",
        "Three: AB, AC and BC. Each produces equal and opposite forces on its two members.",
      ],
      [
        "Can one star gain kinetic energy while the total system energy stays constant?",
        "Yes. Energy transfers between the bodies and between kinetic and gravitational potential energy. Only the isolated system’s total is conserved.",
      ],
      [
        "Will unequal masses follow the same reference figure eight used here?",
        "Not generally. This particular reference requires equal masses and its specified initial positions and velocities. Changing a mass changes the equations and the trajectory.",
      ],
      [
        "What happens to the characteristic time if the initial length scale doubles?",
        "It increases by 2^(3/2) ≈ 2.83 at fixed masses. The corresponding velocity scale decreases by √2.",
      ],
      [
        "Does a pair crossing the guard represent a simulated stellar collision?",
        "No. The integration pauses before an unresolved close encounter. The guard is 1% of the chosen initial length scale; stellar radii, collisions and mergers are not modelled.",
      ],
    ],
    applications:
      "Three-body dynamics appears in triple-star systems, planetary perturbations, spacecraft gravity assists and celestial-mechanics research. Real missions and observed stellar systems require fitted initial conditions, additional forces where relevant, and much more extensive error analysis than a classroom demonstration.",
    model:
      "Planar, isolated, unsoftened Newtonian point masses with barycentric initial coordinates. The integrator uses adaptive velocity-Verlet substeps and the same documented encounter guard as the binary lab. The figure-eight coordinates are taken from Montgomery’s UCSC reference, credited there to Carles Simó, and rounded to its published digits. The initial-length control is a scaling parameter, not a claim that all pair distances equal it. Stellar glow is illustrative, not radiation or evolution. Energy error is normalised by initial |U|. Detailed long-term trajectories of perturbed systems depend on numerical precision.",
    source: [
      "Richard Montgomery, UCSC: reference figure-eight initial conditions",
      "https://people.ucsc.edu/~rmont/NbdyB.html",
    ],
  },
  doublependulum: {
    description: "A tiny difference can grow into a different story.",
    intro:
      "A second pendulum attached to the first creates coupled nonlinear motion. The gold and cyan bobs form the main run; the violet twin starts with only a small change in its lower-rod angle. Every point in both trails comes from a separate integration of the same equations.",
    objectives: [
      "Define both angles from downward vertical and reconstruct bob positions.",
      "Explain energy exchange between coupled degrees of freedom.",
      "Distinguish sensitive dependence from random forcing and numerical error.",
    ],
    principles: [
      [
        "Two angles, one coupled system",
        "Both angles are absolute angles from the downward vertical. Moving the upper bob also moves the lower one. The lower bob’s velocity therefore contains contributions from both angular velocities.",
      ],
      [
        "Small swings and large swings differ",
        "For small amplitudes the system is approximately linear and supports two normal modes. Large releases can produce rotations and strong sensitive dependence. A complex-looking trace alone does not establish chaos for every setup.",
      ],
      [
        "The twin is a controlled comparison",
        "Only the twin’s initial lower angle changes by δ. Set δ to zero and the numerical runs coincide. For nonzero δ the initial energies may differ slightly; this is a nearby initial-condition comparison, not two identical energy states.",
      ],
      [
        "Conservation is a numerical check",
        "There is no damping or driving, so main-run mechanical energy should remain approximately constant. Its error is displayed against a fixed gravitational scale. Shorter time steps reduce numerical error, but chaotic long-term phases still separate.",
      ],
    ],
    equations: [
      [
        "Coordinates",
        "x₁ = L₁ sin θ₁; y₁ = −L₁ cos θ₁; x₂ = x₁ + L₂ sin θ₂; y₂ = y₁ − L₂ cos θ₂",
        "The fixed upper pivot is the origin; y points upward.",
      ],
      [
        "Upper equation, Δ = θ₁ − θ₂",
        "(m₁ + m₂)L₁α₁ + m₂L₂ cos Δ α₂ = −(m₁ + m₂)g sin θ₁ − m₂L₂ω₂² sin Δ",
        "Solve this and the lower equation together for the two angular accelerations.",
      ],
      [
        "Lower equation",
        "L₁ cos Δ α₁ + L₂α₂ = L₁ω₁² sin Δ − g sin θ₂",
        "Angles in radians, lengths in metres, angular accelerations in rad/s².",
      ],
      [
        "Kinetic energy",
        "K = ½(m₁ + m₂)L₁²ω₁² + ½m₂L₂²ω₂² + m₂L₁L₂ω₁ω₂ cos Δ",
        "The cross term accounts for the lower bob’s motion with the upper bob.",
      ],
      [
        "Potential energy above the lowest position",
        "U = (m₁ + m₂)gL₁(1 − cos θ₁) + m₂gL₂(1 − cos θ₂)",
        "Total mechanical energy E = K + U. The fixed pivot can exert force, so linear momentum need not be conserved.",
      ],
    ],
    experiments: [
      {
        title: "The exact-match test",
        text: "Load Chaotic release and set the twin difference to 0°. Run, pause and inspect the twin separation graph.",
        predict:
          "Should chaotic motion create a difference from exactly identical numerical states?",
        result:
          "No. The same deterministic numerical operations produce the same states. The twin tip separation remains zero.",
        preset: "Chaotic release",
      },
      {
        title: "Grow a small difference",
        text: "Load Chaotic release with δ = 0.01°. Watch the trajectories for 20–40 s and compare the separation graph.",
        predict: "Does a hundredth of a degree stay visually negligible?",
        result:
          "It can grow into a large positional difference for this nonlinear release. The separation can grow and shrink; no constant growth rate or Lyapunov exponent is claimed.",
        preset: "Chaotic release",
      },
      {
        title: "Return to small motion",
        text: "Load Small swings. Compare the smooth coupled oscillations with the large-angle release, keeping lengths and masses fixed.",
        predict: "Will the single-pendulum period describe both rods?",
        result:
          "Not generally. Even small motion is coupled and combines two normal-mode frequencies. Large motion needs the full nonlinear equations.",
        preset: "Small swings",
      },
    ],
    questions: [
      [
        "Are the two displayed rod angles measured relative to each other?",
        "No. Both are measured from downward vertical. Their difference Δ = θ₁ − θ₂ is the angle between them.",
      ],
      [
        "Why does the kinetic energy contain a cross term?",
        "The lower bob’s velocity is a vector sum of upper-link and lower-link contributions. Squaring that sum produces a dot product proportional to cos(θ₁ − θ₂).",
      ],
      [
        "For two 1 kg bobs on two 1 m rods released horizontally, what is U above the lowest position?",
        "θ₁ = θ₂ = 90°, so U = 2 × 9.81 × 1 + 1 × 9.81 × 1 = 29.43 J. Released from rest, the initial kinetic energy is zero.",
      ],
      [
        "Does a chaotic pendulum receive random forces in this model?",
        "No. The motion is deterministic. Sensitive dependence means small differences in initial conditions can grow, even without random input.",
      ],
      [
        "Would matching total energy guarantee matching future positions?",
        "No. Many combinations of angles and angular velocities share a total energy. Energy conservation is necessary for an accurate conservative calculation, but does not determine its full trajectory.",
      ],
    ],
    applications:
      "Coupled pendulums introduce normal modes, nonlinear dynamics, model validation and predictability. Related ideas appear in robotics, coupled mechanical structures and control. Real apparatus adds rod inertia, bearing friction and out-of-plane motion, which this idealisation omits.",
    model:
      "Two point masses, massless rigid rods, fixed frictionless pivot and uniform gravity. The coupled 2×2 equations are solved for angular accelerations inside RK4 at a maximum step of 1/480 s, reduced for faster parameter settings. No small-angle approximation or artificial noise is used. The violet twin is a second calculation; its slight rendered depth offset prevents visual overlap and is not a third spatial degree of freedom. Trails retain at most 1,200 measured model positions. The energy diagnostic divides E − E₀ by (m₁ + m₂)gL₁ + m₂gL₂, which remains meaningful near the zero-energy rest state. Numerical trajectories are not guarantees of indefinitely accurate chaotic prediction.",
    source: [
      "myPhysicsLab: double-pendulum equations and derivation",
      "https://www.myphysicslab.com/pendulum/double-pendulum-en.html",
    ],
  },
};
