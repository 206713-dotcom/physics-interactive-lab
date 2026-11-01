/** A massless rigid beam with two attached point masses. Positive angle is
 * anticlockwise, so the left mass descends for a positive resultant moment.
 * Fixed bearing damping: 0.35 N m s. Inelastic angular stops: ±24 degrees.
 * Block dimensions are visual markers; their own rotational inertia is omitted. */
export const BEAM_GRAVITY=9.81, BEAM_DAMPING=.35, BEAM_STOP=24*Math.PI/180;
export function createMoments() {
  return {t:0,theta:0,omega:0,dissipated:0,impactLoss:0,contact:0};
}
export function momentsReadings(s,p) {
  const theta=s.theta||0,omega=s.omega||0,
    inertia=p.m1*p.d1**2+p.m2*p.d2**2,
    armLeft=p.d1*Math.cos(theta),armRight=p.d2*Math.cos(theta),
    left=p.m1*BEAM_GRAVITY*armLeft,right=p.m2*BEAM_GRAVITY*armRight,
    net=left-right, dampingMoment=-BEAM_DAMPING*omega,
    held=s.contact && s.contact*net>=0 && Math.abs(omega)<1e-12,
    stopMoment=held?-net:0;
  return {left,right,net,armLeft,armRight,theta,angle:theta*180/Math.PI,omega,inertia,
    dampingMoment,stopMoment,torque:net+dampingMoment+stopMoment,
    alpha:(net+dampingMoment+stopMoment)/inertia,
    kinetic:.5*inertia*omega**2,
    potential:BEAM_GRAVITY*(p.m2*p.d2-p.m1*p.d1)*Math.sin(theta),
    dissipated:s.dissipated||0,impactLoss:s.impactLoss||0,contact:s.contact||0};
}
function rk4(s,p,h) {
  const I=p.m1*p.d1**2+p.m2*p.d2**2,
    load=BEAM_GRAVITY*(p.m1*p.d1-p.m2*p.d2),
    derivative=([a,w])=>[w,(load*Math.cos(a)-BEAM_DAMPING*w)/I,BEAM_DAMPING*w*w],
    value=[s.theta,s.omega,s.dissipated],
    plus=(k,f)=>value.map((v,i)=>v+h*f*k[i]),
    a=derivative(value),b=derivative(plus(a,.5)),c=derivative(plus(b,.5)),d=derivative(plus(c,1));
  const next=value.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);
  return {...s,t:s.t+h,theta:next[0],omega:next[1],dissipated:next[2],contact:0};
}
export function stepMoments(state,p,h) {
  if (!Number.isFinite(h)||h<=0||h>60) throw new RangeError('Beam time step must be positive and at most 60 s.');
  let s={...createMoments(),...state},remaining=h;
  const I=p.m1*p.d1**2+p.m2*p.d2**2,step=Math.min(1/240,.25*I/BEAM_DAMPING),
    load=BEAM_GRAVITY*(p.m1*p.d1-p.m2*p.d2);
  while (remaining>1e-12) {
    if (s.contact && s.contact*load>=0 && Math.abs(s.omega)<1e-12)
      return {...s,t:state.t+h};
    const dt=Math.min(step,remaining),next=rk4(s,p,dt);
    if (Math.abs(next.theta)>BEAM_STOP) {
      const sign=Math.sign(next.theta);
      // Locate contact before removing kinetic energy; do not count an
      // overshot position as a real physical state or invent damping losses.
      let lo=0,hi=dt;
      for(let i=0;i<36;i++) {
        const mid=(lo+hi)/2;
        if(sign*rk4(s,p,mid).theta>BEAM_STOP) hi=mid;else lo=mid;
      }
      const hit=rk4(s,p,(lo+hi)/2);
      s={...hit,theta:sign*BEAM_STOP,omega:0,contact:sign,
        impactLoss:hit.impactLoss+.5*I*hit.omega**2};
      return {...s,t:state.t+h};
    }
    s=next;remaining-=dt;
  }
  return {...s,t:state.t+h};
}
