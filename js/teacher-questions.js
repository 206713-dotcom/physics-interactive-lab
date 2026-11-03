// Wiley chapter numbers refer to Fundamentals of Physics, Extended, 10th ed.
// Cambridge numbers refer to the 9702 syllabus for examinations in 2025–2027.
export const teacherSets = [
  {
    id: "motion", title: "Motion and momentum", stage: "AS",
    syllabus: "2.1, 3.3", chapters: "2, 4, 9",
    scope: "Constant acceleration and conservation of linear momentum in one dimension.",
    questions: [
      ["A test cart moving at 2.0 m/s accelerates uniformly at 0.60 m/s² for 5.0 s. Calculate its final speed.", "v = u + at = 2.0 + 0.60 × 5.0 = 5.0 m/s."],
      ["A 0.40 kg cart moving east at 3.0 m/s couples to a 0.60 kg cart moving west at 0.50 m/s. Find their common velocity. External impulse is negligible.", "Take east as positive. Total momentum = 0.40 × 3.0 − 0.60 × 0.50 = 0.90 kg m/s. Divide by 1.00 kg to get 0.90 m/s east."],
      ["A 0.20 kg cart starts from rest and accelerates uniformly at 1.6 m/s² over 1.25 m. It then couples to a stationary 0.30 kg cart. Calculate the kinetic energy lost in the collision. External impulse during the collision is negligible.", "Before impact, v² = 2as = 4.0 m²/s², so v = 2.0 m/s and kinetic energy is 0.40 J. Momentum conservation gives a common speed of 0.80 m/s. Final kinetic energy is 0.16 J, so the loss is 0.24 J."],
    ],
  },
  {
    id: "solids", title: "Moments and deformation", stage: "AS",
    syllabus: "4.1–4.2, 6.1", chapters: "12",
    scope: "Perpendicular lever arms, equilibrium and Young modulus.",
    questions: [
      ["A 16 N force acts perpendicular to a lever 0.25 m from its pivot. Calculate the moment about the pivot.", "Moment = force × perpendicular distance = 16 × 0.25 = 4.0 N m."],
      ["A light horizontal beam is pivoted at its centre. A 12 N load hangs 0.30 m left of the pivot. Where on the right should an 8.0 N load hang for equilibrium?", "Balance the moments: 12 × 0.30 = 8.0 × d. The load hangs 0.45 m to the right."],
      ["A light horizontal beam is in equilibrium on a central pivot. A 24 N load hangs 0.20 m to the left. A vertical wire pulls down 0.60 m to the right. The wire is 1.20 m long, has area 0.20 mm² and Young modulus 2.0 × 10¹¹ Pa. Calculate its extension within the proportional region.", "Moment balance gives a wire tension of 8.0 N. Convert the area to 2.0 × 10⁻⁷ m². Using E = FL/(AΔL), ΔL = 2.4 × 10⁻⁴ m, or 0.24 mm."],
    ],
  },
  {
    id: "waves", title: "Waves and superposition", stage: "AS",
    syllabus: "7.1, 8.1, 8.3", chapters: "16, 17, 35",
    scope: "Wave speed, stationary-wave nodes and coherent interference.",
    questions: [
      ["A ripple has frequency 8.0 Hz and wavelength 0.15 m. Calculate its speed.", "v = fλ = 8.0 × 0.15 = 1.2 m/s."],
      ["Adjacent nodes on a vibrating string are 0.18 m apart. Its driving frequency is 75 Hz. Calculate the speed of the waves on the string.", "The node spacing is λ/2, so λ = 0.36 m. The speed is 75 × 0.36 = 27 m/s."],
      ["Two coherent loudspeakers emit in phase at 680 Hz. Sound speed is 340 m/s. At P the distances to the speakers are 2.30 m and 3.05 m. Predict the interference at P, then find the next higher frequency for constructive interference at the same point.", "λ = 0.50 m and the path difference is 0.75 m = 1.5λ, so the interference is destructive. Constructive interference next occurs when the path difference is 2λ, giving λ = 0.375 m and f ≈ 907 Hz."],
    ],
  },
  {
    id: "circuits", title: "Current and DC circuits", stage: "AS",
    syllabus: "9.2–9.3, 10.1–10.3", chapters: "26, 27",
    scope: "Resistance, potential dividers, internal resistance and Kirchhoff’s laws.",
    questions: [
      ["A 47 Ω resistor carries 0.20 A. Calculate the potential difference across it.", "V = IR = 0.20 × 47 = 9.4 V."],
      ["An unloaded potential divider has 150 Ω above its output and 100 Ω below it. An ideal 10.0 V supply is across both resistors. Calculate the output relative to the lower terminal.", "The output is across the 100 Ω resistor. Vout = 10.0 × 100/(150 + 100) = 4.0 V."],
      ["A 9.0 V cell of internal resistance 1.0 Ω supplies 6.0 Ω and 3.0 Ω resistors in parallel. Find the power dissipated by the 6.0 Ω resistor.", "The parallel equivalent is 2.0 Ω. Total current = 9.0/(1.0 + 2.0) = 3.0 A. The terminal voltage is 6.0 V, so P = V²/R = 6.0 W in the 6.0 Ω branch."],
    ],
  },
  {
    id: "gravity", title: "Circular motion and gravity", stage: "A2",
    syllabus: "12.1–12.2, 13.2–13.3", chapters: "4, 13",
    scope: "Centripetal acceleration and Newtonian gravity for circular orbits.",
    questions: [
      ["A sensor moves at 6.0 m/s around a circle of radius 2.0 m. Calculate its centripetal acceleration.", "a = v²/r = 36/2.0 = 18 m/s², directed towards the centre."],
      ["At distance r from a spherical planet’s centre the gravitational field strength is 8.0 N/kg. Calculate it at distance 2.5r, with both points outside the planet.", "g ∝ 1/r², so g = 8.0/(2.5²) = 1.28 N/kg, about 1.3 N/kg."],
      ["Two satellites orbit the same planet in circles. The outer orbit radius is four times the inner radius. Find the ratios of outer to inner orbital speed and period.", "Equate GM/r² with v²/r to obtain v ∝ r⁻¹ᐟ², giving a speed ratio of 1/2. Since T = 2πr/v, the period ratio is 4/(1/2) = 8."],
    ],
  },
  {
    id: "thermal", title: "Ideal gases and thermodynamics", stage: "A2",
    syllabus: "15.2, 16.1–16.2", chapters: "18, 19",
    scope: "The ideal gas equation and the first law, with work directions stated explicitly.",
    questions: [
      ["A sealed rigid vessel holds ideal gas at 300 K and 120 kPa. Calculate the pressure at 360 K.", "With n and V fixed, p/T is constant. p = 120 × 360/300 = 144 kPa."],
      ["A gas absorbs 540 J by heating and does 210 J of work on a piston. Calculate its change in internal energy.", "ΔU = energy supplied by heating + work done on the gas = 540 − 210 = +330 J."],
      ["An ideal gas at 150 kPa expands from 2.0 L to 3.0 L at constant pressure. The initial temperature is 320 K and the gas receives 480 J by heating. Find the final temperature and change in internal energy.", "At fixed p and n, T ∝ V, so T = 480 K. The gas does pΔV = 150 000 × 0.0010 = 150 J of work. ΔU = 480 − 150 = +330 J."],
    ],
  },
  {
    id: "oscillations", title: "Simple harmonic motion", stage: "A2",
    syllabus: "17.1–17.2", chapters: "15",
    scope: "The restoring acceleration, period and energy of SHM.",
    questions: [
      ["An oscillator completes 12 cycles in 18 s. Find its period and angular frequency.", "T = 18/12 = 1.5 s. ω = 2π/T = 4.2 rad/s."],
      ["An oscillator has angular frequency 5.0 rad/s and displacement +0.080 m. Find its acceleration.", "a = −ω²x = −2.0 m/s². It points back towards equilibrium."],
      ["A 0.50 kg mass performs undamped SHM with angular frequency 8.0 rad/s and amplitude 0.10 m. Find its speed at displacement +0.060 m using energy.", "Total energy is ½mω²A² = 0.160 J. Potential energy is ½mω²x² = 0.0576 J. From ½mv² = 0.1024 J, the speed is 0.64 m/s."],
    ],
  },
  {
    id: "quantum", title: "Photons and the photoelectric effect", stage: "A2",
    syllabus: "22.1–22.2", chapters: "38",
    scope: "Photon energy, threshold frequency and maximum photoelectron kinetic energy.",
    questions: [
      ["Calculate the energy of a photon of frequency 6.0 × 10¹⁴ Hz. Use h = 6.63 × 10⁻³⁴ J s.", "E = hf = 3.98 × 10⁻¹⁹ J, or 4.0 × 10⁻¹⁹ J to two significant figures."],
      ["A metal has work function 3.3 × 10⁻¹⁹ J. Its surface is illuminated by photons of energy 5.0 × 10⁻¹⁹ J. Find the maximum photoelectron kinetic energy.", "Eₖ,max = hf − Φ = 5.0 × 10⁻¹⁹ − 3.3 × 10⁻¹⁹ = 1.7 × 10⁻¹⁹ J."],
      ["A metal has threshold frequency 5.0 × 10¹⁴ Hz. Light of wavelength 400 nm shines on it. Find the maximum photoelectron kinetic energy and explain how it changes when the light intensity doubles at fixed wavelength. Use c = 3.00 × 10⁸ m/s and h = 6.63 × 10⁻³⁴ J s.", "f = c/λ = 7.50 × 10¹⁴ Hz. Eₖ,max = h(f − f₀) = 1.66 × 10⁻¹⁹ J. Doubling intensity increases photon arrival rate but leaves each photon’s energy unchanged, so the maximum kinetic energy stays the same."],
    ],
  },
];
