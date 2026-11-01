/** A readable circuit board built from the same resistor network as the
 * calculation inspector. Marker paths follow both branches at a junction;
 * their relative speeds show current ratios, not microscopic drift speeds. */
import * as T from '../vendor/three.module.min.js';
import { directionMarkers, dashedPath } from './scene-instruments.js';

const INK=0x41677f, TEAL=0x0b8077, GOLD=0xa97124, PURPLE=0x7d58a9,
  format=value=>value>0 && value<.01?value.toExponential(2):Number(value.toFixed(2)).toString(),
  length=path=>path.slice(1).reduce((sum,b,i)=>sum+Math.hypot(...b.map((v,j)=>v-path[i][j])),0);

export function createDCBench(p,k) {
  const z=.25,P=[-2.75,3.15,z],N=[-2.75,1.15,z],
    J1=[-1.8,3.15,z],J2=[2.65,3.15,z],parallel=p.mode===1,flows=[],branchLabels=[];
  let outputLabel;
  k.stand(10.2,2.6);
  k.box(9.8,5,.13,0x365a72,[0,2.4,-.28],{metalness:.3,roughness:.45});
  const paper=k.box(9.6,4.8,.025,0xeaf2f7,[0,2.4,-.19]);
  paper.material.dispose();paper.material=new T.MeshBasicMaterial({color:0xeaf2f7,toneMapped:false});
  for(const x of [-4.65,4.65])for(const y of [.17,4.63])k.ball(.035,0x6e8da3,[x,y,-.14]);
  const holes=[];
  for(let x=-4.5;x<=4.5;x+=.5)for(let y=.4;y<4.6;y+=.5)holes.push([x,y,-.14]);
  const perforations=k.instances(holes.length,.012,0x9cb4c5);
  perforations.userData.role='circuit-board-perforations';
  holes.forEach((position,i)=>k.instance(perforations,i,position));k.finishInstances(perforations);
  const wire=(points,color=INK)=>{
    for(let i=1;i<points.length;i++)k.rod(points[i-1],points[i],color,.027);
  },junction=(pos)=>{
    const dot=k.ball(.075,INK,pos);dot.userData.role='dc-junction';
  },flow=(path,key,color,count)=>{
    const start=k.objects.length,animate=directionMarkers(k,path,color,count);
    for(const marker of k.objects.slice(start))marker.userData.currentKey=key;
    flows.push({path,key,length:length(path),animate});
  };
  // Lab supply: its two terminals are distinct; external paths terminate here.
  k.box(1.4,2.5,.8,0x244b64,[-3.5,2.2,.17],{roughness:.45,metalness:.2});
  k.box(1.08,.56,.025,0x102b3c,[-3.5,2.7,.59]);
  k.label(p.voltage.toFixed(1)+' V',[-3.5,2.7,.65],'#a4eee0',.95,'ink');
  k.label('d.c. supply',[-3.5,.65,.3],'#42637d',1.35,'paper');
  for(const x of [-3.87,-3.18]) {
    const knob=k.cylinder(.12,.11,0x9eb5c3,[x,1.73,.64],{metalness:.65,roughness:.3});knob.rotation.x=Math.PI/2;
    k.line([[x,1.76,.71],[x,1.83,.71]],0x34556c,.9);
  }
  for(const [pos,color,sign] of [[P,0xb56b53,'+'],[N,0x527087,'−']]) {
    const terminal=k.cylinder(.085,.19,color,pos,{metalness:.45,roughness:.35});terminal.rotation.z=Math.PI/2;
      k.label(sign,[pos[0]+.13,pos[1]+.25,.45],sign==='+'?'#9c4b35':'#345c76',.32,'ink');
  }
  const resistor=(x,y,value,number,color)=>{
    // Uncoded ceramic body: arbitrary slider values cannot be represented
    // honestly by a fixed set of commercial resistor colour bands.
    const body=k.cylinder(.16,.8,color,[x,y,z],{metalness:.05,roughness:.55});body.rotation.z=Math.PI/2;
    for(const dx of [-.35,.35]) {
      const cap=k.cylinder(.166,.1,0x8fa9b7,[x+dx,y,z],{metalness:.65,roughness:.28});cap.rotation.z=Math.PI/2;
    }
    k.rod([x-.8,y,z],[x+.8,y,z],0x7196a9,.025);
    k.label(`R${number} · ${format(value)} Ω`,[x,y+.46,z+.1],number==='₁'?'#8d631f':'#72519a',1.9,'paper');
  };
  if(parallel) {
    const first=[J1,J2],second=[J1,[-1.8,1.65,z],[2.65,1.65,z],J2],
      feed=[P,J1],returnPath=[J2,[3.6,3.15,z],[3.6,.8,z],[-2.75,.8,z],N];
    wire(feed);wire(returnPath);
    for(const y of [3.15,1.65]) {
      wire([[-1.8,y,z],[-.5,y,z]]);wire([[1.1,y,z],[2.65,y,z]]);
    }
    wire([J1,[-1.8,1.65,z]]);wire([[2.65,1.65,z],J2]);
    resistor(.3,3.15,p.r1,'₁',0xd2b27b);resistor(.3,1.65,p.r2,'₂',0xb3a2cf);
    branchLabels.push(k.label('',[.3,2.76,.4],'#0d766f',1.8,'paper'),k.label('',[.3,1.25,.4],'#72519a',1.8,'paper'));
    junction(J1);junction(J2);
    flow(feed,'current',GOLD,2);flow(first,'i1',TEAL,4);flow(second,'i2',PURPLE,5);flow(returnPath,'current',GOLD,6);
  } else {
    const first=[-.9,3.15,z],second=[1.4,3.15,z],
      path=[P,[3.6,3.15,z],[3.6,1.15,z],N];
    wire([P,[-1.7,3.15,z]]);wire([[-.1,3.15,z],[.6,3.15,z]]);
    wire([[2.2,3.15,z],...path.slice(1)]);
    if(p.mode===3) {
      wire([[-1.7,3.15,z],[-.1,3.15,z]],0xa56e3f);
      k.label('Wire sample',[first[0],3.65,.35],'#8d631f',1.7,'paper');
    } else resistor(first[0],first[1],p.r1,'₁',0xd2b27b);
    resistor(second[0],second[1],p.r2,'₂',0xb3a2cf);
    flow(path,'current',GOLD,14);
    if(p.mode===2) {
      junction([.25,3.15,z]);
      dashedPath(k,[[.25,3.15,z],[.25,4.08,z],[2.6,4.08,z]],PURPLE,.65);
      outputLabel=k.label('',[2.85,4.12,.4],'#72519a',2.2,'paper');
    }
  }
  k.label(['Series circuit','Parallel branches','Unloaded divider','Wire + series resistor'][p.mode],[.3,4.55,.2],'#345b73',2.3,'ink');
  const description=k.label('',[.3,.55,.3],'#42677e',4.7,'ink');
  return {
    planar:true,
    camera:{target:[0,2.35,0],radius:10.2,polar:1.35,azimuth:-.1,fitAspect:1.7},
    flowPaths:flows.map(({path,key})=>({path,key})),
    update(s,q,lab) {
      // Divide by path length so unequal branch lengths cannot change the
      // intended speed ratio. All markers are visual direction indicators.
      for(const f of flows)f.animate(s.t*1.6*(q[f.key]/Math.max(q.current,1e-12))/f.length,lab.vectors!==false && q[f.key]>1e-12);
      branchLabels.forEach((label,i)=>k.setLabel(label,`I${i?'₂':'₁'} = ${format(i?q.i2:q.i1)} A`,i?'#72519a':'#0d766f',1.8));
      if(outputLabel)k.setLabel(outputLabel,`Vout = ${format(q.v2)} V`,'#72519a',2.2);
      k.setLabel(description,parallel?'Current splits at a junction, then recombines.':'One path · the same current through each component.','#42677e',4.7);
    },
  };
}
