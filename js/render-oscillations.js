/** The calibrated 2D companion uses exactly the same readings and reference
 * model as the 3D benches. No physics is advanced by drawing. */
import { springReadings,pendulumReadings,pendulumPeriod,smallAngleReference,oscillationScales } from './oscillation-physics.js';
export function drawOscillation(canvas,lab) {
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  const background=c.createLinearGradient(0,0,width,height);background.addColorStop(0,'#081827');background.addColorStop(1,'#132d3e');
  c.fillStyle=background;c.fillRect(0,0,width,height);
  const scale=Math.min(width/900,height/520);c.translate((width-900*scale)/2,(height-520*scale)/2);c.scale(scale,scale);
  const gold='#ffc584',cyan='#64e8d1',purple='#c3a6ff',red='#ff8e7f',blue='#89baff',muted='#9fbfd0',p=lab.params,s=lab.state,
    spring=lab.type==='spring',q=spring?springReadings(s,p):pendulumReadings(s,p),scales=oscillationScales(lab.type,p),
    motion=spring?lab.oscillationVectors==='motion':lab.oscillationVectors!=='forces',
    text=(t,x,y,col=muted,size=19,align='left')=>{c.fillStyle=col;c.font=`${size}px Inter,Segoe UI,sans-serif`;c.textAlign=align;c.fillText(t,x,y);},
    line=(points,col=muted,lw=2,dash=[])=>{if(!points.length)return;c.beginPath();c.setLineDash(dash);points.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=col;c.lineWidth=lw;c.stroke();c.setLineDash([]);},
    circle=(x,y,r,col,fill=true)=>{c.beginPath();c.arc(x,y,r,0,2*Math.PI);if(fill){c.fillStyle=col;c.fill();}else{c.strokeStyle=col;c.lineWidth=3;c.stroke();}},
    arrow=(at,v,col)=>{const len=Math.hypot(...v);if(len<.2)return;const end=at.map((x,i)=>x+v[i]),a=Math.atan2(v[1],v[0]),head=Math.min(10,len*.32);line([at,end],col,3);line([[end[0]-head*Math.cos(a-.4),end[1]-head*Math.sin(a-.4)],end,[end[0]-head*Math.cos(a+.4),end[1]-head*Math.sin(a+.4)]],col,3);};
  text(spring?'MASS–SPRING BENCH':'NONLINEAR PENDULUM',40,33,cyan,17);
  text(spring?`${q.regime} · ζ = ${q.zeta.toFixed(2)}`:`L ${p.length.toFixed(2)} m · rigid massless link`,860,33,muted,17,'right');
  text(spring?`x = ${s.x.toFixed(3)} m · v = ${s.v.toFixed(3)} m/s`:`θ = ${(s.theta*180/Math.PI).toFixed(1)}° · speed = ${q.speed.toFixed(2)} m/s`,450,76,'#e0edf4',24,'center');
  if(!spring&&lab.smallAngleReference)text('Dashed purple: linear prediction with the same release and damping',450,106,purple,16,'center');
  if(spring) {
    const origin=500,metres=230,x=origin+s.x*metres,y=326;
    line([[65,y+31],[835,y+31]],'#5b7f94',4);
    c.fillStyle='#385367';c.fillRect(75,y-52,18,82);
    line([[93,y],[115,y],...Array.from({length:65},(_,i)=>[115+(x-35-115)*i/64,y+Math.sin(i/64*12*Math.PI)*15]),[x-28,y]],cyan,3);
    c.fillStyle='#5ccbbb';c.beginPath();c.roundRect(x-30,y-25,60,44,7);c.fill();
    circle(x-18,y+26,7,'#a5c1d2');circle(x+18,y+26,7,'#a5c1d2');
    text(`${p.mass.toFixed(1)} kg`,x,y+2,'#092c37',15,'center');
    line([[origin,295],[origin,409]],purple,1,[4,6]);
    for(let i=-4;i<=4;i++){
      const xx=origin+i*.2*metres;line([[xx,374],[xx,388]],muted,1);
      text(`${Number((i*.2).toFixed(1))}`,xx,412,muted,17,'center');
    }
    text('x / m',810,412,muted,17,'right');
    const values=motion?[s.v*scales.velocity,q.a*scales.acceleration]:[q.restoring*scales.force,q.damping*scales.force,q.net*scales.force],
      colors=motion?[gold,purple]:[cyan,red,purple],names=motion?['Velocity','Acceleration']:['Spring force','Damping force','Resultant force'];
    if(lab.vectors!==false)values.forEach((v,i)=>{arrow([x,155+i*55],[v*82,0],colors[i]);text(names[i],65,161+i*55,colors[i],18);});
  } else {
    // Full ±120° releases fit: both axes share the same metre-to-pixel scale.
    const pivot=[450,215],length=155,pt=a=>[pivot[0]+length*Math.sin(a),pivot[1]+length*Math.cos(a)],at=pt(s.theta);
    line([[pivot[0],pivot[1]],[pivot[0],pivot[1]+length]],muted,1,[4,6]);
    for(let deg=-120;deg<=120;deg+=10){
      const a=deg*Math.PI/180,r1=length+12,r2=r1+(deg%30===0?8:4);
      line([[pivot[0]+r1*Math.sin(a),pivot[1]+r1*Math.cos(a)],[pivot[0]+r2*Math.sin(a),pivot[1]+r2*Math.cos(a)]],muted,1);
      if(deg%30===0)text(`${deg}°`,pivot[0]+(r2+19)*Math.sin(a),pivot[1]+(r2+19)*Math.cos(a)+5,muted,15,'center');
    }
    if(lab.showTrail!==false)line((lab.trail??[]).map(v=>[pivot[0]+v.x*length/p.length,pivot[1]-v.y*length/p.length]),'#ffc58477',2);
    if(lab.smallAngleReference){const r=pt(smallAngleReference(p,s.t).theta);line([pivot,r],purple,2,[7,6]);circle(...r,18,purple,false);}
    line([pivot,at],'#b5cbd7',4);circle(...pivot,7,cyan);circle(...at,14,gold);
    if(lab.vectors!==false){
      const values=motion?[q.velocity,q.acceleration]:[q.weight,q.constraint,q.damping],colors=motion?[gold,purple]:[blue,cyan,red],factors=motion?[scales.velocity,scales.acceleration]:[scales.force,scales.force,scales.force];
      values.forEach((v,i)=>arrow(at,[v[0]*factors[i]*82,-v[1]*factors[i]*82],colors[i]));
    }
    text(`T₀ ${ (2*Math.PI*Math.sqrt(p.length/p.g)).toFixed(2)} s · finite-angle ${pendulumPeriod(p).toFixed(2)} s (undamped)`,450,435,muted,18,'center');
  }
  const left=105,barWidth=690;
  text(`K ${q.kinetic.toFixed(2)} J · U ${q.potential.toFixed(2)} J · damping ${q.dissipated.toFixed(2)} J`,450,464,'#d3e5ee',19,'center');
  c.fillStyle='#294355';c.fillRect(left,479,barWidth,11);let offset=left;
  [q.kinetic,q.potential,q.dissipated].forEach((v,i)=>{const w=q.initial>0?barWidth*Math.max(0,v/q.initial):0;c.fillStyle=[gold,cyan,red][i];c.fillRect(offset,479,w,11);offset+=w;});
  text(motion?'Gold: velocity · purple: total acceleration · separate scales':spring?'Cyan: spring · coral: damping · purple: resultant · one force scale':'Blue: weight · cyan: link force · coral: damping · one force scale',450,513,muted,17,'center');
}
