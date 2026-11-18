/* Little characters who live in the worlds: models + simple behaviours.
   Winter: elves doing their rounds, penguins waddling and belly-sliding, reindeer grazing.
   Summer: elves with surfboards, little penguins, crabs, a kangaroo, seagulls. */
import * as THREE from 'three';
import { mat, canvasTexture } from './houses.js';

const A = window.Advent;
const TAU = Math.PI * 2;
const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const cyl = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);

function part(parent, geo, material, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  parent.add(m);
  return m;
}
function pivot(parent, x, y, z) {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  parent.add(p);
  return p;
}

const legStripes = canvasTexture(32, 64, (g, w, h) => {
  for (let y = 0; y < h; y += 16) {
    g.fillStyle = '#d6282c';
    g.fillRect(0, y, w, 8);
    g.fillStyle = '#ffffff';
    g.fillRect(0, y + 8, w, 8);
  }
});
legStripes.userData.shared = true;
const ballStripes = canvasTexture(128, 64, (g, w, h) => {
  ['#ff4f81', '#ffffff', '#ffd23f', '#ffffff', '#2ec4b6', '#ffffff'].forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect((i * w) / 6, 0, w / 6, h);
  });
});
ballStripes.userData.shared = true;

// ---------------- Models ----------------
export function makePenguin(scale = 1) {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const black = mat('#1d2233'), white = mat('#f6f7fb'), orange = mat('#ff9a2b');
  part(body, sph(0.3, 12, 10), black, 0, 0.42, 0, 1, 1.35, 0.92);
  part(body, sph(0.25, 12, 10), white, 0, 0.4, 0.11, 0.86, 1.15, 0.62);
  part(body, sph(0.2, 12, 10), black, 0, 0.86, 0);
  part(body, sph(0.13, 10, 8), white, 0, 0.84, 0.1, 1, 0.9, 0.6);
  [-1, 1].forEach((s) => part(body, sph(0.03, 6, 4), black, s * 0.06, 0.9, 0.18));
  const beak = part(body, new THREE.ConeGeometry(0.045, 0.16, 6), orange, 0, 0.82, 0.25);
  beak.rotation.x = Math.PI / 2;
  const feet = [-1, 1].map((s) => part(root, sph(0.07, 8, 6), orange, s * 0.1, 0.03, 0.08, 1, 0.35, 1.7));
  const flippers = [-1, 1].map((s) => {
    const p = pivot(body, s * 0.27, 0.62, 0);
    part(p, sph(0.18, 8, 6), black, 0, -0.16, 0, 0.22, 1, 0.55);
    return p;
  });
  root.scale.setScalar(scale);
  return { kind: 'penguin', root, body, feet, flippers };
}

export function makeElf({ summer = false, space = false, cyber = false, carry = 'gift', rng = Math.random } = {}) {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const skin = mat('#ffd2b0');
  const tunic = mat(cyber ? ['#1d2033', '#2a2140', '#1a2a33'][(rng() * 3) | 0] : space ? '#f2f4fa' : summer ? ['#2ec4b6', '#ffd23f', '#ff6f91', '#6a8cff'][(rng() * 4) | 0] : ['#2f9e5b', '#23804a', '#c8473d'][(rng() * 3) | 0]);
  const red = mat('#d6282c'), white = mat('#ffffff'), dark = mat('#1d2233');
  const legMat = space ? mat('#e3e7f0') : summer ? skin : mat('#ffffff', { map: legStripes });
  const legs = [-1, 1].map((s) => {
    const p = pivot(body, s * 0.08, 0.42, 0);
    part(p, cyl(0.055, 0.05, 0.36), legMat, 0, -0.18, 0);
    if (summer) part(p, new THREE.BoxGeometry(0.11, 0.03, 0.2), mat('#ff9f1c'), 0, -0.38, 0.03);
    else {
      const shoe = part(p, new THREE.ConeGeometry(0.06, 0.24, 6), mat('#1f6b48'), 0, -0.37, 0.07);
      shoe.rotation.x = Math.PI / 2 + 0.4;
    }
    return p;
  });
  if (summer) {
    part(body, cyl(0.19, 0.2, 0.17, 10), mat(['#ff4f81', '#9b5de5', '#00bbf9', '#ff9f1c'][(rng() * 4) | 0]), 0, 0.46, 0);
    part(body, cyl(0.14, 0.17, 0.32, 10), tunic, 0, 0.68, 0);
  } else {
    part(body, cyl(0.15, 0.24, 0.42, 10), tunic, 0, 0.64, 0);
    part(body, cyl(0.215, 0.215, 0.05, 10), dark, 0, 0.5, 0);
    part(body, new THREE.BoxGeometry(0.08, 0.07, 0.03), mat('#ffd23f', { emissive: '#ffb000', emissiveIntensity: 0.3 }), 0, 0.5, 0.21);
    part(body, new THREE.ConeGeometry(0.2, 0.12, 8), mat('#ffd23f'), 0, 0.86, 0).rotation.x = Math.PI;
  }
  part(body, sph(0.16, 12, 10), skin, 0, 0.99, 0);
  part(body, sph(0.035, 6, 4), mat('#ff9c8a'), 0, 0.97, 0.16);
  [-1, 1].forEach((s) => {
    part(body, sph(0.022, 6, 4), dark, s * 0.055, 1.02, 0.14);
    const ear = part(body, new THREE.ConeGeometry(0.04, 0.15, 5), skin, s * 0.17, 1.0, 0);
    ear.rotation.z = -s * 1.25;
  });
  if (summer) part(body, new THREE.BoxGeometry(0.22, 0.05, 0.04), dark, 0, 1.02, 0.15);
  if (space) {
    // helmet, backpack and a mission patch
    const helmet = part(body, sph(0.25, 14, 12), new THREE.MeshStandardMaterial({ color: '#cfeeff', transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.2, depthWrite: false }), 0, 1.0, 0);
    helmet.castShadow = false;
    part(body, new THREE.TorusGeometry(0.2, 0.04, 6, 16), mat('#8a93a8', { metalness: 0.5 }), 0, 0.8, 0).rotation.x = Math.PI / 2;
    part(body, new THREE.BoxGeometry(0.3, 0.36, 0.16), mat('#c9d0de', { metalness: 0.3 }), 0, 0.66, -0.22);
    part(body, new THREE.CircleGeometry(0.05, 10), mat('#ff6fd8', { emissive: '#ff6fd8', emissiveIntensity: 1.2 }), 0.08, 0.72, 0.205);
  }
  if (cyber) {
    // a glowing visor and a neon stripe on the tunic
    const nc = ['#ff2bd6', '#00e5ff', '#a6ff00'][(rng() * 3) | 0];
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(nc).multiplyScalar(2.2), toneMapped: false });
    part(body, new THREE.BoxGeometry(0.26, 0.06, 0.06), glow, 0, 1.03, 0.13);
    part(body, new THREE.BoxGeometry(0.05, 0.4, 0.02), glow, 0, 0.66, 0.2);
  }
  const hat = pivot(body, 0, 1.08, -0.02);
  hat.visible = !space;
  hat.rotation.x = -0.35;
  part(hat, new THREE.TorusGeometry(0.155, 0.045, 6, 14), white, 0, 0, 0).rotation.x = Math.PI / 2;
  part(hat, new THREE.ConeGeometry(0.16, 0.46, 10), cyber ? mat('#1d1d2a', { metalness: 0.5 }) : summer ? red : mat(rng() < 0.5 ? '#d6282c' : '#1f8a57'), 0, 0.23, 0);
  part(hat, sph(0.055, 8, 6), white, 0, 0.47, 0);
  const arms = [-1, 1].map((s) => {
    const p = pivot(body, s * 0.19, 0.82, 0);
    part(p, cyl(0.045, 0.04, 0.3), summer ? skin : tunic, 0, -0.15, 0);
    if (space) part(p, sph(0.06, 8, 6), mat('#8a93a8'), 0, -0.32, 0);
    part(p, sph(0.05, 8, 6), skin, 0, -0.32, 0);
    return p;
  });
  let item = null;
  if (carry === 'gift') {
    item = pivot(body, 0, 0.68, 0.26);
    part(item, new THREE.BoxGeometry(0.28, 0.24, 0.24), mat(['#e2483d', '#2f9e5b', '#3f5a8a', '#e9b949', '#9b5de5'][(rng() * 5) | 0]), 0, 0, 0);
    part(item, new THREE.BoxGeometry(0.29, 0.25, 0.05), mat('#ffd23f'), 0, 0, 0);
    part(item, new THREE.BoxGeometry(0.05, 0.25, 0.25), mat('#ffd23f'), 0, 0, 0);
  } else if (carry === 'surf') {
    item = pivot(body, 0.3, 0.72, 0);
    const b = part(item, new THREE.CapsuleGeometry(0.17, 1.0, 3, 8), mat(['#ff6f91', '#ffd23f', '#2ec4b6', '#6a8cff'][(rng() * 4) | 0]), 0, 0, 0, 1, 1, 0.2);
    b.rotation.y = Math.PI / 2;
  } else if (carry === 'ball') {
    item = pivot(body, 0, 0.72, 0.28);
    part(item, sph(0.17, 12, 10), mat('#ffffff', { map: ballStripes, flatShading: false }), 0, 0, 0);
  }
  root.scale.setScalar(1.05);
  return { kind: 'elf', root, body, legs, arms, item, carry, space };
}

