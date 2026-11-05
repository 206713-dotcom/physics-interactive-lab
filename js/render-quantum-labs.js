/** Canvas versions use the same energy and scattering constructions as 3D. */
import { photoelectricDisplay, photoelectricMarkers, braggConstruction, matterWave } from "./quantum-display.js";
import { wavelengthRGB, paperInk } from "./diagram-theme.js";
const TEAL="#087d79", GOLD="#a77827", PURPLE="#7953a3", BLUE="#4f7cb1", INK="#3f647a", MUTED="#6a899b";

export function drawPhotoelectricBench(kit) {
  const {c,p,t,title,line,arrow,rect,text,foot}=kit, q=photoelectricDisplay(p),
    pos=([x,y])=>[320+x*65,391-y*65],
    color=q.band==="Visible light"?paperInk(`rgb(${wavelengthRGB(q.wavelength*1e9).map(v=>Math.round(v*255)).join(",")})`):q.band==="Ultraviolet"?PURPLE:"#ae4c48";
  title("Photoelectric emission","Photon energy and photon rate are different");
  rect(96,164,440,148,"#dfedf455","#7f9fb4",60);
  line([[161,284],[161,375],[270,375]],MUTED,2);
  line([[486,284],[486,375],[365,375]],MUTED,2);
  rect(270,354,95,38,"#d3e6ed",INK,7);
  text("Iₛₐₜ",317,379,TEAL,18,"center",80);
  rect(156,185,9,105,"#c9ab75",GOLD,2);rect(481,185,9,105,"#9dbbd6",BLUE,2);
  arrow(284,95,161-284,238-95,color,2);
  rect(274,83,21,25,"#547085",null,4);
  text(q.band==="Visible light"?q.band:`${q.band} · colour key`,292,75,color,14,"center",270);
  for (const [electron,col,radius] of [[false,color,3.5],[true,TEAL,3]]) {
    c.fillStyle=col;
    for (const v of photoelectricMarkers(q,t,electron)) {
      const [x,y]=pos(v);c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
    }
  }
  text(q.emission?"Electrons emitted → collected":"Light arrives · no electrons escape",315,142,q.emission?TEAL:GOLD,17,"center",450);
  text("METAL EMITTER",161,333,GOLD,14,"center",160);
  text("COLLECTOR",486,333,BLUE,14,"center",130);
  text(`${(q.current*1e9).toFixed(2)} nA`,317,340,TEAL,20,"center",205);
  rect(557,69,255,326,"#e3edf4aa","#c5d7e2",13);
  text("ONE PHOTON · ENERGY BUDGET",684,94,MUTED,13,"center",232);
  for (const [value,y,label,col] of [
    [q.photonEV,142,`Photon hf  ${q.photonEV.toFixed(2)} eV`,PURPLE],
    [p.work,218,`Work φ  ${p.work.toFixed(2)} eV`,GOLD],
    [q.kineticEV,294,q.emission?`Kmax  ${q.kineticEV.toFixed(2)} eV`:"No emitted electrons",TEAL],
  ]) {
    text(label,684,y-17,col,17,"center",232);
    rect(575,y,218,10,"#c4d5df",null,3);
    if(value>0)rect(575,y,value/6.5*218,10,col,null,3);
  }
  text(q.emission?`Stopping potential  ${q.stopping.toFixed(2)} V`:`Energy shortfall  ${q.shortfall.toFixed(2)} eV`,684,345,INK,16,"center",232);
  text("Fixed energy scale · 0–6.5 eV",684,379,MUTED,13,"center",232);
  foot(`Threshold ${(q.threshold/1e14).toFixed(2)} × 10¹⁴ Hz`,"Ideal collection · flux markers use √ scales");
}

export function drawBraggBench(kit) {
  const {c,p,t,title,line,rect,text,foot}=kit, q=braggConstruction(p),pos=([x,y])=>[307+x*65,390-y*65],
    path=(values,color,width=2,dash=[])=>line(values.map(pos),color,width,dash);
  title("Electron diffraction","λ = h/p · Bragg construction is an extension");
  for(let row=0;row<3;row++) {
    const y=q.top[1]-row*q.gap;
    path([[-2.2,y],[2.2,y]],row?BLUE:TEAL,2);
    c.fillStyle=row?BLUE:TEAL;
    for(let x=-4;x<=4;x++){c.beginPath();c.arc(...pos([x*.5,y]),3.2,0,Math.PI*2);c.fill();}
  }
  path([[-2.6,q.top[1]],[-2.6,q.bottom[1]]],MUTED);
  for(const y of [q.top[1],q.bottom[1]])path([[-2.7,y],[-2.5,y]],MUTED);
  text(`d = ${(p.spacing*1e12).toFixed(0)} pm`,86,pos([0,(q.top[1]+q.bottom[1])/2])[1],BLUE,15,"center",110);
  if(q.permitted) {
    q.rays.forEach((ray,i)=>{
      const color=i?GOLD:TEAL;path(ray,color,3);
      if(kit.vectors!==false) for(let j=1;j<ray.length;j++) {
        const a=pos(ray[j-1]),b=pos(ray[j]),u=(t*.2)%1,length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        kit.arrow(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,(b[0]-a[0])/length*12,(b[1]-a[1])/length*12,color,2);
      }
    });
    q.wavefronts.forEach(v=>path(v,MUTED,1,[4,4]));q.extraPaths.forEach(v=>path(v,PURPLE,4));
    text(`θ = ${q.angle.toFixed(2)}° to the planes`,304,93,TEAL,19,"center",390);
    text("Purple segments · extra path = nλ",305,126,PURPLE,15,"center",410);
  } else {
    text("No permitted Bragg angle",306,100,GOLD,24,"center",440);
    text("No diffraction direction is assigned",306,134,MUTED,16,"center",440);
  }
  rect(557,69,255,326,"#e3edf4aa","#c5d7e2",13);
  const x=684;
  text("ELECTRON MATTER WAVE",x,97,MUTED,13,"center",232);
  text(`${(q.wavelength*1e12).toFixed(2)} pm`,x,143,TEAL,31,"center",232);
  text(`${(p.voltage/1000).toFixed(2)} kV → ${(p.voltage/1000).toFixed(2)} keV`,x,188,INK,18,"center",232);
  text(`Order n = ${p.order}`,x,231,BLUE,20,"center",232);
  text(q.permitted?`Δ = ${(q.pathDifference*1e12).toFixed(2)} pm`:`nλ / 2d = ${q.argument.toFixed(3)} > 1`,x,276,q.permitted?PURPLE:GOLD,18,"center",232);
  text(q.permitted?`Deflection = ${(2*q.angle).toFixed(2)}°`:"sin θ cannot exceed 1",x,319,INK,17,"center",232);
  text("No intensity pattern is predicted",x,376,MUTED,13,"center",232);
  rect(102,316,411,80,"#e0eef466",null,8);
  path(matterWave(q,t),TEAL,2);
  const a=pos([-2.9,1.08]),b=pos([-2.9+q.wavelengthDisplay,1.08]);
  line([a,b],GOLD,2);for(const v of [a,b])line([[v[0],v[1]-6],[v[0],v[1]+6]],GOLD,2);
  text("λ · separate enlarged fixed scale",307,393,MUTED,14,"center",400);
  foot(`Electron speed ${(q.speed/1e6).toFixed(2)} × 10⁶ m/s`,"Lattice enlarged · true angles, no magnification");
}
