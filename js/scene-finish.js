/** Display-only finish: bevels, light cards and a quiet studio horizon.
 * None of these meshes, shaders or lights participate in the physics model. */
import * as T from "../vendor/three.module.min.js";

/** Round a subdivided box by projecting its edges onto an inset cuboid.
 * Dimensions remain exact, including very thin plates. */
export function roundedBox(w, h, d, radius = Math.min(w, h, d) * 0.1) {
  const r = Math.min(radius, w / 2, h / 2, d / 2),
    g = new T.BoxGeometry(w, h, d, 4, 4, 4),
    p = g.attributes.position,
    n = g.attributes.normal,
    half = [w / 2, h / 2, d / 2],
    v = new T.Vector3(),
    inner = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    inner.set(...half.map((a, j) => T.MathUtils.clamp(v.getComponent(j), -a + r, a - r)));
    const normal = v.clone().sub(inner).normalize();
    v.copy(inner).addScaledVector(normal, r);
    p.setXYZ(i, v.x, v.y, v.z);
    n.setXYZ(i, normal.x, normal.y, normal.z);
  }
  g.computeBoundingSphere();
  return g;
}

export function studioEnvironment(renderer) {
  const room = new T.Scene();
  room.background = new T.Color(0x263447);
  for (const [xyz, size, color, intensity] of [
    [[-4, 7, 3], [5, 6], 0xe8f4ff, 4],
    [[6, 3, 1], [3, 7], 0xa3c6dc, 2],
    [[0, 5, -6], [7, 2], 0x76d6db, 2],
  ]) {
    const card = new T.Mesh(new T.PlaneGeometry(...size), new T.MeshBasicMaterial({ color, side: T.DoubleSide }));
    card.material.color.multiplyScalar(intensity);
    card.position.set(...xyz);
    card.lookAt(0, 1, 0);
    room.add(card);
  }
  const generator = new T.PMREMGenerator(renderer),
    target = generator.fromScene(room, 0, 0.1, 60);
  generator.dispose();
  room.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return target;
}

/** A subtle, antialiased metre-free grid. It is a visual work surface. */
export function studioGrid() {
  const mesh = new T.Mesh(new T.PlaneGeometry(100, 100), new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { opacity: { value: 0.22 } },
    vertexShader: `varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 p;uniform float opacity;
      float grid(vec2 p,float s){vec2 q=p/s;vec2 a=abs(fract(q-.5)-.5)/max(fwidth(q),vec2(.001));return 1.-min(min(a.x,a.y),1.);}
      void main(){float fade=exp(-dot(p,p)*.012);float lines=grid(p,.75)*.24+grid(p,3.)*.5;gl_FragColor=vec4(vec3(.28,.43,.54),lines*fade*opacity);}`,
  }));
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/** Mild water sheen: surface stays flat so the calibrated immersion is exact.
 * Highlight movement is schematic, driven by the actual cube speed. */
export function waterSurface(w, d) {
  return new T.Mesh(new T.PlaneGeometry(w, d), new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    uniforms: { time: { value: 0 }, motion: { value: 0 } },
    vertexShader: `varying vec2 uvP;varying vec3 n;varying vec3 eye;void main(){uvP=uv;vec4 v=modelViewMatrix*vec4(position,1.);eye=-v.xyz;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*v;}`,
    fragmentShader: `varying vec2 uvP;varying vec3 n;varying vec3 eye;uniform float time;uniform float motion;
      void main(){vec2 p=(uvP-.5)*vec2(1.65,1.);float r=length(p);float rip=sin(r*75.-time*5.)*exp(-r*4.)*min(motion,1.);
      float fres=pow(1.-abs(dot(normalize(n),normalize(eye))),3.);
      float light=exp(-pow((uvP.x*.7+uvP.y*.3-.65)*18.+rip*.4,2.));
      vec3 c=mix(vec3(.06,.29,.37),vec3(.48,.83,.87),light*.5+fres*.35);
      gl_FragColor=vec4(c,.22+fres*.16+light*.12+max(rip,0.)*.12);}`,
  }));
}
