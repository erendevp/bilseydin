import * as THREE from '../../engine/three.module.js';

// ===== Bölüm metinleri (açılış başlığı + kapanış kartı) =====
const EPTEXT = {
  title: 'Ya son kez olduğunu<br>bilseydin?',
  end1: 'HİÇBİR ZAMAN BİLEMEZSİN',
  end2: 'ZAMAN AYIRMAK İSTEDİĞİN KİŞİYİ ETİKETLE',
};
document.getElementById('t0').innerHTML = EPTEXT.title;
document.getElementById('endT').innerHTML = EPTEXT.title;
document.getElementById('endS1').textContent = EPTEXT.end1;
document.getElementById('endS2').textContent = EPTEXT.end2;

const W = 720, H = 1280;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 220);
const hemi = new THREE.HemisphereLight(0xffffff, 0x777777, 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog(0xcfdcea, 30, 95);

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => ease((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mats = {};
function mat(c, emissive) {
  const k = c + '_' + (emissive || 0);
  if (!mats[k]) {
    mats[k] = new THREE.MeshLambertMaterial({ color: c, flatShading: true });
    if (emissive) { mats[k].emissive = new THREE.Color(emissive); mats[k].emissiveIntensity = 0; }
  }
  return mats[k];
}
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function box(parent, w, h, d, c, x = 0, y = 0, z = 0, opt = {}) {
  const m = new THREE.Mesh(boxGeo, opt.mat || mat(c));
  m.scale.set(w, h, d);
  m.position.set(x, opt.center ? y : y + h / 2, z);
  m.castShadow = opt.cast !== false; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cyl(parent, rt, rb, h, c, x, y, z, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c));
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function group(parent) { const g = new THREE.Group(); if (parent) parent.add(g); return g; }

// ---------- characters ----------
function makeChar(o) {
  const s = o.s || 1, hs = o.hs || 1;
  const c = { s, root: group(scene) };
  c.hips = group(c.root); c.hips.position.y = 0.84 * s;
  c.legs = [];
  for (const side of [-1, 1]) {
    const thigh = group(c.hips); thigh.position.x = side * 0.13 * s;
    box(thigh, 0.22 * s, 0.44 * s, 0.24 * s, o.pants, 0, -0.44 * s, 0);
    const knee = group(thigh); knee.position.y = -0.42 * s;
    box(knee, 0.205 * s, 0.42 * s, 0.225 * s, o.legs2 || o.pants, 0, -0.42 * s, 0);
    box(knee, 0.23 * s, 0.09 * s, 0.31 * s, o.shoes || 0x2a2522, 0, -0.45 * s, 0.035 * s);
    c.legs.push({ thigh, knee });
  }
  c.upper = group(c.hips);
  box(c.upper, 0.52 * s, 0.64 * s, 0.3 * s, o.shirt, 0, 0, 0);
  if (o.vest) box(c.upper, 0.54 * s, 0.5 * s, 0.32 * s, o.vest, 0, 0.1 * s, 0);
  if (o.backpack) box(c.upper, 0.4 * s, 0.46 * s, 0.18 * s, o.backpack, 0, 0.12 * s, -0.24 * s);
  c.arms = [];
  for (const side of [-1, 1]) {
    const sh = group(c.upper); sh.position.set(side * 0.35 * s, 0.6 * s, 0);
    box(sh, 0.18 * s, 0.56 * s, 0.2 * s, o.sleeve || o.shirt, 0, -0.56 * s, 0);
    const hand = box(sh, 0.16 * s, 0.12 * s, 0.18 * s, o.skin || 0xe2b38c, 0, -0.66 * s, 0);
    c.arms.push({ sh, hand });
  }
  c.head = group(c.upper); c.head.position.y = 0.64 * s;
  const hw = 0.38 * s * hs;
  box(c.head, hw, hw, hw, o.skin || 0xe2b38c, 0, 0, 0);
  const eye = 0x2a211c;
  box(c.head, hw * 0.1, hw * 0.12, 0.01, eye, -hw * 0.2, hw * 0.48, hw / 2 + 0.004, { cast: false });
  box(c.head, hw * 0.1, hw * 0.12, 0.01, eye, hw * 0.2, hw * 0.48, hw / 2 + 0.004, { cast: false });
  const hc = o.hair || 0x3a2618;
  if (o.hairStyle === 'scarf') {
    box(c.head, hw * 1.12, hw * 0.34, hw * 1.12, o.scarf, 0, hw * 0.78, 0);
    box(c.head, hw * 1.12, hw * 0.95, hw * 0.3, o.scarf, 0, hw * 0.12, -hw * 0.43);
    box(c.head, hw * 0.12, hw * 0.75, hw * 1.0, o.scarf, -hw * 0.56, hw * 0.25, -hw * 0.04);
    box(c.head, hw * 0.12, hw * 0.75, hw * 1.0, o.scarf, hw * 0.56, hw * 0.25, -hw * 0.04);
  } else if (o.hairStyle !== 'bald') {
    box(c.head, hw * 1.06, hw * 0.24, hw * 1.06, hc, 0, hw * 0.82, 0);
    box(c.head, hw * 1.06, hw * 0.6, hw * 0.18, hc, 0, hw * 0.4, -hw * 0.46);
    if (o.hairStyle === 'long') {
      box(c.head, hw * 1.08, hw * 0.95, hw * 0.24, hc, 0, -hw * 0.3, -hw * 0.45);
      box(c.head, hw * 0.12, hw * 0.75, hw * 0.7, hc, -hw * 0.55, hw * 0.1, -hw * 0.15);
      box(c.head, hw * 0.12, hw * 0.75, hw * 0.7, hc, hw * 0.55, hw * 0.1, -hw * 0.15);
    } else if (o.hairStyle === 'bun') {
      box(c.head, hw * 0.4, hw * 0.35, hw * 0.35, hc, 0, hw * 0.75, -hw * 0.55);
    }
  } else {
    box(c.head, hw * 1.04, hw * 0.28, hw * 0.2, hc, 0, hw * 0.35, -hw * 0.45);
  }
  if (o.mustache) box(c.head, hw * 0.5, hw * 0.09, 0.03, o.mustache, 0, hw * 0.24, hw / 2 + 0.01, { cast: false });
  if (o.beard) box(c.head, hw * 1.0, hw * 0.28, hw * 0.12, o.beard, 0, 0.0, hw * 0.46, { cast: false });
  if (o.cap) { box(c.head, hw * 1.1, hw * 0.25, hw * 1.1, o.cap, 0, hw * 0.92, 0); }
  return c;
}
function pose(c, p = {}) {
  const s = c.s;
  c.root.position.y = p.y || 0;
  c.root.rotation.set(0, p.ry || 0, 0);
  const ph = p.walk || 0, wa = p.walkAmt || 0;
  for (let i = 0; i < 2; i++) {
    const L = c.legs[i], sg = i === 0 ? 1 : -1;
    if (p.sit) {
      L.thigh.rotation.set(-Math.PI / 2 + (p.sitLift || 0), 0, sg * -0.06);
      L.knee.rotation.set(Math.PI / 2 - (p.sitLift || 0), 0, 0);
    } else if (p.straddle) {
      L.thigh.rotation.set(-1.25, 0, sg * -0.42);
      L.knee.rotation.set(1.05, 0, 0);
    } else {
      const a = Math.sin(ph + (i ? Math.PI : 0)) * 0.6 * wa;
      L.thigh.rotation.set(a, 0, 0);
      L.knee.rotation.set(Math.max(0, Math.sin(ph + (i ? Math.PI : 0) + 1.4)) * 0.75 * wa, 0, 0);
    }
  }
  for (let i = 0; i < 2; i++) {
    const A = c.arms[i], sg = i === 0 ? 1 : -1;
    const sw = -Math.sin(ph + (i ? Math.PI : 0)) * 0.5 * wa;
    const key = i === 0 ? 'L' : 'R';
    A.sh.rotation.set((p['arm' + key + 'x'] ?? 0) + sw, 0, (p['arm' + key + 'z'] ?? 0) * sg + sg * 0.04);
  }
  c.upper.rotation.set(p.bow || 0, p.twist || 0, p.lean || 0);
  c.head.rotation.set(p.nod || 0, p.look || 0, p.tilt || 0);
  c.root.position.y += wa ? Math.abs(Math.sin(ph)) * 0.035 * s : 0;
}
function place(c, x, z, ry) { c.root.position.x = x; c.root.position.z = z; }
function walkPath(c, pts, t0, t1, t, speedPhase = 7, extra = {}) {
  // pts: [[x,z],[x,z],...], moves through linear segments between t0..t1
  const k = clamp((t - t0) / (t1 - t0));
  let total = 0; const lens = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
  // ease ends a bit
  const kk = k < 0.08 ? k * k / 0.16 : k > 0.92 ? 1 - (1 - k) * (1 - k) / 0.16 : k - 0.04;
  const kn = clamp(kk / 0.92 * 1.0);
  let d = kn * total, i = 0;
  while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
  const a = pts[i], b = pts[i + 1], f = lens[i] ? d / lens[i] : 0;
  const x = lerp(a[0], b[0], f), z = lerp(a[1], b[1], f);
  c.root.position.x = x; c.root.position.z = z;
  const moving = t > t0 && t < t1;
  const ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const dist = kn * total;
  pose(c, Object.assign({ walk: dist * speedPhase / c.s, walkAmt: moving ? 1 : 0, ry }, extra));
  return { x, z, ry, moving };
}

// ---------- sets ----------
const sets = {};
function ground(parent, color, size = 160) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; parent.add(g); return g;
}
function tree(parent, x, z, s = 1, trunk = 0x6b4a2f, leaf = 0x4f7f3a) {
  box(parent, 0.35 * s, 2.2 * s, 0.35 * s, trunk, x, 0, z);
  box(parent, 2.4 * s, 1.3 * s, 2.4 * s, leaf, x, 1.9 * s, z);
  box(parent, 1.8 * s, 1.0 * s, 1.8 * s, leaf, x + 0.2 * s, 3.1 * s, z - 0.1 * s);
  box(parent, 1.1 * s, 0.7 * s, 1.1 * s, leaf, x - 0.1 * s, 4.0 * s, z + 0.1 * s);
}
function pine(parent, x, z, s = 1) {
  box(parent, 0.3 * s, 1.0 * s, 0.3 * s, 0x5a3e26, x, 0, z);
  box(parent, 1.8 * s, 1.0 * s, 1.8 * s, 0x2f5e34, x, 0.8 * s, z);
  box(parent, 1.3 * s, 1.0 * s, 1.3 * s, 0x356a3a, x, 1.7 * s, z);
  box(parent, 0.8 * s, 0.9 * s, 0.8 * s, 0x3a723f, x, 2.6 * s, z);
}
const lampMats = [];
function lamp(parent, x, z, h = 4.2) {
  box(parent, 0.14, h, 0.14, 0x4a4d52, x, 0, z);
  box(parent, 0.8, 0.1, 0.14, 0x4a4d52, x + 0.33, h - 0.1, z);
  const m = new THREE.MeshLambertMaterial({ color: 0xfff1c9, emissive: 0xffd27a, emissiveIntensity: 0 });
  lampMats.push(m);
  box(parent, 0.34, 0.16, 0.26, 0, x + 0.62, h - 0.3, z, { mat: m, cast: false });
}
function geranium(parent, x, y, z) {
  box(parent, 0.34, 0.24, 0.24, 0xb5583a, x, y, z);
  box(parent, 0.4, 0.16, 0.3, 0x3f7a35, x, y + 0.24, z);
  box(parent, 0.1, 0.1, 0.1, 0xd8323f, x - 0.1, y + 0.36, z);
  box(parent, 0.1, 0.1, 0.1, 0xe0414d, x + 0.08, y + 0.38, z + 0.05);
  box(parent, 0.09, 0.09, 0.09, 0xd8323f, x + 0.02, y + 0.4, z - 0.07);
}
function cat(parent, x, y, z, ry = 0) {
  const g = group(parent); g.position.set(x, y, z); g.rotation.y = ry;
  const o = 0xd9822b, d = 0xb5651c;
  box(g, 0.2, 0.18, 0.42, o, 0, 0.1, 0);
  for (const [px, pz] of [[-0.07, 0.15], [0.07, 0.15], [-0.07, -0.15], [0.07, -0.15]]) box(g, 0.06, 0.1, 0.06, o, px, 0, pz);
  box(g, 0.2, 0.18, 0.18, o, 0, 0.24, 0.24);
  box(g, 0.05, 0.07, 0.04, d, -0.06, 0.42, 0.24); box(g, 0.05, 0.07, 0.04, d, 0.06, 0.42, 0.24);
  box(g, 0.035, 0.035, 0.01, 0x2a2a1a, -0.05, 0.33, 0.335, { cast: false }); box(g, 0.035, 0.035, 0.01, 0x2a2a1a, 0.05, 0.33, 0.335, { cast: false });
  const tail = group(g); tail.position.set(0, 0.2, -0.2);
  box(tail, 0.05, 0.05, 0.32, d, 0, 0, -0.14);
  g.userData.tail = tail;
  return g;
}
const winMats = [];
function windowBox(parent, w, h, x, y, z, frame = 0xf2efe8) {
  box(parent, w + 0.16, h + 0.16, 0.06, frame, x, y - 0.08, z, { cast: false });
  const m = new THREE.MeshLambertMaterial({ color: 0x3c4a5e, emissive: 0xffc777, emissiveIntensity: 0 });
  winMats.push(m);
  box(parent, w, h, 0.08, 0, x, y, z + 0.01, { mat: m, cast: false });
  box(parent, 0.05, h, 0.09, frame, x, y, z + 0.02, { cast: false });
  box(parent, w, 0.08, 0.2, 0xd8d2c6, x, y - 0.1, z + 0.08, { cast: false });
}
function railing(parent, x, y, z, w, d) {
  const c = 0x3e4247;
  box(parent, w, 0.07, 0.07, c, x, y + 1.0, z + d / 2);
  box(parent, 0.07, 0.07, d, c, x - w / 2, y + 1.0, z);
  box(parent, 0.07, 0.07, d, c, x + w / 2, y + 1.0, z);
  for (let i = 0; i <= Math.round(w / 0.32); i++) box(parent, 0.04, 1.0, 0.04, c, x - w / 2 + i * w / Math.round(w / 0.32), y, z + d / 2, { cast: false });
  box(parent, w, 0.07, 0.07, c, x, y + 0.12, z + d / 2, { cast: false });
}
function chair(parent, x, y, z, ry = 0, c = 0x8a5a36) {
  const g = group(parent); g.position.set(x, y, z); g.rotation.y = ry;
  box(g, 0.5, 0.06, 0.5, c, 0, 0.45, 0);
  for (const [px, pz] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) box(g, 0.06, 0.45, 0.06, c, px, 0, pz);
  box(g, 0.5, 0.55, 0.06, c, 0, 0.5, -0.22);
  return g;
}
function teaGlass(parent, x, y, z) {
  box(parent, 0.13, 0.015, 0.13, 0xf1efe9, x, y, z, { cast: false });
  cyl(parent, 0.04, 0.03, 0.12, 0x9c3b17, x, y + 0.015, z, 7);
}

// === SET A: apartment ===
function buildA() {
  const g = group(scene);
  ground(g, 0x77a356);
  box(g, 40, 0.06, 3.4, 0xc3bcae, 0, 0, -3.6, { cast: false });
  box(g, 2.2, 0.07, 6, 0xc3bcae, 0, 0, 0.5, { cast: false });
  box(g, 80, 0.05, 7, 0x56595f, 0, 0, 8.5, { cast: false });
  for (let i = -6; i <= 6; i++) box(g, 1.6, 0.06, 0.15, 0xe8e4d8, i * 4, 0, 8.5, { cast: false });
  box(g, 80, 0.16, 0.3, 0xa9a397, 0, 0, 4.9, { cast: false });
  // building
  const B = group(g); B.position.z = -6;
  box(B, 18, 12.6, 9, 0xebdfc6, 0, 0, -4.5);
  box(B, 18.4, 0.5, 9.4, 0xcdbd9f, 0, 12.6, -4.5);
  for (let f = 1; f < 4; f++) box(B, 18.1, 0.18, 0.12, 0xd8c8aa, 0, f * 3 - 0.05, 0.02, { cast: false });
  box(B, 18.1, 0.9, 0.1, 0xb9a988, 0, 0, 0.02, { cast: false });
  for (let f = 0; f < 4; f++) {
    for (const x of [-7.4, -3.2, 3.2, 7.4]) {
      if (f > 0 && (x === -3.2 || x === 3.2)) continue;
      if (f === 0 && (x === -3.2 || x === 3.2)) { windowBox(B, 1.2, 1.4, x, 1.2, 0.03); continue; }
      windowBox(B, 1.3, 1.5, x, f * 3 + 1.0, 0.03);
    }
    if (f > 0) { windowBox(B, 0.8, 1.2, -1.2, f * 3 + 1.2, 0.03); windowBox(B, 0.8, 1.2, 1.2, f * 3 + 1.2, 0.03); }
  }
  // entrance
  box(B, 1.7, 2.5, 0.1, 0x6b4128, 0, 0.15, 0.05);
  box(B, 0.05, 2.3, 0.12, 0x4f2f1c, 0, 0.2, 0.08);
  box(B, 0.08, 0.08, 0.15, 0xd6b24a, 0.2, 1.3, 0.12);
  box(B, 2.8, 0.14, 1.4, 0xd5d0c6, 0, 2.75, 0.7);
  box(B, 2.6, 0.15, 1.2, 0xbab3a6, 0, 0, 0.6, { cast: false });
  box(B, 2.2, 0.08, 0.5, 0xbab3a6, 0, 0, 1.4, { cast: false });
  // balconies
  for (let f = 1; f < 4; f++) {
    for (const x of [-5.3, 5.3]) {
      box(B, 3.3, 0.18, 1.3, 0xd9cdb5, x, f * 3 - 0.05, 0.65);
      windowBox(B, 1.0, 2.0, x - 0.6, f * 3 + 0.25, 0.03);
      windowBox(B, 0.9, 1.2, x + 0.8, f * 3 + 1.0, 0.03);
      railing(B, x, f * 3 + 0.13, 0.65, 3.2, 1.2);
      if (!(f === 1 && x === -5.3)) { geranium(B, x - 1.1, f * 3 + 1.07, 1.2); geranium(B, x + 0.9, f * 3 + 1.07, 1.2); }
    }
  }
  // clothesline on 3rd floor right
  box(B, 2.9, 0.02, 0.02, 0xeeeeee, 5.3, 10.9, 0.9, { cast: false });
  box(B, 0.4, 0.5, 0.03, 0xd65a5a, 4.5, 10.4, 0.9); box(B, 0.5, 0.6, 0.03, 0x4e7fc0, 5.2, 10.3, 0.9); box(B, 0.35, 0.45, 0.03, 0xf2f0e6, 5.9, 10.45, 0.9);
  // mom's balcony (f1 left) extras
  g.userData.balcony = new THREE.Vector3(-5.3, 3.13, -6 + 0.65);
  const bal = group(B); bal.position.set(-5.3, 3.13, 0.65);
  g.userData.balconyChair = chair(bal, 0.6, 0, -0.05, 0.25, 0x9b6b42);
  const tbl = group(bal); tbl.position.set(1.15, 0, 0.1);
  box(tbl, 0.45, 0.04, 0.45, 0xe6e1d6, 0, 0.55, 0); box(tbl, 0.05, 0.55, 0.05, 0x777777, 0, 0, 0);
  teaGlass(tbl, 0, 0.59, 0);
  g.userData.balTable = tbl;
  // garden
  tree(g, -13, 0.5, 1.1); tree(g, 9, 0.5, 1.0, 0x6b4a2f, 0x5a8a3f);
  box(g, 7, 0.55, 0.35, 0xd2c9b8, -5.5, 0, 4.5); box(g, 7, 0.55, 0.35, 0xd2c9b8, 5.5, 0, 4.5);
  g.userData.cat = cat(g, -4.2, 0.55, 4.5, 0.4);
  lamp(g, 3.2, 4.0); lamp(g, -12, 4.0);
  box(g, 1.6, 0.45, 0.45, 0x7c5a3a, 4.6, 0.0, -2.0); box(g, 1.6, 0.08, 0.5, 0x8d6a46, 4.6, 0.45, -2.0); box(g, 1.6, 0.45, 0.08, 0x8d6a46, 4.6, 0.5, -2.22);
  // background buildings
  const cols = [0xe6c9b0, 0xd8d3c5, 0xe8d9a8, 0xc9d3d6, 0xe2bfae];
  for (let i = 0; i < 7; i++) {
    const x = -30 + i * 10, h = 10 + (i % 3) * 3;
    const bb = group(g); bb.position.set(x, 0, -24 - (i % 2) * 6);
    box(bb, 8, h, 6, cols[i % 5], 0, 0, 0);
    for (let f = 0; f < h / 3 - 1; f++) for (const wx of [-2.5, 0, 2.5]) box(bb, 1.0, 1.2, 0.05, 0x56627a, wx, f * 3 + 1.2, 3.01, { cast: false });
  }
  for (let i = 0; i < 5; i++) { const bb = group(g); bb.position.set(-20 + i * 10, 0, 22); box(bb, 8, 9 + (i % 2) * 3, 6, cols[(i + 2) % 5], 0, 0, 0); }
  return g;
}

// === SET B: grandparents' house + çardak ===
function buildB() {
  const g = group(scene);
  ground(g, 0x6f9f45);
  const Hs = group(g); Hs.position.z = -4;
  box(Hs, 10, 6, 6, 0xdccfb9, 0, 0, -3);
  // gable roof
  const r1 = box(Hs, 10.8, 0.3, 4.1, 0x8a3a2a, 0, 0, -1.55, { center: true }); r1.position.y = 7.0; r1.rotation.x = 0.62;
  const r2 = box(Hs, 10.8, 0.3, 4.1, 0x7a3123, 0, 0, -4.45, { center: true }); r2.position.y = 7.0; r2.rotation.x = -0.62;
  box(Hs, 10, 1.4, 5.4, 0xdccfb9, 0, 6, -3);
  box(Hs, 6.6, 1.0, 5.0, 0xdccfb9, 0, 7.1, -3);
  box(Hs, 3.4, 0.7, 3.6, 0xdccfb9, 0, 7.9, -3);
  // veranda
  box(Hs, 10, 0.12, 2.4, 0x8a6240, 0, 0, 1.2);
  box(Hs, 10.4, 0.2, 2.8, 0xdedad2, 0, 3.0, 1.2);
  for (const x of [-4.8, -1.6, 1.6, 4.8]) box(Hs, 0.22, 3.0, 0.22, 0xf0ece4, x, 0, 2.3);
  box(Hs, 10, 0.1, 0.1, 0xf0ece4, 0, 2.9, 2.3);
  box(Hs, 1.5, 2.4, 0.1, 0x5e3a24, 0, 0.12, 0.03);
  windowBox(Hs, 1.3, 1.4, -3.2, 1.1, 0.03); windowBox(Hs, 1.3, 1.4, 3.2, 1.1, 0.03);
  windowBox(Hs, 1.3, 1.4, -3.2, 4.0, 0.03); windowBox(Hs, 1.3, 1.4, 3.2, 4.0, 0.03); windowBox(Hs, 1.0, 1.4, 0, 4.0, 0.03);
  // sedir bench
  box(Hs, 1.8, 0.42, 0.55, 0x7a5434, -3.0, 0.12, 0.45); box(Hs, 1.8, 0.1, 0.55, 0xa8463c, -3.0, 0.54, 0.45);
  g.userData.dedeChair = chair(Hs, 1.6, 0.12, 0.7, 0, 0x8a5a36);
  geranium(Hs, -1.0, 0.12, 0.35); geranium(Hs, 4.2, 0.12, 0.35);
  // fence
  for (let i = -14; i <= 14; i++) { box(g, 0.12, 0.9, 0.08, 0xc8b89c, i * 0.8, 0, 8.5); }
  box(g, 23, 0.08, 0.06, 0xc8b89c, 0, 0.7, 8.5); box(g, 23, 0.08, 0.06, 0xc8b89c, 0, 0.3, 8.5);
  for (let i = -6; i <= 6; i++) { box(g, 0.12, 0.9, 0.08, 0xc8b89c, -11.5, 0, i * 0.8 + 3); box(g, 0.12, 0.9, 0.08, 0xc8b89c, 11.5, 0, i * 0.8 + 3); }
  // vegetable bed
  box(g, 3, 0.25, 1.2, 0x5b3d26, -7, 0, 3.5);
  for (let i = 0; i < 6; i++) box(g, 0.25, 0.35, 0.25, 0x3f7f35, -8.2 + i * 0.48, 0.25, 3.5);
  for (let i = 0; i < 3; i++) box(g, 0.12, 0.12, 0.12, 0xd2402e, -7.9 + i * 0.9, 0.45, 3.55);
  tree(g, -9, -2, 1.15, 0x6b4a2f, 0x5a8f3c);
  pine(g, 10, -6, 1.6); pine(g, -14, -7, 1.9); pine(g, 14, 4, 1.4);
  // çardak with breakfast table
  const C = group(g); C.position.set(5.2, 0, 2.6); g.userData.cardak = C;
  for (const [x, z] of [[-2, -1.4], [2, -1.4], [-2, 1.4], [2, 1.4]]) box(C, 0.16, 2.6, 0.16, 0x7a5434, x, 0, z);
  box(C, 4.3, 0.12, 0.14, 0x7a5434, 0, 2.6, -1.4); box(C, 4.3, 0.12, 0.14, 0x7a5434, 0, 2.6, 1.4);
  for (let i = 0; i < 6; i++) box(C, 0.1, 0.1, 3.1, 0x7a5434, -2 + i * 0.8, 2.72, 0);
  const leafC = [0x4f8a3a, 0x5a9a42, 0x467d33];
  for (let i = 0; i < 18; i++) { const x = -2.1 + (i % 6) * 0.84, z = -1.3 + Math.floor(i / 6) * 1.25; box(C, 0.9, 0.22, 0.9, leafC[i % 3], x + ((i * 37) % 5) * 0.03, 2.8, z); }
  for (let i = 0; i < 5; i++) box(C, 0.12, 0.25, 0.12, 0x6a3a6a, -1.6 + i * 0.8, 2.52, -0.6 + (i % 2) * 0.9);
  // table
  const T = group(C); g.userData.table = T;
  box(T, 2.8, 0.06, 1.2, 0xf4f1ea, 0, 0.78, 0);
  box(T, 2.84, 0.18, 1.24, 0xe9e4da, 0, 0.62, 0, { cast: false });
  for (const [x, z] of [[-1.25, -0.5], [1.25, -0.5], [-1.25, 0.5], [1.25, 0.5]]) box(T, 0.08, 0.62, 0.08, 0x6b4a2f, x, 0, z);
  // chairs around
  g.userData.chairs = [];
  const seats = [[-0.8, -0.95, 0], [0, -0.95, 0], [0.8, -0.95, 0], [-0.8, 0.95, Math.PI], [0.8, 0.95, Math.PI], [1.85, 0, -Math.PI / 2]];
  for (const [x, z, ry] of seats) g.userData.chairs.push(chair(C, x, 0, z, ry, 0x8a5a36));
  g.userData.seats = seats.map(([x, z, ry]) => [5.2 + x, 2.6 + z, ry]);
  // breakfast items
  const F = group(T); g.userData.food = F;
  const top = 0.84;
  for (const [x, z] of [[-0.8, -0.35], [0, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35], [1.15, 0]]) {
    cyl(F, 0.16, 0.14, 0.02, 0xfbfaf6, x, top, z, 12);
    teaGlass(F, x + 0.2, top, z * 0.7);
  }
  box(F, 0.3, 0.06, 0.2, 0xfafaf2, -0.35, top, 0.0); // cheese
  box(F, 0.2, 0.05, 0.2, 0xf5e9b8, 0.4, top, 0.05);
  for (let i = 0; i < 6; i++) box(F, 0.05, 0.05, 0.05, 0x1f2a1c, 0.15 + (i % 3) * 0.06, top + 0.03, -0.05 + Math.floor(i / 3) * 0.06);
  for (let i = 0; i < 4; i++) box(F, 0.08, 0.06, 0.08, 0xd23a2a, -0.05 + i * 0.09, top, 0.12);
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 5, 10), mat(0xa8672f)); s.rotation.x = -Math.PI / 2; s.position.set(-1.05 + i * 0.27, top + 0.04, 0.05); s.castShadow = true; F.add(s); }
  // çaydanlık
  const K = group(F); K.position.set(0.0, top, 0.02); g.userData.kettle = K;
  box(K, 0.26, 0.24, 0.26, 0xb8bcc2, 0, 0, 0); box(K, 0.2, 0.2, 0.2, 0xc9cdd2, 0, 0.24, 0); box(K, 0.06, 0.05, 0.06, 0x333333, 0, 0.44, 0);
  box(K, 0.2, 0.04, 0.04, 0xb8bcc2, 0.18, 0.15, 0);
  g.userData.lone = group(T); teaGlass(g.userData.lone, 0.8, top, -0.35);
  return g;
}

