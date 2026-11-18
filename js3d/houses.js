/* Low-poly 3D houses (snow cottages / summer beach boxes) with a hinged, numbered door. */
import * as THREE from 'three';

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

function doorTexture(theme, day, pal) {
  return canvasTexture(256, 400, (g, w, h) => {
    g.fillStyle = pal.door;
    g.fillRect(0, 0, w, h);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (theme === 'snow') {
      g.strokeStyle = 'rgba(255,255,255,.28)';
      g.lineWidth = 8;
      roundRect(g, 34, 34, w - 68, h - 68, 26);
      g.stroke();
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.font = DISPLAY.replace('{s}', 150);
      g.fillText(day, w / 2 + 4, h / 2 + 14);
      g.fillStyle = pal.ink;
      g.fillText(day, w / 2, h / 2 + 8);
    } else {
      // painted planks + number disc
      g.fillStyle = 'rgba(0,0,0,.08)';
      for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 4, h);
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(w / 2, h * 0.42, 84, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = pal.door;
      g.font = DISPLAY.replace('{s}', 112);
      g.fillText(day, w / 2, h * 0.42 + 8);
    }
    const kg = g.createRadialGradient(w - 44, h * 0.6, 2, w - 44, h * 0.6, 16);
    kg.addColorStop(0, '#fff6c9');
    kg.addColorStop(1, '#a67412');
    g.fillStyle = kg;
    g.beginPath();
    g.arc(w - 44, h * 0.6, 14, 0, Math.PI * 2);
    g.fill();
  });
}

function stripeTexture(pal) {
  const t = canvasTexture(128, 128, (g, w, h) => {
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? pal.wall2 : pal.wall;
      g.fillRect((i * w) / 4, 0, w / 4, h);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function plankTexture(pal) {
  return canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = pal.wall;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.07)';
    for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 2);
  });
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

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, flatShading: true, ...o });

/* Returns { group, pivot, interiorMat, icon, day, doorLocal, front } */
export function makeHouse(theme, day, pal, iconEmoji, rng) {
  const snow = theme === 'snow';
  const W = snow ? 2.2 : 1.9;
  const H = snow ? 1.85 : 2.25;
  const D = snow ? 1.9 : 1.7;
  const RH = snow ? 1.05 + rng() * 0.35 : 0.85;
  const group = new THREE.Group();
  group.userData.day = day;

  // Body
  const wallMap = snow ? plankTexture(pal) : stripeTexture(pal);
  if (!snow) wallMap.repeat.set(1, 1);
  const wallMat = std({ map: wallMap });
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat);
  body.position.y = H / 2;
  group.add(body);

  // Gable (triangular prism): caps take the wall colour, slopes the roof colour
  const roofMat = std({ color: pal.roof });
  const tri = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, RH)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: D, bevelEnabled: false }), [snow ? wallMat : std({ color: pal.wall }), roofMat]);
  gable.position.set(0, H, -D / 2);
  group.add(gable);

  // Overhanging roof panels (+ snow layer)
  const a = Math.atan2(RH, W / 2);
  const L = Math.hypot(W / 2, RH) + 0.32;
  const snowMat = std({ color: '#f4f8ff', roughness: 1 });
  [-1, 1].forEach((side) => {
    const nx = side * Math.sin(a), ny = Math.cos(a); // outward normal of this slope
    const px = (side * W) / 4 + side * 0.06, py = H + RH / 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, D + 0.42), roofMat);
    panel.position.set(px + nx * 0.07, py + ny * 0.07, 0);
    panel.rotation.z = -side * a;
    group.add(panel);
    if (snow) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(L * 0.97, 0.14, D + 0.36), snowMat);
      cap.position.set(px + nx * 0.19, py + ny * 0.19, 0);
      cap.rotation.z = -side * a;
      group.add(cap);
    }
  });

  if (snow && rng() < 0.45) {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.34), std({ color: '#6a3330' }));
    ch.position.set(W * 0.24, H + RH * 0.55, -D * 0.15);
    group.add(ch);
    const chCap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), snowMat);
    chCap.position.set(W * 0.24, H + RH * 0.55 + 0.48, -D * 0.15);
    group.add(chCap);
  }

  // Door opening: glowing interior + frame
  const doorW = snow ? 0.82 : 0.8;
  const doorH = snow ? 1.3 : 1.45;
  const fz = D / 2;
  const interiorMat = std({ color: '#24140c', emissive: new THREE.Color('#ffae4a'), emissiveIntensity: 0 });
  const interior = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.04), interiorMat);
  interior.position.set(0, doorH / 2 + 0.02, fz + 0.01);
  group.add(interior);
  const frameMat = std({ color: snow ? '#4a2c1f' : '#ffffff' });
  [[-(doorW / 2 + 0.06), doorH / 2 + 0.02, 0.12, doorH + 0.04], [doorW / 2 + 0.06, doorH / 2 + 0.02, 0.12, doorH + 0.04], [0, doorH + 0.1, doorW + 0.24, 0.12]].forEach(([x, y, w, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frameMat);
    m.position.set(x, y, fz + 0.04);
    group.add(m);
  });

  // The door itself, hinged on its left edge
  const pivot = new THREE.Group();
  pivot.position.set(-doorW / 2, 0.02, fz + 0.06);
  const side = std({ color: pal.door });
  const back = std({ color: new THREE.Color(pal.door).multiplyScalar(0.55) });
  const front = std({ map: doorTexture(theme, day, pal) });
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.07), [side, side, side, side, front, back]);
  door.position.set(doorW / 2, doorH / 2, 0);
  pivot.add(door);
  group.add(pivot);

  // Number plaque (still readable once the door is open)
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: plaqueTexture(day), transparent: true }));
  plaque.position.set(0, doorH + 0.36, fz + 0.012);
  group.add(plaque);

  // Windows (snow) / porthole (summer)
  if (snow) {
    const winMat = new THREE.MeshStandardMaterial({ color: '#ffd77a', emissive: new THREE.Color('#ffc65c'), emissiveIntensity: 1.6 });
    [-1, 1].forEach((s) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.38), winMat);
      win.position.set(s * (W / 2 - 0.36), 1.25, fz + 0.012);
      group.add(win);
    });
    const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 5), snowMat);
    pile.scale.set(W * 0.75, 0.22, 0.6);
    pile.position.set(0, 0, fz + 0.15);
    group.add(pile);
  } else {
    const port = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#fff3c4'), emissiveIntensity: 0.4 }));
    port.position.set(0, H + RH * 0.42, D / 2 + 0.01);
    group.add(port);
    if (rng() < 0.45) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), std({ color: '#6b4b3e' }));
      pole.position.set(0, H + RH + 0.42, 0);
      group.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24), new THREE.MeshStandardMaterial({ color: pal.door, side: THREE.DoubleSide }));
      flag.geometry.translate(0.21, 0, 0);
      flag.position.set(0.02, H + RH + 0.74, 0);
      flag.userData.wave = rng() * 6;
      group.add(flag);
      group.userData.flag = flag;
    }
  }

  // What's behind the door: an emoji sprite that pops out when opened
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(iconEmoji), depthWrite: false }));
  icon.position.set(0, doorH * 0.55, fz + 0.25);
  icon.scale.setScalar(0.001);
  group.add(icon);

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  plaque.castShadow = false;

  return {
    group,
    pivot,
    interiorMat,
    icon,
    day,
    height: H + RH,
    doorLocal: new THREE.Vector3(0, doorH / 2, fz + 0.1),
    setIcon(emoji) {
      icon.material.map = emojiTexture(emoji);
      icon.material.needsUpdate = true;
    },
  };
}

export { A };
