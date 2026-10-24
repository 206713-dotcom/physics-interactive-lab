# Add these simulations to FocusPhysics

The recommended first step is to **embed one simulation in an existing lesson page**. Mr Rowland or the website administrator can add the HTML below. No redesign, backend or student account is needed.

This project has not been installed on focusphysics.com. Its current publishing platform and editor access have not been confirmed.

## 1. Generate an embed

Open the [embed generator](https://206713-dotcom.github.io/physics-interactive-lab/integration.html). Choose an experiment and 3D or 2D, try the working preview, then copy the HTML. Alternatively, open an experiment, choose your parameters and click **Embed**: the generator will preserve that initial setup.

For orbital mechanics, a minimal embed is:

```html
<iframe
  src="https://206713-dotcom.github.io/physics-interactive-lab/?embed=1#/gravity"
  title="Orbital mechanics — interactive physics simulation"
  width="100%"
  height="860"
  style="width:100%;height:860px;border:0;border-radius:16px;"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
>
</iframe>
<p>
  <a
    href="https://206713-dotcom.github.io/physics-interactive-lab/#/gravity"
    target="_blank"
    rel="noopener"
    >Open the simulation in a full tab ↗</a
  >
</p>
```

For the spring, change `#/gravity` to `#/spring`. All **57 models** work in the embed generator. Every model offers 3D apparatus and a 2D diagram. The embed generator preserves the selected view; devices without WebGL fall back to the complete 2D experiment. Camera presets, visual walkthroughs, variables and live calculations also work in the expanded embed. New routes include `#/photoelectric`, `#/driven`, `#/gasprocess`, `#/filament` and `#/resonance`.

The separate [A Level practice room](https://206713-dotcom.github.io/physics-interactive-lab/#/questions) can be linked directly from a lesson. For a specific twelve-question group, use a URL such as `https://206713-dotcom.github.io/physics-interactive-lab/#/questions?topic=quantum` or `...?topic=capacitors`. Question progress is stored in the student's browser; browser privacy settings may block persistence inside third-party iframes, so a full-tab link is recommended for practice.

Use the [IGCSE course map](https://206713-dotcom.github.io/physics-interactive-lab/#/course) to find the experiment supporting each of the 78 original lesson pages. For example, use `#/calorimetry` for heating and phase changes, `#/dc` for circuits and dividers, `#/lenses` for ray constructions, `#/radioactivity` for half-life, and `#/earthmoon` for seasons and Moon phases. The map links back to existing FocusPhysics notes and resources. Detailed scope and mappings are in [IGCSE-COVERAGE.md](IGCSE-COVERAGE.md).

The embed loads **paused** with the model, parameters, current values and worked calculations. It omits the main site's header and footer. **Lessons & notes** reveals the existing learning resources inside the frame; **Open full lab** opens the full lesson in another tab. Expanding a model fills its iframe, rather than covering the host website. The simulation never reads or modifies its parent page and uses no cross-frame messages.

## 2. Add it using the site's editor

- **Custom HTML/static site:** insert the iframe at the desired point in the lesson HTML.
- **A CMS with an HTML/embed block:** paste the snippet into that block and preview it. The editor must retain iframes; a plain text or code-display block will only show the code.
- **An editor that accepts only an embed URL:** use the generator's **Copy embed URL** button.
- **An editor that blocks embeds:** add a normal link to the full simulation, or ask the site administrator to add the frame.

These are editor-independent steps, not a claim about which platform FocusPhysics uses. See the [HTML iframe reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) for the element and its attributes.

Use a wide lesson section if possible. At 1,280 px and above the expanded view has three panes; between 761 and 1,279 px it has a model and tabbed inspector; smaller frames stack the content. A height of 860 px is a useful starting point. Change **both** the `height` attribute and `height` in the inline style to fit the lesson. Keep the full-tab link for students using a small screen.

The host page's Content Security Policy, if present, must permit frames from `https://206713-dotcom.github.io` (its `frame-src` directive). A restrictive host-added iframe sandbox can block scripts, storage, new tabs or downloads. The provided snippet requires no camera, microphone or account access. Optional clipboard and notebook storage features have fallbacks when unavailable.

## 3. Choose how updates should work

**GitHub-hosted embed:** the URL above always uses the currently published main branch. Updates published to this repository automatically appear on the next page load. GitHub Pages serves the code; all physics calculations run in the student's browser. Notebook readings remain on the device; embedding contexts may partition or restrict local storage.

**Self-hosted copy:** for a school-controlled version, download the source from the repository and copy these into a static directory such as `/simulations/physics-lab/`:

```text
index.html
styles.css, studio.css, workbench.css, frontiers.css, expanded.css
js/          (entire folder)
assets/      (entire folder)
vendor/      (entire folder, including licences)
LICENSE
```

Serve JavaScript modules with the normal JavaScript MIME type over HTTPS. Keep all relative folder paths intact. For example, the self-hosted iframe source would be:

```text
https://focusphysics.com/simulations/physics-lab/?embed=1#/gravity
```

This is an **example installation path**, not an existing FocusPhysics page. Include `integration.html` and `integration.css` as well if the site owner wants a local embed generator. It automatically generates URLs for its own installation. Original source is MIT licensed; preserve the project and vendored library licence notices. Updates to a self-hosted copy are manual, allowing the school to choose when to adopt a new version.

## 4. Check the finished lesson

1. Open the actual FocusPhysics lesson on desktop and tablet. Confirm the frame loads and is tall enough.
2. Start the model, change a parameter, pause, step and reset.
3. Choose another calculation and confirm its values change with the model.
4. Try 3D and 2D, graph selection, Lessons & notes and the full-tab link.
5. Check the embed does not obscure the surrounding lesson. Verify CSV export and notebook storage if the school needs them.

The repository's `npm test` and `npm run check` validate the numerical models, generated URLs, HTML escaping and local assets. Star and double-pendulum extension labs include energy diagnostics, numerical guards or parameter-dependent step sizes, and full assumptions in their lesson resources. The embed generator provides a real iframe preview for integration testing. The final host-page check requires Mr Rowland's website editor access.