// === SET C: neighbourhood street ===
function buildC() {
  const g = group(scene);
  ground(g, 0x8c8a82);
  box(g, 120, 0.04, 6, 0x5a5c61, 0, 0, 0, { cast: false });
  box(g, 120, 0.16, 2.2, 0xb9b3a7, 0, 0, -4.1, { cast: false });
  box(g, 120, 0.16, 2.2, 0xb9b3a7, 0, 0, 4.1, { cast: false });
  const cols = [0xe8d4b0, 0xd9c2c2, 0xcfd8cc, 0xe9dfc6, 0xd6c9e0, 0xf0d9b5];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const x = -32 + i * 8, h = 7.5 + ((i + (side > 0 ? 1 : 0)) % 3) * 2.2;
      const bb = group(g); bb.position.set(x, 0, side * 9.2); bb.rotation.y = side > 0 ? Math.PI : 0;
      box(bb, 7.8, h, 7, cols[(i + (side > 0 ? 3 : 0)) % 6], 0, 0, -3.5);
      box(bb, 7.9, 0.3, 7.1, 0xbfb29a, 0, h, -3.5);
      for (let f = 0; f < Math.floor(h / 2.8); f++) for (const wx of [-2.4, 0, 2.4]) windowBox(bb, 1.0, 1.2, wx, f * 2.8 + 1.1, 0.02);
      if (i % 2 === 0) { box(bb, 2.2, 0.15, 0.9, 0xd8d0c0, -2.4, 2.75, 0.45); railing(bb, -2.4, 2.82, 0.45, 2.1, 0.8); }
    }
  }
  lamp(g, -6, -3.4); lamp(g, 8, -3.4); lamp(g, 1, 3.6);
  // stones as goals
  for (const x of [-7, 7]) for (const z of [-1.1, 1.1]) box(g, 0.4, 0.3, 0.35, 0x9a948a, x, 0, z);
  // parked car
  const car = group(g); car.position.set(-13, 0, 2.3);
  box(car, 4.0, 0.8, 1.8, 0xc9c3b4, 0, 0.3, 0); box(car, 2.2, 0.7, 1.7, 0xc9c3b4, -0.2, 1.1, 0);
  box(car, 2.25, 0.5, 1.72, 0x3a4a5a, -0.2, 1.17, 0, { cast: false });
  for (const [x, z] of [[-1.3, 0.9], [1.3, 0.9], [-1.3, -0.9], [1.3, -0.9]]) { const w = cyl(car, 0.32, 0.32, 0.22, 0x1d1d1f, x, 0.32, z, 10); w.rotation.x = Math.PI / 2; w.position.y = 0.32; }
  g.userData.cat = cat(car, 0.9, 1.1, 0.1, -1.2);
  // ball
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), mat(0xf4f4f0)); ball.castShadow = true; g.add(ball); g.userData.ball = ball;
  return g;
}

