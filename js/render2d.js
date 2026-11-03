import { paperInk } from './diagram-theme.js';
import { waveMeasurement } from './wave-geometry.js';
import { sceneLabelAllowed } from './study-policy.js';
/** Orthographic diagram mode and an automatic fallback for browsers without WebGL. */
import { drawOrbit } from "./canvas.js";
import * as E from "./physics-extra.js";
import { ADVANCED_IDS } from "./physics-advanced.js";
import { drawAdvanced } from "./render-advanced.js";
import { CURRICULUM_IDS } from "./curriculum-physics.js";
import { drawCurriculum } from "./render-curriculum.js";
import { projectileLayout, projectilePreview, collisionLayout, collisionSpeedScale, CART_LENGTH } from "./kinematics-display.js";
import { drawOscillation } from './render-oscillations.js';
export function draw2D(canvas, lab) {
  const context = canvas.getContext('2d'), original = context.fillText,
    paper = !ADVANCED_IDS.includes(lab.type) && lab.type !== 'gravity';
  if (!paper && lab.studyMode !== 'igcse') return drawDiagram(canvas,lab);
  // A scoped text filter, restored even on error. No path or physical coordinate
  // changes, and no prototype changes affecting charts or other canvases.
  context.fillText = function(text,...args) {
    if (!sceneLabelAllowed(lab.type,lab.studyMode,String(text))) return;
    const saved=this.fillStyle;
    if (paper) this.fillStyle=paperInk(saved);
    try { return original.call(this,text,...args); }
    finally { this.fillStyle=saved; }
  };
  try { return drawDiagram(canvas,lab); }
  finally { context.fillText = original; }
}
function drawDiagram(canvas, lab) {
  if (CURRICULUM_IDS.includes(lab.type)) {
    drawCurriculum(canvas, lab);
    return;
  }
  if (ADVANCED_IDS.includes(lab.type)) {
    drawAdvanced(canvas, lab);
    return;
  }
  if (["spring","pendulum"].includes(lab.type)) {
    drawOscillation(canvas, lab);
    return;
  }
  if (lab.type === "gravity") {
    drawOrbit(canvas, lab);
    return;
  }
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    dpr = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const c = canvas.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#f3f8fb";
  c.fillRect(0, 0, w, h);
  for (let x = 20; x < w; x += 28)
    for (let y = 20; y < h; y += 28) {
      c.fillStyle = "#507d9520";
      c.fillRect(x, y, 1, 1);
    }
  const p = lab.params,
    s = lab.state,
    C = "#149e91",
    G = "#b57d32",
    B = "#567fb5";
  const line = (pts, col, width = 1.5, dash = []) => {
    if (!pts.length) return;
    c.beginPath();
    c.setLineDash(dash);
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = col;
    c.lineWidth = width;
    c.stroke();
    c.setLineDash([]);
  };
  const text = (t, x, y, col = "#94b7cb", size = 11, align = "left") => {
    c.fillStyle = col;
    c.font = `500 ${Math.max(size,12)}px Manrope,Segoe UI,sans-serif`;
    c.textAlign = align;
    c.fillText(t, x, y);
  };
  const ball = (x, y, r, col) => {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
    g.addColorStop(0, "#e6ffff");
    g.addColorStop(0.25, col);
    g.addColorStop(1, "#183f56");
    c.shadowColor = col;
    c.shadowBlur = 18;
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
  };
  const arrow = (x, y, dx, dy, col) => {
    const a = Math.atan2(dy, dx);
    line(
      [
        [x, y],
        [x + dx, y + dy],
      ],
      col,
      2,
    );
    line(
      [
        [x + dx - 8 * Math.cos(a - 0.45), y + dy - 8 * Math.sin(a - 0.45)],
        [x + dx, y + dy],
        [x + dx - 8 * Math.cos(a + 0.45), y + dy - 8 * Math.sin(a + 0.45)],
      ],
      col,
      2,
    );
  };
  if (lab.type === "projectile") {
    const r = E.projectileReference(p),layout=projectileLayout(p,lab.projectileFrame),
      sc = Math.min(
        (w - 90) / layout.maxX,
        (h - 105) / layout.maxY,
      ),
      left = (w - layout.maxX * sc) / 2,
      ground = h - 48,
      pt = (q) => [left + q.x * sc, ground - q.y * sc];
    line(
      [
        [24, ground],
        [w - 24, ground],
      ],
      "#31546a",
      2,
    );
    const ref = [];
    for (let i = 0; i <= 140; i++) {
      const t = (i * r.flightTime) / 140;
      ref.push(
        pt({
          x: p.speed * Math.cos(p.angle * E.DEG) * t,
          y:
            p.height +
            p.speed * Math.sin(p.angle * E.DEG) * t -
            0.5 * p.g * t * t,
        }),
      );
    }
    c.save();c.beginPath();c.rect(left,ground-layout.maxY*sc,layout.maxX*sc,layout.maxY*sc);c.clip();
    if(lab.showTrail)line(ref, "#6c829a", 1, [5, 5]);
    c.restore();
    if (lab.showTrail) line((lab.trail || []).map(pt), "#b5a6ff", 2.5);
    const [x, y] = pt(s);
    ball(x, y, 8, "#b5a6ff");
    if (lab.vectors) {
      const preview=projectilePreview(p),vs=55/preview.maxSpeed,as=45/Math.max(p.g,p.drag*preview.maxSpeed**2),v=Math.hypot(s.vx,s.vy);
      arrow(x,y,s.vx*vs,-s.vy*vs,G);
      if(!s.landed){arrow(x+10,y,0,p.g*as,B);arrow(x,y,-p.drag*v*s.vx*as,p.drag*v*s.vy*as,'#ff8e7f');}
    }
    for (let i = 0; i <= 4; i++) {
      const xx = (layout.maxX * i) / 4;
      text(
        `${Number(xx.toPrecision(3))} m`,
        left + xx * sc,
        ground + 24,
        "#94b7cb",
        14,
        "center",
      );
    }
    text(lab.projectileFrame==='vacuum'?'Full vacuum comparison · dashed = vacuum':'Actual-flight frame · off-window vacuum reference clipped',24,40,'#abc5d5',13);
  } else if (lab.type === "collisions") {
    const layout=collisionLayout(p),
      pixels=Math.max(1,w-66)/9.4,
      speedScale=collisionSpeedScale(p)*pixels,
      y = h * 0.57,
      cx = w / 2;
    line(
      [
        [25, y + 30],
        [w - 25, y + 30],
      ],
      "#3b6074",
      4,
    );
    for (const [x, v, m, col, name] of [
      [s.x1, s.v1, p.m1, C, "A"],
      [s.x2, s.v2, p.m2, G, "B"],
    ]) {
      const px = cx + layout.point(x)*pixels,
        ww = CART_LENGTH*layout.scale*pixels, hh=Math.max(12,Math.min(44,ww*.57)),
        wheel=Math.min(7,ww*.18), top=y+29-2*wheel-hh;
      const paint=c.createLinearGradient(px,top,px,top+hh);
      paint.addColorStop(0,name==='A'?'#89ddd2':'#ffce7a');
      paint.addColorStop(1,col);
      c.fillStyle = paint;
      c.beginPath();
      c.roundRect(px - ww / 2, top, ww, hh, Math.min(6,ww/3));
      c.fill();
      for (const direction of [-1,1]) {
        c.beginPath();
        c.arc(px+direction*ww*.27,y+29-wheel,wheel,0,Math.PI*2);
        c.fillStyle='#24475f';
        c.fill();
      }
      const yy=y-(name==='A'?48:80), tagX=Math.max(53,Math.min(w-53,px));
      text(`${name} · ${m.toFixed(2)} kg`,tagX,yy-12,col,14,'center');
      if (lab.vectors) arrow(px,yy,v*speedScale,0,col);
    }
    text(
      s.hit ? "AFTER CONTACT" : p.u1<=p.u2 ? "NO APPROACH · NO COLLISION" : "BEFORE CONTACT",
      w / 2,
      65,
      s.hit ? G : C,
      14,
      "center",
    );
    const minor=layout.step/5;
    for (let n=Math.ceil((layout.center-4.4/layout.scale)/minor);n*minor<=layout.center+4.4/layout.scale;n++) {
      if(n%5===0) continue;
      const px=cx+layout.point(n*minor)*pixels;
      line([[px,y+32],[px,y+38]],'#9db2c1',1);
    }
    for (const value of layout.ticks) {
      const px=cx+layout.point(value)*pixels;
      line([[px,y+32],[px,y+(value===0?52:45)]],value===0?'#93601b':'#63879c',value===0?2:1);
      text(`${value} m`,px,y+68,'#517487',w<500?11:14,'center');
    }
    text("Fixed lab ruler · positive x to the right",24,h-25,'#58778e',13);
  } else if (lab.type === "waves") {
    const intro=lab.studyMode==='igcse',left=55,width=w-110,mid=h*.5,
      scale=Math.min((h-170)/(intro?1.2:2.4),180),
      sets=intro?[["resultant",C]]:[["incident",B],["reflected",G],["resultant",C]],
      xPixel=x=>left+x/8*width;
    line([[left,mid],[w-left,mid]],'#7091a4',1.2);
    for(const amplitude of [-p.amplitude,p.amplitude])line([[left,mid-amplitude*scale],[w-left,mid-amplitude*scale]],'#9dbacb',1,[3,5]);
    for(const [key,col] of sets)line(Array.from({length:321},(_,i)=>{
      const x=i/40;return [xPixel(x),mid-E.waveAt(x,s.t,p)[key]*scale];
    }),col,key==='resultant'?3:1.4);
    // Fixed horizontal samples show transverse motion rather than material
    // being carried along with the moving crest guide.
    for(let i=0;i<=32;i++) {
      const x=i/4,y=mid-E.waveAt(x,s.t,p).resultant*scale;
      c.beginPath();c.arc(xPixel(x),y,2.3,0,Math.PI*2);c.fillStyle=intro?'#407f87':'#5ba79d';c.fill();
    }
    const px=xPixel(p.probe),py=mid-E.waveAt(p.probe,s.t,p).resultant*scale,
      guide=waveMeasurement(p,s.t),crestY=mid-p.amplitude*scale,gy=crestY-29,
      gx1=xPixel(guide.first),gx2=xPixel(guide.second);
    line([[px,80],[px,h-66]],'#ac8a50',1,[3,5]);ball(px,py,6,'#b47c26');
    line([[gx1,crestY],[gx1,gy],[gx2,gy],[gx2,crestY]],'#8263a1',1.5);
    text('λ = '+p.wavelength+' m',(gx1+gx2)/2,gy-10,'#70518e',13,'center');
    line([[left-5,mid],[left-17,mid],[left-17,crestY],[left-5,crestY]],C,1.5);
    text('A',left-28,(mid+crestY)/2+4,C,14,'center');
    for(let i=0;i<=8;i++) {
      line([[xPixel(i),h-56],[xPixel(i),h-49]],'#678a9e',1);
      if(i%2===0)text(i+' m',xPixel(i),h-30,'#446c83',12,'center');
    }
    if(intro)text('Travelling wave →',24,39,'#176c72',14);
    else {text('Incident',24,39,B,12);text('Counter-wave',111,39,G,12);text('Resultant',238,39,C,12);}
  } else if (lab.type === "interference") {
    const slitX = w * 0.24,
      screenX = w * 0.84,
      cy = h / 2,
      gap = 35;
    c.fillStyle = "#38586d";
    c.fillRect(slitX - 3, 65, 6, h - 130);
    c.clearRect(slitX - 4, cy - gap - 6, 8, 12);
    c.clearRect(slitX - 4, cy + gap - 6, 8, 12);
    c.save();
    c.beginPath();
    c.rect(slitX + 4, 60, screenX - slitX - 8, h - 120);
    c.clip();
    for (const yy of [cy - gap, cy + gap])
      for (let i = 0; i < 9; i++) {
        const radius = ((s.t * 0.3 + i / 9) % 1) * (screenX - slitX) * 1.5;
        c.beginPath();
        c.arc(slitX, yy, radius, -Math.PI / 2, Math.PI / 2);
        c.strokeStyle = "#a0a0ff44";
        c.lineWidth = 1.5;
        c.stroke();
      }
    c.restore();
    for (let i = 0; i < h - 110; i++) {
      const yy = (i / (h - 110) - 0.5) * 0.04,
        I = E.interferenceAt(yy, p).intensity;
      c.fillStyle = `hsla(${p.wavelength < 490 ? 240 : p.wavelength < 580 ? 140 : 10},90%,65%,${Math.sqrt(I)})`;
      c.fillRect(screenX, 55 + i, 25, 1);
    }
    line(
      [
        [slitX, cy],
        [screenX, cy],
      ],
      "#ffffff22",
      1,
      [4, 5],
    );
    text("COHERENT SLITS", slitX, 35, "#95b7c8", 10, "center");
    text("SCREEN", screenX, 35, "#95b7c8", 10, "center");
    text("Wavefront spacing enlarged", 24, h - 24);
    text("±20 mm", screenX, h - 25, "#95b7c8", 10, "center");
  } else if (lab.type === "refraction") {
    const x=w/2,y=h*.5,L=Math.min(w*.3,h*.34),q=E.refractionInfo(p),i=p.angle*E.DEG,
      gold='#a77827',teal='#087d79',purple='#7d59a8',radius=L+12;
    c.fillStyle='#bad7e61a';c.fillRect(0,0,w,y);
    c.fillStyle='#79c2cd24';c.fillRect(0,y,w,h-y);
    line([[20,y],[w-20,y]],'#789eaf',1.4);
    line([[x,38],[x,h-38]],'#587f95',1,[5,5]);
    c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.strokeStyle='#9cb7c5';c.lineWidth=1;c.stroke();
    for(let deg=0;deg<360;deg+=5) {
      const a=deg*Math.PI/180,inner=radius-(deg%30===0?12:deg%10===0?8:4);
      line([[x+inner*Math.sin(a),y-inner*Math.cos(a)],[x+radius*Math.sin(a),y-radius*Math.cos(a)]],'#6a8c9e',1);
      if(deg%30===0) {
        const m=deg%180;
        text(Math.min(m,180-m)+'°',x+(radius-25)*Math.sin(a),y-(radius-25)*Math.cos(a)+4,'#466b80',11,'center');
      }
    }
    const sector=(a,b,ink)=>{
      c.beginPath();c.moveTo(x,y);c.arc(x,y,31,a,b);c.closePath();c.fillStyle=ink+'28';c.fill();
      c.beginPath();c.arc(x,y,31,a,b);c.strokeStyle=ink;c.lineWidth=1.5;c.stroke();
    };
    sector(-Math.PI/2-i,-Math.PI/2,gold);
    const start=[x-L*Math.sin(i),y-L*Math.cos(i)],reflected=[x+L*Math.sin(i),y-L*Math.cos(i)];
    arrow(start[0],start[1],x-start[0],y-start[1],gold,3);
    if(q.reflectance>1e-8)arrow(x,y,reflected[0]-x,reflected[1]-y,purple,2.4);
    if(!q.tir && q.reflectance<1-1e-8) {
      const r=q.refracted*E.DEG;sector(Math.PI/2-r,Math.PI/2,teal);
      arrow(x,y,L*Math.sin(r),L*Math.cos(r),teal,3);
    }
    text('Normal',x+12,29,'#466b80',12);
    text('n₁ = '+p.n1.toFixed(2),24,77,'#466b80',14);
    text('n₂ = '+p.n2.toFixed(2),24,h-64,'#266875',14);
    text('i = '+p.angle+'°',w-24,77,gold,15,'right');
    text(q.tir?'No refracted ray':'r = '+q.refracted.toFixed(1)+'°',w-24,h-64,q.tir?'#597787':teal,15,'right');
    text(q.tir?'TOTAL INTERNAL REFLECTION':'Measure angles from the normal',w/2,h-20,q.tir?purple:'#466b80',12,'center');
  } else if (lab.type === "circuits") {
    const lx = w * 0.2,
      rx = w * 0.8,
      top = h * 0.25,
      bottom = h * 0.78,
      cy = h * 0.52,
      q = E.circuitAt(s.t, p);
    line(
      [
        [rx, cy - 9],
        [rx, top],
        [lx, top],
        [lx, bottom],
        [rx, bottom],
        [rx, cy + 9],
      ],
      "#7fa7b8",
      2,
    );
    const zig = [];
    for (let i = 0; i <= 16; i++)
      zig.push([
        w * 0.4 + (i * w * 0.2) / 16,
        top + (i === 0 || i === 16 ? 0 : i % 2 ? 10 : -10),
      ]);
    line(zig, G, 2);
    line(
      [
        [rx - 26, cy - 9],
        [rx + 26, cy - 9],
      ],
      C,
      4,
    );
    line(
      [
        [rx - 26, cy + 9],
        [rx + 26, cy + 9],
      ],
      "#ff8aaa",
      4,
    );
    c.fillStyle = `rgba(100,240,210,${(q.voltage / p.voltage) * 0.25})`;
    c.fillRect(rx - 24, cy - 7, 48, 14);
    c.fillStyle = "#153447";
    c.fillRect(lx - 15, cy - 24, 30, 48);
    line(
      [
        [lx - 22, cy - 7],
        [lx + 22, cy - 7],
      ],
      p.discharge ? "#48667a" : C,
      3,
    );
    line(
      [
        [lx - 12, cy + 7],
        [lx + 12, cy + 7],
      ],
      p.discharge ? "#48667a" : C,
      3,
    );
    text(
      `${p.resistance.toLocaleString()} Ω`,
      w / 2,
      top - 22,
      G,
      12,
      "center",
    );
    text(`${(p.capacitance * 1e6).toFixed(0)} µF`, rx, cy + 45);
    text(
      p.discharge ? "Source disconnected" : `${p.voltage} V`,
      lx,
      cy + 50,
      "#99becf",
      11,
      "center",
    );
    text("Conventional current", w / 2, bottom + 30, "#99becf", 11, "center");
    if (Math.abs(q.current) > 0.00001)
      arrow(
        w / 2 + (p.discharge ? -30 : 30),
        bottom,
        p.discharge ? 60 : -60,
        0,
        G,
      );
  } else if (lab.type === "fields") {
    const sc = Math.min((w - 65) / 10, (h - 75) / 7),
      cx = w / 2,
      cy = h / 2,
      pt = ([x, y]) => [cx + x * sc, cy - y * sc];
    const key = JSON.stringify([p.q1, p.q2, p.separation]);
    if (lab.fieldKey !== key) {
      lab.fieldKey = key;
      lab.fieldLines = E.fieldLines(p);
    }
    for (const l of lab.fieldLines)
      line(l.points.map(pt), l.sign > 0 ? "#62e4d274" : "#8eabff74", 1.2);
    for (const [x, q] of [
      [-p.separation / 2, p.q1],
      [p.separation / 2, p.q2],
    ])
      if (q !== 0) {
        ball(cx + x * sc, cy, 11, q > 0 ? "#ff8aaa" : B);
        text(q > 0 ? "+" : "−", cx + x * sc, cy + 4, "#fff", 15, "center");
      }
    const [x, y] = pt([p.probeX, p.probeY]),
      f = E.fieldAt(p.probeX, p.probeY, p);
    ball(x, y, 5, "#ffffff");
    if (f.valid && f.magnitude > 1e-6 && lab.vectors)
      arrow(x, y, (f.ex / f.magnitude) * 40, (-f.ey / f.magnitude) * 40, G);
    text("Probe: click to move · distances in m", 24, h - 24);
    text(`(${p.probeX.toFixed(1)}, ${p.probeY.toFixed(1)}) m`, x + 12, y - 14);
  }
}
