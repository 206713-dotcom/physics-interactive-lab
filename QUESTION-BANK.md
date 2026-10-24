# A Level practice room

[Open the practice room](https://206713-dotcom.github.io/physics-interactive-lab/#/questions)

**312 original questions in 26 groups: 208 numerical calculations and 104 explanations.** Every group has eight calculations and four explanation questions, plus a related simulation and a textbook chapter link. Each numerical question has an equation, substitution, reference result, requested unit and hint. Written answers include an explanation and reasoning checkpoints.

## Groups

| Stage guidance | Topic groups                                                                                                                                                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AS             | Measurement and uncertainty; kinematics/projectiles; Newton's laws/drag; equilibrium/moments; work/energy/power; momentum/collisions; materials/elasticity; travelling waves/sound; superposition/standing waves; refraction/lenses/polarisation; current/resistance/power; circuit analysis/sensors; photons/photoelectric effect |
| A2             | Circular motion; SHM/damping/resonance; gravitational fields/orbits; thermal physics/ideal gases; electric fields/potential; capacitors; magnetic forces; induction; alternating current; matter waves; nuclear decay/binding energy                                                                                               |
| Extension      | Particle conservation/relativity; astrophysics/cosmology                                                                                                                                                                                                                                                                           |

Stage labels and Foundation/Apply/Stretch difficulty are study guidance, not an assertion that every item appears in a particular exam board's AS or A2 syllabus. Some boards place topics differently. Suggested marks are practice guidance, not official examination mark schemes.

## Use

- Select a topic, or combine stage, difficulty, question type, search and progress filters.
- Each page is a set of up to twelve questions. Mix a selection to practise retrieval across topics.
- Enter numerical answers **in the requested unit**, using ordinary or scientific notation such as `3.2e-5` or `3.2 × 10^-5`. The checker never evaluates code.
- Numerical feedback checks the final number within **±2%** of the reference answer; an exact-zero answer uses an absolute tolerance of `1e-12`. It does not award method marks or validate a written explanation.
- Compare the worked solution and reasoning checkpoints, then mark the question **Confident** or **Needs review**. Confidence is a self-rating, not an automatically awarded score.
- Bookmark useful questions. Answers, bookmarks and ratings persist in this browser's local storage under `physics-lab-question-progress-v1`.
- Export/import a JSON progress file to move work to another browser. Imports accept only known question IDs and validated fields; they merge records.
- Print the current visible set as a blank worksheet, or choose **Include answers in print** for a worked sheet. Use the topic filter to print a complete twelve-question group.
- Clearing progress takes two clicks. Browser storage can be unavailable, private or cleared; use export to keep an independent copy.

## Books and authorship

Questions, numerical scenarios, teaching explanations and mark checkpoints are original to this project. They are not copied textbook exercises or past papers. The further-reading shelf references the openly available **OpenStax University Physics** volumes by William Moebs, Samuel J. Ling and Jeff Sanny:

1. [Volume 1: mechanics, oscillations, waves](https://openstax.org/details/books/university-physics-volume-1)
2. [Volume 2: thermodynamics and electromagnetism](https://openstax.org/details/books/university-physics-volume-2)
3. [Volume 3: optics and modern physics](https://openstax.org/details/books/university-physics-volume-3)

The references support the subject and equations, rather than claiming that OpenStax wrote or endorsed these questions. The live group heading and each worked solution link directly to a relevant chapter. Topic pages can be linked, for example `#/questions?topic=quantum` or `#/questions?topic=capacitors`.

## Constants, verification and maintenance

`js/question-data.js` is the single data source. It contains the constants, original records, reference calculations, safe answer parser and checker. All numerical references retain full precision internally; the worked result is displayed to five significant figures. A question's explicitly supplied approximation overrides the shared constants.

`js/question-bank.js` implements filtering, rendering, progress persistence/import/export and print controls. `questions.css` contains the responsive and print layouts. Physics calculations remain independent of the browser UI.

`npm test` checks all 312 records, their unique IDs/prompts, complete groups, finite answers, worked-answer round trips, model links and book URLs. Independent numerical fixtures cover every topic, including signs and unit conversions. Tests also cover combined filters, zero/tiny/negative answers, scientific notation, invalid input and defensive progress import.

Browser checks exercise numerical feedback, hints/solutions, bookmarks, confidence, persistence, search, group filtering, page navigation, mobile/tablet layout and links to simulations. The examples are calculations from stated ideal models; no experimental data is fabricated.
