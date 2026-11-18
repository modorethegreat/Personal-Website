import { createSceneProgram } from './scene-program.js';

export const astronomyViews = {
  asteroid: { kind: 2, yaw: .3, pitch: -.22 },
  telescope: { kind: 3, yaw: -.36, pitch: .34 },
};

const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 resolution;
uniform vec2 orbit;
uniform int kind;

float hash(vec3 p) {
  p = fract(p * .3183099 + vec3(.1, .27, .39));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash(i),hash(i+vec3(1.,0.,0.)),f.x),
        mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),f.x), f.y),
    mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),f.x),
        mix(hash(i+vec3(0.,1.,1.)),hash(i+1.0),f.x), f.y), f.z);
}

vec3 rotate(vec3 p) {
  float s = sin(orbit.y), c = cos(orbit.y);
  p.yz = mat2(c,-s,s,c)*p.yz;
  s = sin(orbit.x); c = cos(orbit.x);
  p.xz = mat2(c,-s,s,c)*p.xz;
  return p;
}

float sphere(vec3 o, vec3 d, float radius) {
  float b = dot(o,d), h = b*b - dot(o,o) + radius*radius;
  return h < 0.0 ? -1.0 : -b-sqrt(h);
}

float box(vec3 p, vec3 size) {
  vec3 q = abs(p)-size;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float tube(vec3 p, float radius, float halfHeight) {
  vec2 a = abs(vec2(length(p.xy),p.z))-vec2(radius,halfHeight);
  return length(max(a,0.0)) + min(max(a.x,a.y),0.0);
}

vec2 telescope(vec3 p) {
  float body = tube(p,.29,.62);
  float shield = max(tube(p-vec3(0.,0.,.47),.363,.47),
                   -tube(p-vec3(0.,0.,.67),.301,.34));
  float pipe = min(body,shield);
  float solar = box(vec3(abs(p.x)-.91, p.y+.09, p.z+.18),vec3(.44,.026,.36));
  float boom = box(vec3(abs(p.x)-.44,p.y+.09,p.z+.16),vec3(.34,.042,.041));
  float mirror = tube(p-vec3(0.,0.,.43),.285,.039);
  vec2 result = pipe < boom ? vec2(pipe,1.0) : vec2(boom,1.0);
  if (solar < result.x) result = vec2(solar,2.0);
  if (mirror < result.x) result = vec2(mirror,3.0);
  return result;
}

vec2 scene(vec3 p) {
  if (kind == 3) return telescope(p);
  float raw = length(p*vec3(.90,1.05,1.24))-.86;
  float surface = (noise(p*3.25)-.5)*.24 + (noise(p*9.3)-.5)*.08;
  return vec2((raw+surface)*.72,0.0);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(.013,0.);
  return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,
                        scene(p+e.yxy).x-scene(p-e.yxy).x,
                        scene(p+e.yyx).x-scene(p-e.yyx).x));
}

vec3 bodyColor(vec3 p, float material, vec3 n, vec3 light) {
  float sun = clamp(dot(n,light),0.0,1.0);
  float grain = noise(p*58.0), fractures = noise(p*13.0);
  vec3 albedo = mix(vec3(.26,.27,.31),vec3(.75,.59,.46),fractures);
  if (material == 1.0) {
    float grainMetal = .76 + .23*sin(p.z*74.0)*sin(p.z*74.0);
    albedo = mix(vec3(.69,.49,.32),vec3(.91,.92,.91),smoothstep(-.37,.15,p.z))*grainMetal;
  }
  if (material == 2.0) {
    vec2 cell = abs(fract(vec2(p.x,p.z)*14.0)-.5);
    float seam = smoothstep(.432,.48,max(cell.x,cell.y));
    float chroma = hash(vec3(floor(vec2(p.x,p.z)*14.0),2.0));
    albedo = mix(mix(vec3(.16,.24,.47),vec3(.31,.56,.80),chroma),vec3(.64,.72,.81),seam);
  }
  if (material == 3.0) albedo = vec3(.35,.61,.68);
  return albedo*(.18+.94*pow(sun,.72)) * (.91+.13*grain);
}

vec3 sky(vec2 uv) {
  float haze = exp(-dot(uv,uv)*.65) * (.6 + .4*noise(vec3(uv*2.8,6.0)));
  vec3 color = vec3(.035,.052,.085) + vec3(.052,.065,.089)*haze;
  vec2 pixel = uv * 36.0;
  vec2 cell = floor(pixel);
  float star = hash(vec3(cell,1.0));
  vec2 center = vec2(hash(vec3(cell,17.0)),hash(vec3(cell,29.0)));
  vec2 d = fract(pixel) - center;
  color += smoothstep(.965,.999,star) * exp(-335.0*dot(d,d)) * vec3(.45,.63,.86);
  return color;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - resolution * .5) * (3.25/min(resolution.x,resolution.y));
  vec3 color = sky(uv);
  vec3 o = rotate(vec3(uv,4.2));
  vec3 d = rotate(vec3(0.,0.,-1.));
  vec3 sun = rotate(vec3(-.565,.502,.653));
  float t = sphere(o,d,1.48);
  if (t > 0.0) {
    for (int i = 0; i < 58; ++i) {
      vec3 p = o+d*t;
      vec2 distance = scene(p);
      if (distance.x < .004) {
        color = bodyColor(p,distance.y,normalAt(p),sun);
        break;
      }
      t += distance.x;
      if (t > 5.8) break;
    }
  }
  color *= 1.0 - min(.26,.0625*dot(uv,uv));
  gl_FragColor = vec4(color,1.0);
}
`;

export function createAstronomyScene(canvas, kind) {
  const { gl, uniforms } = createSceneProgram(canvas, fragment, ['resolution', 'orbit', 'kind']);
  gl.uniform1i(uniforms.kind, kind);
  return ({ yaw, pitch }) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform2f(uniforms.orbit, yaw, pitch);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
