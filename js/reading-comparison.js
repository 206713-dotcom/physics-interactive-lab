import { calculationNumber } from "./calculations.js";

const readingKey = ({ title, unit }) => JSON.stringify([title, unit]);
const formatReading = (value, unit) =>
  Number.isFinite(value) ? `${calculationNumber(value)}${unit ? ` ${unit}` : ""}` : "—";

export function installReadingComparison(panel) {
  const comparison = document.createElement("details");
  comparison.className = "reading-comparison";
  comparison.innerHTML = `
    <summary>Compare readings</summary>
    <div class="reading-comparison-body">
      <p>Pin a reading, then change one variable and compare the result.</p>
      <div class="reading-comparison-actions">
        <label>Reading <select aria-label="Reading to compare"></select></label>
        <button type="button" class="reading-pin">Pin reading</button>
        <button type="button" class="reading-clear" hidden>Clear pin</button>
      </div>
      <p class="reading-comparison-subject" hidden></p>
      <dl class="reading-comparison-values" hidden>
        <div><dt>Pinned</dt><dd></dd></div>
        <div><dt>Live</dt><dd></dd></div>
        <div><dt>Change</dt><dd></dd></div>
      </dl>
      <p class="reading-comparison-note" role="status"></p>
    </div>`;
  panel.append(comparison);
  const select = comparison.querySelector("select");
  const pin = comparison.querySelector(".reading-pin");
  const clear = comparison.querySelector(".reading-clear");
  const values = comparison.querySelector(".reading-comparison-values");
  const subject = comparison.querySelector(".reading-comparison-subject");
  const note = comparison.querySelector(".reading-comparison-note");
  const [pinnedValue, liveValue, difference] = values.querySelectorAll("dd");
  let readings = [], baseline, signature;

  function update() {
    const selected = readings.find(reading => readingKey(reading) === select.value);
    pin.disabled = !Number.isFinite(selected?.value);
    clear.hidden = !baseline;
    subject.hidden = values.hidden = !baseline;
    if (!baseline) return;
    const live = readings.find(reading => readingKey(reading) === baseline.key);
    const change = Number.isFinite(live?.value) ? live.value - baseline.value : null;
    pinnedValue.textContent = formatReading(baseline.value, baseline.unit);
    liveValue.textContent = formatReading(live?.value, baseline.unit);
    difference.textContent = `${change > 0 ? "+" : ""}${formatReading(change, baseline.unit)}`;
  }
  pin.onclick = () => {
    const selected = readings.find(reading => readingKey(reading) === select.value);
    if (!Number.isFinite(selected?.value)) return;
    baseline = { ...selected, key: readingKey(selected) };
    subject.textContent = selected.title;
    note.textContent = `Pinned ${selected.title}.`;
    update();
  };
  clear.onclick = () => {
    baseline = undefined;
    note.textContent = "Pinned reading cleared.";
    update();
    select.focus();
  };
  select.onchange = update;
  return nextReadings => {
    readings = nextReadings.filter(reading => typeof reading.value !== "string");
    const keys = readings.map(readingKey);
    const next = JSON.stringify(keys);
    if (next !== signature) {
      const previous = select.value;
      select.replaceChildren(...readings.map(reading =>
        new Option(reading.title, readingKey(reading))));
      if (keys.includes(previous)) select.value = previous;
      signature = next;
    }
    comparison.hidden = !readings.length && !baseline;
    update();
  };
}
