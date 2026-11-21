/** The apparatus tray: measuring tools that sit on top of any experiment.
 * Stopwatch and timer follow the model's own clock, so slow motion, pausing
 * and replays are timed the way the experiment actually ran. The ruler and
 * protractor measure what is on the screen: angles are true in the 2D diagram,
 * and the ruler reads real units once it has been set against a known length. */

const DEG = Math.PI / 180;

/** 83.456 → "01:23.45"; long astronomical runs switch to hours and days. */
export function formatElapsed(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  if (s >= 172800) return `${(s / 86400).toFixed(2)} d`;
  if (s >= 3600) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}:${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }
  const whole = Math.floor(s * 100 + 1e-6), m = Math.floor(whole / 6000);
  return `${String(m).padStart(2, "0")}:${String(Math.floor((whole % 6000) / 100)).padStart(2, "0")}.${String(whole % 100).padStart(2, "0")}`;
}

/** A clock driven by somebody else's time: feed it the model time each frame. */
export function createClock() {
  let elapsed = 0, last = null, running = false;
  const laps = [];
  return {
    get elapsed() { return elapsed; },
    get running() { return running; },
    get laps() { return laps; },
    start() { running = true; last = null; },
    stop() { running = false; },
    reset() { elapsed = 0; last = null; laps.length = 0; },
    lap() { laps.unshift(elapsed); if (laps.length > 6) laps.pop(); },
    /** A model that restarts jumps back to zero; that jump is not counted. */
    feed(time) {
      if (running && last !== null && time > last) elapsed += time - last;
      last = time;
    },
  };
}

/** Angle at the middle point of three points, in degrees (0 to 180). */
export function angleBetween(a, vertex, b) {
  const u = [a[0] - vertex[0], a[1] - vertex[1]], v = [b[0] - vertex[0], b[1] - vertex[1]],
    size = Math.hypot(...u) * Math.hypot(...v);
  if (!size) return 0;
  return Math.acos(Math.min(1, Math.max(-1, (u[0] * v[0] + u[1] * v[1]) / size))) / DEG;
}

/** A small calculator: + − × ÷ ^, brackets, sqrt sin cos tan (degrees), pi, ans.
 * Parsed by hand; nothing is ever passed to eval. */
export function calculate(expression, ans = 0) {
  const src = String(expression).replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").toLowerCase();
  let i = 0;
  const functions = { sqrt: Math.sqrt, sin: (x) => Math.sin(x * DEG), cos: (x) => Math.cos(x * DEG), tan: (x) => Math.tan(x * DEG), abs: Math.abs, log: Math.log10, ln: Math.log },
    fail = () => { throw new Error("Check the expression"); },
    primary = () => {
      if (src[i] === "(") {
        i++;
        const value = sum();
        if (src[i++] !== ")") fail();
        return value;
      }
      const word = /^[a-zπ]+/.exec(src.slice(i))?.[0];
      if (word) {
        i += word.length;
        if (word === "pi" || word === "π") return Math.PI;
        if (word === "e") return Math.E;
        if (word === "ans") return ans;
        if (!functions[word] || src[i] !== "(") fail();
        return functions[word](primary());
      }
      const number = /^\d*\.?\d+(e[+-]?\d+)?/.exec(src.slice(i))?.[0];
      if (!number) fail();
      i += number.length;
      return Number(number);
    },
    unary = () => (src[i] === "-" ? (i++, -unary()) : src[i] === "+" ? (i++, unary()) : power()),
    power = () => {
      const base = primary();
      return src[i] === "^" ? (i++, base ** unary()) : base;
    },
    product = () => {
      let value = unary();
      while (src[i] === "*" || src[i] === "/") value = src[i++] === "*" ? value * unary() : value / unary();
      return value;
    },
    sum = () => {
      let value = product();
      while (src[i] === "+" || src[i] === "-") value = src[i++] === "+" ? value + product() : value - product();
      return value;
    };
  if (!src) fail();
  const result = sum();
  if (i !== src.length || !Number.isFinite(result)) fail();
  return result;
}
export const tidyNumber = (n) => (Math.abs(n) >= 1e6 || (n !== 0 && Math.abs(n) < 1e-3) ? n.toExponential(3) : String(Number(n.toPrecision(8))));

