import { readFile, access, readdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const html = await readFile("index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g))
  await access(match[1]);
assert.ok(
  !/(?:src|href)="\/(?!\/)/.test(html),
  "Asset paths must work below a GitHub Pages subdirectory.",
);
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
  "js/simulations.js",
  "js/scene3d.js",
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
for (const directory of ["js", "vendor"]) {
  for (const file of await readdir(directory)) {
    if (!file.endsWith(".js")) continue;
    const full = path.join(directory, file),
      source = await readFile(full, "utf8");
    for (const match of source.matchAll(
      /(?:from\s*|import\s*\(\s*|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g,
    ))
      await access(path.resolve(path.dirname(full), match[1]));
  }
}
console.log(
  "Static assets, local module imports, ten-lab source files, Chart.js and Three.js verified.",
);
