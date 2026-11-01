/** Calibrated companion to the motion bench; never wraps a body's position. */
import { motionLayout, tickStep } from './kinematics-display.js';
import { linearMotion } from './linear-motion.js';
export function drawMotionDiagram({p,q,t,title,line,text,arrow,rect,circle,foot}) {
  const l=motionLayout(p),span=l.high-l.low,applied=p.mode?p.mass*p.g:p.force,
    colors=['#ffc580','#ff8e7f','#91baff','#c4a3ff'],values=[q.v*l.velocityScale,applied*l.forceScale,-p.drag*q.v*l.forceScale,q.net*l.forceScale],step=tickStep(span);
  title(p.mode?'Vertical motion · positive down':'Newton’s motion track','Fixed eight-second displacement scale · exact linear drag');
  if(p.mode) {
    const y=115+(q.x-l.low)/span*225;
    line([[280,95],[280,365]],'#658a9f',1,[4,5]);circle(280,y,21,'#d2b38c',true);
    for(let n=Math.ceil(l.low/step);n*step<=l.high+step*1e-8;n++) {
      const yy=115+(n*step-l.low)/span*225;
      line([[205,yy],[225,yy]],'#8faec2',1);text(`${Number((n*step).toPrecision(4))} m`,180,yy+5,'#abc9d8',17,'right');
    }
    values.forEach((v,i)=>arrow(330+i*45,y,0,v*56,colors[i],3));
    for(const [i,name,value,unit] of [[0,'Velocity',q.v,'m/s'],[1,'Weight',applied,'N'],[2,'Drag',-p.drag*q.v,'N'],[3,'Resultant',q.net,'N']])
      text(`${name}: ${value.toFixed(2)} ${unit}`,545,145+i*55,colors[i],20);
    text('0 m is release; no ground collision is modelled.',420,401,'#8faec2',16,'center');
  } else {
    const x=150+(q.x-l.low)/span*540;
    line([[65,305],[780,305]],'#658a9f',3);
    for(let n=Math.ceil(l.low/step);n*step<=l.high+step*1e-8;n++) {
      const xx=150+(n*step-l.low)/span*540;
      line([[xx,310],[xx,325]],'#8faec2',1);text(`${Number((n*step).toPrecision(4))} m`,xx,345,'#abc9d8',16,'center');
    }
    rect(x-38,250,76,40,'#6be5d455','#6be5d4',5);circle(x-25,298,8,'#91baff',true);circle(x+25,298,8,'#91baff',true);
    values.forEach((v,i)=>arrow(x,[135,195,365,395][i],v*80,0,colors[i],3));
    text('Gold v · coral applied · blue drag · purple resultant',420,89,'#bfd9e4',17,'center');
    text('Calculated 50 Hz position marks',65,225,'#8faec2',14);
    for(let i=0;i<=50;i++) {
      const time=t-(50-i)/50;if(time<0)continue;
      circle(150+(linearMotion(p,time).x-l.low)/span*540,237,2,'#6be5d4',true);
    }
  }
  foot(`x = ${q.x.toFixed(2)} m · v = ${q.v.toFixed(2)} m/s`,`a = ${q.a.toFixed(2)} m/s²`);
}
