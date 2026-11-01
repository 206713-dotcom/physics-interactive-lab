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
