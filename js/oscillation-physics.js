/** SI readings shared by the 3D benches, diagrams and worked calculations.
 * These functions read state; only the integrators advance the experiment. */
import { springEnergy, springInfo } from './physics.js';
import { pendulumEnergy, DEG } from './physics-extra.js';

export const SPRING_TRACK = { origin:1, scale:3.2, height:.74 };
export const PENDULUM_RIG = { length:2.7, pivot:[0,3.4,0] };

export function springReadings(s,p) {
  const restoring=-p.k*s.x, damping=-p.damping*s.v, net=restoring+damping,
    initial=.5*p.k*p.displacement**2, energy=springEnergy(s,p), info=springInfo(p);
  return {...energy,initial,restoring,damping,net,a:net/p.mass,
    dissipated:s.dissipated??0,accounted:energy.total+(s.dissipated??0),
    power:p.damping*s.v**2,
    regime:info.zeta===0?'Undamped':Math.abs(info.zeta-1)<1e-8?'Critically damped':info.zeta<1?'Underdamped':'Overdamped',...info};
}

/** T = 4 sqrt(L/g) K(sin(|theta0|/2)). The AGM evaluates the complete
 * elliptic integral without truncating the large-angle series (NIST 19.8.5).
 * An undamped reference; it is not a measured period of a damped run. */
export function pendulumPeriod(p) {
  let a=1,b=Math.cos(p.angle*DEG/2);
  for(let i=0;i<12&&Math.abs(a-b)>2e-16;i++) [a,b]=[(a+b)/2,Math.sqrt(a*b)];
  return 2*Math.PI*Math.sqrt(p.length/p.g)/a;
}

/** The supported pendulum range is underdamped even at its greatest beta.
 * This is the analytic linearised equation, with the SAME release and damping.
 * sinc avoids loss of precision near critical damping or at t=0. */
export function smallAngleReference(p,t) {
  const omega0=Math.sqrt(p.g/p.length),decay=p.damping/2,
    w=Math.sqrt(Math.max(0,omega0**2-decay**2)),z=w*t,
    sinc=Math.abs(z)<1e-5?1-z*z/6+z**4/120:Math.sin(z)/z,
    release=p.angle*DEG,e=Math.exp(-decay*t);
  return {theta:release*e*(Math.cos(z)+decay*t*sinc),omega:-release*omega0**2*t*sinc*e};
}

export function pendulumReadings(s,p) {
  const sin=Math.sin(s.theta),cos=Math.cos(s.theta),speed=p.length*s.omega,
    alpha=-p.g/p.length*sin-p.damping*s.omega,
    // Positive link force pulls inward. A rigid link can also push outward.
    link=p.mass*(p.length*s.omega**2+p.g*cos),drag=-p.mass*p.damping*speed,
    velocity=[speed*cos,speed*sin,0],
    acceleration=[p.length*alpha*cos-p.length*s.omega**2*sin,p.length*alpha*sin+p.length*s.omega**2*cos,0],
    weight=[0,-p.mass*p.g,0],constraint=[-link*sin,link*cos,0],damping=[drag*cos,drag*sin,0],
    energy=pendulumEnergy(s,p),initial=2*p.mass*p.g*p.length*Math.sin(p.angle*DEG/2)**2;
  return {...energy,initial,alpha,speed:Math.abs(speed),velocity,acceleration,weight,constraint,damping,link,drag,
    dissipated:s.dissipated??0,accounted:energy.total+(s.dissipated??0),power:p.mass*p.length**2*p.damping*s.omega**2};
}

/** Fixed linear scales for a whole run; changing the camera never changes SI.
 * The energy bounds apply to release from rest with nonnegative damping. */
export function oscillationScales(type,p) {
  if(type==='spring') {
    const amplitude=Math.abs(p.displacement),vmax=amplitude*Math.sqrt(p.k/p.mass),
      force=Math.max(p.k*amplitude+p.damping*vmax,1e-8);
    return {velocity:1.15/Math.max(vmax,1e-8),force:1.15/force,acceleration:1.15/(force/p.mass)};
  }
  const v2=2*p.g*p.length*(1-Math.cos(p.angle*DEG)),vmax=Math.sqrt(v2),
    force=Math.max(p.mass*(p.g+v2/p.length)+p.mass*p.damping*vmax,1e-8);
  return {velocity:1.1/Math.max(vmax,1e-8),force:1.15/force,acceleration:1.15/(force/p.mass)};
}

export function pendulumPoint(theta) {
  const {length,pivot}=PENDULUM_RIG;
  return [pivot[0]+length*Math.sin(theta),pivot[1]-length*Math.cos(theta),pivot[2]];
}
