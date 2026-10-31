/** Detailed thermal benches. Apparatus dimensions are illustrative; the
 * instrument scales and energy inventories read the authoritative SI model. */
import * as T from "../vendor/three.module.min.js";
import { PALETTE as C, clamp } from "./scene-kit.js";
import { directionMarkers } from "./scene-instruments.js";
import { createHelix } from "./scene-precision.js";
import { THERMAL_CAMERA, phaseInventory, temperatureHeight, gasHeight, gasParcelPosition, coolingFraction, gasEnergyScale, gasPressureScale } from "./thermal-geometry.js";
const metal = { metalness: 0.75, roughness: 0.27 }, glass = { transparent: true, opacity: 0.09, depthWrite: false, metalness: 0, roughness: 0.12, side: T.DoubleSide };
const cold = new T.Color(C.blue), hot = new T.Color(C.gold), temperatureColor = new T.Color();
const energy = (joules) => `${(joules/1000).toFixed(2)} kJ`;
function role(object, name) { object.userData.role = name; return object; }

function deck(k) {
  k.stand(10.2, 4.6);
  for (const x of [-4.65, 4.65]) for (const z of [-1.85, 1.85]) {
    k.cylinder(0.065, 0.025, 0xb7c6cc, [x, 0.018, z], metal);
    k.line([[x-0.035,0.033,z],[x+0.035,0.033,z]], 0x354652, 1);
  }
}
function thermometer(k, x, low, high, ticks, z = 0.9) {
  const bottom = 0.65, length = 3.55;
  k.box(0.62, 3.95, 0.1, 0x263e50, [x+0.15, 2.3, z-0.15], metal);
  k.cylinder(0.105, length+0.08, 0xa5d5e2, [x,bottom+length/2,z], glass);
  k.ball(0.16, C.red, [x,bottom,z]);
  const column = role(k.cylinder(0.055, 1, C.red, [x,1,z]), "thermal-column");
  for (const t of ticks) {
    const y = temperatureHeight(t,low,high,bottom,length);
    k.line([[x+0.13,y,z+0.05],[x+0.27,y,z+0.05]], C.white, 0.6);
    k.label(String(t),[x+0.49,y,z+0.07],"#a8c3d2",0.46);
  }
  k.label("°C",[x+0.2,4.48,z],"#c4dce7",0.65);
  return (temperature) => {
    const top=temperatureHeight(temperature,low,high,bottom,length), h=top-bottom;
    column.scale.y=h; column.position.y=bottom+h/2; column.visible=h>0;
  };
}
function instrumentLabel(k, text, position, color, width, name) {
  return role(k.label(text,position,color,width),name);
}
function signedBudget(k, p) {
  const scale = gasEnergyScale(p), bars = [], labels = [];
  k.box(3.15,3.0,0.12,0x142c3d,[2.75,1.9,-0.2],{roughness:0.8});
  for (const [i,key,col] of [[0,"heat",C.gold],[1,"work",C.cyan],[2,"internal",C.blue]]) {
    const y=2.8-i*0.9;
    k.line([[1.5,y-0.3,0],[4.0,y-0.3,0]],C.muted,0.45);
    k.line([[2.75,y-0.45,0.05],[2.75,y-0.15,0.05]],C.white,0.4);
    bars.push(role(k.box(1,0.12,0.15,col,[2.75,y-0.3,0.05]),"gas-energy-"+key));
    labels.push(k.label("",[2.75,y+0.1,0.1],new T.Color(col).getStyle(),2.8));
  }
  const names = ["Q", "W", "ΔU"], keys=["heat","work","internal"];
  return (q) => keys.forEach((key,i)=>{
    const width=q[key]/scale*1.13;
    bars[i].scale.x=Math.abs(width); bars[i].position.x=2.75+width/2;
    bars[i].visible=Math.abs(width)>1e-8;
    k.setLabel(labels[i],`${names[i]} = ${q[key]>=0?"+":""}${energy(q[key])}`,i===0?"#ffc584":i===1?"#64e8d1":"#a2caff",2.8);
  });
}