export function makeCrab() {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const red = mat('#e8553c'), dark = mat('#1d2233');
  part(body, sph(0.18, 12, 8), red, 0, 0.17, 0, 1.4, 0.55, 1);
  [-1, 1].forEach((s) => {
    part(body, cyl(0.012, 0.012, 0.1, 4), red, s * 0.07, 0.27, 0.1);
    part(body, sph(0.03, 6, 4), dark, s * 0.07, 0.33, 0.1);
  });
  const legs = [];
  [-1, 1].forEach((s) => [-0.08, 0, 0.08].forEach((z) => {
    const p = pivot(body, s * 0.22, 0.14, z);
    const l = part(p, cyl(0.018, 0.012, 0.24, 4), red, s * 0.1, -0.06, 0);
    l.rotation.z = s * 1.0;
    legs.push(p);
  }));
  const claws = [-1, 1].map((s) => {
    const p = pivot(body, s * 0.17, 0.19, 0.17);
    part(p, sph(0.08, 8, 6), red, s * 0.04, 0, 0.06, 1.2, 0.75, 1);
    return p;
  });
  root.scale.setScalar(1.35);
  return { kind: 'crab', root, body, legs, claws };
}

export function makeKangaroo() {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const fur = mat('#c68a52'), light = mat('#ead0a8'), dark = mat('#2a1a12');
  const torso = part(body, sph(0.36, 12, 10), fur, 0, 0.88, 0, 0.85, 1.2, 1);
  torso.rotation.x = 0.45;
  part(body, sph(0.27, 10, 8), light, 0, 0.83, 0.15, 0.8, 1.1, 0.6).rotation.x = 0.45;
  part(body, sph(0.17, 10, 8), fur, 0, 1.38, 0.3);
  part(body, sph(0.1, 8, 6), fur, 0, 1.33, 0.44, 1, 0.8, 1.4);
  part(body, sph(0.03, 6, 4), dark, 0, 1.35, 0.57);
  [-1, 1].forEach((s) => {
    part(body, sph(0.025, 6, 4), dark, s * 0.07, 1.43, 0.43);
    const ear = part(body, new THREE.ConeGeometry(0.06, 0.24, 6), fur, s * 0.08, 1.58, 0.24, 1, 1, 0.5);
    ear.rotation.z = -s * 0.2;
    part(body, sph(0.2, 8, 6), fur, s * 0.18, 0.45, -0.02, 0.6, 1, 1.3);
    part(body, new THREE.BoxGeometry(0.1, 0.06, 0.48), fur, s * 0.18, 0.04, 0.14);
    const arm = part(body, cyl(0.035, 0.03, 0.26, 5), fur, s * 0.12, 0.95, 0.32);
    arm.rotation.x = 0.8;
  });
  const tail = part(body, new THREE.ConeGeometry(0.11, 1.0, 7), fur, 0, 0.42, -0.55);
  tail.rotation.x = -Math.PI / 2 - 0.45;
  return { kind: 'kangaroo', root, body };
}

export function makeSeagull({ body = '#f7f8fb', wing = '#b8c2cf', tip = '#2a2f3a', beak: bk = '#ffc23a', crest = null } = {}) {
  const root = new THREE.Group();
  const white = mat(body), grey = mat(wing), yellow = mat(bk);
  part(root, sph(0.16, 10, 8), white, 0, 0, 0, 1, 0.85, 2);
  part(root, sph(0.11, 8, 6), white, 0, 0.07, 0.3);
  const beak = part(root, new THREE.ConeGeometry(0.03, 0.13, 5), yellow, 0, 0.05, 0.44);
  beak.rotation.x = Math.PI / 2;
  const wings = [-1, 1].map((s) => {
    const p = pivot(root, s * 0.08, 0.05, 0);
    part(p, new THREE.BoxGeometry(0.7, 0.025, 0.24), grey, s * 0.35, 0, 0);
    part(p, new THREE.BoxGeometry(0.14, 0.03, 0.2), mat(tip), s * 0.68, 0, -0.01);
    return p;
  });
  if (crest) part(root, sph(0.05, 6, 4), mat(crest), 0, 0.17, 0.3);
  root.scale.setScalar(1.3);
  return { kind: 'gull', root, wings };
}

