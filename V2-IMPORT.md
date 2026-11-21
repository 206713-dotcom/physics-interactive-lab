# V2 import and FocusPhysics companion theme

The Claude-updated version was imported from [guembitangerine314-eng/physics-interactive-lab-v2](https://github.com/guembitangerine314-eng/physics-interactive-lab-v2), commit `2d5befe0b6f4625e2b9d560b1b0de4818b3d1360`, on 21 November 2026.

All 246 source-tracked files were copied into the original repository. Existing simulations, questions, answers, course resources, Solar Atlas assets and Git history are retained. New v2 apparatus tools, direct manipulation, topic navigation, renderer updates and tests are included.

The original production version is preserved in [codex/pre-v2-import-2026-11-21](https://github.com/206713-dotcom/physics-interactive-lab/tree/codex/pre-v2-import-2026-11-21), at commit `1a70929e7220331b7a1564c60134b35221dd7356`.

## Visual integration

`focus.css` is the final classroom theme. It uses the white, pale-grey and slate-blue visual language observed on [FocusPhysics](https://focusphysics.com/) and the same Barlow and Barlow Condensed families. The fonts are self-hosted, with their SIL Open Font Licenses in `assets/fonts/Barlow-OFL.txt` and `assets/fonts/BarlowCondensed-OFL.txt`. The fonts were retrieved from the public FocusPhysics font directory; the licence texts are from the Google Fonts distributions.

The new theme replaces the default v2 game skin. The imported `game.css` and its original assets remain available in source. Simulation rendering, physics solvers and the new v2 interaction tools are preserved. The learning pages have light backgrounds, readable lesson cards and consistent school-style navigation. Simulation stages keep their dark backdrop for apparatus contrast.

## Deployment

The production repository remains [206713-dotcom/physics-interactive-lab](https://github.com/206713-dotcom/physics-interactive-lab), with [the original live address](https://206713-dotcom.github.io/physics-interactive-lab/). No v2 repository prefix is required. Assets, shared setups and embeds resolve relative to the current installation.

The separate v2 repository is not changed by this import. This does not publish files to focusphysics.com. Mr Rowland can embed or link the hosted simulations using the [integration page](https://206713-dotcom.github.io/physics-interactive-lab/integration.html).

Run `npm test` for the model tests and `npm run check` for source, asset, font and GitHub Pages path checks. On Windows with several browser instances open, use `node --test --test-concurrency=2 tests/*.test.mjs` to limit test-worker processes.
