/** Read-only display geometry and observation clocks. Previews use the same
 * RK4 equation and step as the live projectile, never experimental data. */
import { linearMotion, motionTurningTime } from "./linear-motion.js";
import { createExtra, stepExtra, projectileReference, collisionVelocities, DEG } from "./physics-extra.js";
export const MOTION_DURATION=8, CART_LENGTH=.8, COLLISION_SCALE=1.1;
export function tickStep(span, count=5) {
  const target=Math.max(span/count,1e-12), base=10**Math.floor(Math.log10(target)), n=target/base;
  return (n<=1?1:n<=2?2:n<=5?5:10)*base;
}
export function motionLayout(p) {
  const times=[0,MOTION_DURATION], turn=motionTurningTime(p);
  if(turn!==null&&turn>0&&turn<MOTION_DURATION) times.push(turn);
  const samples=times.map(t=>linearMotion(p,t)), xs=samples.map(q=>q.x);
  let low=Math.min(...xs), high=Math.max(...xs);
  if(high-low<1) {const middle=(low+high)/2;low=middle-.5;high=middle+.5;}
  const span=high-low, scale=(p.mode?3.6:6.8)/span,
    forceScale=1.25/Math.max(1,...samples.flatMap(q=>[Math.abs(q.applied),Math.abs(p.drag*q.v),Math.abs(q.net)])),
    velocityScale=1.25/Math.max(1,...samples.map(q=>Math.abs(q.v)));
  return {low,high,scale,forceScale,velocityScale,
    point(x){return p.mode?[-1.7,4.45-(x-low)*scale,0]:[-3.4+(x-low)*scale,.77,0];}};
}
export function collisionObservation(p) {
  const closing=p.u1-p.u2, contact=closing>0?3.2/closing:Infinity,
    separation=p.restitution*Math.max(0,closing),
    duration=closing>0?Math.min(10,contact+Math.min(2,separation>0?6.2/separation:2))
      :closing<0?Math.min(10,3/(-closing)):10;
  return {duration,contact,rate:duration/6,step:duration/2400,sampleEvery:duration/400};
}
/** Piecewise linear trajectories reach their extrema at release, impact or
 * the end. Fit these once so the ruler stays fixed in the lab frame. */
const collisionLayouts = new WeakMap();
export function collisionLayout(p) {
  if (collisionLayouts.has(p)) return collisionLayouts.get(p);
  const {duration,contact}=collisionObservation(p), start=createExtra("collisions",p).state;
  const samples=[start,stepExtra("collisions",start,p,duration)];
  if(contact<duration) samples.push(stepExtra("collisions",start,p,contact));
  const xs=samples.flatMap(({x1,x2})=>[x1,x2]),
    low=Math.min(...xs)-CART_LENGTH/2, high=Math.max(...xs)+CART_LENGTH/2,
    center=(low+high)/2, scale=Math.min(COLLISION_SCALE,8.15/(high-low)),
    step=tickStep(8.8/scale,8), ticks=[];
  for(let n=Math.ceil((center-4.4/scale)/step);n*step<=center+4.4/scale;n++) ticks.push(n*step);
  const layout={low,high,center,scale,step,ticks,point:x=>(x-center)*scale};
  collisionLayouts.set(p,layout);
  return layout;
}
export function collisionSpeedScale(p) {
  const after=collisionVelocities(p.m1,p.m2,p.u1,p.u2,p.restitution);
  return 1.35/Math.max(1,Math.abs(p.u1),Math.abs(p.u2),Math.abs(after.v1),Math.abs(after.v2));
}
const previews=new WeakMap();
export function projectilePreview(p) {
  const key=[p.speed,p.angle,p.height,p.g,p.drag].join('/'), cached=previews.get(p);
  if(cached?.key===key) return cached.data;
  const vacuum=projectileReference(p), step=Math.min(1/240,vacuum.flightTime/2000), run=createExtra('projectile',p);
  let state=run.state, maxY=state.y, maxSpeed=p.speed;
  for(let i=0;i<150000&&!state.landed;i++) {
    state=stepExtra('projectile',state,run.params,step);
    maxY=Math.max(maxY,state.y); maxSpeed=Math.max(maxSpeed,Math.hypot(state.vx,state.vy));
  }
  if(!state.landed) throw new RangeError('Projectile observation did not reach the ground.');
  const data={step,duration:state.t,range:state.x,maxHeight:maxY,maxSpeed,vacuum};
  previews.set(p,{key,data});return data;
}
export function projectileLayout(p, frame='actual') {
  const q=projectilePreview(p), v=q.vacuum,
    range=frame==='vacuum'?Math.max(q.range,v.range):q.range,
    height=frame==='vacuum'?Math.max(q.maxHeight,v.maxHeight):q.maxHeight,
    scale=.97*Math.min(8/Math.max(range,.05),3.45/Math.max(height,.01));
  return {scale,maxX:8/scale,maxY:3.45/scale,
    point(q){return [-4+q.x*scale,.47+q.y*scale,0];}};
}
export function vacuumPoint(p,t) {return {x:p.speed*Math.cos(p.angle*DEG)*t,y:p.height+p.speed*Math.sin(p.angle*DEG)*t-.5*p.g*t*t};}
/** Liang–Barsky clipping preserves separate segments: there is no false line
 * joining portions of a reference trajectory outside the observation window. */
export function clipFlightSegment(a,b,maxX,maxY) {
  const dx=b.x-a.x,dy=b.y-a.y, ps=[-dx,dx,-dy,dy],qs=[a.x,maxX-a.x,a.y,maxY-a.y];
  let lo=0,hi=1;
  for(let i=0;i<4;i++) {
    if(Math.abs(ps[i])<1e-20){if(qs[i]<0)return null;continue;}
    const r=qs[i]/ps[i];if(ps[i]<0)lo=Math.max(lo,r);else hi=Math.min(hi,r);
    if(lo>hi)return null;
  }
  return [{x:a.x+lo*dx,y:a.y+lo*dy},{x:a.x+hi*dx,y:a.y+hi*dy}];
}