// === SET E: otogar ===
function signTexture(lines) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
  const x = cv.getContext('2d');
  x.fillStyle = '#1f4f8a'; x.fillRect(0, 0, 512, 256);
  x.fillStyle = '#ffffff'; x.textAlign = 'center';
  x.font = '600 70px Inter'; x.fillText(lines[0], 256, 110);
  x.font = '500 40px Inter'; x.fillText(lines[1], 256, 190);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildE() {
  const g = group(scene);
  ground(g, 0x9d998f);
  box(g, 60, 0.25, 4, 0xbdb8ad, 0, 0, 3.0);
  box(g, 60, 0.04, 9, 0x5c5e63, 0, 0, -3.5, { cast: false });
  // canopy
  for (const i of [-13, 13]) box(g, 0.3, 5.2, 0.3, 0x8b9096, i, 0.25, 3.0);
  box(g, 34, 0.3, 5, 0xd3d6d9, 0, 5.45, 3.0);
  // sign
  const sp = group(g); sp.position.set(-3.2, 0.25, 4.0);
  box(sp, 0.12, 2.6, 0.12, 0x5a5f66, 0, 0, 0);
  const sm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.06), [mat(0x1f4f8a), mat(0x1f4f8a), mat(0x1f4f8a), mat(0x1f4f8a), new THREE.MeshLambertMaterial({ map: null }), mat(0x1f4f8a)]);
  sm.position.set(0, 2.85, 0); sp.add(sm); g.userData.sign = sm;
  // bench
  box(g, 2.0, 0.45, 0.5, 0x6d737a, 6.5, 0.25, 4.6); box(g, 2.0, 0.08, 0.55, 0x9a6b44, 6.5, 0.7, 4.6);
  // bus
  const bus = group(g); g.userData.bus = bus;
  box(bus, 11, 2.7, 2.55, 0xf2f1ec, 0, 0.45, 0);
  box(bus, 11.02, 0.95, 2.57, 0x2a3442, 0.3, 1.75, 0, { cast: false });
  box(bus, 11.02, 0.18, 2.57, 0xc23b33, 0, 1.3, 0, { cast: false });
  box(bus, 11.02, 0.08, 2.57, 0xe08a2c, 0, 1.52, 0, { cast: false });
  box(bus, 0.9, 2.1, 0.06, 0x26303c, 4.3, 0.55, 1.28, { cast: false });
  box(bus, 0.06, 1.2, 2.3, 0x2a3442, 5.51, 1.5, 0, { cast: false });
  for (const x of [-3.6, 3.4]) for (const z of [1.15, -1.15]) { const w = cyl(bus, 0.48, 0.48, 0.3, 0x1b1b1d, x, 0.48, z, 12); w.rotation.x = Math.PI / 2; w.position.y = 0.48; }
  // other buses in background
  for (const [x, c] of [[-16, 0xe9e6dd], [17, 0xdfe5ea]]) { const b2 = group(g); b2.position.set(x, 0, -6.5); box(b2, 11, 2.7, 2.5, c, 0, 0.45, 0); box(b2, 11.02, 0.9, 2.52, 0x2a3442, 0, 1.75, 0, { cast: false }); box(b2, 11.02, 0.18, 2.52, 0x2f6fb0, 0, 1.3, 0, { cast: false }); }
  // terminal building back
  box(g, 60, 6, 3, 0xd8d2c4, 0, 0, -13);
  for (let i = -8; i <= 8; i++) box(g, 2.6, 2.4, 0.05, 0x5b6a7c, i * 3.4, 1.5, -11.48, { cast: false });
  // water particles
  const W = group(g); g.userData.water = W; W.userData.parts = [];
  for (let i = 0; i < 26; i++) { const m = box(W, 0.07, 0.07, 0.07, 0x8cc3e6, 0, 0, 0, { cast: false }); W.userData.parts.push(m); }
  const bowl = cyl(g, 0.17, 0.12, 0.08, 0xc9a24a, 0, 0, 0, 10); g.userData.bowl = bowl;
  return g;
}