export function createGasProcessBench(p,k) {
  deck(k);
  const x=-1.55, radius=1.25, base=0.5, pressureMax=gasPressureScale(p);
  k.cylinder(1.4,0.22,0x4a6576,[x,0.28,0],metal);
  k.mesh(new T.CylinderGeometry(radius,radius,4.1,64,1,true),0x90cfdf,[x,2.55,0],glass);
  for (const y of [base,4.6]) {
    k.ring(1.27,0xb1c7d1,[x,y,0],"y",1);
    for (const sign of [-1,1]) k.box(0.28,0.15,0.28,0x8199a7,[x+sign*1.4,y,0],metal);
  }
  for(const offset of [-1.55,1.55]) k.rod([x+offset,0.1,-0.15],[x+offset,4.9,-0.15],0x718d9f,0.055);
  k.box(3.4,0.2,0.5,0x4b6474,[x,4.9,-0.15],metal);
  const piston=role(k.cylinder(1.22,0.18,0x879eac,[x,2,0],metal),"gas-piston"),
    seal=k.cylinder(1.225,0.045,0x203c4a,[x,1.95,0]),
    rod=role(k.cylinder(0.075,1,0xc0d1d7,[x,4,0],metal),"gas-piston-rod"),
    fill=role(k.cylinder(1.18,1,C.cyan,[x,1,0],{transparent:true,opacity:0.08,depthWrite:false,roughness:0.5}),"gas-volume"),
    parcels=role(k.instances(72,0.045,0xe1eff6),"gas-parcels");
  for(const ratio of [0.5,1,2,3]) {
    const y=base+1.25*ratio;
    k.line([[x-1.4,y,0.1],[x-1.2,y,0.1]],C.white,0.6);
    k.label(`${ratio}V₀`,[x-1.85,y,0.2],ratio===1?"#ffc584":"#9dbdcd",0.78);
  }
  const reference=k.ring(1.19,C.gold,[x,base+1.25,0],"y",0.35);
  reference.userData.role="gas-initial-volume";
  const gauge=k.cylinder(0.75,0.16,0x263f50,[2.75,4.38,0],metal); gauge.rotation.x=Math.PI/2;
  const face=k.cylinder(0.66,0.015,0x102434,[2.75,4.38,0.09]); face.rotation.x=Math.PI/2;
  for(let i=0;i<=6;i++) {
    const a=(-135+i*45)*Math.PI/180;
    k.line([[2.75+.51*Math.sin(a),4.38+.51*Math.cos(a),.12],[2.75+.61*Math.sin(a),4.38+.61*Math.cos(a),.12]],C.white,0.8);
  }
  k.label(`0–${pressureMax/1000} kPa`,[2.75,4.13,0.2],"#a3c0d0",1.25);
  const needle=role(k.arrow([2.75,4.38,.15],[0,.47,0],C.gold),"gas-pressure-needle"),
    reading=instrumentLabel(k,"",[2.75,5.45,.1],"#ffc584",3,"gas-pressure-reading"),
    state=instrumentLabel(k,"",[-1.45,5.6,0],"#b8e0ea",5.2,"gas-state-reading");
  k.label(["ISOTHERMAL · T fixed","ISOBARIC · p fixed","ADIABATIC · Q = 0"][p.mode],[0,6.35,0],"#d7e8ef",5.6);
  k.label("Q into gas · W by gas · ΔU = Q − W",[1.9,0.17,1.85],"#a9c6d5",4.5);
  const budget=signedBudget(k,p);
  return { camera:{...THERMAL_CAMERA,target:[0,3.0,0],radius:13.4}, afterVisibility(){needle.visible=true;}, update(s,q) {
    const h=gasHeight(q), top=base+h;
    piston.position.y=top+0.09; seal.position.y=top+0.01;
    rod.scale.y=4.9-(top+0.18); rod.position.y=(top+0.18+4.9)/2;
    fill.scale.y=h; fill.position.y=base+h/2;
    temperatureColor.copy(cold).lerp(hot,clamp((q.temperature-150)/1350,0,1)); fill.material.color.copy(temperatureColor);
    const phase=s.t*Math.sqrt(q.temperature/p.initial)*0.9;
    for(let i=0;i<parcels.count;i++) k.instance(parcels,i,gasParcelPosition(i,q,phase));
    k.finishInstances(parcels);
    const a=(-135+clamp(q.pressure/pressureMax,0,1)*270)*Math.PI/180;
    k.setArrow(needle,[2.75,4.38,.15],[.47*Math.sin(a),.47*Math.cos(a),0]);
    k.setLabel(reading,`p = ${(q.pressure/1e6).toFixed(3)} MPa`,"#ffc584",3);
    k.setLabel(state,`V = ${(q.volume*1000).toFixed(2)} L · T = ${q.temperature.toFixed(1)} K`,"#b8e0ea",5.2);
    budget(q);
  }};
}

