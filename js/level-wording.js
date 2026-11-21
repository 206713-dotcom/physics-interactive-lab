/** IGCSE wording. The models are shared between IGCSE and AS / A Level, and
 * many labels were written for the full model ("rigid massless link",
 * "RMS voltage", "flux"). While the IGCSE level is selected, every label is
 * passed through these rules: advanced wording is replaced with the words the
 * 0625 syllabus uses, and labels that only make sense at A Level are dropped.
 * Numbers inside a label are kept exactly as the model produced them. */

/** [pattern, replacement]. A replacement of null removes the label. */
export const IGCSE_RULES = [
  // Pendulum
  [/^(L = \S+ m) · rigid massless link.*$/, "$1"],
  [/^Rigid link can pull or push.*$/, null],
  [/^T₀ .*\(undamped\)$/, null],
  [/^K (\S+ J) · U (\S+ J) · damping .*$/, "KE $1 · GPE $2"],
  [/^Gold: velocity · purple: total acceleration.*$/, "Gold arrow: velocity"],
  // Moments
  [/^Angular stops · (.+)$/, "Beam stops at $1"],
  // Motion and measurement
  [/ · exact linear drag$/, " · with air resistance"],
  [/endpoint uncertainty/g, "the effect of reaction time"],
  [/^Ideal ruler · model timing$/, "Ruler and stopwatch"],
  // Thermal
  [/^Exact lumped Newton cooling · no evaporation$/, "No evaporation"],
  // Magnetism and charged particles
  [/^μ₀ ≈ .* · field-line sketch$/, "Field-line sketch"],
  [/^r = .* · \|F\| = .*$/, null],
  [/^⊙ out · \|B\| = .*$/, "⊙ Magnetic field out of the page"],
  [/^Uniform field · one fixed position scale per setup$/, "Uniform magnetic field"],
  // Space
  [/^Hubble-law snapshot.*$/, "Hubble’s law snapshot"],
  [/^Low-z Hubble model.*$/, "Galaxies moving apart"],
  [/^z ≈ .*$/, null],
  [/^Qualitative stages · analytic reference estimates$/, "Qualitative stages"],
  // Radioactivity and the atom
  [/^Seed \d+ · each nucleus has an exponential waiting time$/, "Each nucleus decays at random"],
  [/^Trajectories schematic; angle computed for selected b\.$/, "The paths are a sketch"],
  // Sound
  [/^Fixed 2 m window · slowed clock · schematic parcel displacement$/, "Slowed down so you can watch"],
  [/^(λ = \S+ m) · c = (\S+ m\/s)$/, "$1 · v = $2"],
  // Lenses
  [/^Signed distances · heights linear$/, "Distances measured from the lens"],
  [/^v = (\S+ cm) · m = -?[\d.]+$/, "Image $1 from the lens"],
  // Pressure and electricity
  [/^Quasistatic · shared travel scale$/, "Pressed slowly and steadily"],
  [/^Unloaded divider · ideal comparator$/, "Potential divider"],
  // Transformer
  [/^Shared changing flux$/, "Changing magnetic field in the core"],
  [/^Flux passes through zero · voltage is at a peak$/, "Field changing fastest · voltage is at a peak"],
  [/^Changing core flux induces the secondary voltage$/, "A changing magnetic field in the core induces the secondary voltage"],
  [/^RMS readouts · .*$/, "AC slowed down for display"],
  [/\b(Primary|Secondary) RMS (voltage|current)\b/g, "$1 $2"],
  [/^Maximum flux$/, null],
  [/^Compare the voltage with the changing core flux$/, "Compare the voltage with the changing magnetic field in the core"],
  // Floating and sinking: keep the idea, drop the drag model and the A Level law
  [/^Upthrust uses the actual submerged volume\..*$/, null],
  [/^Read Archimedes’ principle · OpenStax ↗$/, null],
  // Magnetism
  [/^Signed reference field = .*$/, null],
  // Optics
  [/^Unpolarised reflected fraction$/, null],
  // Application notes written for the full model
  [/^Musical instruments, microwave cavities, optical resonators and vibration analysis use interference and standing modes\.$/,
    "Musical instruments, ripple tanks and earthquake detectors all depend on how waves reflect and spread."],
  [/^Electrostatic sensing, particle deflection, capacitor design and charged-particle optics all depend on electric fields and potential\.$/,
    "Photocopiers, paint sprayers and smoke-stack dust filters all use electric charge and electric fields."],
];

/** Labels inside one experiment that are not part of what that experiment
 * teaches: side quantities (energy on the pendulum timing bench), model
 * caveats ("ideal", "schematic", "fixed scale") and workshop-style banners.
 * [pattern, replacement]; null removes the label. Applied at IGCSE only. */
