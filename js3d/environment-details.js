/* Extra discoveries in the village squares. Animations follow the world's update clock. */
import * as THREE from 'three';
import { canvasTexture } from './houses.js';
const A = window.Advent, TAU = Math.PI * 2;
// Fine lavender dust, leaving the large craters to actual rounded geometry.
export const lunarTex = canvasTexture(512, 512, (g, w, h) => {
  const rng = A.rng(517);
  g.fillStyle = '#695783'; g.fillRect(0, 0, w, h);
  // Broad mineral mottling stays visible at village scale; fine grains read on zoom.
  for (let i = 0; i < 95; i++) {
    const x = rng() * w, y = rng() * h, r = 8 + rng() * 28;
    const patch = g.createRadialGradient(x, y, 0, x, y, r);
    patch.addColorStop(0, i % 2 ? '#8e79a54d' : '#47385d40');
    patch.addColorStop(1, '#69578300');
    g.fillStyle = patch; g.fillRect(x-r, y-r, r*2, r*2);
  }
  for (let i = 0; i < 12500; i++) {
    g.fillStyle = i % 2 ? '#b19ac1' : '#493b62';
    g.globalAlpha = 0.16 + rng() * 0.18;
    const size = 0.7 + rng() * 2.2;
    g.fillRect(rng() * w, rng() * h, size, size);
  }
  g.globalAlpha = 1;
});
lunarTex.wrapS = lunarTex.wrapT = THREE.RepeatWrapping; lunarTex.repeat.set(0.13, 0.13); lunarTex.userData.shared = true;

