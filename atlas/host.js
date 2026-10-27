/** Adapter for the original Muon Atlas astronomy renderer. One local Three.js
 * runtime, deterministic planet data, and no connection to the muon simulator. */
import * as T from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { createAstronomy } from "./astronomy.js";
const canvas = document.getElementById("atlas-canvas"),
  loading = document.getElementById("atlas-loading");
try {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x07121e);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new T.Scene(),
    group = new T.Group(),
    camera = new T.PerspectiveCamera(42, 1, 0.1, 7000);
  scene.add(group, new T.HemisphereLight(0xa8d4ff, 0x09131e, 1.7));
  const sunLight = new T.PointLight(0xffeed7, 220000, 0, 2);
  scene.add(sunLight);
  const fill = new T.DirectionalLight(0xd5e8ff, 1.15);
  fill.position.set(-300, 500, 600);
  scene.add(fill);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.listenToKeyEvents(canvas);
  let transition = null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function flyTo(position, target, instant = false) {
    if (instant || reduced.matches) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      transition = null;
      return;
    }
    transition = {
      from: camera.position.clone(),
      to: position.clone(),
      fromTarget: controls.target.clone(),
      toTarget: target.clone(),
      elapsed: 0,
    };
  }
  controls.addEventListener("start", () => (transition = null));
  const atlas = createAstronomy({
    group,
    camera,
    controls,
    canvas,
    flyTo,
    goToScene() {
      location.href = "./#/course";
    },
  });
  atlas.setActive(true);
  document.getElementById("atlas-home").onclick = () => atlas.overview();
  document.getElementById("atlas-reset").onclick = () => atlas.reset();
  const resize = () => {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  loading.remove();
  // A selected world can be linked directly without changing the numerical date.
  const body = new URLSearchParams(location.search).get("body");
  if (body) atlas.selectBody(body);
  let previous = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (!document.hidden) {
      if (transition) {
        const tr = transition;
        tr.elapsed += dt;
        const u = Math.min(1, tr.elapsed / 0.9),
          a = u * u * (3 - 2 * u);
        camera.position.lerpVectors(tr.from, tr.to, a);
        controls.target.lerpVectors(tr.fromTarget, tr.toTarget, a);
        if (u === 1) transition = null;
      }
      controls.update();
      const state = atlas.read(),
        playing = state.running || state.testOrbit?.playing;
      atlas.update(playing || !reduced.matches ? dt : 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", () => {
    previous = performance.now();
    if (document.hidden) atlas.pause();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    atlas.pause();
    const message = document.createElement("p");
    message.className = "atlas-error";
    message.textContent =
      "The 3D context was interrupted. Reload this page to restore the explorer.";
    document.getElementById("exploration-page").append(message);
  });
} catch (error) {
  console.error("Solar Atlas could not initialise", error);
  loading.className = "atlas-error";
  loading.innerHTML =
    'This device could not start the 3D explorer. <a href="./#/solarsystem?view=2d">Open the Solar System 2D laboratory ↗</a>';
}
