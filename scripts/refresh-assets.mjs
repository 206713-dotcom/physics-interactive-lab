/** GitHub Pages caches modules independently. Version every lab module through
 * an import map so a new entry page cannot mix old and new scene code.
 * Run after changing package.json's version, then commit the generated HTML. */
import { readFile, writeFile, readdir } from "node:fs/promises";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const names = (await readdir("js")).filter((name) => name.endsWith(".js")).sort();
const imports = Object.fromEntries(names.map((name) => [`./js/${name}`, `./js/${name}?v=${version}`]));
const map = `    <!-- Versioned local module graph: npm run refresh-assets -->\n    <script type="importmap" id="lab-module-map">\n${JSON.stringify({ imports }, null, 2).split("\n").map((line) => "      " + line).join("\n")}\n    </script>`;
let html = await readFile("index.html", "utf8");
html = html.replace(/    <!-- Versioned local module graph:[\s\S]*?    <\/script>\n/, "");
html = html.replace(/href="\.\/cinematic\.css(?:\?v=[^"]*)?"/, `href="./cinematic.css?v=${version}"`);
html = html.replace(/    <script type="module" src="\.\/js\/app\.js(?:\?v=[^"]*)?"><\/script>/,
  `${map}\n    <script type="module" src="./js/app.js?v=${version}"></script>`);
await writeFile("index.html", html);
console.log(`Versioned ${names.length} laboratory modules for ${version}.`);
