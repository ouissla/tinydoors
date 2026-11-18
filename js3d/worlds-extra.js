/* The three premium worlds: Gingerbread Lane, Toy Town and Space Christmas.
   Surface textures, the light-tree for each, and their scenery. Shared helpers are passed in
   (ctx) so this module doesn't need to import back from worlds.js. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, mat } from './houses.js';

const A = window.Advent;
const TAU = Math.PI * 2;
const polar = (r, th) => [r * Math.sin(th), -r * Math.cos(th)];

function tex(w, h, draw, repeat) {
  const t = canvasTexture(w, h, draw);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat, repeat);
  t.userData.shared = true;
  return t;
}

// ---------------- Surface textures ----------------
export const icingTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#fff6fa';
  g.fillRect(0, 0, w, h);
  const r = A.rng(31);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = ['#ffffff', '#ffe6f0', '#fbeff5'][(r() * 3) | 0];
    g.globalAlpha = 0.6;
    g.fillRect(r() * w, r() * h, 2, 2);
  }
  g.globalAlpha = 1;
  // sprinkles
  for (let i = 0; i < 70; i++) {
    g.save();
    g.translate(r() * w, r() * h);
    g.rotate(r() * TAU);
    g.fillStyle = ['#ff6fa3', '#7cf29a', '#ffd23f', '#6fc9ff', '#c77dff'][(r() * 5) | 0];
    g.fillRect(-4, -1.2, 8, 2.4);
    g.restore();
  }
}, 1 / 10);

export const biscuitTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#b8743d';
  g.fillRect(0, 0, w, h);
  const r = A.rng(77);
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = ['#a05f2c', '#c98a4f', '#8c5126', '#d49a5e'][(r() * 4) | 0];
    g.globalAlpha = 0.45;
    g.beginPath();
    g.arc(r() * w, r() * h, 1 + r() * 2.2, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  // icing piping lines (bricks)
  g.strokeStyle = 'rgba(255,255,255,.75)';
  g.lineWidth = 3;
  for (let y = 32; y < h; y += 64) {
    g.beginPath();
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.4) * 3);
    g.stroke();
  }
}, 0.4);

export const blockTex = tex(256, 256, (g, w, h) => {
  const cols = ['#e2483d', '#3f7be0', '#ffd23f', '#2f9e5b', '#ff8a2b', '#9b5de5'];
  const r = A.rng(5);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = cols[(r() * cols.length) | 0];
    g.fillRect(x * 64, y * 64, 64, 64);
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.fillRect(x * 64 + 4, y * 64 + 4, 56, 6);
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(x * 64, y * 64 + 58, 64, 6);
    g.fillRect(x * 64 + 58, y * 64, 6, 64);
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.font = '900 34px Nunito, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ABCDEFGHJKLMNOPRSTUVWXYZ'[(r() * 24) | 0], x * 64 + 31, y * 64 + 34);
  }
}, 0.35);

export const moonTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#9b9aa8';
  g.fillRect(0, 0, w, h);
  const r = A.rng(42);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = ['#8a8997', '#aeadba', '#7d7c8a', '#c2c1cc'][(r() * 4) | 0];
    g.globalAlpha = 0.5;
    g.fillRect(r() * w, r() * h, 2, 2);
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 14; i++) {
    const x = r() * w, y = r() * h, rad = 4 + r() * 16;
    g.strokeStyle = 'rgba(255,255,255,.25)';
    g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.beginPath(); g.arc(x + 1, y + 1, rad * 0.8, 0, TAU); g.fill();
  }
}, 1 / 12);

export const panelTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#5d6478';
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 128) {
    g.fillStyle = (x + y) % 256 ? '#666e84' : '#58607a';
    g.fillRect(x + 2, y + 2, 124, 60);
    g.fillStyle = '#aab3c9';
    [[8, 8], [116, 8], [8, 54], [116, 54]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a, y + b, 3, 0, TAU); g.fill(); });
  }
  g.fillStyle = '#7af7ff';
  g.globalAlpha = 0.6;
  for (let y = 30; y < h; y += 128) g.fillRect(0, y, w, 3);
}, 0.4);

export const mossTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#3f8a4e';
  g.fillRect(0, 0, w, h);
  const r = A.rng(61);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = ['#357a43', '#4c9a58', '#2f6d3c', '#5aa863', '#6b8a3a'][(r() * 5) | 0];
    g.globalAlpha = 0.6;
    g.beginPath();
    g.ellipse(r() * w, r() * h, 1.5 + r() * 3, 0.8 + r() * 1.5, r() * TAU, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  // tiny flowers
  for (let i = 0; i < 40; i++) {
    g.fillStyle = ['#ff6f4a', '#ffd23f', '#ff8ad8', '#ffffff'][(r() * 4) | 0];
    g.beginPath(); g.arc(r() * w, r() * h, 1.6, 0, TAU); g.fill();
  }
}, 1 / 10);

export const rockTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#6d6a5e';
  g.fillRect(0, 0, w, h);
  const r = A.rng(19);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = ['#5f5c52', '#7a7768', '#686456', '#837f6e'][(r() * 4) | 0];
    g.beginPath();
    g.ellipse(r() * w, r() * h, 14 + r() * 26, 8 + r() * 14, r() * TAU, 0, TAU);
    g.fill();
  }
  // moss creeping down from the top
  for (let i = 0; i < 900; i++) {
    const y = Math.pow(r(), 2.2) * h * 0.6;
    g.fillStyle = ['#3f8a4e', '#2f6d3c', '#5aa863'][(r() * 3) | 0];
    g.globalAlpha = 0.7;
    g.fillRect(r() * w, y, 3, 3);
  }
  g.globalAlpha = 1;
}, 0.4);

export const gridTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#14121f';
  g.fillRect(0, 0, w, h);
  const r = A.rng(13);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = ['#1b1828', '#100e19', '#1f1b2e'][(r() * 3) | 0];
    g.fillRect(r() * w, r() * h, 3, 3);
  }
  // wet puddles catching neon
  for (let i = 0; i < 7; i++) {
    const x = r() * w, y = r() * h;
    const gr = g.createRadialGradient(x, y, 0, x, y, 20 + r() * 26);
    gr.addColorStop(0, ['rgba(255,43,214,.35)', 'rgba(0,229,255,.35)', 'rgba(124,77,255,.3)'][i % 3]);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }
  g.strokeStyle = 'rgba(0,229,255,.28)';
  g.lineWidth = 2;
  for (let k = 0; k <= w; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(w, k); g.stroke(); }
}, 1 / 8);

// Tappable props and spark bursts, shared by the worlds that have them.
function makeFx({ root, updaters, glowSprite, tappables }) {
  const sparks = [];
  updaters.push((t, dt) => {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life -= dt;
      if (p.life <= 0) { root.remove(p.s); p.s.material.dispose(); sparks.splice(i, 1); continue; }
      p.v.y -= 7 * dt * p.g;
      p.s.position.addScaledVector(p.v, dt);
      p.s.material.opacity = Math.min(1, p.life * 1.4);
    }
  });
  return {
    burst(pos, colors, n = 18, speed = 4, size = 0.5, g = 1) {
      for (let i = 0; i < n; i++) {
        const sp = glowSprite(colors[i % colors.length], size * (0.6 + Math.random() * 0.8), 1);
        sp.position.copy(pos);
        root.add(sp);
        sparks.push({ s: sp, life: 0.9 + Math.random() * 0.7, g, v: new THREE.Vector3((Math.random() - 0.5) * speed, speed * (0.5 + Math.random()), (Math.random() - 0.5) * speed) });
      }
    },
    tappable(obj, onPoke, update) {
      const a = { m: { root: obj, kind: 'prop' }, busy: 0, poke() { onPoke(a); }, update(dt, t) { a.busy = Math.max(0, a.busy - dt); if (update) update(dt, t, a); } };
      obj.userData.agent = a;
      (tappables || []).push(a);
      return a;
    },
    sound() { if (A.Sound) { A.Sound.init(); return A.Sound; } return null; },
  };
}
const part = (parent, geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; parent.add(o); return o; };

// ---------------- Tron-style vehicles (Neon City) ----------------
const neonMat = (c, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
const glossBlack = () => new THREE.MeshStandardMaterial({ color: '#0b0c14', metalness: 0.8, roughness: 0.18 });
function glowWheel(parent, r, w, color, x, y, z) {
  const wh = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 20), glossBlack());
  disc.rotation.z = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, r * 0.09, 6, 24), neonMat(color));
  rim.rotation.y = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.TorusGeometry(r * 0.35, r * 0.06, 5, 16), neonMat(color, 1.6));
  hub.rotation.y = Math.PI / 2;
  wh.add(disc, rim, hub);
  wh.position.set(x, y, z);
  parent.add(wh);
  return wh;
}
// Light cycle: two glowing wheels, a wedge body and a rider tucked low. Faces +z.
function makeLightCycle(color) {
  const g = new THREE.Group();
  const wheels = [glowWheel(g, 0.42, 0.22, color, 0, 0.42, 0.95), glowWheel(g, 0.42, 0.22, color, 0, 0.42, -0.95)];
  const shell = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.5, 4, 10), glossBlack());
  shell.rotation.x = Math.PI / 2;
  shell.position.set(0, 0.62, 0);
  shell.scale.set(0.9, 1, 0.75);
  g.add(shell);
  [-1, 1].forEach((s) => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 1.7), neonMat(color));
    stripe.position.set(s * 0.25, 0.62, 0);
    g.add(stripe);
  });
  const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), glossBlack());
  rider.position.set(0, 0.95, -0.15);
  rider.rotation.x = 1.1;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), glossBlack());
  helmet.position.set(0, 1.12, 0.3);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.05), neonMat(color));
  visor.position.set(0, 1.13, 0.46);
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.55), neonMat(color));
  spine.position.set(0, 1.08, -0.05);
  spine.rotation.x = 0.45;
  g.add(rider, helmet, visor, spine);
  g.userData.wheels = wheels;
  return g;
}
// Light car: a low glossy wedge with a tinted canopy, neon edges and glowing wheels. Faces +z.
function makeLightCar(color) {
  const g = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.5, 0.45, 3.0, 1, 1, 2);
  const bp = bodyGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) if (bp.getZ(i) > 1 && bp.getY(i) > 0) bp.setY(i, bp.getY(i) - 0.2); // sloped nose
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, glossBlack());
  body.position.y = 0.55;
  g.add(body);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1a2a3a', metalness: 0.9, roughness: 0.05, emissive: color, emissiveIntensity: 0.15 }));
  canopy.scale.set(0.95, 0.7, 1.7);
  canopy.position.set(0, 0.76, -0.2);
  g.add(canopy);
  [-1, 1].forEach((s) => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 3.0), neonMat(color));
    edge.position.set(s * 0.77, 0.6, 0);
    g.add(edge);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.6), neonMat(color, 1.6));
    top.position.set(s * 0.45, 0.8, -0.6);
    g.add(top);
  });
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.05), neonMat('#ffffff', 2.4));
  nose.position.set(0, 0.48, 1.52);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.05), neonMat(color, 2.6));
  tail.position.set(0, 0.62, -1.52);
  g.add(nose, tail);
  const wheels = [];
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => wheels.push(glowWheel(g, 0.32, 0.25, color, sx * 0.72, 0.32, sz * 1.0))));
  g.userData.wheels = wheels;
  return g;
}
// A Tron light wall: a ribbon that follows a vehicle and fades towards its tail.
function makeTrail(color, height, n = 56) {
  const pos = new Float32Array(n * 2 * 3), col = new Float32Array(n * 2 * 3);
  const c = new THREE.Color(color).multiplyScalar(1.8);
  for (let i = 0; i < n; i++) {
    const f = Math.pow(1 - i / (n - 1), 1.4);
    col.set([c.r * f, c.g * f, c.b * f, c.r * f * 0.5, c.g * f * 0.5, c.b * f * 0.5], i * 6);
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  mesh.frustumCulled = false;
  const hist = [];
  return {
    mesh,
    push(p) {
      hist.unshift(p.clone());
      if (hist.length > n) hist.pop();
      for (let i = 0; i < n; i++) {
        const q = hist[Math.min(i, hist.length - 1)];
        pos.set([q.x, q.y + 0.08, q.z, q.x, q.y + height, q.z], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

const caneStripe = tex(64, 64, (g, w, h) => {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#e2283a';
  for (let k = -2; k < 4; k++) {
    g.beginPath();
    g.moveTo(k * 32, 0); g.lineTo(k * 32 + 16, 0); g.lineTo(k * 32 + 16 + 64, h); g.lineTo(k * 32 + 64, h);
    g.fill();
  }
});

// Merge [geometry, colour] pairs into one vertex-coloured geometry (for instancing).
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

// ---------------- Light trees (24 bulbs each) ----------------
// Each returns { H, surface(frac, angle) -> local Vector3, star? }
export function buildTree(theme, g, rng, ctx) {
  const { makeStar, glowSprite, std } = ctx;
  if (theme === 'workshop') {
    // A tall fir wrapped in a candy-cane ribbon, with a big gold star
    const H = 13.4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.6, 7), std({ color: '#5a3b2a' }));
    trunk.position.y = 0.8;
    g.add(trunk);
    [[5.3, 4.6, 1.2], [4.4, 4.2, 3.9], [3.4, 3.8, 6.4], [2.3, 3.4, 8.8]].forEach(([r, h, y]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), std({ color: '#1f5e45' }));
      cone.position.y = y + h / 2;
      g.add(cone);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, h * 0.33, 10), std({ color: '#f4f8ff' }));
      tip.position.y = y + h - (h * 0.33) / 2 + 0.03;
      g.add(tip);
    });
    const rad = (y) => 5.1 * (1 - (y - 1.6) / 10.6) + 0.75;
    const pts = [];
    for (let k = 0; k <= 160; k++) {
      const y = 1.8 + (k / 160) * 9.6;
      const a = (k / 160) * TAU * 4.2;
      pts.push(new THREE.Vector3(Math.sin(a) * rad(y), y, Math.cos(a) * rad(y)));
    }
    const rib = caneStripe.clone();
    rib.repeat.set(60, 1);
    rib.needsUpdate = true;
    const ribbon = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.14, 6), new THREE.MeshStandardMaterial({ map: rib, roughness: 0.4 }));
    g.add(ribbon);
    const star = makeStar('#ffd36b', 1.25);
    star.position.y = H + 0.3;
    g.add(star);
    const halo = glowSprite('#ffd36b', 7, 0.6);
    halo.position.y = H + 0.3;
    g.add(halo);
    return {
      H, star,
      surface: (f, a) => {
        const y = 1.6 + f * 10.4;
        const r = 4.9 * (1 - f) + 0.6;
        return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
      },
    };
  }
  if (theme === 'jungle') {
    // A giant rainforest tree: buttress roots and tiers of huge drooping leaves, hibiscus tucked in
    const H = 12;
    const bark = std({ color: '#5a3b24' });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 5, 8), bark);
    trunk.position.y = 2.5;
    g.add(trunk);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.3;
      const root = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 1.5), bark);
      root.position.set(Math.sin(a) * 0.9, 0.7, Math.cos(a) * 0.9);
      root.rotation.y = a;
      root.rotation.x = 0.35;
      g.add(root);
    }
    const n = 6;
    const greens = ['#2f8a4e', '#3fa35e', '#256f3f', '#4cb069'];
    const tier = (i) => { const k = i / (n - 1); return { r: 4.9 * (1 - k * 0.78), y: 2.4 + i * 1.72 }; };
    const leafGeo = new THREE.SphereGeometry(1, 10, 6);
    for (let i = 0; i < n; i++) {
      const { r, y } = tier(i);
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.42, 0), std({ color: '#1f5e37' }));
      blob.position.y = y + 0.15;
      g.add(blob);
      const count = Math.max(5, Math.round(4 + r * 1.3));
      for (let j = 0; j < count; j++) {
        const a = (j / count) * TAU + i * 0.45;
        const holder = new THREE.Group();
        holder.position.y = y;
        holder.rotation.y = a - Math.PI / 2;
        const leaf = new THREE.Mesh(leafGeo, std({ color: greens[(i + j) % greens.length] }));
        leaf.scale.set(r * 0.55, 0.1, 0.38 + r * 0.1);
        leaf.position.x = r * 0.52;
        leaf.rotation.z = -0.32;
        holder.add(leaf);
        g.add(holder);
      }
      if (i % 2 === 0) {
        for (let j = 0; j < 3; j++) {
          const a = rng() * TAU;
          const fl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), std({ color: ['#e2283a', '#ff6f9e', '#ff8a2b'][j % 3], emissive: '#ff3a3a', emissiveIntensity: 0.25 }));
          fl.scale.y = 0.5;
          fl.position.set(Math.sin(a) * r * 0.6, y + 0.25, Math.cos(a) * r * 0.6);
          g.add(fl);
        }
      }
    }
    const star = makeStar('#ffb347', 1.1);
    star.position.y = H + 0.4;
    g.add(star);
    const halo = glowSprite('#ffcf6b', 7, 0.55);
    halo.position.y = H + 0.4;
    g.add(halo);
    return {
      H, star,
      surface: (f, a) => {
        const i = Math.min(n - 1, Math.floor(f * n));
        const { r, y } = tier(i);
        return new THREE.Vector3(Math.sin(a) * r * 0.78, y - 0.05, Math.cos(a) * r * 0.78);
      },
    };
  }
  if (theme === 'cyber') {
    // A hologram tree: spinning wireframe tiers over a glowing core
    const H = 13;
    const n = 6;
    const glow = (c, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.7, 20), std({ color: '#1d1f2e', metalness: 0.6, roughness: 0.3 }));
    base.position.y = 0.35;
    g.add(base);
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.07, 6, 40), glow('#00e5ff'));
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.72;
    g.add(baseRing);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, H - 0.5, 8), glow('#ff2bd6', 1.6));
    core.position.y = (H - 0.5) / 2 + 0.6;
    g.add(core);
    const tier = (i) => { const k = i / (n - 1); return { r: 5.0 * (1 - k * 0.8) + 0.4, y: 2.2 + i * 1.75 }; };
    const spinners = [];
    for (let i = 0; i < n; i++) {
      const { r, y } = tier(i);
      const pivotG = new THREE.Group();
      pivotG.rotation.x = -Math.PI / 2;
      pivotG.position.y = y;
      const wire = new THREE.Mesh(new THREE.ConeGeometry(r, 2.6, 10, 2, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 2 ? '#ff2bd6' : '#00e5ff').multiplyScalar(2), wireframe: true, toneMapped: false }));
      wire.rotation.x = Math.PI / 2;
      pivotG.add(wire);
      const fill = new THREE.Mesh(new THREE.ConeGeometry(r * 0.98, 2.55, 10, 1, true), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ff2bd6' : '#00e5ff', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      fill.rotation.x = Math.PI / 2;
      pivotG.add(fill);
      pivotG.userData.spin = (i % 2 ? 1 : -1) * (0.4 + i * 0.12);
      g.add(pivotG);
      spinners.push(pivotG);
    }
    const star = makeStar('#ff2bd6', 1.1);
    star.position.y = H + 0.4;
    g.add(star);
    const halo = glowSprite('#ff2bd6', 9, 0.6);
    halo.position.y = H + 0.4;
    g.add(halo);
    g.userData.rings = spinners;
    return {
      H, star,
      surface: (f, a) => {
        const i = Math.min(n - 1, Math.floor(f * n));
        const { r, y } = tier(i);
        return new THREE.Vector3(Math.sin(a) * r * 0.55, y, Math.cos(a) * r * 0.55);
      },
    };
  }
  if (theme === 'japan') {
    // A five-storey pagoda: the lights hang under its snowy eaves
    const n = 5;
    const red = std({ color: '#ffb3cf' });
    const tierCols = ['#8fdcc0', '#b6a4f0', '#9fd8f5', '#ffd36b', '#ff9ec4'];
    const snowM = std({ color: '#fffafc', roughness: 1 });
    const plaster = std({ color: '#fff6ec' });
    const lamp = std({ color: '#ff7eb6', emissive: '#ff7eb6', emissiveIntensity: 1.6, flatShading: false });
    const base = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.6, 6.6), std({ color: '#9a9ea8' }));
    base.position.y = 0.3;
    g.add(base);
    const T = (i) => { const k = i / (n - 1); const b = 4.4 * (1 - k * 0.48); return { b, y: 0.6 + i * 2.15, span: b + 2.1 }; };
    for (let i = 0; i < n; i++) {
      const { b, y, span } = T(i);
      const bh = 1.4;
      const tile = std({ color: tierCols[i % tierCols.length], roughness: 0.6 });
      const tileDark = std({ color: new THREE.Color(tierCols[i % tierCols.length]).multiplyScalar(0.8).getStyle() });
      const body = new THREE.Mesh(new THREE.BoxGeometry(b, bh, b), red);
      body.position.y = y + bh / 2;
      g.add(body);
      const band = new THREE.Mesh(new THREE.BoxGeometry(b * 0.86, bh * 0.45, b + 0.04), plaster);
      band.position.y = y + bh * 0.55;
      g.add(band);
      const band2 = band.clone();
      band2.scale.set((b + 0.04) / (b * 0.86), 1, (b * 0.86) / (b + 0.04));
      g.add(band2);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(span + 0.1, 0.14, span + 0.1), tileDark);
      plate.position.y = y + bh + 0.06;
      g.add(plate);
      const rh = 0.85 - i * 0.04;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(span / Math.SQRT2, rh, 4), tile);
      roof.position.y = y + bh + 0.1 + rh / 2;
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      const cap = new THREE.Mesh(new THREE.ConeGeometry((span / Math.SQRT2) * 0.62, rh * 0.62, 4), snowM);
      cap.position.y = y + bh + 0.1 + rh - (rh * 0.62) / 2 + 0.06;
      cap.rotation.y = Math.PI / 4;
      g.add(cap);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
        const tipM = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.16), tile);
        tipM.position.set(sx * (span / 2 + 0.05), y + bh + 0.18, sz * (span / 2 + 0.05));
        tipM.rotation.set(0, sx * sz * -0.785, sx * 0.4);
        g.add(tipM);
        if (sz > 0) {
          const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), lamp);
          l.scale.y = 1.3;
          l.position.set(sx * (span / 2 - 0.1), y + bh - 0.35, span / 2 - 0.1);
          g.add(l);
        }
      }));
    }
    // a happy face on the bottom storey
    {
      const { b, y } = T(0);
      const fz = (b + 0.04) / 2 + 0.02;
      const eyeM = new THREE.MeshBasicMaterial({ color: '#2a2238' }), shine = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      [-1, 1].forEach((s) => {
        const e = new THREE.Mesh(new THREE.CircleGeometry(0.26, 20), eyeM);
        e.scale.y = 1.2;
        e.position.set(s * 0.75, y + 0.85, fz);
        g.add(e);
        const h = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), shine);
        h.position.set(s * 0.75 + 0.08, y + 0.97, fz + 0.01);
        g.add(h);
        const bl = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), new THREE.MeshBasicMaterial({ color: '#ff8fb8', transparent: true, opacity: 0.7 }));
        bl.scale.x = 1.4;
        bl.position.set(s * 1.2, y + 0.55, fz);
        g.add(bl);
      });
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 14, Math.PI), eyeM);
      mouth.rotation.z = Math.PI;
      mouth.position.set(0, y + 0.6, fz);
      g.add(mouth);
    }
    const top = T(n - 1).y + 1.4 + 0.9;
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.6, 6), std({ color: '#d4a63a', metalness: 0.5, roughness: 0.35 }));
    spire.position.y = top + 1.3;
    g.add(spire);
    for (let k = 0; k < 5; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26 - k * 0.02, 0.05, 5, 14), std({ color: '#d4a63a', metalness: 0.5, roughness: 0.35 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = top + 0.5 + k * 0.38;
      g.add(ring);
    }
    const H = top + 2.9;
    const star = makeStar('#ffd36b', 1.0);
    star.position.y = H;
    g.add(star);
    const halo = glowSprite('#ffb3d9', 7, 0.55);
    halo.position.y = H;
    g.add(halo);
    return {
      H, star,
      surface: (f, a) => {
        const i = Math.min(n - 1, Math.floor(f * n));
        const { y, span } = T(i);
        const m = Math.max(Math.abs(Math.sin(a)), Math.abs(Math.cos(a)));
        const rr = (span / 2) * 0.9;
        return new THREE.Vector3((Math.sin(a) / m) * rr, y + 1.4 - 0.05, (Math.cos(a) / m) * rr);
      },
    };
  }
  if (theme === 'gingerbread') {
    // A tower of star-shaped cookies, iced, getting smaller towards the top
    const H = 12.5;
    const starShape = (r1, r2) => {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? r2 : r1, a = (i / 10) * TAU + Math.PI / 2;
        i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      return s;
    };
    const cookie = mat('#ffffff', { map: biscuitTex });
    const icing = mat('#fff6fa', { roughness: 0.5 });
    const n = 9;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      const r = 5.2 * (1 - k * 0.82);
      const geo = new THREE.ExtrudeGeometry(starShape(r, r * 0.62), { depth: 0.55, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, cookie);
      m.position.y = 0.6 + i * 1.25;
      m.rotation.y = i * 0.35;
      g.add(m);
      const top = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(r * 0.9, r * 0.55), { depth: 0.08, bevelEnabled: false }), icing);
      top.geometry.rotateX(-Math.PI / 2);
      top.position.y = 0.6 + i * 1.25 + 0.66;
      top.rotation.y = i * 0.35;
      g.add(top);
    }
    const star = makeStar('#ffd36b', 1.0);
    star.position.y = H + 0.4;
    g.add(star);
    const halo = glowSprite('#ffb3d9', 6, 0.5);
    halo.position.y = H + 0.4;
    g.add(halo);
    return {
      H, star,
      surface: (f, a) => {
        const i = Math.min(n - 1, Math.floor(f * n));
        const k = i / (n - 1);
        const r = 5.2 * (1 - k * 0.82) * 0.86;
        return new THREE.Vector3(Math.sin(a) * r, 0.6 + i * 1.25 + 0.75, Math.cos(a) * r);
      },
    };
  }
  if (theme === 'toys') {
    // A stacked tree of wooden toy blocks
    const H = 12;
    const cols = ['#2f9e5b', '#23804a', '#3fb86b'];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      const s = 7.2 * (1 - k * 0.8);
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, 1.45, s), mat(cols[i % 3], { roughness: 0.6 }));
      m.position.y = 0.75 + i * 1.5;
      m.rotation.y = i * 0.4;
      g.add(m);
    }
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.6, 12), mat('#c98d55'));
    trunk.position.y = 0.3;
    g.add(trunk);
    const star = makeStar('#ffd23f', 1.0);
    star.position.y = H + 0.6;
    g.add(star);
    return {
      H, star,
      surface: (f, a) => {
        const i = Math.min(n - 1, Math.floor(f * n));
        const k = i / (n - 1);
        const s = 7.2 * (1 - k * 0.8) / 2;
        const ang = a + i * 0.4;
        // place on the block's front faces
        return new THREE.Vector3(Math.sin(ang) * s * 1.02, 0.75 + i * 1.5 + 0.2, Math.cos(ang) * s * 1.02);
      },
    };
  }
  // space: a tree of glowing neon rings
  const H = 13;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const r = 4.8 * (1 - k * 0.85) + 0.3;
    const c = i % 2 ? '#7af7ff' : '#ff6fd8';
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.16, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.2), toneMapped: false }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1 + i * 1.45;
    ring.userData.spin = (i % 2 ? 1 : -1) * (0.3 + k * 0.4);
    g.add(ring);
  }
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, H, 8), std({ color: '#c9d2e6', metalness: 0.6, roughness: 0.3 }));
  core.position.y = H / 2;
  g.add(core);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.6, 16), std({ color: '#5d6478', metalness: 0.5, roughness: 0.4 }));
  base.position.y = 0.3;
  g.add(base);
  const star = makeStar('#fff3a6', 1.0);
  star.position.y = H + 0.5;
  g.add(star);
  const halo = glowSprite('#9b8cff', 8, 0.55);
  halo.position.y = H + 0.5;
  g.add(halo);
  g.userData.rings = g.children.filter((o) => o.userData.spin);
  return {
    H, star,
    surface: (f, a) => {
      const i = Math.min(n - 1, Math.floor(f * n));
      const k = i / (n - 1);
      const r = 4.8 * (1 - k * 0.85) + 0.3;
      return new THREE.Vector3(Math.sin(a) * r, 1 + i * 1.45 + 0.3, Math.cos(a) * r);
    },
  };
}

// ---------------- Scenery ----------------
function candyTreeGeometry(cols) {
  const parts = [];
  const add = (geo, color) => {
    const c = new THREE.Color(color);
    const g = geo.toNonIndexed();
    const arr = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < arr.length; i += 3) arr.set([c.r, c.g, c.b], i);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    parts.push(g);
  };
  const trunk = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6);
  trunk.translate(0, 0.4, 0);
  add(trunk, '#6b3d23');
  [[1.3, 1.7, 0.6], [1.05, 1.5, 1.4], [0.78, 1.3, 2.1]].forEach(([r, h, y], i) => {
    const cone = new THREE.ConeGeometry(r, h, 8);
    cone.translate(0, y + h / 2, 0);
    add(cone, cols[i % cols.length]);
    const tip = new THREE.ConeGeometry(r * 0.4, h * 0.38, 8);
    tip.translate(0, y + h - (h * 0.38) / 2 + 0.02, 0);
    add(tip, '#ffffff');
  });
  return mergeGeometries(parts);
}

function starfield(root, rng, count, size, radius = 380) {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rng() * TAU, v = 0.04 + rng() * 0.95;
    p.set([Math.cos(u) * Math.cos(v * 1.45) * radius, Math.sin(v * 1.45) * radius, Math.sin(u) * Math.cos(v * 1.45) * radius], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const s = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false }));
  root.add(s);
  return s;
}

function makeStarLike(color) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.55 : 1.3, a = (i / 10) * TAU + Math.PI / 2;
    i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false });
  g.center();
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), toneMapped: false }));
}

function canvasSphereTex(draw) {
  const t = canvasTexture(512, 256, draw);
  t.userData.shared = true;
  return t;
}

export function buildScenery(theme, c) {
  const { root, L, rng, updaters, groundAt, avoid, std, glowSprite, instanced, makeSleigh } = c;
  const sides = (n, minR = 3, spreadOut = 0.3) => {
    const out = [];
    for (let k = 0; k < n * 6 && out.length < n; k++) {
      const side = rng() < 0.6;
      const th = side ? (rng() < 0.5 ? -1 : 1) * (L.spread + spreadOut + rng() * 0.9) : (rng() - 0.5) * 2 * (L.spread + 0.55);
      const R = side ? L.frontR + minR + rng() * (L.backR - L.frontR + 20) : L.backR + 2.5 + rng() * 34;
      const [x, z] = polar(R, th);
      if (!side && avoid(x, z)) continue;
      out.push({ x, z, y: side ? groundAt(x, z) - 0.1 : L.topY, side });
    }
    return out;
  };

  const vmat = () => std({ vertexColors: true, roughness: 0.9 });
  const sky = (opts) => {
    const stars = starfield(root, rng, opts.stars, 1.7);
    updaters.push((t) => { stars.material.opacity = 0.72 + Math.sin(t * 1.3) * 0.15; });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(opts.moonR || 10, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(opts.moon).multiplyScalar(1.5), toneMapped: false, fog: false }));
    moon.position.set(...opts.moonAt);
    root.add(moon);
    const mg = glowSprite(opts.moonGlow, (opts.moonR || 10) * 9, 0.45);
    mg.position.copy(moon.position);
    root.add(mg);
    const sleigh = makeSleigh();
    root.add(sleigh);
    let t0 = 0, now = 0;
    updaters.push((t) => {
      now = t;
      const k = (((t - t0) % 34) + 34) % 34 / 34;
      sleigh.visible = k < 0.5;
      const u = k / 0.5;
      sleigh.position.set(-170 + u * 340, 62 + Math.sin(u * Math.PI) * 14, -210);
      sleigh.rotation.z = Math.cos(u * Math.PI) * 0.12;
    });
    return { launch() { const k = ((now - t0) % 34) / 34; if (k > 0.5) t0 = now; } };
  };
  const ring = (n, R0, R1, fn) => {
    for (let i = 0; i < n; i++) {
      const th = -1.25 + (2.5 * i) / (n - 1) + (rng() - 0.5) * 0.15;
      const R = R0 + rng() * (R1 - R0);
      fn(R * Math.sin(th), -R * Math.cos(th), i, th);
    }
  };
  const label = (text, w, h, bg, ink, font) => tex(w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = ink;
    g.lineWidth = 6;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = ink;
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
  });

  if (theme === 'workshop') {
    // Snowy pines, mountains, aurora, moon and the sleigh (kept clear of the toy machine, parked sleigh and workshop yard)
    const machineAt = polar(L.backR + 4.5, -0.5), sleighAt = polar(L.backR + 4.5, 0.5);
    const yardZ = -(L.backR + 24) + 5.5;
    const clear = (p) => ![machineAt, sleighAt].some(([x, z]) => Math.hypot(p.x - x, p.z - z) < 7.5) && !(Math.abs(p.x) < 18 && p.z < yardZ + 7 && p.z > yardZ - 8);
    const pines = sides(110).filter(clear).map((p) => ({ ...p, s: 1.1 + rng() * 1.6, rot: rng() * 6, tint: 0.85 + rng() * 0.3 }));
    root.add(instanced(c.pineGeometry(true), vmat(), pines));
    const mMat = std({ color: '#6f84c2' });
    ring(11, 110, 160, (x, z) => {
      const h = 34 + rng() * 34, rad = 22 + rng() * 16;
      const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 6), mMat);
      m.position.set(x, h / 2 - 2, z);
      m.rotation.y = rng() * 3;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.36, h * 0.36, 6), std({ color: '#f1f5ff' }));
      cap.position.y = h / 2 - (h * 0.36) / 2 + 0.05;
      m.add(cap);
      root.add(m);
    });
    const skyFx = sky({ stars: 1600, moon: '#fff4d6', moonGlow: '#cfe0ff', moonAt: [90, 95, -260] });
    const aur = new THREE.Mesh(new THREE.PlaneGeometry(520, 110, 80, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `uniform float uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x*0.02 + uTime*0.25)*18.0; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform float uTime; varying vec2 vUv;
        void main(){ float band = sin(vUv.x*12.0 + uTime*0.3 + sin(vUv.x*4.0 + uTime*0.2)*2.5)*0.5 + 0.5;
          band = pow(band, 2.0);
          float fade = smoothstep(0.0, 0.25, vUv.y) * pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
          vec3 c = mix(vec3(0.2,1.0,0.55), vec3(0.95,0.35,0.6), vUv.y);
          gl_FragColor = vec4(c * band * fade * 0.6, 1.0); }`,
    }));
    aur.position.set(0, 95, -300);
    root.add(aur);
    updaters.push((t) => { aur.material.uniforms.uTime.value = t; });

    // ---- The workshop itself, behind the big tree ----
    const ws = new THREE.Group();
    const W = 30, H = 9, D = 11, RH = 6;
    const red = std({ color: '#b5322b' }), beam = std({ color: '#6e1d18' }), green = std({ color: '#234a3a' }), snowM = std({ color: '#f4f8ff', roughness: 1 });
    const glow = new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffbe5c', emissiveIntensity: 2.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), red);
    body.position.y = H / 2;
    ws.add(body);
    [3, 6.3].forEach((y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.35, D + 0.1), beam); b.position.y = y; ws.add(b); });
    for (let x = -W / 2; x <= W / 2 + 0.01; x += 5) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, 0.2), beam); b.position.set(x, H / 2, D / 2 + 0.05); ws.add(b); }
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, RH)]), { depth: W, bevelEnabled: false }), red);
    gable.rotation.y = Math.PI / 2;
    gable.position.set(-W / 2, H, 0);
    ws.add(gable);
    const a = Math.atan2(RH, D / 2), Lz = Math.hypot(D / 2, RH) + 1.0;
    [-1, 1].forEach((side) => {
      const pz = (side * D) / 4, py = H + RH / 2;
      const nz = side * Math.sin(a), ny = Math.cos(a);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(W + 1.6, 0.4, Lz), green);
      panel.position.set(0, py + ny * 0.2, pz + nz * 0.2);
      panel.rotation.x = side * a;
      ws.add(panel);
      const sn = new THREE.Mesh(new THREE.BoxGeometry(W + 1.4, 0.35, Lz * 0.96), snowM);
      sn.position.set(0, py + ny * 0.55, pz + nz * 0.55);
      sn.rotation.x = side * a;
      ws.add(sn);
    });
    // glowing windows, big arched doors, sign
    for (let x = -12.5; x <= 12.5; x += 5) {
      [1.6, 4.7].forEach((y) => {
        if (Math.abs(x) < 3) return;
        const wnd = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.9), glow);
        wnd.position.set(x, y, D / 2 + 0.02);
        ws.add(wnd);
        const sill = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 0.5), snowM);
        sill.position.set(x, y - 1.05, D / 2 + 0.2);
        ws.add(sill);
      });
    }
    const doorM = std({ color: '#5a2a1e' });
    const dGlow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 5.6), glow);
    dGlow.position.set(0, 2.8, D / 2 + 0.02);
    ws.add(dGlow);
    [-1, 1].forEach((sd) => {
      const p = new THREE.Group();
      p.position.set(sd * 2.3, 0, D / 2 + 0.1);
      p.rotation.y = sd * -0.55;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(2.3, 5.4, 0.25), doorM);
      leaf.position.set(-sd * 1.15, 2.7, 0);
      p.add(leaf);
      const wr = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.17, 6, 16), std({ color: '#1f6b48' }));
      wr.position.set(-sd * 1.15, 3.7, 0.2);
      p.add(wr);
      ws.add(p);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.7), new THREE.MeshStandardMaterial({ map: label("SANTA'S WORKSHOP", 1024, 174, '#f2b84b', '#4a1d12', '900 96px "Bagel Fat One", Georgia, serif'), emissive: '#5a3a10', emissiveIntensity: 0.3 }));
    sign.position.set(0, 7.5, D / 2 + 0.25);
    ws.add(sign);
    // clock tower on the ridge, with moving hands
    const tower = new THREE.Group();
    ws.add(tower);
    const tw = new THREE.Mesh(new THREE.BoxGeometry(4.4, 6, 4.4), red);
    tw.position.set(0, H + RH + 1.6, 0);
    tower.add(tw);
    const twRoof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 4, 4), green);
    twRoof.position.set(0, H + RH + 6.6, 0);
    twRoof.rotation.y = Math.PI / 4;
    tower.add(twRoof);
    const bellG = new THREE.Group();
    bellG.position.set(0, H + RH + 4.0, 0);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.0, 1.3, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#e0b04a', metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }));
    bell.position.y = -0.65;
    bellG.add(bell);
    tower.add(bellG);
    [-1, 1].forEach((sd) => { const arch = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.6, 0.1), std({ color: '#2a140c' })); arch.position.set(0, H + RH + 3.4, sd * 2.21); tower.add(arch); });
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.55, 32), new THREE.MeshStandardMaterial({ map: tex(256, 256, (g, w) => {
      g.fillStyle = '#f6e7c1'; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, TAU); g.fill();
      g.strokeStyle = '#6e1d18'; g.lineWidth = 14; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 8, 0, TAU); g.stroke();
      g.fillStyle = '#4a1d12';
      for (let k = 0; k < 12; k++) { const an = (k / 12) * TAU; g.beginPath(); g.arc(w / 2 + Math.sin(an) * 96, w / 2 - Math.cos(an) * 96, k % 3 ? 5 : 10, 0, TAU); g.fill(); }
    }), emissive: '#ffd27a', emissiveIntensity: 0.25 }));
    face.position.set(0, H + RH + 2, 2.22);
    tower.add(face);
    const hands = [[0.07, 0.9], [0.05, 1.25]].map(([wd, ln]) => {
      const pv = new THREE.Group();
      pv.position.set(0, H + RH + 2, 2.26);
      const hm = new THREE.Mesh(new THREE.BoxGeometry(wd * 2, ln, 0.04), std({ color: '#2a140c' }));
      hm.position.y = ln / 2;
      pv.add(hm);
      tower.add(pv);
      return pv;
    });
    let handSpin = 0, handTurn = 0;
    updaters.push((t, dt) => { handSpin = Math.max(0, handSpin - dt); handTurn += dt * handSpin * 8; hands[0].rotation.z = -t * 0.05 - handTurn * 0.2; hands[1].rotation.z = -t * 0.6 - handTurn; });
    const topStar = makeStarLike('#ffd36b');
    topStar.position.set(0, H + RH + 9, 0);
    tower.add(topStar);
    // chimneys with smoke
    [-9, 9].forEach((x) => {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4, 1.4), beam);
      ch.position.set(x, H + RH * 0.6 + 1, -2);
      ws.add(ch);
      for (let k = 0; k < 5; k++) {
        const pf = glowSprite('#dfe6ee', 3, 0.0);
        pf.material.blending = THREE.NormalBlending;
        ws.add(pf);
        updaters.push((t) => {
          const u = (t * 0.18 + k / 5) % 1;
          pf.position.set(x + u * 3, H + RH * 0.6 + 3.2 + u * 9, -2);
          pf.scale.setScalar(2 + u * 6);
          pf.material.opacity = Math.sin(u * Math.PI) * 0.45;
        });
      }
    });
    // fairy lights along the eaves
    const bulbCols = ['#ff4f5e', '#ffd23f', '#5fd4ff', '#7cf29a', '#ff8ad8'];
    for (let k = 0; k <= 30; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(bulbCols[k % 5]).multiplyScalar(2.4), toneMapped: false }));
      b.position.set(-W / 2 - 0.6 + (k * (W + 1.2)) / 30, H - 0.2 + Math.sin((k / 30) * Math.PI * 6) * -0.25, D / 2 + 0.9);
      ws.add(b);
    }
    ws.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ws.position.set(0, L.topY, -(L.backR + 24));
    root.add(ws);

    // ---- North Pole marker at the edge of the square ----
    const pole = new THREE.Group();
    const stripe = caneStripe.clone();
    stripe.repeat.set(1, 6);
    stripe.needsUpdate = true;
    const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 5.5, 14), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.4 }));
    pm.position.y = 2.75;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#ffb020', emissiveIntensity: 0.9, metalness: 0.4, roughness: 0.3 }));
    ball.position.y = 5.8;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.6, 0.12), [std({ color: '#8a5a33' }), std({ color: '#8a5a33' }), std({ color: '#8a5a33' }), std({ color: '#8a5a33' }), new THREE.MeshStandardMaterial({ map: label('NORTH POLE', 512, 110, '#8a5a33', '#fbecc8', '900 62px "Bagel Fat One", Georgia, serif') }), std({ color: '#8a5a33' })]);
    plank.position.set(0.9, 4.2, 0.2);
    plank.rotation.z = 0.06;
    const arrows = new THREE.Group();
    arrows.add(plank);
    [['TOY SHOP', '#c8372d', 3.4, 2.4], ['STABLE', '#2e6a4f', 2.7, -1.9], ['SLEIGH', '#3f5a8a', 2.0, 0.7]].forEach(([txt, col, y, ry]) => {
      const sign = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.1), [std({ color: col }), std({ color: col }), std({ color: col }), std({ color: col }), new THREE.MeshStandardMaterial({ map: label(txt, 512, 100, col, '#fff4dc', '900 58px "Bagel Fat One", Georgia, serif') }), std({ color: col })]);
      m.position.x = 1.35;
      sign.add(m);
      sign.position.y = y;
      sign.rotation.y = ry;
      arrows.add(sign);
    });
    pole.add(pm, ball, arrows);
    pole.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const [px, pz] = polar(L.frontR - 2.2, L.spread * 0.92);
    pole.position.set(px, 0, pz);
    pole.rotation.y = -L.spread * 0.92;
    root.add(pole);

    // ---- Reindeer stable on the left, with hay ----
    const stable = new THREE.Group();
    const wood = std({ color: '#7a4a2a' });
    const back = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 0.3), wood); back.position.set(0, 1.6, -1.8);
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 3.8), wood); l1.position.set(-3, 1.6, 0);
    const l2 = l1.clone(); l2.position.x = 3;
    const sroof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.3, 4.6), green); sroof.position.set(0, 3.5, 0.1); sroof.rotation.x = 0.18;
    const sroofSnow = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.25, 4.4), snowM); sroofSnow.position.set(0, 3.75, 0.1); sroofSnow.rotation.x = 0.18;
    stable.add(back, l1, l2, sroof, sroofSnow);
    for (let k = 0; k < 3; k++) {
      const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 12), std({ color: '#e0b84a' }));
      hay.rotation.z = Math.PI / 2;
      hay.position.set(-1.6 + k * 1.2, 0.55 + (k === 1 ? 1.0 : 0), -1);
      stable.add(hay);
    }
    const stSign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), new THREE.MeshStandardMaterial({ map: label('REINDEER', 512, 120, '#f7f0e0', '#7a2620', '900 68px "Bagel Fat One", Georgia, serif') }));
    stSign.position.set(0, 3.0, 2.2);
    stable.add(stSign);
    stable.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const sth = -(L.spread + 0.42);
    const [sx, sz] = polar(L.frontR + 5, sth);
    stable.position.set(sx, groundAt(sx, sz), sz);
    stable.rotation.y = -sth + 0.5;
    root.add(stable);

    // ================= Things to tap =================
    const S = () => { if (A.Sound) { A.Sound.init(); return A.Sound; } return null; };
    const tapList = c.tappables || [];
    const tappable = (obj, onPoke, update) => {
      const a = { m: { root: obj, kind: 'prop' }, busy: 0, poke() { onPoke(a); }, update(dt, t) { a.busy = Math.max(0, a.busy - dt); if (update) update(dt, t, a); } };
      obj.userData.agent = a;
      tapList.push(a);
      return a;
    };
    // little bursts of glowing sparks
    const sparks = [];
    updaters.push((t, dt) => {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= dt;
        if (p.life <= 0) { root.remove(p.s); p.s.material.dispose(); sparks.splice(i, 1); continue; }
        p.v.y -= 7 * dt * p.g;
        p.s.position.addScaledVector(p.v, dt);
        p.s.material.opacity = Math.min(1, p.life * 1.4);
      }
    });
    const burst = (pos, colors, n = 18, speed = 4, size = 0.5, g = 1) => {
      for (let i = 0; i < n; i++) {
        const sp = glowSprite(colors[i % colors.length], size * (0.6 + Math.random() * 0.8), 1);
        sp.position.copy(pos);
        root.add(sp);
        sparks.push({ s: sp, life: 0.9 + Math.random() * 0.7, g, v: new THREE.Vector3((Math.random() - 0.5) * speed, speed * (0.5 + Math.random()), (Math.random() - 0.5) * speed) });
      }
    };
    const GOLD = ['#ffd23f', '#fff3c4', '#ffb347'], FESTIVE = ['#ff4f5e', '#ffffff', '#7cf29a', '#ffd23f'];
    const world = (o, x = 0, y = 0, z = 0) => o.localToWorld(new THREE.Vector3(x, y, z));

    // ---- Clock tower: the bell rings and the hands whizz round ----
    let bellSwing = 0;
    tappable(tower, (a) => {
      if (a.busy) return;
      a.busy = 2.5;
      bellSwing = 2.5;
      handSpin = 2.5;
      const s = S();
      if (s) { s.chime(); setTimeout(() => s.chime(), 600); setTimeout(() => s.sparkle(6), 1100); }
      burst(world(topStar), GOLD, 26, 6, 0.9);
    }, (dt, t) => {
      bellSwing = Math.max(0, bellSwing - dt);
      bellG.rotation.x = Math.sin(t * 9) * 0.5 * Math.min(1, bellSwing);
    });

    // ---- Signpost: tap and the arrows spin ----
    let arrowSpin = 0;
    tappable(pole, (a) => {
      if (a.busy) return;
      a.busy = 1.6;
      arrowSpin = 1.6;
      const s = S();
      if (s) { s.creak(); setTimeout(() => s.pop(900, 400, 0.2), 1200); }
      burst(world(ball), GOLD, 12, 3, 0.5);
    }, (dt) => {
      if (arrowSpin > 0) {
        arrowSpin = Math.max(0, arrowSpin - dt);
        arrows.rotation.y += dt * 14 * Math.pow(arrowSpin / 1.6, 1.5);
      }
      ball.material.emissiveIntensity = 0.9 + arrowSpin * 2;
    });

    // ---- Santa by the square: "Ho ho ho!" and the sleigh takes off ----
    const santa = new THREE.Group();
    const sBody = new THREE.Group();
    santa.add(sBody);
    const sRed = std({ color: '#d6282c' }), sWhite = std({ color: '#ffffff', roughness: 1 }), sSkin = std({ color: '#ffd2b0' }), sBlack = std({ color: '#1d1d22' });
    const P = (parent, geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; parent.add(o); return o; };
    [-1, 1].forEach((sd) => {
      P(sBody, new THREE.CylinderGeometry(0.13, 0.12, 0.45, 8), sRed, sd * 0.16, 0.3, 0);
      P(sBody, new THREE.BoxGeometry(0.24, 0.16, 0.36), sBlack, sd * 0.16, 0.08, 0.06);
    });
    P(sBody, new THREE.SphereGeometry(0.46, 16, 12), sRed, 0, 0.92, 0, 1, 1.05, 0.95);
    P(sBody, new THREE.CylinderGeometry(0.47, 0.47, 0.1, 18), sBlack, 0, 0.82, 0);
    P(sBody, new THREE.BoxGeometry(0.18, 0.14, 0.04), std({ color: '#ffd23f', metalness: 0.5, roughness: 0.3 }), 0, 0.82, 0.46);
    P(sBody, new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), sWhite, 0, 0.98, 0.44, 1, 1, 0.4);
    const hem = P(sBody, new THREE.TorusGeometry(0.42, 0.07, 6, 18), sWhite, 0, 0.5, 0);
    hem.rotation.x = Math.PI / 2;
    const sHead = new THREE.Group();
    sHead.position.set(0, 1.55, 0);
    sBody.add(sHead);
    P(sHead, new THREE.SphereGeometry(0.24, 14, 12), sSkin, 0, 0, 0);
    P(sHead, new THREE.SphereGeometry(0.06, 8, 6), std({ color: '#ff9c8a' }), 0, -0.02, 0.23);
    [-1, 1].forEach((sd) => {
      P(sHead, new THREE.SphereGeometry(0.03, 6, 4), sBlack, sd * 0.08, 0.05, 0.21);
      P(sHead, new THREE.SphereGeometry(0.06, 8, 6), sWhite, sd * 0.09, 0.11, 0.19, 1, 0.4, 0.6);
    });
    const beard = P(sHead, new THREE.SphereGeometry(0.26, 12, 10), sWhite, 0, -0.16, 0.08, 1, 1.15, 0.8);
    beard.rotation.x = 0.2;
    P(sHead, new THREE.SphereGeometry(0.1, 8, 6), sWhite, 0, -0.04, 0.22, 1.6, 0.5, 0.6);
    const hat = new THREE.Group();
    hat.position.set(0, 0.16, -0.02);
    hat.rotation.x = -0.3;
    sHead.add(hat);
    const brim = P(hat, new THREE.TorusGeometry(0.22, 0.07, 6, 16), sWhite, 0, 0, 0);
    brim.rotation.x = Math.PI / 2;
    const hc = P(hat, new THREE.ConeGeometry(0.22, 0.55, 12), sRed, 0, 0.27, -0.04);
    hc.rotation.x = -0.35;
    P(hat, new THREE.SphereGeometry(0.08, 8, 6), sWhite, 0, 0.5, -0.2);
    const sArms = [-1, 1].map((sd) => {
      const p = new THREE.Group();
      p.position.set(sd * 0.42, 1.2, 0);
      sBody.add(p);
      P(p, new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8), sRed, 0, -0.25, 0);
      P(p, new THREE.SphereGeometry(0.09, 8, 6), sWhite, 0, -0.56, 0);
      return p;
    });
    const list = new THREE.Group();
    list.position.set(0, -0.6, 0.05);
    sArms[1].add(list);
    P(list, new THREE.BoxGeometry(0.34, 0.03, 0.03), std({ color: '#c9a06a' }), 0, 0, 0.02);
    const paper = P(list, new THREE.PlaneGeometry(0.3, 1.1), new THREE.MeshStandardMaterial({ color: '#fff6dc', side: THREE.DoubleSide }), 0, -0.55, 0.06);
    paper.castShadow = false;
    santa.scale.setScalar(1.45);
    const santaTh = -L.spread * 0.72;
    const [snx, snz] = polar(L.frontR - 2.6, santaTh);
    santa.position.set(snx, 0, snz);
    santa.rotation.y = Math.atan2(-snx, -snz) * 0.5;
    root.add(santa);
    let laugh = 0;
    tappable(santa, (a) => {
      if (a.busy) return;
      a.busy = 2.2;
      laugh = 2.2;
      const s = S();
      if (s) [0, 260, 520].forEach((ms, i) => setTimeout(() => s.pop(240 - i * 20, 110, 0.4), ms));
      if (s) setTimeout(() => s.sparkle(8), 800);
      burst(world(sHead, 0, 0.6, 0), FESTIVE, 24, 4, 0.5);
      skyFx.launch();
    }, (dt, t) => {
      laugh = Math.max(0, laugh - dt);
      const l = Math.min(1, laugh);
      sBody.position.y = Math.abs(Math.sin(t * 14)) * 0.12 * l;
      sBody.rotation.z = Math.sin(t * 1.6) * 0.03;
      sHead.rotation.x = l > 0 ? -0.35 : Math.sin(t * 0.3) > 0.2 ? 0.35 : -0.05;
      sHead.rotation.y = l > 0 ? 0 : Math.sin(t * 0.23) * 0.4;
      const wave = l > 0 || Math.sin(t * 0.17 + 1) > 0.85;
      sArms[0].rotation.set(0, 0, wave ? -2.6 + Math.sin(t * 9) * 0.3 : -0.2);
      sArms[1].rotation.set(l > 0 ? 0 : -0.9, 0, l > 0 ? 2.6 - Math.sin(t * 9) * 0.3 : 0.25);
    });

    // ---- Letters to Santa: a red post box; tap it and the letters fly off to the workshop ----
    const box = new THREE.Group();
    const pbRed = std({ color: '#c8302a' });
    P(box, new THREE.CylinderGeometry(0.55, 0.6, 1.9, 16), pbRed, 0, 0.95, 0);
    P(box, new THREE.SphereGeometry(0.58, 16, 8, 0, TAU, 0, Math.PI / 2), pbRed, 0, 1.9, 0);
    P(box, new THREE.CylinderGeometry(0.7, 0.7, 0.18, 16), sBlack, 0, 0.09, 0);
    P(box, new THREE.BoxGeometry(0.5, 0.08, 0.1), sBlack, 0, 1.55, 0.55);
    P(box, new THREE.SphereGeometry(0.62, 16, 6, 0, TAU, 0, Math.PI / 2), std({ color: '#f4f8ff', roughness: 1 }), 0, 1.95, 0, 1, 0.35, 1);
    const plate = P(box, new THREE.PlaneGeometry(0.8, 0.36), new THREE.MeshStandardMaterial({ map: label('LETTERS', 256, 110, '#ffd23f', '#7a1d18', '900 54px "Bagel Fat One", Georgia, serif') }), 0, 1.15, 0.59);
    plate.castShadow = false;
    const flap = new THREE.Group();
    flap.position.set(0, 1.6, 0.58);
    P(flap, new THREE.BoxGeometry(0.6, 0.2, 0.04), std({ color: '#a8241f' }), 0, -0.1, 0);
    box.add(flap);
    const bth = L.spread * 0.45;
    const [bxx, bzz] = polar(L.frontR - 4.2, bth);
    box.position.set(bxx, 0, bzz);
    box.rotation.y = Math.atan2(-bxx, -bzz);
    box.scale.setScalar(1.15);
    root.add(box);
    const letterTex = tex(128, 80, (g, w, h) => {
      g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d9cbb0'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h * 0.55); g.lineTo(w, 0); g.stroke();
      g.fillStyle = '#c8302a'; g.beginPath(); g.arc(w / 2, h * 0.55, 10, 0, TAU); g.fill();
    });
    const letters = [];
    tappable(box, (a) => {
      if (a.busy) return;
      a.busy = 3;
      const s = S();
      if (s) { s.whoosh(0.8, 400, 2400, 0.22); setTimeout(() => s.sparkle(5), 400); }
      const from = world(box, 0, 1.7, 0.6);
      const to = world(ws, 0, 5, D / 2 + 1);
      for (let i = 0; i < 7; i++) {
        const lt = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshStandardMaterial({ map: letterTex, side: THREE.DoubleSide, transparent: true }));
        lt.position.copy(from);
        root.add(lt);
        letters.push({ m: lt, k: -i * 0.12, from: from.clone(), to: to.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 3, 0)), seed: Math.random() * 6 });
      }
    }, (dt, t, a) => {
      flap.rotation.x = a.busy > 1.8 ? -1.2 : A.lerp(flap.rotation.x, 0, 0.1);
      for (let i = letters.length - 1; i >= 0; i--) {
        const l = letters[i];
        l.k += dt * 0.32;
        if (l.k < 0) continue;
        if (l.k >= 1) { root.remove(l.m); l.m.geometry.dispose(); l.m.material.dispose(); letters.splice(i, 1); continue; }
        const k = l.k;
        l.m.position.lerpVectors(l.from, l.to, k);
        l.m.position.y += Math.sin(k * Math.PI) * 14 + Math.sin(t * 6 + l.seed) * 0.3;
        l.m.position.x += Math.sin(k * 9 + l.seed) * 1.2;
        l.m.rotation.set(Math.sin(t * 5 + l.seed) * 0.6, t * 2 + l.seed, Math.cos(t * 4 + l.seed) * 0.4);
        l.m.material.opacity = Math.min(1, (1 - k) * 4);
      }
    });

    // ---- The toy machine: tap it and out pops a freshly made toy ----
    const machine = new THREE.Group();
    const mGreen = std({ color: '#2e6a4f' }), brass = std({ color: '#d4a63a', metalness: 0.5, roughness: 0.35 }), steel = std({ color: '#8a93a8', metalness: 0.6, roughness: 0.3 });
    const mBody = P(machine, new THREE.BoxGeometry(3.6, 3.4, 2.8), std({ color: '#c8372d' }), 0, 1.9, 0);
    P(machine, new THREE.BoxGeometry(3.9, 0.3, 3.1), brass, 0, 3.75, 0);
    P(machine, new THREE.CylinderGeometry(1.0, 1.4, 1.2, 12), mGreen, 0, 4.5, 0);
    const funnel = P(machine, new THREE.CylinderGeometry(1.0, 0.35, 1.3, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#d4a63a', metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide }), 0, 5.7, 0);
    funnel.castShadow = false;
    P(machine, new THREE.BoxGeometry(3.8, 0.25, 3.0), std({ color: '#f4f8ff', roughness: 1 }), 0, 3.95, 0);
    P(machine, new THREE.BoxGeometry(4.0, 0.4, 3.2), steel, 0, 0.2, 0);
    // chute out of the front
    const chute = P(machine, new THREE.BoxGeometry(1.3, 0.12, 2.2), steel, 0, 0.95, 2.2);
    chute.rotation.x = 0.35;
    [-1, 1].forEach((sd) => { const w = P(machine, new THREE.BoxGeometry(0.08, 0.35, 2.2), steel, sd * 0.65, 1.1, 2.2); w.rotation.x = 0.35; });
    const hatch = P(machine, new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf6b').multiplyScalar(1.5), toneMapped: false }), 0, 1.6, 1.41);
    hatch.castShadow = false;
    const gears = [];
    [[-1.0, 2.6, 0.7, brass], [0.2, 3.05, 0.45, steel], [1.05, 2.4, 0.55, brass]].forEach(([x, y, r, m], k) => {
      const gr = new THREE.Group();
      gr.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.18, 14), m));
      for (let t2 = 0; t2 < 10; t2++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.2), m);
        const an = (t2 / 10) * TAU;
        tooth.position.set(Math.cos(an) * (r + 0.07), 0, Math.sin(an) * (r + 0.07));
        gr.add(tooth);
      }
      gr.rotation.x = Math.PI / 2;
      gr.position.set(x, y, 1.45);
      gr.userData.dir = k % 2 ? -1 : 1;
      machine.add(gr);
      gears.push(gr);
    });
    const mLamp = P(machine, new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#7cf29a').multiplyScalar(2), toneMapped: false }), 1.3, 3.3, 1.45);
    const mSign = P(machine, new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: label('TOY-O-MATIC', 512, 108, '#fff4dc', '#c8372d', '900 60px "Bagel Fat One", Georgia, serif') }), -0.3, 3.45, 1.42);
    mSign.castShadow = false;
    const [mx, mz] = machineAt;
    machine.position.set(mx, L.topY, mz);
    machine.rotation.y = 0.5;
    root.add(machine);
    const toyCols = ['#e2483d', '#3f7be0', '#ffd23f', '#2f9e5b', '#9b5de5', '#ff8a2b', '#ff8ad8'];
    const makeToy = (k) => {
      const g = new THREE.Group();
      const c1 = toyCols[k % toyCols.length], c2 = toyCols[(k + 3) % toyCols.length];
      const kind = k % 5;
      if (kind === 0) {
        P(g, new THREE.BoxGeometry(0.6, 0.5, 0.6), std({ color: c1 }), 0, 0.25, 0);
        P(g, new THREE.BoxGeometry(0.62, 0.52, 0.12), std({ color: '#ffd23f' }), 0, 0.25, 0);
        P(g, new THREE.BoxGeometry(0.12, 0.52, 0.62), std({ color: '#ffd23f' }), 0, 0.25, 0);
      } else if (kind === 1) {
        P(g, new THREE.SphereGeometry(0.32, 14, 10), std({ color: c1, roughness: 0.3, flatShading: false }), 0, 0.32, 0);
      } else if (kind === 2) {
        const fur = std({ color: '#a8743f' });
        P(g, new THREE.SphereGeometry(0.3, 10, 8), fur, 0, 0.3, 0);
        P(g, new THREE.SphereGeometry(0.22, 10, 8), fur, 0, 0.7, 0.03);
        [-1, 1].forEach((sd) => P(g, new THREE.SphereGeometry(0.09, 6, 4), fur, sd * 0.17, 0.88, 0));
        P(g, new THREE.BoxGeometry(0.26, 0.08, 0.08), std({ color: c1 }), 0, 0.5, 0.2);
      } else if (kind === 3) {
        P(g, new THREE.CylinderGeometry(0.32, 0.32, 0.42, 14), std({ color: c1 }), 0, 0.21, 0);
        P(g, new THREE.CylinderGeometry(0.33, 0.33, 0.06, 14), std({ color: '#fff4dc' }), 0, 0.44, 0);
      } else {
        const top = P(g, new THREE.ConeGeometry(0.3, 0.45, 12), std({ color: c1 }), 0, 0.3, 0);
        top.rotation.x = Math.PI;
        P(g, new THREE.CylinderGeometry(0.31, 0.31, 0.06, 12), std({ color: c2 }), 0, 0.52, 0);
      }
      return g;
    };
    const flying = [], pile = [];
    let toyN = 0, shake = 0;
    const pileAt = (i) => machine.localToWorld(new THREE.Vector3(((i % 4) - 1.5) * 0.7, 0.05 + Math.floor(i / 4) * 0.5, 3.9 + ((i * 7) % 3) * 0.35));
    tappable(machine, (a) => {
      if (a.busy) return;
      a.busy = 2.0;
      shake = 1.4;
      const s = S();
      if (s) { s.creak(); setTimeout(() => s.whoosh(0.4, 600, 2600, 0.2), 700); setTimeout(() => { s.pop(1200, 300, 0.3); s.sparkle(5); }, 1300); }
      setTimeout(() => {
        const toy = makeToy(toyN);
        const slot = toyN % 12;
        toyN++;
        if (pile.length >= 12) { const old = pile.shift(); root.remove(old); }
        const from = machine.localToWorld(new THREE.Vector3(0, 1.4, 1.6));
        toy.position.copy(from);
        root.add(toy);
        flying.push({ toy, from, to: pileAt(slot), k: 0, spin: (Math.random() - 0.5) * 8 });
        burst(from, GOLD, 14, 3.5, 0.4);
      }, 1300);
    }, (dt, t) => {
      shake = Math.max(0, shake - dt);
      const sp = 0.6 + shake * 6;
      gears.forEach((g) => { g.rotation.y += dt * sp * g.userData.dir; });
      mBody.position.x = Math.sin(t * 50) * 0.04 * Math.min(1, shake);
      mLamp.material.color.setStyle(shake > 0 && Math.sin(t * 20) > 0 ? '#ff4f5e' : '#7cf29a').multiplyScalar(2);
      hatch.material.color.setStyle('#ffcf6b').multiplyScalar(1.2 + shake * 1.2);
      for (let i = flying.length - 1; i >= 0; i--) {
        const f = flying[i];
        f.k = Math.min(1, f.k + dt * 1.4);
        f.toy.position.lerpVectors(f.from, f.to, f.k);
        f.toy.position.y += Math.sin(f.k * Math.PI) * 2.2;
        f.toy.rotation.y += dt * f.spin;
        if (f.k >= 1) { pile.push(f.toy); flying.splice(i, 1); }
      }
    });
    // puffs from the funnel (pastel "toy magic")
    const magic = ['#ffd6f0', '#d6f0ff', '#fff3c4', '#d6ffe4'];
    for (let k = 0; k < 6; k++) {
      const pf = glowSprite(magic[k % magic.length], 2, 0);
      root.add(pf);
      updaters.push((t) => {
        const u = (t * (0.22 + shake * 0.4) + k / 6) % 1;
        const top = machine.localToWorld(new THREE.Vector3(Math.sin(k) * 0.3, 6.3 + u * 5, 0));
        pf.position.copy(top);
        pf.scale.setScalar(1 + u * 3);
        pf.material.opacity = Math.sin(u * Math.PI) * 0.55;
      });
    }

    // ---- Santa's sleigh parked by the tree, being loaded; tap for sleigh bells ----
    const sl = new THREE.Group();
    const slRed = std({ color: '#c8302a' }), slGold = std({ color: '#e0b04a', metalness: 0.5, roughness: 0.35 });
    P(sl, new THREE.BoxGeometry(2.0, 1.0, 3.0), slRed, 0, 1.0, 0);
    P(sl, new THREE.BoxGeometry(2.1, 1.5, 0.3), slRed, 0, 1.3, -1.4);
    P(sl, new THREE.BoxGeometry(2.14, 0.12, 3.1), slGold, 0, 1.52, 0);
    const curl = P(sl, new THREE.TorusGeometry(0.55, 0.16, 8, 16, Math.PI * 1.3), slRed, 0, 1.2, 1.75);
    curl.rotation.y = Math.PI / 2;
    [-0.85, 0.85].forEach((x) => {
      P(sl, new THREE.BoxGeometry(0.1, 0.1, 3.4), slGold, x, 0.1, 0.1);
      const tip = P(sl, new THREE.TorusGeometry(0.35, 0.05, 6, 12, Math.PI), slGold, x, 0.45, 1.8);
      tip.rotation.y = Math.PI / 2;
      [-0.9, 0.9].forEach((z) => P(sl, new THREE.BoxGeometry(0.08, 0.5, 0.08), slGold, x, 0.35, z));
    });
    const sack = P(sl, new THREE.SphereGeometry(0.9, 12, 10), std({ color: '#8a5a33' }), 0, 2.0, -0.6, 1, 1.1, 0.9);
    sack.castShadow = true;
    const sackGifts = [];
    [[-0.4, 2.8, -0.4, '#2f9e5b'], [0.3, 2.9, -0.7, '#3f7be0'], [0.05, 3.1, -0.2, '#ffd23f']].forEach(([x, y, z, c2], k) => {
      const gft = new THREE.Group();
      P(gft, new THREE.BoxGeometry(0.5, 0.45, 0.5), std({ color: c2 }), 0, 0, 0);
      P(gft, new THREE.BoxGeometry(0.52, 0.47, 0.1), std({ color: '#ffffff' }), 0, 0, 0);
      gft.position.set(x, y, z);
      gft.rotation.y = k;
      sl.add(gft);
      sackGifts.push(gft);
    });
    const bells = [];
    for (let k = 0; k < 5; k++) {
      const b = P(sl, new THREE.SphereGeometry(0.12, 8, 6), slGold, -0.8 + k * 0.4, 1.35, 1.52);
      bells.push(b);
    }
    const [slx, slz] = sleighAt;
    sl.position.set(slx, L.topY, slz);
    sl.rotation.y = -0.9;
    sl.scale.setScalar(1.2);
    root.add(sl);
    let jingle = 0;
    tappable(sl, (a) => {
      if (a.busy) return;
      a.busy = 1.8;
      jingle = 1.8;
      const s = S();
      if (s) { s.sparkle(10); setTimeout(() => s.sparkle(8), 450); setTimeout(() => s.sparkle(6), 900); }
      burst(world(sack, 0, 1, 0), GOLD, 20, 4, 0.45);
    }, (dt, t) => {
      jingle = Math.max(0, jingle - dt);
      const j = Math.min(1, jingle);
      sl.position.y = L.topY + Math.abs(Math.sin(t * 10)) * 0.35 * j;
      sl.rotation.z = Math.sin(t * 13) * 0.05 * j;
      bells.forEach((b, i) => { b.position.y = 1.35 + Math.sin(t * 30 + i) * 0.08 * j; });
      sackGifts.forEach((g, i) => { g.position.y = [2.8, 2.9, 3.1][i] + Math.abs(Math.sin(t * 11 + i * 2)) * 0.6 * j; g.rotation.y = i + t * 3 * j; });
    });

    // ================= More North Pole details =================
    // Present piles and toy crates outside the workshop doors
    ws.updateMatrixWorld(true);
    const crateTex = label('TOYS', 256, 128, '#b07a45', '#5a2a1e', '900 72px "Bagel Fat One", Georgia, serif');
    const crateM = [std({ color: '#b07a45' }), std({ color: '#b07a45' }), std({ color: '#b07a45' }), std({ color: '#b07a45' }), new THREE.MeshStandardMaterial({ map: crateTex }), new THREE.MeshStandardMaterial({ map: crateTex })];
    [[-6.5, 0.2], [-5.2, -0.6], [6.2, 0.4], [-6.0, 0.0, 1]].forEach(([x, rz, stack]) => {
      const cr = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), crateM);
      cr.position.copy(world(ws, x, stack ? 1.8 : 0.6, D / 2 + 2.2));
      cr.rotation.y = rz;
      cr.castShadow = true;
      root.add(cr);
    });
    for (let k = 0; k < 9; k++) {
      const s2 = 0.6 + rng() * 0.6;
      const gft = new THREE.Group();
      P(gft, new THREE.BoxGeometry(s2, s2 * 0.8, s2), std({ color: toyCols[k % toyCols.length] }), 0, s2 * 0.4, 0);
      P(gft, new THREE.BoxGeometry(s2 + 0.02, s2 * 0.82, 0.12), std({ color: k % 2 ? '#ffd23f' : '#ffffff' }), 0, s2 * 0.4, 0);
      gft.position.copy(world(ws, 4.5 + (k % 3) * 0.9, (Math.floor(k / 3)) * 0.5, D / 2 + 1.6 + (k % 2) * 0.8));
      gft.rotation.y = rng() * 3;
      root.add(gft);
    }
    // Decorated trees either side of the workshop doors
    const pineMesh = new THREE.Mesh(c.pineGeometry(true), vmat());
    [-11, 11].forEach((x) => {
      const tr = pineMesh.clone();
      tr.position.copy(world(ws, x, 0, D / 2 + 2.5));
      tr.scale.setScalar(1.5);
      tr.castShadow = true;
      root.add(tr);
      for (let k = 0; k < 10; k++) {
        const f = k / 10, an = k * 2.4;
        const rr = (1.35 * (1 - f * 0.75)) * 1.5;
        const bb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(FESTIVE[k % 4]).multiplyScalar(2), toneMapped: false }));
        bb.position.copy(tr.position).add(new THREE.Vector3(Math.sin(an) * rr, (0.9 + f * 3.1) * 1.5, Math.cos(an) * rr));
        root.add(bb);
      }
    });
    // Strings of lights looping over the square
    const lightCols = ['#ff4f5e', '#ffd23f', '#5fd4ff', '#7cf29a', '#ff8ad8'];
    const strung = [];
    [[-L.spread - 0.15, -L.spread * 0.2], [-L.spread * 0.2, L.spread * 0.35], [L.spread * 0.35, L.spread + 0.15]].forEach(([a0, a1], seg) => {
      const R = L.frontR - 0.8;
      const p0 = polar(R, a0), p1 = polar(R, a1);
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const u = k / 16;
        const th = a0 + (a1 - a0) * u;
        const [x, z] = polar(R, th);
        pts.push(new THREE.Vector3(x, 4.6 - Math.sin(u * Math.PI) * 1.4, z));
      }
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a2f3a' })));
      [p0, p1].forEach(([x, z]) => P(root, new THREE.CylinderGeometry(0.07, 0.09, 4.7, 6), std({ color: '#ffffff', map: caneStripe }), x, 2.35, z));
      pts.forEach((p, k) => {
        if (k === 0 || k === 16) return;
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(lightCols[(k + seg) % 5]).multiplyScalar(2.4), toneMapped: false }));
        b.position.copy(p).add(new THREE.Vector3(0, -0.12, 0));
        root.add(b);
        strung.push(b);
      });
    });
    updaters.push((t) => strung.forEach((b, i) => { b.visible = Math.sin(t * 2.2 + i * 0.9) > -0.6; }));
    return;
  }

  if (theme === 'jungle') {
    // Rainforest trees and ferns around the village
    const jungleTree = painted([
      [at(new THREE.CylinderGeometry(0.22, 0.34, 4.2, 6), 0, 2.1, 0), '#5a3b24'],
      [at(new THREE.IcosahedronGeometry(1.7, 0), 0, 4.6, 0, 1, 0.75, 1), '#2f8a4e'],
      [at(new THREE.IcosahedronGeometry(1.3, 0), 1.1, 4.1, 0.5, 1, 0.7, 1), '#256f3f'],
      [at(new THREE.IcosahedronGeometry(1.2, 0), -1.0, 4.3, -0.4, 1, 0.7, 1), '#3fa35e'],
      [at(new THREE.IcosahedronGeometry(1.0, 0), 0.2, 5.6, 0.1, 1, 0.75, 1), '#4cb069'],
    ]);
    const tall = sides(120).map((p) => ({ ...p, s: 1.0 + rng() * 1.6, rot: rng() * 6, tint: 0.8 + rng() * 0.35 }));
    root.add(instanced(jungleTree, vmat(), tall));
    const fern = painted([
      [at(new THREE.IcosahedronGeometry(0.9, 0), 0, 0.4, 0, 1.3, 0.5, 1), '#2f7d43'],
      [at(new THREE.IcosahedronGeometry(0.7, 0), 0.8, 0.35, 0.3, 1.2, 0.5, 0.9), '#3fa35e'],
      [at(new THREE.IcosahedronGeometry(0.6, 0), -0.7, 0.3, -0.2, 1.2, 0.5, 0.9), '#256f3f'],
    ]);
    root.add(instanced(fern, vmat(), sides(90, 1.5, 0.12).map((p) => ({ ...p, s: 0.8 + rng() * 0.9, rot: rng() * 6, tint: 0.85 + rng() * 0.3 }))));
    // Hibiscus flowers near the square
    sides(16, 1.2, 0.08).forEach((p) => {
      const fl = new THREE.Group();
      const col = ['#e2283a', '#ff6f9e', '#ff8a2b', '#ffd23f'][(rng() * 4) | 0];
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5), std({ color: '#2f7d43' }));
      stem.position.y = 0.55;
      fl.add(stem);
      for (let k = 0; k < 5; k++) {
        const an = (k / 5) * TAU;
        const pt = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), std({ color: col }));
        pt.scale.set(1, 0.25, 0.6);
        pt.position.set(Math.sin(an) * 0.2, 1.15, Math.cos(an) * 0.2);
        pt.rotation.y = an;
        fl.add(pt);
      }
      const ctr = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), std({ color: '#ffe08a', emissive: '#ffb347', emissiveIntensity: 0.6 }));
      ctr.position.y = 1.2;
      fl.add(ctr);
      fl.position.set(p.x, p.y, p.z);
      fl.scale.setScalar(1 + rng() * 0.6);
      root.add(fl);
    });
    // Tall green karst peaks wrapped in mist
    const peakM = [std({ color: '#3d7a5a' }), std({ color: '#2f6b4c' }), std({ color: '#4a8a66' })];
    ring(13, 105, 165, (x, z, i) => {
      const h = 40 + rng() * 45, rad = 10 + rng() * 9;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.55, rad, h, 8), peakM[i % 3]);
      m.position.set(x, h / 2 - 2, z);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.55, 8, 6, 0, TAU, 0, Math.PI / 2), peakM[(i + 1) % 3]);
      dome.position.y = h / 2;
      m.add(dome);
      root.add(m);
      const mist = glowSprite('#fff6dc', 60, 0.35);
      mist.material.blending = THREE.NormalBlending;
      mist.position.set(x, 10, z + 6);
      root.add(mist);
    });
    // A waterfall pouring off a mossy cliff behind the village into a pool
    const cliffX = 22, cliffZ = -(L.backR + 34);
    const cliff = new THREE.Group();
    const rockM = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 1, flatShading: true });
    [[0, 0, 26, 28, 10], [-15, -2, 14, 20, 9], [15, -1, 14, 23, 9]].forEach(([x, z, w, h, d]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, 3, 3, 1), rockM);
      const pos = b.geometry.attributes.position;
      for (let k = 0; k < pos.count; k++) pos.setXYZ(k, pos.getX(k) + (rng() - 0.5) * 1.6, pos.getY(k), pos.getZ(k) + (rng() - 0.5) * 1.6);
      b.geometry.computeVertexNormals();
      b.position.set(x, h / 2, z);
      cliff.add(b);
      const top = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 1.2, d + 1), std({ color: '#3f8a4e' }));
      top.position.set(x, h + 0.3, z);
      cliff.add(top);
    });
    const fallTex = tex(64, 256, (g, w, h) => {
      g.fillStyle = '#9fe0e8';
      g.fillRect(0, 0, w, h);
      const r = A.rng(3);
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.5})`;
        g.fillRect(r() * w, r() * h, 2 + r() * 3, 18 + r() * 40);
      }
    });
    fallTex.repeat.set(2, 1);
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(7, 27.5), new THREE.MeshStandardMaterial({ map: fallTex, emissive: '#6fc9d4', emissiveIntensity: 0.35, roughness: 0.2, transparent: true, opacity: 0.95 }));
    fall.position.set(0, 13.9, 5.15);
    cliff.add(fall);
    updaters.push((t) => { fallTex.offset.y = (t * 0.9) % 1; });
    const pool = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshStandardMaterial({ color: '#4fb8c2', roughness: 0.15, metalness: 0.2, emissive: '#1d6a72', emissiveIntensity: 0.3 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.06, 11);
    cliff.add(pool);
    for (let k = 0; k < 5; k++) {
      const sp = glowSprite('#ffffff', 7, 0.0);
      sp.material.blending = THREE.NormalBlending;
      cliff.add(sp);
      updaters.push((t) => {
        const u = (t * 0.35 + k / 5) % 1;
        sp.position.set((k - 2) * 1.6, 0.8 + u * 3.5, 6.5);
        sp.scale.setScalar(4 + u * 6);
        sp.material.opacity = Math.sin(u * Math.PI) * 0.5;
      });
    }
    cliff.traverse((o) => { if (o.isMesh && o !== fall && o !== pool) { o.castShadow = true; o.receiveShadow = true; } });
    cliff.position.set(cliffX, L.topY - 0.2, cliffZ);
    cliff.rotation.y = -0.25;
    root.add(cliff);
    // Low golden sun
    const sunM = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff0b0').multiplyScalar(1.5), toneMapped: false, fog: false }));
    sunM.position.set(-130, 34, -265);
    root.add(sunM);
    const sg = glowSprite('#ffb36b', 170, 0.55);
    sg.position.copy(sunM.position);
    root.add(sg);
    // Santa's sleigh still makes it here
    const sleigh = makeSleigh();
    root.add(sleigh);
    updaters.push((t) => {
      const k = (t % 40) / 40;
      sleigh.visible = k < 0.5;
      const u = k / 0.5;
      sleigh.position.set(170 - u * 340, 58 + Math.sin(u * Math.PI) * 12, -215);
      sleigh.rotation.y = Math.PI;
    });
    return;
  }

  if (theme === 'japan') {
    // Snowy pines and plum trees in blossom
    const pines = sides(30).map((p) => ({ ...p, s: 1.0 + rng() * 1.5, rot: rng() * 6, tint: 0.85 + rng() * 0.3 }));
    root.add(instanced(c.pineGeometry(true), vmat(), pines));
    const plum = painted([
      [at(new THREE.CylinderGeometry(0.12, 0.2, 1.8, 5), 0, 0.9, 0), '#3a2a22'],
      [at(new THREE.CylinderGeometry(0.06, 0.1, 1.4, 5), 0.45, 2.1, 0), '#3a2a22'],
      [at(new THREE.IcosahedronGeometry(1.0, 1), 0.6, 2.7, 0, 1, 0.8, 1), '#ffb7d5'],
      [at(new THREE.IcosahedronGeometry(0.85, 1), -0.4, 2.2, 0.3, 1, 0.8, 1), '#ffd3e6'],
      [at(new THREE.IcosahedronGeometry(0.75, 1), 0.1, 3.2, -0.3, 1, 0.8, 1), '#ff9ec4'],
      [at(new THREE.IcosahedronGeometry(0.35, 0), 0.6, 3.25, 0, 1.6, 0.35, 1.4), '#f8fbff'],
    ]);
    root.add(instanced(plum, vmat(), sides(80, 2, 0.15).map((p) => ({ ...p, s: 1.4 + rng() * 1.1, rot: rng() * 6, tint: 0.92 + rng() * 0.12 }))));
    // Mount Fuji, with rounded blue hills in front
    const fuji = new THREE.Mesh(new THREE.ConeGeometry(95, 78, 40, 1, true), std({ color: '#a9b4ff', flatShading: false, fog: false }));
    fuji.position.set(-60, 37, -250);
    root.add(fuji);
    const fcap = new THREE.Mesh(new THREE.ConeGeometry(34, 28, 40, 1, true), std({ color: '#f3f1f7', flatShading: false, fog: false }));
    fcap.position.set(-60, 37 + 39 - 14 + 0.3, -250);
    root.add(fcap);
    const hillM = [std({ color: '#c3b2f0' }), std({ color: '#a6e0cf' })];
    ring(10, 105, 150, (x, z, i) => {
      const rad = 18 + rng() * 16;
      const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 6, 0, TAU, 0, Math.PI / 2), hillM[i % 2]);
      m.scale.y = 0.3 + rng() * 0.25;
      m.position.set(x, -2, z);
      root.add(m);
    });
    sky({ stars: 500, moon: '#fff6e8', moonGlow: '#ffd6ec', moonAt: [95, 80, -250], moonR: 12 });
    // Fuji and the moon both get sleepy kawaii faces
    const faceM = new THREE.MeshBasicMaterial({ color: '#4a3a6a', fog: false });
    const blushM = new THREE.MeshBasicMaterial({ color: '#ff9ec4', transparent: true, opacity: 0.75, fog: false });
    const kawaiiFace = (cx, cy, cz, sc, tilt) => {
      const f = new THREE.Group();
      [-1, 1].forEach((s) => {
        const e = new THREE.Mesh(new THREE.TorusGeometry(1, 0.22, 6, 16, Math.PI), faceM);
        e.position.set(s * 2.2, 0, 0);
        f.add(e);
        const b = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), blushM);
        b.scale.x = 1.5;
        b.position.set(s * 3.3, -1.4, 0);
        f.add(b);
      });
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.18, 6, 14, Math.PI), faceM);
      m.rotation.z = Math.PI;
      m.position.y = -1.0;
      f.add(m);
      f.position.set(cx, cy, cz);
      f.rotation.x = tilt;
      f.scale.setScalar(sc);
      root.add(f);
    };
    kawaiiFace(-60, 46, -250 + 37.2, 2.2, -0.88);
    kawaiiFace(95, 80, -250 + 12.3, 1.3, 0);
    // Torii gate at the left of the square
    const vermilion = std({ color: '#ff6f8f' });
    const black = std({ color: '#1d1d22' });
    const snowM = std({ color: '#f4f8ff', roughness: 1 });
    const torii = new THREE.Group();
    [-1, 1].forEach((sd) => {
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 5.4, 12), vermilion);
      pl.position.set(sd * 2.5, 2.7, 0);
      const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.5, 12), black);
      ft.position.set(sd * 2.5, 0.25, 0);
      torii.add(pl, ft);
    });
    const nuki = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.32, 0.32), vermilion);
    nuki.position.y = 4.3;
    const kasa = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.4, 0.6), black);
    kasa.position.y = 5.55;
    const shimaki = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.32, 0.5), vermilion);
    shimaki.position.y = 5.2;
    const tsuka = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.75, 0.3), vermilion);
    tsuka.position.y = 4.8;
    const tsnow = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.18, 0.62), snowM);
    tsnow.position.y = 5.84;
    torii.add(nuki, kasa, shimaki, tsuka, tsnow);
    [-1, 1].forEach((sd) => {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), black);
      tip.position.set(sd * 4.0, 5.68, 0);
      tip.rotation.z = sd * 0.22;
      torii.add(tip);
    });
    torii.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const tth = -(L.spread + 0.38);
    const [tx, tz] = polar(L.R0 + L.dR * 2, tth);
    torii.position.set(tx, groundAt(tx, tz), tz);
    torii.rotation.y = -tth + 0.35;
    root.add(torii);
    // Arched red bridge over a frozen koi pond on the right
    const pondG = new THREE.Group();
    const pond = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshStandardMaterial({ color: '#bcd6ea', roughness: 0.1, metalness: 0.3 }));
    pond.rotation.x = -Math.PI / 2;
    pond.position.y = 0.05;
    pondG.add(pond);
    const rocks = std({ color: '#8a8f9c' });
    for (let k = 0; k < 12; k++) {
      const an = (k / 12) * TAU;
      const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + rng() * 0.35, 0), rocks);
      rk.position.set(Math.sin(an) * 4.6, 0.2, Math.cos(an) * 4.6);
      rk.scale.y = 0.6;
      pondG.add(rk);
    }
    const deck = std({ color: '#ff8fb0' });
    const N = 11;
    for (let k = 0; k < N; k++) {
      const u = k / (N - 1);
      const x = -4.6 + u * 9.2;
      const y = 0.25 + Math.sin(u * Math.PI) * 1.5;
      const slope = Math.cos(u * Math.PI) * 1.5 * Math.PI / 9.2;
      const pl = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.15, 1.6), deck);
      pl.position.set(x, y, 0);
      pl.rotation.z = Math.atan(slope);
      pondG.add(pl);
      if (k % 2 === 0) [-0.75, 0.75].forEach((zz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), deck);
        post.position.set(x, y + 0.45, zz);
        pondG.add(post);
      });
    }
    [-0.75, 0.75].forEach((zz) => {
      const pts = [];
      for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push(new THREE.Vector3(-4.6 + u * 9.2, 0.25 + Math.sin(u * Math.PI) * 1.5 + 0.82, zz)); }
      pondG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.06, 5), deck));
    });
    pondG.traverse((o) => { if (o.isMesh && o !== pond) o.castShadow = true; });
    const bth = L.spread + 0.42;
    const [bx, bz] = polar(L.frontR + 4, bth);
    pondG.position.set(bx, groundAt(bx, bz), bz);
    pondG.rotation.y = -bth;
    root.add(pondG);
    // Paper lanterns strung over the square, gently swaying
    const lanternMs = ['#ff7eb6', '#ffd36b', '#7fe0c8', '#b6a4f0'].map((c2) => new THREE.MeshStandardMaterial({ color: c2, emissive: c2, emissiveIntensity: 1.6 }));
    const rope = new THREE.LineBasicMaterial({ color: '#2a2a30' });
    [-1, 1].forEach((sd) => {
      const a0 = polar(L.frontR - 1, sd * (L.spread + 0.1));
      const a1 = polar(L.frontR - 7, sd * 0.15);
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const u = k / 12;
        pts.push(new THREE.Vector3(a0[0] + (a1[0] - a0[0]) * u, 4.2 - Math.sin(u * Math.PI) * 1.2, a0[1] + (a1[1] - a0[1]) * u));
      }
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rope));
      for (let k = 1; k < 12; k += 2) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), lanternMs[k % 4]);
        l.scale.y = 1.3;
        const p = pts[k];
        l.position.set(p.x, p.y - 0.35, p.z);
        l.userData.seed = k + sd * 3;
        root.add(l);
        updaters.push((t) => { l.rotation.z = Math.sin(t * 1.4 + l.userData.seed) * 0.12; });
      }
    });

    // Kira-kira: little pastel stars bobbing in the air
    const starCols = ['#ffd36b', '#ff9ec4', '#9fd8f5', '#b6a4f0', '#8fdcc0'];
    for (let k = 0; k < 18; k++) {
      const st = makeStarLike(starCols[k % starCols.length]);
      st.scale.setScalar(0.3 + rng() * 0.25);
      const [x, z] = polar(L.R0 + rng() * (L.backR - L.R0 + 6), (rng() - 0.5) * 2 * (L.spread + 0.3));
      const y0 = L.topY + 4 + rng() * 6;
      st.position.set(x, y0, z);
      const seed = rng() * 6;
      root.add(st);
      updaters.push((t) => { st.position.y = y0 + Math.sin(t * 1.3 + seed) * 0.6; st.rotation.y = t * 1.2 + seed; st.rotation.z = Math.sin(t + seed) * 0.3; });
    }

    // ================= Kawaii things to tap =================
    const fx = makeFx({ root, updaters, glowSprite, tappables: c.tappables });
    const W2 = (o, x = 0, y = 0, z = 0) => o.localToWorld(new THREE.Vector3(x, y, z));
    const white = std({ color: '#ffffff', flatShading: false }), ink = new THREE.MeshBasicMaterial({ color: '#2a2238' });
    const pink = std({ color: '#ff9ec4', flatShading: false }), gold = std({ color: '#ffd36b', flatShading: false });

    // ---- Maneki-neko: a lucky cat that waves; tap for a shower of gold coins ----
    const cat = new THREE.Group();
    part(cat, new THREE.BoxGeometry(1.5, 0.3, 1.3), std({ color: '#ff6f8f' }), 0, 0.15, 0);
    part(cat, new THREE.SphereGeometry(0.55, 16, 12), white, 0, 0.8, 0, 1, 0.95, 0.85);
    const head = new THREE.Group();
    head.position.set(0, 1.55, 0.05);
    cat.add(head);
    part(head, new THREE.SphereGeometry(0.5, 18, 14), white, 0, 0, 0, 1.1, 0.95, 0.95);
    [-1, 1].forEach((s) => {
      const ear = part(head, new THREE.ConeGeometry(0.17, 0.32, 10), white, s * 0.32, 0.45, 0);
      ear.rotation.z = -s * 0.35;
      part(head, new THREE.ConeGeometry(0.1, 0.18, 8), pink, s * 0.32, 0.45, 0.06).rotation.z = -s * 0.35;
      const eye = part(head, new THREE.TorusGeometry(0.08, 0.025, 5, 12, Math.PI), ink, s * 0.2, 0.03, 0.46);
      eye.castShadow = false;
      part(head, new THREE.SphereGeometry(0.08, 8, 6), pink, s * 0.33, -0.1, 0.4, 1.3, 0.6, 0.4);
      [0.08, -0.02].forEach((dy) => { const wsk = part(head, new THREE.BoxGeometry(0.28, 0.015, 0.015), ink, s * 0.48, -0.05 + dy, 0.33); wsk.rotation.z = s * dy * 2; });
    });
    part(head, new THREE.SphereGeometry(0.04, 8, 6), pink, 0, -0.06, 0.5);
    const collar = part(cat, new THREE.TorusGeometry(0.42, 0.06, 6, 18), std({ color: '#e2483d' }), 0, 1.15, 0.03);
    collar.rotation.x = Math.PI / 2;
    const catBell = part(cat, new THREE.SphereGeometry(0.1, 10, 8), gold, 0, 1.06, 0.45);
    part(cat, new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16), gold, 0.15, 0.8, 0.5, 1, 1.4, 1).rotation.x = Math.PI / 2;
    const paw = new THREE.Group();
    paw.position.set(-0.45, 1.2, 0.15);
    cat.add(paw);
    part(paw, new THREE.CapsuleGeometry(0.12, 0.35, 4, 8), white, 0, 0.25, 0);
    part(paw, new THREE.SphereGeometry(0.06, 8, 6), pink, 0, 0.45, 0.1);
    cat.scale.setScalar(1.6);
    const catTh = -L.spread * 0.72;
    const [ctx2, ctz] = polar(L.frontR - 2.6, catTh);
    cat.position.set(ctx2, 0, ctz);
    cat.rotation.y = Math.atan2(-ctx2, -ctz) * 0.5;
    root.add(cat);
    let luck = 0;
    fx.tappable(cat, (a) => {
      if (a.busy) return;
      a.busy = 1.8;
      luck = 1.8;
      const s = fx.sound();
      if (s) { s.pop(1400, 2400, 0.25); setTimeout(() => s.pop(1600, 2600, 0.2), 180); setTimeout(() => s.sparkle(8), 400); }
      fx.burst(W2(head, 0, 0.6, 0), ['#ffd36b', '#fff3c4', '#ffb347'], 26, 5, 0.55);
    }, (dt, t) => {
      luck = Math.max(0, luck - dt);
      paw.rotation.x = -0.2 + Math.sin(t * (luck > 0 ? 18 : 3)) * (luck > 0 ? 0.6 : 0.35);
      head.rotation.z = Math.sin(t * 1.2) * 0.08 + (luck > 0 ? Math.sin(t * 12) * 0.12 : 0);
      catBell.position.y = 1.06 + Math.abs(Math.sin(t * 10)) * 0.04 * Math.min(1, luck);
      cat.position.y = Math.abs(Math.sin(t * 10)) * 0.3 * Math.min(1, luck);
    });

    // ---- Daruma: tap and it wobbles (it always rolls back upright) ----
    const daruma = new THREE.Group();
    const dBody = new THREE.Group();
    daruma.add(dBody);
    part(dBody, new THREE.SphereGeometry(0.8, 20, 16), std({ color: '#ff6f8f', flatShading: false }), 0, 0.85, 0, 1, 1.12, 1);
    const dFace = part(dBody, new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: '#fff6ec' }), 0, 1.05, 0.8);
    dFace.scale.y = 0.85;
    dFace.rotation.x = -0.12;
    [-1, 1].forEach((s) => {
      part(dBody, new THREE.CircleGeometry(0.11, 14), ink, s * 0.18, 1.1, 0.81).rotation.x = -0.12;
      part(dBody, new THREE.CircleGeometry(0.04, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), s * 0.18 + 0.04, 1.14, 0.82).rotation.x = -0.12;
      part(dBody, new THREE.CircleGeometry(0.08, 12), new THREE.MeshBasicMaterial({ color: '#ff9ec4' }), s * 0.32, 0.92, 0.79).rotation.x = -0.12;
    });
    part(dBody, new THREE.TorusGeometry(0.07, 0.02, 4, 10, Math.PI), ink, 0, 0.95, 0.81).rotation.set(-0.12, 0, Math.PI);
    part(dBody, new THREE.TorusGeometry(0.42, 0.05, 6, 20, Math.PI), gold, 0, 0.5, 0.62).rotation.set(0.5, 0, Math.PI);
    const dTh = L.spread * 0.5;
    const [dx2, dz2] = polar(L.frontR - 3.6, dTh);
    daruma.position.set(dx2, 0, dz2);
    daruma.rotation.y = Math.atan2(-dx2, -dz2) * 0.6;
    daruma.scale.setScalar(1.3);
    root.add(daruma);
    let wob = 0;
    fx.tappable(daruma, (a) => {
      wob = Math.min(wob + 1.2, 1.8);
      const s = fx.sound();
      if (s) { s.thunk(); setTimeout(() => s.pop(900, 1500, 0.2), 200); }
      fx.burst(W2(dBody, 0, 2, 0), ['#ff9ec4', '#ffffff', '#ffd36b'], 12, 3, 0.4);
    }, (dt, t) => {
      wob = Math.max(0, wob - dt * 0.6);
      dBody.rotation.z = Math.sin(t * 7) * 0.45 * wob + Math.sin(t * 0.9) * 0.03;
      dBody.rotation.x = Math.cos(t * 5.3) * 0.2 * wob;
    });

    // ---- Gachapon: turn the crank, out rolls a capsule that pops open ----
    const gacha = new THREE.Group();
    part(gacha, new THREE.BoxGeometry(1.4, 1.5, 1.2), std({ color: '#9fd8f5' }), 0, 0.75, 0);
    part(gacha, new THREE.BoxGeometry(1.5, 0.15, 1.3), std({ color: '#ffffff' }), 0, 1.55, 0);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false }));
    dome.position.y = 2.25;
    gacha.add(dome);
    const capCols = ['#ff9ec4', '#ffd36b', '#8fdcc0', '#b6a4f0', '#9fd8f5', '#ffb38a'];
    const capsule = (k) => {
      const cg = new THREE.Group();
      part(cg, new THREE.SphereGeometry(0.2, 12, 8, 0, TAU, 0, Math.PI / 2), std({ color: capCols[k % capCols.length], flatShading: false }), 0, 0, 0);
      const bottom = part(cg, new THREE.SphereGeometry(0.2, 12, 8, 0, TAU, Math.PI / 2, Math.PI / 2), std({ color: '#ffffff', flatShading: false }), 0, 0, 0);
      cg.userData.top = cg.children[0];
      cg.userData.bottom = bottom;
      return cg;
    };
    for (let k = 0; k < 14; k++) {
      const cp = capsule(k);
      const a = rng() * TAU, r = rng() * 0.45;
      cp.position.set(Math.cos(a) * r, 1.85 + rng() * 0.5, Math.sin(a) * r);
      cp.rotation.set(rng() * 3, rng() * 3, 0);
      gacha.add(cp);
    }
    const crank = new THREE.Group();
    crank.position.set(0, 1.0, 0.62);
    gacha.add(crank);
    part(crank, new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), std({ color: '#ff6f8f' }), 0, 0, 0).rotation.x = Math.PI / 2;
    part(crank, new THREE.BoxGeometry(0.4, 0.08, 0.1), std({ color: '#ffffff' }), 0, 0, 0.06);
    part(gacha, new THREE.BoxGeometry(0.4, 0.35, 0.1), new THREE.MeshBasicMaterial({ color: '#2a2238' }), 0, 0.35, 0.61);
    const gTh = L.spread * 0.92;
    const [gx, gz] = polar(L.frontR - 1.8, gTh);
    gacha.position.set(gx, 0, gz);
    gacha.rotation.y = Math.atan2(-gx, -gz) * 0.7;
    gacha.scale.setScalar(1.25);
    root.add(gacha);
    const rolling = [], opened = [];
    let capN = 0, crankT = 0;
    fx.tappable(gacha, (a) => {
      if (a.busy) return;
      a.busy = 1.6;
      crankT = 0.8;
      const s = fx.sound();
      if (s) { s.creak(); setTimeout(() => s.pop(600, 300, 0.25), 750); }
      setTimeout(() => {
        const cp = capsule(capN++);
        gacha.updateMatrixWorld(true);
        const from = W2(gacha, 0, 0.35, 0.8);
        const to = W2(gacha, (Math.random() - 0.5) * 1.6, 0.25, 2.0 + Math.random() * 1.2);
        cp.position.copy(from);
        root.add(cp);
        rolling.push({ cp, from, to, k: 0 });
      }, 800);
    }, (dt) => {
      if (crankT > 0) { crankT = Math.max(0, crankT - dt); crank.rotation.z -= dt * 8; }
      for (let i = rolling.length - 1; i >= 0; i--) {
        const r = rolling[i];
        r.k = Math.min(1, r.k + dt * 1.2);
        r.cp.position.lerpVectors(r.from, r.to, r.k);
        r.cp.position.y += Math.sin(r.k * Math.PI) * 0.6;
        r.cp.rotation.x += dt * 8;
        if (r.k >= 1) {
          rolling.splice(i, 1);
          r.cp.rotation.set(0, 0, 0);
          r.cp.userData.top.position.y = 0.25;
          r.cp.userData.top.rotation.z = 0.6;
          fx.burst(r.cp.position.clone().add(new THREE.Vector3(0, 0.3, 0)), ['#ff9ec4', '#ffd36b', '#9fd8f5', '#ffffff'], 16, 3.5, 0.45);
          const s = fx.sound();
          if (s) s.sparkle(6);
          opened.push(r.cp);
          if (opened.length > 8) root.remove(opened.shift());
        }
      }
    });
    return;
  }

  if (theme === 'cyber') {
    const fx = makeFx({ root, updaters, glowSprite, tappables: c.tappables });
    const NEON = ['#ff2bd6', '#00e5ff', '#a6ff00', '#ff8a00', '#7c4dff', '#ff2b5a'];
    const glow = (col, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), toneMapped: false });

    // ---- Skyline: towers full of lit windows, neon roof edges, blinking antennas ----
    const winTex = tex(128, 256, (g, w, h) => {
      g.fillStyle = '#0d0c18';
      g.fillRect(0, 0, w, h);
      const r = A.rng(77);
      for (let y = 4; y < h; y += 10) for (let x = 4; x < w; x += 10) {
        if (r() < 0.45) continue;
        g.fillStyle = ['#ffd27a', '#7af7ff', '#ff8ad8', '#ffffff', '#c9a6ff'][(r() * 5) | 0];
        g.globalAlpha = 0.35 + r() * 0.65;
        g.fillRect(x, y, 6, 5);
      }
      g.globalAlpha = 1;
    });
    const towerM = new THREE.MeshStandardMaterial({ color: '#1a1830', map: winTex, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 1.1, roughness: 0.6, metalness: 0.3 });
    const blinks = [];
    const tower = (x, z, w, h, d, ry) => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), towerM);
      t.position.set(x, h / 2 - 1, z);
      t.rotation.y = ry;
      root.add(t);
      const col = NEON[(Math.random() * NEON.length) | 0];
      const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3), glow(col, 1.8));
      edge.position.set(x, h - 1, z);
      edge.rotation.y = ry;
      root.add(edge);
      if (Math.random() < 0.5) {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, h * 0.15, 5), std({ color: '#2a2d40' }));
        mast.position.set(x, h - 1 + h * 0.075, z);
        root.add(mast);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), glow('#ff2b5a', 2.5));
        tip.position.set(x, h - 1 + h * 0.15, z);
        tip.userData.seed = Math.random() * 6;
        root.add(tip);
        blinks.push(tip);
      }
      return t;
    };
    ring(34, 65, 175, (x, z, i, th) => tower(x, z, 9 + rng() * 14, 30 + rng() * 95, 9 + rng() * 12, -th + (rng() - 0.5) * 0.4));
    // shorter blocks crowding the sides of the village, like a street canyon
    for (let k = 0; k < 18; k++) {
      const side = k % 2 ? 1 : -1;
      const th = side * (L.spread + 0.9 + rng() * 0.6);
      const R = L.frontR + 14 + rng() * (L.backR - L.frontR + 26);
      const [x, z] = polar(R, th);
      tower(x, z, 6 + rng() * 6, 8 + rng() * 14, 6 + rng() * 6, -th);
    }
    updaters.push((t) => blinks.forEach((b) => { b.visible = Math.sin(t * 3 + b.userData.seed) > 0; }));

    // ---- Animated neon billboards; tap one and it glitches to a new ad ----
    const adTex = (k) => tex(256, 128, (g, w, h) => {
      const c1 = NEON[k % NEON.length], c2 = NEON[(k + 2) % NEON.length];
      g.fillStyle = '#0a0814'; g.fillRect(0, 0, w, h);
      g.strokeStyle = c1; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
      g.shadowColor = c1; g.shadowBlur = 16;
      g.fillStyle = c1;
      g.font = '900 54px "Bagel Fat One", Georgia, serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(['XMAS', 'NOEL', 'JOY', 'SNOW?', 'GIFTS', '24/7'][k % 6], w / 2, h / 2 - 8);
      g.shadowColor = c2; g.fillStyle = c2;
      for (let i = 0; i < 9; i++) g.fillRect(24 + i * 24, h - 26, 14, 6);
    });
    const ads = [];
    ring(6, 70, 95, (x, z, i, th) => {
      const bb = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(17, 9, 0.6), std({ color: '#141320' }));
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: adTex(i), toneMapped: false, color: new THREE.Color('#ffffff').multiplyScalar(1.6) }));
      scr.position.z = 0.32;
      bb.add(frame, scr);
      bb.position.set(x * 0.92, 26 + (i % 3) * 9, z * 0.92);
      bb.lookAt(0, bb.position.y * 0.6, 0);
      root.add(bb);
      ads.push({ bb, scr, k: i, glitch: 0 });
      fx.tappable(bb, () => {
        const ad = ads[i];
        ad.glitch = 0.7;
        const s = fx.sound();
        if (s) { s.whoosh(0.25, 3000, 400, 0.2); s.pop(220, 60, 0.3); }
        setTimeout(() => { ad.k += 1; ad.scr.material.map.dispose(); ad.scr.material.map = adTex(ad.k); }, 350);
        fx.burst(bb.localToWorld(new THREE.Vector3(0, 0, 1)), [NEON[ad.k % 6], '#ffffff'], 20, 6, 0.8, 0.4);
      });
    });
    updaters.push((t, dt) => ads.forEach((ad) => {
      ad.glitch = Math.max(0, ad.glitch - dt);
      const flick = ad.glitch > 0 ? (Math.random() < 0.5 ? 0.2 : 2.4) : 1.4 + Math.sin(t * 3 + ad.k) * 0.25;
      ad.scr.material.color.setScalar(flick);
      ad.scr.position.x = ad.glitch > 0 ? (Math.random() - 0.5) * 0.8 : 0;
    }));

    // ---- A giant hologram present spinning above the city ----
    const holo = new THREE.Group();
    const hm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#00e5ff').multiplyScalar(1.6), wireframe: true, transparent: true, opacity: 0.8, toneMapped: false });
    holo.add(new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10, 3, 3, 3), hm));
    const rib = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2bd6').multiplyScalar(2), transparent: true, opacity: 0.7, toneMapped: false });
    holo.add(new THREE.Mesh(new THREE.BoxGeometry(10.3, 8.3, 1.4), rib), new THREE.Mesh(new THREE.BoxGeometry(1.4, 8.3, 10.3), rib));
    [-1, 1].forEach((s) => { const lp = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.35, 6, 16), rib); lp.position.set(s * 1.7, 5.2, 0); lp.rotation.y = Math.PI / 2; lp.rotation.x = s * 0.5; holo.add(lp); });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(4, 0.6, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = -19;
    holo.add(beam);
    holo.position.set(0, 46, -(L.backR + 70));
    root.add(holo);
    updaters.push((t) => {
      holo.rotation.y = t * 0.4;
      holo.position.y = 46 + Math.sin(t * 0.8) * 1.5;
      hm.opacity = Math.random() < 0.03 ? 0.2 : 0.8;
    });

    // ---- Tron-style hover cars in traffic lanes above the city ----
    const cars = [];
    for (let k = 0; k < 16; k++) {
      const car = new THREE.Group();
      const model = makeLightCar(NEON[k % 6]);
      model.rotation.y = Math.PI / 2; // faces +x
      model.scale.setScalar(1.3);
      car.add(model);
      const trail = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.35), new THREE.MeshBasicMaterial({ color: NEON[k % 6], transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      trail.position.set(-6.5, 0.8, 0);
      car.add(trail);
      const dir = k % 2 ? 1 : -1;
      car.userData = { dir, speed: 18 + rng() * 22, y: 14 + (k % 6) * 5 + rng() * 2, z: -(45 + (k % 5) * 18 + rng() * 6), x: (rng() - 0.5) * 300, wheels: model.userData.wheels };
      car.rotation.y = dir > 0 ? 0 : Math.PI;
      root.add(car);
      cars.push(car);
    }
    updaters.push((t, dt) => cars.forEach((car) => {
      const u = car.userData;
      u.x += u.dir * u.speed * dt;
      if (u.x > 160) u.x = -160;
      if (u.x < -160) u.x = 160;
      car.position.set(u.x, u.y + Math.sin(t * 2 + u.z) * 0.3, u.z);
    }));

    // ---- The Grid: a glowing circuit round the square where light cycles and light cars race ----
    const circuit = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-12, 0, -6.2), new THREE.Vector3(0, 0, -5.8), new THREE.Vector3(12, 0, -6.2),
      new THREE.Vector3(15.5, 0, -8.6), new THREE.Vector3(12, 0, -10.9), new THREE.Vector3(0, 0, -11.3),
      new THREE.Vector3(-12, 0, -10.9), new THREE.Vector3(-15.5, 0, -8.6),
    ], true, 'catmullrom', 0.5);
    const laneAt = (u, off) => {
      const p2 = circuit.getPointAt(u), d = circuit.getTangentAt(u);
      return { p: p2.add(new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(off)), d };
    };
    [-1.3, 1.3].forEach((off) => {
      const pts = [];
      for (let k = 0; k <= 160; k++) pts.push(laneAt(k / 160, off).p.setY(0.04));
      const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 320, 0.05, 4, true), neonMat('#00e5ff', 1.4));
      root.add(line);
    });
    const deckPts = [];
    for (let k = 0; k <= 160; k++) deckPts.push(laneAt(k / 160, 0).p.setY(0.02));
    const deckLine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(deckPts, true), 320, 0.025, 4, true), neonMat('#7c4dff', 1.2));
    root.add(deckLine);
    const racers = [];
    const addRacer = (model, color, height, off, speed, start) => {
      model.scale.setScalar(1.1);
      root.add(model);
      const trail = makeTrail(color, height);
      root.add(trail.mesh);
      racers.push({ model, trail, off, speed, u: start, wob: rng() * 6 });
    };
    ['#00e5ff', '#ff8a00', '#a6ff00'].forEach((col, k) => addRacer(makeLightCycle(col), col, 0.95, -0.6 + (k % 2) * 0.4, 0.085 + k * 0.012, k * 0.33));
    ['#ff2bd6', '#7c4dff'].forEach((col, k) => addRacer(makeLightCar(col), col, 0.7, 0.75, 0.07 + k * 0.01, 0.15 + k * 0.5));
    updaters.push((t, dt) => racers.forEach((r) => {
      r.u = (r.u + dt * r.speed) % 1;
      const { p: p2, d } = laneAt(r.u, r.off + Math.sin(t * 0.9 + r.wob) * 0.25);
      r.model.position.copy(p2);
      r.model.rotation.y = Math.atan2(d.x, d.z);
      r.model.rotation.z = -Math.sin(t * 0.9 + r.wob) * 0.12;
      r.model.userData.wheels.forEach((w) => { w.rotation.x += dt * 20; });
      r.trail.push(p2);
    }));

    // ---- Maglev train looping round an elevated track behind the village ----
    const TR = L.backR + 16, TY = L.topY + 9;
    const trackPts = [];
    for (let k = 0; k <= 60; k++) {
      const th = -1.3 + (k / 60) * 2.6;
      const [x, z] = polar(TR, th);
      trackPts.push(new THREE.Vector3(x, TY, z));
    }
    const trackCurve = new THREE.CatmullRomCurve3(trackPts);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(trackCurve, 120, 0.45, 6), std({ color: '#2a2d40', metalness: 0.6, roughness: 0.3 })));
    const rail = new THREE.Mesh(new THREE.TubeGeometry(trackCurve, 120, 0.1, 5), glow('#00e5ff', 1.8));
    rail.position.y = 0.5;
    root.add(rail);
    for (let k = 0; k <= 12; k++) {
      const th = -1.3 + (k / 12) * 2.6;
      const [x, z] = polar(TR, th);
      part(root, new THREE.BoxGeometry(0.8, TY, 0.8), std({ color: '#1d1f2e', metalness: 0.5 }), x, TY / 2, z);
    }
    const train = [];
    for (let k = 0; k < 4; k++) {
      const car = new THREE.Group();
      part(car, new THREE.BoxGeometry(1.8, 1.6, 5), std({ color: '#e9edf6', metalness: 0.5, roughness: 0.3 }), 0, 1.1, 0);
      [-1, 1].forEach((s) => part(car, new THREE.PlaneGeometry(4.4, 0.5), glow(k % 2 ? '#ff2bd6' : '#00e5ff', 1.6), s * 0.91, 1.3, 0).rotation.y = s * Math.PI / 2);
      root.add(car);
      train.push(car);
    }
    updaters.push((t) => {
      const cyc = (t % 14) / 14;
      train.forEach((car, k) => {
        const u = cyc * 1.6 - 0.3 - k * 0.045;
        car.visible = u > 0 && u < 1;
        if (!car.visible) return;
        const p2 = trackCurve.getPointAt(u), d = trackCurve.getTangentAt(u);
        car.position.copy(p2);
        car.rotation.y = Math.atan2(d.x, d.z);
      });
    });

    // ---- Vending machines: tap for a fizzy neon drink ----
    const canCols = ['#ff2bd6', '#00e5ff', '#a6ff00', '#ff8a00'];
    const vendTex = tex(128, 256, (g, w, h) => {
      g.fillStyle = '#e9f6ff'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        g.fillStyle = canCols[(x + y) % 4];
        g.fillRect(10 + x * 28, 20 + y * 40, 18, 30);
        g.fillStyle = 'rgba(255,255,255,.6)';
        g.fillRect(12 + x * 28, 22 + y * 40, 4, 26);
      }
      g.fillStyle = '#14121f'; g.fillRect(0, 186, w, 70);
      g.fillStyle = '#00e5ff'; g.fillRect(84, 200, 30, 14);
    });
    const cansOut = [];
    [-1, 1].forEach((side) => {
      const vm = new THREE.Group();
      part(vm, new THREE.BoxGeometry(1.5, 2.6, 1.1), std({ color: side > 0 ? '#ff2b5a' : '#1f6fff', metalness: 0.3, roughness: 0.4 }), 0, 1.3, 0);
      const front = part(vm, new THREE.PlaneGeometry(1.3, 2.3), new THREE.MeshBasicMaterial({ map: vendTex, color: '#d8e4f0' }), 0, 1.35, 0.56);
      front.castShadow = false;
      part(vm, new THREE.BoxGeometry(1.6, 0.1, 1.2), glow(side > 0 ? '#ff2bd6' : '#00e5ff'), 0, 2.65, 0);
      const vth = side * (L.spread + 0.08);
      const [vx, vz] = polar(L.frontR - 1.4, vth);
      vm.position.set(vx, 0, vz);
      vm.rotation.y = Math.atan2(-vx, -vz) * 0.85;
      vm.scale.setScalar(1.3);
      root.add(vm);
      fx.tappable(vm, (a) => {
        if (a.busy) return;
        a.busy = 1.2;
        const s = fx.sound();
        if (s) { s.pop(400, 120, 0.3); setTimeout(() => s.thunk(), 380); setTimeout(() => s.sparkle(5), 650); }
        setTimeout(() => {
          vm.updateMatrixWorld(true);
          const col = canCols[(Math.random() * 4) | 0];
          const can = new THREE.Group();
          part(can, new THREE.CylinderGeometry(0.16, 0.16, 0.45, 12), std({ color: col, metalness: 0.6, roughness: 0.25 }), 0, 0, 0);
          part(can, new THREE.CylinderGeometry(0.17, 0.17, 0.06, 12), std({ color: '#d9dde6', metalness: 0.7 }), 0, 0.24, 0);
          const from = vm.localToWorld(new THREE.Vector3(0, 0.3, 0.7));
          const to = vm.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.18, 1.6 + Math.random() * 0.6));
          can.position.copy(from);
          root.add(can);
          cansOut.push({ can, from, to, k: 0 });
          fx.burst(from.clone().add(new THREE.Vector3(0, 0.5, 0)), [col, '#ffffff'], 16, 3.5, 0.45);
          if (cansOut.length > 10) root.remove(cansOut.shift().can);
        }, 380);
      });
    });
    updaters.push((t, dt) => cansOut.forEach((cn) => {
      if (cn.k >= 1) return;
      cn.k = Math.min(1, cn.k + dt * 2);
      cn.can.position.lerpVectors(cn.from, cn.to, cn.k);
      cn.can.position.y += Math.sin(cn.k * Math.PI) * 0.5;
      cn.can.rotation.z = cn.k * Math.PI / 2;
    }));

    // ---- Puddles on the square and a purple glow of city haze ----
    for (let k = 0; k < 7; k++) {
      const [x, z] = polar(L.frontR - 1.5 - rng() * 6, (rng() - 0.5) * 2 * (L.spread + 0.2));
      const pd = new THREE.Mesh(new THREE.CircleGeometry(0.8 + rng() * 1.2, 20), new THREE.MeshStandardMaterial({ color: '#1a1530', metalness: 0.9, roughness: 0.05, emissive: NEON[k % 6], emissiveIntensity: 0.12 }));
      pd.rotation.x = -Math.PI / 2;
      pd.scale.y = 0.6 + rng() * 0.4;
      pd.position.set(x, 0.02, z);
      root.add(pd);
    }
    [['#ff2bd6', -80, 30], ['#7c4dff', 60, 40], ['#00e5ff', 0, 20]].forEach(([col, x, y]) => {
      const hz = glowSprite(col, 220, 0.18);
      hz.position.set(x, y, -230);
      root.add(hz);
    });

    // ---- Santa still flies through, with a neon trail ----
    const sleigh = makeSleigh();
    const sTrail = glowSprite('#ff2bd6', 14, 0.6);
    sTrail.position.x = 6;
    sleigh.add(sTrail);
    root.add(sleigh);
    updaters.push((t) => {
      const k = (t % 30) / 30;
      sleigh.visible = k < 0.5;
      const u = k / 0.5;
      sleigh.position.set(-170 + u * 340, 60 + Math.sin(u * Math.PI) * 12, -200);
      sleigh.rotation.z = Math.cos(u * Math.PI) * 0.12;
    });
    return;
  }

  if (theme === 'gingerbread') {
    // Candy forest in pinks, mints and whites
    const trees = sides(100).map((p) => ({ ...p, s: 1.1 + rng() * 1.5, rot: rng() * 6, tint: 0.9 + rng() * 0.2 }));
    root.add(instanced(candyTreeGeometry(['#ff8fc4', '#7fe3c4', '#ffb3d9']), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6 }), trees));
    // Giant lollipops dotted around
    const lolliTex = tex(128, 128, (g, w) => {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, w, w);
      g.translate(w / 2, w / 2);
      for (let i = 0; i < 8; i++) {
        g.rotate(TAU / 8);
        g.fillStyle = i % 2 ? '#ff4f81' : '#7cf29a';
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(w * 0.35, w * 0.1, w * 0.5, w * 0.5);
        g.lineTo(w * 0.3, w * 0.5);
        g.quadraticCurveTo(w * 0.2, w * 0.15, 0, 0);
        g.fill();
      }
    });
    sides(14, 2, 0.15).forEach((p) => {
      const g = new THREE.Group();
      const h = 3 + rng() * 2.5;
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h, 6), mat('#ffffff')));
      g.children[0].position.y = h / 2;
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.3, 24), [mat('#ff4f81'), new THREE.MeshStandardMaterial({ map: lolliTex, roughness: 0.35 }), new THREE.MeshStandardMaterial({ map: lolliTex, roughness: 0.35 })]);
      disc.rotation.x = Math.PI / 2;
      disc.position.y = h + 0.9;
      g.add(disc);
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = rng() * 6;
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      root.add(g);
    });
    // Ice-cream mountains with cherries on top
    for (let i = 0; i < 10; i++) {
      const th = -1.25 + (2.5 * i) / 9 + (rng() - 0.5) * 0.15;
      const R = 110 + rng() * 50;
      const h = 30 + rng() * 30, rad = 22 + rng() * 14;
      const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 10), std({ color: ['#ffd1e6', '#c9f2e2', '#fff2c9'][i % 3] }));
      m.position.set(R * Math.sin(th), h / 2 - 2, -R * Math.cos(th));
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.42, 12, 8), std({ color: '#ffffff' }));
      scoop.position.y = h * 0.32;
      const cherry = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.12, 10, 8), new THREE.MeshStandardMaterial({ color: '#e2283a', emissive: '#a0101a', emissiveIntensity: 0.4 }));
      cherry.position.y = h * 0.32 + rad * 0.45;
      m.add(scoop, cherry);
      root.add(m);
    }
    // Pink moon, stars, a sleigh pulled through the candy sky
    const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe3f1').multiplyScalar(1.5), toneMapped: false, fog: false }));
    moon.position.set(-90, 95, -260);
    root.add(moon);
    const mg = glowSprite('#ffb3d9', 90, 0.45);
    mg.position.copy(moon.position);
    root.add(mg);
    const stars = starfield(root, rng, 900, 1.6);
    updaters.push((t) => { stars.material.opacity = 0.7 + Math.sin(t * 1.4) * 0.2; });
    const sleigh = makeSleigh();
    root.add(sleigh);
    updaters.push((t) => {
      const k = (t % 36) / 36;
      sleigh.visible = k < 0.5;
      const u = k / 0.5;
      sleigh.position.set(170 - u * 340, 64 + Math.sin(u * Math.PI) * 12, -215);
      sleigh.rotation.y = Math.PI;
    });
    return;
  }

  if (theme === 'toys') {
    // Bright toy trees
    const trees = sides(90).map((p) => ({ ...p, s: 1.1 + rng() * 1.4, rot: rng() * 6, tint: 0.9 + rng() * 0.2 }));
    root.add(instanced(candyTreeGeometry(['#2fbf63', '#26a957', '#45d07a']), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55 }), trees));
    // Giant alphabet blocks as the hills on the horizon
    const letters = 'NOELJOYABC';
    for (let i = 0; i < 10; i++) {
      const th = -1.25 + (2.5 * i) / 9 + (rng() - 0.5) * 0.12;
      const R = 115 + rng() * 45;
      const s = 18 + rng() * 14;
      const face = tex(128, 128, (g, w) => {
        g.fillStyle = ['#e2483d', '#3f7be0', '#ffd23f', '#2f9e5b', '#ff8a2b'][i % 5];
        g.fillRect(0, 0, w, w);
        g.fillStyle = '#ffffff';
        g.fillRect(8, 8, w - 16, w - 16);
        g.fillStyle = ['#e2483d', '#3f7be0', '#ffd23f', '#2f9e5b', '#ff8a2b'][(i + 2) % 5];
        g.font = '900 90px Nunito, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(letters[i], w / 2, w / 2 + 6);
      });
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 }));
      m.position.set(R * Math.sin(th), s / 2 - 1 + (i % 3 === 0 ? s : 0) * 0, -R * Math.cos(th));
      m.rotation.y = -th + (rng() - 0.5) * 0.5;
      root.add(m);
      if (i % 3 === 0) {
        const top = m.clone();
        top.scale.setScalar(0.7);
        top.position.y = s + s * 0.35 - 1;
        top.rotation.y += 0.6;
        root.add(top);
      }
    }
    // Sun, clouds and a hot-air balloon
    const sunM = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4b0').multiplyScalar(1.4), toneMapped: false, fog: false }));
    sunM.position.set(120, 120, -260);
    root.add(sunM);
    const cloudMat = std({ color: '#ffffff', roughness: 1, fog: false });
    for (let i = 0; i < 10; i++) {
      const cl = new THREE.Group();
      const n = 3 + Math.floor(rng() * 3);
      for (let k = 0; k < n; k++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(4 + rng() * 4, 8, 6), cloudMat);
        b.position.set(k * 5 - n * 2.5, rng() * 2, rng() * 3);
        cl.add(b);
      }
      const th = -1.3 + rng() * 2.6, R = 150 + rng() * 80;
      cl.position.set(R * Math.sin(th), 50 + rng() * 45, -R * Math.cos(th));
      cl.userData.speed = 0.5 + rng() * 0.7;
      root.add(cl);
      updaters.push((t, dt) => { cl.position.x += cl.userData.speed * dt; if (cl.position.x > 240) cl.position.x = -240; });
    }
    const balloon = new THREE.Group();
    const stripe = tex(256, 64, (g, w, h) => ['#e2483d', '#ffd23f', '#3f7be0', '#ffffff', '#2f9e5b', '#ff8a2b'].forEach((col, i) => { g.fillStyle = col; g.fillRect((i * w) / 6, 0, w / 6, h); }));
    stripe.repeat.set(2, 1);
    const env = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 }));
    env.scale.y = 1.15;
    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), mat('#a8743f'));
    basket.position.y = -4.6;
    balloon.add(env, basket);
    root.add(balloon);
    updaters.push((t) => {
      const k = (t % 60) / 60;
      balloon.position.set(-90 + k * 180, 34 + Math.sin(t * 0.4) * 2, -(L.backR + 40));
      balloon.rotation.y = t * 0.1;
    });
    return;
  }

  // ---- space ----
  const stars = starfield(root, rng, 2600, 1.6);
  updaters.push((t) => { stars.material.opacity = 0.8 + Math.sin(t * 1.1) * 0.12; });
  // Earth rising over the horizon
  const earthTex = canvasSphereTex((g, w, h) => {
    g.fillStyle = '#1d5fd1';
    g.fillRect(0, 0, w, h);
    const r = A.rng(9);
    g.fillStyle = '#3fae5a';
    for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(r() * w, h * 0.2 + r() * h * 0.6, 20 + r() * 50, 10 + r() * 30, r() * 3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 60, 4 + r() * 8, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, 14);
    g.fillRect(0, h - 14, w, 14);
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(36, 40, 28), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.8, emissive: '#1a3a80', emissiveIntensity: 0.25, fog: false }));
  earth.position.set(-110, 40, -300);
  root.add(earth);
  const atmos = glowSprite('#6fb6ff', 120, 0.45);
  atmos.position.copy(earth.position);
  root.add(atmos);
  updaters.push((t) => { earth.rotation.y = t * 0.03; });
  // A ringed planet
  const planet = new THREE.Mesh(new THREE.SphereGeometry(16, 28, 20), new THREE.MeshStandardMaterial({ color: '#e7a35a', roughness: 0.9, fog: false }));
  planet.position.set(130, 110, -280);
  const rings = new THREE.Mesh(new THREE.RingGeometry(22, 34, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#f5d7a8'), side: THREE.DoubleSide, transparent: true, opacity: 0.7, fog: false }));
  rings.rotation.x = Math.PI / 2.4;
  planet.add(rings);
  root.add(planet);
  // A nebula glow
  const neb = glowSprite('#c77dff', 300, 0.22);
  neb.position.set(40, 140, -330);
  root.add(neb);
  const neb2 = glowSprite('#4fd1ff', 220, 0.16);
  neb2.position.set(-60, 170, -340);
  root.add(neb2);
  // Moon rocks and craters at the sides
  const rockMat = std({ color: '#8e8d9b' });
  sides(60, 3, 0.25).forEach((p) => {
    const s = 0.4 + rng() * 1.6;
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    m.position.set(p.x, p.y + s * 0.3, p.z);
    m.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    m.castShadow = true;
    root.add(m);
  });
  sides(16, 4, 0.3).forEach((p) => {
    const r = 2 + rng() * 3;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.18, 6, 24), std({ color: '#a9a8b6' }));
    rim.rotation.x = Math.PI / 2;
    rim.scale.z = 0.5;
    rim.position.set(p.x, p.y + 0.05, p.z);
    root.add(rim);
    const pit = new THREE.Mesh(new THREE.CircleGeometry(r, 24), std({ color: '#6e6d7b' }));
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(p.x, p.y + 0.02, p.z);
    root.add(pit);
  });
  // Rocket on its launch pad
  const rocket = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 7, 16), std({ color: '#f2f4fa', metalness: 0.3, roughness: 0.4 }));
  body.position.y = 4.5;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 16), std({ color: '#e2483d' }));
  nose.position.y = 9.3;
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshStandardMaterial({ color: '#7af7ff', emissive: '#3fd6ff', emissiveIntensity: 1.6 }));
  win.position.set(0, 6, 1.12);
  rocket.add(body, nose, win);
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 1.5), std({ color: '#e2483d' }));
    const a = (i / 3) * TAU;
    fin.position.set(Math.sin(a) * 1.3, 1.9, Math.cos(a) * 1.3);
    fin.rotation.y = a;
    rocket.add(fin);
  }
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.4, 0.6, 20), std({ color: '#5d6478', metalness: 0.5 }));
  pad.position.y = 0.3;
  rocket.add(pad);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb347').multiplyScalar(2), toneMapped: false }));
  flame.rotation.x = Math.PI;
  flame.position.y = 0.2;
  flame.visible = false;
  rocket.add(flame);
  rocket.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const [rx, rz] = polar(L.frontR + 6, L.spread + 0.45);
  rocket.position.set(rx, 0, rz);
  root.add(rocket);
  // Every so often it does a little hop-test with its engines
  updaters.push((t) => {
    const k = t % 20;
    const lift = k > 16 && k < 19 ? Math.sin(((k - 16) / 3) * Math.PI) : 0;
    rocket.position.y = lift * 2.2;
    flame.visible = lift > 0.02;
    flame.scale.set(1, 0.8 + Math.random() * 0.5, 1);
  });
  // Satellite dish
  const dish = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 8, 0, TAU, 0, Math.PI / 3), std({ color: '#dfe4ef', metalness: 0.3, side: THREE.DoubleSide }));
  bowl.rotation.x = -Math.PI / 2.6;
  bowl.position.y = 2.4;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.4, 8), std({ color: '#5d6478' }));
  mast.position.y = 1.2;
  dish.add(bowl, mast);
  const [dx, dz] = polar(L.frontR + 5, -(L.spread + 0.4));
  dish.position.set(dx, 0, dz);
  root.add(dish);
  updaters.push((t) => { bowl.rotation.z = Math.sin(t * 0.3) * 0.6; });
  // Santa's rocket-sleigh streaking across the stars
  const sleigh = makeSleigh();
  root.add(sleigh);
  updaters.push((t) => {
    const k = (t % 30) / 30;
    sleigh.visible = k < 0.45;
    const u = k / 0.45;
    sleigh.position.set(-170 + u * 340, 70 + Math.sin(u * Math.PI) * 18, -220);
    sleigh.rotation.z = Math.cos(u * Math.PI) * 0.15;
  });
}
