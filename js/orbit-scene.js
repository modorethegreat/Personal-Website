import { createSceneProgram } from './scene-program.js';

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 resolution;
uniform vec3 camera;
uniform float fit;
uniform float time;
uniform float tilt;

const vec3 sun = vec3(-.756, .440, .484);
const float noHit = 50.0;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float starLayer(vec2 p, float density, float rarity) {
  vec2 cell = floor(p * density);
  vec2 center = vec2(hash(cell + 4.0), hash(cell + 16.0)) * .66 + .17;
  float brightness = hash(cell);
  float d = length(fract(p * density) - center);
  return step(rarity, brightness) * brightness * exp(-d * d * 470.0);
}

vec3 sky(vec2 p) {
  float cloud = noise(p * 1.7 + 7.0) * .66 + noise(p * 4.1) * .34;
  float cloudBand = (p.y + .23 * p.x) * 1.53;
  float nebula = exp(-cloudBand * cloudBand) * cloud;
  vec3 dark = vec3(.034, .040, .063) + vec3(.077, .057, .091) * nebula;
  float faint = starLayer(p + .015 * camera.xy, 43.0, .69);
  float bright = starLayer(p + .028 * camera.xy + 7.0, 16.0, .976);
  return dark + faint * vec3(.21, .26, .36) + bright * vec3(.77, .65, .47);
}

float sphere(vec3 origin, vec3 ray, float radius) {
  float b = dot(origin, ray);
  float c = dot(origin, origin) - radius * radius;
  float h = b * b - c;
  if (h < 0.0) return noHit;
  return -b - sqrt(h);
}

float ringOpacity(float radius) {
  float inner = smoothstep(1.26, 1.32, radius);
  float outer = 1.0 - smoothstep(2.27, 2.41, radius);
  float division = 1.0 - .92 * (smoothstep(1.91, 1.939, radius) - smoothstep(1.977, 2.002, radius));
  float wisps = noise(vec2(radius * 215.0, 4.0));
  float bands = .65 + .19 * sin(radius * 77.0) + .11 * sin(radius * 161.0) + .14 * wisps;
  return clamp(inner * outer * division * bands, 0.0, .92);
}

vec3 planet(vec3 point, vec3 ray) {
  vec3 normal = normalize(point);
  float latitude = asin(clamp(normal.y, -1.0, 1.0));
  float longitude = atan(normal.z, normal.x + .0001) + time * .04;
  float turbulence = noise(vec2(longitude * 5.0, latitude * 24.0));
  float ribbons = sin(latitude * 32.0 + turbulence * 1.35);
  float streaks = noise(vec2(longitude * 14.0, latitude * 86.0 + ribbons * 2.1));
  float tint = clamp(.46 + ribbons * .24 + streaks * .31 + sin(latitude * 9.0) * .12, 0.0, 1.0);
  vec3 cloud = mix(vec3(.57, .38, .32), vec3(.95, .80, .62), tint);
  cloud = mix(cloud, vec3(.56, .58, .69), smoothstep(.48, 1.43, abs(latitude)) * .7);
  float incidence = dot(normal, sun);
  float day = pow(max(0.0, incidence), .64);
  float twilight = smoothstep(-.19, .16, incidence);
  float limb = pow(1.0 - clamp(dot(normal, -ray), 0.0, 1.0), 3.3);
  float toRings = -point.y / sun.y;
  float shadow = ringOpacity(length((point + sun * toRings).xz)) * step(0.0, toRings);
  vec3 lit = cloud * (.11 + .91 * day * (1.0 - shadow * .72));
  lit = mix(vec3(.019, .026, .052) + cloud * .063, lit, twilight);
  return lit + vec3(.48, .39, .46) * limb * (.12 + .43 * twilight);
}

vec3 rings(vec3 point, float radius, vec3 ray) {
  float grooves = .5 + .5 * sin(radius * 46.0 + sin(radius * 183.0) * .3);
  vec3 ice = mix(vec3(.38, .39, .49), vec3(.88, .73, .54), grooves * .47 + .25);
  float behind = max(0.0, -dot(point, sun));
  float shade = smoothstep(.88, 1.09, length(point + sun * behind));
  float glint = pow(.5 + .5 * dot(ray, sun), 2.0);
  return ice * (.12 + .92 * shade) * (.84 + .27 * glint);
}

void main() {
  vec2 screen = (gl_FragCoord.xy - resolution * .5) / min(resolution.x, resolution.y);
  screen.x -= .009;
  float ca = cos(camera.x), sa = sin(camera.x);
  float ce = cos(camera.y), se = sin(camera.y);
  float cr = cos(tilt), sr = sin(tilt);
  vec3 forwards = vec3(sa * ce, se, ca * ce);
  vec3 right = vec3(ca, 0.0, -sa);
  vec3 up = cross(forwards, right);
  vec2 p = mat2(cr, -sr, sr, cr) * screen * fit / camera.z;
  vec3 origin = forwards * 7.5 + right * p.x + up * p.y;
  vec3 ray = -forwards;
  vec3 color = sky(screen * 4.7);

  float bodyDistance = sphere(origin, ray, 1.0);
  float limbDistance = length(cross(origin, ray));
  float atmosphere = exp(-max(0.0, limbDistance - 1.0) * 67.0);
  color += vec3(.24, .20, .33) * atmosphere * .66;
  if (bodyDistance < noHit) {
    color = planet(origin + ray * bodyDistance, ray);
  }
  float planeDistance = abs(ray.y) > .001 ? -origin.y / ray.y : noHit;
  if (planeDistance > 0.0 && planeDistance < bodyDistance) {
    vec3 onRing = origin + ray * planeDistance;
    float radius = length(onRing.xz);
    if (radius > 1.26 && radius < 2.41) {
      color = mix(color, rings(onRing, radius, ray), ringOpacity(radius));
    }
  }
  color *= 1.0 - min(.48, dot(screen * vec2(.68, 1.0), screen * vec2(.68, 1.0)) * .68);
  gl_FragColor = vec4(color, 1.0);
}
`;

export function createOrbitScene(canvas) {
  const { gl, uniforms } = createSceneProgram(canvas, fragmentSource, ['resolution', 'camera', 'fit', 'time', 'tilt']);
  return (view, time) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform3f(uniforms.camera, view.yaw, view.pitch, view.zoom);
    gl.uniform1f(uniforms.fit, Math.max(3.65, 4.72 * Math.min(1, height / width)));
    gl.uniform1f(uniforms.time, time);
    gl.uniform1f(uniforms.tilt, -.34);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
