/* The two 3D worlds. Houses sit on curved terraces facing the camera, a big tree (or palm)
   at the top carries one light per opened door. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeHouse, canvasTexture, surfaceMaterial } from './houses.js';
import { buildProps } from './props.js';
import { populate } from './characters.js';
import { buildTree, buildScenery, icingTex, biscuitTex, blockTex, moonTex, panelTex, mossTex, rockTex, gridTex } from './worlds-extra.js';

const A = window.Advent;
const std = (o) => surfaceMaterial({ roughness: 0.9, metalness: 0, flatShading: true, ...o });

// ---------- Layout ----------
export function layoutFor(cols) {
  const P = {
    8: { spread: 0.78, R0: 15, dR: 4.4, dy: 1.6 },
    6: { spread: 0.6, R0: 13, dR: 4.1, dy: 1.55 },
    4: { spread: 0.42, R0: 11.5, dR: 3.7, dy: 1.5 },
  }[cols];
  const rows = 24 / cols;
  const slots = [];
  for (let i = 0; i < 24; i++) {
    const r = rows - 1 - Math.floor(i / cols); // day 1 is top-left, like reading
    const c = i % cols;
    const th = -P.spread + (2 * P.spread * c) / (cols - 1);
    const R = P.R0 + r * P.dR;
    slots.push({ day: i + 1, r, R, th, x: R * Math.sin(th), y: 0.3 + r * P.dy, z: -R * Math.cos(th), rotY: -th });
  }
  return { ...P, cols, rows, slots, topY: 0.3 + (rows - 1) * P.dy, backR: P.R0 + (rows - 1) * P.dR + P.dR / 2, frontR: P.R0 - P.dR / 2 };
}

// Curved terrace slice, extruded upwards.
function sectorGeo(rIn, rOut, spread, height, segs = 48) {
  const s = new THREE.Shape();
  for (let k = 0; k <= segs; k++) {
    const th = -spread + (2 * spread * k) / segs;
    const p = [rOut * Math.sin(th), rOut * Math.cos(th)];
    k ? s.lineTo(...p) : s.moveTo(...p);
  }
  for (let k = segs; k >= 0; k--) {
    const th = -spread + (2 * spread * k) / segs;
    s.lineTo(rIn * Math.sin(th), rIn * Math.cos(th));
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function skyDome(top, mid, horizon) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uTop: { value: new THREE.Color(top) }, uMid: { value: new THREE.Color(mid) }, uHor: { value: new THREE.Color(horizon) } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y, -0.2, 1.0);
        vec3 c = h < 0.18 ? mix(uHor, uMid, smoothstep(-0.05, 0.18, h)) : mix(uMid, uTop, smoothstep(0.18, 0.75, h));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat);
  m.renderOrder = -1;
  return m;
}

const dotTexture = canvasTexture(64, 64, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,.8)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, w);
});
dotTexture.userData.shared = true;

function glowSprite(color, size, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.setScalar(size);
  return s;
}

function starShape(r1, r2) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const p = [Math.cos(a) * r, Math.sin(a) * r];
    i ? s.lineTo(...p) : s.moveTo(...p);
  }
  return s;
}
export function makeStar(color, size = 1) {
  const g = new THREE.ExtrudeGeometry(starShape(size, size * 0.45), { depth: size * 0.3, bevelEnabled: true, bevelSize: size * 0.06, bevelThickness: size * 0.08, bevelSegments: 1 });
  g.center();
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), toneMapped: false }));
}

// One merged low-poly pine, coloured per vertex (green tiers + snowy tips).
function pineGeometry(snowy) {
  const parts = [];
  const add = (geo, color) => {
    const c = new THREE.Color(color);
    const n = geo.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    parts.push(geo);
  };
  const trunk = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 5);
  trunk.translate(0, 0.4, 0);
  add(trunk, '#5a3b2a');
  [[1.35, 1.7, 0.6], [1.12, 1.55, 1.35], [0.88, 1.4, 2.05], [0.6, 1.2, 2.7]].forEach(([r, h, y]) => {
    const cone = new THREE.ConeGeometry(r, h, 7);
    cone.translate(0, y + h / 2, 0);
    add(cone, '#1f5245');
    if (snowy) {
      const tip = new THREE.ConeGeometry(r * 0.42, h * 0.42, 7);
      tip.translate(0, y + h - (h * 0.42) / 2 + 0.02, 0);
      add(tip, '#f4f8ff');
    }
  });
  return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}

function scatter(rng, n, fn) {
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 20) {
    const p = fn();
    if (p) out.push(p);
  }
  return out;
}

function instanced(geo, mat, items) {
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  items.forEach((it, i) => {
    p.set(it.x, it.y, it.z);
    q.setFromEuler(new THREE.Euler(0, it.rot || 0, 0));
    s.setScalar(it.s);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    if (it.tint) mesh.setColorAt(i, new THREE.Color(it.tint, it.tint * (0.95 + Math.sin(i) * 0.05), it.tint));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- Surface textures ----------
function noiseTex(base, dots, size = 256, repeat = 24) {
  const t = canvasTexture(size, size, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const r = A.rng(size + base.length);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = dots[(r() * dots.length) | 0];
      g.globalAlpha = 0.25 + r() * 0.5;
      g.fillRect(r() * w, r() * h, 1.6, 1.6);
    }
    g.globalAlpha = 1;
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / repeat, 1 / repeat);
  t.userData.shared = true;
  return t;
}
const snowTex = noiseTex('#eef3ff', ['#ffffff', '#dfe7fb', '#f7faff', '#d3ddf5'], 256, 14);
const sandTex = noiseTex('#ffd796', ['#f1c47c', '#fff0c8', '#e3b06a', '#ffe2a8'], 256, 10);
const stoneTex = (() => {
  const t = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#6f7fa6';
    g.fillRect(0, 0, w, h);
    const r = A.rng(77);
    for (let row = 0; row < 8; row++) {
      const off = row % 2 ? 0 : 24;
      for (let x = -48 + off; x < w; x += 48) {
        const shade = 120 + ((r() * 40) | 0);
        g.fillStyle = `rgb(${shade - 18},${shade},${shade + 34})`;
        g.fillRect(x + 2, row * 32 + 2, 44, 28);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.4, 0.4);
  t.userData.shared = true;
  return t;
})();
const timberTex = (() => {
  const t = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#c98d55';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = y % 64 ? '#bf8250' : '#d39a62';
      g.fillRect(0, y, w, 30);
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect(0, y + 30, w, 2);
    }
    g.fillStyle = 'rgba(60,30,10,.35)';
    for (let x = 20; x < w; x += 80) g.fillRect(x, 0, 6, h);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.4, 0.4);
  t.userData.shared = true;
  return t;
})();

// ---------- Palm ----------
function makePalm(h, lean, rng, lights) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push(new THREE.Vector3(lean * t * t * h * 0.35, t * h, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, h * 0.035, 7), std({ color: '#9a6a43' }));
  g.add(trunk);
  const top = pts[pts.length - 1];
  const leafGeo = new THREE.PlaneGeometry(h * 0.42, h * 0.11, 8, 1);
  const pos = leafGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + (h * 0.42) / 2; // 0..len
    const k = x / (h * 0.42);
    pos.setY(i, pos.getY(i) * (1 - k * 0.8));
    pos.setZ(i, -k * k * h * 0.16);
    pos.setX(i, x);
  }
  leafGeo.computeVertexNormals();
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(leafGeo, std({ color: i % 2 ? '#1f8a57' : '#2fae6a', side: THREE.DoubleSide }));
    leaf.position.copy(top);
    leaf.rotation.order = 'YXZ'; // tilt flat first, then spin around the trunk
    leaf.rotation.set(-Math.PI / 2 + 0.25, (i / 9) * Math.PI * 2 + rng(), 0);
    g.add(leaf);
  }
  [[-0.2, -0.3, 0.15], [0.2, -0.32, 0.05], [0, -0.38, -0.2]].forEach(([x, y, z]) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(h * 0.035, 6, 4), std({ color: '#6b4226' }));
    c.position.set(top.x + x * h * 0.15, top.y + y * h * 0.1, z * h * 0.15);
    g.add(c);
  });
  if (lights) {
    const cols = ['#ff4f81', '#ffd23f', '#2ec4ff', '#7cf29a', '#ff9f1c'];
    for (let i = 0; i < 10; i++) {
      const t = 0.12 + i * 0.08;
      const p = curve.getPoint(t);
      const b = new THREE.Mesh(new THREE.SphereGeometry(h * 0.02, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(cols[i % 5]).multiplyScalar(2), toneMapped: false }));
      b.position.set(p.x + Math.sin(i * 2.1) * h * 0.04, p.y, Math.cos(i * 2.1) * h * 0.04);
      g.add(b);
    }
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.sway = rng() * 6;
  return g;
}

// ---------- Tree with 24 lights (the "garland") ----------
function makeLightTree(theme, rng) {
  const g = new THREE.Group();
  const bulbs = [];
  const BULB = ['#ff4f5e', '#ffd23f', '#5fd4ff', '#7cf29a', '#ff8ad8', '#ffa94d'];
  let surface; // (frac, angle) -> local position on the tree
  let H;
  if (theme === 'snow') {
    H = 13;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.6, 7), std({ color: '#5a3b2a' }));
    trunk.position.y = 0.8;
    g.add(trunk);
    const tiers = [[5.2, 4.6, 1.2], [4.3, 4.2, 3.9], [3.3, 3.8, 6.4], [2.2, 3.4, 8.8]];
    tiers.forEach(([r, h, y]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), std({ color: '#1d5a44' }));
      cone.position.y = y + h / 2;
      g.add(cone);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, h * 0.33, 9), std({ color: '#f4f8ff' }));
      tip.position.y = y + h - (h * 0.33) / 2 + 0.03;
      g.add(tip);
    });
    surface = (f, a) => {
      const y = 1.6 + f * 10.4;
      const r = 4.9 * (1 - f) + 0.6;
      return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    };
    const star = makeStar('#ffd36b', 1.0);
    star.position.y = 12.9;
    g.add(star);
    g.userData.star = star;
    const halo = glowSprite('#ffd36b', 6, 0.55);
    halo.position.y = 12.9;
    g.add(halo);
  } else if (theme !== 'summer') {
    const t = buildTree(theme, g, rng, { makeStar, glowSprite, std, pineGeometry });
    H = t.H;
    surface = t.surface;
    if (t.star) g.userData.star = t.star;
  } else {
    H = 15;
    const palm = makePalm(H, 0.4, rng, false);
    g.add(palm);
    surface = (f, a) => {
      const t = 0.06 + f * 0.9;
      const x = 0.4 * t * t * H * 0.35;
      const r = H * 0.05;
      return new THREE.Vector3(x + Math.sin(a) * r, t * H, Math.cos(a) * r);
    };
    // Santa hat on the crown
    const top = new THREE.Vector3(0.4 * H * 0.35, H, 0);
    const hat = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 10), std({ color: '#e2483d' }));
    cone.position.y = 1.3;
    cone.rotation.z = -0.35;
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.28, 6, 14), std({ color: '#ffffff' }));
    brim.rotation.x = Math.PI / 2;
    brim.position.y = 0.25;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), std({ color: '#ffffff' }));
    pom.position.set(0.75, 2.35, 0);
    hat.add(cone, brim, pom);
    hat.position.copy(top).add(new THREE.Vector3(0, 0.3, 0));
    g.add(hat);
  }
  for (let i = 0; i < 24; i++) {
    const f = 0.04 + (i / 23) * 0.86;
    const a = -1.25 + 2.5 * ((i * 0.6180339) % 1);
    const p = surface(f, a);
    const c = new THREE.Color(BULB[i % BULB.length]);
    const dim = c.clone().multiplyScalar(0.32);
    const mat = new THREE.MeshStandardMaterial({ color: dim, roughness: 0.25, metalness: 0.5, emissive: c, emissiveIntensity: 0.05 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(theme === 'snow' ? 0.36 : 0.28, 10, 8), mat);
    b.position.copy(p);
    b.userData.color = c;
    b.userData.dim = dim;
    g.add(b);
    bulbs.push(b);
  }
  g.traverse((o) => { if (o.isMesh && o.material && !o.material.isMeshBasicMaterial) o.castShadow = true; });
  return {
    group: g,
    height: H,
    bulbs,
    setLit(i, on) {
      const b = bulbs[i];
      if (!b) return;
      b.material.emissiveIntensity = on ? 3.2 : 0.05;
      b.material.color.copy(on ? b.userData.color : b.userData.dim);
      b.userData.on = on;
    },
  };
}

// ---------- Ocean ----------
function makeOcean(L) {
  const geo = new THREE.PlaneGeometry(700, 700, 220, 220);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#0b7fa8') },
      uShallow: { value: new THREE.Color('#47d6d2') },
      uFoam: { value: new THREE.Color('#ffffff') },
      uShoreR: { value: L.frontR - 7 },
      uSpread: { value: L.spread + 0.62 },
      uFog: { value: new THREE.Color('#ffd9a8') },
    },
    vertexShader: `uniform float uTime; varying vec3 vPos; varying float vH;
      void main(){ vec3 p = position;
        float h = sin(p.x*0.15 + uTime*1.1)*0.16 + sin(p.z*0.21 - uTime*0.9)*0.13 + sin((p.x+p.z)*0.37 + uTime*1.8)*0.05;
        p.y += h; vH = h; vec4 w = modelMatrix * vec4(p,1.0); vPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFoam; uniform float uShoreR; uniform float uSpread; uniform vec3 uFog;
      varying vec3 vPos; varying float vH;
      void main(){
        float d = length(vPos.xz); float ang = atan(vPos.x, -vPos.z);
        float onShore = 1.0 - smoothstep(uSpread - 0.08, uSpread + 0.08, abs(ang));
        float toShore = mix(40.0, uShoreR - d, onShore);
        vec3 col = mix(uShallow, uDeep, smoothstep(1.5, 34.0, toShore));
        float wob = 0.8 + 0.6*sin(uTime*1.4 + ang*9.0);
        float foam = onShore * (1.0 - smoothstep(0.0, wob, abs(toShore - 0.3 - 0.35*sin(uTime*0.9))));
        foam += onShore * 0.5 * (1.0 - smoothstep(0.0, 0.35, abs(toShore - 2.4 - 0.8*sin(uTime*0.9 + 1.2))));
        col = mix(col, uFoam, clamp(foam, 0.0, 1.0) * 0.9);
        col += vH * 0.55;
        float sp = pow(max(0.0, sin(vPos.x*1.7 + uTime*2.1) * sin(vPos.z*1.9 - uTime*1.7)), 28.0);
        col += sp * 0.8;
        float dist = length(cameraPosition - vPos);
        col = mix(col, uFog, smoothstep(70.0, 260.0, dist));
        gl_FragColor = vec4(col, 1.0); }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = -0.45;
  m.receiveShadow = false;
  return m;
}

function makeSurfSanta() {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 2.2, 4, 8), std({ color: '#ffd23f' }));
  board.rotation.z = Math.PI / 2;
  board.scale.set(1, 1, 0.25);
  g.add(board);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.9, 8), std({ color: '#e2483d' }));
  body.position.y = 0.75;
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.12, 8), std({ color: '#2a2140' }));
  belt.position.y = 0.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), std({ color: '#ffd2b0' }));
  head.position.y = 1.42;
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), std({ color: '#ffffff' }));
  beard.position.set(0, 1.38, 0.06);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 8), std({ color: '#e2483d' }));
  hat.position.set(0.05, 1.82, 0);
  hat.rotation.z = -0.4;
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), std({ color: '#ffffff' }));
  pom.position.set(0.24, 2.02, 0);
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 5), std({ color: '#e2483d' }));
    arm.position.set(s * 0.5, 1.05, 0);
    arm.rotation.z = s * -1.1;
    g.add(arm);
  });
  g.add(body, belt, head, beard, hat, pom);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function makeSleigh() {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe3a0').multiplyScalar(1.6), toneMapped: false, fog: false });
  const g = new THREE.Group();
  const sled = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 1.2), mat);
  const runner = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.2), mat);
  runner.position.y = -0.7;
  const santa = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 5), mat);
  santa.position.set(-0.4, 0.9, 0);
  g.add(sled, runner, santa);
  for (let i = 0; i < 3; i++) {
    const deer = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.5), mat);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.35), mat);
    head.position.set(0.85, 0.5, 0);
    deer.add(body, head);
    [-0.5, 0.5].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), mat);
      leg.position.set(x, -0.6, 0);
      deer.add(leg);
    });
    deer.position.set(3.4 + i * 2.3, 0.3 + i * 0.25, 0);
    g.add(deer);
  }
  return g;
}

// ---------- World ----------
// Look of each world: sky (top, middle, horizon), hemisphere light, sun, surfaces, snowfall.
const STYLES = {
  snow: { sky: ['#040a26', '#12245a', '#3d5aa0'], hemi: ['#7f9cff', '#1b2340', 0.85], sun: ['#c6d6ff', 1.1, [30, 50, 40]], cap: 'snow', wall: 'stone', plateau: '#eef4ff', snow: { base: 2200, color: '#ffffff', size: 0.32, speed: 1 } },
  summer: { sky: ['#ff6fa3', '#ffa58a', '#ffd9a8'], hemi: ['#ffe0ea', '#ffb070', 1.1], sun: ['#ffd8a8', 2.2, [-35, 50, 55]], cap: 'sand', wall: 'timber', plateau: '#a9d27a', snow: { base: 0, color: '#ffffff', size: 0.32, speed: 1 } },
  gingerbread: { sky: ['#1a0b33', '#5b2a72', '#e994b8'], hemi: ['#ffd0ea', '#40203a', 1.0], sun: ['#ffe6cc', 1.25, [25, 50, 40]], cap: 'icing', wall: 'biscuit', plateau: '#fff3f8', snow: { base: 1300, color: '#fff6fb', size: 0.3, speed: 0.9 } },
  toys: { sky: ['#3f8fe0', '#8cc8ff', '#e3f3ff'], hemi: ['#ffffff', '#8fa8c8', 1.05], sun: ['#fff2dc', 1.9, [-30, 55, 45]], cap: 'snow', wall: 'blocks', plateau: '#f4f7ff', snow: { base: 700, color: '#ffffff', size: 0.3, speed: 0.9 } },
  workshop: { sky: ['#071229', '#16305a', '#3f6a96'], hemi: ['#9fb6ff', '#1b2340', 0.85], sun: ['#c6d6ff', 1.15, [30, 50, 40]], cap: 'snow', wall: 'stone', plateau: '#eef4ff', snow: { base: 2000, color: '#ffffff', size: 0.32, speed: 1 } },
  jungle: { sky: ['#0f3b3a', '#3f7d62', '#f2c46d'], hemi: ['#fff0c8', '#1d4a30', 1.05], sun: ['#ffd28a', 1.9, [-35, 45, 40]], cap: 'moss', wall: 'rock', plateau: '#3f8a4e', snow: { base: 380, color: '#fff09a', size: 0.22, speed: 0.12, glow: true } },
  japan: { sky: ['#6f7be0', '#c3a3ec', '#ffcadc'], hemi: ['#fff0f7', '#9a8fd0', 0.95], sun: ['#fff2e8', 1.25, [-30, 45, 45]], cap: 'snow', wall: 'stone', plateau: '#fff4f8', snow: { base: 900, color: '#ffb7d5', size: 0.36, speed: 0.4 } },
  cyber: { sky: ['#05020f', '#1a0b3a', '#5a1a6e'], hemi: ['#b8a8ff', '#2a1a48', 1.35], sun: ['#c0d8ff', 1.1, [30, 50, 40]], cap: 'grid', wall: 'panel', plateau: '#14121f', snow: { base: 2600, color: '#8fd0ff', size: 0.14, speed: 4.5, glow: true } },
  space: { sky: ['#010008', '#0d0626', '#2a1a55'], hemi: ['#9fb4ff', '#120a26', 0.75], sun: ['#e6ecff', 1.5, [40, 45, 30]], cap: 'moon', wall: 'panel', plateau: '#9a9aa8', snow: { base: 450, color: '#cfeaff', size: 0.24, speed: 0.25, glow: true } },
};
const SURF = () => ({ snow: snowTex, sand: sandTex, stone: stoneTex, timber: timberTex, icing: icingTex, biscuit: biscuitTex, blocks: blockTex, moon: moonTex, panel: panelTex, moss: mossTex, rock: rockTex, grid: gridTex });

// Falling snow for every world, with a blizzard on demand (shake the phone / press S).
function makeSnowfall(root, rng, cfg) {
  const coarse = A.forceLite || matchMedia('(pointer: coarse)').matches;
  const base = A.reducedMotion ? Math.round(cfg.base / 4) : cfg.base;
  const EXTRA = A.reducedMotion ? 600 : coarse ? 2600 : 4200;
  const N = base + EXTRA;
  const pos = new Float32Array(N * 3), speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos.set([(rng() - 0.5) * 120, rng() * 46, -75 + rng() * 110], i * 3);
    speed[i] = (1.2 + rng() * 2.2) * (i < base ? cfg.speed : 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setDrawRange(0, base);
  const material = new THREE.PointsMaterial({ map: dotTexture, color: new THREE.Color(cfg.color).multiplyScalar(cfg.glow ? 1.6 : 1), size: cfg.size, transparent: true, depthWrite: false, opacity: 0.95, blending: cfg.glow ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !cfg.glow });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.visible = base > 0;
  root.add(points);
  let storm = 0, wind = 0;
  return {
    letItSnow(power = 1) { storm = Math.min(1.8, storm + power); },
    update(t, dt) {
      storm = Math.max(0, storm - dt * 0.13);
      const active = base + Math.floor(EXTRA * Math.min(1, storm));
      geo.setDrawRange(0, active);
      points.visible = active > 0;
      if (!active) return;
      wind = A.lerp(wind, storm * 5, 0.03);
      material.size = cfg.size * (1 + Math.min(1, storm) * 0.35);
      const a = pos;
      const fast = 1 + Math.min(1, storm) * 0.9;
      for (let i = 0; i < active; i++) {
        const k = i * 3;
        const sp = i < base ? speed[i] : speed[i] * fast;
        a[k + 1] -= sp * dt;
        a[k] += Math.sin(t * 0.7 + i) * 0.006 + wind * dt;
        if (a[k + 1] < 0) { a[k + 1] = 46; a[k] = (Math.random() - 0.5) * 120; }
        if (a[k] > 60) a[k] -= 120;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

export function buildWorld(theme, cols, calItems) {
  A.toonLook = theme === 'japan'; // kawaii / manga cel shading
  const ST = STYLES[theme] || STYLES.snow;
  const tx = SURF();
  const snow = theme === 'snow';
  const summer = theme === 'summer';
  const L = layoutFor(cols);
  // Gentle hills, flat where the village and its square are.
  const groundAt = (x, z) => {
    if (summer || theme === 'cyber') return 0;
    const d = Math.hypot(x, z);
    const th = Math.atan2(x, -z);
    const inWedge = Math.abs(th) < L.spread + 0.45 && d < L.backR + 8;
    const fade = inWedge || d < L.frontR + 2 ? 0 : Math.min(1, (d - L.frontR) / 30);
    const n = Math.sin(x * 0.07) * Math.cos(z * 0.06) * 2.2 + Math.sin(x * 0.17 + z * 0.11) * 0.8 + Math.sin(z * 0.23) * 0.4;
    return Math.max(0, n + 1.2) * fade;
  };
  const rng = A.rng({ snow: 1225, summer: 2512, gingerbread: 3141, toys: 4242, space: 5150, workshop: 6125, jungle: 7070, japan: 8181, cyber: 9090 }[theme] || 1225);
  const root = new THREE.Group();
  const updaters = [];

  // Sky, fog, lights
  const horizon = ST.sky[2];
  root.add(skyDome(ST.sky[0], ST.sky[1], horizon));
  const fog = new THREE.Fog(horizon, theme === 'space' ? 120 : 70, theme === 'space' ? 420 : theme === 'japan' ? 330 : theme === 'cyber' ? 300 : 260);

  const hemi = new THREE.HemisphereLight(ST.hemi[0], ST.hemi[1], ST.hemi[2]);
  root.add(hemi);
  const sun = new THREE.DirectionalLight(ST.sun[0], ST.sun[1]);
  sun.position.set(...ST.sun[2]);
  sun.target.position.set(0, 0, -L.backR * 0.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);

  // Ground + terraces
  const capMat = std({ color: '#ffffff', map: tx[ST.cap], roughness: 1 });
  const wallMat = std({ color: '#ffffff', map: tx[ST.wall] });
  if (!summer) {
    const gGeo = new THREE.PlaneGeometry(440, 440, 110, 110);
    gGeo.rotateX(-Math.PI / 2);
    const gp = gGeo.attributes.position;
    for (let i = 0; i < gp.count; i++) gp.setY(i, groundAt(gp.getX(i), gp.getZ(i)));
    gGeo.computeVertexNormals();
    const groundTex = tx[ST.cap].clone();
    groundTex.repeat.set(30, 30);
    groundTex.needsUpdate = true;
    const ground = new THREE.Mesh(gGeo, std({ color: '#ffffff', map: groundTex, roughness: 1 }));
    ground.receiveShadow = true;
    root.add(ground);
  } else {
    root.add(makeOcean(L));
    const beach = new THREE.Mesh(sectorGeo(L.frontR - 7, L.frontR + 0.2, L.spread + 0.62, 1.0), [capMat, wallMat]);
    beach.position.y = -1;
    beach.receiveShadow = true;
    root.add(beach);
  }
  for (let r = 0; r < L.rows; r++) {
    const R = L.R0 + r * L.dR;
    const y = 0.3 + r * L.dy;
    const t = new THREE.Mesh(sectorGeo(R - L.dR / 2, R + L.dR / 2 + 0.05, L.spread + 0.16 + r * 0.01, y + 1), [capMat, wallMat]);
    t.position.y = -1;
    t.receiveShadow = true;
    t.castShadow = true;
    root.add(t);
  }
  const plateauMat = summer ? std({ color: ST.plateau, roughness: 1 }) : std({ color: '#ffffff', map: tx[ST.cap], roughness: 1 });
  const plateau = new THREE.Mesh(sectorGeo(L.backR, L.backR + 60, L.spread + 0.6, L.topY + 1), [plateauMat, wallMat]);
  plateau.position.y = -1;
  plateau.receiveShadow = true;
  root.add(plateau);

  // Houses
  const pal = A.HUT_PALETTES[theme];
  const houses = L.slots.map((s, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const p = pal[(col * 5 + row * 2) % pal.length];
    const h = makeHouse(theme, s.day, p, A.iconFor(calItems[i], theme), rng);
    h.group.position.set(s.x, s.y, s.z);
    h.group.rotation.y = s.rotY;
    h.slot = s;
    root.add(h.group);
    return h;
  });

  // The light tree, centre top
  const tree = makeLightTree(theme, rng);
  tree.group.position.set(0, L.topY, -(L.backR + (summer ? 5 : 6)));
  root.add(tree.group);

  // Fairy lights along every roof, chimney smoke, props, and the characters who live here
  const extras = buildProps(theme, L, rng, root, houses, tree.group.position);
  updaters.push(extras.update);
  const agents = populate(theme, L, rng, root, { lite: A.forceLite || matchMedia('(pointer: coarse)').matches, treePos: tree.group.position });
  updaters.push((t, dt) => agents.forEach((a) => a.update(dt, t)));

  // Scenery
  const avoid = (x, z) => Math.hypot(x - tree.group.position.x, z - tree.group.position.z) < 7;
  if (snow) {
    const items = scatter(rng, 110, () => {
      const side = rng() < 0.55;
      let th, R, y;
      if (side) {
        th = (rng() < 0.5 ? -1 : 1) * (L.spread + 0.3 + rng() * 0.9);
        R = L.frontR + 3 + rng() * (L.backR - L.frontR + 20);
        y = 0; // set from groundAt below
      } else {
        th = (rng() - 0.5) * 2 * (L.spread + 0.55);
        R = L.backR + 2.5 + rng() * 34;
        y = L.topY;
      }
      const x = R * Math.sin(th), z = -R * Math.cos(th);
      if (!side && avoid(x, z)) return null;
      return { x, y: side ? groundAt(x, z) - 0.1 : y, z, s: 1.1 + rng() * 1.6, rot: rng() * 6, tint: 0.85 + rng() * 0.3 };
    });
    root.add(instanced(pineGeometry(true), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), items));

    // Far mountains with snowcaps
    const mMat = std({ color: '#6f84c2' });
    for (let i = 0; i < 11; i++) {
      const th = -1.25 + (2.5 * i) / 10 + (rng() - 0.5) * 0.15;
      const R = 110 + rng() * 50;
      const h = 34 + rng() * 34, rad = 22 + rng() * 16;
      const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 6), mMat);
      m.position.set(R * Math.sin(th), h / 2 - 2, -R * Math.cos(th));
      m.rotation.y = rng() * 3;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.36, h * 0.36, 6), std({ color: '#f1f5ff' }));
      cap.position.set(0, h / 2 - (h * 0.36) / 2 + 0.05, 0);
      m.add(cap);
      root.add(m);
    }

    // Snowman, front left
    const sm = new THREE.Group();
    const white = std({ color: '#ffffff', roughness: 1 });
    [[1.0, 1.0], [0.72, 2.55], [0.5, 3.6]].forEach(([r, y]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), white);
      b.position.y = y;
      sm.add(b);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 6), std({ color: '#ff8a2b' }));
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 3.6, 0.7);
    const hatB = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.55, 10), std({ color: '#2a2140' }));
    hatB.position.y = 4.25;
    const hatR = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12), std({ color: '#2a2140' }));
    hatR.position.y = 4.0;
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.13, 6, 14), std({ color: '#e2483d' }));
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 3.15;
    sm.add(nose, hatB, hatR, scarf);
    sm.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const smTh = -(L.spread + 0.32);
    sm.position.set((L.frontR + 1) * Math.sin(smTh), 0, -(L.frontR + 1) * Math.cos(smTh));
    sm.rotation.y = -smTh;
    root.add(sm);

    // Moon, stars, aurora, sleigh
    const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4d6').multiplyScalar(1.5), toneMapped: false, fog: false }));
    moon.position.set(90, 95, -260);
    root.add(moon);
    const mg = glowSprite('#cfe0ff', 90, 0.45);
    mg.position.copy(moon.position);
    root.add(mg);

    const starPos = new Float32Array(1600 * 3);
    for (let i = 0; i < 1600; i++) {
      const u = rng() * Math.PI * 2, v = 0.08 + rng() * 0.9;
      const r = 380;
      starPos.set([Math.cos(u) * Math.cos(v * 1.4) * r, Math.sin(v * 1.4) * r, Math.sin(u) * Math.cos(v * 1.4) * r], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.8, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false }));
    root.add(stars);
    updaters.push((t) => { stars.material.opacity = 0.75 + Math.sin(t * 1.3) * 0.15; });

    const aur = new THREE.Mesh(new THREE.PlaneGeometry(520, 110, 80, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `uniform float uTime; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x*0.02 + uTime*0.25)*18.0; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform float uTime; varying vec2 vUv;
        void main(){ float band = sin(vUv.x*14.0 + uTime*0.35 + sin(vUv.x*5.0 + uTime*0.2)*2.5)*0.5 + 0.5;
          band = pow(band, 2.0);
          float fade = smoothstep(0.0, 0.25, vUv.y) * pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
          vec3 c = mix(vec3(0.15,1.0,0.6), vec3(0.45,0.5,1.0), vUv.y);
          gl_FragColor = vec4(c * band * fade * 0.55, 1.0); }`,
    }));
    aur.position.set(0, 95, -300);
    root.add(aur);
    updaters.push((t) => { aur.material.uniforms.uTime.value = t; });

    const sleigh = makeSleigh();
    root.add(sleigh);
    updaters.push((t) => {
      const k = (t % 34) / 34;
      sleigh.visible = k < 0.5;
      const u = k / 0.5;
      sleigh.position.set(-170 + u * 340, 62 + Math.sin(u * Math.PI) * 14, -210);
      sleigh.rotation.z = Math.cos(u * Math.PI) * 0.12;
    });

  } else if (!summer) {
    buildScenery(theme, { root, L, rng, updaters, groundAt, avoid, std, glowSprite, instanced, makeSleigh, pineGeometry, dotTexture, tappables: agents });
  } else {
    // Palms along the sides and on the dunes behind
    const palms = scatter(rng, 18, () => {
      const side = rng() < 0.6;
      const th = side ? (rng() < 0.5 ? -1 : 1) * (L.spread + 0.42 + rng() * 0.4) : (rng() - 0.5) * 2 * (L.spread + 0.4);
      const R = side ? L.frontR + 4 + rng() * (L.backR - L.frontR + 4) : L.backR + 3 + rng() * 20;
      const x = R * Math.sin(th), z = -R * Math.cos(th);
      if (!side && avoid(x, z)) return null;
      return { x, z, y: side ? (R > L.frontR + 0.5 ? 0.3 : 0) : L.topY, side };
    });
    palms.forEach((p) => {
      const palm = makePalm(7 + rng() * 5, (rng() < 0.5 ? -1 : 1) * (0.3 + rng() * 0.5), rng, rng() < 0.4);
      palm.position.set(p.x, p.y, p.z);
      palm.rotation.y = rng() * 6;
      root.add(palm);
      updaters.push((t) => { palm.rotation.z = Math.sin(t * 0.8 + palm.userData.sway) * 0.025; });
    });

    // Sun, clouds
    const sunM = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff0b0').multiplyScalar(1.6), toneMapped: false, fog: false }));
    sunM.position.set(-150, 26, -260);
    root.add(sunM);
    const sg1 = glowSprite('#ffb36b', 160, 0.55);
    sg1.position.copy(sunM.position);
    root.add(sg1);
    const cloudMat = std({ color: '#ffffff', roughness: 1, fog: false });
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Group();
      const n = 4 + Math.floor(rng() * 3);
      for (let k = 0; k < n; k++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(4 + rng() * 4, 7, 5), cloudMat);
        b.position.set(k * 5 - n * 2.5, rng() * 2, rng() * 3);
        b.scale.y = 0.7;
        c.add(b);
      }
      const th = -1.3 + rng() * 2.6, R = 160 + rng() * 80;
      c.position.set(R * Math.sin(th), 45 + rng() * 40, -R * Math.cos(th));
      c.userData.speed = 0.6 + rng() * 0.8;
      root.add(c);
      updaters.push((t, dt) => {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 240) c.position.x = -240;
      });
    }

    // Surfing Santa rides the shoreline
    const santa = makeSurfSanta();
    root.add(santa);
    const sr = L.frontR - 13;
    updaters.push((t) => {
      const k = (t % 40) / 40;
      const th = -(L.spread + 0.5) + k * 2 * (L.spread + 0.5);
      santa.position.set(sr * Math.sin(th), -0.25 + Math.sin(t * 2.2) * 0.15, -sr * Math.cos(th));
      santa.rotation.set(Math.sin(t * 2.2) * 0.08, -th + Math.PI / 2 + Math.PI, Math.sin(t * 1.7) * 0.1);
    });

    const ocean = root.children.find((o) => o.material && o.material.uniforms && o.material.uniforms.uShoreR);
    updaters.push((t) => { ocean.material.uniforms.uTime.value = t; });

    // Golden glints in the air
    const N = A.reducedMotion ? 80 : 260;
    const gp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) gp.set([(rng() - 0.5) * 90, rng() * 25, -60 + rng() * 80], i * 3);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const glints = new THREE.Points(gg, new THREE.PointsMaterial({ map: dotTexture, color: new THREE.Color('#ffe08a').multiplyScalar(1.5), size: 0.45, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    root.add(glints);
    updaters.push((t, dt) => {
      const a = gg.attributes.position.array;
      for (let i = 0; i < N; i++) {
        a[i * 3 + 1] += dt * (0.4 + (i % 5) * 0.12);
        if (a[i * 3 + 1] > 25) a[i * 3 + 1] = 0;
      }
      gg.attributes.position.needsUpdate = true;
      glints.material.opacity = 0.7 + Math.sin(t * 2) * 0.25;
    });
  }

  // Snow for every world (heavier in the wintry ones), with blizzards on demand
  const snowfall = makeSnowfall(root, rng, ST.snow);
  updaters.push(snowfall.update);

  // Tree star spin, neon rings, house flags
  const rings = tree.group.userData.rings || [];
  updaters.push((t, dt) => {
    if (tree.group.userData.star) tree.group.userData.star.rotation.y = t * 0.8;
    rings.forEach((r) => { r.rotation.z += r.userData.spin * dt; });
    tree.bulbs.forEach((b, i) => { if (b.userData.on) b.material.emissiveIntensity = 2.6 + Math.sin(t * 3 + i * 1.7) * 0.8; });
    houses.forEach((h) => {
      const eyes = h.group.userData.eyes;
      if (eyes) {
        const blink = (t + h.day * 0.73) % 4.2 < 0.13 ? 0.12 : 1;
        eyes.forEach((e) => { e.scale.y = blink; });
      }
      const f = h.group.userData.flag;
      if (f) f.rotation.y = Math.sin(t * 3 + f.userData.wave) * 0.35;
    });
  });

  // Points the camera must keep in view
  const keyPoints = [];
  houses.forEach((h) => {
    const p = h.group.position;
    keyPoints.push(new THREE.Vector3(p.x, p.y, p.z), new THREE.Vector3(p.x, p.y + h.height + 0.4, p.z));
  });
  keyPoints.push(tree.group.position.clone().add(new THREE.Vector3(0, tree.height + 0.8, 0)));
  // the square / beach in front, where the penguins live
  [-L.spread * 0.6, 0, L.spread * 0.6].forEach((th) => {
    const r = L.frontR - (summer ? 4.5 : 5.5);
    keyPoints.push(new THREE.Vector3(r * Math.sin(th), 0, -r * Math.cos(th)));
  });

  return {
    root,
    agents,
    groundAt,
    letItSnow: snowfall.letItSnow,
    fog,
    houses,
    tree,
    layout: L,
    keyPoints,
    focus: new THREE.Vector3(0, L.topY * 0.55 + 1.2, -(L.R0 + L.backR) / 2 - 0.5),
    update(t, dt) { updaters.forEach((u) => u(t, dt)); },
  };
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach((m) => {
      if (m.userData.shared) return;
      if (m.map && !m.map.userData.shared) m.map.dispose();
      m.dispose();
    });
  });
}