sets.A = buildA(); sets.B = buildB(); sets.C = buildC(); sets.E = buildE();

// ---------- cast ----------
const SKIN = 0xe2b38c, SKIN2 = 0xd7a37b;
const P = {};
function C(name, o) { P[name] = makeChar(o); P[name].root.visible = false; return P[name]; }
C('dad', { s: 1, shirt: 0x4f7a3a, pants: 0x34343e, hair: 0x2b1d14, mustache: 0x2b1d14, skin: SKIN2 });
C('mom', { s: 0.95, shirt: 0xa83a4c, pants: 0x4a3046, hair: 0x3a2214, hairStyle: 'long' });
C('k5', { s: 0.6, hs: 1.28, shirt: 0x3b6fb6, pants: 0x2b3a5c, hair: 0x4a2f1f });
C('k7', { s: 0.66, hs: 1.22, shirt: 0xf1efe8, pants: 0x2f3550, hair: 0x4a2f1f, vest: 0x34466e });
C('k9', { s: 0.72, hs: 1.16, shirt: 0x3b6fb6, pants: 0x2b3a5c, hair: 0x4a2f1f });
C('f1', { s: 0.72, hs: 1.16, shirt: 0xd8b13a, pants: 0x3d3d48, hair: 0x1f1610, skin: SKIN2 });
C('f2', { s: 0.7, hs: 1.16, shirt: 0xb8433d, pants: 0x2d3a4d, hair: 0x5a3a20 });
C('f3', { s: 0.74, hs: 1.15, shirt: 0x4f9a5a, pants: 0x3a3226, hair: 0x2a1a10, skin: SKIN2 });
C('k11', { s: 0.8, hs: 1.1, shirt: 0x3b6fb6, pants: 0x2b3a5c, hair: 0x4a2f1f });
C('k15', { s: 0.93, hs: 1.03, shirt: 0x3b6fb6, pants: 0x2b3a5c, hair: 0x4a2f1f });
C('sis', { s: 0.62, hs: 1.25, shirt: 0xd77fa1, pants: 0x6a4a7a, hair: 0x4a2f1f, hairStyle: 'long' });
C('k18', { s: 0.98, shirt: 0x2f5fa3, pants: 0x2b3448, hair: 0x4a2f1f, backpack: 0x3d4a3a });
C('dede', { s: 0.96, shirt: 0xd8d3c8, vest: 0x5e5e64, pants: 0x4a4a52, hair: 0xe9e9e6, hairStyle: 'bald', mustache: 0xf0f0ec, skin: SKIN2, cap: 0x6a6a70 });
C('nine', { s: 0.9, shirt: 0x7d3b4b, pants: 0x6a3a48, hairStyle: 'scarf', scarf: 0xf3f0e8 });
C('dad2', { s: 0.98, shirt: 0x4f7a3a, pants: 0x34343e, hair: 0x9a9a98, mustache: 0xb0b0ae, skin: SKIN2, vest: 0x6b5a48 });
C('mom2', { s: 0.93, shirt: 0xa83a4c, pants: 0x4a3046, hair: 0xb9b7b2, hairStyle: 'bun' });
C('me', { s: 1.0, shirt: 0x355e94, pants: 0x383a44, hair: 0x4a2f1f, beard: 0x4a2f1f });
C('dad15', { s: 1, shirt: 0x4f7a3a, pants: 0x34343e, hair: 0x2b1d14, mustache: 0x2b1d14, skin: SKIN2 });
C('mom15', { s: 0.95, shirt: 0xa83a4c, pants: 0x4a3046, hair: 0x3a2214, hairStyle: 'long' });
C('dede15', { s: 0.96, shirt: 0xd8d3c8, vest: 0x5e5e64, pants: 0x4a4a52, hair: 0xe9e9e6, hairStyle: 'bald', mustache: 0xf0f0ec, skin: SKIN2, cap: 0x6a6a70 });
C('nine15', { s: 0.9, shirt: 0x7d3b4b, pants: 0x6a3a48, hairStyle: 'scarf', scarf: 0xf3f0e8 });
// props
const note = box(scene, 0.14, 0.02, 0.07, 0x6faa5c, 0, 0, 0, { cast: false });
const phone = box(scene, 0.07, 0.14, 0.02, 0x1d1f24, 0, 0, 0, { cast: false });
const momBalcony = P.mom; // reused

