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

const DISPLAY = '900 {s}px Fraunces, Georgia, "Times New Roman", serif';
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

// Shared materials: same look => same material => fewer GPU state changes.
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (!matCache.has(key)) {
    const o = { roughness: 0.85, metalness: 0, flatShading: true, color, ...opts };
    if (o.emissive) o.emissive = new THREE.Color(o.emissive);
    const m = new THREE.MeshStandardMaterial(o);
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

/* Returns { group, pivot, interiorMat, icon, day, height, doorLocal, lights[], chimneyTop } */
export function makeHouse(theme, day, pal, iconEmoji, rng) {
  const snow = theme === 'snow';
  const W = snow ? 2.2 : 1.9;
  const H = snow ? 1.85 : 2.25;
  const D = snow ? 1.9 : 1.7;
  const RH = snow ? 1.05 + rng() * 0.35 : 0.85;
  const group = new THREE.Group();
  group.userData.day = day;
  const lights = []; // local positions for roof-edge fairy lights
  let chimneyTop = null;

  // Body
  const wallMat = snow ? mat('#ffffff', { map: plankTexture(pal.wall) }) : mat('#ffffff', { map: stripeTexture(pal) });
  add(group, box(W, H, D), wallMat, 0, H / 2, 0);
  const trimMat = mat(snow ? new THREE.Color(pal.wall).multiplyScalar(0.6).getStyle() : '#ffffff');
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => add(group, box(0.12, H, 0.12), trimMat, sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02))));
  if (snow) add(group, box(W + 0.14, 0.26, D + 0.14), mat('#7d8aa8'), 0, 0.13, 0);
  else add(group, box(W + 0.1, 0.18, D + 0.1), mat('#ffffff'), 0, 0.09, 0);

  // Gable: wall-coloured triangle ends, roof-coloured slopes (multi-material, kept separate)
  const roofMat = mat(pal.roof);
  const tri = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, RH)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: D, bevelEnabled: false }), [snow ? mat(pal.wall) : mat(pal.wall2 || '#ffffff'), roofMat]);
  gable.position.set(0, H, -D / 2);
  group.add(gable);

  // Roof panels with overhang (+ snow layer, icicles, fairy lights along the front eaves)
  const a = Math.atan2(RH, W / 2);
  const L = Math.hypot(W / 2, RH) + 0.32;
  const snowMat = mat('#f4f8ff', { roughness: 1 });
  const iceMat = mat('#d8f1ff', { roughness: 0.2, metalness: 0.1 });
  [-1, 1].forEach((side) => {
    const nx = side * Math.sin(a), ny = Math.cos(a);
    const px = (side * W) / 4 + side * 0.06, py = H + RH / 2;
    add(group, box(L, 0.14, D + 0.42), roofMat, px + nx * 0.07, py + ny * 0.07, 0, 0, 0, -side * a);
    if (snow) {
      add(group, box(L * 0.97, 0.16, D + 0.38), snowMat, px + nx * 0.2, py + ny * 0.2, 0, 0, 0, -side * a);
      // icicles along the side eaves
      const ex = side * (W / 2 + 0.26), ey = H - 0.12;
      for (let k = 0; k < 6; k++) {
        const h = 0.18 + rng() * 0.32;
        add(group, new THREE.ConeGeometry(0.035, h, 5), iceMat, ex, ey - h / 2, -D / 2 - 0.1 + (k + 0.5) * ((D + 0.2) / 6), Math.PI, 0, 0);
      }
    } else {
      // white fascia along the front edge of each slope
      add(group, box(L, 0.08, 0.06), mat('#ffffff'), px + nx * 0.1, py + ny * 0.1, D / 2 + 0.22, 0, 0, -side * a);
    }
    // fairy lights along the front edge of this slope
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      const x = side * (W / 2 + 0.2) * (1 - t);
      const y = H - 0.02 + RH * t + (snow ? -0.06 : -0.05);
      if (side === 1 && k === 5) continue; // apex shared
      lights.push(new THREE.Vector3(x, y, D / 2 + 0.24));
    }
  });

  if (snow && rng() < 0.45) {
    const cx = W * 0.24, cy = H + RH * 0.55, cz = -D * 0.15;
    add(group, box(0.34, 0.9, 0.34), mat('#7a3b33'), cx, cy, cz);
    add(group, box(0.44, 0.12, 0.44), mat('#4a2420'), cx, cy + 0.42, cz);
    add(group, box(0.4, 0.1, 0.4), snowMat, cx, cy + 0.52, cz);
    chimneyTop = new THREE.Vector3(cx, cy + 0.6, cz);
  }

  // Door opening: glowing interior + frame
  const doorW = snow ? 0.82 : 0.8;
  const doorH = snow ? 1.3 : 1.45;
  const fz = D / 2;
  const interiorMat = new THREE.MeshStandardMaterial({ color: '#24140c', emissive: new THREE.Color('#ffae4a'), emissiveIntensity: 0, flatShading: true });
  const interior = add(group, box(doorW, doorH, 0.04), interiorMat, 0, doorH / 2 + 0.02, fz + 0.01);
  interior.userData.keep = true;
  const frameMat = mat(snow ? '#4a2c1f' : '#ffffff');
  add(group, box(0.12, doorH + 0.04, 0.1), frameMat, -(doorW / 2 + 0.06), doorH / 2 + 0.02, fz + 0.04);
  add(group, box(0.12, doorH + 0.04, 0.1), frameMat, doorW / 2 + 0.06, doorH / 2 + 0.02, fz + 0.04);
  add(group, box(doorW + 0.3, 0.14, 0.14), frameMat, 0, doorH + 0.11, fz + 0.05);
  if (snow) add(group, box(doorW + 0.34, 0.08, 0.2), snowMat, 0, doorH + 0.22, fz + 0.06);

  // The door itself, hinged on its left edge
  const pivot = new THREE.Group();
  pivot.position.set(-doorW / 2, 0.02, fz + 0.06);
  const doorSide = mat(pal.door);
  const back = mat(new THREE.Color(pal.door).multiplyScalar(0.55).getStyle());
  const front = new THREE.MeshStandardMaterial({ map: doorTexture(theme, day, pal), roughness: 0.7, flatShading: true });
  const door = new THREE.Mesh(box(doorW, doorH, 0.07), [doorSide, doorSide, doorSide, doorSide, front, back]);
  door.position.set(doorW / 2, doorH / 2, 0);
  door.castShadow = true;
  pivot.add(door);
  if (snow) {
    // wreath with a red bow
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.055, 6, 14), mat('#1f6b48'));
    wreath.position.set(doorW / 2, doorH * 0.78, 0.06);
    const bow = new THREE.Mesh(box(0.14, 0.07, 0.04), mat('#d6282c'));
    bow.position.set(doorW / 2, doorH * 0.78 - 0.15, 0.09);
    const berries = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), mat('#ff3b3b', { emissive: '#ff2020', emissiveIntensity: 0.4 }));
    berries.position.set(doorW / 2 + 0.1, doorH * 0.78 + 0.08, 0.1);
    pivot.add(wreath, bow, berries);
  }
  group.add(pivot);

  if (!snow) {
    // little deck steps up to the door
    add(group, box(doorW + 0.5, 0.12, 0.35), mat('#d9a36a'), 0, 0.06, fz + 0.25);
    add(group, box(doorW + 0.5, 0.12, 0.25), mat('#c98d55'), 0, -0.04, fz + 0.5);
  }

  // Number plaque (readable once the door is open)
  const plaque = add(group, new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: plaqueTexture(day), transparent: true }), 0, doorH + (snow ? 0.42 : 0.36), fz + 0.012);
  plaque.userData.keep = true;

  if (snow) {
    // framed, glowing windows with snowy sills
    const winMat = mat('#ffd77a', { emissive: '#ffc65c', emissiveIntensity: 1.7 });
    const wf = mat('#3b2418');
    [-1, 1].forEach((s) => {
      const x = s * (W / 2 - 0.37), y = 1.22;
      add(group, new THREE.PlaneGeometry(0.34, 0.4), winMat, x, y, fz + 0.012);
      add(group, box(0.44, 0.05, 0.06), wf, x, y + 0.22, fz + 0.03);
      add(group, box(0.05, 0.44, 0.06), wf, x - 0.2, y, fz + 0.03);
      add(group, box(0.05, 0.44, 0.06), wf, x + 0.2, y, fz + 0.03);
      add(group, box(0.04, 0.4, 0.04), wf, x, y, fz + 0.03);
      add(group, box(0.36, 0.04, 0.04), wf, x, y, fz + 0.03);
      add(group, box(0.5, 0.06, 0.16), snowMat, x, y - 0.23, fz + 0.06);
    });
    const pile = add(group, new THREE.SphereGeometry(1, 9, 5), snowMat, 0, 0, fz + 0.15);
    pile.scale.set(W * 0.75, 0.22, 0.6);
    pile.updateMatrix();
  } else {
    add(group, new THREE.CircleGeometry(0.17, 16), mat('#ffffff', { emissive: '#fff3c4', emissiveIntensity: 0.35 }), 0, H + RH * 0.42, D / 2 + 0.01);
    add(group, new THREE.TorusGeometry(0.18, 0.03, 5, 16), mat('#ffffff'), 0, H + RH * 0.42, D / 2 + 0.02);
    // ship's lantern beside the door
    add(group, box(0.16, 0.22, 0.16), mat('#2a2140'), doorW / 2 + 0.3, 1.25, fz + 0.1);
    add(group, box(0.11, 0.15, 0.17), mat('#ffd36b', { emissive: '#ffb347', emissiveIntensity: 2.2 }), doorW / 2 + 0.3, 1.25, fz + 0.11);
    if (rng() < 0.45) {
      // a surfboard leaning on the side
      const sb = add(group, new THREE.CapsuleGeometry(0.2, 1.5, 3, 8), mat(['#ff6f91', '#ffd23f', '#2ec4b6', '#6a8cff'][(rng() * 4) | 0]), W / 2 + 0.16, 0.95, fz - 0.35, 0, 0, 0.18);
      sb.scale.set(1, 1, 0.22);
      sb.updateMatrix();
    }
    if (rng() < 0.4) {
      const pole = add(group, new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), mat('#6b4b3e'), 0, H + RH + 0.42, 0);
      pole.userData.keep = false;
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24), new THREE.MeshStandardMaterial({ color: pal.door, side: THREE.DoubleSide }));
      flag.geometry.translate(0.21, 0, 0);
      flag.position.set(0.02, H + RH + 0.74, 0);
      flag.userData.wave = rng() * 6;
      flag.userData.keep = true;
      group.add(flag);
      group.userData.flag = flag;
    }
  }

  // What's behind the door: an emoji sprite that pops out when opened
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(iconEmoji), depthWrite: false }));
  icon.position.set(0, doorH * 0.55, fz + 0.25);
  icon.scale.setScalar(0.001);
  group.add(icon);

  // Scaled meshes need their matrices baked before merging.
  group.children.forEach((o) => { if (o.isMesh) o.updateMatrix(); });
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
    height: H + RH,
    lights,
    chimneyTop,
    doorLocal: new THREE.Vector3(0, doorH / 2, fz + 0.1),
  };
}

export { A };
