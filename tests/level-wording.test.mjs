import test from "node:test";
import assert from "node:assert/strict";
import { igcseWording, IGCSE_RULES, levelText, setWordingLevel } from "../js/level-wording.js";

test("IGCSE wording keeps numbers and drops A Level detail", () => {
  assert.equal(igcseWording("L = 1.50 m · rigid massless link · +θ to the right"), "L = 1.50 m");
  assert.equal(igcseWording("K 0.03 J · U 0.20 J · damping 0.00 J"), "KE 0.03 J · GPE 0.20 J");
  assert.equal(igcseWording("T₀ 2.46 s · finite-angle 2.46 s (undamped)"), null);
  assert.equal(igcseWording("Angular stops · ±24°"), "Beam stops at ±24°");
  assert.equal(igcseWording("Secondary RMS voltage / V"), "Secondary voltage / V");
  assert.equal(igcseWording("λ = 0.780 m · c = 343.2 m/s"), "λ = 0.780 m · v = 343.2 m/s");
  assert.equal(igcseWording("Maximum flux"), null);
  // Ordinary IGCSE labels pass through untouched.
  for (const text of ["n = sin i / sin r", "v = 2πr/T", "Upthrust ↑", "R₁ · 100 Ω", "Equal moments · level at release."])
    assert.equal(igcseWording(text), text);
});

test("every rule is stable: applying it twice changes nothing", () => {
  for (const [pattern, replacement] of IGCSE_RULES) {
    if (replacement === null) continue;
    const sample = String(pattern.source).replace(/[\^$\\]/g, "").replace(/\(\.\+\)|\(\\S\+[^)]*\)|\.\*|\(\.\*\)/g, "1.0");
    const once = igcseWording(sample);
    if (typeof once === "string") assert.equal(igcseWording(once), once, pattern.source);
  }
});

test("level text only rewrites while IGCSE is selected", () => {
  setWordingLevel("alevel");
  assert.equal(levelText("Maximum flux"), "Maximum flux");
  setWordingLevel("igcse");
  assert.equal(levelText("Maximum flux"), "");
  assert.equal(levelText("Primary RMS current"), "Primary current");
  setWordingLevel(null);
});

test("each experiment keeps only the labels for what it teaches", async () => {
  const { FOCUS_RULES } = await import("../js/level-wording.js");
  const { SIMULATIONS } = await import("../js/simulations.js");
  for (const id of Object.keys(FOCUS_RULES)) if (id !== "*") assert.ok(Object.hasOwn(SIMULATIONS, id), id);
  setWordingLevel("igcse", "pendulum");
  // The timing bench is about the period: energy and speed read-outs go.
  assert.equal(levelText("K 0.03 J · U 0.20 J · damping 0.00 J"), "");
  assert.equal(levelText("Speed = 0.41 m/s"), "");
  assert.equal(levelText("L = 1.50 m · rigid massless link · +θ to the right"), "L = 1.50 m");
  assert.equal(levelText("θ = 5.3°"), "θ = 5.3°");
  setWordingLevel("igcse", "moments");
  assert.equal(levelText("Angular stops · ±24°"), "");
  assert.equal(levelText("d₁ · 0.80 m"), "d₁ · 0.80 m");
  assert.equal(levelText("HYDRAULIC WORKBENCH"), "");
  // Another experiment keeps its own energy labels, and A Level keeps everything.
  setWordingLevel("igcse", "energy");
  assert.equal(levelText("Speed = 0.41 m/s"), "Speed = 0.41 m/s");
  setWordingLevel("alevel", "pendulum");
  assert.equal(levelText("Speed = 0.41 m/s"), "Speed = 0.41 m/s");
  setWordingLevel(null);
});
