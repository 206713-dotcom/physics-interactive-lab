import * as THREE from "../vendor/three.module.min.js";

// Procedural display detail only. These materials never enter a physics calculation.
export const noiseGLSL = `
float hash3(vec3 p){p=fract(p*.3183099+vec3(.11,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm3(vec3 p){return .52*noise3(p)+.27*noise3(p*2.03+13.)+.14*noise3(p*4.11+29.)+.07*noise3(p*8.21+7.);}
`;
const sphereVertex = `varying vec3 localP;varying vec3 viewP;varying vec3 viewN;
void main(){localP=position;vec4 p=modelViewMatrix*vec4(position,1.);viewP=p.xyz;viewN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`;

export function stellarMaterial(color = 0xffc35a) {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color(color) } },
    vertexShader: sphereVertex,
    fragmentShader: `
 ${noiseGLSL} varying vec3 localP;varying vec3 viewP;varying vec3 viewN;uniform float time;uniform vec3 color;
 void main(){vec3 p=normalize(localP);float cells=noise3(p*72.+time*.09);float turbulence=fbm3(p*19.+vec3(time*.012,0,0));
 float spots=1.-.67*smoothstep(.72,.85,fbm3(p*7.));float mu=max(0.,dot(normalize(viewN),normalize(-viewP)));
 float limb=.42+.58*pow(mu,.48);vec3 c=color*(.66+cells*.62+turbulence*.38)*spots*limb;
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
  });
}

export function surfaceMaterial(body, map) {
  const gas = [
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "venus",
      "titan",
    ].includes(body.id),
    rock = !gas && body.id !== "earth";
  const material = new THREE.MeshStandardMaterial({
    map,
    color: map ? 0xffffff : body.color,
    roughness: body.id === "earth" ? 0.64 : gas ? 0.76 : 0.92,
    metalness: 0,
    emissive: body.color,
    emissiveIntensity: 0.007,
    bumpMap: rock ? map : null,
    bumpScale: rock ? 0.022 : 0,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = "varying vec3 detailP;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ndetailP=normalize(position);",
    );
    shader.fragmentShader =
      noiseGLSL + "\nvarying vec3 detailP;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
   float micro=fbm3(detailP*${gas ? "95." : "160."});diffuseColor.rgb*=.88+.23*micro;`,
    );
    if (body.id === "earth")
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
   float ocean=smoothstep(1.05,1.4,diffuseColor.b/max(diffuseColor.r,.035));roughnessFactor=mix(.9,.36,ocean);`,
      );
  };
  material.customProgramCacheKey = () =>
    "atlas-surface-detail-" + (gas ? "gas" : "rock");
  return material;
}

export function atmosphereMaterial(color = 0x6bafff, strength = 0.32) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      strength: { value: strength },
    },
    vertexShader: sphereVertex,
    fragmentShader: `varying vec3 viewP;varying vec3 viewN;uniform vec3 color;uniform float strength;
 void main(){float mu=abs(dot(normalize(viewN),normalize(-viewP)));float rim=pow(1.-mu,3.2);gl_FragColor=vec4(color,rim*strength);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

export function cloudShell(radius) {
  const m = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0.29 } },
    vertexShader: sphereVertex,
    fragmentShader: `${noiseGLSL}
 varying vec3 localP;varying vec3 viewP;varying vec3 viewN;uniform float opacity;
 void main(){vec3 p=normalize(localP);float n=fbm3(p*14.+vec3(fbm3(p*9.)*1.4));float cloud=smoothstep(.54,.67,n)*(.65+.35*noise3(p*90.));
 float lit=.24+.76*max(0.,dot(p,normalize(vec3(1.,1.6,1.2))));gl_FragColor=vec4(vec3(.91,.96,1.)*lit,cloud*opacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), m);
}

export function plasmaShell(color = 0x69c5df, opacity = 0.3) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: opacity },
      time: { value: 0 },
      slice: { value: 0 },
    },
    vertexShader: `${noiseGLSL}
 varying vec3 localP;varying vec3 viewP;varying vec3 viewN;
 void main(){vec3 p=position*(.945+.11*fbm3(normalize(position)*9.));localP=p;vec4 v=modelViewMatrix*vec4(p,1.);viewP=v.xyz;viewN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*v;}`,
    fragmentShader: `${noiseGLSL}
 varying vec3 localP;varying vec3 viewP;varying vec3 viewN;uniform vec3 color;uniform float opacity;uniform float time;uniform float slice;
 void main(){if(slice>.5&&localP.x>0.&&localP.z>0.)discard;vec3 p=normalize(localP);float n=fbm3(p*14.+vec3(time*.02,0,0));float threads=pow(1.-abs(sin(n*39.+fbm3(p*38.)*3.)),7.);
 float rim=pow(1.-abs(dot(normalize(viewN),normalize(-viewP))),2.3);float density=.08+n*.2+threads*.65;
 gl_FragColor=vec4(color*(.55+n*.65+threads*.7),opacity*density*(.09+rim*.91));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function interiorFace(color, inner, outer) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      inner: { value: inner },
      outer: { value: outer },
      selected: { value: 0 },
    },
    vertexShader:
      "varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `${noiseGLSL}
 varying vec3 p;uniform vec3 color;uniform float inner;uniform float outer;uniform float selected;
 void main(){float r=length(p.xy);float bands=.5+.5*sin(r*5.+noise3(p*.3)*3.);float n=fbm3(p*.4);float edge=smoothstep(inner,inner+.35,r)*(1.-smoothstep(outer-.35,outer,r));
 vec3 c=color*(.62+n*.4+bands*.08+selected*.28);c=mix(color*1.15,c,edge);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,
    side: THREE.DoubleSide,
  });
}
