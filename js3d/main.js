/* 3D village: renderer, camera framing, tap-to-open, door sequence, HUD, keyboard/TV. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld, disposeTree, makeStar } from './worlds.js';

const A = window.Advent;
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const KEY3D = 'littledoors:3d:v1';
const coarse = matchMedia('(pointer: coarse)').matches;

// ---------------- Calendar data (same rules as the 2D view) ----------------
const cid = params.get('c');
const preview = params.has('preview');
let cal = null;
const photoURLs = {};
if (cid) {
  cal = await A.DB.getCalendar(cid);
  if (!cal) {
    location.replace('index.html' + location.search); // the 2D view explains "not found"
    throw new Error('calendar not found');
  }
  await Promise.all(cal.days.map(async (day, i) => {
    if (day.photoId) photoURLs[i + 1] = await A.DB.getPhotoURL(day.photoId);
  }));
}

function partsIn(tz) {
  try {
    const s = new Intl.DateTimeFormat('en-CA', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const [y, m, d] = s.split('-').map(Number);
    return { y, m, d };
  } catch (e) {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
  }
}

const saved = A.store.get(KEY3D, {});
const theme = cal ? cal.theme : params.get('theme') === 'summer' ? 'summer' : params.get('theme') === 'snow' ? 'snow' : saved.theme || 'snow';
const state = {
  to: cal ? cal.to : params.get('to') || 'Emma',
  from: cal ? cal.from : params.get('from') || 'Grandma',
  sound: A.store.get('littledoors:v1', {}).sound !== false,
  unlockAll: preview || params.has('unlock'),
  today: 9,
  focus: 1,
};
const openKey = cal ? `littledoors:open:${cal.id}` : null;
let opened = new Set(cal ? (preview ? [] : A.store.get(openKey, [])) : (saved.opened && saved.opened[theme]) || []);

let sleepsUntil;
if (cal) {
  const t = partsIn(cal.tz);
  const todayUTC = Date.UTC(t.y, t.m - 1, t.d);
  sleepsUntil = (day) => Math.round((Date.UTC(cal.year, 11, day) - todayUTC) / 86400000);
  state.today = sleepsUntil(1) > 0 ? 0 : A.clamp(24 - Math.max(0, sleepsUntil(24)), 0, 24);
} else {
  const n = new Date();
  const real = n.getMonth() === 11 && n.getDate() <= 24 ? n.getDate() : null;
  state.today = A.clamp(+(params.get('day') || real || 9), 1, 24);
  sleepsUntil = (day) => day - state.today;
}
const items = cal ? cal.days : A.CONTENT[theme];
const isUnlocked = (d) => state.unlockAll || d <= state.today;
const fill = (s) => s.replace(/\{to\}/g, state.to).replace(/\{from\}/g, state.from);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function save() {
  if (cal) {
    if (!preview) A.store.set(openKey, [...opened]);
    return;
  }
  const all = A.store.get(KEY3D, {});
  all.theme = theme;
  all.opened = { ...(all.opened || {}), [theme]: [...opened] };
  A.store.set(KEY3D, all);
}

// ---------------- Page chrome ----------------
document.documentElement.dataset.theme = theme;
document.querySelector('meta[name=theme-color]').content = theme === 'snow' ? '#0b1638' : '#ff9a8b';
A.Sound.theme = theme;
A.Sound.enabled = state.sound;
A.FX.noAmbient = true;
A.FX.init($('ambient'), $('fx'));
A.FX.setTheme(theme);
const T = A.THEMES[theme];
$('splashEmblem').textContent = T.emblem;
$('splashEyebrow').textContent = `${state.to}, ${state.from} made you something`;
$('splashTitle').innerHTML = T.splashTitle;
$('btn2d').href = 'index.html' + location.search;
if (cal) {
  $('btnTheme').hidden = true;
  if (cal.plan === 'season') $('credit').hidden = true;
  document.title = fill(T.title) + ' — 3D';
} else {
  $('btnTheme').textContent = theme === 'snow' ? '☀️' : '❄️';
}
if (preview) {
  document.body.appendChild(A.el('div', 'preview-bar', `<span>👀 Preview — this is what <b>${A.esc(state.to)}</b> will see</span><a href="editor.html?c=${encodeURIComponent(cal.id)}&step=share">✏️ Back to editing</a>`));
  document.body.classList.add('previewing');
}

let toastT;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

function refreshHUD() {
  $('title').textContent = fill(T.title);
  $('eyebrow').textContent = fill(T.eyebrow);
  const toX = sleepsUntil(25);
  let when;
  if (state.today === 0) when = `Doors open 1 December — ${plural(sleepsUntil(1), 'sleep')} to go`;
  else if (toX <= 0) when = 'Merry Christmas! 🎄';
  else if (toX === 1) when = 'Christmas Eve! 🎅';
  else when = `${toX} sleeps to Christmas`;
  $('sub').innerHTML = `<span>${opened.size}/24 lights on</span><span class="dot">•</span><span>${when}</span>`;
  $('btnSound').textContent = state.sound ? '🔊' : '🔇';
}

// ---------------- Renderer ----------------
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = theme === 'snow' ? 1.05 : 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 1000);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), theme === 'snow' ? 0.7 : 0.45, 0.55, theme === 'snow' ? 0.97 : 0.97);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const doorLight = new THREE.PointLight('#ffb35c', 0, 6, 1.6);
scene.add(doorLight);

// ---------------- World (rebuilt when the screen shape changes) ----------------
let world = null;
let cols = 0;
let todayStar = null, todayRing = null, focusRing = null;

const colsFor = (aspect) => (aspect >= 1.15 ? 8 : aspect >= 0.8 ? 6 : 4);

function buildAll(nextCols) {
  if (world) {
    scene.remove(world.root);
    disposeTree(world.root);
  }
  cols = nextCols;
  world = buildWorld(theme, cols, items);
  scene.add(world.root);
  scene.fog = world.fog;
  // Restore opened state instantly
  world.houses.forEach((h) => {
    if (opened.has(h.day)) setOpenInstant(h);
  });
  opened.forEach((d) => world.tree.setLit(d - 1, true));
  // Today marker
  todayStar = makeStar('#ffd84d', 0.45);
  todayRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.85, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd84d').multiplyScalar(1.6), transparent: true, opacity: 0.8, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
  todayRing.rotation.x = -Math.PI / 2;
  focusRing = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.75, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  focusRing.rotation.x = -Math.PI / 2;
  focusRing.visible = false;
  world.root.add(todayStar, todayRing, focusRing);
  placeMarkers();
}

function placeMarkers() {
  const h = world.houses[state.today - 1];
  const show = h && !opened.has(state.today);
  todayStar.visible = todayRing.visible = !!show;
  if (show) {
    todayStar.position.copy(h.group.position).add(new THREE.Vector3(0, h.height + 1.1, 0));
    todayRing.position.copy(h.group.position).add(new THREE.Vector3(0, 0.06, 0.4));
  }
}

function setOpenInstant(h) {
  h.pivot.rotation.y = -1.95;
  h.interiorMat.emissiveIntensity = 1.5;
  h.icon.scale.setScalar(0.8);
}

// ---------------- Camera: free orbit, pan and zoom ----------------
const camDir = new THREE.Vector3(0, 0.46, 1).normalize();
const UP = new THREE.Vector3(0, 1, 0);
const home = { pos: new THREE.Vector3(), target: new THREE.Vector3(), dist: 40 };
let W = 1, H = 1;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = false; // pan across the ground, not up into the sky
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 1.0;
controls.panSpeed = 0.9;
controls.zoomToCursor = true;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = 1.36;
controls.minAzimuthAngle = -1.15;
controls.maxAzimuthAngle = 1.15;
controls.minDistance = 2.5;
controls.enabled = false;

// Keep the look-at point over the village so nobody gets lost.
controls.addEventListener('change', () => {
  if (!world || cam.mode !== 'free') return;
  const L = world.layout, t = controls.target;
  const bx = L.backR * Math.sin(L.spread) + 8;
  const c = new THREE.Vector3(A.clamp(t.x, -bx, bx), A.clamp(t.y, -1, L.topY + 10), A.clamp(t.z, -(L.backR + 14), -(L.frontR - 14)));
  if (!c.equals(t)) {
    const d = c.clone().sub(t);
    t.add(d);
    camera.position.add(d);
  }
});

// Find the distance (and a vertical nudge) that fits the whole village between the title and toolbar.
function fitCamera() {
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  const topLim = 1 - (2 * ($('top').getBoundingClientRect().bottom + 8)) / H;
  const botLim = -1 + (2 * 74) / H;
  const v = new THREE.Vector3();
  let best = 200, bestOff = 0;
  for (let d = 200; d >= 12; d -= 0.5) {
    camera.position.copy(world.focus).addScaledVector(camDir, d);
    camera.lookAt(world.focus);
    camera.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, bad = false;
    for (const p of world.keyPoints) {
      v.copy(p).project(camera);
      if (v.z > 1) { bad = true; break; }
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    if (bad || x0 < -0.95 || x1 > 0.95 || y1 - y0 > topLim - botLim) break;
    best = d;
    bestOff = (topLim + botLim) / 2 - (y0 + y1) / 2;
  }
  camera.position.copy(world.focus).addScaledVector(camDir, best);
  camera.lookAt(world.focus);
  camera.updateMatrixWorld();
  const camUp = UP.clone().applyQuaternion(camera.quaternion);
  const halfH = best * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  home.dist = best;
  home.target.copy(world.focus).addScaledVector(camUp, -bestOff * halfH);
  home.pos.copy(home.target).addScaledVector(camDir, best);
  controls.maxDistance = best * 1.45;
}

const cam = { mode: 'intro', saved: null, spin: 0 };
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();

function housePose(h, outPos, outLook) {
  const door = h.group.localToWorld(h.doorLocal.clone());
  const ry = h.group.rotation.y;
  const front = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
  const portrait = W / H < 0.8;
  // Stay in the gap before the next row down, and look down at the door.
  outPos.copy(door).addScaledVector(front, portrait ? 2.2 : 3.3).add(new THREE.Vector3(0, portrait ? 3.6 : 2.5, 0));
  outLook.copy(door).add(new THREE.Vector3(0, 0.05, 0));
}

const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeBack = (k) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

function flyCam(toPos, toTarget, dur) {
  controls.enabled = false;
  cam.mode = 'fly';
  const fp = camera.position.clone(), ft = controls.target.clone();
  return tween(dur, (e) => {
    camera.position.lerpVectors(fp, toPos, e);
    controls.target.lerpVectors(ft, toTarget, e);
    camera.lookAt(controls.target);
  });
}
function enableFree() {
  cam.mode = 'free';
  controls.enabled = true;
  controls.update();
}
async function flyTo(h, dur) {
  if (cam.mode === 'free') cam.saved = { pos: camera.position.clone(), target: controls.target.clone() };
  document.body.classList.add('closeup');
  housePose(h, tmpA, tmpB);
  await flyCam(tmpA.clone(), tmpB.clone(), dur);
  cam.mode = 'house';
}
async function flyBack(dur = 950) {
  document.body.classList.remove('closeup');
  const s = cam.saved || home; // back to wherever you were looking from
  cam.saved = null;
  await flyCam(s.pos.clone(), s.target.clone(), dur);
  enableFree();
}
function goHome() {
  if (cam.mode !== 'free') return;
  A.Sound.init();
  A.Sound.whoosh(0.7, 300, 1800, 0.12);
  flyCam(home.pos.clone(), home.target.clone(), 900).then(enableFree);
}

// ---------------- Tweens ----------------
const tweens = [];
function tween(dur, fn, ease = easeIO) {
  const d = A.reducedMotion ? Math.min(dur, 120) : dur;
  return new Promise((res) => tweens.push({ t0: performance.now(), dur: d, fn, ease, res }));
}
function runTweens() {
  const now = performance.now();
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const k = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(tw.ease(k), k);
    if (k >= 1) { tweens.splice(i, 1); tw.res(); }
  }
}

// ---------------- Screen helpers ----------------
function screenOf(h) {
  const p = h.group.localToWorld(h.doorLocal.clone()).project(camera);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, size: 70 };
}

// ---------------- Opening a door ----------------
let busy = false;

async function openDay(d) {
  if (busy || A.Cards.isOpen() || !world || cam.mode !== 'free') return;
  const h = world.houses[d - 1];
  A.Sound.init();
  if (!isUnlocked(d)) {
    A.Sound.thunk();
    const n = sleepsUntil(d);
    toast(`Not yet! Door ${d} opens in ${plural(n, 'sleep')} 💤`);
    tween(450, (e, k) => { h.group.rotation.z = Math.sin(k * Math.PI * 6) * 0.06 * (1 - k); }, (k) => k);
    return;
  }
  busy = true;
  if (opened.has(d)) {
    A.Sound.whoosh(0.5, 400, 1600, 0.12);
    await flyTo(h, 750);
    busy = false;
    showCard(d);
    return;
  }

  A.Sound.creak();
  const fly = flyTo(h, 1050);
  h.group.userData.anim = true;
  tween(300, (e, k) => { const s = Math.sin(k * Math.PI); h.group.scale.set(1 + s * 0.06, 1 - s * 0.07, 1 + s * 0.06); }, (k) => k)
    .then(() => { h.group.scale.setScalar(1); h.group.userData.anim = false; });
  await A.wait(A.reducedMotion ? 0 : 380);

  const door = h.group.localToWorld(h.doorLocal.clone());
  const ry = h.group.rotation.y;
  doorLight.position.copy(door).add(new THREE.Vector3(Math.sin(ry) * 1.4, 0.6, Math.cos(ry) * 1.4));
  tween(1200, (e) => { h.pivot.rotation.y = -1.95 * e; }, easeBack);
  tween(700, (e) => { h.interiorMat.emissiveIntensity = 1.5 * e; doorLight.intensity = 4.5 * e; });
  await A.wait(A.reducedMotion ? 0 : 520);
  tween(550, (e) => h.icon.scale.setScalar(0.8 * e), easeBack);

  const sp = screenOf(h);
  A.FX.burst(sp.x, sp.y, { count: 120, power: 1.05 });
  A.Sound.chime();
  opened.add(d);
  save();
  world.tree.setLit(d - 1, true);
  const bulb = world.tree.bulbs[d - 1];
  if (bulb) tween(700, (e, k) => bulb.scale.setScalar(1 + Math.sin(k * Math.PI) * 1.3), (k) => k);
  placeMarkers();
  refreshHUD();

  await fly;
  await A.wait(A.reducedMotion ? 0 : 380);
  busy = false;
  showCard(d);
}

function showCard(d) {
  const h = world.houses[d - 1];
  const item = items[d - 1];
  A.Cards.show({
    day: d,
    item,
    theme,
    to: state.to,
    from: state.from,
    photo: item.type === 'photo' ? photoURLs[d] || null : null,
    origin: screenOf(h),
    onClosed() {
      flyBack();
      tween(900, (e) => { doorLight.intensity = 4.5 * (1 - e); });
    },
  });
}

// ---------------- Input ----------------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null;

// What's under the pointer: a house, or one of the characters (whichever is nearer).
function pick(clientX, clientY) {
  if (!world) return {};
  ndc.set((clientX / W) * 2 - 1, -(clientY / H) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hh = raycaster.intersectObjects(world.houses.map((h) => h.group), true)[0];
  const ha = raycaster.intersectObjects(world.agents.map((a) => a.m.root), true)[0];
  if (ha && (!hh || ha.distance < hh.distance)) {
    let o = ha.object;
    while (o && !o.userData.agent) o = o.parent;
    if (o) return { agent: o.userData.agent };
  }
  if (hh) {
    let o = hh.object;
    while (o && o.userData.day == null) o = o.parent;
    if (o) return { house: world.houses[o.userData.day - 1] };
  }
  return {};
}

let down = null;
let pointers = 0;
canvas.addEventListener('pointerdown', (e) => {
  pointers++;
  down = pointers > 1 ? null : { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, id: e.pointerId };
});
window.addEventListener('pointermove', (e) => {
  if (down && e.pointerId === down.id && (Math.abs(e.clientX - down.x) > 6 || Math.abs(e.clientY - down.y) > 6)) down.moved = true;
  if (e.pointerType === 'mouse' && !pointers && cam.mode === 'free') {
    const p = pick(e.clientX, e.clientY);
    hovered = p.house || null;
    canvas.style.cursor = p.house || p.agent ? 'pointer' : 'grab';
  }
});
const endPointer = (e) => {
  pointers = Math.max(0, pointers - 1);
  if (!down || e.pointerId !== down.id) return;
  const tap = !down.moved && performance.now() - down.t < 600;
  down = null;
  if (!tap || cam.mode !== 'free' || !$('splash').classList.contains('gone')) return;
  const p = pick(e.clientX, e.clientY);
  if (p.agent) { p.agent.poke(); return; }
  if (p.house) {
    state.focus = p.house.day;
    focusRing.visible = false;
    openDay(p.house.day);
  }
};
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', (e) => { pointers = Math.max(0, pointers - 1); if (down && e.pointerId === down.id) down = null; });

document.addEventListener('keydown', (e) => {
  if (!$('splash').classList.contains('gone')) {
    if ((e.key === 'Enter' || e.key === ' ') && !$('splashGo').disabled) { e.preventDefault(); $('splashGo').click(); }
    return;
  }
  if (A.Cards.key(e)) return;
  if (busy) return;
  const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
  if (moves[e.key]) {
    e.preventDefault();
    state.focus = A.clamp(state.focus + moves[e.key], 1, 24);
    const h = world.houses[state.focus - 1];
    focusRing.visible = true;
    focusRing.position.copy(h.group.position).add(new THREE.Vector3(0, 0.08, 0.4));
    A.Sound.init();
    A.Sound.pop(700, 900, 0.06);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    openDay(state.focus);
  } else if (e.key === 'h' || e.key === 'Home') {
    goHome();
  }
});

// ---------------- Toolbar ----------------
$('btnSound').addEventListener('click', () => {
  state.sound = !state.sound;
  A.Sound.enabled = state.sound;
  A.Sound.init();
  const s = A.store.get('littledoors:v1', {});
  s.sound = state.sound;
  A.store.set('littledoors:v1', s);
  refreshHUD();
});
$('btnTheme').addEventListener('click', () => {
  const url = new URL(location.href);
  url.searchParams.set('theme', theme === 'snow' ? 'summer' : 'snow');
  url.searchParams.set('skip', '');
  location.href = url.toString();
});
$('btnFamily').addEventListener('click', () => {
  const on = !document.documentElement.classList.contains('family');
  document.documentElement.classList.toggle('family', on);
  try {
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch (e) {}
  if (on) {
    toast('Family mode — arrow keys or a remote, Enter to open');
    const first = world.houses.find((h) => isUnlocked(h.day) && !opened.has(h.day));
    if (first) {
      state.focus = first.day;
      focusRing.visible = true;
      focusRing.position.copy(first.group.position).add(new THREE.Vector3(0, 0.08, 0.4));
    }
  }
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) document.documentElement.classList.remove('family');
});
$('credit').addEventListener('click', () => { location.href = 'editor.html?new'; });
$('btnHome').addEventListener('click', goHome);

// ---------------- Resize ----------------
function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  renderer.setSize(W, H, false);
  composer.setSize(W, H);
  bloom.resolution.set(W / 2, H / 2);
  const nc = colsFor(W / H);
  const rebuilt = nc !== cols;
  if (rebuilt) buildAll(nc);
  const keep = cam.mode === 'free' && !rebuilt ? { pos: camera.position.clone(), target: controls.target.clone() } : null;
  fitCamera();
  if (keep) {
    camera.position.copy(keep.pos);
    controls.target.copy(keep.target);
  } else if (cam.mode === 'free') {
    camera.position.copy(home.pos);
    controls.target.copy(home.target);
  }
  camera.lookAt(controls.target);
}
window.addEventListener('resize', resize);

// ---------------- Loop ----------------
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  runTweens();
  world.update(t, dt);
  if (todayStar.visible) {
    const h = world.houses[state.today - 1];
    todayStar.position.y = h.group.position.y + h.height + 1.1 + Math.sin(t * 2.4) * 0.25;
    todayStar.rotation.y = t * 1.6;
    todayRing.material.opacity = 0.5 + Math.sin(t * 3) * 0.3;
    const s = 1 + Math.sin(t * 3) * 0.06;
    todayRing.scale.set(s, s, s);
  }
  world.houses.forEach((h) => {
    if (h.group.userData.anim) return; // a tween owns the scale right now
    const target = h === hovered && cam.mode === 'free' ? 1.06 : 1;
    const s = A.lerp(h.group.scale.x, target, 0.15);
    if (Math.abs(s - h.group.scale.x) > 0.0005) h.group.scale.setScalar(s);
  });
  if (cam.mode === 'intro') {
    // slow drift behind the splash screen
    cam.spin += dt * 0.05;
    const off = camera.position.clone().sub(controls.target).applyAxisAngle(UP, dt * 0.05 * Math.cos(cam.spin));
    camera.position.copy(controls.target).add(off);
    camera.lookAt(controls.target);
  } else if (cam.mode === 'free') {
    controls.update();
    // Fade the title away once you've zoomed in to explore
    document.body.classList.toggle('zoomed', camera.position.distanceTo(controls.target) < home.dist * 0.6);
  }
  composer.render(dt);
  requestAnimationFrame(frame);
}

// ---------------- Boot ----------------
refreshHUD();
await (document.fonts ? Promise.race([document.fonts.ready, A.wait(2500)]) : Promise.resolve());
try { await document.fonts.load('900 100px Fraunces'); } catch (e) { /* fallback font is fine */ }
resize();
if (params.has('skip')) {
  camera.position.copy(home.pos);
  controls.target.copy(home.target);
  camera.lookAt(home.target);
  enableFree();
  $('splash').classList.add('gone');
  document.body.classList.add('entered');
} else {
  const far = home.target.clone().addScaledVector(camDir.clone().applyAxisAngle(UP, -0.55), home.dist * 2.4);
  far.y += 26;
  camera.position.copy(far);
  controls.target.copy(home.target);
  camera.lookAt(home.target);
}
$('loading3d').classList.add('done');
$('splashGo').disabled = false;
requestAnimationFrame(frame);

function intro() {
  A.Sound.enabled = state.sound;
  A.Sound.init();
  A.Sound.whoosh(1.2, 200, 3000, 0.22);
  setTimeout(() => A.Sound.chime(), 900);
  $('splash').classList.add('gone');
  document.body.classList.add('entered');
  if (!A.reducedMotion) {
    world.houses.forEach((h, i) => {
      h.group.userData.anim = true;
      h.group.scale.setScalar(0.001);
      setTimeout(() => tween(650, (e) => h.group.scale.setScalar(Math.max(0.001, e)), easeBack)
        .then(() => { h.group.userData.anim = false; }), 500 + i * 45);
    });
  }
  flyCam(home.pos.clone(), home.target.clone(), 2600).then(enableFree);
  setTimeout(() => $('hint3d').classList.add('show'), 2800);
  setTimeout(() => $('hint3d').classList.remove('show'), 9000);
}
$('splashGo').addEventListener('click', intro);

// Debug handle for testing in the browser console (no effect on the page).
window.__littleDoors3d = { get world() { return world; }, camera, controls, renderer };