export function buildEnvironmentDetails(theme, c, fx) {
  const { root, L, std, rng } = c;
  const front = -(L.frontR - 4.3);
  const mesh = (parent, geometry, color, x = 0, y = 0, z = 0, extra = {}) => {
    const m = new THREE.Mesh(geometry, std({ color, roughness: 0.65, ...extra }));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const group = (name, x, z) => { const g = new THREE.Group(); g.name = name; g.position.set(x, 0.03, z); root.add(g); return g; };
  const burst = (g, colors, y = 2, n = 20) => { if (!A.reducedMotion) fx.burst(g.localToWorld(new THREE.Vector3(0, y, 0)), colors, n, 3, 0.32, 0.25); };
  if (theme === 'space') {
    // Hexagonal landing tiles, inlaid navigation lights and bootprints.
    for (let r = 0; r < L.rows; r++) {
      const radius = L.R0 + r * L.dR - 1.35;
      for (let i = 0; i < L.cols + 3; i++) {
        const a = -L.spread + i / (L.cols + 2) * L.spread * 2;
        const tile = mesh(root, new THREE.CylinderGeometry(0.72, 0.72, 0.06, 24), i % 3 ? '#9c8ab7' : '#b6a0c5', Math.sin(a) * radius, 0.34 + r * L.dy, -Math.cos(a) * radius, { metalness: 0, roughness: 0.94, flatShading: false });
        mesh(tile, new THREE.BoxGeometry(0.48, 0.025, 0.05), '#8cf5ef', 0, 0.04, 0, { emissive: '#56dada', emissiveIntensity: 0.9 });
      }
    }
    for (let i = 0; i < 18; i++) {
      const a = -0.9 + i * 0.1, radius = L.frontR - 2.7 - Math.sin(i * 0.2) * 1.3;
      const print = mesh(root, new THREE.CircleGeometry(0.12, 8), '#b4a8c6', Math.sin(a) * radius, 0.02, -Math.cos(a) * radius);
      print.rotation.x = -Math.PI / 2; print.scale.y = 1.7; print.castShadow = false;
    }
    [-1, 1].forEach((side) => {
      const crystals = group('Moon crystals', side * 4, front + 0.4);
      for (let i = 0; i < 5; i++) {
        const height = 0.7 + rng() * 1.4;
        mesh(crystals, new THREE.ConeGeometry(0.25, height, 5), i % 2 ? '#a594ee' : '#6fe2e0', (rng() - 0.5) * 1.7, height / 2, (rng() - 0.5) * 1.1, { emissive: i % 2 ? '#7c5bd4' : '#25aab6', emissiveIntensity: 0.45, metalness: 0.25, roughness: 0.18 });
      }
      fx.tappable(crystals, (a) => { if (a.busy) return; a.busy = 1.8; fx.sound()?.sparkle(8); burst(crystals, ['#a594ee', '#6fe2e0']); }, (dt, t, a) => crystals.children.forEach((m, i) => { m.material.emissiveIntensity = a.busy > 0 ? 0.9 + Math.sin(t * 5 + i) * 0.25 : 0.45; }));
    });
    const solar = group('Solar array', 0, front + 0.3);
    mesh(solar, new THREE.CylinderGeometry(0.1, 0.2, 1.6, 8), '#bccada', 0, 0.8);
    const wings = [-1, 1].map((side) => {
      const pivot = new THREE.Group(); pivot.position.set(side * 0.2, 1.65, 0); solar.add(pivot);
      mesh(pivot, new THREE.BoxGeometry(1.7, 0.08, 1.4), '#203952', side * 0.85, 0, 0, { metalness: 0.6, roughness: 0.25, emissive: '#265a83', emissiveIntensity: 0.45 });
      for (let i = 0; i < 5; i++) mesh(pivot, new THREE.BoxGeometry(0.02, 0.02, 1.3), '#6fbed2', side * (0.12 + i * 0.34), 0.05, 0);
      return pivot;
    });
    let deployed = true, angle = 0;
    fx.tappable(solar, () => { deployed = !deployed; fx.sound()?.pop(400, 900, 0.15); burst(solar, ['#6fe2e0', '#ffffff']); }, (dt) => {
      angle = A.reducedMotion ? (deployed ? 0 : 1.2) : THREE.MathUtils.damp(angle, deployed ? 0 : 1.2, 5, dt);
      wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * angle; });
    });
  }
  if (theme === 'jungle') {
    // Keep everything in the foreground below the numbered doors' sightlines.
    [-1, 1].forEach((side) => {
      const lantern = group('Firefly lantern', side * 6.1, front + 3.2);
      mesh(lantern, new THREE.CylinderGeometry(0.55, 0.7, 0.55, 12), '#755032', 0, 0.28);
      mesh(lantern, new THREE.CylinderGeometry(0.32, 0.38, 0.12, 12), '#d3b876', 0, 0.62);
      const glow = mesh(lantern, new THREE.SphereGeometry(0.32, 12, 8), '#f9ee91', 0, 0.95, 0, { emissive: '#e6d25b', emissiveIntensity: 0.5 });
      mesh(lantern, new THREE.ConeGeometry(0.6, 0.35, 8), '#54875b', 0, 1.36);
      fx.tappable(lantern, (a) => { if (a.busy) return; a.busy = 2.5; fx.sound()?.sparkle(7); burst(lantern, ['#fff49a', '#c9f788', '#fff6cc'], 1.2, 28); }, (dt, t, a) => { glow.material.emissiveIntensity = a.busy > 0 ? 1.3 : 0.5; });
    });
    const drum = group('Jungle drum', -3, front + 3.2);
    mesh(drum, new THREE.CylinderGeometry(0.72, 0.5, 1, 16), '#9c653b', 0, 0.55);
    const drumSkin = mesh(drum, new THREE.CylinderGeometry(0.76, 0.76, 0.08, 20), '#eed5a0', 0, 1.09);
    for (let i = 0; i < 10; i++) {
      const a = i * TAU / 10;
      mesh(drum, new THREE.CylinderGeometry(0.025, 0.025, 0.85, 5), '#e8bd75', Math.sin(a) * 0.6, 0.57, Math.cos(a) * 0.6);
    }
    fx.tappable(drum, (a) => { if (a.busy) return; a.busy = 0.6; fx.sound()?.thunk(); burst(drum, ['#edce7f', '#8bd295'], 1.2, 10); }, (dt, t, a) => { drumSkin.position.y = 1.09 - (a.busy > 0 && !A.reducedMotion ? Math.sin((0.6 - a.busy) * 24) * 0.04 * a.busy : 0); drumSkin.material.emissive.set('#edce7f'); drumSkin.material.emissiveIntensity = a.busy > 0 ? 0.2 : 0; });
    const flower = group('Butterfly flower', 3, front + 3.2);
    mesh(flower, new THREE.CylinderGeometry(0.06, 0.1, 0.8, 8), '#46734a', 0, 0.4);
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5;
      mesh(flower, new THREE.SphereGeometry(0.34, 12, 8), '#ee9c76', Math.sin(a) * 0.32, 0.85, Math.cos(a) * 0.32).scale.y = 0.35;
    }
    const center = mesh(flower, new THREE.SphereGeometry(0.2, 12, 8), '#f7d76b', 0, 0.94);
    const butterflies = Array.from({ length: 5 }, (_, i) => {
      const butterfly = new THREE.Group(); flower.add(butterfly);
      const wings = [-1, 1].map((side) => {
        const wing = mesh(butterfly, new THREE.SphereGeometry(0.2, 10, 6), ['#ffd775', '#8cd8df', '#e4a0d4'][i % 3], side * 0.16, 0, 0);
        wing.scale.set(1, 0.12, 0.65); return wing;
      });
      butterfly.visible = false; return { butterfly, wings };
    });
    fx.tappable(flower, (a) => { if (a.busy) return; a.busy = 4; fx.sound()?.sparkle(5); }, (dt, t, a) => {
      center.material.emissive.set('#ffcf75'); center.material.emissiveIntensity = a.busy > 0 ? 0.5 : 0;
      butterflies.forEach(({ butterfly, wings }, i) => {
        butterfly.visible = a.busy > 0;
        const phase = i * TAU / 5 + (A.reducedMotion ? 0 : (4 - a.busy) * 1.7);
        const radius = A.reducedMotion ? 0.7 : Math.min(1.5, (4 - a.busy) * 1.3);
        butterfly.position.set(Math.sin(phase) * radius, 1.2 + i * 0.18, Math.cos(phase) * radius);
        wings.forEach((wing, side) => { wing.rotation.z = A.reducedMotion ? 0 : Math.sin(t * 18 + i) * (side ? 1 : -1) * 0.7; });
      });
    });
    const pond = group('Frog pond', 0, front);
    mesh(pond, new THREE.CylinderGeometry(2.5, 2.8, 0.15, 40), '#7d7959', 0, 0.02).scale.z = 0.65;
    const water = mesh(pond, new THREE.CircleGeometry(2.35, 40), '#3b9b96', 0, 0.11, 0, { metalness: 0.25, roughness: 0.18 }); water.rotation.x = -Math.PI / 2; water.scale.y = 0.65;
    const lily = mesh(pond, new THREE.CircleGeometry(0.6, 24, 0.1, TAU - 0.4), '#78ac5f', 0.65, 0.13, 0.25); lily.rotation.x = -Math.PI / 2;
    const frog = new THREE.Group(); frog.position.set(0.65, 0.3, 0.25); pond.add(frog);
    mesh(frog, new THREE.SphereGeometry(0.38, 14, 10), '#8ab957', 0, 0.1).scale.set(1, 0.65, 1);
    [-1, 1].forEach((side) => { mesh(frog, new THREE.SphereGeometry(0.14, 10, 8), '#b3d977', side * 0.2, 0.32, 0.16); mesh(frog, new THREE.SphereGeometry(0.065, 8, 6), '#21372c', side * 0.2, 0.34, 0.28); });
    const ripple = mesh(pond, new THREE.RingGeometry(0.4, 0.44, 40), '#c4fff2', 0.65, 0.15, 0.25, { transparent: true, opacity: 0, side: THREE.DoubleSide }); ripple.rotation.x = -Math.PI / 2;
    fx.tappable(pond, (a) => { if (a.busy) return; a.busy = 2; fx.sound()?.pop(220, 100, 0.2); burst(pond, ['#a3ece0', '#fff3b6'], 0.3, 10); }, (dt, t, a) => {
      const k = 2 - a.busy; frog.position.y = 0.3 + (a.busy > 0 && !A.reducedMotion ? Math.sin(Math.min(1, k / 0.8) * Math.PI) * 1.4 : 0);
      ripple.material.opacity = a.busy > 0 ? a.busy * 0.25 : 0; ripple.scale.setScalar(A.reducedMotion ? 2 : 1 + k * 2);
    });
  }
  if (theme === 'japan') {
    const tea = group('Sakura tea set', -3.3, front + 3.4);
    mesh(tea, new THREE.CylinderGeometry(1.3, 1.3, 0.2, 32), '#ad725c', 0, 0.3);
    const pot = mesh(tea, new THREE.SphereGeometry(0.55, 20, 14), '#b2d8cb', 0, 0.8); pot.scale.y = 0.75;
    mesh(tea, new THREE.CylinderGeometry(0.24, 0.3, 0.1, 20), '#f9dfeb', 0, 1.19);
    const spout = mesh(tea, new THREE.ConeGeometry(0.2, 0.7, 12), '#b2d8cb', 0.58, 0.9); spout.rotation.z = -1.1;
    mesh(tea, new THREE.TorusGeometry(0.4, 0.07, 8, 24), '#b2d8cb', -0.45, 0.88).rotation.y = Math.PI / 2;
    [-0.85, 0.85].forEach((x) => mesh(tea, new THREE.CylinderGeometry(0.2, 0.15, 0.25, 16), '#ffe6ef', x, 0.55, 0.4));
    fx.tappable(tea, (a) => { if (a.busy) return; a.busy = 2.5; fx.sound()?.sparkle(5); burst(tea, ['#fff8ec', '#ffd3e6'], 1.3, 22); }, (dt, t, a) => { pot.material.emissive.set('#b5dccf'); pot.material.emissiveIntensity = a.busy > 0 ? 0.25 : 0; pot.rotation.z = a.busy > 0 && !A.reducedMotion ? Math.sin((2.5 - a.busy) * Math.PI / 2.5) * -0.15 : 0; });
    const bell = group('Sakura wish bell', 1.4, front + 3.4);
    [-1, 1].forEach((side) => mesh(bell, new THREE.CylinderGeometry(0.07, 0.1, 2.9, 8), '#ad725c', side * 0.9, 1.45));
    mesh(bell, new THREE.BoxGeometry(2.3, 0.14, 0.2), '#ad725c', 0, 2.9);
    const chime = new THREE.Group(); chime.position.y = 2.65; bell.add(chime);
    const bellCap = mesh(chime, new THREE.SphereGeometry(0.42, 18, 12, 0, TAU, 0, Math.PI / 2), '#f6bdd4', 0, -0.35, 0, { side: THREE.DoubleSide });
    mesh(chime, new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6), '#b18c65', 0, -0.7);
    mesh(chime, new THREE.BoxGeometry(0.27, 0.7, 0.025), '#fff4df', 0, -1.35);
    fx.tappable(bell, (a) => { if (a.busy) return; a.busy = 3; fx.sound()?.bell(); burst(bell, ['#ffb7d5', '#fff4df', '#ffd36b'], 2.3); }, (dt, t, a) => { bellCap.material.emissive.set('#ffd4e6'); bellCap.material.emissiveIntensity = a.busy > 0 ? 0.3 : 0; chime.rotation.z = a.busy > 0 && !A.reducedMotion ? Math.sin((3 - a.busy) * 9) * a.busy * 0.12 : 0; });
  }
  if (theme === 'cyber') {
    const portal = group('Cargo teleporter', -4, front + 5.2);
    mesh(portal, new THREE.CylinderGeometry(1.3, 1.6, 0.25, 24), '#25263f', 0, 0.15);
    const rim = mesh(portal, new THREE.TorusGeometry(1.25, 0.07, 8, 40), '#5cfff2', 0, 0.3, 0, { emissive: '#3cf5ed', emissiveIntensity: 1.1 }); rim.rotation.x = Math.PI / 2;
    // Holograms must never enter the PBR wireframe shadow pass: that produced
    // a large black rectangle when the hidden cargo first became visible.
    const cargo = new THREE.Group(); cargo.position.y = 1.2; portal.add(cargo);
    const cargoShape = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(cargoShape), new THREE.LineBasicMaterial({ color: '#8fe9eb', transparent: true, opacity: 0.9, toneMapped: false }));
    const fill = new THREE.Mesh(cargoShape, new THREE.MeshBasicMaterial({ color: '#32dede', transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false }));
    cargo.add(outline, fill); cargo.visible = false;

    fx.tappable(portal, (a) => { if (a.busy) return; a.busy = 3.5; fx.sound()?.whoosh(0.4, 200, 1800, 0.14); burst(portal, ['#5cfff2', '#c88bff'], 0.8); }, (dt, t, a) => { cargo.visible = a.busy > 0; cargo.position.y = A.reducedMotion ? 1.4 : 1.2 + Math.sin((3.5 - a.busy) / 3.5 * Math.PI) * 1.7; if (!A.reducedMotion && a.busy > 0) cargo.rotation.y += dt * 2; rim.material.emissiveIntensity = a.busy > 0 ? 2 : 1.1; });
    const console = group('City signal console', 4, front + 5.2);
    mesh(console, new THREE.CylinderGeometry(0.6, 0.9, 1.2, 6), '#24253a', 0, 0.6);
    const screen = mesh(console, new THREE.BoxGeometry(1.3, 0.85, 0.1), '#5affc0', 0, 1.5, 0, { emissive: '#36d2a8', emissiveIntensity: 0.8 }); screen.rotation.x = -0.25;
    let mode = 0;
    fx.tappable(console, (a) => { if (a.busy) return; a.busy = 1.2; mode = (mode + 1) % 3; c.traffic?.reroute(mode); const color = ['#5affc0', '#ff8ad8', '#ffcc69'][mode]; screen.material.color.set(color); screen.material.emissive.set(color); fx.sound()?.pop(500, 1400, 0.15); burst(console, [color, '#ffffff'], 1.7); });
  }
}