// A camera drone: quad rotors, a gimbal camera with a glowing lens, a blinking REC light and a searchlight.
export function makeDrone(color = '#00e5ff') {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const dark = mat('#1d1f2e', { metalness: 0.6, roughness: 0.35 });
  const glow = (c, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
  part(body, new THREE.BoxGeometry(0.6, 0.18, 0.8), dark, 0, 0, 0);
  part(body, new THREE.BoxGeometry(0.62, 0.03, 0.82), glow(color, 1.6), 0, 0.1, 0);
  const rotors = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const arm = part(body, new THREE.BoxGeometry(0.06, 0.05, 0.75), dark, sx * 0.32, 0.02, sz * 0.32);
    arm.rotation.y = sx * sz * 0.785;
    const hub = pivot(body, sx * 0.55, 0.1, sz * 0.55);
    part(hub, new THREE.TorusGeometry(0.3, 0.025, 5, 20), glow(color, 1.8), 0, 0, 0).rotation.x = Math.PI / 2;
    const blades = pivot(hub, 0, 0.02, 0);
    part(blades, new THREE.BoxGeometry(0.52, 0.01, 0.06), mat('#c9d2e6'), 0, 0, 0);
    part(blades, new THREE.BoxGeometry(0.06, 0.01, 0.52), mat('#c9d2e6'), 0, 0, 0);
    rotors.push(blades);
  });
  const gimbal = pivot(body, 0, -0.18, 0.2);
  part(gimbal, sph(0.16, 12, 10), dark, 0, 0, 0);
  const lens = part(gimbal, cyl(0.08, 0.1, 0.14, 12), dark, 0, -0.02, 0.14);
  lens.rotation.x = Math.PI / 2;
  part(gimbal, new THREE.CircleGeometry(0.065, 14), glow('#7af7ff', 2.6), 0, -0.02, 0.215);
  gimbal.rotation.x = 0.6;
  const rec = part(body, sph(0.04, 6, 4), glow('#ff2b5a', 3), 0.22, 0.12, 0.38);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 5, 16, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(0, -2.6, 1.2);
  beam.rotation.x = 0.45;
  body.add(beam);
  root.scale.setScalar(1.6);
  return { kind: 'drone', root, body, rotors, rec };
}

// A kawaii mochi: a squishy little rice cake with a face (Kawaii Sakura Town).
export function makeMochi(color = '#ffffff') {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  part(body, sph(0.32, 16, 12), mat(color, { flatShading: false }), 0, 0.24, 0, 1, 0.78, 1);
  [-1, 1].forEach((s) => {
    part(body, sph(0.035, 8, 6), mat('#2a2238'), s * 0.1, 0.3, 0.29);
    part(body, sph(0.05, 8, 6), mat('#ff8fb8'), s * 0.18, 0.22, 0.25, 1.2, 0.6, 0.4);
  });
  part(body, new THREE.TorusGeometry(0.03, 0.01, 4, 8, Math.PI), mat('#2a2238'), 0, 0.25, 0.31).rotation.z = Math.PI;
  root.scale.setScalar(1.5);
  return { kind: 'mochi', root, body };
}

export function makeReindeer() {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const fur = mat('#8a5a3b'), light = mat('#d9b48a'), antler = mat('#e6d2b0');
  part(body, sph(0.4, 12, 8), fur, 0, 1.0, 0, 0.75, 0.72, 1.4);
  part(body, sph(0.3, 10, 8), light, 0, 0.92, 0.05, 0.7, 0.6, 1.2);
  [[-0.2, 0.42], [0.2, 0.42], [-0.2, -0.42], [0.2, -0.42]].forEach(([x, z]) => part(body, cyl(0.06, 0.05, 0.85, 6), fur, x, 0.45, z));
  part(body, sph(0.08, 6, 4), mat('#ffffff'), 0, 1.1, -0.55);
  const neck = part(body, cyl(0.12, 0.16, 0.5, 8), fur, 0, 1.3, 0.48);
  neck.rotation.x = 0.6;
  const head = pivot(body, 0, 1.52, 0.62);
  part(head, sph(0.19, 10, 8), fur, 0, 0, 0.05, 0.9, 0.9, 1.3);
  part(head, sph(0.07, 8, 6), mat('#ff3030', { emissive: '#ff2020', emissiveIntensity: 2.4 }), 0, -0.04, 0.3);
  [-1, 1].forEach((s) => {
    part(head, sph(0.025, 6, 4), mat('#1d2233'), s * 0.1, 0.06, 0.18);
    const a1 = part(head, cyl(0.02, 0.025, 0.42, 5), antler, s * 0.1, 0.3, -0.05);
    a1.rotation.z = -s * 0.5;
    const a2 = part(head, cyl(0.015, 0.02, 0.22, 5), antler, s * 0.24, 0.42, 0.02);
    a2.rotation.z = -s * 1.2;
    const a3 = part(head, cyl(0.015, 0.02, 0.2, 5), antler, s * 0.15, 0.5, -0.08);
    a3.rotation.x = -0.6;
  });
  return { kind: 'reindeer', root, body, head };
}

function makeSled() {
  const g = new THREE.Group();
  part(g, new THREE.BoxGeometry(0.7, 0.28, 1.1), mat('#c8302a'), 0, 0.32, 0);
  part(g, new THREE.BoxGeometry(0.74, 0.05, 1.14), mat('#ffd23f'), 0, 0.47, 0);
  [-1, 1].forEach((s) => part(g, new THREE.BoxGeometry(0.05, 0.05, 1.3), mat('#ffd23f'), s * 0.3, 0.1, 0.05));
  [['#2f9e5b', -0.15, 0.2], ['#3f5a8a', 0.15, -0.15], ['#e9b949', 0, 0.05]].forEach(([c, x, z], i) => {
    part(g, new THREE.BoxGeometry(0.3, 0.26, 0.3), mat(c), x, 0.63 + i * 0.06, z);
    part(g, new THREE.BoxGeometry(0.31, 0.27, 0.05), mat('#ffffff'), x, 0.63 + i * 0.06, z);
  });
  return g;
}


