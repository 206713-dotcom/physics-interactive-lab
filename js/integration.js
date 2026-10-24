import { SIMULATIONS } from "./simulations.js";

const attribute = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

/** Share and embed URLs use the same validated SI parameters as a normal run.
 * Resolve against the current installation, including a Pages subdirectory. */
export function experimentLink({
  baseURL,
  model,
  params,
  view = "3d",
  graph,
  embed = false,
}) {
  if (!Object.hasOwn(SIMULATIONS, model))
    throw new RangeError("Unknown simulation");
  const definition = SIMULATIONS[model];
  const validated = definition.create(params ?? definition.defaults).params;
  const url = new URL("./", baseURL);
  if (!["https:", "http:"].includes(url.protocol))
    throw new TypeError("Use an HTTP or HTTPS website URL");
  url.search = embed ? "?embed=1" : "";
  const query = new URLSearchParams({
    ...validated,
    view: view === "2d" || definition.diagramOnly ? "2d" : "3d",
  });
  if (definition.graphs.some((item) => item.id === graph))
    query.set("graph", graph);
  url.hash = `/${model}?${query}`;
  return url.href;
}

/** No parent-page script, API key or cross-frame messaging is required. */
export function embedMarkup(url, title) {
  const source = new URL(url);
  if (!["https:", "http:"].includes(source.protocol))
    throw new TypeError("Invalid embed URL");
  const full = new URL(source);
  full.search = "";
  return `<iframe\n  src="${attribute(source.href)}"\n  title="${attribute(title)} — interactive physics simulation"\n  width="100%" height="860"\n  style="width:100%;height:860px;border:0;border-radius:16px;"\n  loading="lazy" referrerpolicy="strict-origin-when-cross-origin">\n</iframe>\n<p><a href="${attribute(full.href)}" target="_blank" rel="noopener">Open ${attribute(title)} in a full tab ↗</a></p>`;
}
