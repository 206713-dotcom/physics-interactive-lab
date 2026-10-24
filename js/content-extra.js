/** Original teaching notes. Each lab includes objectives, three investigations,
 * five worked questions, equations and explicit physical/visual assumptions. */
export const EXTRA_LESSONS = {
  pendulum: {
    description: "A familiar swing, beyond the small-angle approximation.",
    intro:
      "A pendulum is approximately harmonic only for small angles. This model keeps the full sine term so you can investigate the difference for yourself.",
    objectives: [
      "Relate restoring torque to angular acceleration.",
      "Investigate length, gravity and release angle.",
      "Explain why mass does not set the ideal period.",
    ],
    principles: [
      [
        "A circular constraint",
        "The mass follows an arc at a fixed distance from the pivot. The restoring component of gravity is proportional to sin θ.",
      ],
      [
        "When SHM works",
        "For angles in radians close to zero, sin θ ≈ θ. Large swings do not obey this approximation and have a longer period.",
      ],
      [
        "Energy on the move",
        "Potential energy is greatest at a turning point. Kinetic energy is greatest at the bottom. Damping transfers mechanical energy to heat.",
      ],
    ],
    equations: [
      [
        "Nonlinear motion",
        "θ̈ + βθ̇ + (g/L) sin θ = 0",
        "θ in radians · β in s⁻¹ · L in m",
      ],
      [
        "Small-angle approximation",
        "T₀ = 2π√(L/g)",
        "This is a reference value, not the exact large-angle period.",
      ],
      [
        "Energy",
        "E = ½mL²θ̇² + mgL(1 − cos θ)",
        "The lowest position has zero gravitational potential energy.",
      ],
      [
        "Energy loss",
        "dE/dt = −mL²βθ̇²",
        "With β = 0, mechanical energy is conserved.",
      ],
    ],
    experiments: [
      {
        title: "Length and time",
        text: "Start with the small-angle preset. Compare L = 0.75 m and L = 3.00 m, keeping everything else fixed.",
        predict: "Does four times the length mean four times the period?",
        result: "The small-angle period doubles, because T ∝ √L.",
        preset: "Small angle",
      },
      {
        title: "Test the approximation",
        text: "Compare 10° and 100° releases with no damping. Measure the time between successive peaks.",
        predict: "Will the small-angle reference predict both runs?",
        result:
          "The 100° release takes longer. The linear approximation sin θ ≈ θ is no longer accurate.",
        preset: "Wide swing",
      },
      {
        title: "A pendulum on the Moon",
        text: "Compare the small-angle motion on Earth and the Moon with the same length.",
        predict: "Does lower gravity speed up or slow down the swing?",
        result:
          "It slows down. The period scales as 1/√g, so the Moon period is about 2.46 times the Earth period.",
        preset: "Moon",
      },
    ],
    questions: [
      [
        "What is T₀ for L = 1 m and g = 9.81 m/s²?",
        "2π√(1/9.81) = 2.01 s. This assumes a small angular amplitude.",
      ],
      [
        "Why does doubling the bob mass not change the ideal period?",
        "Both gravitational torque and rotational inertia scale with mass, so mass cancels from the equation of motion.",
      ],
      [
        "Where is the bob fastest?",
        "At the lowest point, where gravitational potential energy is least and kinetic energy is greatest.",
      ],
      [
        "Is a 100° swing exact SHM?",
        "No. Angular acceleration is proportional to −sin θ, rather than to −θ.",
      ],
      [
        "What does damping change?",
        "It decreases mechanical energy and amplitude. Damping force is non-conservative, and the undamped small-angle formula is only a reference.",
      ],
    ],
    applications:
      "Pendulum clocks, seismometers and vibration sensors use the connection between periodic motion, gravity and inertia.",
    model:
      "A point bob is attached to a rigid massless link with a frictionless pivot. A rigid link is used so releases above 90° remain physically defined; a flexible string could go slack. Motion remains in one vertical plane in both camera views. RK4 uses 1/240 s steps; angular damping is linear in angular velocity. Bob size is illustrative.",
    source: [
      "OpenStax · Pendulums",
      "https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums",
    ],
  },
  projectile: {
    description: "One launch. Two ways to predict the path.",
    intro:
      "Resolve a launch into horizontal and vertical motion, then add quadratic air resistance to see where the familiar parabola stops being a good model.",
    objectives: [
      "Resolve velocity into horizontal and vertical components.",
      "Connect gravity with a curved trajectory.",
      "Compare ideal and drag-affected predictions.",
    ],
    principles: [
      [
        "Independent components",
        "Without drag, horizontal velocity is constant while vertical velocity changes at a constant rate −g.",
      ],
      [
        "Drag follows velocity",
        "The drag acceleration points opposite to velocity and has magnitude βv². Both components change.",
      ],
      [
        "Compare fairly",
        "The dashed path is a calculated vacuum reference using the same launch speed, angle, height and gravity. It is not another measurement.",
      ],
    ],
    equations: [
      [
        "Launch components",
        "vx₀ = u cos θ; vy₀ = u sin θ",
        "θ is measured above horizontal.",
      ],
      [
        "Vacuum trajectory",
        "x = u cos θ · t; y = h + u sin θ · t − ½gt²",
        "Uniform gravity; no wind or drag.",
      ],
      [
        "With quadratic drag",
        "v̇ = (0, −g) − β|v|v",
        "β is drag force per unit mass per squared speed, in m⁻¹.",
      ],
      [
        "Specific mechanical energy",
        "E/m = ½|v|² + gy",
        "In J/kg; drag removes specific energy at rate β|v|³.",
      ],
    ],
    experiments: [
      {
        title: "The 45° question",
        text: "Use the vacuum preset at ground level. Compare 30°, 45° and 60° launches at the same speed.",
        predict: "Which two angles give equal ranges?",
        result:
          "30° and 60° give the same range. At equal launch and landing height, 45° maximises the vacuum range.",
        preset: "Vacuum",
      },
      {
        title: "When air matters",
        text: "Load the air-resistance preset. Compare the coloured trail with the dashed zero-drag prediction.",
        predict: "Will drag change only the height?",
        result:
          "It changes both height and horizontal range. The path is no longer a symmetric parabola.",
        preset: "Air resistance",
      },
      {
        title: "Same launch, different world",
        text: "Try the Moon preset, then Earth, without drag.",
        predict: "How should range vary with gravity at zero launch height?",
        result:
          "Range is inversely proportional to g. The same ground-level Moon launch travels about 6.06 times as far as on Earth.",
        preset: "Moon",
      },
    ],
    questions: [
      [
        "Find vx and vy for u = 20 m/s at 30°.",
        "vx = 17.3 m/s and vy = 10.0 m/s, to 3 s.f.",
      ],
      [
        "At the top of a vacuum trajectory, is velocity zero?",
        "Only its vertical component is zero. The horizontal component remains u cos θ.",
      ],
      [
        "What is the ground-level vacuum range for u = 20 m/s, θ = 45°, g = 10 m/s²?",
        "R = u² sin(2θ)/g = 40 m.",
      ],
      [
        "Does doubling launch speed double the ideal range?",
        "At fixed angle, gravity and equal launch/landing height, range is proportional to u², so it quadruples.",
      ],
      [
        "Why does the specific energy graph decrease with drag?",
        "Drag opposes motion and does negative work. Its power per unit mass is −β|v|³.",
      ],
    ],
    applications:
      "Sports trajectories, water jets and ballistic calculations use these models. Real projectiles may also require lift, spin, wind and changing air density.",
    model:
      "A point projectile moves in a vertical plane above a flat ground under uniform gravity. Drag is quadratic with constant β; wind, lift and spin are omitted. RK4 uses 1/240 s steps. Ground contact is interpolated within the final step and stops the run. The ball marker is enlarged. Energy plots use J/kg, so no arbitrary projectile mass is assumed.",
    source: [
      "OpenStax · Projectile motion",
      "https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion",
    ],
  },
  collisions: {
    description: "Momentum survives a collision. Kinetic energy may not.",
    intro:
      "Launch two gliders along a frictionless rail and use restitution to move continuously from an elastic collision to sticking together.",
    objectives: [
      "Apply conservation of momentum.",
      "Distinguish elastic and inelastic collisions.",
      "Interpret signed velocities and restitution.",
    ],
    principles: [
      [
        "A closed system",
        "The carts exert equal and opposite forces during contact. No external horizontal impulse acts on the pair.",
      ],
      [
        "Energy is a separate question",
        "Kinetic energy is conserved only for e = 1. Inelastic collisions transfer some kinetic energy into deformation, heating and sound.",
      ],
      [
        "Signs tell direction",
        "Positive velocity means rightwards. Carts only collide if their initial separation decreases to contact.",
      ],
    ],
    equations: [
      [
        "Momentum conservation",
        "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂",
        "All velocities are signed.",
      ],
      [
        "Restitution",
        "v₂ − v₁ = e(u₁ − u₂)",
        "0 ≤ e ≤ 1; applies at an approaching contact.",
      ],
      ["Kinetic energy", "K = ½m₁v₁² + ½m₂v₂²", "Conserved for e = 1."],
      [
        "Energy transferred",
        "ΔK_loss = ½μ(1 − e²)(u₁ − u₂)²",
        "μ = m₁m₂/(m₁ + m₂).",
      ],
    ],
    experiments: [
      {
        title: "Exchange velocities",
        text: "Use equal masses, e = 1, cart A moving and B stationary.",
        predict: "Does A keep moving after contact?",
        result:
          "The carts exchange velocities. A stops and B leaves with the original velocity of A.",
        preset: "Elastic",
      },
      {
        title: "Make them stick",
        text: "Load the sticking preset. Compare momentum and kinetic energy before and after contact.",
        predict: "Can momentum stay constant when kinetic energy falls?",
        result:
          "Yes. Both carts share the centre-of-mass velocity after contact, while some kinetic energy transfers to internal energy.",
        preset: "Stick together",
      },
      {
        title: "A head-on encounter",
        text: "Use the head-on preset and vary the mass ratio.",
        predict: "Which cart changes velocity more strongly?",
        result:
          "The lighter cart experiences the larger velocity change for the same interaction impulse.",
        preset: "Head-on",
      },
    ],
    questions: [
      [
        "A 1 kg cart at 2 m/s sticks to a stationary 1 kg cart. Find their velocity.",
        "Total momentum is 2 kg m/s. Combined mass is 2 kg, so the final velocity is +1 m/s.",
      ],
      [
        "How much kinetic energy is lost in that collision?",
        "Initial K = 2 J; final K = 1 J. The 1 J difference becomes internal energy.",
      ],
      [
        "What does e = 1 mean?",
        "Relative separation speed equals relative approach speed; the collision is elastic in this model.",
      ],
      [
        "Can total momentum be zero while both carts move?",
        "Yes. Equal and opposite momenta cancel even when both kinetic energies are positive.",
      ],
      [
        "Why might no collision occur?",
        "If the carts separate, or the rear cart cannot catch the front cart, their gap never closes. Momentum conservation still holds.",
      ],
    ],
    applications:
      "Air-track experiments, vehicle impact analysis, billiards and particle collisions all use momentum conservation. Restitution is a useful idealisation of material response.",
    model:
      "Two carts of length 0.8 m start at centres x = −2 m and +2 m. Between collisions motion is exact uniform translation. Contact time is solved within a step and the conservation/restitution equations determine outgoing velocities exactly. There is no penetration correction, wall impact, friction or external horizontal force. The observation ends at 10 s.",
    source: [
      "OpenStax · Types of collisions",
      "https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions",
    ],
  },
  waves: {
    description: "A standing wave is two travelling waves working together.",
    intro:
      "Separate the component waves from their sum, and follow a probe on an ideal extended medium. Nothing needs to travel sideways for a wave to carry a pattern.",
    objectives: [
      "Apply the superposition principle.",
      "Connect speed, wavelength and frequency.",
      "Identify nodes, antinodes and partial standing waves.",
    ],
    principles: [
      [
        "Add displacement",
        "At each location and time, add the signed displacements of the incident and counter-propagating waves.",
      ],
      [
        "Equal counter-waves",
        "When the two amplitudes match, the result is a pure standing pattern with fixed nodes.",
      ],
      [
        "A point versus a pattern",
        "The probe records local oscillation. The spatial graph shows the shape of the medium at one instant. These are different measurements.",
      ],
    ],
    equations: [
      [
        "Wave relationship",
        "v = fλ; k = 2π/λ; ω = 2πf",
        "v in m/s · λ in m · f in Hz",
      ],
      [
        "Superposition",
        "y = A sin(kx − ωt) + RA sin(kx + ωt)",
        "R is the counter-wave amplitude divided by incident amplitude.",
      ],
      [
        "Pure standing wave, R = 1",
        "y = 2A sin(kx) cos(ωt)",
        "Node spacing is λ/2; maximum antinode amplitude is 2A.",
      ],
    ],
    experiments: [
      {
        title: "Follow a travelling wave",
        text: "Load the travelling preset. Compare the spatial profile with the probe history.",
        predict: "Does a crest remain above the same particle?",
        result:
          "No. The profile moves along x while a fixed point oscillates in the transverse direction.",
        preset: "Travelling",
      },
      {
        title: "Find a silent point",
        text: "Load the standing preset with λ = 2 m. Move the probe to x = 1 m, then x = 0.5 m.",
        predict: "Which position is a node?",
        result:
          "At x = 1 m the displacement is always zero. At x = 0.5 m it reaches the antinode amplitude 2A.",
        preset: "Standing",
      },
      {
        title: "Break the balance",
        text: "Load partial reflection. Compare it with R = 1.",
        predict:
          "Will the minimum-amplitude positions still stay perfectly still?",
        result:
          "No. Unequal component amplitudes leave a non-zero minimum envelope, so there are no permanent nodes.",
        preset: "Partial reflection",
      },
    ],
    questions: [
      ["What is f when v = 2 m/s and λ = 0.5 m?", "f = v/λ = 4 Hz."],
      ["What is the node spacing for λ = 2 m?", "λ/2 = 1 m."],
      [
        "Two equal component amplitudes are 0.25 m. What is the maximum antinode amplitude?",
        "2A = 0.50 m, twice either component amplitude.",
      ],
      [
        "Does a node move with the wave?",
        "For this pure standing wave it remains fixed in x and has zero displacement at every time.",
      ],
      [
        "Why does changing speed at fixed wavelength change frequency?",
        "The phase relationship requires v = fλ. Higher speed at the same wavelength means more cycles pass per second.",
      ],
    ],
    applications:
      "Musical instruments, microwave cavities, optical resonators and vibration analysis use interference and standing modes.",
    model:
      "Analytic sinusoidal waves on an ideal extended linear medium are displayed over x = 0–8 m. The visible endpoints are not imposed string boundaries. The counter-wave has equal frequency and an independently adjustable amplitude ratio. The 3D view is a ribbon representation; transverse height is exaggerated. No wave-energy or tension measurement is inferred from that illustrative ribbon.",
    source: [
      "OpenStax · Standing waves",
      "https://openstax.org/books/university-physics-volume-1/pages/16-6-standing-waves-and-resonance",
    ],
  },
  interference: {
    description: "Fine fringes, wrapped in a broad diffraction envelope.",
    intro:
      "Two coherent slits produce interference, but their finite widths also diffract the light. This lab includes both effects in the calculated screen intensity.",
    objectives: [
      "Investigate fringe spacing.",
      "Distinguish two-slit interference from single-slit diffraction.",
      "Use wavelength and apparatus dimensions with consistent units.",
    ],
    principles: [
      [
        "Two paths, one phase difference",
        "Path difference changes across the screen. The two slit contributions reinforce or cancel depending on their relative phase.",
      ],
      [
        "Slits have a width",
        "Each slit contributes a diffraction envelope that limits the brightness of the interference fringes.",
      ],
      [
        "Intensity is averaged",
        "The screen shows time-averaged intensity, normalised to the central maximum. The illustrated wavefront animation is slowed and enlarged.",
      ],
    ],
    equations: [
      [
        "Screen angle",
        "sin θ = y / √(L² + y²)",
        "y is screen displacement from the central axis.",
      ],
      [
        "Normalised intensity",
        "I/I₀ = sinc²(πa sin θ/λ) cos²(πd sin θ/λ)",
        "sinc z = sin z / z, with sinc 0 = 1.",
      ],
      [
        "Central fringe spacing",
        "Δy ≈ λL/d",
        "Small-angle approximation; individual finite-width slit envelope included.",
      ],
      [
        "Envelope first minimum",
        "|y₁| ≈ λL/a",
        "a is individual slit width, not the slit separation d.",
      ],
    ],
    experiments: [
      {
        title: "Colour changes the spacing",
        text: "Compare green and red light with the same apparatus.",
        predict: "Which produces wider fringes?",
        result:
          "Red light has a longer wavelength, so its fringes are farther apart.",
        preset: "Red light",
      },
      {
        title: "Separate the slits",
        text: "Use green light. Double d from 0.30 mm to 0.60 mm.",
        predict:
          "Does increasing slit separation widen the interference pattern?",
        result:
          "It halves the central fringe spacing. The single-slit envelope is unchanged if a stays fixed.",
        preset: "Green light",
      },
      {
        title: "Open the envelope",
        text: "Compare the default slit width with the narrow-slits preset.",
        predict: "Do narrower slits make the diffraction envelope narrower?",
        result:
          "No. Narrower individual slits broaden the envelope, so more interference fringes fit inside its central lobe.",
        preset: "Narrow slits",
      },
    ],
    questions: [
      [
        "For λ = 600 nm, L = 2 m and d = 0.30 mm, find Δy.",
        "Δy ≈ (600 × 10⁻⁹ × 2)/(0.30 × 10⁻³) = 0.004 m = 4.0 mm.",
      ],
      [
        "Why is the central fringe bright?",
        "The paths from both coherent slits to the central point are equal, so their waves arrive in phase.",
      ],
      [
        "What happens to spacing if L doubles?",
        "It doubles in the small-angle model.",
      ],
      [
        "Why do outer fringes become faint?",
        "The finite slit width imposes a diffraction envelope on the two-slit interference term.",
      ],
      [
        "Is the animated wavefront spacing the optical wavelength to scale?",
        "No. The diagram enlarges and slows the optical wavefronts. Numerical screen intensities use the actual specified wavelength and dimensions.",
      ],
    ],
    applications:
      "Interferometers measure tiny distances and wavelength changes. Diffraction patterns reveal structure, dimensions and coherence.",
    model:
      "The Fraunhofer far-field model assumes coherent monochromatic light, identical uniformly illuminated slits, and a distant screen. The plotted intensity includes the single-slit sinc² envelope. Finite screen geometry is used for sin θ; the spacing readout uses the central small-angle approximation. No photon detections are generated. Apparatus separation and wavefront spacing are schematic; the screen coordinate is calibrated.",
    source: [
      "OpenStax · Double-slit diffraction",
      "https://openstax.org/books/university-physics-volume-3/pages/4-3-double-slit-diffraction",
    ],
  },
  refraction: {
    description: "Change the medium. Bend the ray.",
    intro:
      "Explore Snell’s law, reflection and the transition to total internal reflection. Angles are always measured from the normal to the boundary.",
    objectives: [
      "Apply Snell’s law.",
      "Identify the conditions for total internal reflection.",
      "Relate refractive index, speed and wavelength.",
    ],
    principles: [
      [
        "A change of speed",
        "Light travels at c/n in a medium with refractive index n. Increasing n reduces its speed.",
      ],
      [
        "Frequency is continuous",
        "The light frequency stays constant across a stationary boundary. Its wavelength changes with speed.",
      ],
      [
        "A limit to transmission",
        "Only a transition from higher to lower index can reach a critical angle. Above it no propagating refracted ray exists.",
      ],
    ],
    equations: [
      ["Snell’s law", "n₁ sin i = n₂ sin r", "Angles from the normal."],
      [
        "Critical angle",
        "sin c = n₂/n₁, for n₁ > n₂",
        "For incident angles above c, total internal reflection occurs.",
      ],
      [
        "Speed and wavelength",
        "v = c/n; λmedium = λvacuum/n",
        "The frequency is unchanged.",
      ],
      [
        "Normal-incidence reflection",
        "R = ((n₁ − n₂)/(n₁ + n₂))²",
        "The lab uses the full unpolarised Fresnel expression at other angles.",
      ],
    ],
    experiments: [
      {
        title: "Towards the normal",
        text: "Launch from air to glass and vary the incident angle.",
        predict: "Is r smaller or larger than i?",
        result:
          "For n₂ > n₁, the ray bends towards the normal and r < i (except at normal incidence).",
        preset: "Air → glass",
      },
      {
        title: "Find the threshold",
        text: "Use glass to air and increase i slowly through about 42°.",
        predict: "What happens when the refracted ray reaches 90°?",
        result:
          "The critical angle is about 41.8°. Beyond it the transmitted propagating ray disappears.",
        preset: "Glass → air",
      },
      {
        title: "Trap the beam",
        text: "Load total reflection. Lower the incident angle below the critical angle.",
        predict: "When does a transmitted ray return?",
        result:
          "Transmission returns below the critical angle. Reflection remains, but its power is less than 100%.",
        preset: "Total reflection",
      },
    ],
    questions: [
      [
        "Find r for air to glass, n₁ = 1, n₂ = 1.5 and i = 30°.",
        "sin r = sin 30°/1.5 = 1/3, so r = 19.5°.",
      ],
      [
        "Find the critical angle from glass (n = 1.5) to air.",
        "c = asin(1/1.5) = 41.8°.",
      ],
      [
        "Can TIR occur from a lower-index to a higher-index medium?",
        "No. The critical-angle condition requires n₁ > n₂.",
      ],
      ["What is the speed in a medium with n = 1.5?", "c/n ≈ 2.00 × 10⁸ m/s."],
      [
        "What happens to 600 nm light when it enters n = 1.5 material?",
        "Its wavelength becomes 400 nm; its frequency remains constant. The displayed colour refers to the vacuum wavelength.",
      ],
    ],
    applications:
      "Optical fibres, lenses, prisms and refractometers rely on refraction and internal reflection.",
    model:
      "Two homogeneous, non-absorbing, non-dispersive media meet at a flat boundary. The ray direction follows Snell’s law. Reflected power is the average of s- and p-polarised Fresnel reflectances. Evanescent fields, dispersion, interference between layers and absorption are omitted. Pulses move slowly for illustration; camera motion does not change incidence angle.",
    source: [
      "OpenStax · Total internal reflection",
      "https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection",
    ],
  },
  circuits: {
    description: "Give an exponential a physical meaning.",
    intro:
      "A resistor controls how quickly charge reaches a capacitor. Follow voltage, current and charge while the capacitor charges or discharges.",
    objectives: [
      "Interpret an RC time constant.",
      "Connect current to the rate of charge transfer.",
      "Compare charging and discharging exponentials.",
    ],
    principles: [
      [
        "Charge builds voltage",
        "As charge builds on the capacitor, its voltage rises and less voltage is left across the resistor. Charging current therefore falls.",
      ],
      [
        "A characteristic time",
        "After one RC time constant, charging reaches 1 − 1/e ≈ 63.2% of the supply voltage. During discharge, 1/e ≈ 36.8% remains.",
      ],
      [
        "Current has a sign",
        "Positive current charges the chosen positive plate. Discharge current has the opposite direction.",
      ],
    ],
    equations: [
      ["Time constant", "τ = RC", "R in Ω · C in F · τ in s."],
      [
        "Charging from zero",
        "Vc = V₀(1 − e^(−t/τ)); I = (V₀/R)e^(−t/τ)",
        "Ideal voltage source and series resistor.",
      ],
      [
        "Discharging from V₀",
        "Vc = V₀e^(−t/τ); I = −(V₀/R)e^(−t/τ)",
        "The source is disconnected and the resistor closes the discharge loop.",
      ],
      [
        "Charge and energy",
        "Q = CVc; U = ½CVc²",
        "Stored energy is not conserved on its own; the source supplies work and the resistor dissipates heat.",
      ],
    ],
    experiments: [
      {
        title: "Mark one time constant",
        text: "Use the charge preset with R = 1000 Ω and C = 1000 µF. Pause at t ≈ 1 s.",
        predict: "Will Vc be half the 12 V supply?",
        result:
          "It is about 7.59 V, or 63.2% of 12 V. The time constant is 1 s.",
        preset: "Charge",
      },
      {
        title: "Slow the process",
        text: "Load slow charge and compare with the default resistance.",
        predict: "Which quantities change when only R increases?",
        result:
          "The time constant increases and the initial current decreases. The final capacitor voltage stays at the supply voltage.",
        preset: "Slow charge",
      },
      {
        title: "Reverse the flow",
        text: "Load discharge. Follow current and voltage on separate graphs.",
        predict: "Must voltage become negative when current reverses?",
        result:
          "No. Voltage remains positive and decreases; the chosen conventional current is negative because charge is leaving the positive plate.",
        preset: "Discharge",
      },
    ],
    questions: [
      ["Find τ for R = 2 kΩ and C = 500 µF.", "τ = 2000 × 500 × 10⁻⁶ = 1 s."],
      [
        "What fraction of discharge voltage remains after 2τ?",
        "e⁻² = 0.135, about 13.5%.",
      ],
      [
        "Does an ideal capacitor become fully charged in finite time?",
        "The ideal exponential approaches the supply asymptotically. At 5τ it is about 99.3% charged.",
      ],
      [
        "What happens to stored energy when voltage doubles?",
        "U = ½CV², so it quadruples at fixed capacitance.",
      ],
      [
        "Why is the charge animation not a literal picture of electron speed?",
        "The dots indicate conventional-current direction and relative magnitude. Their spacing, size and display speed are illustrative.",
      ],
    ],
    applications:
      "Timing circuits, camera flashes, filters, sensor smoothing and power electronics use capacitor charging and discharging.",
    model:
      "Exact exponential solutions describe an ideal series RC circuit. Charging starts at Vc = 0; discharge starts at Vc = V₀ with the supply disconnected. Changing mode starts a fresh run rather than switching a live capacitor. Very short time constants use slower playback and finer sampling for clarity. Dots indicate conventional current, not individual electrons. The run stops after six time constants.",
    source: [
      "OpenStax · RC circuits",
      "https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits",
    ],
  },
  fields: {
    description: "A vector landscape, built from two charges.",
    intro:
      "Move a non-disturbing probe through the field of fixed charges. Compare the vector sum of electric field with the scalar sum of potential.",
    objectives: [
      "Use Coulomb’s law and vector superposition.",
      "Distinguish field strength from potential.",
      "Interpret field lines without treating them as particle trajectories.",
    ],
    principles: [
      [
        "Direction matters",
        "Electric field points along the force on a positive test charge. Contributions from different charges must be added as vectors.",
      ],
      [
        "Potential adds differently",
        "Electric potential is scalar. Positive and negative contributions can cancel where the field remains non-zero.",
      ],
      [
        "Lines are a map",
        "Field-line tangents show field direction. They are geometric streamlines, not moving charges or simulated detections.",
      ],
      [
        "IGCSE: how objects become charged",
        "Rubbing can transfer electrons between materials; protons remain bound in nuclei. Losing electrons leaves a positive charge, gaining electrons leaves a negative charge. Mobile electrons move readily through conductors but not through insulators. Like charges repel and unlike charges attract.",
      ],
      [
        "IGCSE: charging by induction",
        "A nearby charged object redistributes mobile electrons in a conductor without contact. With a suitable earth connection, electrons can enter or leave; removing the earth before the inducing object can leave a net charge. This point-charge lab visualises the resulting fields; it does not solve mobile-charge redistribution inside a conductor.",
      ],
    ],
    equations: [
      [
        "Coulomb field",
        "E = Σ k qᵢ rᵢ / |rᵢ|³",
        "k = 8.9875517923 × 10⁹ N m²/C².",
      ],
      [
        "Electric potential",
        "V = Σ k qᵢ / rᵢ",
        "Zero potential at infinite separation; units V = J/C.",
      ],
      [
        "Test-charge force",
        "F = qtest E",
        "A negative test charge experiences force opposite to E.",
      ],
      [
        "Field and potential",
        "E = −∇V",
        "Field points in the direction of steepest potential decrease.",
      ],
    ],
    experiments: [
      {
        title: "Zero potential, real field",
        text: "Load the dipole and put the probe at x = 0, y = 0.",
        predict: "If the potential is zero, must the field vanish?",
        result:
          "No. The potentials cancel but the fields reinforce along the axis from positive to negative.",
        preset: "Dipole",
      },
      {
        title: "A field-free midpoint",
        text: "Load equal like charges. Inspect the midpoint.",
        predict: "Can field cancel while potential remains non-zero?",
        result:
          "Yes. The equal and opposite fields cancel, but both positive potentials add.",
        preset: "Like charges",
      },
      {
        title: "Check inverse square",
        text: "Load a single charge. Compare field strength at 1 m and 2 m from it, away from the exclusion disk.",
        predict: "How should field and potential each change?",
        result:
          "Doubling distance quarters field strength but only halves potential.",
        preset: "Single charge",
      },
    ],
    questions: [
      [
        "What direction is E near a positive charge?",
        "Radially outwards, along the force on a positive test charge.",
      ],
      [
        "Why do electric field lines not cross?",
        "A non-zero field has a unique direction at each point. Crossing tangents would imply two different directions.",
      ],
      [
        "Is zero potential the same as zero field?",
        "No. Potential is a scalar value; field depends on its spatial gradient. A dipole midpoint demonstrates the difference.",
      ],
      [
        "Find E at 1 m from a +1 µC point charge.",
        "E = kq/r² ≈ 8.99 × 10³ N/C, pointing away from the charge.",
      ],
      [
        "What happens to a negative test charge placed in this field?",
        "Its force is opposite to E because F = qE and q is negative. The probe here is passive and does not move.",
      ],
    ],
    applications:
      "Electrostatic sensing, particle deflection, capacitor design and charged-particle optics all depend on electric fields and potential.",
    model:
      "Two fixed ideal point charges lie on the x axis. The probe has no charge and does not affect them. Points within 0.16 m of a non-zero charge are excluded instead of softening Coulomb’s law. The 2D field map is a plane through the charges; the 3D view shows representative meridional field lines, with an illustrative line count. Normalised-direction midpoint integration traces streamlines. Graphs are spatial cuts at the current probe y, with gaps at excluded points.",
    source: [
      "OpenStax · Electric field lines",
      "https://openstax.org/books/university-physics-volume-2/pages/5-6-electric-field-lines",
    ],
  },
};