export function makeGingerbreadMan(rng = Math.random) {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const s = new THREE.Shape();
  s.moveTo(0.1, 0.78);
  s.absarc(0, 0.95, 0.2, -Math.PI / 3, Math.PI + Math.PI / 3, false);
  s.lineTo(-0.22, 0.72);
  s.lineTo(-0.42, 0.68);
  s.absarc(-0.42, 0.6, 0.08, Math.PI / 2, (3 * Math.PI) / 2, false);
  s.lineTo(-0.22, 0.55);
  s.lineTo(-0.22, 0.35);
  s.lineTo(-0.3, 0.06);
  s.absarc(-0.21, 0.06, 0.09, Math.PI, 2 * Math.PI, false);
  s.lineTo(-0.05, 0.3);
  s.lineTo(0.05, 0.3);
  s.lineTo(0.12, 0.06);
  s.absarc(0.21, 0.06, 0.09, Math.PI, 2 * Math.PI, false);
  s.lineTo(0.22, 0.35);
  s.lineTo(0.22, 0.55);
  s.lineTo(0.42, 0.52);
  s.absarc(0.42, 0.6, 0.08, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(0.22, 0.72);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 });
  geo.translate(0, 0, -0.05);
  part(body, geo, mat('#b8743d', { roughness: 0.75, flatShading: false }), 0, 0, 0);
  const icing = mat('#ffffff', { roughness: 0.4 });
  const choc = mat('#3a1d0e');
  [-1, 1].forEach((x) => {
    part(body, sph(0.03, 6, 5), choc, x * 0.07, 0.99, 0.08);
    part(body, new THREE.BoxGeometry(0.03, 0.12, 0.02), icing, x * 0.42, 0.6, 0.08);
    part(body, new THREE.BoxGeometry(0.14, 0.03, 0.02), icing, x * 0.21, 0.08, 0.09);
  });
  const smile = part(body, new THREE.TorusGeometry(0.07, 0.014, 4, 10, Math.PI), icing, 0, 0.92, 0.08);
  smile.rotation.z = Math.PI;
  ['#ff4f81', '#7cf29a', '#ffd23f'].forEach((c, i) => part(body, sph(0.04, 8, 6), mat(c, { roughness: 0.3 }), 0, 0.66 - i * 0.12, 0.08));
  root.scale.setScalar(1.15);
  return { kind: 'cookie', root, body };
}

export function makeToySoldier({ drum = false } = {}) {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const red = mat('#d6282c', { roughness: 0.45 }), white = mat('#ffffff', { roughness: 0.45 }), black = mat('#1d2233', { roughness: 0.4 }), gold = mat('#ffd23f', { metalness: 0.5, roughness: 0.3 });
  const legs = [-1, 1].map((x) => {
    const p = pivot(body, x * 0.08, 0.45, 0);
    part(p, cyl(0.06, 0.06, 0.32, 8), white, 0, -0.16, 0);
    part(p, cyl(0.065, 0.07, 0.14, 8), black, 0, -0.38, 0.01);
    return p;
  });
  part(body, cyl(0.17, 0.19, 0.42, 12), red, 0, 0.67, 0);
  part(body, cyl(0.195, 0.195, 0.05, 12), white, 0, 0.5, 0);
  [-1, 1].forEach((x) => {
    const b = part(body, new THREE.BoxGeometry(0.04, 0.45, 0.02), white, 0, 0.68, 0.17);
    b.rotation.z = x * 0.5;
  });
  [0.6, 0.72].forEach((y) => part(body, sph(0.022, 6, 4), gold, 0, y, 0.185));
  part(body, sph(0.14, 12, 10), mat('#ffd9c0'), 0, 1.0, 0);
  [-1, 1].forEach((x) => {
    part(body, sph(0.035, 6, 5), mat('#ff8a8a'), x * 0.08, 0.97, 0.11);
    part(body, sph(0.02, 6, 4), black, x * 0.05, 1.03, 0.125);
  });
  part(body, cyl(0.15, 0.16, 0.42, 12), black, 0, 1.3, -0.01);
  part(body, new THREE.TorusGeometry(0.13, 0.015, 4, 14, Math.PI), gold, 0, 1.0, 0.0).rotation.set(0, 0, Math.PI);
  part(body, sph(0.06, 8, 6), red, 0.1, 1.5, 0.05);
  const arms = [-1, 1].map((x) => {
    const p = pivot(body, x * 0.21, 0.85, 0);
    part(p, cyl(0.045, 0.045, 0.32, 6), red, 0, -0.16, 0);
    part(p, sph(0.05, 8, 6), white, 0, -0.34, 0);
    return p;
  });
  let item = null;
  if (drum) {
    item = pivot(body, 0, 0.55, 0.26);
    part(item, cyl(0.17, 0.17, 0.2, 16), white, 0, 0, 0);
    part(item, cyl(0.175, 0.175, 0.04, 16), red, 0, 0.09, 0);
    part(item, cyl(0.175, 0.175, 0.04, 16), red, 0, -0.09, 0);
  }
  root.scale.setScalar(1.05);
  return { kind: 'soldier', root, body, legs, arms, item, drum };
}

export function makeWindupPenguin() {
  const m = makePenguin(0.85);
  const key = pivot(m.body, 0, 0.55, -0.32);
  part(key, cyl(0.025, 0.025, 0.2, 6), mat('#c9a227', { metalness: 0.6, roughness: 0.3 }), 0, 0, -0.08).rotation.x = Math.PI / 2;
  [-1, 1].forEach((x) => part(key, new THREE.TorusGeometry(0.07, 0.02, 5, 12), mat('#c9a227', { metalness: 0.6, roughness: 0.3 }), x * 0.08, 0, -0.18));
  m.key = key;
  return m;
}

