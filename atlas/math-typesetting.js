import katex from "./vendor/katex/katex.js";

// Author TeX explicitly. No heuristic conversion of prose, units, or user input.
const options = {
  throwOnError: true,
  strict: "error",
  trust: false,
  output: "htmlAndMathml",
};
const cache = new Map();
export function typeset(tex, display = true) {
  const key = String(display) + tex;
  if (cache.has(key)) return cache.get(key);
  const rendered = katex.renderToString(tex, {
    ...options,
    displayMode: display,
  });
  if (cache.size > 400) cache.clear();
  cache.set(key, rendered);
  return rendered;
}
export function equation(tex, className = "equation") {
  const rows = Array.isArray(tex) ? tex : [tex];
  return `<div class="${className} math-card">${rows.map((line) => `<div class="math-row" tabindex="0" aria-label="Mathematical equation. Scroll sideways for a wide expression.">${typeset(line)}</div>`).join("")}</div>`;
}
export const inlineMath = (tex) =>
  `<span class="math-inline">${typeset(tex, false)}</span>`;
export function numberTex(value) {
  return String(value)
    .replace(/(\d),(?=\d{3}(?:\D|$))/g, "$1{,}")
    .replace(
      /([0-9.]+)e([+-]?\d+)/gi,
      (_, n, p) => String.raw`${n}\times10^{${Number(p)}}`,
    );
}
