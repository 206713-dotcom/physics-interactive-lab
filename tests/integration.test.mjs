import test from "node:test";
import assert from "node:assert/strict";
import { SIMULATIONS } from "../js/simulations.js";
import { experimentLink, embedMarkup } from "../js/integration.js";
import { mathHTML } from "../js/math-display.js";

const baseURL =
  "https://206713-dotcom.github.io/physics-interactive-lab/index.html?embed=1#/spring";
test("all thirteen embedded setups preserve validated SI values and graph selection", () => {
  for (const [model, definition] of Object.entries(SIMULATIONS)) {
    const params = Object.freeze({ ...definition.defaults });
    const graph = definition.graphs.at(-1).id;
    const link = new URL(
      experimentLink({
        baseURL,
        model,
        params,
        graph,
        view: "2d",
        embed: true,
      }),
    );
    assert.equal(link.pathname, "/physics-interactive-lab/");
    assert.equal(link.search, "?embed=1");
    const [route, raw] = link.hash.slice(1).split("?");
    assert.equal(route, `/${model}`);
    const query = new URLSearchParams(raw);
    for (const key of Object.keys(params))
      assert.equal(Number(query.get(key)), params[key]);
    assert.equal(query.get("view"), "2d");
    assert.equal(query.get("graph"), graph);
  }
});
test("share links strip embed flags, preserve nested installations and use safe view defaults", () => {
  const link = new URL(
    experimentLink({
      baseURL: "https://focusphysics.com/simulations/lab/?embed=1#/gravity",
      model: "spring",
      view: "invalid",
      graph: "unknown",
    }),
  );
  assert.equal(link.pathname, "/simulations/lab/");
  assert.equal(link.search, "");
  const query = new URLSearchParams(link.hash.split("?")[1]);
  assert.equal(query.get("view"), "3d");
  assert.equal(query.has("graph"), false);
});
test("invalid models, parameters and non-web protocols cannot generate embeds", () => {
  for (const model of ["missing", "__proto__", "constructor"])
    assert.throws(() => experimentLink({ baseURL, model }), RangeError);
  assert.throws(() =>
    experimentLink({
      baseURL,
      model: "spring",
      params: { ...SIMULATIONS.spring.defaults, mass: NaN },
    }),
  );
  assert.throws(
    () =>
      experimentLink({ baseURL: "file:///lab/index.html", model: "spring" }),
    TypeError,
  );
  assert.throws(() => embedMarkup("javascript:alert(1)", "test"), TypeError);
});
test("iframe markup escapes attributes and includes a non-embedded accessible fallback link", () => {
  const url = experimentLink({ baseURL, model: "spring", embed: true });
  const html = embedMarkup(url, 'Spring <img src=x> " onload="alert(1)');
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img src=x&gt; &quot; onload=&quot;alert(1)"));
  assert.ok(html.includes("&amp;view="));
  assert.ok(html.includes('loading="lazy"'));
  assert.ok(html.includes('height="860"'));
  assert.ok(html.includes('rel="noopener"'));
  const fallback = html.match(/<a href="([^"]+)"/)[1];
  assert.ok(!fallback.includes("embed=1"));
});
test("scientific notation is typeset without rounding away nonzero quantities", () => {
  assert.equal(
    mathHTML("6.674e-11 m³/(kg s²)"),
    "6.674 × 10<sup>-11</sup> m³/(kg s²)",
  );
  assert.equal(mathHTML("1.200e+24 kg"), "1.200 × 10<sup>24</sup> kg");
  assert.equal(mathHTML("0.0001 N"), "0.0001 N");
  assert.equal(mathHTML("F = GMm/r²"), "F = GMm/r²");
});
test("math formatting escapes markup while preserving readable equations", () => {
  assert.equal(
    mathHTML('<svg onload="x"> & 1e-9'),
    "&lt;svg onload=&quot;x&quot;&gt; &amp; 1 × 10<sup>-9</sup>",
  );
});
