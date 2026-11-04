/** Paper-diagram ink. Preserve a label's hue while making it readable against
 * the pale scientific-diagram background; this never changes geometric data. */
export function paperInk(color) {
  if (typeof color!=='string') return '#244b60';
  let values;
  const hex=color.match(/^#([\da-f]{6})(?:[\da-f]{2})?$/i),rgb=color.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/);
  if (hex) values=[0,2,4].map(i=>parseInt(hex[1].slice(i,i+2),16));
  else if (rgb) values=rgb.slice(1,4).map(Number);
  else return '#244b60';
  values=values.map(v=>Math.max(0,Math.min(255,Math.round(v))));
  const luminance = a => a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
    .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  while (luminance(values)>.13) values=values.map(v=>Math.floor(v*.91));
  return '#'+values.map(v=>v.toString(16).padStart(2,'0')).join('');
}

// Approximate visible-spectrum colour for schematic light sources and fringes.
export function wavelengthRGB(nm) {
  if (nm < 440) return [Math.min(1, (440 - nm) / 60), 0, 1];
  if (nm < 490) return [0, (nm - 440) / 50, 1];
  if (nm < 510) return [0, 1, (510 - nm) / 20];
  if (nm < 580) return [(nm - 510) / 70, 1, 0];
  if (nm < 645) return [1, (645 - nm) / 65, 0];
  return [1, 0, 0];
}
