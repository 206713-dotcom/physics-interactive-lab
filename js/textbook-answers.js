const g = 9.81;
const tau = 2 * Math.PI;
const radians = Math.PI / 180;
const sin = (degrees) => Math.sin(degrees * radians);
const cos = (degrees) => Math.cos(degrees * radians);
const format = (value) => String(Number(value.toPrecision(4))).replace(/e\+?(-?\d+)$/, " × 10^$1");

// One row per topic in textbook-index.js, in Foundation, Standard, Challenge order.
// These are the 45 original prompts. The variants use the functions below.
export const originalAnswers = [
  [
    "a = (0 − 3.6)/2.4 = −1.50 m/s². Distance = average speed × time = 1.8 × 2.4 = 4.32 m.",
    "The trolley reaches 8.4 m/s. It travels ½ × 1.4 × 6.0² = 25.2 m while accelerating and 8.4²/(2 × 2.1) = 16.8 m while braking. Total distance = 42.0 m.",
    "The areas under the two braking graphs are ½ × 4.0 × 2.0 = 4.0 m and ½ × 3.0 × 4.0 = 6.0 m. Their combined stopping distance is 10.0 m, which exceeds the 9.0 m gap, so they collide.",
  ],
  [
    "The fall takes √(2 × 0.80/9.81) = 0.404 s. Horizontal distance = 1.5 × 0.404 = 0.606 m.",
    "At the highest point the vertical velocity is zero. The horizontal speed is constant, so cos θ = 0.60 and θ = 53.1°.",
    "Time to the screen is 8.0/(12 cos 35°) = 0.814 s. Using y = uᵧt − ½gt² gives 2.35 m above launch. At the screen vᵧ ≈ −1.10 m/s and vₓ ≈ 9.83 m/s, so the motion is 6.39° below horizontal.",
  ],
  [
    "Horizontal: 75 cos 24° = 68.5 N. Vertical: 75 sin 24° = 30.5 N upwards.",
    "The third force has components 32 N south and 24 N west. Its magnitude is 40.0 N and its direction is 36.9° west of south (bearing 216.9°).",
    "Along the ramp, T cos 20° = mg sin 30°, so T = 31.3 N. Perpendicular to the ramp, N = mg cos 30° − T sin 20° = 40.3 N.",
  ],
  [
    "Δp = ρgΔh = 820 × 9.81 × 0.65 = 5.23 kPa. The lower sensor reads higher.",
    "Final absolute pressure = 101 kPa + ρg × 7.0 m = 171.7 kPa. The increase is ρg × 5.0 m = 50.5 kPa.",
    "The column rises by 90/1.8 = 50 cm. Δp = 1000 × 9.81 × 0.50 = 4905 Pa. Multiply by 12 × 10⁻⁴ m² to get an increase of 5.89 N.",
  ],
  [
    "Crest to equilibrium takes T/4. T = 72 ms and f = 1/T = 13.9 Hz.",
    "The arrival time difference is d(1/320 − 1/480) = 0.0050 s. Therefore d = 4.80 m.",
    "The wavelength is twice the node spacing, or 0.48 m. The antinode takes one quarter of a period to reach its first extreme, so T = 0.032 s. The speed is λ/T = 15.0 m/s.",
  ],
  [
    "λ = 2 × 0.20 = 0.40 m. Therefore f = 344/0.40 = 860 Hz.",
    "For equal lengths the closed pipe’s fundamental is half the open pipe’s: 210 Hz. Only odd harmonics occur, so the next frequency is 630 Hz.",
    "The fundamental is 346/(2 × 0.72) = 240.3 Hz. The second harmonic (480.6 Hz) is below the sweep and the sixth (1441.7 Hz) is above it. The resonances are 720.8 Hz, 961.1 Hz and 1201.4 Hz.",
  ],
  [
    "Q = It = 0.40 × 90 = 36 C. Energy transferred = VQ = 7.5 × 36 = 270 J.",
    "Charging drives current into the positive terminal, so V = emf + Ir = 1.25 + 0.70 × 0.18 = 1.376 V.",
    "The parallel voltage is 0.40 × 9.0 = 3.6 V, so the 6.0 Ω branch carries 0.60 A. Total current is 1.0 A. The series drop is 2.0 V, giving a supply voltage of 5.6 V and total power of 5.6 W.",
  ],
  [
    "F = Gm₁m₂/r² = 6.67 × 10⁻¹¹ × 12 × 18/0.75² = 2.56 × 10⁻⁸ N.",
    "For a circular orbit v ∝ r⁻¹ᐟ², so vB/vA = 1/3. Since T = 2πr/v, TB/TA = 27.",
    "Let x be the distance from M. Equal opposing fields require M/x² = 9M/(1200 − x)². This gives x = 300 km. You must be nearer the smaller mass for its field to match the larger mass’s field.",
  ],
  [
    "aₘₐₓ = (2πf)²A = (2π × 12)² × 0.0040 = 22.7 m/s².",
    "The amplitude is half the extreme-to-extreme distance, or 7.0 cm. That journey takes half a period, so T = 1.60 s and ω = 3.93 rad/s.",
    "Contact first fails at the highest point, where downward acceleration is greatest. Set ω²A = g to get A = 9.81/(2π × 3.0)² = 0.0276 m.",
  ],
  [
    "Mass frozen = Q/L = 27/334 = 0.0808 kg. Liquid remaining = 0.15 − 0.0808 = 0.0692 kg.",
    "Heat delivered to the water = 0.75 × 60 × 90 = 4050 J. ΔT = Q/(mc) = 4.82 K.",
    "Cooling the warm water to 0 °C could release 29.4 kJ. Melting the ice takes 10.02 kJ, so all of it melts. The remaining 19.38 kJ warms 0.23 kg of water to 20.1 °C.",
  ],
  [
    "Mean translational kinetic energy = 3kT/2 = 8.49 × 10⁻²¹ J.",
    "Heating at fixed volume raises the pressure to 120 × 350/280 = 150 kPa. During isothermal expansion pV stays constant, so the final pressure is 150 × 1.8/3.0 = 90.0 kPa.",
    "At depth the absolute pressure is 101 kPa + ρgh = 218.72 kPa. With a fixed amount of gas, pV/T is constant, giving Vsurface = 0.40 × (218.72/101) × (298/285) = 0.906 cm³.",
  ],
  [
    "F = |q|vB sin θ = 3.2 × 10⁻¹⁹ × 2.0 × 10⁵ × 0.15 × sin 30° = 4.8 × 10⁻¹⁵ N.",
    "For zero deflection |q|E = |q|vB, so v = E/B = 2400/0.080 = 3.0 × 10⁴ m/s.",
    "Energy conservation gives v = √(2eV/m) ≈ 1.47 × 10⁵ m/s. Balancing electric and magnetic forces gives B = E/v = 0.0204 T.",
  ],
  [
    "No emf is induced. The magnetic flux Φ = BA cos θ is constant because the area, field strength and angle stay constant.",
    "The area change has magnitude 20 cm² = 0.0020 m². The mean emf magnitude is B|ΔA|/Δt = 0.30 × 0.0020/0.080 = 7.50 mV.",
    "Use |emf| = NA|ΔB|/Δt. The magnitudes are 0.648 V during the rise, zero on the plateau and 1.296 V during the fall. The nonzero emfs have opposite directions because the flux changes in opposite senses.",
  ],
  [
    "E = hc/λ = (6.63 × 10⁻³⁴)(3.00 × 10⁸)/(470 × 10⁻⁹) = 4.23 × 10⁻¹⁹ J.",
    "Subtract the threshold photon energy: Eₖ,max = hc(1/λ − 1/λ₀) = 1.33 × 10⁻¹⁹ J.",
    "From eVstop = h(f − f₀), the slope gives h = eΔV/Δf = 6.64 × 10⁻³⁴ J s. Substituting the first measurement gives f₀ = 4.83 × 10¹⁴ Hz.",
  ],
  [
    "54 h is three half-lives. The activity falls to 960/2³ = 120 Bq.",
    "Using neutral atomic masses so the electron masses cancel, Δm = 2mH + 2mn − mHe = 0.030377 u. The binding energy per nucleon is Δm × 931.5/4 = 7.07 MeV.",
    "λ = ln 2/(3.0 × 3600 s). From A = λN, N = 1.87 × 10⁸ nuclei. After two half-lives a quarter remain, so 1.40 × 10⁸ nuclei decay.",
  ],
];

