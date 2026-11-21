/* Low-poly 3D houses (snow cottages / summer beach boxes) with a hinged, numbered door.
   Static parts are merged per material after building, so 24 detailed houses stay cheap to draw. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const A = window.Advent;

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const DISPLAY = '{s}px "Bagel Fat One", Georgia, "Times New Roman", serif';
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

// Manga / kawaii worlds (A.toonLook) get flat cel-shaded materials instead of PBR ones.
let toonGrad = null;
const TOON_KEYS = ['color', 'map', 'emissive', 'emissiveIntensity', 'emissiveMap', 'transparent', 'opacity', 'side', 'vertexColors', 'fog', 'alphaTest', 'depthWrite'];
export function surfaceMaterial(o) {
  if (!A.toonLook) return new THREE.MeshStandardMaterial(o);
  if (!toonGrad) {
    toonGrad = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
    toonGrad.minFilter = toonGrad.magFilter = THREE.NearestFilter;
    toonGrad.needsUpdate = true;
  }
  const keep = { gradientMap: toonGrad };
  TOON_KEYS.forEach((k) => { if (o[k] !== undefined) keep[k] = o[k]; });
  return new THREE.MeshToonMaterial(keep);
}

// Shared materials: same look => same material => fewer GPU state changes.
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = (A.toonLook ? 'toon:' : '') + color + JSON.stringify(opts, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (!matCache.has(key)) {
    const o = { roughness: 0.85, metalness: 0, flatShading: true, color, ...opts };
    if (o.emissive) o.emissive = new THREE.Color(o.emissive);
    const m = surfaceMaterial(o);
    m.userData.shared = true;
    matCache.set(key, m);
  }
  return matCache.get(key);
}
export function clearMaterialCache() {
  matCache.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  matCache.clear();
}

function doorTexture(theme, day, pal) {
  return canvasTexture(256, 400, (g, w, h) => {
    g.fillStyle = pal.door;
    g.fillRect(0, 0, w, h);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (theme === 'space') {
      g.fillStyle = '#fff0ce';
      g.beginPath(); g.arc(w / 2, h * 0.27, 51, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#a4d9e2';
      g.beginPath(); g.arc(w / 2, h * 0.27, 33, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff4e4'; g.font = DISPLAY.replace('{s}', 106);
      g.fillText(day, w / 2, h * 0.73);
      return;
    }
    if (['gingerbread', 'toy', 'treehouse'].includes(theme)) {
      // Four little panes and a clear day number, painted on the hinged candy door.
      g.fillStyle = 'rgba(0,0,0,.08)';
      roundRect(g, 16, 14, w - 32, h - 28, 30); g.fill();
      g.fillStyle = '#ffe6a1';
      for (const x of [61, 139]) for (const y of [55, 128]) {
        roundRect(g, x, y, 56, 56, 8); g.fill();
      }
      g.font = DISPLAY.replace('{s}', 108);
      g.fillStyle = '#fff9eb';
      g.fillText(day, w / 2, h * 0.73);
      return;
    }
    if (theme === 'reef') {
      // A sea-glass door: wavy water lines, a few bubbles and a pearl with the day number
      g.strokeStyle = 'rgba(255,255,255,.22)';
      g.lineWidth = 6;
      for (let y = 40; y < h; y += 46) {
        g.beginPath();
        for (let x = 0; x <= w; x += 8) { const yy = y + Math.sin(x / 26 + y) * 6; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,.35)';
      [[44, 70, 10], [64, 40, 6], [200, 300, 9], [212, 334, 5], [52, 330, 7]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
      const pg = g.createRadialGradient(w / 2 - 22, h * 0.47 - 24, 8, w / 2, h * 0.47, 78);
      pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.7, '#fff1f6'); pg.addColorStop(1, '#e8d6ef');
      g.fillStyle = pg;
      g.beginPath(); g.arc(w / 2, h * 0.47, 74, 0, Math.PI * 2); g.fill();
      g.fillStyle = pal.door;
      g.font = DISPLAY.replace('{s}', 100);
      g.fillText(day, w / 2, h * 0.47 + 7);
      return;
    }
    if (theme === 'neon') {
      // metal shutter with a glowing neon number
      g.fillStyle = '#1a1c2b';
      g.fillRect(0, 0, w, h);
      for (let y = 10; y < h; y += 22) { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, y, w, 8); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y + 8, w, 3); }
      g.strokeStyle = pal.ink;
      g.lineWidth = 6;
      g.shadowColor = pal.ink;
      g.shadowBlur = 24;
      g.strokeRect(20, 20, w - 40, h - 40);
      g.font = DISPLAY.replace('{s}', 130);
      g.lineWidth = 7;
      g.strokeText(day, w / 2, h * 0.47);
      g.fillStyle = '#ffffff';
      g.shadowBlur = 12;
      g.fillText(day, w / 2, h * 0.47);
      g.shadowBlur = 0;
      return;
    }
    if (theme === 'shoji') {
      // paper sliding door: wooden lattice with a red seal carrying the number
      g.fillStyle = pal.wall2;
      g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14); g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h);
      for (let x = 14 + 56; x < w - 14; x += 57) g.fillRect(x - 3, 0, 6, h);
      for (let y = 14 + 62; y < h - 14; y += 62) g.fillRect(0, y - 3, w, 6);
      g.fillStyle = pal.ink;
      g.beginPath();
      g.arc(w / 2, h * 0.45, 78, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff8ec';
      g.font = DISPLAY.replace('{s}', 104);
      g.fillText(day, w / 2, h * 0.45 + 8);
      return;
    }
    if (theme === 'snow') {
      // raised panels
      g.strokeStyle = 'rgba(0,0,0,.18)';
      g.lineWidth = 10;
      roundRect(g, 36, 40, w - 72, h - 80, 24);
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.28)';
      g.lineWidth = 5;
      roundRect(g, 30, 34, w - 60, h - 68, 26);
      g.stroke();
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.font = DISPLAY.replace('{s}', 140);
      g.fillText(day, w / 2 + 4, h * 0.6 + 14);
      g.fillStyle = pal.ink;
      g.fillText(day, w / 2, h * 0.6 + 8);
    } else {
      g.fillStyle = 'rgba(0,0,0,.09)';
      for (let x = 0; x < w; x += 52) g.fillRect(x, 0, 5, h);
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.fillRect(0, h * 0.12, w, 10);
      g.fillRect(0, h * 0.86, w, 10);
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(w / 2, h * 0.45, 84, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = pal.door;
      g.font = DISPLAY.replace('{s}', 112);
      g.fillText(day, w / 2, h * 0.45 + 8);
    }
    const kg = g.createRadialGradient(w - 44, h * 0.55, 2, w - 44, h * 0.55, 16);
    kg.addColorStop(0, '#fff6c9');
    kg.addColorStop(1, '#a67412');
    g.fillStyle = kg;
    g.beginPath();
    g.arc(w - 44, h * 0.55, 14, 0, Math.PI * 2);
    g.fill();
  });
}

const stripeCache = new Map();
function stripeTexture(pal) {
  const key = pal.wall + pal.wall2;
  if (stripeCache.has(key)) return stripeCache.get(key);
  const t = canvasTexture(128, 128, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? pal.wall2 : pal.wall;
      g.fillRect((i * w) / 8, 0, w / 8, h);
    }
    g.fillStyle = 'rgba(0,0,0,.06)';
    for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 1);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData.shared = true;
  stripeCache.set(key, t);
  return t;
}

const plankCache = new Map();
function plankTexture(color) {
  if (plankCache.has(color)) return plankCache.get(color);
  const t = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = 'rgba(0,0,0,.09)';
      g.fillRect(0, y, w, 2);
      g.fillStyle = 'rgba(255,255,255,.06)';
      g.fillRect(0, y + 2, w, 2);
      g.fillStyle = 'rgba(0,0,0,.05)';
      g.fillRect(((y * 37) % w), y, 2, 16);
    }
  });
  t.userData.shared = true;
  plankCache.set(color, t);
  return t;
}

const emojiCache = new Map();
export function emojiTexture(emoji) {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji);
  const t = canvasTexture(128, 128, (g, w, h) => {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `96px ${EMOJI_FONT}`;
    g.fillText(emoji, w / 2, h / 2 + 6);
  });
  t.userData.shared = true;
  emojiCache.set(emoji, t);
  return t;
}

function plaqueTexture(day) {
  return canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = 'rgba(255,255,255,.95)';
    roundRect(g, 4, 4, w - 8, h - 8, 26);
    g.fill();
    g.fillStyle = '#3a2418';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '800 40px Nunito, system-ui, sans-serif';
    g.fillText(day, w / 2, h / 2 + 2);
  });
}

// Merge every static mesh that is a direct child of `group`, one mesh per material.
function mergeStatic(group) {
  const byMat = new Map();
  [...group.children].forEach((o) => {
    if (!o.isMesh || o.userData.keep || Array.isArray(o.material)) return;
    o.updateMatrix();
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrix);
    ['color', 'uv2'].forEach((a) => g.deleteAttribute(a));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(g);
    o.geometry.dispose();
    group.remove(o);
  });
  byMat.forEach((geos, material) => {
    const merged = new THREE.Mesh(mergeGeometries(geos), material);
    geos.forEach((g) => g.dispose());
    merged.castShadow = true;
    merged.receiveShadow = true;
    group.add(merged);
  });
}

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function add(group, geo, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  group.add(m);
  return m;
}

const biscuitCache = { t: null };
function biscuitWall() {
  if (biscuitCache.t) return biscuitCache.t;
  const t = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#c8894e';
    g.fillRect(0, 0, w, h);
    const r = A.rng(12);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = ['#b87b43', '#dc9f64', '#bd8048'][(r() * 3) | 0];
      g.globalAlpha = 0.16;
      g.beginPath();
      g.arc(r() * w, r() * h, 0.8 + r() * 1.8, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  });
  t.userData.shared = true;
  biscuitCache.t = t;
  return t;
}
const pepTex = { t: null };
function peppermint() {
  if (pepTex.t) return pepTex.t;
  pepTex.t = canvasTexture(64, 64, (g, w) => {
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, 7); g.fill();
    for (let i = 0; i < 8; i += 2) {
      g.fillStyle = '#e2283a';
      g.beginPath(); g.moveTo(w / 2, w / 2); g.arc(w / 2, w / 2, w / 2, (i / 8) * 6.283, ((i + 1) / 8) * 6.283); g.fill();
    }
  });
  pepTex.t.userData.shared = true;
  return pepTex.t;
}

const STYLE_OF = { snow: 'cottage', summer: 'beachbox', gingerbread: 'gingerbread', toys: 'toy', space: 'dome', workshop: 'cottage', jungle: 'treehouse', japan: 'machiya', cyber: 'capsule', ocean: 'reef' };

const thatchCache = { t: null };
function thatchTexture() {
  if (thatchCache.t) return thatchCache.t;
  const t = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#d8b66b'; g.fillRect(0, 0, w, h);
    const r = A.rng(8);
    // Individual straw fibres and darker bundle seams, rather than a flat roof colour.
    for (let i = 0; i < 1900; i++) {
      const x=r()*w,y=r()*h,length=8+r()*50;
      g.strokeStyle=['#af843f','#efd293','#c39a51','#f4dcaa'][(r()*4)|0];
      g.globalAlpha=0.3+r()*0.4;g.lineWidth=0.5+r()*1.4;
      g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+(r()-0.5)*4,y+length/2,x+(r()-0.5)*6,y+length);g.stroke();
    }
    g.globalAlpha=0.3;g.strokeStyle='#99713a';g.lineWidth=2;
    for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x+2,h);g.stroke();}
    g.globalAlpha=1;
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  t.userData.shared = true;
  thatchCache.t = t;
  return t;
}

const shojiCache = { t: null };
function shojiTexture() {
  if (shojiCache.t) return shojiCache.t;
  const t = canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = '#fff1cf';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#5a3f2e';
    g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
    for (let x = 4 + 14; x < w - 4; x += 15) g.fillRect(x - 1, 0, 2, h);
    for (let y = 4 + 18; y < h - 4; y += 19) g.fillRect(0, y - 1, w, 2);
  });
  t.userData.shared = true;
  shojiCache.t = t;
  return t;
}

// The illustrated candy world uses rounded, piped shapes rather than timber trim.
// Keep the same hinge/door contract so focusing, opening and rewards still work.
function makeSoftGingerbreadHouse(day, iconEmoji, rng) {
  const group = new THREE.Group();
  group.userData.day = day;
  const W = 2.25, H = 1.85, D = 1.8, RH = 1.02 + rng() * 0.12;
  const fz = D / 2, doorW = 0.85, doorH = 1.38, y0 = 0.09;
  const candy = ['#ed7395', '#70bca8', '#e9b954', '#c18dbe'];
  const color = candy[(day - 1) % candy.length];
  const soft = (c, extra = {}) => mat(c, { roughness: 0.94, flatShading: false, ...extra });
  const icing = soft('#fff4e7');
  const biscuit = soft('#ffffff', { map: biscuitWall() });
  const round = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 2, r);
  const ball = (m, x, y, z, sx, sy = sx, sz = sx) => {
    const b = add(group, new THREE.SphereGeometry(1, 12, 8), m, x, y, z);
    b.scale.set(sx, sy, sz);
    return b;
  };
  const pipe = (points, radius, material) => add(group,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 20, radius, 8, false), material, 0, 0, 0);

  // One bevelled biscuit silhouette: soft corners around walls and gables alike.
  const outline = new THREE.Shape();
  outline.moveTo(-W / 2, 0.12); outline.lineTo(W / 2, 0.12);
  outline.lineTo(W / 2, H); outline.lineTo(0, H + RH); outline.lineTo(-W / 2, H); outline.closePath();
  const body = new THREE.ExtrudeGeometry(outline, { depth: D - 0.16, bevelEnabled: true, bevelSize: 0.09, bevelThickness: 0.08, bevelSegments: 3 });
  add(group, body, biscuit, 0, 0, -D / 2 + 0.08);

  const a = Math.atan2(RH, W / 2), L = Math.hypot(W / 2, RH) + 0.32;
  for (const side of [-1, 1]) {
    const px = side * W / 4, py = H + RH / 2 + 0.12;
    add(group, round(L, 0.24, D + 0.43, 0.11), icing, px, py, 0, 0, 0, -side * a);
    // Thick front piping with soft scallops, rather than icicles or sharp planks.
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const x = side * (W / 2 + 0.17) * (1 - t), y = H - 0.03 + (RH + 0.14) * t;
      ball(icing, x, y, fz + 0.2, 0.13, 0.18 + (k % 2) * 0.05, 0.11);
      if (k % 2 === 0 && k < 6) ball(soft(candy[(day + k) % candy.length]), x, y + 0.17, fz + 0.19, 0.105);
    }
  }
  for (let k = 0; k < 4; k++) ball(soft(candy[(day + k) % candy.length]), 0, H + RH + 0.23, -0.65 + k * 0.43, 0.13);

  // Buttercream footing, including the characteristic little icing dollops.
  add(group, round(W + 0.2, 0.16, D + 0.2, 0.07), icing, 0, 0.08, 0);
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) ball(icing, side * (0.64 + k * 0.2), 0.17, fz + 0.08, 0.18, 0.16 + (k % 2) * 0.07, 0.14);
    pipe([[side * 1.11, 0.17, fz], [side * 1.14, 0.13, 0], [side * 1.11, 0.17, -fz]], 0.11, icing);
  }

  // Warm recessed windows, rounded icing frames and crossed panes.
  const windowMat = soft('#ffd282', { emissive: '#ffc261', emissiveIntensity: 0.65 });
  for (const side of [-1, 1]) {
    const x = side * 0.81, y = 1.14;
    add(group, round(0.42, 0.62, 0.1, 0.05), icing, x, y, fz + 0.045);
    add(group, round(0.32, 0.5, 0.05, 0.025), windowMat, x, y, fz + 0.11);
    add(group, round(0.035, 0.51, 0.045, 0.015), icing, x, y, fz + 0.15);
    add(group, round(0.33, 0.035, 0.045, 0.015), icing, x, y, fz + 0.15);
  }
  // Three raised icing petals on the gable.
  for (const side of [-1, 0, 1]) {
    const petal = ball(icing, side * 0.19, H + 0.2 + (side === 0 ? 0.12 : 0), fz + 0.07, 0.065, 0.17, 0.045);
    petal.rotation.z = -side * 0.55;
  }

  const interiorMat = new THREE.MeshStandardMaterial({ color: '#3b2213', emissive: '#ffbc60', emissiveIntensity: 0, roughness: 1 });
  const interior = add(group, round(doorW, doorH, 0.06), interiorMat, 0, y0 + doorH / 2, fz + 0.07);
  interior.userData.keep = true;
  // Icing surround sits behind the door; the recessed face remains visible when open.
  for (const side of [-1, 1]) add(group, round(0.13, doorH + 0.12, 0.15, 0.06), icing, side * (doorW / 2 + 0.05), y0 + doorH / 2, fz + 0.1);
  add(group, round(doorW + 0.22, 0.15, 0.15, 0.07), icing, 0, y0 + doorH + 0.04, fz + 0.1);
  const pivot = new THREE.Group();
  pivot.position.set(-doorW / 2, y0, fz + 0.16);
  const front = new THREE.MeshStandardMaterial({ map: doorTexture('gingerbread', day, { door: color }), roughness: 0.94 });
  const edge = soft(color);
  const door = new THREE.Mesh(round(doorW, doorH, 0.1, 0.065), [edge, edge, edge, edge, front, edge]);
  door.position.set(doorW / 2, doorH / 2, 0);
  pivot.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), soft('#efbf55'));
  knob.position.set(doorW - 0.13, 0.43, 0.09);
  pivot.add(knob);
  group.add(pivot);
  const plaque = add(group, new THREE.PlaneGeometry(0.38, 0.19), new THREE.MeshBasicMaterial({ map: plaqueTexture(day), transparent: true }), 0, 1.72, fz + 0.1);
  plaque.userData.keep = true;
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(iconEmoji), depthWrite: false }));
  icon.position.set(0, doorH * 0.55 + y0, fz + 0.3);
  icon.scale.setScalar(0.001);
  group.add(icon);
  mergeStatic(group);
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group, pivot, interiorMat, icon, day, height: H + RH + 0.4, lights: [], chimneyTop: null, doorLocal: new THREE.Vector3(0, doorH / 2 + y0, fz + 0.22) };
}

/* Returns { group, pivot, interiorMat, icon, day, height, doorLocal, lights[], chimneyTop } */
export function makeHouse(theme, day, pal, iconEmoji, rng) {
  if (theme === 'gingerbread') return makeSoftGingerbreadHouse(day, iconEmoji, rng);
  if (theme === 'toys') pal = { ...pal, door: ['#c96b5d','#548f7d','#557c9e'][(day-1)%3] };
  if (theme === 'jungle') pal = { ...pal, door: day%2 ? '#6fa78c' : '#cf795a' };
  if (theme === 'space') pal = { ...pal, door: ['#579eb9', '#9275c5', '#cc7eaf'][(day - 1) % 3] };
  const style = STYLE_OF[theme] || 'cottage';
  const snow = style === 'cottage';
  const village = theme === 'snow';
  const ginger = style === 'gingerbread';
  const gabled = snow || ginger || style === 'beachbox';
  const group = new THREE.Group();
  group.userData.day = day;
  const lights = []; // local positions for roof fairy lights
  let chimneyTop = null;
  let height, fz, doorW, doorH, plaqueY;
  let lift = null; // door sill height when it isn't on the ground
  const snowMat = mat('#f4f8ff', { roughness: 1 });
  const icingMat = mat('#fffafc', { roughness: 0.45 });

  if (gabled) {
    const W = village ? 2.0 : snow ? 2.2 : ginger ? 2.1 : 1.9;
    const H = village ? 1.7 : snow ? 1.85 : ginger ? 1.8 : 2.25;
    const D = village ? 1.75 : snow ? 1.9 : ginger ? 1.85 : 1.7;
    const RH = village ? 0.9 : snow ? 1.05 + rng() * 0.35 : ginger ? 1.0 + rng() * 0.3 : 0.85;
    height = H + RH;
    fz = D / 2;
    doorW = style === 'beachbox' ? 0.8 : 0.82;
    doorH = style === 'beachbox' ? 1.45 : 1.3;
    plaqueY = doorH + (style === 'beachbox' ? 0.36 : 0.42);

    // Body
    const wallMat = snow ? mat('#ffffff', { map: plankTexture(pal.wall) }) : ginger ? mat('#ffffff', { map: biscuitWall() }) : mat('#ffffff', { map: stripeTexture(pal) });
    add(group, box(W, H, D), wallMat, 0, H / 2, 0);
    const trimMat = ginger ? icingMat : mat(snow ? new THREE.Color(pal.wall).multiplyScalar(0.6).getStyle() : '#ffffff');
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => add(group, box(0.12, H, 0.12), trimMat, sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02))));
    if (snow) add(group, box(W + 0.14, 0.26, D + 0.14), mat(village ? '#756457' : '#7d8aa8'), 0, 0.13, 0);
    else if (ginger) add(group, box(W + 0.16, 0.24, D + 0.16), mat('#4a2a1a', { roughness: 0.4 }), 0, 0.12, 0);
    else add(group, box(W + 0.1, 0.18, D + 0.1), mat('#ffffff'), 0, 0.09, 0);

    // Gable: wall-coloured triangle ends, roof-coloured slopes (multi-material, kept separate)
    const roofMat = mat(pal.roof);
    const tri = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, RH)]);
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: D, bevelEnabled: false }), [snow ? mat(pal.wall) : ginger ? wallMat : mat(pal.wall2 || '#ffffff'), roofMat]);
    gable.position.set(0, H, -D / 2);
    group.add(gable);

    // Roof panels with overhang (+ snow / icing, icicles / drips)
    const a = Math.atan2(RH, W / 2);
    const L = Math.hypot(W / 2, RH) + 0.32;
    const iceMat = mat('#d8f1ff', { roughness: 0.2, metalness: 0.1 });
    [-1, 1].forEach((side) => {
      const nx = side * Math.sin(a), ny = Math.cos(a);
      const px = (side * W) / 4 + side * 0.06, py = H + RH / 2;
      add(group, box(L, 0.14, D + 0.42), roofMat, px + nx * 0.07, py + ny * 0.07, 0, 0, 0, -side * a);
      if (snow || ginger) {
        add(group, box(L * 0.97, 0.16, D + 0.38), ginger ? icingMat : snowMat, px + nx * 0.2, py + ny * 0.2, 0, 0, 0, -side * a);
        const ex = side * (W / 2 + 0.26), ey = H - 0.12;
        for (let k = 0; k < (village ? 0 : 6); k++) {
          const z = -D / 2 - 0.1 + (k + 0.5) * ((D + 0.2) / 6);
          if (ginger) {
            // icing drips
            const d = add(group, new THREE.SphereGeometry(0.07, 6, 5), icingMat, ex, ey + 0.02 - rng() * 0.08, z);
            d.scale.set(1, 1.6 + rng(), 1);
          } else {
            const h = 0.18 + rng() * 0.32;
            add(group, new THREE.ConeGeometry(0.035, h, 5), iceMat, ex, ey - h / 2, z, Math.PI, 0, 0);
          }
        }
      } else {
        add(group, box(L, 0.08, 0.06), mat('#ffffff'), px + nx * 0.1, py + ny * 0.1, D / 2 + 0.22, 0, 0, -side * a);
      }
      for (let k = 0; !village && k <= 5; k++) {
        const t = k / 5;
        if (side === 1 && k === 5) continue; // apex shared
        lights.push(new THREE.Vector3(side * (W / 2 + 0.2) * (1 - t), H - 0.02 + RH * t + (snow ? -0.06 : -0.05), D / 2 + 0.24));
      }
    });
    if (ginger) {
      // gumdrops along the ridge
      const gum = ['#ff4f81', '#7cf29a', '#ffd23f', '#6fc9ff', '#c77dff'];
      for (let k = 0; k < 4; k++) {
        const gd = add(group, new THREE.SphereGeometry(0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(gum[(k + day) % gum.length], { roughness: 0.3 }), 0, H + RH + 0.14, -D / 2 + 0.2 + (k * (D - 0.4)) / 3);
        gd.scale.set(1, 1.3, 1);
      }
    }
    if ((snow || ginger) && rng() < 0.45) {
      const cx = W * 0.24, cy = H + RH * 0.55, cz = -D * 0.15;
      add(group, box(0.34, 0.9, 0.34), mat(ginger ? '#ffffff' : '#7a3b33'), cx, cy, cz);
      if (ginger) [0.15, 0.4].forEach((dy) => add(group, box(0.36, 0.1, 0.36), mat('#e2283a'), cx, cy + dy - 0.15, cz));
      add(group, box(0.44, 0.12, 0.44), mat(ginger ? '#4a2a1a' : '#4a2420'), cx, cy + 0.42, cz);
      add(group, box(0.4, 0.1, 0.4), ginger ? icingMat : snowMat, cx, cy + 0.52, cz);
      chimneyTop = new THREE.Vector3(cx, cy + 0.6, cz);
    }

    // Windows
    if (snow || ginger) {
      const winMat = ginger ? mat('#ffd0e6', { emissive: '#ff9ccc', emissiveIntensity: 1.5 }) : mat('#ffd77a', { emissive: '#ffc65c', emissiveIntensity: village ? 0.7 : 1.7 });
      const wf = ginger ? icingMat : mat('#3b2418');
      [-1, 1].forEach((s) => {
        const x = s * (W / 2 - 0.37), y = 1.22;
        add(group, new THREE.PlaneGeometry(0.34, 0.4), winMat, x, y, fz + 0.012);
        add(group, box(0.44, 0.05, 0.06), wf, x, y + 0.22, fz + 0.03);
        add(group, box(0.05, 0.44, 0.06), wf, x - 0.2, y, fz + 0.03);
        add(group, box(0.05, 0.44, 0.06), wf, x + 0.2, y, fz + 0.03);
        add(group, box(0.04, 0.4, 0.04), wf, x, y, fz + 0.03);
        add(group, box(0.36, 0.04, 0.04), wf, x, y, fz + 0.03);
        add(group, box(0.5, 0.06, 0.16), ginger ? icingMat : snowMat, x, y - 0.23, fz + 0.06);
      });
      if (snow) {
        const pile = add(group, new THREE.SphereGeometry(1, 9, 5), snowMat, 0, 0, fz + 0.15);
        pile.scale.set(W * 0.75, 0.22, 0.6);
      } else {
        [-1, 1].forEach((s) => add(group, new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(['#ff4f81', '#7cf29a', '#ffd23f'][(day + s + 3) % 3], { roughness: 0.3 }), s * (doorW / 2 + 0.32), 0.24, fz + 0.2));
      }
    } else {
      add(group, new THREE.CircleGeometry(0.17, 16), mat('#ffffff', { emissive: '#fff3c4', emissiveIntensity: 0.35 }), 0, H + RH * 0.42, D / 2 + 0.01);
      add(group, new THREE.TorusGeometry(0.18, 0.03, 5, 16), mat('#ffffff'), 0, H + RH * 0.42, D / 2 + 0.02);
      add(group, box(0.16, 0.22, 0.16), mat('#2a2140'), doorW / 2 + 0.3, 1.25, fz + 0.1);
      add(group, box(0.11, 0.15, 0.17), mat('#ffd36b', { emissive: '#ffb347', emissiveIntensity: 2.2 }), doorW / 2 + 0.3, 1.25, fz + 0.11);
      add(group, box(doorW + 0.5, 0.12, 0.35), mat('#d9a36a'), 0, 0.06, fz + 0.25);
      add(group, box(doorW + 0.5, 0.12, 0.25), mat('#c98d55'), 0, -0.04, fz + 0.5);
      if (rng() < 0.45) {
        const sb = add(group, new THREE.CapsuleGeometry(0.2, 1.5, 3, 8), mat(['#ff6f91', '#ffd23f', '#2ec4b6', '#6a8cff'][(rng() * 4) | 0]), W / 2 + 0.16, 0.95, fz - 0.35, 0, 0, 0.18);
        sb.scale.set(1, 1, 0.22);
      }
      if (rng() < 0.4) {
        add(group, new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), mat('#6b4b3e'), 0, H + RH + 0.42, 0);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24), new THREE.MeshStandardMaterial({ color: pal.door, side: THREE.DoubleSide }));
        flag.geometry.translate(0.21, 0, 0);
        flag.position.set(0.02, H + RH + 0.74, 0);
        flag.userData.wave = rng() * 6;
        flag.userData.keep = true;
        group.add(flag);
        group.userData.flag = flag;
      }
    }
  } else if (style === 'toy') {
    // Rounded wooden playset houses: teal/blue pitched roofs and red castle tops.
    const W = 2.05, H = 1.75, D = 1.75, RH = 0.95;
    fz = D / 2; doorW = 0.8; doorH = 1.28; plaqueY = 1.58;
    const round = (w,h,d,r=0.08) => new RoundedBoxGeometry(w,h,d,2,r);
    const soft = (c) => mat(c, { roughness: 0.91, flatShading: false });
    const roofColor = ['#437f73', '#cc645b', '#537a9c'][(day-1)%3];
    const roofMat = soft(roofColor), cream = soft('#f6dfae');
    const castle = day % 3 === 2;
    add(group, round(W,H,D), soft(['#e3bb84','#edcf9b','#dfb078'][(day-1)%3]),0,H/2+0.3,0);
    add(group, round(W+0.18,0.3,D+0.18), roofMat,0,0.15,0);
    if (castle) {
      add(group,round(W+0.2,0.25,D+0.2),roofMat,0,H+0.4,0);
      for (const z of [-D/2,D/2]) for(let i=0;i<3;i++) add(group,round(0.35,0.4,0.35),roofMat,-0.8+i*0.8,H+0.65,z);
      add(group,new THREE.CylinderGeometry(0.025,0.025,0.75,10),cream,0,H+1,0);
      add(group,round(0.48,0.25,0.06),soft('#efbc59'),0.25,H+1.25,0);
      height=H+1.4;
    } else {
      const tri = new THREE.Shape([new THREE.Vector2(-W/2,0),new THREE.Vector2(W/2,0),new THREE.Vector2(0,RH)]);
      add(group,new THREE.ExtrudeGeometry(tri,{depth:D-0.1,bevelEnabled:true,bevelSize:0.06,bevelThickness:0.05,bevelSegments:3}),soft('#e7bf88'),0,H+0.3,-D/2+0.05);
      const angle=Math.atan2(RH,W/2),length=Math.hypot(W/2,RH)+0.2;
      for(const side of [-1,1]) add(group,round(length,0.22,D+0.35,0.1),roofMat,side*W/4,H+0.3+RH/2+0.09,0,0,0,-side*angle);
      for(const side of [-1,0,1]) {
        const petal=add(group,new THREE.SphereGeometry(1,10,8),cream,side*0.15,H+0.54+(side===0?0.1:0),fz+0.06);
        petal.scale.set(0.055,0.14,0.04);petal.rotation.z=-side*0.5;
      }
      height=H+RH+0.5;
    }
    const warm=mat('#ffe2a2',{emissive:'#ffcb73',emissiveIntensity:0.65,roughness:0.9,flatShading:false});
    for(const side of [-1,1]) {
      const x=side*0.76,y=1.24;
      add(group,round(0.35,0.52,0.08,0.04),cream,x,y,fz+0.02);
      add(group,round(0.26,0.42,0.05,0.02),warm,x,y,fz+0.08);
      add(group,round(0.025,0.43,0.04,0.01),cream,x,y,fz+0.11);
      add(group,round(0.28,0.025,0.04,0.01),cream,x,y,fz+0.11);
    }
  } else if (style === 'treehouse') {
    // Honey-coloured raised huts with layered scalloped thatch and stout rails.
    const R=0.97,H=1.55;lift=0.85;doorW=0.75;doorH=1.2;fz=1.04;plaqueY=1.42;height=3.95;
    const round=(w,h,d,r=0.06)=>new RoundedBoxGeometry(w,h,d,2,r);
    const soft=(c)=>mat(c,{roughness:0.95,flatShading:false});
    const wood=soft('#be894b'),trim=soft('#e5b675');
    const thatch=mat('#ffffff',{map:thatchTexture(),bumpMap:thatchTexture(),bumpScale:0.07,roughness:0.98,flatShading:false});
    for(const x of [-0.67,0.67]) for(const z of [-0.6,0.6]) add(group,new THREE.CylinderGeometry(0.12,0.14,lift,12),wood,x,lift/2,z);
    add(group,new THREE.CylinderGeometry(1.26,1.26,0.18,32),wood,0,lift-0.09,0.1);
    add(group,new THREE.CylinderGeometry(R,R,H,32),wood,0,lift+H/2,0);
    for(const y of [0.32,0.66,1.0,1.33]) add(group,new THREE.TorusGeometry(R+0.01,0.018,5,32),trim,0,lift+y,0,Math.PI/2);
    for(const side of [-1,1]) {
      add(group,round(0.62,0.1,0.1),trim,side*0.84,lift+0.43,1.17);
      for(const x of [0.58,1.1]) {
        add(group,new THREE.CylinderGeometry(0.065,0.065,0.45,10),wood,side*x,lift+0.22,1.17);
        add(group,new THREE.SphereGeometry(0.09,10,8),trim,side*x,lift+0.46,1.17);
      }
    }
    for(let tier=0;tier<3;tier++) {
      const radius=1.48-tier*0.35,y=lift+H-0.06+tier*0.42;
      const profile=[[0,0],[radius*0.85,0],[radius,0.05],[radius,0.13],[radius*0.76,0.35],[0,0.93]].map(([r,h])=>new THREE.Vector2(r,h));
      const roof=new THREE.LatheGeometry(profile,56);
      const positions=roof.attributes.position;
      for(let i=0;i<positions.count;i++) {
        const x=positions.getX(i),z=positions.getZ(i),h=positions.getY(i);
        const scallop=1+0.025*Math.cos(Math.atan2(x,z)*14)*Math.max(0,1-h/0.45);
        positions.setXYZ(i,x*scallop,h,z*scallop);
      }
      roof.computeVertexNormals();
      add(group,roof,thatch,0,y,0);
      const groove=soft('#c9a04e');
      for(let k=0;k<14;k++) {
        const angle=k*Math.PI*2/14+(tier%2)*0.2;
        const points=[[radius*0.2,0.73],[radius*0.6,0.47],[radius*0.94,0.17]].map(([r,h])=>new THREE.Vector3(Math.sin(angle)*r,y+h,Math.cos(angle)*r));
        add(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,0.012,4,false),groove,0,0,0);
      }

    }
    add(group,new THREE.SphereGeometry(0.16,12,8),trim,0,lift+H+1.17,0);
    const warm=mat('#ffdc89',{emissive:'#ffc36a',emissiveIntensity:0.7,roughness:0.9,flatShading:false});
    for(const angle of [-0.88,0.88]) {
      const x=Math.sin(angle)*(R+0.04),z=Math.cos(angle)*(R+0.04);
      add(group,round(0.4,0.48,0.1),trim,x,lift+0.9,z,0,angle);
      add(group,round(0.3,0.37,0.07),warm,Math.sin(angle)*(R+0.11),lift+0.9,Math.cos(angle)*(R+0.11),0,angle);
      add(group,round(0.035,0.39,0.04,0.015),trim,Math.sin(angle)*(R+0.16),lift+0.9,Math.cos(angle)*(R+0.16),0,angle);
    }
    const lx=day%2?-0.92:0.92;
    for(const dx of [-0.19,0.19]) add(group,round(0.08,lift+0.3,0.08,0.035),wood,lx+dx,lift/2,1.35,0.28);
    for(let k=0;k<3;k++) add(group,round(0.47,0.07,0.1,0.03),trim,lx,0.16+k*0.28,1.47-k*0.08);
  } else if (style === 'machiya') {
    // ---- Japan: plaster-and-timber townhouse, hipped tile roof with snow, noren and a paper lantern ----
    const W = 2.2, H = 1.95, D = 1.9;
    fz = D / 2;
    doorW = 0.8;
    doorH = 1.15;
    plaqueY = doorH + 0.27;
    const timber = mat(pal.wall2);
    add(group, box(W + 0.16, 0.2, D + 0.16), mat('#8a8f9c'), 0, 0.1, 0);
    add(group, box(W, H, D), mat(pal.wall), 0, H / 2, 0);
    add(group, box(W + 0.03, 0.55, D + 0.03), timber, 0, 0.2 + 0.27, 0);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => add(group, box(0.12, H, 0.12), timber, sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02))));
    add(group, box(W + 0.04, 0.1, D + 0.04), timber, 0, H - 0.05, 0);
    add(group, box(W + 0.04, 0.07, D + 0.04), timber, 0, 1.5, 0);
    // glowing shoji windows either side
    // a kawaii face: big shiny eyes (they blink) and rosy cheeks; the door is the mouth
    const eyes = [];
    const eyeM = mat('#2a2238', { roughness: 0.4 }), shine = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    [-1, 1].forEach((s) => {
      const eye = new THREE.Group();
      eye.position.set(s * (W / 2 - 0.45), 1.18, fz + 0.015);
      const ball = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), eyeM);
      ball.scale.y = 1.2;
      const h1 = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), shine);
      h1.position.set(0.05, 0.08, 0.005);
      const h2 = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), shine);
      h2.position.set(-0.05, -0.07, 0.005);
      eye.add(ball, h1, h2);
      group.add(eye);
      eyes.push(eye);
      add(group, new THREE.CircleGeometry(0.13, 16), mat('#ff8fb8', { transparent: true, opacity: 0.65 }), s * (W / 2 - 0.3), 0.86, fz + 0.012).scale.x = 1.4;
    });
    group.userData.eyes = eyes;
    // hipped tile roof with a snow cap
    const roofH = 1.0, span = W + 0.85, apexY = H + 0.08 + roofH;
    const roof = add(group, new THREE.ConeGeometry(span / Math.SQRT2, roofH, 4), mat(pal.roof, { roughness: 0.6 }), 0, H + 0.08 + roofH / 2, 0, 0, Math.PI / 4, 0);
    roof.scale.set(1, 1, (D + 0.85) / span);
    const cap = add(group, new THREE.ConeGeometry((span / Math.SQRT2) * 0.6, roofH * 0.6, 4), snowMat, 0, apexY - (roofH * 0.6) / 2 + 0.05, 0, 0, Math.PI / 4, 0);
    cap.scale.set(1, 1, (D + 0.85) / span);
    add(group, box(span + 0.1, 0.09, D + 0.95), mat(new THREE.Color(pal.roof).multiplyScalar(0.7).getStyle()), 0, H + 0.06, 0);
    // upturned eave corners
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => add(group, box(0.32, 0.08, 0.12), mat(pal.roof), sx * (span / 2 + 0.06), H + 0.13, sz * ((D + 0.95) / 2 - 0.06), 0, sx * sz * 0.78, sx * 0.35)));
    add(group, new THREE.SphereGeometry(0.1, 8, 6), mat('#e0b04a', { metalness: 0.5, roughness: 0.4 }), 0, apexY + 0.05, 0);
    // noren curtain over the doorway, in three strips
    for (let k = -1; k <= 1; k++) add(group, box(doorW / 3 + 0.04, 0.32, 0.025), mat(pal.noren || '#2b3a6b'), k * (doorW / 3 + 0.06), 1.72, fz + 0.06);
    add(group, new THREE.CylinderGeometry(0.02, 0.02, doorW + 0.4, 5), timber, 0, 1.89, fz + 0.07, 0, 0, Math.PI / 2);
    // red paper lantern by the door on most houses
    if (rng() < 0.7) {
      const s = rng() < 0.5 ? -1 : 1;
      const lx = s * (doorW / 2 + 0.38);
      const lc = ['#ff7eb6', '#ffd36b', '#7fe0c8'][day % 3];
      const ch = add(group, new THREE.SphereGeometry(0.17, 12, 10), mat(lc, { emissive: lc, emissiveIntensity: 1.6, flatShading: false }), lx, 1.38, fz + 0.2);
      ch.scale.y = 1.35;
      [1.62, 1.14].forEach((y) => add(group, new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10), mat('#1d1d22'), lx, y, fz + 0.2));
      add(group, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), mat('#1d1d22'), lx, 1.8, fz + 0.2);
    }
    // a stone step and a small snowy pine pot
    add(group, box(doorW + 0.5, 0.1, 0.4), mat('#a4a8b4'), 0, 0.05, fz + 0.3);
    if (rng() < 0.5) {
      const px = (rng() < 0.5 ? -1 : 1) * (W / 2 - 0.2);
      add(group, new THREE.CylinderGeometry(0.16, 0.12, 0.22, 8), mat('#5a3f2e'), px, 0.11, fz + 0.25);
      add(group, new THREE.ConeGeometry(0.22, 0.5, 6), mat('#24543e'), px, 0.47, fz + 0.25);
      add(group, new THREE.ConeGeometry(0.1, 0.16, 6), snowMat, px, 0.66, fz + 0.25);
    }
    height = apexY + 0.2;
    for (let k = 0; k <= 6; k++) lights.push(new THREE.Vector3(-span / 2 + (k * span) / 6, H + 0.02, (D + 0.95) / 2 + 0.02));
  } else if (style === 'capsule') {
    // ---- Cyberpunk: a stacked capsule apartment with neon trim, a holo sign, AC unit and antenna ----
    const W = 2.0, H = 2.0, D = 1.8;
    fz = D / 2;
    doorW = 0.8;
    doorH = 1.35;
    plaqueY = doorH + 0.22;
    const neon = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.75), toneMapped: false });
    const body = mat(pal.wall, { metalness: 0.15, roughness: 0.7, emissive: pal.wall, emissiveIntensity: 0.22 });
    const dark = mat('#11121c', { metalness: 0.3, roughness: 0.6 });
    add(group, box(W + 0.2, 0.2, D + 0.2), dark, 0, 0.1, 0);
    add(group, box(W, H, D), body, 0, H / 2 + 0.2, 0);
    // second capsule stacked on top, shifted and turned a little
    const up = rng() < 0.5 ? -1 : 1;
    const H2 = 1.1;
    const upper = new THREE.Group();
    upper.position.set(up * 0.15, H + 0.2, -0.1); upper.rotation.y = up * 0.08; group.add(upper);
    add(upper, box(W * 0.85, H2, D * 0.9), mat(pal.wall2, { metalness: 0.15, roughness: 0.7, emissive: pal.wall2, emissiveIntensity: 0.22 }), 0, H2 / 2, 0);
    const winM = mat('#ffffff', { emissive: pal.roof, emissiveIntensity: 1.25, transparent: true, opacity: 0.95 });
    add(upper, new THREE.PlaneGeometry(W * 0.62, 0.42), winM, 0, H2 * 0.55, D * 0.45 + 0.012);
    // neon trim along the front edges
    const trim = neon(pal.roof);
    // a full neon outline round the front, plus an under-glow strip so every house reads from afar
    add(group, box(W + 0.08, 0.08, 0.08), trim, 0, H + 0.2, fz + 0.03);
    add(group, box(W + 0.08, 0.08, 0.08), trim, 0, 0.24, fz + 0.03);
    add(group, box(0.08, H, 0.08), trim, -W / 2, H / 2 + 0.2, fz + 0.03);
    add(group, box(0.08, H, 0.08), trim, W / 2, H / 2 + 0.2, fz + 0.03);
    add(upper, box(W * 0.85 + 0.06, 0.07, 0.07), trim, 0, H2, D * 0.45 + 0.03);
    add(group, box(W + 0.3, 0.05, D + 0.3), neon(pal.roof), 0, 0.03, 0);
    // two lit windows either side of the door
    const lit = mat('#fff3d6', { emissive: '#ffd9a0', emissiveIntensity: 1.3 });
    [-1, 1].forEach((s) => add(group, new THREE.PlaneGeometry(0.34, 0.34), lit, s * (W / 2 - 0.3), 1.7, fz + 0.012));
    // vertical holo sign beside the door
    const sx = (rng() < 0.5 ? -1 : 1) * (W / 2 + 0.16);
    add(group, box(0.26, 1.5, 0.08), dark, sx, 1.45, fz - 0.2);
    add(group, new THREE.PlaneGeometry(0.2, 1.4), neon(pal.ink), sx, 1.45, fz - 0.15);
    // AC unit with a fan, an antenna with a blinking tip
    add(group, box(0.55, 0.4, 0.35), mat('#9aa3b8', { metalness: 0.5, roughness: 0.4 }), -sx * 0.62, H - 0.1, fz + 0.18);
    add(group, new THREE.CircleGeometry(0.14, 12), dark, -sx * 0.62, H - 0.1, fz + 0.36);
    add(group, new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5), mat('#8a93a8', { metalness: 0.6 }), -up * 0.6, H + H2 + 0.7, -0.3);
    add(group, new THREE.SphereGeometry(0.06, 8, 6), neon('#ff2b5a'), -up * 0.6, H + H2 + 1.22, -0.3);
    // awning over the door
    const awning = new THREE.Group(); awning.position.set(0, doorH + 0.5, fz + 0.25); awning.rotation.x = 0.15; group.add(awning);
    add(awning, box(doorW + 0.5, 0.06, 0.5), dark, 0, 0, 0);
    add(awning, box(doorW + 0.5, 0.04, 0.04), neon(pal.ink), 0, -0.03, 0.25);
    mergeStatic(upper); mergeStatic(awning);
    height = H + 0.2 + H2 + 1.3;
    for (let k = 0; k <= 6; k++) lights.push(new THREE.Vector3(-W / 2 + (k * W) / 6, H + 0.26, fz + 0.06));
  } else if (style === 'reef') {
    // ---- Coral reef: a ribbed pastel sea shell with a spiral conch roof, brass portholes and a starfish ----
    const R = 1.08, H = 1.85, B = 0.22;
    lift = 0.26; doorW = 0.78; doorH = 1.3; fz = 1.2; plaqueY = 1.6;
    const soft = (c, o = {}) => mat(c, { roughness: 0.5, flatShading: false, ...o });
    const baseProfile = [[0, 0], [1.22, 0], [1.4, 0.08], [1.36, 0.2], [1.16, 0.28], [0, 0.28]].map(([r, y]) => new THREE.Vector2(r, y));
    add(group, new THREE.LatheGeometry(baseProfile, 40), soft('#8e6aa8', { roughness: 0.9 }), 0, 0, 0);
    const prof = [];
    for (let k = 0; k <= 12; k++) prof.push(new THREE.Vector2(R * (0.92 + 0.12 * Math.sin((Math.PI * k) / 12)), (k / 12) * H));
    prof.push(new THREE.Vector2(0, H));
    const shell = new THREE.LatheGeometry(prof, 64);
    const sp = shell.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), z = sp.getZ(i), k = 1 + 0.035 * Math.cos(Math.atan2(x, z) * 18);
      sp.setXYZ(i, x * k, sp.getY(i), z * k);
    }
    shell.computeVertexNormals();
    add(group, shell, soft(pal.wall), 0, B, 0);
    for (const y of [0.32, H - 0.12]) add(group, new THREE.TorusGeometry(R * (y < 1 ? 0.98 : 0.95) + 0.02, 0.05, 8, 48), soft(pal.wall2), 0, B + y, 0, Math.PI / 2);
    // vestibule so the door sits snugly on the curved shell
    add(group, new RoundedBoxGeometry(doorW + 0.36, doorH + 0.14, 0.42, 2, 0.08), soft(pal.wall2), 0, lift + (doorH + 0.14) / 2, fz - 0.21);
    // spiral conch roof with bumpy whorls
    const roofH = 1.75, roofR = R * 1.16;
    const rp = [];
    for (let k = 0; k <= 26; k++) { const t = k / 26; rp.push(new THREE.Vector2(Math.max(0.001, roofR * Math.pow(1 - t, 0.9) * (1 + 0.07 * Math.sin(t * Math.PI * 8))), t * roofH)); }
    const roofY = B + H - 0.05;
    add(group, new THREE.LatheGeometry(rp, 48), soft(pal.roof), 0, roofY, 0);
    const helix = [];
    for (let k = 0; k <= 80; k++) {
      const t = k / 80, a = t * Math.PI * 2 * 4, r = roofR * Math.pow(1 - t, 0.9) * 1.02 + 0.02;
      helix.push(new THREE.Vector3(Math.sin(a) * r, roofY + t * roofH * 0.97, Math.cos(a) * r));
    }
    add(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 160, 0.045, 5, false), soft(pal.wall2), 0, 0, 0);
    add(group, new THREE.SphereGeometry(0.13, 14, 10), mat('#fff8f2', { roughness: 0.15, metalness: 0.35, emissive: '#fff0f6', emissiveIntensity: 0.4, flatShading: false }), 0, roofY + roofH + 0.05, 0);
    // brass portholes with warm light
    const brass = mat('#e0b04a', { metalness: 0.6, roughness: 0.35, flatShading: false });
    const warm = mat('#ffe39a', { emissive: '#ffc85c', emissiveIntensity: 1.1, flatShading: false });
    for (const a of [-0.88, 0.88]) {
      const x = Math.sin(a) * (R + 0.1), z = Math.cos(a) * (R + 0.1);
      add(group, new THREE.TorusGeometry(0.2, 0.05, 8, 20), brass, x, B + 1.05, z, 0, a);
      add(group, new THREE.CircleGeometry(0.18, 20), warm, Math.sin(a) * (R + 0.08), B + 1.05, Math.cos(a) * (R + 0.08), 0, a);
    }
    // a starfish clinging to the shell
    const sa = day % 2 ? 1.35 : -1.35;
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.08 : 0.22, a = (i / 10) * Math.PI * 2 + Math.PI / 2; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    add(group, new THREE.ExtrudeGeometry(star, { depth: 0.05, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), mat(['#ff5e3a', '#ffb000', '#ff4f81'][day % 3], { flatShading: false }), Math.sin(sa) * (R + 0.07), B + 1.5, Math.cos(sa) * (R + 0.07), 0, sa, day * 0.7);
    // seaweed by the door
    const weed = mat(['#3fbf6a', '#7cc83f', '#2fa88a'][day % 3], { flatShading: false });
    const wx = day % 2 ? -(doorW / 2 + 0.42) : doorW / 2 + 0.42;
    for (let k = 0; k < 3; k++) {
      const pts = Array.from({ length: 6 }, (_, i) => new THREE.Vector3(wx + (k - 1) * 0.1 + Math.sin(i * 1.3 + k) * 0.07, 0.24 + i * 0.16 * (1 + k * 0.15), fz + 0.05 + (k - 1) * 0.06));
      add(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.04, 5, false), weed, 0, 0, 0);
    }
    height = roofY + roofH + 0.3;
    chimneyTop = new THREE.Vector3(0, roofY + roofH + 0.15, 0);
    for (let k = 0; k <= 8; k++) { const a = -1.25 + (k * 2.5) / 8; lights.push(new THREE.Vector3(Math.sin(a) * (roofR + 0.06), roofY + 0.06, Math.cos(a) * (roofR + 0.06))); }
  } else {
    // Soft lunar pods: matte lavender shells, pastel domes and warm portholes.
    const R = 1.12, H = 1.6;
    const color = ['#72c8dc', '#b48bdf', '#e98cc7'][(day - 1) % 3];
    doorW = 0.82; doorH = 1.36; fz = 1.18; plaqueY = 1.69; height = 3.15;
    const shell = mat('#bbafd0', { roughness: 0.93, flatShading: false });
    const trim = mat('#ded0e5', { roughness: 0.94, flatShading: false });
    const pastel = mat(color, { roughness: 0.9, flatShading: false });
    const round = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 2, r);
    const baseProfile = [[0,0], [1.14,0], [1.3,0.04], [1.34,0.12], [1.28,0.22], [1.14,0.25], [0,0.25]].map(([r,y]) => new THREE.Vector2(r,y));
    add(group, new THREE.LatheGeometry(baseProfile, 32), trim, 0, 0, 0);
    add(group, new THREE.CylinderGeometry(R, R, H, 32), shell, 0, H / 2 + 0.15, 0);
    add(group, new THREE.SphereGeometry(R, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), pastel, 0, H + 0.15, 0);
    add(group, new THREE.CylinderGeometry(R + 0.04, R + 0.04, 0.2, 32), trim, 0, H + 0.12, 0);
    for (const y of [H + 0.02, H + 0.22]) add(group, new THREE.TorusGeometry(R + 0.015, 0.06, 8, 32), trim, 0, y, 0, Math.PI / 2);
    for (const angle of [-1.15, -0.4, 0.4, 1.15]) {
      add(group, new THREE.SphereGeometry(0.055, 10, 8), trim, Math.sin(angle) * (R + 0.065), H + 0.12, Math.cos(angle) * (R + 0.065));
    }
    const warm = mat('#ffe0a0', { emissive: '#ffc774', emissiveIntensity: 0.7, roughness: 0.9, flatShading: false });
    for (const angle of [-0.83, 0.83]) {
      add(group, round(0.39, 0.65, 0.1), trim, Math.sin(angle) * (R + 0.025), 1.02, Math.cos(angle) * (R + 0.025), 0, angle);
      add(group, round(0.28, 0.52, 0.08), warm, Math.sin(angle) * (R + 0.09), 1.02, Math.cos(angle) * (R + 0.09), 0, angle);
    }
    add(group, new THREE.CylinderGeometry(0.035, 0.045, 0.3, 10), trim, 0, H + R + 0.24, 0);
    add(group, new THREE.SphereGeometry(0.1, 14, 10), pastel, 0, H + R + 0.15, 0);
    add(group, new THREE.SphereGeometry(0.1, 14, 10), warm, 0, H + R + 0.4, 0);
  }

  // ---- Door opening: glowing interior + frame (all styles) ----
  const interiorMat = new THREE.MeshStandardMaterial({ color: '#24140c', emissive: new THREE.Color(style === 'dome' ? '#7af7ff' : '#ffae4a'), emissiveIntensity: 0, flatShading: true });
  const y0 = lift !== null ? lift : style === 'toy' ? 0.3 : style === 'capsule' ? 0.2 : 0.02;
  const interior = add(group, box(doorW, doorH, 0.04), interiorMat, 0, doorH / 2 + y0, fz + 0.01);
  interior.userData.keep = true;
  const frameMat = style === 'reef' ? mat('#f6e7cf', { roughness: 0.6, flatShading: false }) : style === 'capsule' ? mat('#2a2d40', { metalness: 0.5 }) : snow || style === 'machiya' || style === 'treehouse' ? mat(style === 'treehouse' ? '#e5b675' : '#3a2a22', { roughness: 0.95, flatShading: style !== 'treehouse' }) : style === 'dome' ? mat('#ded0e5', { roughness: 0.94, flatShading: false }) : ginger ? icingMat : mat('#ffffff');
  const roundedDoor = ['dome', 'toy', 'treehouse', 'reef'].includes(style);
  const frameBox = (w, h, d) => roundedDoor ? new RoundedBoxGeometry(w, h, d, 2, 0.05) : box(w, h, d);
  add(group, frameBox(0.12, doorH + 0.04, 0.1), frameMat, -(doorW / 2 + 0.06), doorH / 2 + y0, fz + 0.04);
  add(group, frameBox(0.12, doorH + 0.04, 0.1), frameMat, doorW / 2 + 0.06, doorH / 2 + y0, fz + 0.04);
  add(group, frameBox(doorW + 0.3, 0.14, 0.14), frameMat, 0, doorH + y0 + 0.09, fz + 0.05);
  if (snow) add(group, box(doorW + 0.34, 0.08, 0.2), snowMat, 0, doorH + 0.22, fz + 0.06);

  // The door itself, hinged on its left edge
  const pivot = new THREE.Group();
  pivot.position.set(-doorW / 2, y0, fz + 0.06);
  const doorSide = mat(pal.door);
  const back = mat(new THREE.Color(pal.door).multiplyScalar(0.55).getStyle());
  const front = new THREE.MeshStandardMaterial({ map: doorTexture(style === 'reef' ? 'reef' : style === 'machiya' ? 'shoji' : style === 'capsule' ? 'neon' : style === 'dome' ? 'space' : ['toy','treehouse'].includes(style) ? style : snow || ginger ? 'snow' : 'summer', day, pal), roughness: roundedDoor ? 0.94 : 0.7, flatShading: !roundedDoor });
  const door = new THREE.Mesh(roundedDoor ? new RoundedBoxGeometry(doorW, doorH, 0.09, 2, 0.06) : box(doorW, doorH, 0.07), [doorSide, doorSide, doorSide, doorSide, front, back]);
  door.position.set(doorW / 2, doorH / 2, 0);
  door.castShadow = true;
  pivot.add(door);
  if (roundedDoor) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), mat('#ffddb0', { roughness: 0.9, flatShading: false }));
    knob.position.set(doorW - 0.12, doorH * 0.42, 0.08); pivot.add(knob);
  }
  if (snow && (!village || day % 4 === 0)) {
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.055, 6, 14), mat('#1f6b48'));
    wreath.position.set(doorW / 2, doorH * 0.78, 0.06);
    const bow = new THREE.Mesh(box(0.14, 0.07, 0.04), mat('#d6282c'));
    bow.position.set(doorW / 2, doorH * 0.78 - 0.15, 0.09);
    const berries = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), mat('#ff3b3b', { emissive: '#ff2020', emissiveIntensity: 0.4 }));
    berries.position.set(doorW / 2 + 0.1, doorH * 0.78 + 0.08, 0.1);
    pivot.add(wreath, bow, berries);
  } else if (ginger) {
    const pep = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshStandardMaterial({ map: peppermint(), roughness: 0.3 }));
    pep.position.set(doorW / 2, doorH * 0.82, 0.04);
    pivot.add(pep);
  }
  group.add(pivot);

  // Number plaque (readable once the door is open)
  const plaque = add(group, new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: plaqueTexture(day), transparent: true }), 0, plaqueY + y0, fz + 0.012);
  plaque.userData.keep = true;

  // What's behind the door: an emoji sprite that pops out when opened
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(iconEmoji), depthWrite: false }));
  icon.position.set(0, doorH * 0.55 + y0, fz + 0.25);
  icon.scale.setScalar(0.001);
  group.add(icon);

  mergeStatic(group);
  group.traverse((o) => {
    if (o.isMesh && o !== plaque) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return {
    group,
    pivot,
    interiorMat,
    icon,
    day,
    height,
    lights,
    chimneyTop,
    doorLocal: new THREE.Vector3(0, doorH / 2 + y0, fz + 0.1),
  };
}

export { A };