const DROP = null;
export const FOCUS_RULES = {
  "*": [
    [/^[A-Z’' &·.\-]*\b(WORKBENCH|BENCH|LAB|STUDIO|DESK|MACHINE|OBSERVATORY|GAUGE|ORRERY|TRACK|CHAMBER)$/, DROP],
  ],
  hydraulics: [[/^W in = W out = .*$/, DROP], [/^Pressed slowly and steadily$/, DROP]],
  hooke: [[/^Elastic energy .*$/, DROP], [/^equivalent stiffness$/, DROP], [/^Extension shown on a compressed scale$/, DROP]],
  sensors: [[/^Ideal threshold indicator$/, DROP], [/^Divider (I =|current) .*$/, DROP], [/^\S+ V reference$/, DROP]],
  radiation: [[/^\S+ px = rβ = .*$/, DROP], [/^BETA · INDEPENDENT SCALE$/, DROP], [/^Main view: .*$/, DROP], [/^α radius .*$/, DROP], [/^β speed .*$/, DROP], [/^γ travels at c$/, DROP]],
  rectifier: [[/^Output pulses .*$/, DROP], [/^Zero crossing$/, DROP], [/^Half-wave · ideal diode$/, "Half-wave rectifier"]],
  filament: [[/^Energy residual .*$/, DROP], [/^Glow colour illustrative.*$/, DROP], [/^P in .* · P out .*$/, DROP], [/^Stored thermal energy$/, DROP],
    [/^Energy to surroundings$/, DROP], [/^Electrical input .*$/, DROP], [/^Glass shown as a cutaway$/, DROP]],
  cooling: [[/^τ = .*$/, DROP], [/^Initial excess energy = released \+ remaining$/, DROP], [/^Released:? .*$/, DROP], [/^Remaining( excess energy)?:? .*$/, DROP],
    [/^Cooling slows as ΔT shrinks$/, "Cooling slows as it nears room temperature"]],
  measurement: [[/^uT = .*$/, DROP], [/^± \S+ m resolution$/, DROP]],
  motion: [[/^Calculated \S+ Hz position marks$/, DROP], [/^Fixed eight-second displacement scale.*$/, DROP], [/^Motion on a fixed displacement scale$/, DROP],
    [/^Gold v · coral applied · blue drag · purple (net|resultant)$/, "Gold: velocity · coral: push · blue: air resistance · purple: resultant force"],
    [/^Net = (\S+ N) · a = (.*)$/, "Resultant force = $1 · a = $2"]],
  vectors: [[/^R[ᵧₓ] = .*$/, DROP]],
  moments: [[/^(Angular stops ·|Beam stops at) .*$/, DROP]],
  buoyancy: [[/^Support force$/, DROP], [/^Actual vertical motion · upward is positive$/, DROP], [/^Release from rest$/, DROP]],
  gases: [[/^Gold particle · .*$/, DROP], [/^Particles enlarged · motion slowed$/, DROP], [/^Pressure is calculated independently of these dots$/, DROP]],
  expansion: [[/^Overlay exaggerates ΔL\..*$/, DROP], [/^Extension overlay magnified ×\S+$/, DROP]],
  calorimetry: [[/^Phase volumes (schematic|illustrative.*)$/, DROP], [/^Water at \S+ atm(osphere)? · .*$/, DROP]],
  heat: [[/^Reservoir temperatures held constant$/, DROP]],
  wavefronts: [[/^Schematic ripple tank$/, "Ripple tank"]],
  lenses: [[/^Paraxial thin-lens principal rays$/, DROP]],
  dispersion: [[/^In material\s+\S+ nm$/, DROP], [/^λ in material\s+\S+ nm$/, DROP], [/^Air → material · no prism or second face$/, DROP],
    [/^Closer fronts · lower speed · same frequency$/, "Closer wavefronts: light is slower in the material"],
    [/^Frequency stays the same across the boundary$/, DROP], [/^ONE INTERFACE · FOLLOW A WAVEFRONT$/, "FOLLOW ONE COLOUR OF LIGHT"]],
  spectrum: [[/^Electric field · transverse$/, DROP], [/^Logarithmic wavelength ruler$/, DROP],
    [/^Field sketch · all vacuum EM waves travel at c$/, "All electromagnetic waves travel at the same speed in a vacuum"]],
  sound: [[/^Source p = .*$/, DROP], [/^Relative pressure$/, DROP]],
  devices: [[/^\S+ V forward-drop model$/, DROP], [/^Reverse breakdown is omitted$/, DROP], [/^Diode (drop =|voltage) .*$/, DROP],
    [/^Forward biased · current flows$/, "Diode conducts · current flows"]],
  magnetism: [[/^B = .* mT$/, DROP], [/^Drawn turns simplified$/, DROP], [/^(\S+ A) · reverse I to reverse B$/, "$1 · reverse the current to reverse the field"]],
  charged: [[/^r = \S+ m$/, DROP], [/^\|F\| = .*$/, DROP], [/^K = .* \(constant\)$/, DROP]],
  atom: [[/^No classical electron orbits implied$/, DROP], [/^Nucleus \/ atom sizes enlarged independently$/, "Not to scale"]],
  radioactivity: [[/^Each nucleus has its own seeded event time$/, "Each nucleus decays at a random time"], [/^ensemble expectation$/, "expected"],
    [/^Dots = one random sample\. Curve = mathematical expectation\.$/, "Dots: one random sample · Curve: the expected trend"]],
  earthmoon: [[/^Sizes \/ distances \/ phase speed illustrative$/, "Not to scale"]],
  solarsystem: [[/^Log radius view · circular reference orbits$/, "Not to scale"]],
  stars: [[/^\S+ M☉ · lower-mass branch$/, DROP], [/^λpeak = .*$/, DROP], [/^Qualitative stages$/, DROP]],
  pendulum: [[/^KE .* · GPE .*$/, DROP], [/^Speed = .*$/, DROP], [/^Gold arrow: velocity$/, DROP]],
  collisions: [[/^K = .* · transferred internally: .*$/, DROP], [/^Fixed lab ruler · positive x to the right$/, DROP], [/^Σp = (.*)$/, "Total momentum = $1"]],
  waves: [[/^\S+ \+ \(\S+\) = \S+ m$/, DROP]],
};
let focus = null;

const cache = new Map();
/** The IGCSE form of a label, or null when the label should not appear. */
export function igcseWording(text) {
  if (typeof text !== "string" || !text) return text;
  if (cache.has(text)) return cache.get(text);
  let out = text;
  // Experiment rules run before and after the level rules, so they can be
  // written against either the original label or its IGCSE wording.
  const own = FOCUS_RULES[focus] ?? [];
  for (const [pattern, replacement] of [...own, ...FOCUS_RULES["*"], ...IGCSE_RULES, ...own]) {
    pattern.lastIndex = 0;
    if (!pattern.test(out)) continue;
    pattern.lastIndex = 0;
    if (replacement === null) {
      out = null;
      break;
    }
    out = out.replace(pattern, replacement);
  }
  if (cache.size > 4000) cache.clear();
  cache.set(text, out);
  return out;
}

let level = null;
export const wordingLevel = () => level;
/** Called when an experiment opens or its level changes. */
export function setWordingLevel(mode, experiment = null) {
  level = mode === "igcse" ? "igcse" : null;
  if (focus !== experiment) cache.clear();
  focus = experiment;
}
/** Text as it should be shown at the current level ("" when it is dropped). */
export function levelText(text) {
  return level === "igcse" ? (igcseWording(text) ?? "") : text;
}

/** Route every canvas label through the rules. The 2D diagrams, the 3D label
 * sprites and the graphs all draw their text with fillText, so one wrapper
 * covers them without touching each of the 59 scenes. measureText is wrapped
 * too, so label boxes fit the reworded text. */
let installed = false;
export function installCanvasWording() {
  if (installed || typeof CanvasRenderingContext2D === "undefined") return;
  installed = true;
  const proto = CanvasRenderingContext2D.prototype;
  for (const name of ["fillText", "strokeText", "measureText"]) {
    const original = proto[name];
    proto[name] = function (text, ...rest) {
      if (level === "igcse" && typeof text === "string") {
        const shown = igcseWording(text);
        if (shown === null) return name === "measureText" ? original.call(this, "", ...rest) : undefined;
        text = shown;
      }
      return original.call(this, text, ...rest);
    };
  }
}

/** Reword live text inside a page region (readouts, consoles) while IGCSE is selected. */
export function watchText(root) {
  if (!root || typeof MutationObserver === "undefined") return () => {};
  const fix = (node) => {
    if (level !== "igcse" || node.nodeType !== 3) return;
    const shown = igcseWording(node.nodeValue.trim());
    if (shown === node.nodeValue.trim()) return;
    if (shown === null) {
      const box = node.parentElement?.closest(".metric, .readout, li, p, span");
      if (box) box.hidden = true;
      node.nodeValue = "";
    } else node.nodeValue = shown;
  };
  const walk = (node) => {
    if (node.nodeType === 3) return fix(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) fix(walker.currentNode);
  };
  walk(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") fix(record.target);
      else record.addedNodes.forEach(walk);
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true });
  return () => observer.disconnect();
}
