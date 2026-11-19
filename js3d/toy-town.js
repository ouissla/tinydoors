/* Handcrafted playroom surfaces and mechanical toys, built without model assets. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture } from './houses.js';
const A = window.Advent;
const TAU = Math.PI * 2;
const C = { blue: '#25496b', red: '#cc5350', gold: '#e8b85e', mint: '#75aaa0', cream: '#fff0ce' };

export const parquetTex = canvasTexture(512, 512, (g, w, h) => {
  const rng = A.rng(984);
  for (let row = 0; row < 8; row++) {
    for (let col = -1; col < 3; col++) {
      const x = col * 256 + (row % 2) * 128, y = row * 64;
      g.fillStyle = ['#cfa16c', '#d9b17f', '#e3bc8b', '#d2a775'][(rng() * 4) | 0];
      g.fillRect(x, y, 256, 64);
      g.strokeStyle = 'rgba(91,54,27,.25)'; g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, 254, 62);
      for (let j = 0; j < 20; j++) {
        g.strokeStyle = j % 3 ? 'rgba(91,54,27,.055)' : 'rgba(255,243,211,.16)';
        g.lineWidth = 0.5 + rng(); g.beginPath();
        const yy = y + rng() * 64;
        g.moveTo(x + 3, yy); g.bezierCurveTo(x + 80, yy - 3, x + 150, yy + 3, x + 253, yy); g.stroke();
      }
    }
  }
});
parquetTex.wrapS = parquetTex.wrapT = THREE.RepeatWrapping;
parquetTex.repeat.set(0.12, 0.12);
parquetTex.userData.shared = true;

export function buildToyPlayground(c, fx) {
  const { root, L, std } = c;
  const colors = Object.values(C);
  const lacquer = (color) => std({ color, roughness: 0.9, metalness: 0, flatShading: false });
  const mats = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, lacquer(v)]));
  const add = (parent, geo, material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, material); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const box = (parent, w, h, d, material, x, y, z) => add(parent, new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.12), material, x, y, z);
  const cz = -(L.frontR - 4.3), rx = Math.min(7, L.frontR * Math.sin(L.spread) * 0.55);

  // A woven oval railway rug with a stitched border and a printed town map.
  const rugTex = canvasTexture(1024, 512, (g, w, h) => {
    g.fillStyle = C.blue; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#efcf8a'; g.lineWidth = 5; g.setLineDash([6, 9]);
    g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 30, h / 2 - 25, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#73918e'; g.lineWidth = 64;
    g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.32, h * 0.29, 0, 0, TAU); g.stroke();
    g.strokeStyle = '#f3e6c1'; g.lineWidth = 3; g.setLineDash([12, 12]); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 17; i++) {
      const x = 100 + (i * 137) % 820, y = 80 + (i * 79) % 350;
      g.fillStyle = i % 2 ? '#dfb766' : '#91b8aa';
      g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
    }
    // Fine textile weave, kept subtle enough to read as fabric.
    g.fillStyle = 'rgba(255,255,255,.025)';
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, h);
  });
  const rug = add(root, new THREE.CircleGeometry(1, 80), std({ map: rugTex, roughness: 1, color: '#ffffff' }), 0, 0.016, cz);
  rug.rotation.x = -Math.PI / 2; rug.scale.set(rx + 2.1, 3.6, 1); rug.castShadow = false;

  // Painted terrace edging and brass studs make the platforms feel like a crafted toy set.
  for (let r = 0; r < L.rows; r++) {
    const radius = L.R0 + r * L.dR - L.dR / 2 + 0.18, y = 0.3 + r * L.dy;
    const pts = Array.from({ length: 65 }, (_, i) => {
      const a = -L.spread - 0.15 + (2 * L.spread + 0.3) * i / 64;
      return new THREE.Vector3(radius * Math.sin(a), y + 0.045, -radius * Math.cos(a));
    });
    add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.07, 5, false), r % 2 ? mats.red : mats.blue).castShadow = false;
    const studs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 6, 4), mats.gold, 26);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 26; i++) { const p = pts[Math.round(i / 25 * 64)]; matrix.makeTranslation(p.x, y + 0.07, p.z); studs.setMatrixAt(i, matrix); }
    root.add(studs);
  }

  const burst = (obj, height = 2) => {
    if (!A.reducedMotion) fx.burst(obj.localToWorld(new THREE.Vector3(0, height, 0)), colors, 18, 3.5, 0.28);
  };
  // A miniature music-box carousel with three carved rocking horses.
  const carousel = new THREE.Group(); carousel.name = 'Toy carousel';
  carousel.position.set(-(rx + 3.6), 0.03, cz - 0.7); root.add(carousel);
  add(carousel, new THREE.CylinderGeometry(2.05, 2.2, 0.35, 40), mats.blue.clone(), 0, 0.2);
  add(carousel, new THREE.TorusGeometry(2, 0.065, 6, 48), mats.gold, 0, 0.4).rotation.x = Math.PI / 2;
  const deck = new THREE.Group(); carousel.add(deck);
  add(deck, new THREE.CylinderGeometry(1.9, 1.9, 0.18, 40), mats.red, 0, 0.49);
  add(deck, new THREE.CylinderGeometry(0.09, 0.12, 3.7, 12), mats.gold, 0, 2.15);
  const horses = [];
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3, horse = new THREE.Group();
    horse.position.set(Math.sin(a) * 1.25, 1.2, Math.cos(a) * 1.25); horse.rotation.y = a + Math.PI / 2;
    deck.add(horse); horses.push(horse);
    box(horse, 0.35, 0.45, 0.85, mats.cream, 0, 0, 0);
    box(horse, 0.27, 0.65, 0.27, mats.cream, 0, 0.35, 0.35).rotation.x = -0.3;
    box(horse, 0.32, 0.26, 0.42, mats.cream, 0, 0.62, 0.47);
    box(horse, 0.4, 0.12, 0.35, i % 2 ? mats.blue : mats.red, 0, 0.27, -0.03);
    [-1, 1].forEach((side) => {
      [-0.26, 0.26].forEach((z) => box(horse, 0.1, 0.42, 0.12, mats.cream, side * 0.13, -0.35, z));
      add(horse, new THREE.SphereGeometry(0.035, 6, 4), mats.blue, side * 0.17, 0.66, 0.53);
    });
    add(deck, new THREE.CylinderGeometry(0.035, 0.035, 2.9, 8), mats.gold, Math.sin(a) * 1.25, 1.95, Math.cos(a) * 1.25);
  }
  add(carousel, new THREE.ConeGeometry(2.35, 1.3, 12), mats.red, 0, 3.95);
  add(carousel, new THREE.SphereGeometry(0.16, 12, 8), mats.gold, 0, 4.7);
  for (let i = 0; i < 18; i++) {
    const a = i * TAU / 18;
    add(carousel, new THREE.SphereGeometry(0.075, 8, 6), std({ color: C.cream, emissive: C.gold, emissiveIntensity: 0.7 }), Math.sin(a) * 2.2, 3.32, Math.cos(a) * 2.2);
  }
  fx.tappable(carousel, (a) => { if (a.busy) return; a.busy = 5; fx.sound()?.sparkle(10); burst(carousel, 3.3); }, (dt, t, a) => {
    const moving = a.busy > 0 && !A.reducedMotion;
    if (moving) deck.rotation.y += dt * Math.min(1, a.busy) * 2;
    horses.forEach((h, i) => { h.position.y = 1.2 + (moving ? Math.sin(t * 4 + i * TAU / 3) * 0.18 : 0); });
    carousel.children[0].material.emissive.set(C.gold); carousel.children[0].material.emissiveIntensity = a.busy > 0 ? 0.15 : 0;
  });

  // Jack-in-the-box: a hinged lid and a spring-mounted little clown.
  const jack = new THREE.Group(); jack.name = 'Jack in the box';
  jack.position.set(rx + 3.4, 0.03, cz - 0.2); jack.rotation.y = -0.25; root.add(jack);
  box(jack, 2, 1.65, 2, mats.blue, 0, 0.85, 0);
  box(jack, 1.78, 1.3, 0.06, mats.cream, 0, 0.85, 1.02);
  const badge = add(jack, new THREE.TorusGeometry(0.38, 0.09, 8, 24), mats.gold.clone(), 0, 0.88, 1.08);
  const lid = new THREE.Group(); lid.position.set(0, 1.72, -1); jack.add(lid);
  box(lid, 2.12, 0.17, 2.12, mats.red, 0, 0, 1);
  const clown = new THREE.Group(); jack.add(clown);
  const springPts = Array.from({ length: 97 }, (_, i) => { const a = i / 96 * TAU * 6; return new THREE.Vector3(Math.sin(a) * 0.24, i / 96 * 1.5, Math.cos(a) * 0.24); });
  add(clown, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPts), 96, 0.045, 6, false), mats.gold);
  add(clown, new THREE.SphereGeometry(0.48, 20, 14), mats.cream, 0, 1.8, 0);
  add(clown, new THREE.SphereGeometry(0.12, 12, 8), mats.red, 0, 1.78, 0.46);
  [-1, 1].forEach((side) => add(clown, new THREE.SphereGeometry(0.055, 8, 6), mats.blue, side * 0.17, 1.94, 0.42));
  add(clown, new THREE.ConeGeometry(0.46, 0.9, 16), mats.mint, 0, 2.5, 0);
  add(clown, new THREE.SphereGeometry(0.12, 10, 8), mats.gold, 0, 3, 0);
  clown.visible = false;
  let wasOpen = false;
  fx.tappable(jack, (a) => { if (a.busy) return; a.busy = 3.6; fx.sound()?.pop(220, 880, 0.22); burst(jack, 3); }, (dt, t, a) => {
    const k = 3.6 - a.busy;
    const lift = a.busy <= 0 ? 0 : Math.min(1, k / 0.4, a.busy / 0.5);
    clown.visible = lift > 0; clown.position.y = 1.5;
    clown.scale.y = A.reducedMotion ? 1 : Math.max(0.05, lift + Math.sin(k * 17) * 0.12 * Math.max(0, 1 - k));
    lid.rotation.x = A.reducedMotion ? (a.busy > 0 ? -2 : 0) : -lift * 2;
    badge.material.emissive.set(C.gold); badge.material.emissiveIntensity = a.busy > 0 ? 0.25 : 0;
    if (wasOpen && !clown.visible) fx.sound()?.thunk(); wasOpen = clown.visible;
  });

  // Stacking rings in the centre of the train track; each tap starts a rainbow ripple.
  const stack = new THREE.Group(); stack.name = 'Rainbow stacking rings'; stack.position.set(0, 0.03, cz); root.add(stack);
  box(stack, 1.9, 0.23, 1.9, mats.cream, 0, 0.16, 0);
  add(stack, new THREE.CylinderGeometry(0.1, 0.13, 2.5, 12), mats.gold, 0, 1.35, 0);
  const rings = [mats.red, mats.gold, mats.mint, mats.blue].map((m, i) => {
    const ring = add(stack, new THREE.TorusGeometry(0.72 - i * 0.13, 0.17, 10, 32), m, 0, 0.48 + i * 0.4, 0);
    ring.rotation.x = Math.PI / 2; return ring;
  });
  const stackTop = add(stack, new THREE.SphereGeometry(0.2, 12, 8), mats.red.clone(), 0, 2.65, 0);
  fx.tappable(stack, (a) => { if (a.busy) return; a.busy = 2; fx.sound()?.sparkle(6); burst(stack, 2.7); }, (dt, t, a) => {
    const k = 2 - a.busy;
    stackTop.material.emissive.set(C.gold); stackTop.material.emissiveIntensity = a.busy > 0 ? 0.5 : 0;
    rings.forEach((ring, i) => {
      const wave = a.busy > 0 && !A.reducedMotion ? Math.sin(Math.max(0, Math.min(1, (k - i * 0.15) / 1.2)) * Math.PI) : 0;
      ring.position.y = 0.48 + i * 0.4 + wave * 1.1;
    });
  });
}
