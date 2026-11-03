// The template order matches textbook-practice.js: Foundation, Standard, Challenge.
// Vary the givens of the matched Halliday problem types without copying book text.
const templates = [
  [
    (n) => `A maintenance cart moving at ${8 + n} m/s comes to rest in ${3 + n % 5} s at constant acceleration. Find its acceleration and braking distance.`,
    (n) => `A trolley starts from rest and accelerates at 0.80 m/s² for ${5 + n} s. It then brakes at 1.2 m/s² until stationary. Calculate its total distance travelled.`,
    (n) => `Two carts are ${10 + n} m apart when they begin braking towards each other. Their speeds fall linearly from ${5 + n % 4} m/s and ${4 + n % 3} m/s to zero in 4.0 s and 3.0 s respectively. Use speed–time graph areas to decide whether they make contact.`,
  ],
  [
    (n) => `A steel ball leaves a horizontal bench at ${(1 + n / 10).toFixed(1)} m/s. The bench is 0.90 m high. With g = 9.81 m/s² and negligible drag, find the horizontal landing distance.`,
    (n) => `At the top of its flight, a ball moves at ${55 + n}% of its launch speed. Neglect drag. Find the launch angle above horizontal.`,
    (n) => `A ball is launched at 20 m/s at 45° towards a vertical net ${10 + n} m away. Neglect drag and use g = 9.81 m/s². Find its height above launch and the angle of its velocity to the horizontal at the net.`,
  ],
  [
    (n) => `A cable pulls a cart with a force of ${45 + n} N at 28° above horizontal. Find its horizontal and vertical components.`,
    (n) => `Two horizontal ropes exert forces of ${20 + n} N north and 30 N east on a ring. Find the magnitude and bearing of the third force needed for equilibrium.`,
    (n) => `A ${4 + n} kg crate is stationary on a smooth ramp inclined at 32° to horizontal. A rope pulls uphill at 15° above the ramp. With g = 9.81 m/s², find the rope tension and normal contact force.`,
  ],
  [
    (n) => `Two sensors are ${(0.25 + n / 20).toFixed(2)} m apart vertically in oil of density 850 kg/m³. Use g = 9.81 m/s² to find the pressure difference.`,
    (n) => `A pressure probe in seawater moves from 1.5 m depth to ${4 + n} m depth. Given density 1025 kg/m³, atmospheric pressure 101 kPa and g = 9.81 m/s², calculate the new absolute pressure and the increase in pressure.`,
    (n) => `A rigid water-filled vessel has an open vertical filler tube of cross-sectional area 2.0 cm². A volume of ${25 + 5 * n} cm³ is added to the tube without overflowing. Find the increase in force on a horizontal cover of area 15 cm². Use water density 1000 kg/m³ and g = 9.81 m/s².`,
  ],
  [
    (n) => `A point on a sinusoidal string wave takes ${12 + n} ms to move from a crest to its next equilibrium crossing. Find the period and frequency.`,
    (n) => `Two pulses leave a source together, moving at 300 m/s and 500 m/s along the same path. At a detector the arrivals are ${3 + n} ms apart. Calculate the distance to the source.`,
    (n) => `Adjacent nodes on a string are ${18 + n} cm apart. An antinode takes 7.0 ms to travel from equilibrium to its first extreme position. Determine the wavelength and speed of the progressive waves that produce the stationary wave.`,
  ],
  [
    (n) => `The adjacent displacement nodes of a stationary sound wave are ${15 + n} cm apart. The sound speed is 343 m/s. Determine its frequency.`,
    (n) => `An open pipe has a fundamental frequency of ${310 + 10 * n} Hz. A second pipe of the same length is closed at one end. Find the second pipe’s two lowest resonance frequencies. Ignore end corrections.`,
    (n) => `A tube ${(0.52 + n / 50).toFixed(2)} m long is open at both ends. Sound speed is 343 m/s. With negligible end corrections, determine every resonant frequency between 480 Hz and 1200 Hz.`,
  ],
  [
    (n) => `A 9.0 V supply provides 0.32 A for ${30 + 5 * n} s. Find the charge passing through the supply and the energy it delivers.`,
    (n) => `A 1.30 V rechargeable cell has internal resistance 0.22 Ω. A charging current of ${(0.20 + n / 20).toFixed(2)} A enters the positive terminal. What terminal voltage is needed?`,
    (n) => `A supply drives a ${2 + n} Ω series resistor and then a parallel combination of 8.0 Ω and 12.0 Ω. The current in the 12.0 Ω branch is 0.35 A. Calculate the supply voltage and the power dissipated by the series resistor.`,
  ],
  [
    (n) => `Two point masses of 14 kg and ${18 + n} kg are separated by 0.65 m. Find their gravitational force using G = 6.67 × 10⁻¹¹ N m²/kg².`,
    (n) => `Two probes orbit the same planet in circles. The outer radius is ${2 + n} times the inner radius. Find the ratios of outer to inner orbital speed and period.`,
    (n) => `Two bodies of masses M and 16M are treated as point masses ${450 + 25 * n} km apart. Find the distance from the smaller body to the point between them where their gravitational fields cancel.`,
  ],
  [
    (n) => `A sensor oscillates in SHM at 11 Hz with amplitude ${2 + n} mm. Calculate its maximum acceleration.`,
    (n) => `In SHM, a marker’s extreme positions are ${8 + n} cm apart. The travel time from one extreme to the other is 0.65 s. Calculate its amplitude, angular frequency and maximum speed.`,
    (n) => `A bead rests on a platform oscillating vertically in SHM at ${(2 + n / 10).toFixed(1)} Hz. Find the greatest amplitude for continuous contact, using g = 9.81 m/s², and identify the point in the cycle where the contact force is smallest.`,
  ],
  [
    (n) => `A cooling system removes ${12 + n} kJ from 0.16 kg of liquid water initially at 0 °C. Find the mass left unfrozen. The latent heat of fusion is 334 kJ/kg.`,
    (n) => `A 75 W heater is used for ${45 + 5 * n} s to warm 0.25 kg of water. The water receives 80% of the energy. Find its temperature rise using c = 4200 J/(kg K).`,
    (n) => `An insulated cup holds 0.24 kg of water at 36 °C. A piece of ice of mass ${20 + n} g at 0 °C is added. Determine whether all the ice melts and find the final temperature. Use c = 4200 J/(kg K) for water and latent heat of fusion 334 kJ/kg.`,
  ],
  [
    (n) => `At ${270 + 5 * n} K, calculate the mean translational kinetic energy per ideal-gas molecule. Use k = 1.38 × 10⁻²³ J/K.`,
    (n) => `A fixed amount of gas occupies 2.0 L at 100 kPa and 280 K. It is heated at fixed volume to ${290 + 5 * n} K, then expands isothermally to 3.5 L. Find its final pressure.`,
    (n) => `An air bubble of volume 0.60 cm³ rises from ${6 + n} m depth at 285 K to the surface at 295 K. Treat it as an ideal gas at the surrounding pressure, with a fixed amount of gas. Use water density 1000 kg/m³, g = 9.81 m/s² and atmospheric pressure 101 kPa. Find its final volume.`,
  ],
  [
    (n) => `An ion of charge 3.2 × 10⁻¹⁹ C moves at ${2 + n} × 10⁴ m/s at 35° to a uniform 0.24 T magnetic field. Find the magnetic force magnitude.`,
    (n) => `A beam travels perpendicular to crossed electric and magnetic fields and passes without deflection. The electric field is ${(1 + n / 10).toFixed(1)} kV/m and the magnetic field is 0.060 T. Find the beam speed.`,
    (n) => `Singly charged ions of mass 6.64 × 10⁻²⁷ kg accelerate from rest through ${250 + 20 * n} V. They enter a velocity selector at right angles to both fields. The electric field is 2.0 kV/m. What perpendicular magnetic field magnitude gives zero deflection? Use e = 1.60 × 10⁻¹⁹ C.`,
  ],
  [
    (n) => `A flat coil of area 0.015 m² is in a uniform 0.25 T field. Its normal is at ${20 + n}° to the field. Find the flux through one turn. The coil rotates while this angle stays constant. Is an emf induced?`,
    (n) => `A flexible loop lies perpendicular to a uniform 0.40 T field. Over 0.10 s its area decreases from 65 cm² to ${22 + n} cm². Calculate the mean emf magnitude.`,
    (n) => `A coil with ${75 + 5 * n} turns and area 22 cm² has its normal along a magnetic field. The field rises uniformly from zero to 0.45 T in 0.15 s and returns uniformly to zero in 0.090 s. Find both emf magnitudes and explain their relative directions.`,
  ],
  [
    (n) => `A light source emits at ${420 + 5 * n} nm. Calculate one photon’s energy, using h = 6.63 × 10⁻³⁴ J s and c = 3.00 × 10⁸ m/s.`,
    (n) => `The threshold wavelength of a metal is 540 nm. Light of wavelength ${345 + 5 * n} nm strikes it. Find the maximum photoelectron kinetic energy. Use h = 6.63 × 10⁻³⁴ J s and c = 3.00 × 10⁸ m/s.`,
    (n) => `At ${(6.5 + n / 20).toFixed(2)} × 10¹⁴ Hz, a photocathode has a stopping potential of 0.70 V. Increasing the frequency by 2.0 × 10¹⁴ Hz increases the stopping potential by ${(0.80 + n / 100).toFixed(2)} V. Estimate Planck’s constant and the threshold frequency. Use Eₖ,max = eVstop and e = 1.60 × 10⁻¹⁹ C.`,
  ],
  [
    (n) => `A source with initial activity ${600 + 40 * n} Bq has a half-life of 16 h. Find its activity after 48 h.`,
    (n) => `A hypothetical nucleus with mass number ${20 + n} has mass defect ${(0.16 + n / 100).toFixed(2)} u. Calculate its binding energy per nucleon using 1 u c² = 931.5 MeV.`,
    (n) => `A source has activity ${6 + n} kBq and a half-life of 2.5 h. Find how many undecayed nuclei it contains and how many decay over the next 5.0 h.`,
  ],
];

export function practiceVariants(groupIndex, level) {
  const template = templates[groupIndex][level - 1];
  // Ten early sets have one additional item: 45 originals + 45 × 21 + 10.
  const count = 21 + Number(groupIndex * 3 + level <= 10);
  return Array.from({ length: count }, (_, index) => template(index + 1));
}
