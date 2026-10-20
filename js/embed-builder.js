import { SIMULATIONS } from "./simulations.js";
import { experimentLink, embedMarkup } from "./integration.js";

const $ = (selector) => document.querySelector(selector);
const [path, query = ""] = location.hash.slice(1).split("?");
const initialModel = path.replace(/^\//, "");
let model = Object.hasOwn(SIMULATIONS, initialModel) ? initialModel : "gravity";
let params = { ...SIMULATIONS[model].defaults },
  graph;
const supplied = new URLSearchParams(query);
let custom = false;
try {
  for (const key of Object.keys(params))
    if (supplied.has(key)) {
      params[key] = supplied.get(key) === "" ? NaN : Number(supplied.get(key));
      custom = true;
    }
  params = SIMULATIONS[model].create(params).params;
  graph = supplied.get("graph");
} catch {
  params = { ...SIMULATIONS[model].defaults };
  custom = false;
}
for (const [id, definition] of Object.entries(SIMULATIONS)) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = definition.short;
  $("#embed-model").append(option);
}
$("#embed-model").value = model;
$("#embed-view").value = supplied.get("view") === "2d" ? "2d" : "3d";
function update() {
  const definition = SIMULATIONS[model];
  const options = {
    baseURL: location.href,
    model,
    params,
    view: $("#embed-view").value,
    graph,
  };
  const url = experimentLink({ ...options, embed: true });
  $("#embed-code").value = embedMarkup(url, definition.short);
  $("#standalone").href = url;
  $("#open-lab").href = experimentLink(options);
  $("#embed-preview").src = url;
  $("#embed-preview").title = `${definition.short} — live embedded simulation`;
  $("#setup-note").textContent = custom
    ? "Uses the initial parameters from your experiment. The embed starts a fresh, paused run."
    : "Starts with this model’s default parameters, paused at t = 0. Students can adjust every control.";
  $("#copy-status").textContent = "";
}
$("#embed-model").onchange = (event) => {
  model = event.target.value;
  params = { ...SIMULATIONS[model].defaults };
  graph = undefined;
  custom = false;
  update();
};
$("#embed-view").onchange = update;
async function copy(text, success) {
  try {
    await navigator.clipboard.writeText(text);
    $("#copy-status").textContent = success;
  } catch {
    // A visible, selectable field keeps embedding usable when clipboard access
    // is unavailable, including within restrictive school browser settings.
    $("#embed-code").focus();
    $("#embed-code").select();
    $("#copy-status").textContent =
      "Select and copy the HTML above with Ctrl+C or ⌘C.";
  }
}
$("#copy-code").onclick = () =>
  copy($("#embed-code").value, "Embed code copied. Ready for the site editor.");
$("#copy-link").onclick = () =>
  copy($("#standalone").href, "Embed URL copied.");
update();