const variantAnswers = [
  [
    (n) => {
      const u = 8 + n, t = 3 + n % 5;
      return `Use a = −u/t and s = ut/2. Acceleration = ${format(-u / t)} m/s². Braking distance = ${format(u * t / 2)} m.`;
    },
    (n) => {
      const t = 5 + n, v = 0.8 * t;
      return `The peak speed is ${format(v)} m/s. Add the accelerating distance ½at² to the braking distance v²/(2 × 1.2). Total distance = ${format(0.4 * t ** 2 + v ** 2 / 2.4)} m.`;
    },
    (n) => {
      const gap = 10 + n;
      const first = 2 * (5 + n % 4), second = 1.5 * (4 + n % 3);
      const distance = first + second;
      return `The triangular areas are ${format(first)} m and ${format(second)} m, giving ${format(distance)} m in total versus a ${gap} m gap. ${distance >= gap ? "They make contact." : "They stop without touching."}`;
    },
  ],
  [
    (n) => `The fall takes √(2 × 0.90/g) = ${format(Math.sqrt(1.8 / g))} s. Multiply by the horizontal speed to get ${format((1 + n / 10) * Math.sqrt(1.8 / g))} m.`,
    (n) => `At the apex, only the horizontal component remains. cos θ = ${(55 + n) / 100}, so θ = ${format(Math.acos((55 + n) / 100) / radians)}°.`,
    (n) => {
      const vx = 20 * cos(45), t = (10 + n) / vx, vy = 20 * sin(45) - g * t;
      const angle = Math.atan2(vy, vx) / radians;
      return `Find t = distance/vₓ, then use y = uᵧt − ½gt² and vᵧ = uᵧ − gt. The ball is ${format(20 * sin(45) * t - 0.5 * g * t ** 2)} m above launch and is moving ${format(Math.abs(angle))}° ${angle >= 0 ? "above" : "below"} horizontal.`;
    },
  ],
  [
    (n) => `Resolve with Fₓ = F cos 28° and Fᵧ = F sin 28°. Horizontal component = ${format((45 + n) * cos(28))} N. Vertical component = ${format((45 + n) * sin(28))} N upwards.`,
    (n) => `Balance the existing forces with components ${20 + n} N south and 30 N west. The resultant magnitude is ${format(Math.hypot(20 + n, 30))} N and its bearing is ${format(180 + Math.atan2(30, 20 + n) / radians)}°.`,
    (n) => {
      const weight = (4 + n) * g, tension = weight * sin(32) / cos(15);
      return `Balance forces along the ramp: T cos 15° = mg sin 32°, giving T = ${format(tension)} N. Perpendicular to the ramp, N = mg cos 32° − T sin 15° = ${format(weight * cos(32) - tension * sin(15))} N.`;
    },
  ],
  [
    (n) => `Use Δp = ρgΔh. The lower sensor reads ${format(850 * g * (0.25 + n / 20) / 1000)} kPa higher.`,
    (n) => `Use p = patm + ρgh. Final absolute pressure = ${format(101 + 1.025 * g * (4 + n))} kPa. The increase is ${format(1.025 * g * (4 + n - 1.5))} kPa.`,
    (n) => {
      const height = (25 + 5 * n) / 200;
      return `Added volume divided by tube area gives a rise of ${format(height)} m. Multiply ρgΔh by 15 × 10⁻⁴ m². The force increases by ${format(1000 * g * height * 0.0015)} N.`;
    },
  ],
  [
    (n) => `Crest to equilibrium is a quarter-period. T = ${4 * (12 + n)} ms and f = 1/T = ${format(1000 / (4 * (12 + n)))} Hz.`,
    (n) => `The arrival delay is d(1/300 − 1/500). Converting the delay to seconds gives d = ${format((3 + n) / 1000 / (1 / 300 - 1 / 500))} m.`,
    (n) => `The wavelength is twice the node spacing, or ${format(2 * (18 + n) / 100)} m. A quarter-period is 7.0 ms, so T = 0.028 s and v = λ/T = ${format(2 * (18 + n) / 100 / 0.028)} m/s.`,
  ],
  [
    (n) => `Adjacent nodes are λ/2 apart. Use f = v/λ to obtain ${format(343 / (2 * (15 + n) / 100))} Hz.`,
    (n) => {
      const fundamental = (310 + 10 * n) / 2;
      return `The closed pipe’s fundamental is half the open pipe’s. Its next mode is the third harmonic. The two frequencies are ${fundamental} Hz and ${3 * fundamental} Hz.`;
    },
    (n) => {
      const fundamental = 343 / (2 * (0.52 + n / 50));
      const harmonics = [];
      for (let m = Math.ceil(480 / fundamental); m <= Math.floor(1200 / fundamental); m++) {
        harmonics.push(`${format(m * fundamental)} Hz`);
      }
      return `The fundamental is v/(2L) = ${format(fundamental)} Hz. Keep the integer multiples in the sweep: ${harmonics.join(", ")}.`;
    },
  ],
  [
    (n) => {
      const charge = 0.32 * (30 + 5 * n);
      return `Use Q = It and E = VQ. Charge = ${format(charge)} C. Energy = ${format(9 * charge)} J.`;
    },
    (n) => `Charging current enters the positive terminal, so V = emf + Ir = ${format(1.3 + (0.2 + n / 20) * 0.22)} V.`,
    (n) => {
      const current = 0.35 + (12 * 0.35) / 8, resistance = 2 + n;
      return `The parallel branches share 4.2 V. The 8.0 Ω branch carries 0.525 A, giving 0.875 A total. V = 4.2 + IR = ${format(4.2 + current * resistance)} V. Series-resistor power I²R = ${format(current ** 2 * resistance)} W.`;
    },
  ],
  [
    (n) => `Substitute into F = Gm₁m₂/r². The attraction is ${format(6.67e-11 * 14 * (18 + n) / 0.65 ** 2)} N.`,
    (n) => `Equating gravity to centripetal force gives v ∝ r⁻¹ᐟ². With T = 2πr/v, T ∝ r³ᐟ². The outer-to-inner ratios are ${format((2 + n) ** -0.5)} for speed and ${format((2 + n) ** 1.5)} for period.`,
    (n) => `The larger mass must be four times as far away for the fields to match. The cancellation point is one fifth of the separation from the smaller mass, or ${format((450 + 25 * n) / 5)} km.`,
  ],
  [
    (n) => `Use aₘₐₓ = (2πf)²A with amplitude in metres. The maximum acceleration is ${format((tau * 11) ** 2 * (2 + n) / 1000)} m/s².`,
    (n) => {
      const amplitude = (8 + n) / 200, omega = tau / 1.3;
      return `The amplitude is half the separation, ${format(amplitude)} m. T = 2 × 0.65 = 1.30 s, so ω = ${format(omega)} rad/s. Maximum speed ωA = ${format(omega * amplitude)} m/s.`;
    },
    (n) => `At the top of the motion, acceleration is most downward and the contact force is smallest. Set (2πf)²A = g to get A = ${format(g / (tau * (2 + n / 10)) ** 2)} m.`,
  ],
  [
    (n) => `The mass frozen is Q/L = ${format((12 + n) / 334)} kg. Subtract from 0.16 kg to get ${format(0.16 - (12 + n) / 334)} kg of liquid.`,
    (n) => `The water receives 0.80Pt. Dividing by mc gives a temperature rise of ${format(0.8 * 75 * (45 + 5 * n) / (0.25 * 4200))} K.`,
    (n) => {
      const ice = (20 + n) / 1000, melt = ice * 334000;
      const available = 0.24 * 4200 * 36;
      return `Cooling the warm water to 0 °C could supply ${format(available / 1000)} kJ. Melting the ice needs ${format(melt / 1000)} kJ, so all the ice melts. Divide the remaining energy by the combined heat capacity to get ${format((available - melt) / ((0.24 + ice) * 4200))} °C.`;
    },
  ],
  [
    (n) => `Mean translational kinetic energy = 3kT/2 = ${format(1.5 * 1.38e-23 * (270 + 5 * n))} J.`,
    (n) => `At constant volume p ∝ T. During the isothermal expansion pV is constant. The final pressure is 100 × (${290 + 5 * n}/280) × (2.0/3.5) = ${format(100 * (290 + 5 * n) / 280 * 2 / 3.5)} kPa.`,
    (n) => {
      const pressure = 101 + g * (6 + n);
      return `The initial absolute pressure is patm + ρgh = ${format(pressure)} kPa. Using constant pV/T gives Vfinal = 0.60 × (pinitial/101) × (295/285) = ${format(0.6 * pressure / 101 * 295 / 285)} cm³.`;
    },
  ],
  [
    (n) => `Use F = |q|vB sin θ. The magnitude is ${format(3.2e-19 * (2 + n) * 1e4 * 0.24 * sin(35))} N.`,
    (n) => `For zero deflection |q|E = |q|vB. Therefore v = E/B = ${format((1 + n / 10) * 1000 / 0.06)} m/s.`,
    (n) => {
      const speed = Math.sqrt(2 * 1.6e-19 * (250 + 20 * n) / 6.64e-27);
      return `Use ½mv² = eV to find v = ${format(speed)} m/s. The electric and magnetic forces must oppose and balance. B = E/v = ${format(2000 / speed)} T.`;
    },
  ],
  [
    (n) => `Flux through one turn is BA cos θ = ${format(0.25 * 0.015 * cos(20 + n))} Wb. There is no induced emf because the flux stays constant as the coil rotates.`,
    (n) => `Convert the area change to m² and use |emf| = B|ΔA|/Δt. The mean emf is ${format(0.4 * (65 - (22 + n)) * 1e-4 / 0.1)} V.`,
    (n) => {
      const change = (75 + 5 * n) * 0.0022 * 0.45;
      return `Using |emf| = NA|ΔB|/Δt gives ${format(change / 0.15)} V during the rise and ${format(change / 0.09)} V during the fall. The directions are opposite because the flux changes in opposite senses.`;
    },
  ],
  [
    (n) => `Convert the wavelength to metres and use E = hc/λ. The photon energy is ${format(6.63e-34 * 3e8 / ((420 + 5 * n) * 1e-9))} J.`,
    (n) => `Use Eₖ,max = hc(1/λ − 1/λ₀). The maximum kinetic energy is ${format(6.63e-34 * 3e8 * (1 / ((345 + 5 * n) * 1e-9) - 1 / (540e-9)))} J.`,
    (n) => {
      const h = 1.6e-19 * (0.8 + n / 100) / 2e14;
      const threshold = (6.5 + n / 20) * 1e14 - 1.6e-19 * 0.7 / h;
      return `Using eVstop = h(f − f₀), h = eΔV/Δf = ${format(h)} J s. Substitute the first measurement to obtain f₀ = ${format(threshold)} Hz.`;
    },
  ],
  [
    (n) => `48 h is three half-lives. Divide the initial activity by 8 to get ${format((600 + 40 * n) / 8)} Bq.`,
    (n) => `Multiply the mass defect by 931.5 MeV/u and divide by the mass number. The binding energy per nucleon is ${format((0.16 + n / 100) * 931.5 / (20 + n))} MeV.`,
    (n) => {
      const population = (6 + n) * 1000 * 9000 / Math.LN2;
      return `The decay constant is ln 2/(2.5 × 3600 s). N = A/λ gives ${format(population)} nuclei. Five hours is two half-lives, so three quarters decay: ${format(0.75 * population)} nuclei.`;
    },
  ],
];

export function practiceAnswer(group, level, variant) {
  return variant === 0 ? originalAnswers[group][level - 1] : variantAnswers[group][level - 1](variant);
}
