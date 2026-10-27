// Radius fractions are chosen for readable cutaways, not fitted interior models.
// Layers are ordered from the centre outward. Thin surface shells are exaggerated.
const layer = (name, edge, color, text) => ({ name, edge, color, text });
const entry = (layers, evidence, question, answer) => ({
  layers,
  evidence,
  question,
  answer,
});
export const INTERIORS = {
  sun: entry(
    [
      layer(
        "Fusion core",
        0.24,
        "#fff0a0",
        "High temperature and pressure allow hydrogen fusion. The released energy supports the star against gravity.",
      ),
      layer(
        "Radiative zone",
        0.71,
        "#fca357",
        "Radiation carries energy outward through many interactions with plasma; this is not a clear window from the core.",
      ),
      layer(
        "Convective zone",
        0.97,
        "#eb6848",
        "Rising hot plasma and sinking cooler plasma transport energy by bulk motion.",
      ),
      layer(
        "Photosphere",
        1,
        "#f5c36b",
        "This light-emitting layer is the visible boundary, not solid ground. The atmosphere continues into the corona.",
      ),
    ],
    "Solar oscillations probe the interior through helioseismology. Spectra constrain the photosphere; solar neutrinos independently test fusion in the core.",
    "Why is the corona hotter than the visible surface?",
    "Magnetic processes supply energy above the photosphere. The detailed heating mechanisms remain an active research problem.",
  ),
  mercury: entry(
    [
      layer(
        "Metal-rich core",
        0.8,
        "#deae65",
        "Mercury’s unusually large metallic interior contributes strongly to its bulk density. Part of the core remains liquid.",
      ),
      layer(
        "Rocky mantle",
        0.95,
        "#af7057",
        "Silicate rock surrounds the metal. Its evolution connects early volcanism with later cooling.",
      ),
      layer(
        "Cratered crust",
        1,
        "#bdb7a7",
        "Impacts and ancient volcanic plains record the surface history. The thin exosphere is not a protective atmosphere.",
      ),
    ],
    "MESSENGER combined surface chemistry, gravity, and magnetic measurements. Spin and gravity constrain interior models without drilling to the core.",
    "How can an airless hot planet preserve water ice?",
    "Permanently shadowed polar locations can remain cold even when sunlit terrain becomes extremely hot.",
  ),
  venus: entry(
    [
      layer(
        "Metallic core",
        0.53,
        "#d6a75c",
        "An iron-rich core is expected from the planet’s rocky composition; its detailed state is poorly constrained.",
      ),
      layer(
        "Silicate mantle",
        0.96,
        "#bd7057",
        "Heat moves through the rocky interior and can drive volcanism. The history of heat loss is still debated.",
      ),
      layer(
        "Crust beneath clouds",
        1,
        "#dcb891",
        "Radar reveals the solid terrain through clouds that hide it in visible light.",
      ),
    ],
    "Radar maps constrain surface geology. Atmospheric spectra and probe measurements reveal the thick greenhouse atmosphere; interior layering is inferred less directly.",
    "Why does being farther from the Sun not make Venus cooler than Mercury?",
    "Atmospheric absorption and heat retention matter alongside sunlight. The no-atmosphere energy-balance calculator cannot reproduce Venus’s surface temperature.",
  ),
  earth: entry(
    [
      layer(
        "Solid inner core",
        0.19,
        "#f2d593",
        "Pressure keeps the central iron-rich region solid despite its high temperature.",
      ),
      layer(
        "Liquid outer core",
        0.55,
        "#f09b4e",
        "Motion of electrically conducting liquid contributes to the geodynamo that produces Earth’s magnetic field.",
      ),
      layer(
        "Rocky mantle",
        0.97,
        "#bd6550",
        "Mostly solid rock deforms slowly over geological time. The mantle is not a global magma ocean.",
      ),
      layer(
        "Crust",
        1,
        "#71babe",
        "This thin outer rocky shell carries the oceans, continents, and the Giza observatory.",
      ),
    ],
    "Earthquake waves, their travel times, and shadow zones constrain solid and liquid layers. Muography applies a different penetrating probe to much smaller targets.",
    "Can our cosmic-muon detector image Earth’s core?",
    "No. Natural muon ranges are insufficient for a path through the whole Earth. Planetary-scale interiors are inferred with other methods.",
  ),
  mars: entry(
    [
      layer(
        "Metal-rich core",
        0.53,
        "#d6a563",
        "Iron mixed with lighter elements forms the central region. Its composition and boundaries are inferred from geophysical observations.",
      ),
      layer(
        "Silicate mantle",
        0.96,
        "#b97252",
        "Internal heat shaped volcanism; the planet’s smaller size affects its long-term cooling.",
      ),
      layer(
        "Rocky crust",
        1,
        "#ca7957",
        "Dust, impact terrain, lava, and water-modified minerals preserve different periods of Martian history.",
      ),
    ],
    "InSight recorded marsquakes to constrain the interior. Rovers and orbiters study minerals, sedimentary layers, and atmospheric change.",
    "Does evidence of ancient water prove life existed?",
    "No. It establishes aspects of past environments. Demonstrating biology requires additional evidence and careful tests of nonbiological alternatives.",
  ),
  jupiter: entry(
    [
      layer(
        "Diffuse heavy-element region",
        0.34,
        "#d69768",
        "Interior models allow a broad distribution of heavy material rather than a sharply bounded solid core.",
      ),
      layer(
        "Metallic hydrogen",
        0.77,
        "#eabd66",
        "At enormous pressure hydrogen becomes electrically conducting; its motion helps generate the magnetic field.",
      ),
      layer(
        "Molecular hydrogen envelope",
        0.95,
        "#bf8b6d",
        "Hydrogen and helium become progressively less dense outward; the transition is not a wall.",
      ),
      layer(
        "Cloud layers",
        1,
        "#ddc7a1",
        "The visible belts and storms are atmospheric structures, not marks on a solid surface.",
      ),
    ],
    "Juno’s gravity and magnetic measurements constrain deep structure. Microwave observations probe below visible clouds. Several interior models can fit aspects of the data.",
    "Could you land on the cloud tops?",
    "There is no rigid surface there. A descending probe enters increasingly hot, dense, high-pressure fluid.",
  ),
  saturn: entry(
    [
      layer(
        "Heavy-element interior",
        0.34,
        "#d49b6d",
        "Rocky and icy constituents are embedded in a pressure-dominated interior; the core boundary may be diffuse.",
      ),
      layer(
        "Conducting hydrogen",
        0.64,
        "#efc877",
        "Deep hydrogen can behave as a conducting fluid. Internal heat and composition shape the structure.",
      ),
      layer(
        "Hydrogen–helium envelope",
        0.96,
        "#c4a071",
        "The atmosphere deepens into fluid. Saturn’s low bulk density does not mean every layer is low density.",
      ),
      layer(
        "Cloud tops",
        1,
        "#e4d3ae",
        "The visible boundary is atmosphere. The rings orbit outside this cutaway as separate particles.",
      ),
    ],
    "Cassini tracked gravity and magnetic fields. Waves in the rings also carry information about oscillations inside Saturn.",
    "Would Saturn float in water?",
    "Its mean density is below that of liquid water. The familiar comparison describes bulk density, not a feasible experiment or the density of its core.",
  ),
  uranus: entry(
    [
      layer(
        "Rock-rich centre",
        0.25,
        "#b8a094",
        "Rocky material is part of plausible interior models, but its distribution is not directly mapped.",
      ),
      layer(
        "Heavy fluid mixture",
        0.82,
        "#69aaa9",
        "Water, ammonia, and methane constituents may occur in exotic high-pressure states rather than everyday ice.",
      ),
      layer(
        "Hydrogen–helium envelope",
        0.95,
        "#98ccbb",
        "Lighter gases surround the heavy interior; the boundary may be gradual.",
      ),
      layer(
        "Methane-bearing atmosphere",
        1,
        "#a9dad6",
        "Methane absorbs red light. Strong axial tilt creates unusual seasonal illumination.",
      ),
    ],
    "Voyager 2 supplied close observations, gravity information, and magnetic measurements. Sparse data leave substantial uncertainty in interior layering.",
    "Does “ice giant” mean a frozen solid ball?",
    "No. It refers to composition. High pressure and temperature change the physical states of those constituents.",
  ),
  neptune: entry(
    [
      layer(
        "Rock-rich centre",
        0.26,
        "#b6a295",
        "A heavy central region is included in common models; the composition profile remains uncertain.",
      ),
      layer(
        "Heavy fluid mixture",
        0.82,
        "#578db5",
        "High-pressure water-rich mixtures contribute to the deep interior and its thermal evolution.",
      ),
      layer(
        "Hydrogen–helium envelope",
        0.95,
        "#729dc4",
        "An outer lighter envelope surrounds the heavier interior.",
      ),
      layer(
        "Dynamic atmosphere",
        1,
        "#678dc7",
        "Clouds, storms, and methane absorption shape the visible world. Winds and emitted heat are atmospheric clues.",
      ),
    ],
    "Voyager 2 and telescope observations constrain atmosphere and magnetic field. Neptune’s deep interior is inferred from limited gravity and bulk-property data.",
    "Why can it have active weather so far from the Sun?",
    "Solar energy is not its only energy source. Heat escaping from the interior also drives atmospheric processes.",
  ),
  ceres: entry(
    [
      layer(
        "Rock-rich interior",
        0.72,
        "#a4977c",
        "Ceres combines rocky material with water-related constituents; its low mean density constrains the mixture.",
      ),
      layer(
        "Water-bearing outer material",
        0.95,
        "#819c9f",
        "Hydrated minerals, ice, salts, and possible deep brines complicate a simple dry-rock picture.",
      ),
      layer(
        "Cratered crust",
        1,
        "#aaa596",
        "Bright deposits provide chemical clues about movement of salty material toward the surface.",
      ),
    ],
    "Dawn measured gravity, imaged terrain, and mapped minerals. Bright deposits and geology support a history involving water and salts.",
    "Is a bright patch automatically exposed ice?",
    "No. Reflectance alone is ambiguous. Spectroscopy identifies the substances responsible for the brightness.",
  ),
  pluto: entry(
    [
      layer(
        "Rock-rich interior",
        0.65,
        "#b2927d",
        "A differentiated rocky interior is plausible from composition and thermal models.",
      ),
      layer(
        "Water-ice shell",
        0.96,
        "#93bac4",
        "Water ice can form strong mountainous terrain at Pluto’s cold surface temperatures.",
      ),
      layer(
        "Volatile surface ices",
        1,
        "#d7cbbb",
        "Nitrogen and other volatile ices can flow, sublime, and recondense. They are different materials from water-ice bedrock.",
      ),
    ],
    "New Horizons combined imaging and spectroscopy to reveal terrain and composition. A possible subsurface ocean is inferred, not directly observed.",
    "How can such a cold world have changing terrain?",
    "Some volatile ices deform and migrate at these temperatures. Geological activity does not always require molten rock.",
  ),
  moon: entry(
    [
      layer(
        "Small metallic core",
        0.2,
        "#c79b66",
        "The lunar core is small relative to the whole Moon; its structure is inferred geophysically.",
      ),
      layer(
        "Rocky mantle",
        0.97,
        "#9c7660",
        "Early melting and later volcanism contributed to the Moon’s differentiated interior and dark plains.",
      ),
      layer(
        "Crust and regolith",
        1,
        "#bebbb1",
        "Impacts fragment surface rock into regolith. Highlands and volcanic plains record different geological histories.",
      ),
    ],
    "Apollo samples and seismic observations constrain composition and structure. Orbital gravity measurements map variations beneath the surface.",
    "Why is the phase cycle longer than the orbit period?",
    "The Moon must move a little farther after one orbit to recover the same Sun–Earth–Moon angle because Earth has also advanced around the Sun.",
  ),
  io: entry(
    [
      layer(
        "Metal-rich core",
        0.44,
        "#d6a657",
        "Gravity and composition favour a dense central region.",
      ),
      layer(
        "Tidally heated mantle",
        0.96,
        "#d47845",
        "Repeated deformation converts mechanical energy to heat. Melting and volcanism transport that heat outward.",
      ),
      layer(
        "Volcanic crust",
        1,
        "#ddc169",
        "Lava and sulfur-bearing deposits continuously remodel the visible terrain.",
      ),
    ],
    "Spacecraft images show eruptions and changing deposits. Orbital resonance provides the dynamical context for sustained tidal heating.",
    "Is Jupiter simply squeezing Io once and heating it forever?",
    "No. Repeated flexing dissipates energy; interactions with other moons maintain the orbital conditions that sustain it.",
  ),
  europa: entry(
    [
      layer(
        "Metallic core · inferred",
        0.28,
        "#d3a277",
        "A differentiated interior is consistent with the moon’s bulk properties.",
      ),
      layer(
        "Rocky interior",
        0.86,
        "#a5806d",
        "Rock–water interaction could supply chemical energy if the ocean contacts the seafloor.",
      ),
      layer(
        "Salty ocean · supported",
        0.97,
        "#469eae",
        "A conducting liquid layer helps explain magnetic observations. Its depth and chemistry remain uncertain.",
      ),
      layer(
        "Ice shell",
        1,
        "#d8e4de",
        "Fractures and disrupted terrain provide clues to stress and exchange between surface and subsurface.",
      ),
    ],
    "Galileo’s magnetic observations and geological imaging support a subsurface ocean. Multiple measurements must be combined to constrain shell and ocean properties.",
    "Does a liquid ocean establish that Europa hosts life?",
    "No. Habitability concerns suitable conditions; detecting life requires evidence of biology beyond liquid water.",
  ),
  ganymede: entry(
    [
      layer(
        "Metallic core",
        0.25,
        "#d0a47b",
        "An electrically conducting core is associated with Ganymede’s intrinsic magnetic field.",
      ),
      layer(
        "Rocky mantle",
        0.6,
        "#a48b72",
        "Rock contributes mass beneath the extensive water-rich outer regions.",
      ),
      layer(
        "Water-rich interior",
        0.95,
        "#6babb9",
        "Models can contain liquid ocean and high-pressure ice layers. Their ordering and thickness are not mapped here.",
      ),
      layer(
        "Icy crust",
        1,
        "#bfc7bc",
        "Grooved and cratered terrain record tectonic and impact histories.",
      ),
    ],
    "Magnetic-field measurements distinguish an intrinsic field from induced responses. Gravity and surface observations constrain a differentiated interior.",
    "Why is a moon larger than Mercury less massive?",
    "Volume and mass are separate. A greater proportion of lower-density water-rich material lowers mean density.",
  ),
  callisto: entry(
    [
      layer(
        "Mixed rock–ice interior",
        0.73,
        "#a69782",
        "The degree of differentiation is uncertain; this is not a confidently mapped metallic core.",
      ),
      layer(
        "Possible ocean",
        0.94,
        "#729eae",
        "Magnetic evidence allows a conducting subsurface layer, but its structure remains uncertain.",
      ),
      layer(
        "Old icy crust",
        1,
        "#aaa79c",
        "Heavily cratered terrain preserves a long impact record with comparatively limited resurfacing.",
      ),
    ],
    "Imaging records old terrain. Gravity and magnetic observations constrain interior possibilities less directly than a geological cross-section might suggest.",
    "Does an old surface rule out liquid water below?",
    "No. Surface age and subsurface thermal state are different properties. A quiet exterior can cover a more complex interior.",
  ),
  titan: entry(
    [
      layer(
        "Rock-rich interior",
        0.5,
        "#baa084",
        "The deep interior contributes mass and heat beneath the water-rich outer regions.",
      ),
      layer(
        "Deep high-pressure material",
        0.74,
        "#7c9fa4",
        "Water-rich constituents can have high-pressure states unlike familiar surface ice.",
      ),
      layer(
        "Subsurface ocean · inferred",
        0.95,
        "#64a6b6",
        "Geophysical observations support liquid beneath the crust. Composition and exchange remain uncertain.",
      ),
      layer(
        "Water-ice crust",
        1,
        "#c1b69b",
        "At Titan’s temperature water ice acts as bedrock. Methane and ethane form the surface liquids.",
      ),
    ],
    "Cassini radar mapped lakes and terrain through haze. Huygens measured the atmosphere and surface; geophysical observations constrain an internal ocean.",
    "Are Titan’s lakes liquid water?",
    "No. The surface lakes are mainly methane and ethane. A proposed water-rich ocean is a separate subsurface reservoir.",
  ),
  enceladus: entry(
    [
      layer(
        "Rocky core",
        0.73,
        "#b29977",
        "Water–rock interaction can supply chemicals and heat to the overlying ocean.",
      ),
      layer(
        "Global ocean",
        0.93,
        "#53a9bb",
        "Gravity and rotational wobble support a liquid layer beneath the shell. Plumes provide samples from this system.",
      ),
      layer(
        "Ice shell",
        1,
        "#dbe9e5",
        "South-polar fractures vent material. Shell thickness varies and is exaggerated in the cutaway.",
      ),
    ],
    "Cassini sampled plume particles and gases. Gravity, libration, salts, and silica together support an ocean and water–rock interaction.",
    "Do organic molecules in a plume prove life?",
    "No. Organic chemistry can occur without organisms. It identifies ingredients and processes worth investigating.",
  ),
  triton: entry(
    [
      layer(
        "Rock-rich interior",
        0.63,
        "#b6a08b",
        "Composition and thermal models imply a substantial rocky fraction.",
      ),
      layer(
        "Water-rich shell",
        0.95,
        "#9dbcc5",
        "Subsurface liquid is a possibility in thermal models, not an established measured ocean here.",
      ),
      layer(
        "Nitrogen-frost surface",
        1,
        "#d2c8c5",
        "Cold volatile deposits and observed plumes show that an icy surface need not be static.",
      ),
    ],
    "Voyager 2 observed terrain and active plumes. The retrograde orbit supports a capture history; deep interior information remains limited.",
    "Why is its backward orbit a clue?",
    "A large moon formed in the planet’s circumplanetary disc would normally share the disc’s sense of rotation. Capture can produce a different orbit.",
  ),
  charon: entry(
    [
      layer(
        "Rock-rich interior",
        0.65,
        "#ab9787",
        "Bulk density favours a mixture of rock and water ice; differentiation depends on thermal history.",
      ),
      layer(
        "Water-ice outer region",
        0.95,
        "#a9c2c9",
        "Freezing and expansion of an ancient internal liquid reservoir is one interpretation of the geological record.",
      ),
      layer(
        "Fractured crust",
        1,
        "#beb7ad",
        "Large canyons preserve evidence of extension. They do not establish a liquid ocean today.",
      ),
    ],
    "New Horizons imaged fractures and mapped surface composition. Models connect the terrain to internal evolution, but are not direct measurements of deep layers.",
    "Why does the Pluto–Charon pair have an external barycentre?",
    "Charon’s mass is substantial relative to Pluto’s. The common centre is the separation multiplied by Charon’s fraction of the total mass.",
  ),
};
export const INTERIOR_SOURCES = {
  sun: [
    "NASA · Helioseismology",
    "https://solarscience.msfc.nasa.gov/Helioseismology.shtml",
  ],
  mercury: [
    "NASA · Mercury’s partially liquid core",
    "https://www.nasa.gov/solar-system/messenger-provides-new-look-at-mercurys-surprising-core-and-landscape-curiosities/",
  ],
  saturn: [
    "Mankovich & Fuller · Ring seismology",
    "https://arxiv.org/abs/2104.13385",
  ],
  charon: [
    "NASA · A possible ancient ocean",
    "https://science.nasa.gov/photojournal/plutos-hulk-like-moon-charon-a-possible-ancient-ocean/",
  ],
};
