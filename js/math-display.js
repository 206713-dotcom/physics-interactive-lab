/** Format scientific notation without accepting HTML from values or labels. */
export function mathHTML(value) {
  return String(value)
    .replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    )
    .replace(
      /(\d(?:\.\d+)?)[eE]([+-]?\d+)/g,
      (_, mantissa, exponent) =>
        `${mantissa} × 10<sup>${Number(exponent)}</sup>`,
    );
}

const previous = new WeakMap();
export function setMath(node, value) {
  if (previous.get(node) === value) return;
  previous.set(node, value);
  node.innerHTML = mathHTML(value);
}