// ---------- lighting presets ----------
const LIGHT = {
  morning: { sky: 0xbcd4ea, fog: 0xcfdcea, hs: 0xe3ecf7, hg: 0x7a8a5a, hi: 1.05, sc: 0xfff2dc, si: 1.55, sp: [14, 22, 12], lamps: 0, wins: 0 },
  bayram: { sky: 0xc3dcf0, fog: 0xd6e3ef, hs: 0xeef3fa, hg: 0x7d8f58, hi: 1.1, sc: 0xfff6e6, si: 1.6, sp: [-12, 20, 14], lamps: 0, wins: 0 },
  dusk: { sky: 0xe7b48f, fog: 0xd9a98a, hs: 0xf3c9a8, hg: 0x5d5a52, hi: 0.85, sc: 0xffb877, si: 1.05, sp: [-20, 8, 6], lamps: 1.6, wins: 0.9 },
  overcast: { sky: 0xb9c2cc, fog: 0xbcc4cd, hs: 0xd5dbe2, hg: 0x737a70, hi: 1.15, sc: 0xe8eef5, si: 0.55, sp: [6, 22, 8], lamps: 0, wins: 0.15 },
  golden: { sky: 0xf0c48e, fog: 0xe9c39a, hs: 0xfbe0bd, hg: 0x7a6a4c, hi: 0.95, sc: 0xffc683, si: 1.45, sp: [-18, 9, 14], lamps: 0.6, wins: 0.5 },
  otogar: { sky: 0xc9d6e2, fog: 0xd1dae3, hs: 0xe6ecf2, hg: 0x7d7d76, hi: 1.1, sc: 0xfff4e4, si: 1.3, sp: [10, 20, 16], lamps: 0, wins: 0 },
};
function applyLight(L, Lb, k = 0) {
  const mix = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  const B = Lb || L;
  scene.background = mix(L.sky, B.sky); scene.fog.color = mix(L.fog, B.fog);
  hemi.color = mix(L.hs, B.hs); hemi.groundColor = mix(L.hg, B.hg); hemi.intensity = lerp(L.hi, B.hi, k);
  sun.color = mix(L.sc, B.sc); sun.intensity = lerp(L.si, B.si, k);
  const sp = lerp3(L.sp, B.sp, k); sun.position.set(sp[0], sp[1], sp[2]);
  lampMats.forEach(m => m.emissiveIntensity = lerp(L.lamps, B.lamps, k));
  winMats.forEach((m, i) => m.emissiveIntensity = (i % 3 === 1 ? 0.25 : 1) * lerp(L.wins, B.wins, k));
}

// ---------- camera ----------
function cam(t, keys) {
  // keys: [[t, [px,py,pz], [lx,ly,lz], fov?], ...]
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1] || a;
  const k = b[0] > a[0] ? seg(t, a[0], b[0]) : 0;
  const p = lerp3(a[1], b[1], k), l = lerp3(a[2], b[2], k);
  camera.position.set(p[0], p[1], p[2]); camera.lookAt(l[0], l[1], l[2]);
  const f = lerp(a[3] || 48, b[3] || 48, k); if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); }
}

// ---------- scenes ----------
const show = (setName, chars) => {
  for (const k in sets) sets[k].visible = k === setName;
  for (const k in P) P[k].root.visible = chars.includes(k);
  note.visible = false; phone.visible = false;
};
const worldOf = (obj, v) => { obj.updateWorldMatrix(true, false); return v.clone().applyMatrix4(obj.matrixWorld); };

const SC = [
  { a: 0, b: 10.5, fn: S1 }, { a: 10.5, b: 21, fn: S2 }, { a: 21, b: 31.5, fn: S3 }, { a: 31.5, b: 42, fn: S4 },
  { a: 42, b: 52.5, fn: S5 }, { a: 52.5, b: 63, fn: S6 }, { a: 63, b: 68.5, fn: S7 }, { a: 68.5, b: 74, fn: S7b },
  { a: 74, b: 87.4, fn: S8 },
];

