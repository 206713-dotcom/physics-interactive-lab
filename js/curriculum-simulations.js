import * as P from "./curriculum-physics.js";
import { chargedTiming } from "./field-geometry.js";
import { heatingWindow, coolingClock } from "./thermal-geometry.js";
import {
  PRACTICAL_LABS,
  PRACTICAL_PARAMETERS,
  PRACTICAL_WORK,
  PRACTICAL_INFO,
} from "./practical-labs.js";
// Parameter metadata is shared by sliders, the calculation inspector and CSV headers.
const number = (
  key,
  label,
  unit = "",
  factor = 1,
  hint = "Change one variable, then compare the calculated readings.",
) => ({ key, label, unit, factor, hint });
const choice = (
  key,
  label,
  options,
  hint = "Select a model, then inspect its assumptions.",
) => ({ key, label, options, hint });
export const PARAMETERS = {
  ...PRACTICAL_PARAMETERS,
  measurement: [
    number("length", "Object length", "m"),
    number("resolution", "Ruler division", "mm", 0.001),
    number("count", "Oscillations counted"),
    number("period", "True model period", "s"),
    number("reaction", "Reaction uncertainty per endpoint", "s"),
  ],
  motion: [
    choice("mode", "Experiment", [
      [0, "Horizontal cart"],
      [1, "Vertical free fall (+ down)"],
    ]),
    number("mass", "Mass", "kg"),
    number("force", "Applied horizontal force", "N"),
    number("initial", "Initial velocity", "m/s"),
    number(
      "drag",
      "Linear drag coefficient",
      "kg/s",
      1,
      "Drag = −bv. Terminal velocity is F/b when b > 0.",
    ),
    number("g", "Gravitational field strength", "N/kg"),
  ],
  vectors: [
    number("a", "Vector A, along +x", "N"),
    number("b", "Vector B magnitude", "N"),
    number("angle", "Angle from A to B", "°"),
  ],
  moments: [
    number("m1", "Left mass", "kg"),
    number("m2", "Right mass", "kg"),
    number("d1", "Left lever arm", "m"),
    number("d2", "Right lever arm", "m"),
    number("tilt", "Separate block: tilt", "°"),
    number("height", "Centre-of-mass height", "m"),
    number("width", "Support width", "m"),
  ],
  buoyancy: [
    number(
      "density",
      "Object density",
      "kg/m³",
      1,
      "Denser than the liquid: sinks. Less dense: rises and floats. A change releases the cube again.",
    ),
    number(
      "fluid",
      "Liquid density",
      "kg/m³",
      1,
      "A denser liquid supplies more upthrust for the same submerged volume.",
    ),
    number(
      "volume",
      "Object volume",
      "L",
      0.001,
      "Volume changes both mass and maximum upthrust. The cube and tank share one length scale.",
    ),
    number(
      "depth",
      "Pressure probe depth",
      "m",
      1,
      "Separate pressure column: this changes ρgh, not the depth of the 0.50 m motion tank.",
    ),
  ],
  energy: [
    number("mass", "Lifted mass", "kg"),
    number("height", "Target height", "m"),
    number("power", "Input power", "W"),
    number("efficiency", "Efficiency", "%", 0.01),
    choice(
      "resource",
      "Energy supply",
      [
        [0, "Hydroelectric"],
        [1, "Wind"],
        [2, "Solar"],
        [3, "Fossil fuel"],
        [4, "Nuclear"],
        [5, "Tidal"],
      ],
      "Supply cards explain energy pathways. The same ideal lifting load is used for comparison.",
    ),
  ],
  gases: [
    choice(
      "state",
      "Particle view",
      [
        [0, "Solid (schematic)"],
        [1, "Liquid (schematic)"],
        [2, "Ideal gas"],
      ],
      "Only the gas uses pV = nRT. Particles represent a tiny illustrative subset.",
    ),
    number("temperature", "Absolute temperature", "K"),
    number("volume", "Gas volume", "L", 0.001),
    number("amount", "Amount of gas", "mol"),
  ],
  expansion: [
    number("length", "Original length", "m"),
    number("temperature", "Temperature rise", "K"),
    number("alpha", "Linear expansion coefficient", "10⁻⁶ /K", 1e-6),
  ],
  calorimetry: [
    choice("mode", "Material model", [
      [0, "Water: ice → steam"],
      [1, "Single phase, custom c"],
    ]),
    number("mass", "Mass", "kg"),
    number("power", "Heater power", "W"),
    number("initial", "Initial temperature", "°C"),
    number(
      "capacity",
      "Custom specific heat capacity",
      "J/(kg K)",
      1,
      "Used only in the single-phase model. Water uses piecewise ice/water/steam values.",
    ),
  ],
  heat: [
    choice("mode", "Transfer mechanism", [
      [0, "Conduction"],
      [1, "Convection"],
      [2, "Thermal radiation"],
    ]),
    number("hot", "Hot reservoir", "°C"),
    number("cold", "Cold surroundings", "°C"),
    number("area", "Transfer area", "m²"),
    number("thickness", "Conduction thickness", "m"),
    number("conductivity", "Thermal conductivity", "W/(m K)"),
    number("emissivity", "Emissivity"),
  ],
  wavefronts: [
    choice("mode", "Boundary", [
      [0, "Single gap: diffraction"],
      [1, "Reflection at a wall"],
    ]),
    number("frequency", "Frequency", "Hz"),
    number("speed", "Wave speed", "m/s"),
    number("gap", "Gap width", "m"),
  ],
  mirror: [
    number("angle", "Angle to the normal", "°"),
    number("distance", "Object distance", "m"),
  ],
  lenses: [
    choice("kind", "Lens type", [
      [1, "Converging"],
      [-1, "Diverging"],
    ]),
    number("focal", "Focal length magnitude", "cm", 0.01),
    number("object", "Object distance", "cm", 0.01),
    number("height", "Object height", "cm", 0.01),
  ],
  dispersion: [
    number("wavelength", "Vacuum wavelength", "nm", 1e-9),
    number("angle", "Incident angle", "°"),
    number("a", "Cauchy coefficient A"),
    number("b", "Cauchy coefficient B", "μm²"),
  ],
  spectrum: [
    number("exponent", "log₁₀(wavelength / m)"),
    number("amplitude", "Illustrative field amplitude"),
  ],
  sound: [
    number("frequency", "Sound frequency", "Hz"),
    number("temperature", "Air temperature", "°C"),
    number("distance", "Reflector distance", "m"),
    number("amplitude", "Relative pressure amplitude"),
  ],
  dc: [
    choice("mode", "Circuit topology", [
      [0, "Series resistors"],
      [1, "Parallel resistors"],
      [2, "Unloaded potential divider"],
      [3, "Wire + series resistor"],
    ]),
    number("voltage", "Supply potential difference", "V"),
    number("r1", "Resistance R₁", "Ω"),
    number("r2", "Resistance R₂ / load", "Ω"),
    number("length", "Wire length", "m"),
    number("area", "Wire cross-sectional area", "mm²", 1e-6),
    number("rho", "Wire resistivity", "10⁻⁸ Ω m", 1e-8),
  ],
  devices: [
    choice("mode", "Device model", [
      [0, "Diode + resistor"],
      [1, "Ideal relay threshold"],
      [2, "Ideal overcurrent cut-out"],
    ]),
    number("voltage", "Supply voltage", "V"),
    number("resistance", "Load resistance", "Ω"),
    number("threshold", "Relay pick-up voltage", "V"),
    number("rating", "Cut-out current rating", "A"),
  ],
  magnetism: [
    choice("mode", "Magnetic source", [
      [0, "Long air-core solenoid"],
      [1, "Long straight wire (probe at 5 cm)"],
    ]),
    number("current", "Conventional current", "A"),
    number("turns", "Coil turns"),
    number("length", "Solenoid length", "m"),
  ],
  charged: [
    number("field", "Magnetic field (+ out of screen)", "mT", 0.001),
    number("speed", "Initial speed along +x", "10⁶ m/s", 1e6),
    choice("charge", "Charge sign", [
      [-1, "Negative (−e)"],
      [1, "Positive (+e)"],
    ]),
    number("mass", "Particle mass", "10⁻³¹ kg", 1e-31),
  ],
  induction: [
    choice("mode", "Machine", [
      [0, "AC generator (imposed rotation)"],
      [1, "DC motor (imposed rotation)"],
    ]),
    number("field", "Uniform magnetic field", "T"),
    number("area", "Coil area", "m²"),
    number("turns", "Coil turns"),
    number("frequency", "Rotation frequency", "Hz"),
    number("current", "Motor coil current", "A"),
  ],
  transformer: [
    number("vp", "Primary RMS voltage", "V"),
    number("np", "Primary turns"),
    number("ns", "Secondary turns"),
    number("load", "Resistive secondary load", "Ω"),
    number("resistance", "Separate transmission-line resistance", "Ω"),
  ],
  atom: [
    number("protons", "Proton number Z"),
    number("neutrons", "Neutron number N"),
    number("charge", "Ion charge / e"),
    choice("decay", "Investigation", [
      [0, "Rutherford scattering"],
      [1, "Alpha equation"],
      [2, "Beta-minus equation"],
      [3, "Gamma equation"],
    ]),
    number("impact", "Alpha impact parameter", "pm", 1e-12),
    number("energy", "Alpha kinetic energy", "MeV", 1e6),
  ],
  radioactivity: [
    number("nuclei", "Initial nuclei"),
    number("halfLife", "Half-life", "s"),
    number("background", "Background rate", "s⁻¹"),
    number("thickness", "Absorber thickness", "cm"),
    number("mu", "Linear attenuation coefficient", "cm⁻¹"),
    number("seed", "Reproducible random seed"),
  ],
  earthmoon: [
    number("day", "Initial day of year"),
    number("latitude", "Observer latitude", "°"),
    number("tilt", "Axial tilt", "°"),
    number("lunarDay", "Initial lunar age", "days"),
  ],
  solarsystem: [
    choice(
      "planet",
      "Selected planet",
      P.PLANETS.map((x, i) => [i, x[0]]),
    ),
    number(
      "scale",
      "Orbital radius multiplier",
      "×",
      1,
      "1× uses an adopted mean orbital radius. Circular reference orbits; planet sizes are enlarged.",
    ),
  ],
  stars: [
    number("mass", "Initial stellar mass", "M☉"),
    choice("stage", "Evolution storyboard", [
      [0, "Cloud → protostar"],
      [1, "Main sequence"],
      [2, "Giant / supergiant"],
      [3, "Nebula / supernova"],
      [4, "Stellar remnant"],
    ]),
    number(
      "temperature",
      "Independent spectrum temperature",
      "K",
      1,
      "Sets Wien peak only; no stellar structure solver links this slider to the evolutionary stage.",
    ),
  ],
  universe: [
    number("distance", "Galaxy distance", "Mpc"),
    number("hubble", "Hubble constant", "10⁻¹⁸ s⁻¹", 1e-18),
    number("wavelength", "Rest wavelength", "nm", 1e-9),
    number(
      "scale",
      "Scale-factor increase",
      "×",
      1,
      "CMB temperature scales as 1/a. This is a separate expansion illustration, not a fitted cosmology.",
    ),
  ],
};
// [result key, readable label, unit, equation, substitution]. All values come from sampleCurriculum.
const W = (key, title, unit, formula, sub) => ({
  key,
  title,
  unit,
  formula,
  sub,
});
export const WORK = {
  ...PRACTICAL_WORK,
  measurement: [
    W(
      "measured",
      "Ruler reading",
      "m",
      "Lᵣ = round(L / d) d",
      (p, q, n) =>
        `round(${n(p.length)} / ${n(p.resolution)}) × ${n(p.resolution)}`,
    ),
    W(
      "absolute",
      "Reading resolution uncertainty",
      "m",
      "uL = d / 2",
      (p, q, n) => `${n(p.resolution)} / 2`,
    ),
    W(
      "period",
      "Period from multiple oscillations",
      "s",
      "T = tₙ / n",
      (p, q, n) => `${n(q.elapsed)} / ${p.count}`,
    ),
    W(
      "uncertainty",
      "Conservative timing uncertainty",
      "s",
      "uT = 2uᵣ / n",
      (p, q, n) => `2 × ${n(p.reaction)} / ${p.count}`,
    ),
  ],
  motion: [
    W(
      "a",
      "Acceleration",
      "m/s²",
      "a = (F − bv) / m",
      (p, q, n) =>
        `(${n(p.mode ? p.mass * p.g : p.force)} − ${n(p.drag)} × ${n(q.v)}) / ${n(p.mass)}`,
    ),
    W(
      "v",
      "Velocity",
      "m/s",
      "v = F/b + (u − F/b)e^(−bt/m); b = 0: v = u + Ft/m",
      (p, q, n, s) =>
        `F = ${n(p.mode ? p.mass * p.g : p.force)} N; b = ${n(p.drag)} kg/s; u = ${n(p.initial)} m/s; t = ${n(s.t)} s; m = ${n(p.mass)} kg`,
    ),
    W(
      "momentum",
      "Momentum",
      "kg m/s",
      "p = mv",
      (p, q, n) => `${n(p.mass)} × ${n(q.v)}`,
    ),
    W(
      "weight",
      "Weight",
      "N",
      "W = mg",
      (p, q, n) => `${n(p.mass)} × ${n(p.g)}`,
    ),
  ],
  vectors: [
    W(
      "x",
      "Resultant x component",
      "N",
      "Rₓ = A + B cos θ",
      (p, q, n) => `${n(p.a)} + ${n(p.b)} cos(${n(p.angle)}°)`,
    ),
    W(
      "y",
      "Resultant y component",
      "N",
      "Rᵧ = B sin θ",
      (p, q, n) => `${n(p.b)} sin(${n(p.angle)}°)`,
    ),
    W(
      "resultant",
      "Resultant magnitude",
      "N",
      "R = √(Rₓ² + Rᵧ²)",
      (p, q, n) => `√(${n(q.x)}² + ${n(q.y)}²)`,
    ),
    W(
      "direction",
      "Direction from +x",
      "°",
      "θR = atan2(Rᵧ, Rₓ)",
      (p, q, n) => `atan2(${n(q.y)}, ${n(q.x)})`,
    ),
  ],
  moments: [
    W(
      "left",
      "Anticlockwise moment",
      "N m",
      "M₁ = m₁gd₁",
      (p, q, n) => `${n(p.m1)} × 9.81 × ${n(p.d1)}`,
    ),
    W(
      "right",
      "Clockwise moment",
      "N m",
      "M₂ = m₂gd₂",
      (p, q, n) => `${n(p.m2)} × 9.81 × ${n(p.d2)}`,
    ),
    W(
      "net",
      "Resultant moment",
      "N m",
      "M = M₁ − M₂",
      (p, q, n) => `${n(q.left)} − ${n(q.right)}`,
    ),
    W(
      "critical",
      "Separate block: critical tilt",
      "°",
      "θc = arctan(w / 2h)",
      (p, q, n) => `arctan(${n(p.width)} / (2 × ${n(p.height)}))`,
    ),
  ],
  buoyancy: [
    W(
      "depth",
      "Centre depth below surface",
      "m",
      "d = H − y",
      (p, q, n) => `0.500 − ${n(q.y)}`,
    ),
    W(
      "v",
      "Vertical velocity (up +)",
      "m/s",
      "v = dy/dt",
      (p, q, n) => `Integrated velocity: ${n(q.v)}`,
    ),
    W(
      "net",
      "Resultant force (up +)",
      "N",
      "F = U + D + N − W",
      (p, q, n) =>
        `${q.upthrust.toFixed(3)} + (${q.drag.toFixed(3)}) + ${q.normal.toFixed(3)} − ${q.weight.toFixed(3)}`,
    ),
    W(
      "mass",
      "Object mass",
      "kg",
      "m = ρV",
      (p, q, n) => `${n(p.density)} × ${n(p.volume)}`,
    ),
    W(
      "weight",
      "Weight",
      "N",
      "W = ρVg",
      (p, q, n) => `${n(p.density)} × ${n(p.volume)} × 9.81`,
    ),
    W(
      "upthrust",
      "Instantaneous upthrust",
      "N",
      "U = ρₗgVdisplaced",
      (p, q, n) => `${n(p.fluid)} × 9.81 × ${n(q.displaced)}`,
    ),
    W(
      "drag",
      "Fluid drag (up +)",
      "N",
      "D = −f(3πμLv + ½ρₗCdL²v|v|)",
      (p, q, n) =>
        `−${n(q.fraction)} × (3π × 0.1 × ${n(q.side)} × ${n(q.v)} + 0.5 × ${n(p.fluid)} × 1.05 × ${n(q.side)}² × ${n(q.v)} × |${n(q.v)}|)`,
    ),
    W(
      "normal",
      "Permeable support force",
      "N",
      "N = max(0, W − U) at rest on support",
      (p, q, n) =>
        q.normal
          ? `max(0, ${n(q.weight)} − ${n(q.upthrust)})`
          : "0 (no loaded contact)",
    ),
    W(
      "a",
      "Vertical acceleration",
      "m/s²",
      "a = F / m",
      (p, q, n) => `${n(q.net)} / ${n(q.mass)}`,
    ),
    W(
      "immersion",
      "Currently immersed",
      "%",
      "f = Vdisplaced / V",
      (p, q, n) => `${n(q.displaced)} / ${n(p.volume)} × 100`,
    ),
    W(
      "pressure",
      "Gauge liquid pressure",
      "Pa",
      "p = ρₗgh",
      (p, q, n) => `${n(p.fluid)} × 9.81 × ${n(p.depth)}`,
    ),
  ],
  energy: [
    W(
      "potential",
      "Useful energy transferred",
      "J",
      "ΔEₚ = mgh",
      (p, q, n) => `${n(p.mass)} × 9.81 × ${n(q.height)}`,
    ),
    W(
      "input",
      "Input energy",
      "J",
      "Eᵢₙ = Pt (until target)",
      (p, q, n, s) => `${n(p.power)} × min(${n(s.t)}, ${n(q.liftTime)})`,
    ),
    W(
      "waste",
      "Dissipated energy",
      "J",
      "Ew = (1 − η)Eᵢₙ",
      (p, q, n) => `(1 − ${n(p.efficiency)}) × ${n(q.input)}`,
    ),
    W(
      "liftTime",
      "Time to target",
      "s",
      "t = mgh / (ηP)",
      (p, q, n) =>
        `${n(p.mass)} × 9.81 × ${n(p.height)} / (${n(p.efficiency)} × ${n(p.power)})`,
    ),
  ],
  gases: [
    W(
      "pressure",
      "Ideal-gas pressure",
      "Pa",
      "p = nRT / V",
      (p, q, n) =>
        `${n(p.amount)} × ${n(P.R)} × ${n(p.temperature)} / ${n(p.volume)}`,
    ),
    W(
      "pv",
      "Gas pressure–volume product",
      "J",
      "pV = nRT",
      (p, q, n) => `${n(p.amount)} × ${n(P.R)} × ${n(p.temperature)}`,
    ),
    W(
      "rms",
      "Nitrogen RMS speed reference",
      "m/s",
      "vᵣₘₛ = √(3RT / M)",
      (p, q, n) => `√(3 × ${n(P.R)} × ${n(p.temperature)} / 0.028)`,
    ),
    W(
      "celsius",
      "Celsius temperature",
      "°C",
      "θ = T − 273.15",
      (p, q, n) => `${n(p.temperature)} − 273.15`,
    ),
  ],
  expansion: [
    W(
      "extension",
      "Thermal extension",
      "m",
      "ΔL = αL₀ΔT",
      (p, q, n) => `${n(p.alpha)} × ${n(p.length)} × ${n(p.temperature)}`,
    ),
    W(
      "final",
      "Final length",
      "m",
      "L = L₀ + ΔL",
      (p, q, n) => `${n(p.length)} + ${n(q.extension)}`,
    ),
    W(
      "strain",
      "Thermal strain",
      "",
      "ε = αΔT",
      (p, q, n) => `${n(p.alpha)} × ${n(p.temperature)}`,
    ),
    W(
      "extension",
      "Extension check",
      "m",
      "ΔL = L − L₀",
      (p, q, n) => `${n(q.final)} − ${n(p.length)}`,
    ),
  ],
  calorimetry: [
    W(
      "energy",
      "Heater energy",
      "J",
      "Q = Pt",
      (p, q, n, s) => `${n(p.power)} × ${n(s.t)}`,
    ),
    W(
      "temperature",
      "Material temperature",
      "°C",
      "Q = mcΔT or Q = mL (piecewise)",
      (p, q, n) =>
        `Q/m = ${n(q.energy / p.mass)} J/kg; initial = ${n(p.initial)} °C; see phase thresholds below.`,
    ),
    W(
      "melt",
      "Melt fraction",
      "",
      "f = Qfusion / (mL𝒻)",
      (p, q, n) => `L𝒻 = 334000 J/kg; fraction = ${n(q.melt)}`,
    ),
    W(
      "boil",
      "Vaporised fraction",
      "",
      "f = Qvaporisation / (mLᵥ)",
      (p, q, n) => `Lᵥ = 2260000 J/kg; fraction = ${n(q.boil)}`,
    ),
  ],
  heat: [
    W(
      "conduction",
      "Steady conduction power",
      "W",
      "P = kA(Th − Tc) / d",
      (p, q, n) =>
        `${n(p.conductivity)} × ${n(p.area)} × (${n(p.hot)} − ${n(p.cold)}) / ${n(p.thickness)}`,
    ),
    W(
      "convection",
      "Convection reference power",
      "W",
      "P = hA(Th − Tc)",
      (p, q, n) => `10 × ${n(p.area)} × (${n(p.hot)} − ${n(p.cold)})`,
    ),
    W(
      "radiation",
      "Net radiated power",
      "W",
      "P = εσA(Th⁴ − Tc⁴)",
      (p, q, n) =>
        `${n(p.emissivity)} × ${n(P.SIGMA)} × ${n(p.area)} × (${n(p.hot + 273.15)}⁴ − ${n(p.cold + 273.15)}⁴)`,
    ),
    W(
      "energy",
      "Energy transferred in selected mode",
      "J",
      "Q = Pselected t",
      (p, q, n, s) => `${n(q.power)} × ${n(s.t)}`,
    ),
  ],
  wavefronts: [
    W(
      "wavelength",
      "Wavelength",
      "m",
      "λ = v / f",
      (p, q, n) => `${n(p.speed)} / ${n(p.frequency)}`,
    ),
    W(
      "ratio",
      "Gap / wavelength",
      "",
      "a/λ = af / v",
      (p, q, n) => `${n(p.gap)} × ${n(p.frequency)} / ${n(p.speed)}`,
    ),
    W(
      "speed",
      "Propagation speed",
      "m/s",
      "v = fλ",
      (p, q, n) => `${n(p.frequency)} × ${n(q.wavelength)}`,
    ),
    W(
      "frequency",
      "Source frequency",
      "Hz",
      "f = 1 / T",
      (p, q, n) => `1 / ${n(1 / p.frequency)}`,
    ),
  ],
  mirror: [
    W(
      "incident",
      "Angle of incidence",
      "°",
      "i = angle to normal",
      (p, q, n) => `${n(p.angle)}°`,
    ),
    W(
      "reflected",
      "Angle of reflection",
      "°",
      "r = i",
      (p, q, n) => `${n(p.angle)}°`,
    ),
    W(
      "image",
      "Signed image position",
      "m",
      "ximage = −xobject",
      (p, q, n) => `−${n(p.distance)}`,
    ),
    W(
      "magnification",
      "Plane-mirror magnification",
      "",
      "m = hᵢ / hₒ = 1",
      () => `equal image and object heights`,
    ),
  ],
  lenses: [
    W(
      "image",
      "Signed image distance",
      "m",
      "v = fu / (u − f)",
      (p, q, n) =>
        `${n(p.focal * p.kind)} × ${n(p.object)} / (${n(p.object)} − ${n(p.focal * p.kind)})`,
    ),
    W(
      "magnification",
      "Signed magnification",
      "",
      "m = −v / u",
      (p, q, n) => `−${n(q.image)} / ${n(p.object)}`,
    ),
    W(
      "imageHeight",
      "Signed image height",
      "m",
      "hᵢ = mhₒ",
      (p, q, n) => `${n(q.magnification)} × ${n(p.height)}`,
    ),
    W(
      "power",
      "Lens optical power",
      "m⁻¹",
      "D = 1 / f",
      (p, q, n) => `1 / ${n(p.focal * p.kind)}`,
    ),
  ],
  dispersion: [
    W(
      "index",
      "Refractive index",
      "",
      "n = A + B / λ² (λ in μm)",
      (p, q, n) => `${n(p.a)} + ${n(p.b)} / ${n(p.wavelength * 1e6)}²`,
    ),
    W(
      "refraction",
      "Refraction angle",
      "°",
      "r = arcsin(sin i / n)",
      (p, q, n) => `arcsin(sin(${n(p.angle)}°) / ${n(q.index)})`,
    ),
    W(
      "speed",
      "Light speed in material",
      "m/s",
      "v = c / n",
      (p, q, n) => `${P.C} / ${n(q.index)}`,
    ),
    W(
      "wavelength",
      "Wavelength in material",
      "m",
      "λmaterial = λvacuum / n",
      (p, q, n) => `${n(p.wavelength)} / ${n(q.index)}`,
    ),
  ],
  spectrum: [
    W(
      "wavelength",
      "Vacuum wavelength",
      "m",
      "λ = 10ˣ",
      (p, q, n) => `10^(${n(p.exponent)})`,
    ),
    W(
      "frequency",
      "Frequency",
      "Hz",
      "f = c / λ",
      (p, q, n) => `${P.C} / ${n(q.wavelength)}`,
    ),
    W(
      "energy",
      "Photon energy (extension)",
      "J",
      "E = hf",
      (p, q, n) => `6.62607015e−34 × ${n(q.frequency)}`,
    ),
    W(
      "frequency",
      "Wave relation check",
      "Hz",
      "fλ = c",
      (p, q, n) => `${P.C} / ${n(q.wavelength)}`,
    ),
  ],
  sound: [
    W(
      "speed",
      "Air sound-speed approximation",
      "m/s",
      "v = 331.3√(T / 273.15)",
      (p, q, n) => `331.3√(${n(p.temperature + 273.15)} / 273.15)`,
    ),
    W(
      "wavelength",
      "Wavelength",
      "m",
      "λ = v / f",
      (p, q, n) => `${n(q.speed)} / ${n(p.frequency)}`,
    ),
    W(
      "echo",
      "Echo return time",
      "s",
      "t = 2d / v",
      (p, q, n) => `2 × ${n(p.distance)} / ${n(q.speed)}`,
    ),
    W(
      "pressure",
      "Instantaneous relative pressure",
      "",
      "pᵣ = A sin(2πft)",
      (p, q, n, s) =>
        `${n(p.amplitude)} sin(2π × ${n(p.frequency)} × ${n(s.t)})`,
    ),
  ],
  dc: [
    W(
      "resistance",
      "Equivalent resistance",
      "Ω",
      "Series: R₁ + R₂; parallel: R₁R₂/(R₁+R₂)",
      (p, q, n) =>
        `R₁ = ${n(p.mode === 3 ? q.wire : p.r1)} Ω; R₂ = ${n(p.r2)} Ω; mode = ${p.mode}`,
    ),
    W(
      "current",
      "Supply current",
      "A",
      "I = V / Req",
      (p, q, n) => `${n(p.voltage)} / ${n(q.resistance)}`,
    ),
    W(
      "v2",
      "Output / second resistor voltage",
      "V",
      "V₂ = I₂R₂",
      (p, q, n) => `${n(q.i2)} × ${n(p.r2)}`,
    ),
    W(
      "power",
      "Supply power",
      "W",
      "P = VI",
      (p, q, n) => `${n(p.voltage)} × ${n(q.current)}`,
    ),
    W(
      "wire",
      "Wire resistance",
      "Ω",
      "Rwire = ρL / A",
      (p, q, n) => `${n(p.rho)} × ${n(p.length)} / ${n(p.area)}`,
    ),
  ],
  devices: [
    W(
      "current",
      "Load current",
      "A",
      "Diode: I = max(0, (V − 0.7)/R); relay / cut-out as selected",
      (p, q, n) =>
        `V = ${n(p.voltage)} V; R = ${n(p.resistance)} Ω; model = ${p.mode}`,
    ),
    W(
      "power",
      "Supply power",
      "W",
      "P = VI",
      (p, q, n) => `${n(p.voltage)} × ${n(q.current)}`,
    ),
    W(
      "on",
      "Conducting / safe state",
      "",
      "state = selected threshold rule",
      (p, q, n) =>
        `relay threshold = ${n(p.threshold)} V; cut-out = ${n(p.rating)} A`,
    ),
    W(
      "rated",
      "Cut-out rating",
      "A",
      "Imax = selected rating",
      (p, q, n) => `${n(p.rating)}`,
    ),
  ],
  magnetism: [
    W(
      "field",
      "Signed field at reference probe",
      "T",
      "Solenoid: B = μ₀NI/L; wire: B = μ₀I/(2πr)",
      (p, q, n) =>
        `μ₀ ≈ 4πe−7; I = ${n(p.current)} A; N = ${p.turns}; L = ${n(p.length)} m; wire r = 0.05 m`,
    ),
    W(
      "current",
      "Conventional current",
      "A",
      "I = Q / t",
      (p, q, n) => `${n(p.current)} C per second`,
    ),
    W(
      "turnDensity",
      "Solenoid turn density",
      "m⁻¹",
      "n = N / L",
      (p, q, n) => `${p.turns} / ${n(p.length)}`,
    ),
    W(
      "field",
      "Field reversal check",
      "T",
      "B ∝ I",
      (p, q, n) => `signed I = ${n(p.current)} A`,
    ),
  ],
  charged: [
    W(
      "force",
      "Magnetic force magnitude",
      "N",
      "F = |q|vB",
      (p, q, n) => `1.602176634e−19 × ${n(p.speed)} × |${n(p.field)}|`,
    ),
    W(
      "radius",
      "Orbit radius",
      "m",
      "r = mv / |qB|",
      (p, q, n) =>
        `${n(p.mass)} × ${n(p.speed)} / |1.602176634e−19 × ${n(p.field)}|`,
    ),
    W(
      "frequency",
      "Cyclotron frequency",
      "Hz",
      "f = |qB| / (2πm)",
      (p, q, n) => `|1.602176634e−19 × ${n(p.field)}| / (2π × ${n(p.mass)})`,
    ),
    W(
      "kinetic",
      "Kinetic energy",
      "J",
      "K = ½mv²",
      (p, q, n) => `½ × ${n(p.mass)} × ${n(p.speed)}²`,
    ),
  ],
  induction: [
    W(
      "flux",
      "Flux per turn",
      "Wb",
      "Φ = BA cos θ",
      (p, q, n) => `${n(p.field)} × ${n(p.area)} cos(${n(q.phase)} rad)`,
    ),
    W(
      "emf",
      "Generated emf",
      "V",
      "ε = NBAω sin θ",
      (p, q, n) =>
        `${p.turns} × ${n(p.field)} × ${n(p.area)} × ${n(2 * Math.PI * p.frequency)} sin(${n(q.phase)})`,
    ),
    W(
      "peak",
      "Peak generator emf",
      "V",
      "ε₀ = NBA 2πf",
      (p, q, n) =>
        `${p.turns} × ${n(p.field)} × ${n(p.area)} × 2π × ${n(p.frequency)}`,
    ),
    W(
      "torque",
      "Ideal commutated motor torque",
      "N m",
      "τ = NBIA |sin θ|",
      (p, q, n) =>
        `${p.turns} × ${n(p.field)} × ${n(p.current)} × ${n(p.area)} × |sin(${n(q.phase)})|`,
    ),
  ],
  transformer: [
    W(
      "vs",
      "Secondary RMS voltage",
      "V",
      "Vs = Vp Ns / Np",
      (p, q, n) => `${n(p.vp)} × ${p.ns} / ${p.np}`,
    ),
    W(
      "is",
      "Secondary RMS current",
      "A",
      "Is = Vs / R",
      (p, q, n) => `${n(q.vs)} / ${n(p.load)}`,
    ),
    W(
      "ip",
      "Primary RMS current",
      "A",
      "Ip = Vs Is / Vp",
      (p, q, n) => `${n(q.vs)} × ${n(q.is)} / ${n(p.vp)}`,
    ),
    W(
      "loss",
      "Separate line-loss estimate",
      "W",
      "Pline = Ip² Rline",
      (p, q, n) => `${n(q.ip)}² × ${n(p.resistance)}`,
    ),
  ],
  atom: [
    W(
      "massNumber",
      "Mass number",
      "",
      "A = Z + N",
      (p, q, n) => `${p.protons} + ${p.neutrons}`,
    ),
    W(
      "electrons",
      "Electron number",
      "",
      "Ne = Z − charge/e",
      (p, q, n) => `${p.protons} − (${p.charge})`,
    ),
    W(
      "daughterZ",
      "Daughter proton number",
      "",
      "α: Z−2; β⁻: Z+1; γ: Z",
      (p, q, n) => `initial Z = ${p.protons}; selected mode = ${p.decay}`,
    ),
    W(
      "angle",
      "Rutherford scattering angle",
      "°",
      "θ = 2 arctan(k qα qN / (2Eb))",
      (p, q, n) =>
        `k = 8.98755e9; qα = 2e; qN = ${p.protons}e; E = ${n(p.energy)} eV; b = ${n(p.impact)} m`,
    ),
  ],
  radioactivity: [
    W(
      "expected",
      "Expected undecayed nuclei",
      "",
      "Nexpected = N₀ 2^(−t/T½)",
      (p, q, n, s) => `${p.nuclei} × 2^(−${n(s.t)}/${n(p.halfLife)})`,
    ),
    W(
      "activity",
      "Expected source activity",
      "Bq",
      "A = (ln 2 / T½) Nexpected",
      (p, q, n) => `(ln 2 / ${n(p.halfLife)}) × ${n(q.expected)}`,
    ),
    W(
      "transmission",
      "Shield transmission",
      "",
      "I/I₀ = e^(−μx)",
      (p, q, n) => `exp(−${n(p.mu)} × ${n(p.thickness)})`,
    ),
    W(
      "detector",
      "Expected detector rate for this sample",
      "s⁻¹",
      "rate = λNactual e^(−μx) + background",
      (p, q, n) =>
        `${n(Math.LN2 / p.halfLife)} × ${q.remaining} × ${n(q.transmission)} + ${n(p.background)}`,
    ),
  ],
  earthmoon: [
    W(
      "daylight",
      "Geometric daylight duration",
      "h",
      "D = 24 arccos(−tan φ tan δ) / π",
      (p, q, n) =>
        `φ = ${n(p.latitude)}°; δ = ${n(q.declination)}° (argument clipped for polar day/night)`,
    ),
    W(
      "illumination",
      "Visible lunar illuminated fraction",
      "",
      "f = (1 − cos phase) / 2",
      (p, q, n) => `(1 − cos(${n(q.phase)})) / 2`,
    ),
    W(
      "declination",
      "Solar declination approximation",
      "°",
      "δ = tilt sin(2π(day−80)/365.25)",
      (p, q, n, s) => `${n(p.tilt)} sin(2π(${n(p.day + s.t / 5)}−80)/365.25)`,
    ),
    W(
      "orbitalSpeed",
      "Earth circular reference speed",
      "m/s",
      "v = 2πr / T",
      (p, q, n) => `2π × ${P.AU} / ${P.YEAR}`,
    ),
  ],
  solarsystem: [
    W(
      "speed",
      "Circular orbital speed",
      "m/s",
      "v = √(GM☉/r)",
      (p, q, n) => `√(${P.G} × ${n(P.SUN)} / ${n(q.radius)})`,
    ),
    W(
      "period",
      "Circular orbital period",
      "s",
      "T = 2π√(r³/GM☉)",
      (p, q, n) => `2π√(${n(q.radius)}³ / (${P.G} × ${n(P.SUN)}))`,
    ),
    W(
      "lightTime",
      "One-way light travel time",
      "s",
      "t = r / c",
      (p, q, n) => `${n(q.radius)} / ${P.C}`,
    ),
    W(
      "surfaceGravity",
      "Selected planet surface gravity",
      "N/kg",
      "g = GMplanet / Rplanet²",
      (p, q, n) =>
        `${P.G} × ${n(P.PLANETS[p.planet][2])} / ${n(P.PLANETS[p.planet][3])}²`,
    ),
  ],
  stars: [
    W(
      "luminosity",
      "Main-sequence luminosity estimate",
      "L☉",
      "L/L☉ ≈ (M/M☉)^3.5",
      (p, q, n) => `${n(p.mass)}^3.5`,
    ),
    W(
      "lifetime",
      "Main-sequence lifetime estimate",
      "years",
      "t ≈ 10¹⁰ (M/M☉) / (L/L☉)",
      (p, q, n) => `1e10 × ${n(p.mass)} / ${n(q.luminosity)}`,
    ),
    W(
      "peak",
      "Blackbody wavelength peak",
      "m",
      "λmax T = 2.897771955 × 10⁻³ m K",
      (p, q, n) => `0.002897771955 / ${n(p.temperature)}`,
    ),
    W(
      "fusionEnergy",
      "Illustrative 4H→He mass-defect energy",
      "J",
      "E = Δmc²",
      (p, q, n) => `0.0287 × 1.6605390666e−27 × ${P.C}²`,
    ),
  ],
  universe: [
    W(
      "speed",
      "Hubble recession speed",
      "m/s",
      "v = H₀d",
      (p, q, n) => `${n(p.hubble)} × ${n(p.distance * 3.085677581491367e22)}`,
    ),
    W(
      "redshift",
      "Low-redshift approximation",
      "",
      "z ≈ v / c",
      (p, q, n) => `${n(q.speed)} / ${P.C}`,
    ),
    W(
      "observed",
      "Observed wavelength",
      "m",
      "λobs = λrest(1+z)",
      (p, q, n) => `${n(p.wavelength)} × (1 + ${n(q.redshift)})`,
    ),
    W(
      "age",
      "Hubble-time estimate",
      "years",
      "tH = 1 / H₀",
      (p, q, n) => `1 / ${n(p.hubble)} / ${P.YEAR} seconds per Julian year`,
    ),
  ],
};
const INFO = {
  ...PRACTICAL_INFO,
  measurement: [
    "Measurement & uncertainty",
    "Mechanics",
    "Measure small lengths and time repeated oscillations.",
    "T = t / n",
    "count",
  ],
  motion: [
    "Motion, forces & free fall",
    "Mechanics",
    "Connect force arrows, velocity and a live motion graph.",
    "F − bv = ma",
    null,
  ],
  vectors: [
    "Vector addition",
    "Mechanics",
    "Build a head-to-tail triangle and resolve its components.",
    "R = A + B",
    "angle",
  ],
  moments: [
    "Moments & stability",
    "Mechanics",
    "Balance a beam, then investigate the toppling threshold.",
    "M = Fd",
    "d2",
  ],
  buoyancy: [
    "Density, pressure & floating",
    "Mechanics",
    "Release a cube, watch it rise or sink, and account for every vertical force.",
    "ma = U + D + N − W",
    null,
  ],
  energy: [
    "Energy, power & resources",
    "Mechanics",
    "Lift a load and account for every joule of input energy.",
    "Puseful = ηPinput",
    null,
  ],
  gases: [
    "Particles & gas laws",
    "Thermal physics",
    "Explore temperature, volume and particle arrangements.",
    "pV = nRT",
    "volume",
  ],
  expansion: [
    "Thermal expansion",
    "Thermal physics",
    "Heat a metal rod and measure its tiny extension.",
    "ΔL = αL₀ΔT",
    "temperature",
  ],
  calorimetry: [
    "Heating & changes of state",
    "Thermal physics",
    "Follow a heating curve from ice through melting to steam.",
    "Q = mcΔT; Q = mL",
    null,
  ],
  heat: [
    "Thermal energy transfer",
    "Thermal physics",
    "Compare conduction, convection and net thermal radiation.",
    "P = kAΔT / d",
    "thickness",
  ],
  wavefronts: [
    "Reflection & diffraction",
    "Waves",
    "Watch wavefronts spread through a gap or reflect from a wall.",
    "v = fλ",
    "gap",
  ],
  mirror: [
    "Plane mirrors & light rays",
    "Optics",
    "Trace incident, reflected and virtual-image rays.",
    "i = r",
    "angle",
  ],
  lenses: [
    "Thin lenses & images",
    "Optics",
    "Construct real and virtual images with principal rays.",
    "1/f = 1/u + 1/v",
    "object",
  ],
  dispersion: [
    "Colour & dispersion",
    "Optics",
    "Separate wavelengths using a dispersive interface.",
    "n(λ) = A + B/λ²",
    "wavelength",
  ],
  spectrum: [
    "Electromagnetic spectrum",
    "Waves",
    "Travel from radio waves to gamma rays on a logarithmic scale.",
    "c = fλ",
    "exponent",
  ],
  sound: [
    "Sound & echoes",
    "Waves",
    "See longitudinal compression and calculate an echo delay.",
    "t = 2d / v",
    null,
  ],
  dc: [
    "DC circuits & potential dividers",
    "Electricity",
    "Compare series, parallel and wire resistance in a live circuit.",
    "V = IR",
    "r2",
  ],
  devices: [
    "Diodes, relays & safety",
    "Electricity",
    "Test device thresholds and a simplified overcurrent cut-out.",
    "P = VI",
    "voltage",
  ],
  magnetism: [
    "Magnetic fields & electromagnets",
    "Magnetism",
    "Reverse a current and follow the field direction.",
    "B = μ₀NI/L",
    "current",
  ],
  charged: [
    "Charged particles in magnetic fields",
    "Magnetism",
    "Bend a particle beam and see why magnetic forces do no work.",
    "F = q v × B",
    null,
  ],
  induction: [
    "Generators & motors",
    "Magnetism",
    "Rotate a coil and relate flux, induced emf and motor torque.",
    "ε = −N dΦ/dt",
    null,
  ],
  transformer: [
    "Transformers & transmission",
    "Magnetism",
    "Change turns ratio and track voltage, current and line loss.",
    "Vs/Vp = Ns/Np",
    "ns",
  ],
  atom: [
    "Atoms, isotopes & decay equations",
    "Nuclear physics",
    "Resolve nucleon counts and explore Rutherford scattering.",
    "A = Z + N",
    "impact",
  ],
  radioactivity: [
    "Radioactivity & half-life",
    "Nuclear physics",
    "Compare a seeded random sample with its exponential expectation.",
    "N = N₀ 2^(−t/T½)",
    null,
  ],
  earthmoon: [
    "Earth, seasons & Moon phases",
    "Space physics",
    "Explore axial tilt, geometric day length and lunar illumination.",
    "v = 2πr / T",
    null,
  ],
  solarsystem: [
    "The Solar System",
    "Space physics",
    "Compare eight planets, orbital periods and light travel time.",
    "T² ∝ r³",
    "scale",
  ],
  stars: [
    "Stars & stellar evolution",
    "Space physics",
    "Follow both evolutionary branches and explore a stellar spectrum.",
    "E = Δmc²",
    "mass",
  ],
  universe: [
    "Redshift & the expanding Universe",
    "Space physics",
    "Connect galaxy distance, redshift and Hubble time.",
    "v = H₀d",
    "distance",
  ],
};
export const CURRICULUM_SIMULATIONS = Object.fromEntries(
  P.CURRICULUM_IDS.map((id, index) => {
    const [title, category, summary, formula, sweep] = INFO[id],
      controls = PARAMETERS[id].map((c) => {
        const [value, min, max] = P.RANGES[id][c.key],
          factor = c.factor || 1;
        return {
          ...c,
          min: min / factor,
          max: max / factor,
          step: [
            "count",
            "day",
            "seed",
            "nuclei",
            "turns",
            "np",
            "ns",
            "protons",
            "neutrons",
            "charge",
            "order",
          ].includes(c.key)
            ? 1
            : "any",
        };
      });
    const defaults = P.DEFAULTS[id],
      variations = {
        measurement: [{ count: 1 }, { count: 20 }],
        motion: [{ drag: 0 }, { mode: 1, initial: 0, drag: 2 }],
        vectors: [{ angle: 0 }, { angle: 180 }],
        moments: [{ m1: 3, m2: 3, d1: 1, d2: 1 }, { tilt: 40 }],
        buoyancy: [{ density: 7800 }, { density: 1000 }],
        energy: [{ efficiency: 1 }, { efficiency: 0.3 }],
        gases: [{ volume: 0.012 }, { temperature: 600 }],
        expansion: [{ alpha: 0.000012 }, { temperature: 200 }],
        calorimetry: [
          { mode: 1, initial: 20 },
          { mass: 0.1, power: 3000 },
        ],
        heat: [{ mode: 1 }, { mode: 2 }],
        wavefronts: [{ gap: 0.2 }, { mode: 1 }],
        mirror: [{ angle: 0 }, { angle: 70 }],
        lenses: [{ object: 0.1 }, { kind: -1 }],
        dispersion: [{ wavelength: 400e-9 }, { wavelength: 700e-9 }],
        spectrum: [{ exponent: -2 }, { exponent: -11 }],
        sound: [{ frequency: 880 }, { temperature: 0, distance: 100 }],
        dc: [{ mode: 1 }, { mode: 2 }],
        devices: [{ voltage: -6 }, { mode: 2, voltage: 12, rating: 0.05 }],
        magnetism: [{ current: -2 }, { mode: 1 }],
        induction: [{ frequency: 2 }, { mode: 1 }],
        transformer: [{ ns: 1000 }, { ns: 50 }],
        atom: [
          { decay: 1, protons: 92, neutrons: 146 },
          { decay: 2, protons: 6, neutrons: 8 },
        ],
        radioactivity: [{ seed: 123 }, { halfLife: 10, thickness: 5 }],
        earthmoon: [{ day: 172 }, { day: 355 }],
        solarsystem: [{ planet: 0 }, { planet: 7 }],
        stars: [
          { mass: 15, stage: 2 },
          { mass: 15, stage: 4 },
        ],
        universe: [{ distance: 200 }, { scale: 5 }],
      }[id] ||
        PRACTICAL_LABS[id]?.variations || [{ charge: 1 }, { field: 0 }];
    const names = {
      measurement: ["Single cycle", "Twenty cycles"],
      motion: ["No drag", "Terminal fall"],
      moments: ["Balanced", "Toppling"],
      buoyancy: ["Sinks", "Neutral"],
      calorimetry: ["Custom solid", "Fast water curve"],
      lenses: ["Magnifier", "Diverging"],
      heat: ["Convection", "Radiation"],
      dc: ["Parallel", "Divider"],
      devices: ["Reverse diode", "Overcurrent"],
      induction: ["Faster generator", "Motor"],
      atom: ["Alpha decay", "Beta-minus decay"],
      earthmoon: ["June solstice", "December solstice"],
      solarsystem: ["Mercury", "Neptune"],
      stars: ["Massive giant", "Massive remnant"],
    }[id] ||
      PRACTICAL_LABS[id]?.names || ["Compare A", "Compare B"];
    const readouts = WORK[id],
      sample = (s, p) => P.sampleCurriculum(id, s, p);
    return [
      id,
      {
        title,
        short: title,
        category,
        summary,
        formula,
        level: "IGCSE 0625",
        color: ["#59dcca", "#80b9ff", "#edbc78", "#c6a1f6"][index % 4],
        diagramOnly: false,
        curriculum: true,
        defaults,
        limits: Object.fromEntries(
          Object.entries(P.RANGES[id]).map(([k, v]) => [k, v.slice(1)]),
        ),
        controls,
        create: (p) => P.createCurriculum(id, p),
        step: (s, p, h) => P.stepCurriculum(id, s, p, h),
        sample,
        h: id === "sound" ? 1 / 20000 : id === "charged" ? 1e-12 : 1 / 120,
        rate:
          id === "charged"
            ? 1e-8
            : id === "calorimetry"
              ? 30
              : id === "sound"
                ? 0.00025
                : id === "solarsystem"
                  ? 0.15
                  : 1,
        sampleEvery:
          id === "charged" ? 1e-10 : id === "sound" ? 1 / 4000 : 1 / 15,
        timeUnit: id === "solarsystem" ? "yr" : id === "charged" ? "ns" : "s",
        timeFactor: id === "charged" ? 1e-9 : 1,
        window:
          id === "charged"
            ? 60
            : id === "sound"
              ? 0.006
              : id === "calorimetry"
                ? 1500
                : 30,
        presets: [
          ["Start here", { ...defaults }],
          ...variations.map((v, i) => [names[i], { ...defaults, ...v }]),
        ],
        metrics: (s, p) =>
          readouts.slice(0, 3).map((r) => ({
            label: r.title,
            value: sample(s, p)[r.key],
            unit: r.unit,
            decimals:
              PRACTICAL_LABS[id] && r.unit === "m"
                ? 4
                : id === "buoyancy"
                  ? 3
                  : ["measurement", "lenses", "universe", "devices"].includes(
                        id,
                      )
                    ? 4
                    : id === "expansion"
                      ? 6
                      : 2,
            note:
              r.formula.length > 65
                ? "Live calculation · expand to see the working"
                : r.formula,
          })),
        supplementary: (s, p) =>
          readouts.slice(3).map((r) => ({
            label: r.title,
            value: sample(s, p)[r.key],
            unit: r.unit,
          })),
        graphs: readouts.slice(0, 3).map((r, i) => ({
          id: `reading-${i}`,
          label: r.title,
          keys: [r.key],
          unit: r.unit,
          ...(sweep
            ? {
                spatial: `curriculum:${id}`,
                xTitle: `${PARAMETERS[id].find((c) => c.key === sweep).label} / ${PARAMETERS[id].find((c) => c.key === sweep).unit || "value"}`,
              }
            : {}),
        })),
        caption:
          "Calculated physics · rotate the 3D apparatus or use the 2D diagram. Open the visual-scale notes for enlarged quantities and illustrative timing.",
        insight: `${summary} Open the guided experiments for three investigations.`,
        sweep,
      },
    ];
  }),
);
export function curriculumRows(type, s, p) {
  const id = type.slice("curriculum:".length),
    d = CURRICULUM_SIMULATIONS[id],
    key = d.sweepFor?.(p) || d.sweep,
    range = P.RANGES[id][key],
    meta = d.controls.find((c) => c.key === key);
  const rows = Array.from({ length: 161 }, (_, i) => {
    let value = range[1] + ((range[2] - range[1]) * i) / 160;
    if (meta.step === 1) value = Math.round(value);
    const row = P.sampleCurriculum(id, s, { ...p, [key]: value });
    return { ...row, x: value / (meta.factor || 1) };
  });
  // Insert the actual focal-plane exclusion so a line never joins the two
  // sides of the lens asymptote when f lies between sampled object distances.
  if (
    id === "lenses" &&
    p.kind === 1 &&
    p.focal >= range[1] &&
    p.focal <= range[2]
  ) {
    const x = p.focal / (meta.factor || 1);
    if (!rows.some((r) => Math.abs(r.x - x) < 1e-10))
      rows.push({ ...P.sampleCurriculum(id, s, { ...p, object: p.focal }), x });
    rows.sort((a, b) => a.x - b.x);
  }
  return rows;
}
export function parameterUnit(type, c) {
  if (c.siUnit) return c.siUnit;
  if (type === "charged" && c.key === "charge") return "e";
  if (c.options) return "choice value";
  if (!c.factor || c.factor === 1) return c.unit || "";
  return (
    {
      volume: "m³",
      resolution: "m",
      efficiency: "fraction",
      alpha: "K⁻¹",
      focal: "m",
      object: "m",
      height: "m",
      wavelength: "m",
      area: "m²",
      rho: "Ω m",
      field: "T",
      speed: "m/s",
      mass: "kg",
      hubble: "s⁻¹",
      impact: "m",
      energy: "eV",
    }[c.key] ||
    c.unit ||
    ""
  );
}
// Choose graphs that can reveal a change, with a single physical unit per axis.
const dynamicGraph = (id, label, keys, unit, extra = {}) => ({
  id,
  label,
  keys,
  unit,
  ...extra,
});
const sweepGraph = (id, key, label, unit) => ({
  id: key,
  label,
  keys: [key],
  unit,
  spatial: `curriculum:${id}`,
  xTitle: CURRICULUM_SIMULATIONS[id].graphs[0].xTitle,
});
Object.assign(CURRICULUM_SIMULATIONS.measurement, {
  graphs: [
    sweepGraph("measurement", "uncertainty", "Timing uncertainty", "s"),
    sweepGraph("measurement", "period", "Model period", "s"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.motion, {
  graphs: [
    dynamicGraph("position", "Displacement", ["x"], "m"),
    dynamicGraph("velocity", "Velocity", ["v"], "m/s"),
    dynamicGraph("acceleration", "Acceleration", ["a"], "m/s²"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.energy, {
  graphs: [
    dynamicGraph(
      "accounting",
      "Energy balance",
      ["input", "potential", "waste"],
      "J",
    ),
    dynamicGraph("height", "Height", ["height"], "m"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.calorimetry, {
  graphs: [
    dynamicGraph("heating", "Heating curve", ["temperature"], "°C"),
    dynamicGraph("input", "Input energy", ["energy"], "J"),
    dynamicGraph("phases", "Phase fractions", ["melt", "boil"], "fraction"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.radioactivity, {
  graphs: [
    dynamicGraph(
      "decay",
      "Actual & expected",
      ["remaining", "expected"],
      "nuclei",
    ),
    dynamicGraph("activity", "Expected activity", ["activity"], "Bq"),
    dynamicGraph("detector", "Expected detector rate", ["detector"], "s⁻¹"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.sound, {
  graphs: [
    dynamicGraph("pressure", "Pressure waveform", ["pressure"], "relative"),
    dynamicGraph("speed", "Sound speed", ["speed"], "m/s"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.induction, {
  graphs: [
    dynamicGraph("emf", "Generated emf", ["emf"], "V"),
    dynamicGraph("flux", "Flux per turn", ["flux"], "Wb"),
    dynamicGraph("torque", "Motor torque", ["torque"], "N m"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.charged, {
  // Resolve the same fixed observation window for light/heavy and neutral particles.
  // Time-series windows use ns; integration and the solver always use SI seconds.
  rateFor: (p) => chargedTiming(p).rate,
  hFor: (p) => chargedTiming(p).step,
  sampleEvery: (p) => chargedTiming(p).sampleEvery,
  window: (p) => chargedTiming(p).duration / 1e-9,
  ended: (s, p) => s.t >= chargedTiming(p).duration ? "Observation window complete" : null,
  graphs: [
    dynamicGraph("trajectory", "Beam path", ["y"], "m", {
      phaseX: "x",
      xTitle: "Horizontal position / m",
    }),
    dynamicGraph("energy", "Kinetic energy", ["kinetic"], "J"),
  ],
});
Object.assign(CURRICULUM_SIMULATIONS.atom, {
  graphs: [sweepGraph("atom", "angle", "Scattering angle", "°")],
});
CURRICULUM_SIMULATIONS.spectrum.graphs.forEach((g) => (g.yLog = true));
CURRICULUM_SIMULATIONS.calorimetry.sampleEvery = 2;
CURRICULUM_SIMULATIONS.sound.sampleEvery = 1 / 20000;
const PRESET_LABELS = {
  vectors: ["Aligned forces", "Opposing forces"],
  energy: ["Ideal efficiency", "30% efficient"],
  gases: ["Half the volume", "Twice the temperature"],
  expansion: ["Steel-like coefficient", "Larger temperature rise"],
  wavefronts: ["Narrow gap", "Reflection"],
  mirror: ["Normal incidence", "Grazing ray"],
  dispersion: ["Blue light", "Red light"],
  spectrum: ["Microwaves", "Gamma rays"],
  sound: ["Octave higher", "Cold-air echo"],
  devices: ["Reverse bias", "Overcurrent cut-out"],
  magnetism: ["Reversed current", "Straight wire"],
  charged: ["Positive charge", "No magnetic field"],
  transformer: ["Step up", "Step down"],
  radioactivity: ["Different random sample", "Slower decay + shielding"],
  universe: ["Twice the distance", "Greater expansion"],
};
for (const [id, labels] of Object.entries(PRESET_LABELS))
  labels.forEach(
    (name, i) => (CURRICULUM_SIMULATIONS[id].presets[i + 1][0] = name),
  );
const SAMPLE_UNITS = {
  measurement: {
    measured: "m",
    absolute: "m",
    percent: "percent",
    elapsed: "s",
    period: "s",
    uncertainty: "s",
  },
  motion: {
    x: "m",
    v: "m_per_s",
    a: "m_per_s2",
    net: "N",
    weight: "N",
    momentum: "kg_m_per_s",
    kinetic: "J",
  },
  vectors: { x: "N", y: "N", resultant: "N", direction: "deg" },
  moments: {
    left: "N_m",
    right: "N_m",
    net: "N_m",
    critical: "deg",
    offset: "m",
    tipping: "boolean",
  },
  buoyancy: {
    mass: "kg",
    weight: "N",
    upthrust: "N",
    capacity: "N",
    pressure: "Pa",
    fraction: "fraction",
    displaced: "m3",
    y: "m",
    v: "m_per_s",
    a: "m_per_s2",
    drag: "N",
    normal: "N",
    net: "N",
    side: "m",
    immersion: "percent",
    equilibriumFraction: "fraction",
    depth: "m",
    status:
      "status_code_0_support_1_sinking_2_rising_3_neutral_4_floating_5_down_6_up_7_rest",
  },
  energy: {
    height: "m",
    potential: "J",
    input: "J",
    waste: "J",
    usefulPower: "W",
    liftTime: "s",
    efficiency: "percent",
  },
  gases: {
    pressure: "Pa",
    pv: "J",
    rms: "m_per_s",
    celsius: "deg_C",
    temperature: "K",
  },
  expansion: { extension: "m", final: "m", strain: "fraction" },
  calorimetry: {
    temperature: "deg_C",
    melt: "fraction",
    boil: "fraction",
    energy: "J",
  },
  heat: {
    conduction: "W",
    convection: "W",
    radiation: "W",
    power: "W",
    energy: "J",
  },
  wavefronts: {
    wavelength: "m",
    ratio: "dimensionless",
    frequency: "Hz",
    speed: "m_per_s",
    displacement: "relative",
  },
  mirror: {
    incident: "deg",
    reflected: "deg",
    image: "m",
    magnification: "dimensionless",
  },
  lenses: {
    image: "m",
    magnification: "dimensionless",
    imageHeight: "m",
    power: "per_m",
  },
  dispersion: {
    index: "dimensionless",
    refraction: "deg",
    speed: "m_per_s",
    wavelength: "m",
  },
  spectrum: { wavelength: "m", frequency: "Hz", energy: "J" },
  sound: { speed: "m_per_s", wavelength: "m", echo: "s", pressure: "relative" },
  dc: {
    resistance: "ohm",
    current: "A",
    i1: "A",
    i2: "A",
    v1: "V",
    v2: "V",
    power: "W",
    energy: "J",
    wire: "ohm",
    charge: "C",
  },
  devices: { current: "A", power: "W", on: "boolean", rated: "A" },
  magnetism: { field: "T", current: "A", turnDensity: "per_m" },
  charged: {
    force: "N",
    radius: "m",
    frequency: "Hz",
    kinetic: "J",
    x: "m",
    y: "m",
    phase: "rad",
  },
  induction: {
    phase: "rad",
    flux: "Wb",
    emf: "V",
    peak: "V",
    torque: "N_m",
    frequency: "Hz",
  },
  transformer: {
    vs: "V",
    is: "A",
    ip: "A",
    input: "W",
    output: "W",
    loss: "W",
    ratio: "dimensionless",
  },
  atom: {
    massNumber: "count",
    electrons: "count",
    daughterZ: "count",
    daughterA: "count",
    angle: "deg",
    valid: "boolean",
  },
  radioactivity: {
    remaining: "count",
    expected: "count",
    activity: "Bq",
    observedActivity: "Bq",
    detector: "per_s",
    transmission: "fraction",
    background: "per_s",
  },
  earthmoon: {
    longitude: "rad",
    declination: "deg",
    daylight: "h",
    phase: "rad",
    illumination: "fraction",
    orbitalSpeed: "m_per_s",
  },
  solarsystem: {
    radius: "m",
    period: "s",
    speed: "m_per_s",
    lightTime: "s",
    surfaceGravity: "N_per_kg",
    density: "kg_per_m3",
    phase: "rad",
  },
  stars: {
    luminosity: "solar_luminosity",
    lifetime: "yr",
    peak: "m",
    fusionEnergy: "J",
    heavy: "boolean",
  },
  universe: {
    speed: "m_per_s",
    redshift: "dimensionless",
    observed: "m",
    age: "yr",
    cmb: "K",
    brightness: "relative_inverse_Mpc2",
  },
};
for (const [id, d] of Object.entries(CURRICULUM_SIMULATIONS))
  d.csvUnits = { t: id === "solarsystem" ? "yr" : "s", ...SAMPLE_UNITS[id] };
for (const [id, practical] of Object.entries(PRACTICAL_LABS)) {
  const d = CURRICULUM_SIMULATIONS[id];
  Object.assign(d, practical.timing || {}, {
    isNew: true,
    level: practical.level || d.level,
    ended: practical.ended,
    path: practical.path,
    spectral: practical.spectral,
    sweepFor: practical.sweepFor,
    graphs: practical.graphs || d.graphs,
    csvUnits: { t: "s", ...practical.units },
  });
  if (id === "sensors")
    d.graphs.forEach(
      (g) =>
        (g.xTitleFor = (p) =>
          p.mode ? "Thermistor temperature / °C" : "Illuminance / lux"),
    );
}
// Analytic models: a bounded teaching window avoids minutes of waiting at
// extreme parameter choices. SI time remains explicit in the stage caption.
function boundedThermalStep(id, duration) {
  return (s,p,h) => {
    const stop=duration(p), remaining=stop-s.t;
    if(remaining<=0) return s;
    const next=P.stepCurriculum(id,s,p,Math.min(h,remaining));
    return remaining<=h || stop-next.t<stop*1e-12 ? {...next,t:stop} : next;
  };
}
Object.assign(CURRICULUM_SIMULATIONS.calorimetry, {
  step: boundedThermalStep("calorimetry",heatingWindow),
  rateFor: (p) => heatingWindow(p) / 45,
  hFor: (p) => heatingWindow(p) / 9000,
  sampleEvery: (p) => heatingWindow(p) / 600,
  window: (p) => heatingWindow(p),
  ended: (s,p) => s.t >= heatingWindow(p) ? "Observation temperature reached" : null,
});
Object.assign(CURRICULUM_SIMULATIONS.cooling, {
  step: boundedThermalStep("cooling",(p)=>coolingClock(p)*5),
  rateFor: (p) => coolingClock(p) / 10,
  hFor: (p) => coolingClock(p) / 1000,
  sampleEvery: (p) => coolingClock(p) / 120,
  window: (p) => coolingClock(p) * 5,
  ended: (s,p) => s.t >= coolingClock(p) * 5 ? "Five time constants reached" : null,
});
CURRICULUM_SIMULATIONS.gasprocess.ended = (s) => s.t >= 6 ? "Process complete" : null;
CURRICULUM_SIMULATIONS.gasprocess.step = boundedThermalStep("gasprocess",()=>6);

export function curriculumCalculationSheet(type, s, p, n) {
  const q = P.sampleCurriculum(type, s, p);
  return {
    type,
    time: s.t,
    variables: [
      ...PARAMETERS[type].map((c) => ({
        symbol: c.key,
        label: c.label,
        value: p[c.key],
        unit: parameterUnit(type, c),
      })),
      ...(type === "buoyancy"
        ? [
            {
              symbol: "y",
              label: "Cube centre above tank floor",
              value: q.y,
              unit: "m",
            },
            {
              symbol: "v",
              label: "Vertical velocity (up +)",
              value: q.v,
              unit: "m/s",
            },
            {
              symbol: "L",
              label: "Cube side length",
              value: q.side,
              unit: "m",
            },
            {
              symbol: "f",
              label: "Submerged volume fraction",
              value: q.fraction,
              unit: "",
            },
            {
              symbol: "g",
              label: "Gravitational acceleration",
              value: 9.81,
              unit: "m/s²",
            },
            {
              symbol: "H",
              label: "Liquid depth in motion tank",
              value: 0.5,
              unit: "m",
            },
            {
              symbol: "μ",
              label: "Assumed effective viscosity",
              value: 0.1,
              unit: "Pa·s",
            },
            {
              symbol: "Cd",
              label: "Assumed drag coefficient",
              value: 1.05,
              unit: "",
            },
          ]
        : []),
      {
        symbol: "t",
        label: "Elapsed simulation time",
        value: s.t,
        unit: type === "solarsystem" ? "yr" : "s",
      },
    ],
    calculations: WORK[type].map((r, i) => ({
      id: `${r.key}-${i}`,
      title: r.title,
      formula: r.formula,
      substitution: r.sub(p, q, n, s),
      value: q[r.key],
      unit: r.unit,
      note:
        q[r.key] === null
          ? type === "lenses"
            ? "At focus, outgoing rays are parallel. There is no finite image distance, magnification or image height."
            : "This result is undefined for this setup. See the model assumptions."
          : type === "buoyancy"
            ? "Upward is positive. Forces and immersion use the current integrated position and velocity. Values are calculated before rounding."
            : "Uses the current model state and parameters. Values are calculated before rounding for display.",
    })),
    note: "Calculated educational model; values are not experimental measurements. Parameter-sweep graphs hold all other settings fixed. See the lesson for approximations.",
  };
}
