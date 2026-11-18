/* Set dressing: roof fairy lights, chimney smoke, lamps / tiki torches, presents, candy canes,
   beach umbrellas, towels, a sandcastle, surfboards. */
import * as THREE from 'three';
import { mat, canvasTexture } from './houses.js';

const A = window.Advent;
const polar = (r, th) => [r * Math.sin(th), -r * Math.cos(th)];

const puff = canvasTexture(64, 64, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,.9)');
  gr.addColorStop(0.5, 'rgba(255,255,255,.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, w);
});
puff.userData.shared = true;

function stripes(colors, w = 128, h = 32, vertical = true) {
  const t = canvasTexture(w, h, (g) => {
    colors.forEach((c, i) => {
      g.fillStyle = c;
      if (vertical) g.fillRect((i * w) / colors.length, 0, w / colors.length + 1, h);
      else g.fillRect(0, (i * h) / colors.length, w, h / colors.length + 1);
    });
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData.shared = true;
  return t;
}
const caneTex = stripes(['#e2283a', '#ffffff', '#e2283a', '#ffffff', '#e2283a', '#ffffff'], 64, 16);
caneTex.repeat.set(10, 1);

function mesh(geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// A toy train looping round an oval track in the square.
function buildTrain(root, L, updaters) {
  const cz = -(L.frontR - 4.3), rx = Math.min(7, L.frontR * Math.sin(L.spread) * 0.55), rz = 2.1;
  const pts = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * rx, 0.12, cz + Math.sin(a) * rz));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  [-0.22, 0.22].forEach((o) => {
    const rail = new THREE.CatmullRomCurve3(pts.map((p, i) => {
      const n = pts[(i + 1) % 64].clone().sub(pts[(i + 63) % 64]).normalize();
      return p.clone().add(new THREE.Vector3(-n.z, 0, n.x).multiplyScalar(o));
    }), true);
    root.add(mesh(new THREE.TubeGeometry(rail, 128, 0.04, 5, true), mat('#8a93a8', { metalness: 0.6, roughness: 0.3 }), 0, 0, 0));
  });
  for (let i = 0; i < 40; i++) {
    const t = i / 40;
    const p = curve.getPointAt(t), d = curve.getTangentAt(t);
    const sl = mesh(new THREE.BoxGeometry(0.62, 0.06, 0.14), mat('#8a5a3b'), p.x, 0.05, p.z);
    sl.rotation.y = Math.atan2(d.x, d.z) + Math.PI / 2;
    root.add(sl);
  }
  const cars = [];
  const engine = new THREE.Group();
  engine.add(mesh(new THREE.BoxGeometry(0.6, 0.35, 1.1), mat('#e2483d', { roughness: 0.4 }), 0, 0.35, 0));
  const boiler = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.7, 14), mat('#2a2f3a', { roughness: 0.4 }), 0, 0.68, 0.18);
  boiler.rotation.x = Math.PI / 2;
  engine.add(boiler);
  engine.add(mesh(new THREE.BoxGeometry(0.55, 0.5, 0.4), mat('#3f7be0', { roughness: 0.4 }), 0, 0.8, -0.32));
  engine.add(mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.3, 10), mat('#2a2f3a'), 0, 1.0, 0.42));
  engine.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#fff3c4', { emissive: '#ffd36b', emissiveIntensity: 2.5 }), 0, 0.6, 0.58));
  cars.push(engine);
  ['#ffd23f', '#2f9e5b', '#9b5de5'].forEach((c, i) => {
    const car = new THREE.Group();
    car.add(mesh(new THREE.BoxGeometry(0.58, 0.3, 0.85), mat(c, { roughness: 0.45 }), 0, 0.32, 0));
    car.add(mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), mat(['#e2483d', '#3f7be0', '#ff8ad8'][i], { roughness: 0.5 }), 0, 0.62, 0.1));
    car.add(mesh(new THREE.BoxGeometry(0.36, 0.05, 0.05), mat('#ffffff'), 0, 0.78, 0.1));
    cars.push(car);
  });
  cars.forEach((c) => {
    [-0.28, 0.28].forEach((x) => [-0.3, 0.3].forEach((z) => {
      const w = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), mat('#2a2f3a'), x, 0.14, z);
      w.rotation.z = Math.PI / 2;
      c.add(w);
    }));
    root.add(c);
  });
  const len = curve.getLength();
  updaters.push((t) => {
    cars.forEach((c, i) => {
      const u = (((t * 1.4) - i * 1.0) / len % 1 + 1) % 1;
      const p = curve.getPointAt(u), d = curve.getTangentAt(u);
      c.position.set(p.x, 0.05 + Math.abs(Math.sin(t * 12 + i)) * 0.02, p.z);
      c.rotation.y = Math.atan2(d.x, d.z);
    });
  });
}