function S1(u) { // age 5 - on dad's shoulders
  show('A', ['dad', 'k5', 'mom']); applyLight(LIGHT.morning);
  const D = P.dad, K = P.k5, M = P.mom;
  const w = walkPath(D, [[-8.8, -2.6], [-1.7, -2.6]], 0.0, 7.0, u, 6.2, { armLx: -0.35, armRx: -0.35 });
  D.root.updateMatrixWorld(true);
  const lower = seg(u, 7.2, 8.6);
  const sh = worldOf(D.upper, new THREE.Vector3(0, 0.78, -0.2));
  const groundPos = new THREE.Vector3(w.x + 0.65, 0, w.z + 0.6);
  if (lower < 1) {
    const hipH = 0.84 * K.s;
    const pos = new THREE.Vector3().lerpVectors(new THREE.Vector3(sh.x, sh.y - hipH, sh.z), groundPos, lower);
    pos.y += Math.sin(lower * Math.PI) * 0.25;
    K.root.position.set(pos.x, 0, pos.z);
    pose(K, lower < 0.5 ? { straddle: true, ry: w.ry, armLx: -2.3, armRx: -2.3, armLz: 0.25, armRz: 0.25, look: Math.sin(u * 1.3) * 0.3 } : { ry: lerp(w.ry, Math.atan2(-0.65, -0.6) + Math.PI * 2, lower), armLx: -0.4, armRx: -0.4 });
    K.root.position.y = pos.y;
  } else {
    K.root.position.set(groundPos.x, 0, groundPos.z);
    pose(K, { ry: Math.atan2(-0.65, -0.6), nod: -0.45, armLx: -0.2 + Math.sin(u * 3) * 0.05 });
  }
  if (u > 7.0) pose(D, { ry: w.ry + seg(u, 7.0, 7.6) * 0.5, bow: Math.sin(lower * Math.PI) * 0.35, armLx: -0.9 * Math.sin(lower * Math.PI), armRx: -0.9 * Math.sin(lower * Math.PI), nod: u > 8.6 ? 0.35 : 0 });
  place(M, 0.9, -3.3); pose(M, { ry: -0.5, armRx: u > 8.5 ? -2.6 + Math.sin(u * 7) * 0.25 : -0.1, armRz: u > 8.5 ? 0.3 : 0 });
  sets.A.userData.cat.userData.tail.rotation.y = Math.sin(u * 2) * 0.5;
  { const fx = Math.min(w.x, -1.7) + 0.6, k = u / 10.5;
    const tx = fx - 0.3;
    camera.position.set(tx - 2.2 + k * 0.6, lerp(3.4, 1.7, ease(k)), lerp(8.2, 3.2, ease(k))); camera.lookAt(tx + 0.6, lerp(2.6, 1.3, ease(k)), -2.6);
    if (camera.fov !== 46) { camera.fov = 46; camera.updateProjectionMatrix(); } }
}
function S2(u) { // age 7 - bayram, kiss grandpa's hand
  show('B', ['dede', 'nine', 'k7']); applyLight(LIGHT.bayram);
  const Dd = P.dede, N = P.nine, K = P.k7;
  const chairW = worldOf(sets.B.userData.dedeChair, new THREE.Vector3(0, 0, 0));
  Dd.root.position.set(chairW.x, 0, chairW.z);
  const kiss = seg(u, 4.8, 5.6) * (1 - seg(u, 6.6, 7.2));
  const give = seg(u, 7.4, 8.2);
  pose(Dd, { sit: true, y: 0.12 + 0.51 - 0.84 * Dd.s + 0.12 * Dd.s, ry: 0, armRx: -1.25 * Math.max(kiss, give * (1 - seg(u, 8.6, 9.2))) - 0.2, armLx: -0.6, nod: 0.1 + kiss * 0.2, look: -0.15 });
  const deck = 0.12;
  const w = walkPath(K, [[4.2, 5.2], [2.8, 1.5], [chairW.x - 0.12, chairW.z + 0.95]], 0.3, 4.6, u, 7, {});
  K.root.position.y = (K.root.position.z < -1.8 ? deck : 0);
  if (u > 4.6) {
    pose(K, { y: deck, ry: Math.PI, bow: kiss * 0.75, nod: -kiss * 0.2 + (u > 7.2 && u < 8.4 ? -0.15 : 0), armRx: -1.3 * kiss - 1.0 * give * (1 - seg(u, 8.8, 9.4)), armLx: -1.3 * kiss, armRz: 0.1 });
  }
  place(N, chairW.x - 1.6, chairW.z - 0.3); pose(N, { y: deck, ry: 0.3, armLx: -0.5, armRx: -0.5, armLz: -0.25, armRz: -0.25, look: 0.25, nod: 0.05 + Math.sin(u * 2) * 0.03 });
  if (give > 0 && u < 9.6) {
    note.visible = true;
    const hd = worldOf(Dd.arms[1].hand, new THREE.Vector3(0, -0.05, 0)), hk = worldOf(K.arms[1].hand, new THREE.Vector3(0, -0.05, 0));
    const k2 = seg(u, 8.0, 8.6);
    note.position.lerpVectors(hd, hk, k2);
  }
  cam(u, [[0, [-6.5, 2.6, 7.5], [0.2, 1.2, -2.0], 46], [5.0, [-2.6, 1.5, 2.6], [1.1, 0.9, -2.2], 44], [10.5, [-1.0, 1.25, 1.6], [1.5, 0.95, -2.4], 42]]);
}
function S3(u) { // age 9 - street football at dusk
  show('C', ['k9', 'f1', 'f2', 'f3']); applyLight(LIGHT.morning, LIGHT.dusk, 0.55 + seg(u, 4, 10.5) * 0.45);
  const K = P.k9, A = P.f1, B2 = P.f2, Cc = P.f3, ball = sets.C.userData.ball;
  // passes
  const pts = [[-3, 0.4], [1.5, -0.8], [4.2, 0.6], [0.2, 1.2], [-2.6, -0.5], [2.0, 0.3], [5.8, -0.2]];
  const holders = [K, A, B2, Cc, K, A, null];
  const tp = [0.0, 1.3, 2.6, 3.9, 5.2, 6.3, 7.4];
  const hp = (i, tt) => [pts[i][0] + Math.sin(tt * 1.7 + i) * 0.25, pts[i][1] + Math.cos(tt * 1.3 + i) * 0.2];
  // players drift toward their pass positions
  const pos = { k9: [[-3, 0.4], [-2.6, -0.5]], f1: [[1.5, -0.8], [2.0, 0.3]], f2: [[4.2, 0.6], [4.8, 0.9]], f3: [[0.2, 1.2], [0.6, 1.5]] };
  const actors = { k9: K, f1: A, f2: B2, f3: Cc };
  let bi = 0; while (bi < tp.length - 2 && u > tp[bi + 1]) bi++;
  const kb = clamp((u - tp[bi]) / (tp[bi + 1] - tp[bi]));
  const bx = lerp(pts[bi][0], pts[bi + 1][0], kb), bz = lerp(pts[bi][1], pts[bi + 1][1], kb);
  if (u < 7.4) { ball.position.set(bx, 0.13 + Math.abs(Math.sin(kb * Math.PI)) * 0.35, bz); }
  else { const r = seg(u, 7.4, 9.0); ball.position.set(lerp(5.8, 7.6, r), 0.13, lerp(-0.2, -0.6, r)); }
  ball.rotation.x = u * 6; ball.rotation.z = u * 4;
  const leave = { k9: [[-3, 0], [-3.5, 3.4], [-8, 3.6]], f1: [[2, 0], [3, -3.6], [11, -3.6]], f2: [[4.5, 0.6], [6.5, 3.6], [14, 3.6]], f3: [[0.4, 1.3], [-1, -3.6], [-12, -3.6]] };
  for (const k in actors) {
    const c = actors[k];
    if (u < 7.6) {
      const p0 = pos[k][0], p1 = pos[k][1];
      const kk = seg(u, 0.5, 6.8);
      const x = lerp(p0[0], p1[0], kk) + Math.sin(u * 1.2 + k.length) * 0.15, z = lerp(p0[1], p1[1], kk);
      c.root.position.x = x; c.root.position.z = z;
      const dx = ball.position.x - x, dz = ball.position.z - z;
      const kicking = holders[bi] === c && kb < 0.18;
      pose(c, { ry: Math.atan2(dx, dz), walk: u * 9, walkAmt: 0.35 + Math.abs(Math.sin(u + k.length)) * 0.3, armLx: 0, armRx: 0 });
      if (kicking) { c.legs[1].thigh.rotation.x = -0.9 * Math.sin(kb / 0.18 * Math.PI); c.legs[1].knee.rotation.x = 0.3; }
    } else {
      const startT = 7.6 + (k.length % 3) * 0.25;
      walkPath(c, leave[k], startT, 10.5 + 1.5, u, 7.5, {});
      if (u < startT) pose(c, { ry: Math.atan2(leave[k][1][0] - leave[k][0][0], leave[k][1][1] - leave[k][0][1]) });
      if (k === 'k9' && u > 9.2) c.head.rotation.y = 0.6 * seg(u, 9.2, 9.8); // looks back
    }
  }
  sets.C.userData.cat.userData.tail.rotation.y = Math.sin(u * 1.5) * 0.6;
  cam(u, [[0, [-9, 1.6, 7.0], [1.2, 0.9, -0.5], 46], [10.5, [-6.0, 2.2, 5.8], [1.0, 0.8, 0.2], 46]]);
}
function S4(u) { // age 11 - mom calls from balcony
  show('A', ['mom', 'k11']); applyLight(LIGHT.dusk, LIGHT.dusk, 0);
  const M = P.mom, K = P.k11;
  const bp = sets.A.userData.balcony;
  M.root.position.set(bp.x + 0.1, bp.y, bp.z + 0.25);
  const call = seg(u, 0.8, 1.4) * (1 - seg(u, 6.8, 7.4));
  pose(M, { y: bp.y, ry: 0.15, bow: 0.18 * call, armRx: -2.5 * call + Math.sin(u * 6) * 0.2 * call, armRz: 0.3 * call, armLx: -0.9 * call, nod: -0.05 });
  sets.A.userData.balconyChair.visible = false; sets.A.userData.balTable.visible = false;
  // kid with ball in courtyard
  const kx = -1.4 + Math.sin(u * 0.8) * 0.3, kz = 3.3;
  K.root.position.set(kx, 0, kz);
  const lookUp = seg(u, 2.0, 2.6) * (1 - seg(u, 7.0, 7.6));
  const five = seg(u, 4.8, 5.3) * (1 - seg(u, 6.6, 7.0));
  pose(K, { ry: lerp(0.9, Math.atan2(bp.x - kx, bp.z - kz), lookUp), nod: -0.55 * lookUp, armRx: -2.2 * five, armRz: 0.15 * five, walk: u > 7.4 ? u * 8 : 0, walkAmt: u > 7.4 ? 0.4 : 0 });
  if (five > 0.5) K.arms[1].sh.rotation.z = -0.15 + Math.sin(u * 10) * 0.08;
  cam(u, [[0, [3.2, 1.1, 9.8], [-4.0, 3.0, -4.5], 48], [10.5, [1.2, 1.4, 7.6], [-4.6, 3.3, -5.0], 46]]);
}
function S5(u) { // age 15 - sunday breakfast under çardak
  show('B', ['dede15', 'nine15', 'dad15', 'mom15', 'k15', 'sis']); applyLight(LIGHT.bayram);
  const seats = sets.B.userData.seats;
  const order = ['dede15', 'nine15', 'k15', 'dad15', 'sis', 'mom15'];
  const seatY = 0.51;
  order.forEach((k, i) => {
    const c = P[k]; const [x, z, ry] = seats[i];
    c.root.position.set(x, 0, z);
    const talk = Math.sin(u * (1.3 + i * 0.27) + i) * 0.12;
    pose(c, { sit: true, y: seatY - 0.84 * c.s + 0.12 * c.s, ry, armLx: -1.2, armRx: -1.15 + talk * 0.6, look: talk * 1.4, nod: Math.max(0, Math.sin(u * 3.1 + i * 2)) * (k === 'dede15' ? 0.12 : 0.05) });
  });
  // mom stands and pours tea 2.0 - 6.0
  const M = P.mom15, [mx, mz, mry] = seats[5];
  const stand = seg(u, 1.6, 2.4) * (1 - seg(u, 6.0, 6.8));
  if (stand > 0) {
    const c = M;
    pose(c, { sit: stand < 0.5, y: stand < 0.5 ? seatY - 0.84 * c.s + 0.12 * c.s : 0, ry: mry, bow: 0.25 * stand, armRx: -1.3 * stand, armLx: -0.8 * stand, nod: 0.25 });
    const K = sets.B.userData.kettle;
    const hand = worldOf(c.arms[1].hand, new THREE.Vector3(0, -0.12, 0));
    const T = sets.B.userData.table; T.updateMatrixWorld(true);
    const local = T.worldToLocal(hand.clone());
    const pour = seg(u, 2.6, 3.0) * (1 - seg(u, 5.2, 5.6));
    K.position.set(lerp(0.0, local.x, stand), lerp(0.84, local.y - 0.25, stand), lerp(0.02, local.z, stand));
    K.rotation.z = -0.7 * pour;
  } else { sets.B.userData.kettle.position.set(0.0, 0.84, 0.02); sets.B.userData.kettle.rotation.z = 0; }
  sets.B.userData.food.visible = true; sets.B.userData.lone.visible = false;
  const cx = 5.2, cz = 2.6, R = 7.0;
  cam(u, [[0, [cx + Math.sin(0.5) * R, 3.2, cz + Math.cos(0.5) * R], [cx, 0.8, cz], 40], [10.5, [cx + Math.sin(-0.12) * (R - 1.4), 2.6, cz + Math.cos(-0.12) * (R - 1.4)], [cx, 0.85, cz], 40]]);
}
function S6(u) { // age 18 - otogar, water poured behind
  show('E', ['k18', 'mom', 'dad']); applyLight(LIGHT.otogar);
  const bus = sets.E.userData.bus;
  const go = clamp((u - 5.0) / 5.5);
  bus.position.set(-1.5 + go * go * 16, 0, -1.4);
  const K = P.k18, M = P.mom, D = P.dad;
  const doorX = bus.position.x + 4.3;
  // kid hugs mom then boards
  const hug = seg(u, 0.4, 1.0) * (1 - seg(u, 2.4, 2.9));
  if (u < 3.0) {
    place(K, 3.0, 1.6); pose(K, { y: 0.25, ry: -1.2, armLx: -1.4 * hug, armRx: -1.4 * hug, armLz: -0.35 * hug, armRz: -0.35 * hug, bow: 0.1 * hug });
  } else if (u < 4.4) {
    const k = seg(u, 3.0, 4.2);
    walkPath(K, [[3.0, 1.6], [2.85, 0.4]], 3.0, 4.2, u, 7);
    K.root.position.y = 0.25 * (1 - k);
  } else K.root.visible = false;
  place(M, 2.0, 2.0);
  const throwK = seg(u, 6.2, 6.7);
  pose(M, { y: 0.25, ry: lerp(1.0, 2.6, seg(u, 4.6, 5.6)), armLx: -1.4 * hug - 1.0 * seg(u, 5.6, 6.0) - 0.8 * throwK, armRx: -1.4 * hug - 1.0 * seg(u, 5.6, 6.0) - 0.8 * throwK, armLz: -0.35 * hug, armRz: -0.35 * hug, bow: 0.1 * hug + 0.15 * throwK });
  place(D, 4.2, 2.4);
  const wave = seg(u, 4.6, 5.0);
  pose(D, { y: 0.25, ry: lerp(-0.8, -2.2, seg(u, 4.2, 5.4)), armRx: -2.7 * wave + Math.sin(u * 7) * 0.25 * wave, armRz: 0.35 * wave, armLx: -0.1 });
  // bowl in mom's hands
  const bowl = sets.E.userData.bowl;
  const hp = worldOf(M.arms[0].hand, new THREE.Vector3(0, -0.06, 0)), hp2 = worldOf(M.arms[1].hand, new THREE.Vector3(0, -0.06, 0));
  bowl.position.set((hp.x + hp2.x) / 2, (hp.y + hp2.y) / 2 - 0.05, (hp.z + hp2.z) / 2); bowl.visible = u > 5.4;
  bowl.rotation.x = -1.4 * throwK;
  const parts = sets.E.userData.water.userData.parts;
  parts.forEach((m, i) => {
    const t0 = 6.45 + (i % 9) * 0.025, tt = u - t0;
    if (tt < 0 || tt > 1.2) { m.visible = false; return; }
    m.visible = true;
    const dir = [Math.sin(M.root.rotation.y) * (2.2 + (i % 5) * 0.25), 0, Math.cos(M.root.rotation.y) * (2.2 + (i % 5) * 0.25)];
    const side = ((i * 7) % 5 - 2) * 0.12;
    const y = bowl.position.y + 1.6 * tt - 4.9 * tt * tt;
    m.position.set(bowl.position.x + dir[0] * tt + side * Math.cos(M.root.rotation.y), Math.max(0.27, y), bowl.position.z + dir[2] * tt - side * Math.sin(M.root.rotation.y));
    if (y < 0.27) m.scale.set(0.16, 0.01, 0.16); else m.scale.set(0.07, 0.07, 0.07);
  });
  const sm = sets.E.userData.sign;
  if (!sm.userData.tex) { sm.material[4] = new THREE.MeshLambertMaterial({ map: signTexture(['12', 'PERON']) }); sm.userData.tex = 1; }
  cam(u, [[0, [-2.5, 1.9, 9.0], [2.8, 1.4, 0.8], 46], [10.5, [-0.5, 1.7, 8.2], [3.5, 1.3, 0.6], 44]]);
}
function S7(u) { // age 35 - empty chair on balcony
  show('A', ['me']); applyLight(LIGHT.overcast);
  sets.A.userData.balconyChair.visible = true; sets.A.userData.balTable.visible = true;
  const bp = sets.A.userData.balcony, Me = P.me;
  Me.root.position.set(bp.x - 0.9, bp.y, bp.z - 0.05);
  pose(Me, { y: bp.y, ry: 0.9, nod: 0.35, armLx: -0.1, armRx: -0.1 });
  cam(u, [[0, [-1.0, 3.2, 3.2], [-5.0, 3.7, -5.6], 44], [5.5, [-2.4, 3.6, 1.0], [-5.2, 3.6, -5.5], 40]]);
}
function S7b(u) { // empty breakfast table
  show('B', []); applyLight(LIGHT.overcast);
  sets.B.userData.food.visible = false; sets.B.userData.lone.visible = true;
  sets.B.userData.kettle.position.set(0, 0.84, 0.02); sets.B.userData.kettle.rotation.z = 0;
  const cx = 5.2, cz = 2.6;
  cam(u, [[0, [cx - 4.6, 2.4, cz + 4.2], [cx, 0.75, cz], 42], [5.5, [cx - 3.4, 1.9, cz + 3.0], [cx, 0.75, cz], 40]]);
}
function S8(u) { // age 35 - call mom, visit, hug
  show('A', ['me', 'mom2', 'dad2']); applyLight(LIGHT.golden);
  sets.A.userData.balconyChair.visible = true; sets.A.userData.balTable.visible = true;
  const Me = P.me, M = P.mom2, D = P.dad2;
  const onPhone = seg(u, 0.4, 0.9) * (1 - seg(u, 6.2, 6.8));
  if (u < 6.6) {
    walkPath(Me, [[5.5, 6.8], [1.2, 5.9], [0.5, 2.6]], 0.6, 6.4, u, 6, { armRx: -2.25 * onPhone, armRz: 0.62 * onPhone, look: 0, nod: 0.05 });
  } else {
    walkPath(Me, [[0.5, 2.6], [0.15, 0.4]], 6.6, 9.0, u, 6.5, {});
  }
  if (onPhone > 0.05) { phone.visible = true; const hp = worldOf(Me.arms[1].hand, new THREE.Vector3(0, -0.04, 0.0)); phone.position.copy(hp); phone.rotation.set(0, Me.root.rotation.y, 0); }
  // parents come out
  const out = seg(u, 4.6, 7.4);
  M.root.position.set(lerp(0.2, 0.0, out), 0.15 * (1 - out), lerp(-5.2, -0.9, out)); D.root.position.set(lerp(0.3, 1.0, out), 0.15 * (1 - out), lerp(-5.6, -1.6, out));
  const hug = seg(u, 9.0, 9.8) * (1 - seg(u, 12.6, 13.2));
  pose(M, { ry: 0, walk: out * 18, walkAmt: u > 4.6 && u < 7.4 ? 1 : 0, armLx: -1.45 * hug, armRx: -1.45 * hug, armLz: -0.3 * hug, armRz: -0.3 * hug });
  M.root.rotation.y = lerp(0, 0.1, seg(u, 7.0, 8.4));
  pose(D, { ry: lerp(0, -0.6, seg(u, 7.2, 8.6)), walk: out * 16, walkAmt: u > 4.8 && u < 7.4 ? 1 : 0, armRx: hug > 0.3 ? -1.0 : -0.1, armRz: hug > 0.3 ? 0.4 : 0, nod: 0.1 });
  if (u > 9.0) { Me.root.position.set(0.15, 0, 0.4); pose(Me, { ry: Math.atan2(M.root.position.x - 0.15, M.root.position.z - 0.4), armLx: -1.45 * hug, armRx: -1.45 * hug, armLz: -0.3 * hug, armRz: -0.3 * hug, nod: 0.1 }); }
  M.root.position.x = lerp(M.root.position.x, 0.05, hug); M.root.position.z = lerp(M.root.position.z, -0.3, hug);
  sets.A.userData.cat.userData.tail.rotation.y = Math.sin(u * 2) * 0.5;
  if (u < 9.5) {
    const mx = Me.root.position.x, mz = Me.root.position.z, k = seg(u, 0, 9.5);
    camera.position.set(lerp(-5.0, -2.6, k), lerp(2.1, 1.7, k), lerp(13.0, 5.6, k));
    camera.lookAt(lerp(mx, 0.2, seg(u, 6.5, 9.5)) , 1.35, lerp(mz, -0.2, seg(u, 6.5, 9.5)));
    if (camera.fov !== 44) { camera.fov = 44; camera.updateProjectionMatrix(); }
  } else cam(u, [[9.5, [-2.6, 1.7, 5.6], [0.2, 1.35, -0.2], 44], [13.4, [-6.5, 4.6, 10.5], [0.0, 2.0, -1.0], 46]]);
}