export function createCalorimeterBench(p,k) {
  deck(k);
  const x=-1.6, bottom=.65;
  k.box(3.4,.4,2.9,0x304b5f,[x,.25,0],metal);
  k.cylinder(1.33,.12,0x647e8c,[x,.51,0],metal);
  const heating = createHelix(7,0.22,0.035); heating.update(1.8);
  const coil=k.mesh(heating.geometry,0xcf8e59,[x-.9,.55,0],{...metal,emissive:C.gold,emissiveIntensity:.2+p.power/3000*.7});
  coil.userData.role="calorimeter-heater";
  k.mesh(new T.CylinderGeometry(1.22,1.22,3.15,64,1,true),0xb0dbe6,[x,2.22,0],glass);
  k.ring(1.22,0xb0dbe6,[x,3.8,0],"y",.8);
  k.ring(1.23,0x6b8fa0,[x,bottom,0],"y",1);
  k.rod([x+1.16,1.2,-.3],[x+1.55,1.4,-.3],0xa5c5d2,.04);
  k.rod([x+1.55,1.4,-.3],[x+1.55,2.7,-.3],0xa5c5d2,.04);
  k.rod([x+1.55,2.7,-.3],[x+1.16,2.9,-.3],0xa5c5d2,.04);
  const waterHeight=1.68**3/(Math.PI*1.08**2),
    liquid=role(k.cylinder(1.08,waterHeight,0x6daecc,[x,bottom+waterHeight/2,0],{transparent:true,opacity:.34,depthWrite:false,roughness:.22}),"calorimeter-liquid"), ice=[];
  for(let i=0;i<8;i++) ice.push(role(k.box(.84,.84,.84,0xc4e5ee,[x,1,0],{roughness:.2,metalness:.05,transparent:true,opacity:.83}),"calorimeter-ice"));
  const solid=role(k.box(1.68,1.68,1.68,0xb5aa8e,[x,bottom+.84,0],{...metal,roughness:.42}),"calorimeter-custom-solid"),
    vapour=role(k.instances(40,.045,0xc8e1eb),"calorimeter-vapour"),
    temperature=instrumentLabel(k,"",[-1.6,4.65,0],"#ffc584",2.5,"calorimeter-temperature"),
    stage=instrumentLabel(k,"",[0,5.55,0],"#d0e5ee",6.4,"calorimeter-phase");
  const thermometerUpdate=thermometer(k,.4,-30,200,[-30,0,50,100,150,200],.65);
  k.label(`Heater: ${p.power} W`,[-1.6,.16,1.85],"#ffc584",3);
  k.label(p.mode?"Single phase · constant c":"Water at 1 atm · no heat losses",[0,6.15,0],"#9dbfce",5.3);
  const phaseBars=[], phaseLabels=[];
  for(const [i,name,color] of [[0,"Ice",C.blue],[1,"Liquid",C.cyan],[2,"Vapour",C.purple]]) {
    const y=3.55-i*1.0;
    k.box(2.4,.14,.18,0x203c4d,[3.1,y-.3,0]);
    phaseBars.push(role(k.box(2.4,.14,.2,color,[3.1,y-.3,.04]),"phase-mass-"+i));
    phaseLabels.push(k.label(name,[3.1,y+.1,.05],new T.Color(color).getStyle(),2.8));
  }
  const input=instrumentLabel(k,"",[2.9,.65,.4],"#c4dce6",3.3,"calorimeter-energy");
  k.label(p.mode?"Sample properties":"Mass fractions",[3.1,4.35,0],"#b7d4e0",2.8);
  k.label("Phase volumes schematic",[-1.6,0.12,-1.65],"#9cbdce",3.5);
  return { camera:{...THERMAL_CAMERA,target:[0,2.8,0],radius:14.1}, update(s,q) {
    const f=phaseInventory(p,q), cubeSide=.84*Math.cbrt(f.solid), liquidHeight=waterHeight*f.liquid;
    liquid.visible=!p.mode && f.liquid>0;
    liquid.scale.y=f.liquid; liquid.position.y=bottom+liquidHeight/2;
    for(let i=0;i<8;i++) {
      const a=ice[i]; a.visible=!p.mode&&f.solid>0; a.scale.setScalar(Math.cbrt(f.solid));
      a.position.set(x+((i%2)-.5)*cubeSide,bottom+liquidHeight+(Math.floor(i/4)+.5)*cubeSide,((Math.floor(i/2)%2)-.5)*cubeSide);
    }
    solid.visible=!!p.mode;
    temperatureColor.copy(cold).lerp(hot,clamp((q.temperature+30)/230,0,1)); solid.material.color.copy(temperatureColor);
    vapour.visible=!p.mode && f.vapour>0;
    const count=Math.round(40*f.vapour);
    for(let i=0;i<40;i++) {
      const a=gasParcelPosition(i,{ratio:1},s.t*.035);
      k.instance(vapour,i,[x+(a[0]+1.55)*.8,bottom+liquidHeight+.18+(a[1]-.5)/1.25*(2.75-liquidHeight),a[2]*.8]);
      // A fixed instance allocation; draw only the vapour inventory that exists.
    }
    vapour.count=count;
    k.finishInstances(vapour);
    thermometerUpdate(q.temperature);
    k.setLabel(temperature,`${q.temperature.toFixed(1)} °C`,"#ffc584",2.5);
    k.setLabel(stage,f.name,"#d0e5ee",Math.min(4.9,.2*f.name.length+.35));
    const values=[f.solid,f.liquid,f.vapour];
    phaseBars.forEach((bar,i)=>{bar.visible=!p.mode&&values[i]>0;bar.scale.x=values[i];bar.position.x=1.9+1.2*values[i];});
    const properties=[`m = ${p.mass} kg`,`c = ${p.capacity} J/(kg K)`,`dT/dt = ${(p.power/(p.mass*p.capacity)).toFixed(2)} K/s`];
    phaseLabels.forEach((label,i)=>k.setLabel(label,p.mode?properties[i]: `${["Ice","Liquid","Vapour"][i]}: ${(values[i]*100).toFixed(1)}%`,i===0?"#a2caff":i===1?"#64e8d1":"#c3a6ff",2.8));
    k.setLabel(input,`Energy in: ${energy(q.energy)}`,"#c4dce6",3.3);
  }};
}