export function buildProps(theme, L, rng, root, houses, treePos) {
  const snow = theme === 'snow';
  const summer = theme === 'summer';
  const wintry = !summer; // presents under the tree etc.
  const updaters = [];

  // ---- Fairy lights along every roof (one instanced draw call) ----
  const pts = [];
  houses.forEach((h) => {
    h.group.updateMatrixWorld(true);
    h.lights.forEach((p) => pts.push(h.group.localToWorld(p.clone())));
  });
  const BULBS = snow ? ['#ff4f5e', '#ffd23f', '#5fd4ff', '#7cf29a', '#ff8ad8'] : ['#ff4f81', '#ffd23f', '#2ec4ff', '#7cf29a', '#ff9f1c'];
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ toneMapped: false }), pts.length);
  const m4 = new THREE.Matrix4();
  const base = pts.map((p, i) => {
    m4.makeTranslation(p.x, p.y, p.z);
    bulbs.setMatrixAt(i, m4);
    const c = new THREE.Color(BULBS[i % BULBS.length]).multiplyScalar(snow ? 2.4 : 1.8);
    bulbs.setColorAt(i, c);
    return c;
  });
  root.add(bulbs);
  let tw = 0;
  const tmp = new THREE.Color();
  updaters.push((t, dt) => {
    tw += dt;
    if (tw < 0.12) return;
    tw = 0;
    for (let k = 0; k < Math.max(1, pts.length * 0.06); k++) {
      const i = (Math.random() * pts.length) | 0;
      bulbs.setColorAt(i, tmp.copy(base[i]).multiplyScalar(0.35 + Math.random() * 0.75));
    }
    bulbs.instanceColor.needsUpdate = true;
  });

  // ---- Chimney smoke ----
  const smoke = [];
  houses.forEach((h) => {
    if (!h.chimneyTop) return;
    const top = h.group.localToWorld(h.chimneyTop.clone());
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, color: '#c9d2e6', transparent: true, depthWrite: false, opacity: 0 }));
      s.userData = { top, phase: k / 4 + rng() * 0.1, speed: 0.22 + rng() * 0.08 };
      root.add(s);
      smoke.push(s);
    }
  });
  updaters.push((t) => {
    smoke.forEach((s) => {
      const k = (t * s.userData.speed + s.userData.phase) % 1;
      s.position.set(s.userData.top.x + k * 0.9 + Math.sin(t + s.userData.phase * 9) * 0.1, s.userData.top.y + k * 2.6, s.userData.top.z);
      s.scale.setScalar(0.35 + k * 1.2);
      s.material.opacity = Math.sin(k * Math.PI) * 0.3;
    });
  });

  // ---- Lamps (snow) / tiki torches (summer) along the terraces ----
  const flames = [];
  for (let r = 0; r < L.rows; r++) {
    const row = L.slots.filter((s) => s.r === r).sort((a, b) => a.th - b.th);
    const R = L.R0 + r * L.dR - L.dR / 2 + 0.35;
    const y = 0.3 + r * L.dy;
    for (let i = 0; i < row.length - 1; i += 2) {
      const th = (row[i].th + row[i + 1].th) / 2;
      const [x, z] = polar(R, th);
      if (theme === 'gingerbread') {
        // lollipop lamps
        root.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6), mat('#ffffff', { map: caneTex, flatShading: false }), x, y + 0.85, z));
        const pop = mesh(new THREE.SphereGeometry(0.24, 14, 10), mat(['#ff6fa3', '#7cf29a', '#ffd23f', '#c77dff'][i % 4], { emissive: ['#ff6fa3', '#7cf29a', '#ffd23f', '#c77dff'][i % 4], emissiveIntensity: 1.6, flatShading: false }), x, y + 1.9, z);
        root.add(pop);
      } else if (theme === 'toys') {
        root.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.7, 8), mat(['#e2483d', '#3f7be0', '#2f9e5b'][i % 3], { roughness: 0.45 }), x, y + 0.85, z));
        root.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), mat('#fff3c4', { emissive: '#ffd36b', emissiveIntensity: 2.2, flatShading: false }), x, y + 1.85, z));
        root.add(mesh(new THREE.ConeGeometry(0.16, 0.2, 10), mat('#ffd23f', { roughness: 0.4 }), x, y + 2.1, z));
      } else if (theme === 'space' || theme === 'cyber') {
        root.add(mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.6, 6), mat('#8a93a8', { metalness: 0.5, roughness: 0.4 }), x, y + 0.8, z));
        const bar = mesh(new THREE.CapsuleGeometry(0.06, 0.45, 3, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(theme === 'cyber' ? ['#ff2bd6', '#00e5ff', '#a6ff00'][i % 3] : i % 2 ? '#7af7ff' : '#ff6fd8').multiplyScalar(2.2), toneMapped: false }), x, y + 1.85, z);
        bar.castShadow = false;
        root.add(bar);
      } else if (theme === 'workshop') {
        // candy-striped lamp posts
        root.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), mat('#ffffff', { map: caneTex, flatShading: false }), x, y + 0.9, z));
        root.add(mesh(new THREE.SphereGeometry(0.22, 12, 10), mat('#fff3c4', { emissive: '#ffcf6b', emissiveIntensity: 2.4, flatShading: false }), x, y + 1.95, z));
        root.add(mesh(new THREE.ConeGeometry(0.2, 0.22, 8), mat('#2e6a4f'), x, y + 2.2, z));
        root.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), mat('#ffd23f'), x, y + 2.35, z));
      } else if (theme === 'japan') {
        // stone lanterns (toro) with a warm glow and snow on the cap
        const stone = mat('#9a9ea8');
        root.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.16, 6), stone, x, y + 0.08, z));
        root.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6), stone, x, y + 0.56, z));
        root.add(mesh(new THREE.BoxGeometry(0.38, 0.06, 0.38), stone, x, y + 0.99, z));
        root.add(mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat('#ffe0ee', { emissive: ['#ff9ec4', '#ffd36b', '#8fdcc0'][i % 3], emissiveIntensity: 2.2 }), x, y + 1.16, z));
        const roofT = mesh(new THREE.ConeGeometry(0.36, 0.26, 6), stone, x, y + 1.43, z);
        root.add(roofT);
        root.add(mesh(new THREE.ConeGeometry(0.2, 0.14, 6), mat('#f4f8ff', { roughness: 1 }), x, y + 1.52, z));
        root.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), stone, x, y + 1.6, z));
      } else if (snow) {
        root.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.7, 6), mat('#2a2f3a', { metalness: 0.4, roughness: 0.5 }), x, y + 0.85, z));
        root.add(mesh(new THREE.BoxGeometry(0.24, 0.3, 0.24), mat('#ffe3a0', { emissive: '#ffbe5c', emissiveIntensity: 2.6 }), x, y + 1.85, z));
        const cap = mesh(new THREE.ConeGeometry(0.22, 0.2, 4), mat('#2a2f3a', { metalness: 0.4, roughness: 0.5 }), x, y + 2.1, z);
        cap.rotation.y = Math.PI / 4;
        root.add(cap);
        root.add(mesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), mat('#f4f8ff', { roughness: 1 }), x, y + 2.22, z));
      } else {
        root.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.5, 6), mat('#b98a4e'), x, y + 0.75, z));
        root.add(mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.2, 7), mat('#6b4b2e'), x, y + 1.55, z));
        const f = mesh(new THREE.ConeGeometry(0.1, 0.36, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffae3a').multiplyScalar(2.2), toneMapped: false }), x, y + 1.82, z);
        f.castShadow = false;
        f.userData.seed = rng() * 10;
        root.add(f);
        flames.push(f);
      }
    }
  }
  if (flames.length) {
    updaters.push((t) => flames.forEach((f) => {
      f.scale.set(1, 0.8 + Math.sin(t * 13 + f.userData.seed) * 0.15 + Math.sin(t * 7.3 + f.userData.seed) * 0.1, 1);
      f.rotation.z = Math.sin(t * 5 + f.userData.seed) * 0.08;
    }));
  }

  if (wintry) {
    // ---- Presents piled at the foot of the big tree ----
    const COLORS = ['#e2483d', '#2f9e5b', '#3f5a8a', '#e9b949', '#9b5de5', '#ffffff', '#ff8ad8'];
    for (let i = 0; i < 14; i++) {
      const th = -1.1 + (2.2 * i) / 13 + (rng() - 0.5) * 0.15;
      const r = 5.6 + rng() * 1.2;
      const s = 0.45 + rng() * 0.45;
      const g = new THREE.Group();
      g.add(mesh(new THREE.BoxGeometry(s, s * (0.7 + rng() * 0.5), s), mat(COLORS[i % COLORS.length]), 0, s * 0.45, 0));
      const rib = mat(i % 3 ? '#ffd23f' : '#ffffff');
      g.add(mesh(new THREE.BoxGeometry(s + 0.02, s * 1.21, 0.08), rib, 0, s * 0.45, 0));
      g.add(mesh(new THREE.BoxGeometry(0.08, s * 1.21, s + 0.02), rib, 0, s * 0.45, 0));
      g.position.set(treePos.x + Math.sin(th) * r, treePos.y, treePos.z + Math.cos(th) * r);
      g.rotation.y = rng() * 3;
      root.add(g);
    }

    // ---- Candy canes around the square ----
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, 1.75, 0),
      new THREE.Vector3(0.2, 2.0, 0), new THREE.Vector3(0.45, 1.9, 0), new THREE.Vector3(0.55, 1.65, 0),
    ]);
    const caneGeo = new THREE.TubeGeometry(curve, 24, 0.09, 8);
    const caneMat = mat('#ffffff', { map: caneTex, flatShading: false, roughness: 0.4 });
    for (let i = 0; i < (snow || theme === 'workshop' ? 6 : theme === 'gingerbread' ? 10 : 0); i++) {
      const th = (i < 3 ? -1 : 1) * (L.spread + 0.05 + (i % 3) * 0.12);
      const [x, z] = polar(L.frontR - 1.6 - (i % 5) * 1.3, i < 6 ? th : th * 0.55);
      const c = mesh(caneGeo, caneMat, x, 0, z);
      c.rotation.y = rng() * 6;
      if (theme === 'gingerbread') c.scale.setScalar(1.4);
      root.add(c);
    }
    if (theme === 'gingerbread') {
      // gumdrops dotted around the square
      const gum = ['#ff4f81', '#7cf29a', '#ffd23f', '#6fc9ff', '#c77dff'];
      for (let i = 0; i < 16; i++) {
        const [x, z] = polar(L.frontR - 1.2 - rng() * 6.5, (rng() - 0.5) * 2 * (L.spread + 0.25));
        const gd = mesh(new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(gum[i % 5], { roughness: 0.3, flatShading: false }), x, 0, z);
        gd.scale.y = 1.4;
        root.add(gd);
      }
    }
    if (theme === 'toys') buildTrain(root, L, updaters);
    if (theme === 'toys') {
      // stacks of building blocks at the corners of the square
      const cols = ['#e2483d', '#3f7be0', '#ffd23f', '#2f9e5b', '#ff8a2b'];
      [-1, 1].forEach((side) => {
        const [x, z] = polar(L.frontR - 3, side * (L.spread + 0.15));
        for (let k = 0; k < 5; k++) {
          const b = mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat(cols[(k + (side > 0 ? 2 : 0)) % 5], { roughness: 0.5 }), x + (k % 2) * 0.75 - 0.35, 0.35 + Math.floor(k / 2) * 0.7, z);
          b.rotation.y = rng() * 0.4;
          root.add(b);
        }
      });
    }
  } else {
    // ---- Beach: umbrellas, towels, a sandcastle, surfboards, an esky ----
    const uCols = [['#ff4f81', '#ffffff'], ['#2ec4b6', '#ffffff'], ['#ffd23f', '#ff6f91'], ['#6a8cff', '#ffffff'], ['#ff9f1c', '#ffffff']];
    const beachR = (k) => L.frontR - 6.2 + k * 5.2;
    for (let i = 0; i < 5; i++) {
      const th = -(L.spread + 0.35) + ((2 * (L.spread + 0.35)) * (i + 0.5)) / 5 + (rng() - 0.5) * 0.1;
      if (Math.abs(th) < 0.12) continue; // keep the middle clear for the sandcastle
      const [x, z] = polar(beachR(0.45 + rng() * 0.35), th);
      const g = new THREE.Group();
      const canopyTex = stripes([...uCols[i], ...uCols[i], ...uCols[i], ...uCols[i]], 128, 16);
      const pole = mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 6), mat('#f2f2f2'), 0, 1.15, 0);
      const canopy = mesh(new THREE.ConeGeometry(1.25, 0.55, 8, 1, true), new THREE.MeshStandardMaterial({ map: canopyTex, side: THREE.DoubleSide, roughness: 0.8, flatShading: true }), 0, 2.25, 0);
      g.add(pole, canopy);
      g.rotation.z = (rng() - 0.5) * 0.25;
      g.position.set(x, 0, z);
      root.add(g);
      const towelTex = stripes([uCols[(i + 2) % 5][0], '#ffffff', uCols[(i + 2) % 5][0], '#ffffff', uCols[(i + 2) % 5][0]], 64, 64, false);
      const towel = mesh(new THREE.BoxGeometry(0.85, 0.03, 1.7), new THREE.MeshStandardMaterial({ map: towelTex, roughness: 1 }), x + 0.9, 0.02, z + 0.3);
      towel.rotation.y = -th + (rng() - 0.5) * 0.6;
      root.add(towel);
    }
    // Sandcastle front and centre
    const sc = new THREE.Group();
    const sandM = mat('#f2c27a');
    sc.add(mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.6, 10), sandM, 0, 0.3, 0));
    sc.add(mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.6, 10), sandM, 0, 0.9, 0));
    sc.add(mesh(new THREE.ConeGeometry(0.45, 0.55, 10), sandM, 0, 1.47, 0));
    [[-0.8, 0.5], [0.8, 0.5], [0, -0.85]].forEach(([x, z]) => {
      sc.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.85, 8), sandM, x, 0.43, z));
      sc.add(mesh(new THREE.ConeGeometry(0.26, 0.3, 8), sandM, x, 1.0, z));
    });
    sc.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), mat('#6b4b3e'), 0, 1.95, 0));
    const flag = mesh(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshStandardMaterial({ color: '#e2483d', side: THREE.DoubleSide }), 0.17, 2.12, 0);
    sc.add(flag);
    const moat = mesh(new THREE.TorusGeometry(1.3, 0.12, 4, 24), mat('#3fb7c9', { roughness: 0.2 }), 0, 0.03, 0);
    moat.rotation.x = Math.PI / 2;
    sc.add(moat);
    const [sx, sz] = polar(L.frontR - 3.6, 0);
    sc.position.set(sx, 0, sz);
    root.add(sc);
    updaters.push((t) => { flag.rotation.y = Math.sin(t * 3) * 0.4; });
    // Surfboards stuck in the sand
    for (let i = 0; i < 3; i++) {
      const th = (i - 1) * 0.16 + (i === 1 ? 0.5 : 0) * Math.sign(rng() - 0.5);
      const [x, z] = polar(L.frontR - 1.3, (i - 1) * (L.spread * 0.55) + 0.08);
      const b = mesh(new THREE.CapsuleGeometry(0.24, 1.7, 3, 10), mat(['#ff6f91', '#ffd23f', '#2ec4b6'][i]), x, 1.0, z);
      b.scale.set(1, 1, 0.18);
      b.rotation.set((rng() - 0.5) * 0.2, -th, (rng() - 0.5) * 0.3);
      root.add(b);
    }
    // Esky
    const [ex, ez] = polar(L.frontR - 2.2, L.spread * 0.8);
    root.add(mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), mat('#ffffff'), ex, 0.25, ez));
    root.add(mesh(new THREE.BoxGeometry(0.84, 0.12, 0.54), mat('#2e7dd1'), ex, 0.56, ez));
  }

  return { update: (t, dt) => updaters.forEach((u) => u(t, dt)) };
}
