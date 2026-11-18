/* Low-poly 3D houses (snow cottages / summer beach boxes) with a hinged, numbered door.
   Static parts are merged per material after building, so 24 detailed houses stay cheap to draw. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
    g.fillStyle = '#b8743d';
    g.fillRect(0, 0, w, h);
    const r = A.rng(12);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = ['#a05f2c', '#c98a4f', '#8c5126'][(r() * 3) | 0];
      g.globalAlpha = 0.5;
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

const STYLE_OF = { snow: 'cottage', summer: 'beachbox', gingerbread: 'gingerbread', toys: 'toy', space: 'dome', workshop: 'cottage', jungle: 'treehouse', japan: 'machiya', cyber: 'capsule' };

const thatchCache = { t: null };
function thatchTexture() {
  if (thatchCache.t) return thatchCache.t;
  const t = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#a5843f';
    g.fillRect(0, 0, w, h);
    const r = A.rng(8);
    for (let i = 0; i < 420; i++) {
      g.strokeStyle = ['#8a6a2e', '#c9a35b', '#7d5f27', '#d8b878'][(r() * 4) | 0];
      g.lineWidth = 1 + r() * 1.5;
      const x = r() * w, y = r() * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y + 10 + r() * 14); g.stroke();
    }
    g.fillStyle = 'rgba(60,35,10,.35)';
    for (let y = 30; y < h; y += 32) g.fillRect(0, y, w, 3);
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

/* Returns { group, pivot, interiorMat, icon, day, height, doorLocal, lights[], chimneyTop } */
export function makeHouse(theme, day, pal, iconEmoji, rng) {
  const style = STYLE_OF[theme] || 'cottage';
  const snow = style === 'cottage';
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
    const W = snow ? 2.2 : ginger ? 2.1 : 1.9;
    const H = snow ? 1.85 : ginger ? 1.8 : 2.25;
    const D = snow ? 1.9 : ginger ? 1.85 : 1.7;
    const RH = snow ? 1.05 + rng() * 0.35 : ginger ? 1.0 + rng() * 0.3 : 0.85;
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
    if (snow) add(group, box(W + 0.14, 0.26, D + 0.14), mat('#7d8aa8'), 0, 0.13, 0);
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
        for (let k = 0; k < 6; k++) {
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
      for (let k = 0; k <= 5; k++) {
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
      const winMat = ginger ? mat('#ffd0e6', { emissive: '#ff9ccc', emissiveIntensity: 1.5 }) : mat('#ffd77a', { emissive: '#ffc65c', emissiveIntensity: 1.7 });
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
    // ---- Wooden toy house: painted block, pyramid roof (or castle top), round windows ----
    const W = 2.0, H = 1.9, D = 1.8;
    fz = D / 2;
    doorW = 0.8;
    doorH = 1.3;
    plaqueY = doorH + 0.36;
    const paint = mat(pal.wall, { roughness: 0.45 });
    add(group, box(W, H, D), paint, 0, H / 2 + 0.25, 0);
    add(group, box(W + 0.24, 0.3, D + 0.24), mat('#d9a86a', { roughness: 0.6 }), 0, 0.15, 0);
    const kind = rng();
    if (kind < 0.28) {
      // castle top with crenellations and a pennant
      add(group, box(W + 0.2, 0.22, D + 0.2), mat(pal.roof, { roughness: 0.45 }), 0, H + 0.36, 0);
      for (let i = 0; i < 4; i++) {
        const x = -W / 2 + 0.15 + (i * (W - 0.3)) / 3;
        add(group, box(0.28, 0.3, 0.28), mat(pal.roof, { roughness: 0.45 }), x, H + 0.62, D / 2 - 0.05);
        add(group, box(0.28, 0.3, 0.28), mat(pal.roof, { roughness: 0.45 }), x, H + 0.62, -D / 2 + 0.05);
      }
      add(group, new THREE.CylinderGeometry(0.03, 0.03, 1.0, 5), mat('#6b4b3e'), 0, H + 0.95, 0);
      const fl = add(group, new THREE.ConeGeometry(0.16, 0.5, 3), mat(pal.door), 0.25, H + 1.3, 0, 0, 0, -Math.PI / 2);
      fl.scale.set(1, 1, 0.2);
      height = H + 1.5;
      for (let k = 0; k <= 6; k++) lights.push(new THREE.Vector3(-W / 2 - 0.1 + (k * (W + 0.2)) / 6, H + 0.48, D / 2 + 0.13));
    } else {
      const RH = 1.2;
      const roof = add(group, new THREE.ConeGeometry(((Math.max(W, D) + 0.3) / 2) * Math.SQRT2, RH, 4), mat(pal.roof, { roughness: 0.45 }), 0, H + 0.25 + RH / 2, 0, 0, Math.PI / 4, 0);
      roof.scale.set(1, 1, D / W);
      add(group, new THREE.SphereGeometry(0.16, 10, 8), mat(pal.door, { roughness: 0.3 }), 0, H + 0.25 + RH + 0.1, 0);
      height = H + 0.25 + RH + 0.25;
      for (let k = 0; k <= 6; k++) lights.push(new THREE.Vector3(-W / 2 - 0.12 + (k * (W + 0.24)) / 6, H + 0.22, D / 2 + 0.18));
      if (kind > 0.7) {
        // a little round tower at the side
        add(group, new THREE.CylinderGeometry(0.34, 0.34, H + 0.7, 14), mat(pal.roof, { roughness: 0.45 }), W / 2 + 0.12, (H + 0.7) / 2, -0.25);
        add(group, new THREE.ConeGeometry(0.45, 0.8, 14), mat(pal.door, { roughness: 0.45 }), W / 2 + 0.12, H + 0.7 + 0.4, -0.25);
      }
    }
    // round painted windows
    [-1, 1].forEach((s) => {
      add(group, new THREE.CircleGeometry(0.2, 18), mat('#cfeeff', { emissive: '#9fdcff', emissiveIntensity: 0.9 }), s * (W / 2 - 0.4), 1.5, fz + 0.012);
      add(group, new THREE.TorusGeometry(0.21, 0.045, 6, 18), mat('#ffffff', { roughness: 0.4 }), s * (W / 2 - 0.4), 1.5, fz + 0.03);
    });
  } else if (style === 'treehouse') {
    // ---- Jungle: round bamboo hut on stilts, thatched cone roof, ladder and a lantern ----
    const Rb = 0.95, Hb = 1.6;
    lift = 0.85;
    doorW = 0.72;
    doorH = 1.12;
    fz = Rb + 0.04;
    plaqueY = doorH + 0.2;
    height = lift + Hb + 1.55;
    const wood = mat('#6b4527');
    const darkWood = mat('#4a2f1a');
    [[-0.68, -0.6], [0.68, -0.6], [-0.68, 0.62], [0.68, 0.62]].forEach(([x, z]) => add(group, new THREE.CylinderGeometry(0.08, 0.1, lift, 6), wood, x, lift / 2, z));
    add(group, box(2.35, 0.12, 2.3), darkWood, 0, lift - 0.06, 0.08);
    // railing either side of the door
    [-1, 1].forEach((s) => {
      add(group, box(0.6, 0.06, 0.06), wood, s * 0.86, lift + 0.42, 1.2);
      [0.6, 1.12].forEach((x) => add(group, box(0.06, 0.44, 0.06), wood, s * x, lift + 0.22, 1.2));
    });
    add(group, new THREE.CylinderGeometry(Rb, Rb * 1.02, Hb, 12), mat('#ffffff', { map: stripeTexture(pal) }), 0, lift + Hb / 2, 0);
    add(group, box(doorW + 0.36, doorH + 0.42, 0.14), mat(pal.wall2), 0, lift + (doorH + 0.42) / 2, Rb - 0.05);
    // thatch
    const roofH = 1.45;
    add(group, new THREE.ConeGeometry(1.6, roofH, 12, 1, false), mat('#ffffff', { map: thatchTexture() }), 0, lift + Hb + roofH / 2 - 0.12, 0);
    add(group, new THREE.ConeGeometry(0.32, 0.45, 8), mat('#7d5f27'), 0, lift + Hb + roofH - 0.05, 0);
    add(group, new THREE.TorusGeometry(1.52, 0.07, 5, 24), mat('#8a6a2e'), 0, lift + Hb - 0.1, 0, Math.PI / 2, 0, 0);
    // leaves tucked under the roof edge
    const leaf = mat('#2f8a4e');
    [-1.1, -0.2, 0.75].forEach((ang, k) => {
      const l = add(group, new THREE.SphereGeometry(0.34, 7, 5), k % 2 ? mat('#3fa35e') : leaf, Math.sin(ang) * 1.45, lift + Hb - 0.15, Math.cos(ang) * 1.45, 0, ang, 0.4);
      l.scale.set(1.4, 0.35, 0.7);
    });
    // round windows
    [-0.95, 0.95].forEach((ang) => {
      add(group, new THREE.CircleGeometry(0.19, 14), mat('#ffd77a', { emissive: '#ffb347', emissiveIntensity: 1.7 }), Math.sin(ang) * (Rb + 0.02), lift + 1.05, Math.cos(ang) * (Rb + 0.02), 0, ang, 0);
      add(group, new THREE.TorusGeometry(0.2, 0.04, 5, 14), darkWood, Math.sin(ang) * (Rb + 0.04), lift + 1.05, Math.cos(ang) * (Rb + 0.04), 0, ang, 0);
    });
    // ladder down to the terrace
    const lx = rng() < 0.5 ? -1.0 : 1.0;
    [-0.18, 0.18].forEach((o) => add(group, box(0.05, lift + 0.25, 0.05), wood, lx + o, lift / 2, 1.42, 0.3, 0, 0));
    for (let k = 0; k < 3; k++) add(group, box(0.4, 0.04, 0.05), wood, lx, 0.2 + k * 0.28, 1.5 - k * 0.08);
    // a lantern hanging from the eaves
    const lang = rng() < 0.5 ? -0.55 : 0.55;
    add(group, new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), darkWood, Math.sin(lang) * 1.35, lift + Hb - 0.3, Math.cos(lang) * 1.35);
    add(group, new THREE.SphereGeometry(0.13, 10, 8), mat('#ffb347', { emissive: '#ff9a2a', emissiveIntensity: 2.6 }), Math.sin(lang) * 1.35, lift + Hb - 0.5, Math.cos(lang) * 1.35);
    for (let k = 0; k < 11; k++) {
      const ang = -1.3 + (k * 2.6) / 10;
      lights.push(new THREE.Vector3(Math.sin(ang) * 1.55, lift + Hb - 0.08, Math.cos(ang) * 1.55));
    }
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
    add(group, box(W * 0.85, H2, D * 0.9), mat(pal.wall2, { metalness: 0.15, roughness: 0.7, emissive: pal.wall2, emissiveIntensity: 0.22 }), up * 0.15, H + 0.2 + H2 / 2, -0.1, 0, up * 0.08, 0);
    const winM = mat('#ffffff', { emissive: pal.roof, emissiveIntensity: 1.6, transparent: true, opacity: 0.95 });
    add(group, new THREE.PlaneGeometry(W * 0.62, 0.42), winM, up * 0.15, H + 0.2 + H2 * 0.55, D * 0.45 - 0.08);
    // neon trim along the front edges
    const trim = neon(pal.roof);
    // a full neon outline round the front, plus an under-glow strip so every house reads from afar
    add(group, box(W + 0.08, 0.08, 0.08), trim, 0, H + 0.2, fz + 0.03);
    add(group, box(W + 0.08, 0.08, 0.08), trim, 0, 0.24, fz + 0.03);
    add(group, box(0.08, H, 0.08), trim, -W / 2, H / 2 + 0.2, fz + 0.03);
    add(group, box(0.08, H, 0.08), trim, W / 2, H / 2 + 0.2, fz + 0.03);
    add(group, box(W * 0.85 + 0.06, 0.07, 0.07), trim, up * 0.15, H + 0.2 + H2, D * 0.45 - 0.06);
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
    add(group, box(doorW + 0.5, 0.06, 0.5), dark, 0, doorH + 0.5, fz + 0.25, 0.15, 0, 0);
    add(group, box(doorW + 0.5, 0.04, 0.04), neon(pal.ink), 0, doorH + 0.45, fz + 0.5);
    height = H + 0.2 + H2 + 1.3;
    for (let k = 0; k <= 6; k++) lights.push(new THREE.Vector3(-W / 2 + (k * W) / 6, H + 0.26, fz + 0.06));
  } else {
    // ---- Space: a moon-base dome with an airlock porch ----
    const Rb = 1.1, Hc = 1.5;
    doorW = 0.78;
    doorH = 1.25;
    fz = Rb + 0.55;
    plaqueY = doorH + 0.2;
    height = Hc + Rb;
    const metal = mat('#e9edf6', { metalness: 0.35, roughness: 0.4, flatShading: false });
    add(group, new THREE.CylinderGeometry(Rb + 0.15, Rb + 0.25, 0.22, 24), mat('#5d6478', { metalness: 0.4, roughness: 0.5 }), 0, 0.11, 0);
    add(group, new THREE.CylinderGeometry(Rb, Rb * 1.04, Hc, 28), metal, 0, Hc / 2 + 0.1, 0);
    add(group, new THREE.TorusGeometry(Rb + 0.02, 0.07, 8, 32), mat(pal.wall, { roughness: 0.4 }), 0, Hc + 0.1, 0, Math.PI / 2, 0, 0);
    add(group, new THREE.SphereGeometry(Rb, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(pal.roof, { metalness: 0.2, roughness: 0.15, emissive: pal.roof, emissiveIntensity: 0.18, flatShading: false }), 0, Hc + 0.1, 0);
    // airlock porch
    add(group, box(doorW + 0.42, doorH + 0.34, 0.62), mat('#d5dae6', { metalness: 0.3, roughness: 0.45 }), 0, (doorH + 0.34) / 2 + 0.1, Rb + 0.22);
    add(group, box(doorW + 0.5, 0.1, 0.7), mat(pal.wall, { roughness: 0.4 }), 0, doorH + 0.5, Rb + 0.22);
    // antenna with a red beacon
    add(group, new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6), mat('#8a93a8'), 0.45, Hc + Rb * 0.7 + 0.45, -0.25);
    add(group, new THREE.SphereGeometry(0.08, 8, 6), mat('#ff4f5e', { emissive: '#ff2030', emissiveIntensity: 2.6 }), 0.45, Hc + Rb * 0.7 + 0.92, -0.25);
    // portholes on the curved wall
    [-0.85, 0.85].forEach((ang) => {
      add(group, new THREE.CircleGeometry(0.2, 18), mat('#9ff4ff', { emissive: '#4fe0ff', emissiveIntensity: 1.6 }), Math.sin(ang) * (Rb + 0.01), 1.05, Math.cos(ang) * (Rb + 0.01), 0, ang, 0);
      add(group, new THREE.TorusGeometry(0.21, 0.04, 6, 18), mat('#8a93a8', { metalness: 0.5 }), Math.sin(ang) * (Rb + 0.03), 1.05, Math.cos(ang) * (Rb + 0.03), 0, ang, 0);
    });
    for (let k = 0; k < 11; k++) {
      const ang = -1.35 + (k * 2.7) / 10;
      lights.push(new THREE.Vector3(Math.sin(ang) * (Rb + 0.1), Hc + 0.2, Math.cos(ang) * (Rb + 0.1)));
    }
  }

  // ---- Door opening: glowing interior + frame (all styles) ----
  const interiorMat = new THREE.MeshStandardMaterial({ color: '#24140c', emissive: new THREE.Color(style === 'dome' ? '#7af7ff' : '#ffae4a'), emissiveIntensity: 0, flatShading: true });
  const y0 = lift !== null ? lift : style === 'toy' ? 0.3 : style === 'capsule' ? 0.2 : 0.02;
  const interior = add(group, box(doorW, doorH, 0.04), interiorMat, 0, doorH / 2 + y0, fz + 0.01);
  interior.userData.keep = true;
  const frameMat = style === 'capsule' ? mat('#2a2d40', { metalness: 0.5 }) : snow || style === 'machiya' || style === 'treehouse' ? mat(style === 'treehouse' ? '#4a2f1a' : '#3a2a22') : style === 'dome' ? mat('#8a93a8', { metalness: 0.4 }) : ginger ? icingMat : mat('#ffffff');
  add(group, box(0.12, doorH + 0.04, 0.1), frameMat, -(doorW / 2 + 0.06), doorH / 2 + y0, fz + 0.04);
  add(group, box(0.12, doorH + 0.04, 0.1), frameMat, doorW / 2 + 0.06, doorH / 2 + y0, fz + 0.04);
  add(group, box(doorW + 0.3, 0.14, 0.14), frameMat, 0, doorH + y0 + 0.09, fz + 0.05);
  if (snow) add(group, box(doorW + 0.34, 0.08, 0.2), snowMat, 0, doorH + 0.22, fz + 0.06);

  // The door itself, hinged on its left edge
  const pivot = new THREE.Group();
  pivot.position.set(-doorW / 2, y0, fz + 0.06);
  const doorSide = mat(pal.door);
  const back = mat(new THREE.Color(pal.door).multiplyScalar(0.55).getStyle());
  const front = new THREE.MeshStandardMaterial({ map: doorTexture(style === 'machiya' ? 'shoji' : style === 'capsule' ? 'neon' : snow || ginger ? 'snow' : 'summer', day, pal), roughness: 0.7, flatShading: true });
  const door = new THREE.Mesh(box(doorW, doorH, 0.07), [doorSide, doorSide, doorSide, doorSide, front, back]);
  door.position.set(doorW / 2, doorH / 2, 0);
  door.castShadow = true;
  pivot.add(door);
  if (snow) {
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