export function createCoolingBench(p,k) {
  deck(k);
  k.box(3.15,.16,2.3,0x6d8291,[-1.55,.24,0],metal);
  for(const x of [-2.5,-.6]) for(const z of [-.65,.65]) k.cylinder(.1,.3,0xaebec6,[x,.43,z],{roughness:.8});
  const body=role(k.box(2.7,1.65,1.8,0xbe9768,[-1.55,1.4,0],{...metal,roughness:.4}),"cooling-body"),
    thermometerUpdate=thermometer(k,.12,0,160,[0,40,80,120,160],1.0),
    reading=instrumentLabel(k,"",[-1.7,4.85,0],"#ffc584",3.7,"cooling-temperature");
  const ambientHeight=temperatureHeight(p.ambient,0,160),
    reference=k.arrow([.85,ambientHeight,1.05],[-.55,0,0],C.cyan);
  reference.userData.role="cooling-ambient-reference";
  k.label(`Surroundings: ${p.ambient} °C`,[2.7,4.85,0],"#a2caff",3.8);
  k.label(`τ = ${(p.mass*p.specific/p.conductance).toFixed(1)} s`,[2.7,4.05,0],"#b5d7e6",3.5);
  k.label("Cooling slows as ΔT shrinks",[0,5.75,0],"#d3e7ee",6.2);
  const paths=[
    [[-2.7,2.25,.2],[-3.4,2.9,.2],[-4.2,3.15,.2]],
    [[-1.55,2.25,0],[-1.55,2.9,0],[-1.55,3.6,0]],
    [[-.4,2.25,-.2],[.15,2.9,-.2],[.7,3.15,-.2]],
  ], arrows=paths.map(path=>k.arrow(path[0],[0,.9,0],C.gold)), flow=paths.map(path=>directionMarkers(k,path,C.gold,3));
  const released=role(k.box(2.8,.23,.25,C.gold,[3.0,2.5,.1]),"cooling-released"),
    remaining=role(k.box(2.8,.23,.25,C.cyan,[3.0,2.5,.1]),"cooling-remaining"),
    lostLabel=k.label("",[2.9,3.1,.2],"#ffc584",3.8),
    leftLabel=k.label("",[2.9,1.8,.2],"#64e8d1",3.8),
    power=k.label("",[2.9,.8,.2],"#e0edf3",3.4);
  k.box(3.4,3.0,.12,0x142c3d,[2.9,2.2,-.15],{roughness:.8});
  k.label("Initial excess energy = released + remaining",[0,.15,1.9],"#a8c8d9",6.2);
  const initial=p.mass*p.specific*(p.initial-p.ambient);
  return { camera:{...THERMAL_CAMERA,radius:14.0}, afterVisibility(){reference.visible=true;}, update(s,q,lab) {
    const f=coolingFraction(p,q);
    temperatureColor.copy(cold).lerp(hot,clamp(q.temperature/160,0,1));body.material.color.copy(temperatureColor);
    thermometerUpdate(q.temperature);
    arrows.forEach((a,i)=>{
      const d=paths[i][2].map((value,j)=>(value-paths[i][0][j])*.45*f);
      k.setArrow(a,paths[i][0],d); flow[i](s.t*.003,q.power>1e-10&&lab.vectors!==false);
    });
    const out=clamp(q.released/initial,0,1), left=clamp(q.remaining/initial,0,1);
    released.scale.x=out;released.position.x=1.6+1.4*out;released.visible=out>0;
    remaining.scale.x=left;remaining.position.x=1.6+2.8*out+1.4*left;remaining.visible=left>0;
    k.setLabel(reading,`Object: ${q.temperature.toFixed(1)} °C`,"#ffc584",3.7);
    k.setLabel(lostLabel,`Released: ${energy(q.released)}`,"#ffc584",3.8);
    k.setLabel(leftLabel,`Remaining: ${energy(q.remaining)}`,"#64e8d1",3.8);
    k.setLabel(power,`Heat loss: ${q.power.toFixed(1)} W`,"#e0edf3",3.4);
  }};
}