// ---------- text timeline ----------
const SUBS = [
  [3.8, 7.3, 'Bir gün baban seni son kez<br>omuzlarında taşıdı.'],
  [7.6, 10.1, 'Sonra yere indirdi.<br>İkiniz de bilmiyordunuz.'],
  [11.3, 15.6, 'Bir bayram sabahı dedenin elini<br>son kez öptün.'],
  [16.0, 20.4, 'Avucuna sıkıştırdığı harçlığı<br>hâlâ hatırlıyorsun.'],
  [21.8, 26.0, 'Bir akşam mahallede<br>son kez top oynadınız.'],
  [26.4, 30.9, 'Kimse “son maç” demedi.<br>Herkes evine dağıldı.'],
  [32.3, 36.6, 'Bir gün annen balkondan son kez<br>seslendi: “Yemek hazır!”'],
  [37.0, 41.4, 'Sen “Beş dakika daha!” dedin.'],
  [42.8, 47.0, 'Bir pazar sabahı o sofraya<br>son kez hep birlikte oturdunuz.'],
  [47.4, 51.9, 'Çaylar tazelendi.<br>Kimse kalkmak istemedi.'],
  [53.3, 57.6, 'Arkandan su döktüler,<br>çabuk dönesin diye.'],
  [58.0, 62.4, 'Bilmiyordun. Kimse bilmez.'],
  [63.6, 68.0, 'Kimse sana bunun son kez<br>olduğunu söylemez.'],
  [69.0, 73.5, 'Bunu ancak sonradan anlarsın.'],
  [74.8, 78.6, 'Ama bazı son kezler<br>henüz yaşanmadı.'],
  [79.0, 82.4, 'Annene bir telefon aç.<br>Babanı ziyaret et.'],
  [82.8, 86.2, 'Git, bir tane daha yaşa.'],
];
const COUNTER = [
  [0, 10.5, 5, 'KALAN OMUZDA TAŞINMA', 7.9, '1996 · Apartman önü'],
  [10.5, 21, 7, 'KALAN BAYRAM HARÇLIĞI', 18.9, '1998 · Kurban Bayramı sabahı'],
  [21, 31.5, 9, 'KALAN MAHALLE MAÇI', 28.6, '2000 · Mahalle arası'],
  [31.5, 42, 11, 'KALAN BALKON ÇAĞRISI', 38.9, '2002 · Akşam ezanından önce'],
  [42, 52.5, 15, 'KALAN PAZAR KAHVALTISI', 49.4, '2006 · Dedemlerin bahçesi'],
  [52.5, 63, 18, 'KALAN SON KEZLER', null, '2009 · Otogar, 12. peron'],
  [63, 74, 35, 'KALAN SON KEZLER', null, '2026 · Bugün'],
  [74, 87.4, 35, 'KALAN SON KEZLER', 82.8, '2026 · Bu akşam'],
];
const $ = id => document.getElementById(id);
function fadeWin(t, a, b, fi = 0.55, fo = 0.55) { return clamp((t - a) / fi) * clamp((b - t) / fo); }
function texts(t) {
  $('t0').style.opacity = fadeWin(t, 0.3, 3.6, 0.7, 0.6);
  let s = SUBS.find(x => t >= x[0] - 0.1 && t <= x[1] + 0.1);
  const sub = $('sub');
  if (s) { if (sub.dataset.k !== s[2]) { sub.innerHTML = s[2]; sub.dataset.k = s[2]; } sub.style.opacity = fadeWin(t, s[0], s[1], 0.5, 0.5); }
  else sub.style.opacity = 0;
  const c = COUNTER.find(x => t >= x[0] && t < x[1]) || COUNTER[COUNTER.length - 1];
  const [a, b, age, lab, ch, cap] = c;
  $('agen').textContent = age; $('cap').textContent = cap;
  let val, col = 'rgba(232,235,238,.88)';
  if (lab === 'KALAN SON KEZLER') val = (ch && t >= ch) ? '+1' : '?';
  else val = (t >= ch) ? '0' : '1';
  if (ch && t >= ch) { const f = clamp(1 - (t - ch) / 1.6); col = `rgba(${Math.round(lerp(232, 240, f))},${Math.round(lerp(235, 150, f))},${Math.round(lerp(238, 90, f))},${lerp(.88, 1, f)})`; }
  $('lab').textContent = lab + ': ' + val; $('lab').style.color = col;
  $('cap').style.opacity = fadeWin(t, a + 0.4, b - 0.2, 0.8, 0.5);
  $('counter').style.opacity = t < 86.6 ? clamp((86.9 - t) / 0.6) : 0;
  // dips between scenes
  let dip = 0;
  for (const x of SC.slice(1)) dip = Math.max(dip, 1 - Math.abs(t - x.a) / 0.42);
  $('dip').style.opacity = clamp(dip) * 0.92;
  const dk = clamp((t - 86.6) / 0.8);
  $('dark').style.opacity = dk;
  $('endT').style.opacity = fadeWin(t, 87.4, 200, 0.9, 1);
  $('endS1').style.opacity = fadeWin(t, 88.1, 200, 0.7, 1);
  $('endS2').style.opacity = fadeWin(t, 88.6, 200, 0.7, 1);
}

window.renderAt = function (t) {
  const sc = SC.find(x => t >= x.a && t < x.b) || SC[SC.length - 1];
  sc.fn(Math.max(0, t - sc.a));
  sun.target.position.set(camera.position.x * 0.5, 0, camera.position.z * 0.5 - 2);
  sun.position.add(sun.target.position);
  renderer.render(scene, camera);
  texts(t);
  return true;
};
window.DURATION = 93;
document.fonts.ready.then(() => { window.READY = true; });

window.__S = { THREE, scene, camera, renderer, P, sets, pose, show, applyLight, LIGHT, worldOf, teaGlass, cyl, box, mat, group, sun, note, phone };
window.avatar = function (v) {
  const S = 800;
  renderer.setSize(S, S); camera.aspect = 1; camera.updateProjectionMatrix();
  document.getElementById('stage').style.width = S + 'px'; document.getElementById('stage').style.height = S + 'px';
  for (const id of ['texts', 'dip', 'dark']) document.getElementById(id).style.display = 'none';
  v(window.__S);
  sun.target.position.set(camera.position.x * 0.5, 0, camera.position.z * 0.5 - 2);
  sun.position.add(sun.target.position);
  renderer.render(scene, camera);
};
