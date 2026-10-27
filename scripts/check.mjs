import { readFile, access, readdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
for (const document of ["index.html", "integration.html", "solar-atlas.html"]) {
  const html = await readFile(document, "utf8");
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g))
    await access(match[1]);
  assert.ok(
    !/(?:src|href)="\/(?!\/)/.test(html),
    "Asset paths must work below a GitHub Pages subdirectory.",
  );
}
const bundle = await readFile("vendor/chart.umd.js", "utf8");
assert.ok(
  bundle.includes("Chart.js v4.5.1"),
  "Pinned Chart.js must be available locally.",
);
for (const file of [
  "js/physics.js",
  "js/canvas.js",
  "js/content.js",
  "js/app.js",
  "js/studio-app.js",
  "js/calculations.js",
  "js/expanded-view.js",
  "js/math-display.js",
  "js/integration.js",
  "js/embed-builder.js",
  "js/physics-advanced.js",
  "js/advanced-simulations.js",
  "js/content-advanced.js",
  "js/calculations-advanced.js",
  "js/scene-advanced.js",
  "js/render-advanced.js",
  "js/curriculum-physics.js",
  "js/curriculum-simulations.js",
  "js/content-curriculum.js",
  "js/render-curriculum.js",
  "js/course-map.js",
  "js/course.js",
  "js/practical-physics.js",
  "js/practical-labs.js",
  "js/render-practical.js",
  "js/question-data.js",
  "js/question-bank.js",
  "questions.css",
  "QUESTION-BANK.md",
  "curriculum.css",
  "IGCSE-COVERAGE.md",
  "frontiers.css",
  "integration.html",
  "integration.css",
  "INTEGRATION.md",
  "js/simulations.js",
  "js/scene3d.js",
  "js/scene-kit.js",
  "js/scene-finish.js",
  "js/scene-precision.js",
  "js/orbital-reference.js",
  "cinematic.css",
  "js/scene-curriculum.js",
  "js/scene-mechanics.js",
  "js/scene-thermal.js",
  "js/scene-waves.js",
  "js/scene-electric.js",
  "js/scene-space.js",
  "js/scene-guides.js",
  "js/visual-state.js",
  "js/vector-geometry.js",
  "js/scene-vectors.js",
  "js/render-vectors.js",
  "js/vector-studio.js",
  "js/buoyancy-physics.js",
  "js/buoyancy-studio.js",
  "js/scene-buoyancy.js",
  "apparatus.css",
  "learning.css",
  "js/learning-paths.js",
  "js/learning-studio.js",
  "js/syllabus.js",
  "js/syllabus-sections.js",
  "SYLLABUS-ALIGNMENT.md",
  "atlas/host.js",
  "atlas/host.css",
  "atlas/astronomy-math.js",
  "atlas/assets/earth-blue-marble.png",
  "atlas/vendor/katex/LICENSE.txt",
  "vectors.css",
  "js/render2d.js",
  "js/physics-extra.js",
  "js/content-extra.js",
  "studio.css",
  "workbench.css",
  "expanded.css",
  "vendor/three.module.min.js",
  "vendor/three.core.min.js",
  "vendor/Three.LICENSE.txt",
  "README.md",
  "vendor/Chart.LICENSE.md",
])
  await access(file);
// Validate local module imports, including Three.js's own pinned core module.
async function verifyDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      await verifyDirectory(path.join(directory, entry.name));
      continue;
    }
    const full = path.join(directory, entry.name);
    if (!full.endsWith(".js") && !full.endsWith(".css")) continue;
    const source = await readFile(full, "utf8");
    for (const match of source.matchAll(
      /(?:from\s*|import\s*\(\s*|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g,
    ))
      await access(path.resolve(path.dirname(full), match[1]));
    if (full.endsWith(".css"))
      for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g))
        if (!/^(?:data:|https?:|#)/.test(match[1]))
          await access(path.resolve(path.dirname(full), match[1]));
  }
}
for (const directory of ["js", "vendor", "atlas"])
  await verifyDirectory(directory);
console.log(
  "Static assets, local imports and fonts, 57-lab sources, Solar Atlas, question bank, course map, Chart.js and Three.js verified.",
);