export function makeRobotReindeer() {
  const root = new THREE.Group();
  const body = pivot(root, 0, 0, 0);
  const metal = mat('#c9d0de', { metalness: 0.55, roughness: 0.35 }), dark = mat('#5d6478', { metalness: 0.5, roughness: 0.4 });
  const glow = mat('#7af7ff', { emissive: '#4fe0ff', emissiveIntensity: 2.2 });
  part(body, new THREE.BoxGeometry(0.6, 0.55, 1.2), metal, 0, 1.0, 0);
  part(body, new THREE.BoxGeometry(0.62, 0.08, 1.0), glow, 0, 1.1, 0);
  [[-0.2, 0.42], [0.2, 0.42], [-0.2, -0.42], [0.2, -0.42]].forEach(([x, z]) => {
    part(body, cyl(0.06, 0.05, 0.75, 6), dark, x, 0.42, z);
    part(body, new THREE.BoxGeometry(0.14, 0.08, 0.18), dark, x, 0.04, z + 0.02);
  });
  part(body, new THREE.BoxGeometry(0.22, 0.45, 0.22), metal, 0, 1.35, 0.5).rotation.x = 0.5;
  const head = pivot(body, 0, 1.52, 0.62);
  part(head, new THREE.BoxGeometry(0.34, 0.32, 0.46), metal, 0, 0, 0.06);
  part(head, sph(0.07, 8, 6), mat('#ff3030', { emissive: '#ff2020', emissiveIntensity: 2.6 }), 0, -0.04, 0.32);
  [-1, 1].forEach((x) => {
    part(head, new THREE.BoxGeometry(0.06, 0.04, 0.02), glow, x * 0.09, 0.06, 0.3);
    const a = part(head, cyl(0.02, 0.02, 0.45, 5), dark, x * 0.12, 0.35, -0.05);
    a.rotation.z = -x * 0.35;
    part(head, sph(0.05, 8, 6), glow, x * 0.2, 0.56, -0.05);
  });
  part(body, cyl(0.015, 0.015, 0.3, 4), dark, 0, 1.35, -0.65).rotation.x = -0.6;
  part(body, sph(0.04, 6, 4), mat('#ff6fd8', { emissive: '#ff6fd8', emissiveIntensity: 2 }), 0, 1.47, -0.75);
  return { kind: 'reindeer', root, body, head };
}

export function makeUFO() {
  const root = new THREE.Group();
  const spin = pivot(root, 0, 0, 0);
  part(spin, cyl(0.95, 0.6, 0.22, 20), mat('#c9d0de', { metalness: 0.6, roughness: 0.3 }), 0, 0, 0);
  part(spin, new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7af7ff', emissive: '#3fd6ff', emissiveIntensity: 0.8, transparent: true, opacity: 0.85 }), 0, 0.1, 0);
  const cols = ['#ff6fd8', '#ffd23f', '#7cf29a', '#7af7ff'];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    part(spin, sph(0.06, 6, 4), mat(cols[i % 4], { emissive: cols[i % 4], emissiveIntensity: 2.4 }), Math.cos(a) * 0.85, -0.02, Math.sin(a) * 0.85);
  }
  root.scale.setScalar(1.4);
  return { kind: 'ufo', root, spin };
}

// ---------------- Animation ----------------
const lerpAngle = (a, b, t) => {
  let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return a + d * t;
};

function animate(m, s, dt) {
  const w = s.walkAmt;
  const ph = s.phase;
  if (m.kind === 'penguin') {
    const slide = s.sliding ? 1 : 0;
    s.slideAmt = A.lerp(s.slideAmt || 0, slide, 0.15);
    m.body.rotation.x = -1.35 * s.slideAmt;
    m.body.position.y = 0.3 * s.slideAmt * 0.6 + Math.abs(Math.sin(ph)) * 0.04 * w * (1 - s.slideAmt);
    m.body.rotation.z = Math.sin(ph) * 0.2 * w * (1 - s.slideAmt);
    m.flippers.forEach((f, i) => {
      const sgn = i ? 1 : -1;
      f.rotation.z = sgn * (0.25 + (s.sliding ? 1.0 : Math.abs(Math.sin(ph * 0.5 + s.t * 3)) * 0.35 * (w + 0.3)));
    });
    m.feet.forEach((f, i) => { f.position.z = 0.08 + Math.sin(ph + i * Math.PI) * 0.06 * w; f.visible = s.slideAmt < 0.5; });
    if (m.key) m.key.rotation.z += dt * (2 + 8 * w);
  } else if (m.kind === 'cookie') {
    m.body.rotation.z = Math.sin(ph) * 0.22 * w;
    m.body.position.y = Math.abs(Math.sin(ph)) * 0.08 * w;
    m.body.rotation.y = Math.sin(ph * 0.5) * 0.1 * w;
  } else if (m.kind === 'soldier') {
    m.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + i * Math.PI) * 0.7 * w; });
    m.body.position.y = Math.abs(Math.sin(ph)) * 0.04 * w;
    m.arms.forEach((a, i) => {
      a.rotation.z = (i ? -1 : 1) * 0.1;
      a.rotation.x = m.drum ? -0.9 + Math.sin(s.t * 14 + i * Math.PI) * 0.35 : Math.sin(ph + (i ? 0 : Math.PI)) * 0.7 * w;
    });
    if (s.action === 'wave') { m.arms[0].rotation.z = 2.6 + Math.sin(s.t * 9) * 0.3; m.arms[0].rotation.x = 0; }
  } else if (m.kind === 'drone') {
    m.rotors.forEach((r, i) => { r.rotation.y += dt * (i % 2 ? 40 : -40); });
    m.rec.visible = Math.sin(s.t * 5) > 0;
    m.body.position.y = Math.sin(s.t * 2.3 + s.seed) * 0.08;
  } else if (m.kind === 'ufo') {
    m.spin.rotation.y += dt * 2.5;
  } else if (m.kind === 'elf') {
    m.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + i * Math.PI) * 0.65 * w; });
    m.body.position.y = m.space ? Math.abs(Math.sin(ph * 0.5)) * 0.32 * w : Math.abs(Math.sin(ph)) * 0.05 * w;
    const holding = m.carry === 'gift' || m.carry === 'ball';
    m.arms.forEach((a, i) => {
      a.rotation.z = (i ? -1 : 1) * 0.12;
      if (holding && !s.action) a.rotation.x = -1.15;
      else a.rotation.x = Math.sin(ph + (i ? 0 : Math.PI)) * 0.6 * w;
    });
    if (s.action === 'knock') { m.arms[1].rotation.x = -1.9 + Math.sin(s.t * 16) * 0.25; m.arms[1].rotation.z = -0.1; }
    if (s.action === 'wave') { m.arms[0].rotation.z = 2.6 + Math.sin(s.t * 9) * 0.35; m.arms[0].rotation.x = 0; }
    if (m.item) m.item.visible = !(s.action === 'deliver' && s.delivered);
  } else if (m.kind === 'crab') {
    m.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph * 1.6 + i * 1.3) * 0.5 * w; });
    m.claws.forEach((c, i) => { c.rotation.y = (i ? -1 : 1) * (0.2 + Math.abs(Math.sin(s.t * 6 + i)) * 0.4); });
    m.body.position.y = Math.abs(Math.sin(ph * 1.6)) * 0.02 * w;
  } else if (m.kind === 'gull' && m.wings) {
    m.wings.forEach((g, i) => { g.rotation.z = (i ? -1 : 1) * Math.sin(s.t * 7 + s.seed) * 0.55; });
  } else if (m.kind === 'reindeer') {
    const graze = (Math.sin(s.t * 0.35 + s.seed) + 1) / 2;
    m.head.rotation.x = graze > 0.6 ? 0.9 : 0;
    m.head.rotation.y = Math.sin(s.t * 0.7 + s.seed) * 0.25 * (graze <= 0.6 ? 1 : 0.2);
    m.head.position.y = 1.52 - (graze > 0.6 ? 0.45 : 0);
    m.head.position.z = 0.62 + (graze > 0.6 ? 0.18 : 0);
  }
  // Tap reaction: a happy hop and a spin
  if (s.react > 0) {
    s.react = Math.max(0, s.react - dt * 1.8);
    const k = 1 - s.react;
    m.root.position.y = s.baseY + Math.sin(k * Math.PI) * 0.7;
    m.root.rotation.y += dt * 12 * Math.sin(k * Math.PI);
  }
}