const TOOLS = [
  ["stopwatch", "⏱", "Stopwatch"],
  ["timer", "⏳", "Timer"],
  ["ruler", "📏", "Ruler"],
  ["protractor", "📐", "Protractor"],
  ["grid", "▦", "Grid"],
  ["calculator", "🧮", "Calculator"],
  ["record", "📝", "Record reading"],
];

/** @param {{stage: HTMLElement, surface: HTMLElement, record: () => void, pause: () => void}} host */
export function installApparatus({ stage, surface, record, pause }) {
  const top = stage.querySelector(".stage-top .running-status") ?? stage.firstElementChild;
  top.insertAdjacentHTML("afterend", `<span class="apparatus-menu"><button type="button" class="apparatus-button" aria-expanded="false" aria-controls="apparatus-tray">🧰 Apparatus</button><span class="apparatus-tray" id="apparatus-tray" hidden>${TOOLS.map(([id, icon, name]) => `<button type="button" data-tool="${id}" aria-pressed="false"><span aria-hidden="true">${icon}</span>${name}</button>`).join("")}</span></span>`);
  if (getComputedStyle(surface).position === "static") surface.style.position = "relative";
  const layer = document.createElement("div");
  layer.className = "apparatus-layer";
  layer.innerHTML = '<div class="apparatus-grid" hidden></div><svg class="apparatus-svg" aria-hidden="true"></svg>';
  surface.append(layer);
  const menu = stage.querySelector(".apparatus-menu"), button = menu.querySelector(".apparatus-button"),
    tray = menu.querySelector(".apparatus-tray"), svg = layer.querySelector("svg"),
    stopwatch = createClock(), timer = createClock(), widgets = {}, open = new Set();
  let timerLength = 10, timerDone = false, ans = 0, stopAtZero = true,
    ruler = null, protractor = null, rulerScale = null;

  button.onclick = () => {
    tray.hidden = !tray.hidden;
    button.setAttribute("aria-expanded", String(!tray.hidden));
  };
  const closeTray = (e) => { if (!menu.contains(e.target)) { tray.hidden = true; button.setAttribute("aria-expanded", "false"); } };
  document.addEventListener("pointerdown", closeTray);

  /** Drag anything by pointer; `move` receives the position inside the layer. */
  function draggable(handle, move) {
    handle.style.touchAction = "none";
    handle.onpointerdown = (e) => {
      if (e.target.closest("button,input,label")) return;
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      const box = layer.getBoundingClientRect(), start = [e.clientX, e.clientY];
      handle.onpointermove = (m) => move(
        Math.min(box.width, Math.max(0, m.clientX - box.left)), Math.min(box.height, Math.max(0, m.clientY - box.top)),
        m.clientX - start[0], m.clientY - start[1]);
      handle.onpointerup = handle.onpointercancel = () => (handle.onpointermove = null);
    };
  }
  function widget(id, title, body, at) {
    const el = document.createElement("section");
    el.className = `apparatus-widget apparatus-${id}`;
    el.setAttribute("aria-label", title);
    el.innerHTML = `<header><strong>${title}</strong><button type="button" data-close aria-label="Put ${title} away">×</button></header>${body}`;
    // Tools line up along the top, wrapping to a second row, so none opens on top of another.
    const columns = Math.max(1, Math.floor((layer.clientWidth - 16) / 246)), slot = Object.keys(widgets).length;
    void at;
    el.style.left = 16 + (slot % columns) * 246 + "px";
    el.style.top = 64 + Math.floor(slot / columns) * 250 + "px";
    layer.append(el);
    let origin = null;
    draggable(el.querySelector("header"), (x, y, dx, dy) => {
      origin ??= [el.offsetLeft, el.offsetTop];
      el.style.left = Math.max(0, Math.min(layer.clientWidth - 60, origin[0] + dx)) + "px";
      el.style.top = Math.max(0, Math.min(layer.clientHeight - 40, origin[1] + dy)) + "px";
    });
    el.querySelector("header").addEventListener("pointerup", () => (origin = null));
    el.querySelector("[data-close]").onclick = () => toggle(id, false);
    return (widgets[id] = el);
  }

  const builders = {
    stopwatch() {
      const el = widget("stopwatch", "Stopwatch", '<output class="apparatus-time">00:00.00</output><p class="apparatus-note">Follows the experiment’s clock</p><div class="apparatus-row"><button type="button" data-do="go" class="primary">Start</button><button type="button" data-do="lap">Lap</button><button type="button" data-do="reset">Reset</button></div><ol class="apparatus-laps"></ol>', [16, 16]);
      el.onclick = (e) => {
        const action = e.target.dataset?.do;
        if (action === "go") stopwatch.running ? stopwatch.stop() : stopwatch.start();
        if (action === "lap" && stopwatch.elapsed > 0) stopwatch.lap();
        if (action === "reset") { stopwatch.stop(); stopwatch.reset(); }
        if (action) paint();
      };
    },
    timer() {
      const el = widget("timer", "Timer", '<output class="apparatus-time">00:10.00</output><label class="apparatus-field">Count down from <input type="number" min="0.1" step="any" value="10" aria-label="Seconds to count down"> s</label><label class="apparatus-check"><input type="checkbox" checked> Pause the experiment at zero</label><div class="apparatus-row"><button type="button" data-do="go" class="primary">Start</button><button type="button" data-do="reset">Reset</button></div>', [16, 190]);
      el.querySelector("input[type=number]").oninput = (e) => {
        const value = Number(e.target.value);
        if (value > 0 && Number.isFinite(value)) { timerLength = value; timer.stop(); timer.reset(); timerDone = false; paint(); }
      };
      el.querySelector("input[type=checkbox]").onchange = (e) => (stopAtZero = e.target.checked);
      el.onclick = (e) => {
        const action = e.target.dataset?.do;
        if (action === "go") {
          if (timerDone) { timer.reset(); timerDone = false; }
          timer.running ? timer.stop() : timer.start();
        }
        if (action === "reset") { timer.stop(); timer.reset(); timerDone = false; }
        if (action) paint();
      };
    },
    calculator() {
      const el = widget("calculator", "Calculator", '<input class="apparatus-expression" type="text" inputmode="decimal" spellcheck="false" autocomplete="off" aria-label="Calculation" placeholder="e.g. 3 × 9.8 × 0.4"><output class="apparatus-answer">= 0</output><div class="apparatus-keys">' + ["7", "8", "9", "÷", "sqrt(", "4", "5", "6", "×", "^", "1", "2", "3", "−", "(", "0", ".", "ans", "+", ")"].map((k) => `<button type="button" data-key="${k}">${k === "sqrt(" ? "√" : k}</button>`).join("") + '</div><div class="apparatus-row"><button type="button" data-do="clear">Clear</button><button type="button" data-do="equals" class="primary">=</button></div><p class="apparatus-note">sin, cos and tan take degrees</p>', [220, 16]);
      const input = el.querySelector("input"), out = el.querySelector("output"),
        run = () => {
          try { ans = calculate(input.value, ans); out.textContent = "= " + tidyNumber(ans); out.classList.remove("is-error"); }
          catch (error) { out.textContent = error.message; out.classList.add("is-error"); }
        };
      input.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") run(); };
      el.onclick = (e) => {
        if (e.target.dataset?.key) { input.value += e.target.dataset.key; input.focus(); }
        if (e.target.dataset?.do === "clear") { input.value = ""; out.textContent = "= 0"; out.classList.remove("is-error"); }
        if (e.target.dataset?.do === "equals") run();
      };
    },
    ruler() {
      const w = layer.clientWidth, h = layer.clientHeight;
      ruler = { a: [w * 0.3, h * 0.6], b: [w * 0.6, h * 0.6] };
      const el = widget("ruler", "Ruler", '<output class="apparatus-reading">0 px</output><label class="apparatus-field">This length is really <input type="number" min="0" step="any" aria-label="Real length of the ruler span" placeholder="?"> <input type="text" value="m" size="3" aria-label="Unit"></label><div class="apparatus-row"><button type="button" data-do="scale" class="primary">Set scale</button><button type="button" data-do="unscale">Clear</button></div><p class="apparatus-note">Lay it on a labelled length, set the scale, then measure anything in the 2D diagram.</p>', [16, h - 210]);
      el.onclick = (e) => {
        const real = Number(el.querySelector("input[type=number]").value), unit = el.querySelector("input[type=text]").value.trim() || "units",
          length = Math.hypot(ruler.b[0] - ruler.a[0], ruler.b[1] - ruler.a[1]);
        if (e.target.dataset?.do === "scale" && real > 0 && length > 0) rulerScale = { perPixel: real / length, unit };
        if (e.target.dataset?.do === "unscale") rulerScale = null;
        if (e.target.dataset?.do) paint();
      };
    },
    protractor() {
      const w = layer.clientWidth, h = layer.clientHeight;
      protractor = { a: [w * 0.62, h * 0.3], v: [w * 0.5, h * 0.5], b: [w * 0.68, h * 0.5] };
      widget("protractor", "Protractor", '<output class="apparatus-reading">0°</output><p class="apparatus-note">Put the middle dot on the corner and an arm along each line. Angles are true in the 2D diagram.</p>', [w - 236, 16]);
    },
  };

  function toggle(id, on = !open.has(id)) {
    if (id === "record") return record();
    on ? open.add(id) : open.delete(id);
    tray.querySelector(`[data-tool="${id}"]`).setAttribute("aria-pressed", String(on));
    if (id === "grid") layer.querySelector(".apparatus-grid").hidden = !on;
    else if (on) builders[id]();
    else {
      widgets[id]?.remove();
      delete widgets[id];
      if (id === "ruler") ruler = null;
      if (id === "protractor") protractor = null;
    }
    paint();
  }
  tray.onclick = (e) => {
    const id = e.target.closest("[data-tool]")?.dataset.tool;
    if (id) toggle(id);
  };

  /** Build the ruler and protractor shapes once; dragging only moves them. */
  function drawOverlay() {
    const dot = (key, color) => `<circle data-point="${key}" r="11" fill="${color}" fill-opacity=".25" stroke="${color}" stroke-width="2.5"/>`;
    svg.innerHTML =
      (ruler ? `<path data-shape="ruler-line" stroke="#ffd166" stroke-width="5" stroke-linecap="round"/><path data-shape="ruler-ticks" stroke="#ffd166" stroke-width="1.5"/>${dot("ruler.a", "#ffd166")}${dot("ruler.b", "#ffd166")}` : "") +
      (protractor ? `<path data-shape="arms" fill="none" stroke="#7ef0e2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path data-shape="arc" fill="none" stroke="#7ef0e2" stroke-width="2" stroke-dasharray="4 4"/>${dot("protractor.a", "#7ef0e2")}${dot("protractor.b", "#7ef0e2")}${dot("protractor.v", "#ffffff")}` : "");
    svg.querySelectorAll("[data-point]").forEach((node) => {
      const [tool, key] = node.dataset.point.split(".");
      draggable(node, (x, y) => {
        (tool === "ruler" ? ruler : protractor)[key] = [x, y];
        paint(false);
      });
    });
  }
  function placeOverlay() {
    const shape = (name) => svg.querySelector(`[data-shape="${name}"]`);
    if (ruler) {
      const { a, b } = ruler, length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
      let ticks = "";
      for (let d = 0; d <= length; d += 10) {
        const x = a[0] + ((b[0] - a[0]) * d) / length, y = a[1] + ((b[1] - a[1]) * d) / length, size = d % 50 === 0 ? 12 : 6;
        ticks += `M${x} ${y}l${n[0] * size} ${n[1] * size}`;
      }
      shape("ruler-line")?.setAttribute("d", `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);
      shape("ruler-ticks")?.setAttribute("d", ticks);
    }
    if (protractor) {
      const { a, v, b } = protractor, start = Math.atan2(a[1] - v[1], a[0] - v[0]), end = Math.atan2(b[1] - v[1], b[0] - v[0]),
        sweep = ((end - start + Math.PI * 3) % (Math.PI * 2)) - Math.PI, r = 44;
      shape("arms")?.setAttribute("d", `M${a[0]} ${a[1]}L${v[0]} ${v[1]}L${b[0]} ${b[1]}`);
      shape("arc")?.setAttribute("d", `M${v[0] + r * Math.cos(start)} ${v[1] + r * Math.sin(start)}A${r} ${r} 0 0 ${sweep > 0 ? 1 : 0} ${v[0] + r * Math.cos(end)} ${v[1] + r * Math.sin(end)}`);
    }
    svg.querySelectorAll("[data-point]").forEach((node) => {
      const [tool, key] = node.dataset.point.split("."), point = (tool === "ruler" ? ruler : protractor)?.[key];
      if (point) {
        node.setAttribute("cx", point[0]);
        node.setAttribute("cy", point[1]);
      }
    });
  }
  function paint(rebuild = true) {
    if (widgets.stopwatch) {
      const el = widgets.stopwatch;
      el.querySelector(".apparatus-time").textContent = formatElapsed(stopwatch.elapsed);
      el.querySelector('[data-do="go"]').textContent = stopwatch.running ? "Stop" : stopwatch.elapsed ? "Resume" : "Start";
      const laps = stopwatch.laps.map((t, i, all) => `<li><span>Lap ${all.length - i}</span>${formatElapsed(t)}</li>`).join("");
      if (el.dataset.laps !== laps) el.querySelector(".apparatus-laps").innerHTML = el.dataset.laps = laps;
    }
    if (widgets.timer) {
      const el = widgets.timer;
      el.querySelector(".apparatus-time").textContent = formatElapsed(Math.max(0, timerLength - timer.elapsed));
      el.querySelector('[data-do="go"]').textContent = timer.running ? "Pause" : timerDone ? "Again" : timer.elapsed ? "Resume" : "Start";
      el.classList.toggle("is-done", timerDone);
    }
    if (widgets.ruler && ruler) {
      const length = Math.hypot(ruler.b[0] - ruler.a[0], ruler.b[1] - ruler.a[1]);
      widgets.ruler.querySelector(".apparatus-reading").textContent = rulerScale
        ? `${tidyNumber(Number((length * rulerScale.perPixel).toPrecision(4)))} ${rulerScale.unit}`
        : `${Math.round(length)} px (scale not set)`;
    }
    if (widgets.protractor && protractor)
      widgets.protractor.querySelector(".apparatus-reading").textContent = angleBetween(protractor.a, protractor.v, protractor.b).toFixed(1) + "°";
    if (rebuild) drawOverlay();
    placeOverlay();
  }

  let shown = "";
  return {
    /** Call every frame with the running lab. */
    tick(lab, drawnTime) {
      const time = Number.isFinite(drawnTime) ? drawnTime : lab?.state?.t;
      if (!Number.isFinite(time)) return;
      stopwatch.feed(time);
      timer.feed(time);
      if (timer.running && timer.elapsed >= timerLength) {
        timer.stop();
        timerDone = true;
        if (stopAtZero) pause();
      }
      const key = `${stopwatch.elapsed.toFixed(2)}|${timer.elapsed.toFixed(2)}|${stopwatch.running}|${timer.running}|${timerDone}`;
      if (key !== shown && (widgets.stopwatch || widgets.timer)) {
        shown = key;
        if (widgets.stopwatch) widgets.stopwatch.querySelector(".apparatus-time").textContent = formatElapsed(stopwatch.elapsed);
        if (widgets.timer) {
          widgets.timer.querySelector(".apparatus-time").textContent = formatElapsed(Math.max(0, timerLength - timer.elapsed));
          widgets.timer.classList.toggle("is-done", timerDone);
          if (timerDone) widgets.timer.querySelector('[data-do="go"]').textContent = "Again";
        }
      }
    },
    dispose() {
      document.removeEventListener("pointerdown", closeTray);
      layer.remove();
      menu.remove();
    },
  };
}
