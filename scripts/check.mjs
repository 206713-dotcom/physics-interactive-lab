import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
const html=await readFile('index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g))await access(match[1]);
assert.ok(!/(?:src|href)="\/(?!\/)/.test(html),'Asset paths must work below a GitHub Pages subdirectory.');
const bundle=await readFile('vendor/chart.umd.js','utf8');assert.ok(bundle.includes('Chart.js v4.5.1'),'Pinned Chart.js must be available locally.');
for(const file of ['js/physics.js','js/canvas.js','js/content.js','js/app.js','README.md','vendor/Chart.LICENSE.md'])await access(file);
console.log('Static asset paths, required files and vendored Chart.js verified.');