// ---------------- Behaviours ----------------
class Agent {
  constructor(model, rng) {
    this.m = model;
    this.rng = rng;
    this.s = { phase: rng() * 10, t: rng() * 10, walkAmt: 0, react: 0, baseY: 0, seed: rng() * 10 };
    this.m.root.userData.agent = this;
  }
  poke() {
    if (this.s.react > 0) return;
    this.s.react = 1;
    this.s.baseY = this.m.root.position.y;
    if (A.Sound) {
      const hi = { penguin: [900, 1500], elf: [700, 1100], crab: [1200, 1700], kangaroo: [300, 500], gull: [1400, 900], reindeer: [260, 420], cookie: [1000, 1600], soldier: [500, 800], ufo: [1800, 600], drone: [2000, 900], mochi: [1500, 2200] }[this.m.kind] || [800, 1200];
      A.Sound.init();
      A.Sound.pop(hi[0], hi[1], 0.18);
      setTimeout(() => A.Sound.pop(hi[1], hi[0], 0.12), 120);
    }
  }
}

// Walks the path in front of the doors on one terrace, stopping at houses.
export class TerraceWalker extends Agent {
  constructor(model, rng, { R, y, stops, speed = 0.9 }) {
    super(model, rng);
    Object.assign(this, { R, y, stops, speed });
    this.th = stops[(rng() * stops.length) | 0];
    this.target = this.th;
    this.mode = 'pause';
    this.timer = rng() * 3;
    this.yaw = 0;
  }
  update(dt, t) {
    const s = this.s;
    s.t = t;
    if (s.react > 0) { animate(this.m, s, dt); return; }
    if (this.mode === 'pause') {
      this.timer -= dt;
      s.walkAmt = A.lerp(s.walkAmt, 0, 0.15);
      const out = Math.atan2(Math.sin(this.th), -Math.cos(this.th)); // face the house
      this.yaw = lerpAngle(this.yaw, out, 0.12);
      if (this.timer < 1.2 && s.action === 'deliver') s.delivered = true;
      if (this.timer <= 0) {
        s.action = null;
        s.delivered = false;
        let next = this.stops[(this.rng() * this.stops.length) | 0];
        if (Math.abs(next - this.th) < 0.01) next = this.stops[(this.stops.indexOf(next) + 1) % this.stops.length];
        this.target = next;
        this.mode = 'walk';
      }
    } else {
      const dir = Math.sign(this.target - this.th);
      this.th += (dir * this.speed * dt) / this.R;
      s.walkAmt = A.lerp(s.walkAmt, 1, 0.15);
      s.phase += dt * this.speed * 8;
      this.yaw = lerpAngle(this.yaw, Math.atan2(Math.cos(this.th) * dir, Math.sin(this.th) * dir), 0.15);
      if ((dir > 0 && this.th >= this.target) || (dir < 0 && this.th <= this.target) || dir === 0) {
        this.th = this.target;
        this.mode = 'pause';
        this.timer = 2 + this.rng() * 3.5;
        const r = this.rng();
        s.action = r < 0.45 ? 'knock' : r < 0.75 ? 'wave' : this.m.carry === 'gift' ? 'deliver' : 'wave';
      }
    }
    if (s.action === 'knock' && this.timer < 1.0) s.action = null;
    this.m.root.position.set(this.R * Math.sin(this.th), this.y, -this.R * Math.cos(this.th));
    this.m.root.rotation.y = this.yaw;
    animate(this.m, s, dt);
  }
}

// Wanders an open area (snowy square / beach), with optional belly-slides or hops.
export class Wanderer extends Agent {
  constructor(model, rng, { rMin, rMax, thMin, thMax, y = 0, speed = 0.7, special = null, sideways = false, sled = null, pauseMax = 4 }) {
    super(model, rng);
    Object.assign(this, { rMin, rMax, thMin, thMax, y, speed, special, sideways, sled, pauseMax });
    const p = this.pick();
    this.pos = new THREE.Vector3(p.x, y, p.z);
    this.target = this.pick();
    this.mode = 'walk';
    this.timer = 0;
    this.yaw = rng() * TAU;
    this.hop = 0;
  }
  pick() {
    const r = this.rMin + this.rng() * (this.rMax - this.rMin);
    const th = this.thMin + this.rng() * (this.thMax - this.thMin);
    return { x: r * Math.sin(th), z: -r * Math.cos(th) };
  }
  update(dt, t) {
    const s = this.s;
    s.t = t;
    if (s.react > 0) { animate(this.m, s, dt); return; }
    let y = this.y;
    if (this.mode === 'pause') {
      this.timer -= dt;
      s.walkAmt = A.lerp(s.walkAmt, 0, 0.12);
      if (this.timer <= 0) {
        this.target = this.pick();
        this.mode = 'walk';
        s.sliding = this.special === 'slide' && this.rng() < 0.35;
      }
    } else {
      const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      const sp = this.speed * (s.sliding ? 3.2 : 1);
      let step = sp * dt;
      if (this.special === 'hop') {
        this.hop += dt * 1.7;
        const k = this.hop % 1;
        y += Math.sin(k * Math.PI) * 0.75;
        this.m.body.rotation.x = Math.sin(k * TAU) * 0.18;
        step *= k < 0.85 ? 1.6 : 0.1;
      }
      if (d < 0.15) {
        this.mode = 'pause';
        this.timer = 0.8 + this.rng() * this.pauseMax;
        s.sliding = false;
        if (this.special === 'hop') this.m.body.rotation.x = 0;
      } else {
        this.pos.x += (dx / d) * Math.min(step, d);
        this.pos.z += (dz / d) * Math.min(step, d);
        const heading = Math.atan2(dx, dz) + (this.sideways ? Math.PI / 2 : 0);
        this.yaw = lerpAngle(this.yaw, heading, 0.1);
        s.walkAmt = A.lerp(s.walkAmt, 1, 0.15);
        s.phase += dt * sp * (this.sideways ? 14 : 9);
      }
    }
    this.m.root.position.set(this.pos.x, y, this.pos.z);
    this.m.root.rotation.y = this.yaw;
    if (this.sled) {
      const back = this.yaw + Math.PI;
      this.sled.position.set(this.pos.x + Math.sin(back) * 1.25, this.y, this.pos.z + Math.cos(back) * 1.25);
      this.sled.rotation.y = this.yaw;
    }
    animate(this.m, s, dt);
  }
}

