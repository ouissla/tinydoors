/* Coral Reef Christmas: an underwater world. Seabed and reef-rock textures, a shader patch
   for caustics / swaying / glowing coral, the coral Christmas tree, sea creatures, and the
   reef scenery (coral gardens, anemones, kelp, fish schools, jellyfish, light rays, bubbles,
   a whale and her calf in the blue haze, and Santa's dolphin sleigh). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, mat } from './houses.js';

const A = window.Advent;
const TAU = Math.PI * 2;
const V3 = THREE.Vector3;
const polar = (r, th) => [r * Math.sin(th), -r * Math.cos(th)];

// One clock for every reef shader (caustics, kelp sway, anemone tentacles).
export const oceanTime = { value: 0 };

function tex(w, h, draw, repeat) {
  const t = canvasTexture(w, h, draw);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat, repeat);
  t.userData.shared = true;
  return t;
}

// ---------------- Surface textures ----------------
export const seabedTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#c8d4c4';
  g.fillRect(0, 0, w, h);
  const r = A.rng(77);
  // Soft sand ripples (they tile: whole waves across the width)
  for (let k = 0; k < 28; k++) {
    const y0 = (k * h) / 28;
    [['rgba(255,247,222,.6)', 0, 2.6], ['rgba(190,150,92,.32)', 3, 1.6]].forEach(([c, dy, lw]) => {
      g.strokeStyle = c;
      g.lineWidth = lw;
      g.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = y0 + dy + Math.sin((x / w) * TAU * 2 + k * 0.9) * 3;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    });
  }
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = ['#b8c6b4', '#e6eee4', '#a9b8a8', '#d6e2d6', '#d8b8b8'][(r() * 5) | 0];
    g.globalAlpha = 0.3 + r() * 0.5;
    g.fillRect(r() * w, r() * h, 1.6, 1.6);
  }
  g.globalAlpha = 1;
}, 1 / 10);

export const reefRockTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#9a72ad';
  g.fillRect(0, 0, w, h);
  const r = A.rng(303);
  for (let i = 0; i < 120; i++) {
    const x = r() * w, y = r() * h, rad = 6 + r() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, ['#c983a8', '#7b5a96', '#e39ab0', '#8d6ac0'][i % 4] + 'cc');
    gr.addColorStop(1, '#9a72ad00');
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // encrusting coralline dots in bright colours
  for (let i = 0; i < 900; i++) {
    g.fillStyle = ['#ffb347', '#ff6f91', '#7cf29a', '#ffe08a', '#5fd4ff'][(r() * 5) | 0];
    g.globalAlpha = 0.35 + r() * 0.4;
    g.beginPath();
    g.arc(r() * w, r() * h, 0.8 + r() * 2.2, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
}, 1 / 8);

// ---------------- Shader patch: caustics, sway, glow ----------------
const CAUSTIC_GLSL = `
float tdCaustic(vec2 w, float t) {
  vec2 p = w * 0.42;
  for (int i = 0; i < 3; i++) p += 0.6 * vec2(sin(p.y * 1.7 + t * 0.8 + float(i)), sin(p.x * 1.4 - t * 0.65 + float(i) * 1.3));
  float m = min(abs(sin(p.x)), abs(sin(p.y)));
  return pow(1.0 - m, 9.0);
}
`;
function patch(m, { glow = 0, sway = null, caustic = 0 } = {}) {
  const key = `reef|${glow}|${sway ? `${sway.amp}:${sway.height}:${sway.speed}` : ''}|${caustic}`;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = oceanTime;
    let v = 'uniform float uTime;\nvarying vec3 vCWorld;\nvarying float vCUp;\n' + sh.vertexShader;
    if (sway) {
      v = v.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        #ifdef USE_INSTANCING
        float ph = instanceMatrix[3][0] * 0.37 + instanceMatrix[3][2] * 0.23 + instanceMatrix[3][1] * 0.5;
        #else
        float ph = modelMatrix[3][0] * 0.37 + modelMatrix[3][2] * 0.23;
        #endif
        float k = clamp(position.y / ${sway.height.toFixed(2)}, 0.0, 1.0);
        k = k * k;
        transformed.x += sin(uTime * ${sway.speed.toFixed(2)} + ph + position.y * 0.6) * k * ${sway.amp.toFixed(3)};
        transformed.z += cos(uTime * ${(sway.speed * 0.8).toFixed(2)} + ph * 1.3 + position.y * 0.45) * k * ${(sway.amp * 0.6).toFixed(3)};
      }`);
    }
    v = v.replace('#include <project_vertex>', `#include <project_vertex>
      {
        vec4 cw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        cw = instanceMatrix * cw;
        #endif
        vCWorld = (modelMatrix * cw).xyz;
        vCUp = (vec4(transformedNormal, 0.0) * viewMatrix).y;
      }`);
    sh.vertexShader = v;
    const glowCode = !glow ? '' : `
      #if defined(USE_COLOR) || defined(USE_INSTANCING_COLOR)
        totalEmissiveRadiance += vColor.rgb * diffuse * ${glow.toFixed(2)};
      #else
        totalEmissiveRadiance += diffuse * ${glow.toFixed(2)};
      #endif`;
    const causticCode = !caustic ? '' : `
      totalEmissiveRadiance += vec3(0.6, 0.95, 1.0) * tdCaustic(vCWorld.xz, uTime) * ${caustic.toFixed(2)} * smoothstep(0.25, 0.9, vCUp);`;
    sh.fragmentShader = 'uniform float uTime;\nvarying vec3 vCWorld;\nvarying float vCUp;\n' + CAUSTIC_GLSL +
      sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${glowCode}${causticCode}`);
  };
  m.customProgramCacheKey = () => key;
  return m;
}
export function addCaustics(material, strength = 0.45) {
  return patch(material, { caustic: strength });
}
function reefMat({ glow = 0, sway = null, caustic = 0, ...o } = {}) {
  return patch(new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0, ...o }), { glow, sway, caustic });
}

// ---------------- Geometry helpers ----------------
function painted(list) {
  return mergeGeometries(list.map(([geo, color]) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const c = new THREE.Color(color);
    const arr = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < arr.length; i += 3) arr.set([c.r, c.g, c.b], i);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    if (g.attributes.uv) g.deleteAttribute('uv');
    return g;
  }));
}
const at = (geo, x, y, z, sx = 1, sy = 1, sz = 1) => { geo.scale(sx, sy, sz); geo.translate(x, y, z); return geo; };
const part = (parent, geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  parent.add(o);
  return o;
};
const pivot = (parent, x = 0, y = 0, z = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };
function starfishShape(r1 = 1, r2 = 0.42) {
  const s = new THREE.Shape();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * TAU + Math.PI / 2;
    const k = Math.pow(Math.abs(Math.cos(a * 2.5 - Math.PI * 1.25)), 3);
    const r = r2 + (r1 - r2) * k;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}
export function starfishGeometry(size = 0.3) {
  const g = new THREE.ExtrudeGeometry(starfishShape(size, size * 0.4), { depth: size * 0.18, bevelEnabled: true, bevelSize: size * 0.08, bevelThickness: size * 0.1, bevelSegments: 2, curveSegments: 4 });
  g.center();
  return g;
}
// Instanced mesh with full transforms and a colour per instance.
function instancedColored(geo, material, items) {
  const mesh = new THREE.InstancedMesh(geo, material, items.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  items.forEach((it, i) => {
    e.set(it.rx || 0, it.rot || 0, it.rz || 0);
    q.setFromEuler(e);
    m4.compose(new V3(it.x, it.y, it.z), it.q || q, new V3(it.sx || it.s, it.sy || it.s, it.sz || it.s));
    mesh.setMatrixAt(i, m4);
    mesh.setColorAt(i, new THREE.Color(it.color));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// A Santa hat sized to sit on a head of radius r.
function santaHat(parent, r, x, y, z, tilt = -0.35) {
  const hat = pivot(parent, x, y, z);
  hat.rotation.x = tilt;
  part(hat, new THREE.TorusGeometry(r * 0.95, r * 0.28, 8, 18), mat('#ffffff', { flatShading: false }), 0, 0, 0).rotation.x = Math.PI / 2;
  const cone = part(hat, new THREE.ConeGeometry(r * 0.95, r * 2.6, 14), mat('#d6282c', { flatShading: false }), 0, r * 1.3, 0);
  cone.rotation.z = -0.25;
  part(hat, new THREE.SphereGeometry(r * 0.34, 10, 8), mat('#ffffff', { flatShading: false }), r * 0.6, r * 2.45, 0);
  return hat;
}

// ---------------- Coral Christmas tree (24 lights) ----------------
export function buildCoralTree(g, rng, { makeStar, glowSprite }) {
  const H = 13.2;
  const rockMat = reefMat({ color: '#ffffff', map: reefRockTex, roughness: 1, caustic: 0.35 });
  const base = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), rockMat);
  base.scale.set(1.5, 0.45, 1.5);
  base.position.y = 0.2;
  g.add(base);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 11.5, 12), reefMat({ color: '#f4b0cc', glow: 0.12, flatShading: false }));
  stalk.position.y = 5.8;
  g.add(stalk);
  const n = 6;
  const greens = ['#16c79a', '#2fe0b8', '#11b08c', '#3fe8c4', '#19bd98', '#62f2d2'];
  const tier = (i) => { const k = i / (n - 1); return { r: 5.0 * (1 - k * 0.8) + 0.25, y: 2.1 + i * 1.78 }; };
  const ruffle = (a, i) => Math.sin(a * 9 + i * 1.7) * 0.2;
  for (let i = 0; i < n; i++) {
    const { r, y } = tier(i);
    // Lettuce coral: a drooping skirt with a ruffled rim
    const profile = [[0, 0.75], [r * 0.25, 0.62], [r * 0.6, 0.2], [r * 0.9, -0.28], [r, -0.45]].map(([x, yy]) => new THREE.Vector2(x, yy));
    const geo = new THREE.LatheGeometry(profile, 72);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), z = p.getZ(k), rho = Math.hypot(x, z) / r;
      p.setY(k, p.getY(k) + ruffle(Math.atan2(x, z), i) * rho * rho);
    }
    geo.computeVertexNormals();
    const skirt = new THREE.Mesh(geo, reefMat({ color: greens[i], glow: 0.22, roughness: 0.55, side: THREE.DoubleSide, flatShading: false }));
    skirt.position.y = y;
    skirt.castShadow = true;
    g.add(skirt);
    // Shiny baubles: little sea urchins and shells hanging from each tier
    const count = Math.max(4, Math.round(r * 1.6));
    for (let j = 0; j < count; j++) {
      const a = (j / count) * TAU + i * 0.6 + 0.2;
      const col = ['#ff4f81', '#ffd23f', '#c77dff', '#ff8a2b', '#5fd4ff'][(i + j) % 5];
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), mat(col, { roughness: 0.25, metalness: 0.35, emissive: col, emissiveIntensity: 0.35, flatShading: false }));
      const rr = r * 0.7;
      b.position.set(Math.sin(a) * rr, y - 0.15 - rr * 0.12, Math.cos(a) * rr);
      g.add(b);
    }
  }
  // A pearl garland spiralling up the tree
  const pearls = [];
  for (let k = 0; k < 150; k++) {
    const f = k / 150, a = f * TAU * 4.5;
    const rr = 4.6 * (1 - f * 0.82) + 0.3;
    pearls.push({ x: Math.sin(a) * rr, y: 1.9 + f * 9.4, z: Math.cos(a) * rr, s: 1, color: '#ffffff' });
  }
  g.add(instancedColored(new THREE.SphereGeometry(0.09, 8, 6), mat('#fff8f0', { roughness: 0.15, metalness: 0.4, emissive: '#fff3e0', emissiveIntensity: 0.3, flatShading: false }), pearls));
  // A starfish on top
  const star = makeStar('#ffb347', 1.15);
  star.position.y = H + 0.3;
  g.add(star);
  const halo = glowSprite('#ffd38a', 7, 0.55);
  halo.position.y = H + 0.3;
  g.add(halo);
  return {
    H, star,
    surface: (f, a) => {
      const i = Math.min(n - 1, Math.floor(f * n));
      const { r, y } = tier(i);
      const rr = r * 0.93;
      return new V3(Math.sin(a) * rr, y - 0.4 + ruffle(a, i) * 0.86, Math.cos(a) * rr);
    },
  };
}

// ---------------- Sea creatures ----------------
// All face +z. Each has a tick(s, dt) the character animator calls.
export function makeTurtle() {
  const root = new THREE.Group();
  const body = pivot(root);
  const shellTex = canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#5a8a3a';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e9d27a';
    g.lineWidth = 5;
    for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) {
      const cx = (x + (y % 2) * 0.5) * (w / 6), cy = 20 + y * 40;
      g.fillStyle = ['#6f9e44', '#4f7f33', '#86a84c'][(x + y) % 3];
      g.beginPath();
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; g.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 17); }
      g.closePath(); g.fill(); g.stroke();
    }
  });
  const shell = part(body, new THREE.SphereGeometry(0.6, 24, 14, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: shellTex, roughness: 0.6 }), 0, 0, 0, 1, 0.45, 1.25);
  shell.castShadow = true;
  part(body, new THREE.CylinderGeometry(0.6, 0.55, 0.08, 24), mat('#e9d27a', { flatShading: false }), 0, 0, 0, 1, 1, 1.25);
  const skin = mat('#8fb86a', { flatShading: false });
  const head = pivot(body, 0, 0.05, 0.82);
  part(head, new THREE.SphereGeometry(0.2, 14, 10), skin, 0, 0, 0.08, 1, 0.85, 1.25);
  [-1, 1].forEach((s) => part(head, new THREE.SphereGeometry(0.035, 8, 6), mat('#1d2233'), s * 0.12, 0.05, 0.2));
  santaHat(head, 0.13, 0, 0.16, 0.02, -0.5);
  const flippers = [];
  [[-1, 0.42, 0.62, 0.36], [1, 0.42, 0.62, 0.36], [-1, -0.5, 0.3, 0.2], [1, -0.5, 0.3, 0.2]].forEach(([s, z, len, wd], i) => {
    const p = pivot(body, s * 0.5, -0.02, z);
    const f = part(p, new THREE.SphereGeometry(0.5, 12, 8), skin, s * len * 0.5, 0, -0.05, len, 0.06, wd);
    f.rotation.y = s * -0.4;
    flippers.push(p);
  });
  root.scale.setScalar(1.6);
  return {
    kind: 'turtle', root, body, noBank: true,
    tick(s) {
      const k = Math.sin(s.t * 1.8 + s.seed);
      flippers.forEach((p, i) => {
        const side = i % 2 ? 1 : -1;
        p.rotation.z = side * (i < 2 ? k * 0.55 : k * 0.25);
        p.rotation.y = side * (i < 2 ? Math.cos(s.t * 1.8 + s.seed) * 0.3 : 0);
      });
      head.rotation.y = Math.sin(s.t * 0.6 + s.seed) * 0.25;
      body.rotation.x = Math.sin(s.t * 1.8 + s.seed) * 0.05;
    },
  };
}

export function makeManta() {
  const root = new THREE.Group();
  const body = pivot(root);
  const top = mat('#243a5e', { flatShading: false }), belly = mat('#e8f1f6', { flatShading: false });
  part(body, new THREE.SphereGeometry(0.55, 18, 10), top, 0, 0, 0, 1, 0.22, 1.1);
  const wings = [-1, 1].map((s) => {
    const p = pivot(body, s * 0.35, 0, 0);
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.45); sh.quadraticCurveTo(1.0, 0.25, 1.7, -0.15); sh.quadraticCurveTo(0.9, -0.2, 0, -0.55); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    geo.rotateX(Math.PI / 2);
    if (s < 0) geo.scale(-1, 1, 1);
    const w = new THREE.Mesh(geo, [top, belly]);
    w.castShadow = true;
    p.add(w);
    return p;
  });
  [-1, 1].forEach((s) => {
    const horn = part(body, new THREE.CapsuleGeometry(0.06, 0.3, 3, 8), top, s * 0.28, 0, 0.62);
    horn.rotation.x = Math.PI / 2;
    horn.rotation.z = s * 0.3;
  });
  const tail = part(body, new THREE.CylinderGeometry(0.02, 0.05, 1.6, 6), top, 0, 0, -1.3);
  tail.rotation.x = Math.PI / 2;
  root.scale.setScalar(1.7);
  return {
    kind: 'ray', root, body, noBank: true,
    tick(s) {
      const k = Math.sin(s.t * 1.3 + s.seed);
      wings.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * k * 0.45; });
      body.position.y = -k * 0.12;
    },
  };
}

function makeDolphin() {
  const g = new THREE.Group();
  const prof = [[0, -1], [0.06, -0.92], [0.12, -0.7], [0.22, -0.35], [0.27, 0], [0.25, 0.3], [0.18, 0.55], [0.1, 0.72], [0.06, 0.95], [0, 1]].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(prof, 20);
  geo.rotateX(Math.PI / 2);
  const cols = new Float32Array(geo.attributes.position.count * 3);
  geo.computeVertexNormals();
  const n = geo.attributes.normal, top = new THREE.Color('#5d86a8'), bel = new THREE.Color('#e6eef4'), c = new THREE.Color();
  for (let i = 0; i < n.count; i++) { c.copy(bel).lerp(top, THREE.MathUtils.smoothstep(n.getY(i), -0.35, 0.25)); cols.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 });
  const body = new THREE.Mesh(geo, m);
  body.scale.set(1, 1.05, 1);
  g.add(body);
  const fin = mat('#5d86a8', { flatShading: false });
  const dorsal = part(g, new THREE.ConeGeometry(0.12, 0.38, 8), fin, 0, 0.3, -0.05);
  dorsal.rotation.x = -0.5;
  dorsal.scale.z = 0.35;
  [-1, 1].forEach((s) => { const f = part(g, new THREE.SphereGeometry(0.2, 8, 6), fin, s * 0.25, -0.1, 0.3, 1, 0.12, 0.55); f.rotation.z = s * 0.5; });
  const tail = pivot(g, 0, 0, -0.95);
  part(tail, new THREE.SphereGeometry(0.3, 10, 6), fin, 0, 0, -0.1, 1.2, 0.08, 0.5);
  [-1, 1].forEach((s) => part(g, new THREE.SphereGeometry(0.03, 6, 4), mat('#1d2233'), s * 0.13, 0.06, 0.7));
  g.userData.tail = tail;
  return g;
}

function makeSeahorse(color) {
  const g = new THREE.Group();
  const m = mat(color, { flatShading: false, roughness: 0.5, emissive: color, emissiveIntensity: 0.2 });
  const curve = new THREE.CatmullRomCurve3([
    new V3(0, 1.0, 0.05), new V3(0, 0.75, 0.12), new V3(0, 0.45, 0.1), new V3(0, 0.15, 0), new V3(0, -0.1, -0.05),
    new V3(0, -0.28, 0.05), new V3(0, -0.32, 0.18), new V3(0, -0.22, 0.24), new V3(0, -0.14, 0.16),
  ]);
  for (let i = 0; i <= 26; i++) {
    const f = i / 26, p = curve.getPoint(f);
    const r = 0.03 + Math.sin(Math.min(1, f * 1.6) * Math.PI) * 0.15 * (1 - f * 0.55);
    part(g, new THREE.SphereGeometry(r, 10, 8), m, p.x, p.y, p.z);
  }
  part(g, new THREE.SphereGeometry(0.13, 12, 10), m, 0, 1.08, 0.1);
  const snout = part(g, new THREE.CylinderGeometry(0.03, 0.045, 0.28, 8), m, 0, 1.03, 0.3);
  snout.rotation.x = Math.PI / 2 + 0.3;
  [-1, 1].forEach((s) => part(g, new THREE.SphereGeometry(0.03, 6, 4), mat('#1d2233'), s * 0.09, 1.1, 0.17));
  const fin = part(g, new THREE.CircleGeometry(0.14, 10, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: '#fff3c4', transparent: true, opacity: 0.75, side: THREE.DoubleSide }), 0, 0.45, -0.1);
  fin.rotation.y = Math.PI / 2;
  santaHat(g, 0.09, 0, 1.2, 0.05, -0.6);
  g.userData.fin = fin;
  g.scale.setScalar(1.8);
  return g;
}

function makeWhale(scale = 12) {
  const g = new THREE.Group();
  const body = pivot(g);
  const prof = [[0, -1], [0.07, -0.96], [0.1, -0.88], [0.15, -0.7], [0.27, -0.42], [0.39, -0.12], [0.44, 0.15], [0.43, 0.4], [0.38, 0.6], [0.31, 0.78], [0.2, 0.92], [0.08, 0.99], [0, 1]].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(prof, 40);
  geo.rotateX(Math.PI / 2);
  geo.scale(1, 0.82, 1);
  geo.computeVertexNormals();
  const pos = geo.attributes.position, nrm = geo.attributes.normal;
  const cols = new Float32Array(pos.count * 3);
  const top = new THREE.Color('#2d4c70'), bel = new THREE.Color('#d6e4ec'), groove = new THREE.Color('#9fb6c6'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(bel).lerp(top, THREE.MathUtils.smoothstep(nrm.getY(i), -0.4, 0.15));
    if (nrm.getY(i) < -0.35 && pos.getZ(i) > 0.15 && Math.sin(pos.getX(i) * 60) > 0.4) c.lerp(groove, 0.7);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  body.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, flatShading: false })));
  const finMat = mat('#c9d8e2', { flatShading: false }), dark = mat('#2d4c70', { flatShading: false });
  // Long humpback flippers
  const flippers = [-1, 1].map((s) => {
    const p = pivot(body, s * 0.36, -0.18, 0.3);
    const f = part(p, new THREE.CapsuleGeometry(0.07, 0.6, 4, 10), finMat, s * 0.32, -0.04, -0.12, 1, 1, 0.3);
    f.rotation.z = s * Math.PI / 2;
    f.rotation.y = s * 0.45;
    return p;
  });
  const dorsal = part(body, new THREE.ConeGeometry(0.06, 0.16, 8), dark, 0, 0.3, -0.45);
  dorsal.rotation.x = -0.7;
  // Tail flukes on a hinge
  const tail = pivot(body, 0, 0, -0.95);
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.04); sh.quadraticCurveTo(0.25, -0.02, 0.52, -0.2); sh.quadraticCurveTo(0.42, -0.28, 0.3, -0.24); sh.quadraticCurveTo(0.12, -0.2, 0, -0.26);
  sh.quadraticCurveTo(-0.12, -0.2, -0.3, -0.24); sh.quadraticCurveTo(-0.42, -0.28, -0.52, -0.2); sh.quadraticCurveTo(-0.25, -0.02, 0, 0.04);
  const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
  fg.rotateX(Math.PI / 2);
  part(tail, fg, dark, 0, 0, 0);
  [-1, 1].forEach((s) => part(body, new THREE.SphereGeometry(0.022, 8, 6), mat('#0e1a2a'), s * 0.3, -0.06, 0.62));
  // A big Santa hat, of course
  santaHat(body, 0.1, 0, 0.3, 0.6, -0.9);
  g.scale.setScalar(scale);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; } });
  return { group: g, body, tail, flippers };
}

function makeJelly(color, rng) {
  const g = new THREE.Group();
  const bellGeo = new THREE.SphereGeometry(0.7, 24, 12, 0, TAU, 0, Math.PI * 0.55);
  const bell = new THREE.Mesh(bellGeo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, roughness: 0.2 }));
  bell.scale.y = 0.8;
  g.add(bell);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.8), transparent: true, opacity: 0.8, toneMapped: false }));
  inner.position.y = 0.15;
  inner.scale.y = 0.6;
  g.add(inner);
  const tentacles = [];
  const tm = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.4), transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU, r = k < 4 ? 0.15 : 0.55;
    const len = k < 4 ? 1.6 + rng() * 0.6 : 2.2 + rng() * 1.4;
    const pts = Array.from({ length: 8 }, (_, i) => new V3(Math.sin(i * 0.9 + k) * 0.12, -i * (len / 7), Math.cos(i * 0.8 + k) * 0.12));
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, k < 4 ? 0.06 : 0.02, 5, false), tm);
    const holder = pivot(g, Math.sin(a) * r, 0.02, Math.cos(a) * r);
    holder.add(t);
    tentacles.push(holder);
  }
  return { group: g, bell, inner, tentacles };
}

function fishGeometry() {
  return painted([
    [at(new THREE.SphereGeometry(0.5, 12, 8), 0, 0, 0, 0.3, 0.55, 1), '#ffffff'],
    [(() => { const c = new THREE.ConeGeometry(0.34, 0.5, 4); c.rotateX(Math.PI / 2); return at(c, 0, 0, -0.62, 0.25, 1, 1); })(), '#e8e8e8'],
    [(() => { const c = new THREE.ConeGeometry(0.16, 0.35, 4); return at(c, 0, 0.3, -0.05, 0.2, 1, 1.5); })(), '#f0f0f0'],
    [at(new THREE.SphereGeometry(0.06, 6, 4), 0.13, 0.08, 0.3), '#151a26'],
    [at(new THREE.SphereGeometry(0.06, 6, 4), -0.13, 0.08, 0.3), '#151a26'],
  ]);
}
function clownfishGeometry() {
  return painted([
    [at(new THREE.SphereGeometry(0.5, 14, 10), 0, 0, 0, 0.32, 0.45, 1), '#ff7a1a'],
    [at(new THREE.TorusGeometry(0.21, 0.045, 6, 16), 0, 0, 0.28, 0.72, 1, 1), '#ffffff'],
    [at(new THREE.TorusGeometry(0.235, 0.045, 6, 16), 0, 0, -0.08, 0.68, 1, 1), '#ffffff'],
    [(() => { const c = new THREE.ConeGeometry(0.3, 0.42, 6); c.rotateX(Math.PI / 2); return at(c, 0, 0, -0.6, 0.25, 1, 1); })(), '#ff7a1a'],
    [at(new THREE.SphereGeometry(0.06, 6, 4), 0.13, 0.06, 0.32), '#151a26'],
    [at(new THREE.SphereGeometry(0.06, 6, 4), -0.13, 0.06, 0.32), '#151a26'],
  ]);
}

function branchCoral(rng) {
  const parts = [];
  const grow = (start, dir, len, rad, d) => {
    const end = start.clone().addScaledVector(dir, len);
    const mid = start.clone().lerp(end, 0.5).add(new V3((rng() - 0.5) * 0.2 * len, 0, (rng() - 0.5) * 0.2 * len));
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 4, rad, 6, false));
    const tip = new THREE.SphereGeometry(rad * 1.05, 6, 5);
    tip.translate(end.x, end.y, end.z);
    parts.push(tip);
    if (!d) return;
    const n = 2 + (rng() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const nd = dir.clone().add(new V3((rng() - 0.5) * 1.3, 0.35 + rng() * 0.35, (rng() - 0.5) * 1.3)).normalize();
      grow(end, nd, len * 0.74, rad * 0.74, d - 1);
    }
  };
  grow(new V3(0, 0, 0), new V3(0, 1, 0), 0.8, 0.13, 3);
  const geo = mergeGeometries(parts.map((p) => { p.deleteAttribute('uv'); return p; }));
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const k = 0.7 + 0.3 * Math.min(1, pos.getY(i) / 2.2); cols.set([k, k, k], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return geo;
}
function brainCoral() {
  const geo = new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2);
  const p = geo.attributes.position, cols = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const s = Math.sin(x * 13 + Math.sin(z * 9) * 2.2) * Math.cos(z * 12 + Math.sin(x * 8) * 2.2);
    const k = 1 + 0.045 * s;
    p.setXYZ(i, x * k, y * k, z * k);
    const c = 0.72 + 0.28 * (s * 0.5 + 0.5);
    cols.set([c, c, c], i * 3);
  }
  geo.deleteAttribute('uv');
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  geo.scale(1, 0.72, 1);
  return geo;
}
function tubeSponge(rng) {
  const parts = [];
  const n = 3 + ((rng() * 3) | 0);
  for (let k = 0; k < n; k++) {
    const h = 0.8 + rng() * 1.2, r = 0.16 + rng() * 0.1, a = (k / n) * TAU;
    const c = new THREE.CylinderGeometry(r, r * 0.8, h, 10, 1, true);
    c.translate(Math.sin(a) * 0.28, h / 2, Math.cos(a) * 0.28);
    const rim = new THREE.TorusGeometry(r, 0.035, 5, 12);
    rim.rotateX(Math.PI / 2);
    rim.translate(Math.sin(a) * 0.28, h, Math.cos(a) * 0.28);
    parts.push(c, rim);
  }
  const geo = mergeGeometries(parts.map((p) => { p.deleteAttribute('uv'); return p; }));
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const k = 0.65 + 0.35 * Math.min(1, pos.getY(i) / 1.6); cols.set([k, k, k], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return geo;
}
const fanTex = canvasTexture(256, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#ffffff';
  g.lineCap = 'round';
  const r = A.rng(55);
  const branch = (x, y, a, len, lw, d) => {
    const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len;
    g.lineWidth = lw;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (d <= 0) return;
    branch(x2, y2, a - 0.32 - r() * 0.2, len * 0.8, lw * 0.75, d - 1);
    branch(x2, y2, a + 0.32 + r() * 0.2, len * 0.8, lw * 0.75, d - 1);
  };
  branch(w / 2, h, 0, 46, 9, 6);
  // the fine mesh between the branches
  g.globalAlpha = 0.55;
  g.lineWidth = 1.4;
  for (let k = 0; k < 26; k++) {
    g.beginPath();
    g.arc(w / 2, h, 30 + k * 8, Math.PI * 1.12, Math.PI * 1.88);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'destination-in';
  const gr = g.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.98);
  gr.addColorStop(0.85, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
fanTex.userData.shared = true;
const kelpTex = canvasTexture(64, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    const f = y / h;
    const half = (w / 2 - 4) * (0.55 + 0.45 * Math.sin(f * Math.PI * 9) ** 2) * (0.35 + 0.65 * Math.min(1, (1 - f) * 4));
    const gr = g.createLinearGradient(w / 2 - half, 0, w / 2 + half, 0);
    gr.addColorStop(0, '#c7e07a'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#c7e07a');
    g.fillStyle = gr;
    g.fillRect(w / 2 - half, y, half * 2, 2);
  }
  g.fillStyle = '#d9c070';
  g.fillRect(w / 2 - 2, 0, 4, h);
});
kelpTex.userData.shared = true;
const bubbleTex = canvasTexture(64, 64, (g, w) => {
  g.clearRect(0, 0, w, w);
  const gr = g.createRadialGradient(w / 2, w / 2, w * 0.3, w / 2, w / 2, w * 0.48);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(w / 2, w / 2, w * 0.48, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath(); g.arc(w * 0.36, w * 0.34, w * 0.09, 0, TAU); g.fill();
});
bubbleTex.userData.shared = true;
const rayTex = canvasTexture(64, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  const hz = g.createLinearGradient(0, 0, w, 0);
  hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.5, '#000'); hz.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hz; g.fillRect(0, 0, w, h);
});
rayTex.userData.shared = true;

// A soft whale call for when someone taps her.
function whaleSong() {
  const S = A.Sound;
  if (!S) return;
  S.init();
  if (!S.ok()) return;
  const c = S.ctx, t = c.currentTime + 0.02;
  [[1, 0.2], [1.5, 0.07]].forEach(([mul, vol]) => {
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(170 * mul, t);
    o.frequency.exponentialRampToValueAtTime(330 * mul, t + 0.9);
    o.frequency.exponentialRampToValueAtTime(150 * mul, t + 2.1);
    lfo.frequency.value = 5; lg.gain.value = 6 * mul;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.35);
    g.gain.linearRampToValueAtTime(vol * 0.7, t + 1.5);
    g.gain.linearRampToValueAtTime(0, t + 2.2);
    o.connect(g).connect(S.master);
    o.start(t); lfo.start(t);
    o.stop(t + 2.3); lfo.stop(t + 2.3);
  });
}

// ---------------- Reef scenery ----------------
export function buildOceanScenery(c, { fx, sides, ring }) {
  const { root, L, rng, updaters, avoid, glowSprite } = c;
  const lite = A.forceLite || matchMedia('(pointer: coarse)').matches;
  const front = -(L.frontR - 4.3);
  updaters.push((t) => { oceanTime.value = t; });
  const sound = () => fx.sound();
  const burstAt = (obj, y, colors, n = 18) => { if (!A.reducedMotion) fx.burst(obj.localToWorld(new V3(0, y, 0)), colors, n, 3, 0.32, -0.35); };

  // ---- Coral gardens around the village ----
  const VIVID = ['#ff5e7a', '#ff9ec4', '#ffd23f', '#b46cff', '#4fd1ff', '#7cf29a', '#ff8a2b', '#ff4fd8'];
  const coralSpots = (n, minR, out) => sides(n, minR, out).map((p) => ({ ...p, rot: rng() * TAU, color: VIVID[(rng() * VIVID.length) | 0] }));
  const coralMat = reefMat({ vertexColors: true, glow: 0.28, roughness: 0.6, flatShading: false, caustic: 0.25 });
  for (let v = 0; v < 3; v++) {
    root.add(instancedColored(branchCoral(A.rng(100 + v)), coralMat, coralSpots(lite ? 16 : 28, 1.2, 0.1).map((p) => ({ ...p, s: 0.9 + rng() * 1.2 }))));
  }
  root.add(instancedColored(brainCoral(), reefMat({ vertexColors: true, glow: 0.18, roughness: 0.8, flatShading: false, caustic: 0.4 }),
    coralSpots(lite ? 20 : 34, 1.0, 0.08).map((p) => ({ ...p, y: p.y - 0.1, s: 0.5 + rng() * 0.9, color: ['#9ae66e', '#ffb347', '#e0709a', '#c9a0ff', '#6ee6d0'][(rng() * 5) | 0] }))));
  root.add(instancedColored(tubeSponge(A.rng(9)), reefMat({ vertexColors: true, glow: 0.3, roughness: 0.8, side: THREE.DoubleSide, flatShading: false }),
    coralSpots(lite ? 12 : 22, 1.5, 0.12).map((p) => ({ ...p, s: 0.8 + rng() * 0.9, color: ['#ff5ec8', '#ffa33f', '#7d6bff', '#ff4f6d'][(rng() * 4) | 0] }))));
  // Sea fans, swaying a little
  const fanGeo = new THREE.PlaneGeometry(2.4, 2.4, 6, 6);
  fanGeo.translate(0, 1.2, 0);
  root.add(instancedColored(fanGeo, reefMat({ map: fanTex, alphaTest: 0.35, side: THREE.DoubleSide, glow: 0.35, roughness: 0.8, sway: { amp: 0.18, height: 2.4, speed: 1.3 } }),
    coralSpots(lite ? 10 : 18, 2, 0.2).map((p) => ({ ...p, s: 0.9 + rng() * 1.1, color: ['#ff4f6d', '#c77dff', '#ffb347', '#ff7ad9'][(rng() * 4) | 0] }))));
  // Reef boulders and two rock arches at the sides
  const rockMat = reefMat({ color: '#ffffff', map: reefRockTex, roughness: 1, caustic: 0.4 });
  const rocks = sides(lite ? 14 : 24, 3, 0.3).map((p) => ({ ...p, y: p.y - 0.4, rot: rng() * TAU, s: 1.2 + rng() * 2.2, sy: 0.6 + rng() * 0.6, color: '#ffffff' }));
  root.add(instancedColored(new THREE.DodecahedronGeometry(1, 1), rockMat, rocks.map((r) => ({ ...r, sy: r.s * r.sy }))));
  [-1, 1].forEach((side) => {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(4.2, 1.25, 10, 22, Math.PI), rockMat);
    const th = side * (L.spread + 0.55), [x, z] = polar(L.R0 + 5, th);
    arch.position.set(x, c.groundAt(x, z) - 0.5, z);
    arch.rotation.y = -th + Math.PI / 2;
    arch.castShadow = arch.receiveShadow = true;
    root.add(arch);
  });

  // ---- Kelp forest at the sides and behind ----
  const kelpGeo = (() => {
    const a = new THREE.PlaneGeometry(0.9, 12, 1, 18); a.translate(0, 6, 0);
    const b = a.clone(); b.rotateY(Math.PI / 2);
    return mergeGeometries([a, b]);
  })();
  const kelpItems = [];
  for (let k = 0; k < (lite ? 40 : 75); k++) {
    const back = rng() < 0.4;
    const th = back ? (rng() - 0.5) * 2 * (L.spread + 0.6) : (rng() < 0.5 ? -1 : 1) * (L.spread + 0.45 + rng() * 0.8);
    const R = back ? L.backR + 12 + rng() * 30 : L.frontR + 2 + rng() * (L.backR - L.frontR + 24);
    const [x, z] = polar(R, th);
    if (avoid(x, z)) continue;
    const s = 0.7 + rng() * 0.6;
    kelpItems.push({ x, y: back ? L.topY : c.groundAt(x, z) - 0.2, z, rot: rng() * TAU, s, sy: s * (0.8 + rng() * 0.9), color: ['#7fbf3f', '#a6c94a', '#5fa83a', '#c2b84a'][(rng() * 4) | 0] });
  }
  const kelp = instancedColored(kelpGeo, reefMat({ map: kelpTex, alphaTest: 0.4, side: THREE.DoubleSide, glow: 0.12, roughness: 0.85, sway: { amp: 1.6, height: 12, speed: 0.8 } }), kelpItems);
  kelp.castShadow = false;
  root.add(kelp);

  // ---- Starfish dotted over the sand ----
  const stars = [];
  for (let k = 0; k < (lite ? 24 : 44); k++) {
    const th = (rng() - 0.5) * 2 * (L.spread + 0.5), R = L.frontR - 1 - rng() * 9;
    const [x, z] = polar(R, th);
    if (Math.abs(x) < 8 && z > front - 0.5 && z < front + 6) continue; // keep the play area clear
    stars.push({ x, y: 0.06, z, rx: -Math.PI / 2, rot: 0, rz: rng() * TAU, s: 0.7 + rng() * 0.8, color: ['#ff5e3a', '#ffb000', '#3f7be0', '#ff4f81', '#b46cff'][(rng() * 5) | 0] });
  }
  for (const p of sides(lite ? 10 : 20, 1, 0.05)) stars.push({ x: p.x, y: p.y + 0.12, z: p.z, rx: -Math.PI / 2, rz: rng() * TAU, s: 0.7 + rng() * 0.6, color: ['#ff5e3a', '#ffb000', '#ff4f81'][(rng() * 3) | 0] });
  root.add(instancedColored(starfishGeometry(0.3), reefMat({ glow: 0.25, roughness: 0.7, flatShading: false }), stars));

  // ---- Sea anemones (one instanced mesh for every tentacle) ----
  const tentGeo = (() => {
    const g = new THREE.CapsuleGeometry(0.055, 0.62, 3, 6);
    g.translate(0, 0.37, 0);
    const p = g.attributes.position, cols = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const k = 0.55 + 0.45 * Math.min(1, p.getY(i) / 0.74); cols.set([k, k, Math.min(1, k * 1.05)], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  })();
  const ANEM = [['#ff4fa3', '#7a2a6b'], ['#a6ff4f', '#2f6b4a'], ['#ff8a2b', '#8a3a1a'], ['#c77dff', '#4a2a7a'], ['#4ff0ff', '#1f5a7a'], ['#ffe14d', '#8a6a1a']];
  const tentacles = [];
  const up = new V3(0, 1, 0);
  const anemone = (x, y, z, s, kind) => {
    const [tc, bc] = ANEM[kind % ANEM.length];
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const col = part(g, new THREE.CylinderGeometry(0.5, 0.62, 0.55, 18), mat(bc, { flatShading: false, roughness: 0.6 }), 0, 0.27, 0, s, s, s);
    col.receiveShadow = true;
    part(g, new THREE.CircleGeometry(0.5, 18), mat(new THREE.Color(tc).lerp(new THREE.Color('#ffffff'), 0.3).getStyle(), { emissive: tc, emissiveIntensity: 0.5 }), 0, 0.555 * s, 0, s, s, s).rotation.x = -Math.PI / 2;
    root.add(g);
    for (let ringI = 0; ringI < 4; ringI++) {
      const rr = (0.08 + ringI * 0.13) * s, n = 6 + ringI * 6, tilt = 0.15 + ringI * 0.32;
      for (let j = 0; j < n; j++) {
        const a = (j / n) * TAU + ringI * 0.3;
        const d = new V3(Math.sin(a), 0, Math.cos(a));
        const q = new THREE.Quaternion().setFromAxisAngle(new V3().crossVectors(up, d).normalize(), tilt);
        tentacles.push({ x: x + d.x * rr, y: y + 0.52 * s, z: z + d.z * rr, q, s: s * (0.85 + rng() * 0.35), color: tc });
      }
    }
    return g;
  };
  // Two big ones in front, each home to a family of clownfish
  const homes = [-1, 1].map((side, i) => anemone(side * 6.4, 0, front + 3.1, 1.55, i ? 4 : 0));
  sides(lite ? 8 : 14, 1.2, 0.06).forEach((p, i) => anemone(p.x, p.y - 0.05, p.z, 0.8 + rng() * 0.7, i + 1));
  for (let k = 0; k < 6; k++) {
    const th = (rng() - 0.5) * 2 * (L.spread + 0.3), R = L.backR + 3 + rng() * 14;
    const [x, z] = polar(R, th);
    if (!avoid(x, z)) anemone(x, L.topY, z, 0.9 + rng() * 0.6, k + 2);
  }
  const tentMesh = instancedColored(tentGeo, reefMat({ vertexColors: true, glow: 0.55, roughness: 0.45, flatShading: false, sway: { amp: 0.22, height: 0.74, speed: 2.2 } }), tentacles);
  tentMesh.castShadow = false;
  root.add(tentMesh);

  // Clownfish darting round their anemones; tap an anemone to scatter them
  const clownGeo = clownfishGeometry();
  const clownMat = reefMat({ vertexColors: true, glow: 0.25, roughness: 0.4, flatShading: false });
  const perHome = 4;
  const clowns = new THREE.InstancedMesh(clownGeo, clownMat, perHome * homes.length);
  clowns.frustumCulled = false;
  root.add(clowns);
  const scare = homes.map(() => 0);
  homes.forEach((home, hi) => {
    fx.tappable(home, (a) => {
      if (a.busy) return;
      a.busy = 2.2;
      scare[hi] = 1;
      sound()?.sparkle(6);
      burstAt(home, 1.2, ['#ff8a2b', '#ffffff', '#4ff0ff']);
    });
  });
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(0, 0, 0, 'YXZ'), sc = new V3(), pv = new V3();
  updaters.push((t, dt) => {
    homes.forEach((home, hi) => {
      scare[hi] = Math.max(0, scare[hi] - dt * 0.5);
      for (let k = 0; k < perHome; k++) {
        const dir = k % 2 ? 1 : -1, a = t * (0.9 + k * 0.17) * dir + k * 1.7;
        const r = 0.9 + k * 0.22 + scare[hi] * 2.4;
        pv.set(home.position.x + Math.cos(a) * r, 1.3 + Math.sin(t * 1.3 + k) * 0.3 + scare[hi] * 1.2, home.position.z + Math.sin(a) * r);
        e4.set(Math.sin(t * 2 + k) * 0.1, Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir) + Math.sin(t * 12 + k) * 0.12, 0);
        q4.setFromEuler(e4);
        sc.setScalar(0.42);
        m4.compose(pv, q4, sc);
        clowns.setMatrixAt(hi * perHome + k, m4);
      }
    });
    clowns.instanceMatrix.needsUpdate = true;
  });

  // ---- Fish schools ----
  const SCHOOLS = [
    { n: 70, colors: ['#ffd23f', '#ffe14d', '#ffc61a'], cx: 0, cy: L.topY + 9, cz: -(L.backR + 4), rx: 24, rz: 9, speed: 0.11, spread: 2.4, size: 0.62 },
    { n: 80, colors: ['#5fd4ff', '#3fa9ff', '#a8ecff'], cx: -34, cy: 13, cz: -(L.backR + 18), rx: 9, rz: 6, speed: 0.22, spread: 3.2, size: 0.42 },
    { n: 55, colors: ['#ff6fb5', '#ff8ad8', '#c77dff'], cx: 30, cy: 7, cz: -(L.R0 + 6), rx: 6, rz: 5, speed: 0.3, spread: 1.8, size: 0.4 },
    { n: 40, colors: ['#ff8a2b', '#ff5e3a', '#ffb347'], cx: -26, cy: 5, cz: -(L.R0 - 2), rx: 5, rz: 4, speed: -0.32, spread: 1.6, size: 0.45 },
    { n: 30, colors: ['#7cf29a', '#4fd1ff', '#ffe14d'], cx: 0, cy: L.topY + 4, cz: -(L.R0 + 4), rx: 16, rz: 5, speed: -0.09, spread: 1.3, size: 0.55 },
  ];
  const fishes = [];
  SCHOOLS.forEach((S) => {
    const n = lite ? Math.ceil(S.n * 0.5) : S.n;
    for (let k = 0; k < n; k++) {
      const o = new V3(rng() - 0.5, (rng() - 0.5) * 0.6, rng() - 0.5).multiplyScalar(S.spread * 2);
      fishes.push({ S, o, lag: (rng() - 0.5) * 0.5, seed: rng() * 10, sz: S.size * (0.8 + rng() * 0.4), color: S.colors[(rng() * S.colors.length) | 0] });
    }
  });
  const fishMesh = new THREE.InstancedMesh(fishGeometry(), reefMat({ vertexColors: true, glow: 0.35, roughness: 0.35, metalness: 0.15, flatShading: false }), fishes.length);
  fishes.forEach((f, i) => fishMesh.setColorAt(i, new THREE.Color(f.color)));
  fishMesh.frustumCulled = false;
  root.add(fishMesh);
  updaters.push((t) => {
    fishes.forEach((f, i) => {
      const S = f.S, ph = t * S.speed + f.lag, dir = Math.sign(S.speed);
      pv.set(S.cx + Math.cos(ph) * S.rx + f.o.x + Math.sin(t * 1.1 + f.seed) * 0.25,
        S.cy + Math.sin(ph * 2) * 1.5 + f.o.y + Math.sin(t * 1.7 + f.seed) * 0.15,
        S.cz + Math.sin(ph) * S.rz + f.o.z);
      const dx = -Math.sin(ph) * S.rx * dir, dz = Math.cos(ph) * S.rz * dir, dy = Math.cos(ph * 2) * 3 * dir;
      e4.set(-Math.atan2(dy, Math.hypot(dx, dz)) * 0.5, Math.atan2(dx, dz) + Math.sin(t * 11 + f.seed) * 0.13, 0);
      q4.setFromEuler(e4);
      sc.setScalar(f.sz);
      m4.compose(pv, q4, sc);
      fishMesh.setMatrixAt(i, m4);
    });
    fishMesh.instanceMatrix.needsUpdate = true;
  });

  // ---- Light from the surface: rays, a shimmering ceiling and a bright sun window ----
  const rays = [];
  for (let k = 0; k < (lite ? 7 : 12); k++) {
    const w = 5 + rng() * 9;
    const geo = new THREE.PlaneGeometry(w, 95);
    geo.translate(0, -47.5, 0);
    const mtl = new THREE.MeshBasicMaterial({ map: rayTex, color: '#c8fbff', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const ray = new THREE.Group();
    ray.add(new THREE.Mesh(geo, mtl));
    const b = new THREE.Mesh(geo, mtl); b.rotation.y = Math.PI / 2; ray.add(b);
    ray.position.set((rng() - 0.5) * 110, 78, -12 - rng() * 85);
    ray.rotation.z = 0.22 + (rng() - 0.5) * 0.1;
    ray.rotation.x = 0.08;
    ray.userData = { seed: rng() * 10, base: 0.05 + rng() * 0.07 };
    root.add(ray);
    rays.push(ray);
  }
  updaters.push((t) => rays.forEach((r) => {
    r.children[0].material.opacity = r.userData.base * (0.6 + 0.4 * Math.sin(t * 0.45 + r.userData.seed));
    r.rotation.z = 0.22 + Math.sin(t * 0.15 + r.userData.seed) * 0.04;
  }));
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    uniforms: { uTime: oceanTime },
    vertexShader: 'varying vec2 vW; void main(){ vW = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vW; ${CAUSTIC_GLSL}
      void main(){ float c = tdCaustic(vW * 0.18, uTime * 0.6); float d = length(vW) / 340.0;
        vec3 col = mix(vec3(0.55, 0.93, 1.0), vec3(1.0), c * 0.8);
        gl_FragColor = vec4(col, (0.35 + c * 0.5) * (1.0 - smoothstep(0.4, 1.0, d))); }`,
  }));
  surface.rotation.x = Math.PI / 2;
  surface.position.y = 88;
  surface.renderOrder = -0.5;
  root.add(surface);
  const sunWin = glowSprite('#e8fdff', 150, 0.55);
  sunWin.position.set(-40, 86, -90);
  root.add(sunWin);

  // ---- Bubbles rising from the reef ----
  const vents = [...sides(10, 1.5, 0.1).map((p) => new V3(p.x, p.y, p.z)), new V3(-3.4, 0.6, front + 4.2), new V3(3.6, 0.6, front + 4.4)];
  const NB = A.reducedMotion ? 90 : lite ? 220 : 420;
  const bp = new Float32Array(NB * 3), bInfo = [];
  for (let i = 0; i < NB; i++) {
    const free = i % 3 === 0;
    const v = vents[i % vents.length];
    const p = free ? new V3((rng() - 0.5) * 100, rng() * 40, -80 + rng() * 90) : v.clone();
    bInfo.push({ v: free ? null : v, sp: 1 + rng() * 1.8, seed: rng() * 10, top: 25 + rng() * 25, y: free ? p.y : rng() * 20 });
    bp.set([p.x, p.y, p.z], i * 3);
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const bubbles = new THREE.Points(bGeo, new THREE.PointsMaterial({ map: bubbleTex, color: '#e6fcff', size: 0.32, transparent: true, depthWrite: false, opacity: 0.9 }));
  bubbles.frustumCulled = false;
  root.add(bubbles);
  updaters.push((t, dt) => {
    for (let i = 0; i < NB; i++) {
      const b = bInfo[i];
      b.y += b.sp * dt;
      if (b.y > b.top) b.y = 0;
      const k = i * 3;
      if (b.v) {
        bp[k] = b.v.x + Math.sin(t * 2.3 + b.seed) * 0.15 * (1 + b.y * 0.05);
        bp[k + 1] = b.v.y + b.y;
        bp[k + 2] = b.v.z + Math.cos(t * 1.9 + b.seed) * 0.15;
      } else {
        bp[k] += Math.sin(t * 1.5 + b.seed) * 0.01;
        bp[k + 1] = b.y;
      }
    }
    bGeo.attributes.position.needsUpdate = true;
  });

  // ---- Glowing jellyfish drifting like fairy lights ----
  const JC = ['#ff7ad9', '#7af7ff', '#c77dff', '#ffd36b', '#7cf29a', '#ff9e7a'];
  for (let k = 0; k < (lite ? 5 : 9); k++) {
    const jj = makeJelly(JC[k % JC.length], rng);
    const g = jj.group;
    const sideK = k % 3;
    const home = sideK === 0
      ? new V3((rng() < 0.5 ? -1 : 1) * (14 + rng() * 14), 6 + rng() * 6, -(L.R0 - 2 + rng() * 10))
      : new V3((rng() - 0.5) * 60, L.topY + 8 + rng() * 10, -(L.backR + 2 + rng() * 25));
    g.position.copy(home);
    g.scale.setScalar(0.9 + rng() * 0.7);
    root.add(g);
    const seed = rng() * 10;
    fx.tappable(g, (a) => {
      if (a.busy) return;
      a.busy = 1.6;
      sound()?.sparkle(5);
      burstAt(g, 0, [JC[k % JC.length], '#ffffff']);
    }, (dt, t, a) => {
      const beat = (t * 0.9 + seed) % 1, pulse = Math.sin(beat * Math.PI);
      jj.bell.scale.set(1 + pulse * 0.14, 0.8 - pulse * 0.12, 1 + pulse * 0.14);
      g.position.set(home.x + Math.sin(t * 0.13 + seed) * 3, home.y + Math.sin(t * 0.45 + seed) * 1.4, home.z + Math.cos(t * 0.11 + seed) * 2);
      jj.tentacles.forEach((h, i) => { h.rotation.x = Math.sin(t * 1.4 + i + seed) * 0.18; h.rotation.z = Math.cos(t * 1.1 + i) * 0.15; });
      const glow = a.busy > 0 ? 2.8 : 1.0 + pulse * 0.5;
      jj.bell.material.emissiveIntensity = glow;
      jj.inner.material.opacity = a.busy > 0 ? 1 : 0.65 + pulse * 0.25;
    });
  }

  // ---- Treasure chest spilling presents ----
  const chest = new THREE.Group();
  chest.name = 'Treasure chest';
  chest.position.set(-3.4, 0, front + 4.2);
  chest.rotation.y = 0.35;
  root.add(chest);
  const wood = mat('#8a5a2e', { flatShading: false, roughness: 0.8 }), gold = mat('#f2c14e', { metalness: 0.7, roughness: 0.3, emissive: '#a07010', emissiveIntensity: 0.3, flatShading: false });
  part(chest, new THREE.BoxGeometry(1.4, 0.7, 0.9), wood, 0, 0.35, 0);
  [-0.5, 0.5].forEach((x) => part(chest, new THREE.BoxGeometry(0.1, 0.72, 0.92), gold, x, 0.36, 0));
  const lid = pivot(chest, 0, 0.7, -0.45);
  part(lid, new THREE.CylinderGeometry(0.45, 0.45, 1.4, 16, 1, false, 0, Math.PI), wood, 0, 0, 0.45).rotation.z = Math.PI / 2;
  [-0.5, 0.5].forEach((x) => { const b = part(lid, new THREE.CylinderGeometry(0.47, 0.47, 0.1, 16, 1, false, 0, Math.PI), gold, x, 0, 0.45); b.rotation.z = Math.PI / 2; });
  const coins = new THREE.Group();
  chest.add(coins);
  for (let k = 0; k < 14; k++) part(coins, new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), mat('#ffd23f', { metalness: 0.8, roughness: 0.25, emissive: '#ffb000', emissiveIntensity: 0.6 }), (rng() - 0.5) * 1.1, 0.68 + rng() * 0.1, (rng() - 0.5) * 0.7).rotation.set(rng(), rng(), rng());
  [['#e2483d', -0.35], ['#2f9e5b', 0.25], ['#9b5de5', 0.0]].forEach(([col, x], i) => {
    const p = part(coins, new THREE.BoxGeometry(0.34, 0.3, 0.3), mat(col), x, 0.82 + i * 0.05, (i - 1) * 0.15);
    p.rotation.y = i;
    part(p, new THREE.BoxGeometry(0.36, 0.32, 0.06), mat('#ffd23f'), 0, 0, 0);
  });
  const chestGlow = glowSprite('#ffd36b', 2.6, 0.0);
  chestGlow.position.set(0, 0.9, 0);
  chest.add(chestGlow);
  let lidOpen = 0.35;
  fx.tappable(chest, (a) => {
    if (a.busy) return;
    a.busy = 2.5;
    sound()?.fanfare();
    burstAt(chest, 1, ['#ffd23f', '#ffffff', '#ff8a2b'], 26);
  }, (dt, t, a) => {
    lidOpen = THREE.MathUtils.damp(lidOpen, a.busy > 0 ? 1.7 : 0.35, 5, dt);
    lid.rotation.x = -lidOpen;
    chestGlow.material.opacity = Math.min(0.85, (lidOpen - 0.35) * 0.7);
  });

  // ---- Giant clam with a glowing pearl ----
  const clam = new THREE.Group();
  clam.name = 'Giant clam';
  clam.position.set(3.6, 0, front + 4.4);
  clam.rotation.y = -0.4;
  root.add(clam);
  const shellGeo = (() => {
    const g = new THREE.SphereGeometry(0.85, 36, 12, 0, Math.PI, 0, Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x), k = 1 + 0.07 * Math.abs(Math.sin(a * 6)) * (1 - y / 0.85);
      p.setXYZ(i, x * k, y, z * k);
    }
    g.computeVertexNormals();
    g.rotateX(-Math.PI / 2);
    g.scale(1, 1, 0.55);
    return g;
  })();
  const shellMat = mat('#e9dcf2', { flatShading: false, roughness: 0.5, side: THREE.DoubleSide });
  const lower = part(clam, shellGeo, shellMat, 0, 0.05, 0);
  lower.rotation.x = Math.PI;
  const upper = pivot(clam, 0, 0.05, -0.02);
  part(upper, shellGeo, shellMat, 0, 0, 0);
  part(clam, new THREE.SphereGeometry(0.72, 24, 8), mat('#3a6bff', { emissive: '#7a3cff', emissiveIntensity: 0.5, flatShading: false, roughness: 0.4 }), 0, 0.06, 0.02, 1, 0.12, 0.55);
  const pearl = part(clam, new THREE.SphereGeometry(0.2, 18, 14), new THREE.MeshStandardMaterial({ color: '#fff8f2', emissive: '#ffe8f6', emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.3 }), 0, 0.22, 0.05);
  const pearlGlow = glowSprite('#ffe8f6', 1.8, 0.3);
  pearlGlow.position.copy(pearl.position);
  clam.add(pearlGlow);
  let clamOpen = 0.45;
  fx.tappable(clam, (a) => {
    if (a.busy) return;
    a.busy = 2.4;
    sound()?.chime();
    burstAt(clam, 0.5, ['#ffe8f6', '#7af7ff', '#c77dff'], 20);
  }, (dt, t, a) => {
    const target = a.busy > 0 ? 1.0 : 0.38 + Math.max(0, Math.sin(t * 0.4)) * 0.12;
    clamOpen = THREE.MathUtils.damp(clamOpen, target, 4, dt);
    upper.rotation.x = -clamOpen;
    pearl.material.emissiveIntensity = a.busy > 0 ? 2.2 : 0.6 + Math.sin(t * 2) * 0.2;
    pearlGlow.material.opacity = a.busy > 0 ? 0.9 : 0.3;
  });

  // ---- Seahorses guarding the tree ----
  const treeAt = new V3(0, L.topY, -(L.backR + 6));
  [-1, 1].forEach((s, i) => {
    const h = makeSeahorse(i ? '#ff7ad9' : '#ffb347');
    h.position.set(treeAt.x + s * 6.6, treeAt.y + 2.2, treeAt.z + 2.4);
    h.rotation.y = -s * 0.6;
    root.add(h);
    const seed = rng() * 5;
    updaters.push((t) => {
      h.position.y = treeAt.y + 2.2 + Math.sin(t * 0.9 + seed) * 0.35;
      h.rotation.z = Math.sin(t * 0.7 + seed) * 0.08;
      h.userData.fin.rotation.x = Math.sin(t * 18) * 0.4;
    });
  });

  // ---- A humpback and her calf, far off in the blue ----
  const whale = makeWhale(15);
  const calf = makeWhale(6);
  root.add(whale.group, calf.group);
  const wc = new V3(0, 0, -(L.backR + 34));
  let roll = 0;
  fx.tappable(whale.group, (a) => {
    if (a.busy) return;
    a.busy = 3;
    whaleSong();
  }, (dt, t, a) => {
    roll = THREE.MathUtils.damp(roll, a.busy > 0 ? 1 : 0, 2, dt);
  });
  const swim = (w, ang, y, t, seed) => {
    // a wide oval behind the village: across the back in view, then round behind the camera
    const x = Math.sin(ang) * 95, z = -Math.cos(ang) * 22;
    // low across the back where she is in view, rising high over the village on the way round
    w.group.position.set(wc.x + x, y + 8 * (1 - Math.cos(ang)) + Math.sin(t * 0.25 + seed) * 1.5, wc.z + z);
    w.group.rotation.set(Math.sin(t * 0.5 + seed) * 0.04, Math.atan2(Math.cos(ang) * 95, Math.sin(ang) * 22), Math.sin(t * 0.3) * 0.04 + roll * Math.sin(t * 2) * 0.25);
    w.tail.rotation.x = Math.sin(t * 0.8 + seed) * 0.35;
    w.flippers.forEach((f, i) => { f.rotation.x = Math.sin(t * 0.5 + seed + i) * 0.2; });
  };
  updaters.push((t) => {
    const ang = -0.8 + ((t * 0.03) % TAU);
    swim(whale, ang, L.topY + 3.5, t, 0);
    swim(calf, ang - 0.1, L.topY + 1, t * 1.2, 1.3);
  });
  if (A.reducedMotion) roll = 0;

  // ---- Santa's sleigh, pulled by dolphins ----
  const sleigh = new THREE.Group();
  const red = mat('#d6282c', { flatShading: false, roughness: 0.5 }), goldM = mat('#f2c14e', { metalness: 0.6, roughness: 0.3, flatShading: false });
  part(sleigh, new THREE.BoxGeometry(1.0, 0.6, 1.8), red, 0, 0.5, 0);
  part(sleigh, new THREE.BoxGeometry(1.02, 0.2, 0.6), red, 0, 0.9, -0.6);
  [-0.45, 0.45].forEach((x) => {
    const runner = part(sleigh, new THREE.TorusGeometry(0.9, 0.05, 6, 20, Math.PI * 0.8), goldM, x, 0.6, 0.2);
    runner.rotation.y = Math.PI / 2;
    runner.rotation.z = Math.PI;
  });
  part(sleigh, new THREE.SphereGeometry(0.42, 14, 10), red, 0, 1.15, -0.2);
  part(sleigh, new THREE.SphereGeometry(0.25, 14, 10), mat('#ffd2b0', { flatShading: false }), 0, 1.68, -0.1);
  part(sleigh, new THREE.SphereGeometry(0.24, 12, 8), mat('#ffffff', { flatShading: false }), 0, 1.55, 0.05, 1, 0.9, 0.8);
  santaHat(sleigh, 0.22, 0, 1.85, -0.12, -0.3);
  part(sleigh, new THREE.BoxGeometry(0.7, 0.5, 0.5), mat('#2f9e5b'), 0, 1.0, -0.75);
  const dolphins = [-1, 1].map((s) => { const d = makeDolphin(); d.position.set(s * 0.8, 0.6, 3.2); d.scale.setScalar(1.3); sleigh.add(d); return d; });
  [-1, 1].forEach((s) => {
    const rein = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 4), goldM);
    rein.position.set(s * 0.6, 0.75, 1.8);
    rein.rotation.x = Math.PI / 2;
    rein.rotation.z = s * 0.15;
    sleigh.add(rein);
  });
  const sleighGlow = glowSprite('#ffe9a8', 6, 0.35);
  sleighGlow.position.set(0, 1, 0);
  sleigh.add(sleighGlow);
  sleigh.scale.setScalar(1.6);
  root.add(sleigh);
  updaters.push((t) => {
    const k = (t % 46) / 46;
    sleigh.visible = k < 0.55;
    const u = k / 0.55;
    sleigh.position.set(-80 + u * 160, L.topY + 15 + Math.sin(u * Math.PI) * 4 + Math.sin(t * 1.5) * 0.5, -(L.backR + 22));
    sleigh.rotation.set(0, Math.PI / 2, Math.sin(t * 1.5) * 0.05);
    dolphins.forEach((d, i) => {
      d.position.y = 0.6 + Math.sin(t * 3 + i * 1.5) * 0.25;
      d.rotation.x = Math.cos(t * 3 + i * 1.5) * 0.15;
      d.userData.tail.rotation.x = Math.sin(t * 6 + i) * 0.5;
    });
  });

  // Extra glows dotted on the far reef, like fairy lights
  ring(10, 90, 150, (x, z, i) => {
    const sp = glowSprite(['#4ff0ff', '#ff7ad9', '#c77dff'][i % 3], 30, 0.18);
    sp.position.set(x, 6 + (i % 3) * 3, z);
    root.add(sp);
  });
}