// Circles overhead.
export class Flyer extends Agent {
  constructor(model, rng, { cx, cz, r, h, speed }) {
    super(model, rng);
    Object.assign(this, { cx, cz, r, h, speed });
    this.a = rng() * TAU;
  }
  update(dt, t) {
    this.s.t = t;
    this.a += (this.speed * dt) / this.r;
    const x = this.cx + Math.cos(this.a) * this.r, z = this.cz + Math.sin(this.a) * this.r;
    this.m.root.position.set(x, this.h + Math.sin(t * 0.8 + this.s.seed) * 0.8, z);
    // face along the direction of travel and bank into the turn
    this.m.root.rotation.set(0, -this.a + (this.speed < 0 ? Math.PI : 0), this.m.kind === 'ufo' || this.m.kind === 'drone' ? 0.12 : 0.35);
    if (this.s.react > 0) this.s.react = 0;
    animate(this.m, this.s, dt);
  }
}

// Stands in place doing idle things (grazing reindeer).
export class Idler extends Agent {
  update(dt, t) {
    this.s.t = t;
    animate(this.m, this.s, dt);
  }
}

// ---------------- Populate a world ----------------
export function populate(theme, L, rng, root, { lite = false, treePos } = {}) {
  const agents = [];
  const winter = theme === 'snow';
  const add = (a) => { root.add(a.m.root); agents.push(a); return a; };

  const summer = theme === 'summer';
  const walker = (r) => {
    if (theme === 'workshop') return makeElf({ carry: r % 3 === 1 ? null : 'gift', rng });
    if (theme === 'jungle') return makeElf({ summer: true, carry: r % 2 ? 'gift' : 'ball', rng });
    if (theme === 'japan') return makeElf({ carry: r % 2 ? null : 'gift', rng });
    if (theme === 'cyber') return makeElf({ cyber: true, carry: r % 2 ? null : 'gift', rng });
    if (theme === 'gingerbread') return r % 2 ? makeElf({ carry: 'gift', rng }) : makeGingerbreadMan(rng);
    if (theme === 'toys') return makeToySoldier({ drum: r % 2 === 1 });
    if (theme === 'space') return makeElf({ space: true, carry: r % 2 ? null : 'gift', rng });
    return makeElf({ summer, carry: winter ? (r % 3 === 2 ? null : 'gift') : ['surf', 'ball', null][r % 3], rng });
  };
  // One walker per terrace, stopping at that row's doors (the dome porches stick out further in space).
  for (let r = 0; r < L.rows; r++) {
    if (lite && r % 2) continue;
    const R = L.R0 + r * L.dR;
    const stops = L.slots.filter((s) => s.r === r).map((s) => s.th);
    const Rw = R - (0.95 + L.dR / 2) / 2 - (theme === 'space' ? 0.35 : 0.08);
    add(new TerraceWalker(walker(r), rng, { R: Rw, y: 0.3 + r * L.dy, stops, speed: (theme === 'toys' ? 0.7 : 0.8) + rng() * 0.4 }));
  }

  const plaza = { rMin: L.frontR - (summer ? 6.4 : 7.5), rMax: L.frontR - 1.0, thMin: -(L.spread + 0.25), thMax: L.spread + 0.25 };

  if (theme === 'workshop') {
    // Elves bustling round the square, one pulling a sled, reindeer by the tree
    for (let i = 0; i < (lite ? 3 : 6); i++) add(new Wanderer(makeElf({ carry: i % 3 === 2 ? null : 'gift', rng }), rng, { ...plaza, speed: 1.0, pauseMax: 1.5 }));
    const sled = makeSled();
    root.add(sled);
    add(new Wanderer(makeElf({ carry: null, rng }), rng, { ...plaza, speed: 0.9, sled, pauseMax: 2 }));
    [-1, 1].forEach((s) => {
      const deer = makeReindeer();
      deer.root.position.set(treePos.x + s * 6.5, treePos.y, treePos.z + 2.5);
      deer.root.rotation.y = s * -0.9 + Math.PI * 0.08;
      add(new Idler(deer, rng));
    });
    return agents;
  }
  if (theme === 'jungle') {
    for (let i = 0; i < (lite ? 2 : 3); i++) add(new Wanderer(makeElf({ summer: true, carry: 'ball', rng }), rng, { ...plaza, speed: 0.9, pauseMax: 3 }));
    const parrots = [
      { body: '#e2283a', wing: '#2e7dd1', tip: '#ffd23f', beak: '#f2e6c8' },
      { body: '#2fbf63', wing: '#ffd23f', tip: '#2e7dd1', beak: '#2a2f3a' },
      { body: '#1f8fe0', wing: '#ffd23f', tip: '#e2283a', beak: '#2a2f3a' },
      { body: '#ff8a2b', wing: '#2fbf63', tip: '#e2283a', beak: '#2a2f3a' },
    ];
    for (let i = 0; i < (lite ? 2 : 5); i++) {
      add(new Flyer(makeSeagull(parrots[i % parrots.length]), rng, { cx: (rng() - 0.5) * 20, cz: -(L.R0 + rng() * 10), r: 7 + rng() * 9, h: L.topY + 6 + rng() * 6, speed: (rng() < 0.5 ? -1 : 1) * (3 + rng() * 2) }));
    }
    return agents;
  }
  if (theme === 'japan') {
    for (let i = 0; i < (lite ? 1 : 2); i++) add(new Wanderer(makeElf({ carry: i % 2 ? 'gift' : null, rng }), rng, { ...plaza, speed: 0.7, pauseMax: 3 }));
    // squishy mochi friends hopping round the square
    const mochiCols = ['#ffffff', '#ffd6e8', '#d8f5e6', '#fff2c4'];
    for (let i = 0; i < (lite ? 3 : 6); i++) add(new Wanderer(makeMochi(mochiCols[i % mochiCols.length]), rng, { ...plaza, speed: 0.6, special: 'hop', pauseMax: 2.5 }));
    // red-crowned cranes circling the pagoda
    for (let i = 0; i < (lite ? 1 : 3); i++) {
      add(new Flyer(makeSeagull({ body: '#ffffff', wing: '#f4f4f6', tip: '#1d1d22', beak: '#c9c2a8', crest: '#e2283a' }), rng, { cx: (rng() - 0.5) * 16, cz: -(L.backR + 2 + rng() * 6), r: 9 + rng() * 8, h: L.topY + 11 + rng() * 5, speed: (rng() < 0.5 ? -1 : 1) * (2.5 + rng() * 1.5) }));
    }
    return agents;
  }
  if (theme === 'cyber') {
    for (let i = 0; i < (lite ? 2 : 4); i++) add(new Wanderer(makeElf({ cyber: true, carry: i % 2 ? 'gift' : null, rng }), rng, { ...plaza, speed: 1.0, pauseMax: 2 }));
    [-1, 1].forEach((s) => {
      const deer = makeRobotReindeer();
      deer.root.position.set(treePos.x + s * 6.5, treePos.y, treePos.z + 2.5);
      deer.root.rotation.y = s * -0.9 + Math.PI * 0.08;
      add(new Idler(deer, rng));
    });
    // camera drones sweeping over the village
    for (let i = 0; i < (lite ? 2 : 4); i++) {
      add(new Flyer(makeDrone(['#00e5ff', '#ff2bd6', '#a6ff00', '#ff8a00'][i % 4]), rng, { cx: (rng() - 0.5) * 24, cz: -(L.R0 + rng() * 12), r: 8 + rng() * 10, h: L.topY + 7 + rng() * 6, speed: (rng() < 0.5 ? -1 : 1) * (4 + rng() * 2) }));
    }
    return agents;
  }
  if (theme === 'gingerbread') {
    for (let i = 0; i < (lite ? 3 : 5); i++) add(new Wanderer(makeGingerbreadMan(rng), rng, { ...plaza, speed: 0.6, pauseMax: 3 }));
    const sled = makeSled();
    root.add(sled);
    add(new Wanderer(makeElf({ carry: null, rng }), rng, { ...plaza, speed: 0.9, sled, pauseMax: 2 }));
    [-1, 1].forEach((s) => {
      const deer = makeReindeer();
      deer.root.position.set(treePos.x + s * 6.5, treePos.y, treePos.z + 2.5);
      deer.root.rotation.y = s * -0.9 + Math.PI * 0.08;
      add(new Idler(deer, rng));
    });
    return agents;
  }
  if (theme === 'toys') {
    for (let i = 0; i < (lite ? 3 : 6); i++) add(new Wanderer(makeWindupPenguin(), rng, { ...plaza, rMin: L.frontR - 2.6, rMax: L.frontR - 1.0, speed: 0.75, pauseMax: 1.2 }));
    return agents;
  }
  if (theme === 'space') {
    for (let i = 0; i < (lite ? 2 : 4); i++) add(new Wanderer(makeElf({ space: true, carry: null, rng }), rng, { ...plaza, speed: 0.9, special: 'hop', pauseMax: 3 }));
    [-1, 1].forEach((s) => {
      const deer = makeRobotReindeer();
      deer.root.position.set(treePos.x + s * 6.5, treePos.y, treePos.z + 2.5);
      deer.root.rotation.y = s * -0.9 + Math.PI * 0.08;
      add(new Idler(deer, rng));
    });
    for (let i = 0; i < (lite ? 1 : 3); i++) {
      add(new Flyer(makeUFO(), rng, { cx: (rng() - 0.5) * 24, cz: -(L.R0 + rng() * 12), r: 10 + rng() * 10, h: L.topY + 10 + rng() * 6, speed: (rng() < 0.5 ? -1 : 1) * (3 + rng() * 2) }));
    }
    return agents;
  }
  const nPeng = lite ? 3 : winter ? 6 : 5;
  for (let i = 0; i < nPeng; i++) {
    add(new Wanderer(makePenguin(winter ? 1 : 0.75), rng, { ...plaza, speed: winter ? 0.55 : 0.45, special: 'slide' }));
  }

  if (winter) {
    // An elf pulling a sled of presents around the square
    const sled = makeSled();
    root.add(sled);
    add(new Wanderer(makeElf({ carry: null, rng }), rng, { ...plaza, speed: 0.9, sled, pauseMax: 2 }));
    // Reindeer grazing by the big tree
    [-1, 1].forEach((s, i) => {
      const deer = makeReindeer();
      deer.root.position.set(treePos.x + s * 6.5, treePos.y, treePos.z + 2.5);
      deer.root.rotation.y = s * -0.9 + Math.PI * 0.08;
      add(new Idler(deer, rng));
    });
    // A couple of penguins up by the tree too
    if (!lite) {
      for (let i = 0; i < 2; i++) {
        add(new Wanderer(makePenguin(0.9), rng, { rMin: L.backR + 1.5, rMax: L.backR + 4, thMin: -0.35, thMax: 0.35, y: L.topY, speed: 0.4, special: 'slide' }));
      }
    }
  } else {
    const nCrab = lite ? 2 : 5;
    for (let i = 0; i < nCrab; i++) {
      add(new Wanderer(makeCrab(), rng, { ...plaza, rMin: L.frontR - 6.8, rMax: L.frontR - 4, speed: 0.6, sideways: true, pauseMax: 2.5 }));
    }
    add(new Wanderer(makeKangaroo(), rng, { ...plaza, rMin: L.frontR - 5.5, rMax: L.frontR - 1.5, speed: 1.1, special: 'hop', pauseMax: 5 }));
    for (let i = 0; i < (lite ? 2 : 4); i++) {
      add(new Flyer(makeSeagull(), rng, { cx: (rng() - 0.5) * 20, cz: -(L.R0 + rng() * 10), r: 8 + rng() * 10, h: L.topY + 9 + rng() * 6, speed: (rng() < 0.5 ? -1 : 1) * (3 + rng() * 2) }));
    }
  }
  return agents;
}
