import * as THREE from '../../engine/three.module.js';

// ===== Bölüm metinleri (açılış başlığı + kapanış kartı) =====
const EPTEXT = {
  title: 'Eve kaç kez daha<br>gideceksin?',
  sub: 'VERANDADAKİ IŞIĞIN ANLATTIĞI',
  endTitle: 'Ebeveynlerini bir daha<br>kaç kez göreceksin?',
  end1: 'SON KEZ NE ZAMAN EVE GİTTİN?',
  end2: '@bilseydin.tr',
};
document.getElementById('t0').innerHTML = EPTEXT.title;
document.getElementById('endT').innerHTML = EPTEXT.endTitle;
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

// === SET H: verandalı ev, basamak, bahçe yolu, salıncak ===
function pumpkin(parent, x, y, z, s = 1) {
  box(parent, 0.4 * s, 0.3 * s, 0.4 * s, 0xd8742a, x, y, z);
  box(parent, 0.3 * s, 0.32 * s, 0.46 * s, 0xc9661f, x, y - 0.01, z, { cast: false });
  box(parent, 0.05 * s, 0.1 * s, 0.05 * s, 0x4f5a2a, x, y + 0.3 * s, z, { cast: false });
}
function buildH() {
  const g = group(scene);
  const gm = new THREE.MeshLambertMaterial({ color: 0x5e8a3e, flatShading: true });
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), gm); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; g.add(gr);
  g.userData.groundMat = gm;
  const wall = 0xe9dfcc, trim = 0xf4f1ea, DH = 0.45;
  // ev gövdesi
  box(g, 11, 6.6, 5.6, wall, 0, 0, -7.2);
  box(g, 4.7, 6.6, 0.4, wall, -3.15, 0, -4.2); box(g, 4.7, 6.6, 0.4, wall, 3.15, 0, -4.2);
  box(g, 1.6, 3.9, 0.4, wall, 0, DH + 2.25, -4.2);
  const inner = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xd99a55 }));
  inner.scale.set(1.6, 2.3, 0.05); inner.position.set(0, DH + 1.15, -4.36); g.add(inner); g.userData.inner = inner;
  // çatı
  const r1 = box(g, 11.8, 0.3, 3.9, 0x8a3a2a, 0, 0, -5.6, { center: true }); r1.position.y = 7.5; r1.rotation.x = 0.62;
  const r2 = box(g, 11.8, 0.3, 3.9, 0x7a3123, 0, 0, -8.8, { center: true }); r2.position.y = 7.5; r2.rotation.x = -0.62;
  box(g, 11, 1.2, 5.2, wall, 0, 6.5, -7.2); box(g, 7, 1.0, 4.6, wall, 0, 7.5, -7.2);
  // pencereler
  windowBox(g, 1.3, 1.5, -3.2, DH + 0.9, -3.98); windowBox(g, 1.3, 1.5, 3.2, DH + 0.9, -3.98);
  windowBox(g, 1.2, 1.3, -3.2, 4.3, -3.98); windowBox(g, 1.2, 1.3, 0, 4.3, -3.98); windowBox(g, 1.2, 1.3, 3.2, 4.3, -3.98);
  for (const x of [-4.2, -2.2, 2.2, 4.2]) box(g, 0.45, 1.6, 0.06, 0x2f3a46, x, DH + 0.85, -3.97, { cast: false });
  // kapı (menteşeli)
  const door = group(g); door.position.set(-0.75, DH, -4.02); g.userData.door = door;
  box(door, 1.5, 2.3, 0.08, 0x6e2a2a, 0.75, 0, 0);
  box(door, 0.08, 0.08, 0.1, 0xd6b24a, 1.3, 1.1, 0.06);
  box(g, 1.8, 0.14, 0.12, trim, 0, DH + 2.32, -3.98, { cast: false });
  // fener + ışık
  const lm = new THREE.MeshLambertMaterial({ color: 0xfff1c9, emissive: 0xffc46a, emissiveIntensity: 0 }); g.userData.lanternMat = lm;
  box(g, 0.26, 0.4, 0.2, 0x26221f, 1.25, DH + 1.6, -3.9, { cast: false });
  box(g, 0.2, 0.3, 0.16, 0, 1.25, DH + 1.65, -3.86, { mat: lm, cast: false });
  const pl = new THREE.PointLight(0xffc27a, 0, 11, 1.4); pl.position.set(1.15, DH + 1.8, -3.4); g.add(pl); g.userData.porch = pl;
  // veranda
  box(g, 11, DH, 2.6, 0x8a6240, 0, 0, -2.7);
  box(g, 2.4, 0.22, 0.55, 0x9c958a, 0, 0, -1.125);
  box(g, 11.4, 0.2, 3.0, trim, 0, DH + 2.75, -2.6);
  for (const x of [-5.2, -1.4, 1.4, 5.2]) box(g, 0.2, 2.75, 0.2, trim, x, DH, -1.55);
  for (const [a, b] of [[-5.2, -1.4], [1.4, 5.2]]) {
    const w = b - a, n = Math.round(w / 0.28);
    box(g, w, 0.07, 0.08, trim, (a + b) / 2, DH + 0.85, -1.55, { cast: false });
    box(g, w, 0.06, 0.08, trim, (a + b) / 2, DH + 0.06, -1.55, { cast: false });
    for (let i = 1; i < n; i++) box(g, 0.05, 0.8, 0.05, trim, a + i * w / n, DH + 0.06, -1.55, { cast: false });
  }
  geranium(g, -2.2, DH, -3.6); geranium(g, 2.2, DH, -3.6);
  g.userData.pchair = chair(g, -3.4, DH, -3.0, 0.4, 0x8a5a36);
  // bal kabakları (sonbahar)
  const PK = group(g); g.userData.pumpkins = PK;
  pumpkin(PK, -1.0, 0.22, -1.05, 1.0); pumpkin(PK, -1.05, DH, -1.75, 0.8); pumpkin(PK, 1.0, 0.22, -1.0, 0.75); pumpkin(PK, -1.6, 0, -0.5, 1.1);
  // bahçe yolu
  box(g, 1.5, 0.04, 11, 0x9a6650, 0, 0, 4.6, { cast: false });
  for (let i = 0; i < 18; i++) box(g, 1.5, 0.045, 0.04, 0x7a4c3c, 0, 0, -0.6 + i * 0.6, { cast: false });
  // çitler, çalılar, ağaçlar
  for (const x of [-4.5, -3.2, 3.2, 4.5]) box(g, 1.2, 0.7, 0.8, 0x3f6e33, x, 0, -0.6);
  tree(g, -8.5, -1, 1.25, 0x6b4a2f, 0x4f7f3a); tree(g, 9, 1.5, 1.1, 0x6b4a2f, 0x5a8a3f); pine(g, -12, -6, 1.8); pine(g, 13, -7, 1.6);
  for (let i = -14; i <= 14; i++) { if (Math.abs(i) <= 1) continue; box(g, 0.1, 0.8, 0.08, trim, i * 0.75, 0, 10.5); }
  box(g, 21, 0.07, 0.06, trim, -0.0, 0.62, 10.5, { cast: false });
  lamp(g, -2.4, 11.2); lamp(g, 6, 11.2);
  // komşu evler
  for (const [x, c] of [[-17, 0xd9c8b0], [17, 0xcfd6d8]]) { const b = group(g); b.position.set(x, 0, -7); box(b, 9, 6, 6, c, 0, 0, 0); windowBox(b, 1.2, 1.3, -2.5, 1.4, 3.02); windowBox(b, 1.2, 1.3, 2.5, 1.4, 3.02); windowBox(b, 1.2, 1.3, 0, 4.0, 3.02); }
  // salıncak
  const SW = group(g); SW.position.set(5.6, 0, 3.0); g.userData.swing = SW;
  for (const x of [-1.45, 1.45]) { box(SW, 0.14, 2.7, 0.14, 0x7a5434, x, 0, -0.35); box(SW, 0.14, 2.7, 0.14, 0x7a5434, x, 0, 0.35); }
  box(SW, 3.1, 0.14, 0.14, 0x7a5434, 0, 2.62, 0);
  box(SW, 3.2, 0.12, 0.9, 0xe4dccb, 0, 2.76, 0);
  const piv = group(SW); piv.position.y = 2.6; g.userData.pivot = piv;
  for (const x of [-0.95, 0.95]) box(piv, 0.03, 1.95, 0.03, 0x555555, x, -1.95, 0.0, { cast: false });
  box(piv, 2.1, 0.08, 0.58, 0xb04a3a, 0, -1.98, 0);
  box(piv, 2.1, 0.5, 0.06, 0xb04a3a, 0, -1.98, -0.27);
  g.userData.seatTop = -1.9;
  // kar taneleri
  const SN = group(g); g.userData.snow = SN; SN.userData.p = [];
  for (let i = 0; i < 160; i++) { const m = box(SN, 0.05, 0.05, 0.05, 0xffffff, 0, 0, 0, { cast: false }); SN.userData.p.push([m, ((i * 73) % 100) / 100, ((i * 37) % 100) / 100, ((i * 91) % 100) / 100]); }
  return g;
}

sets.A = buildA(); sets.B = buildB(); sets.H = buildH();

// ---------- oyuncular ----------
const SKIN = 0xe2b38c, SKIN2 = 0xd7a37b;
const P = {};
function C(name, o) { P[name] = makeChar(o); P[name].root.visible = false; return P[name]; }
const ME = { s: 1.0, shirt: 0x355e94, pants: 0x383a44, hair: 0x4a2f1f, beard: 0x4a2f1f };
C('me', ME);
C('meBag', Object.assign({}, ME, { backpack: 0x3d4a3a }));
C('meW', Object.assign({}, ME, { shirt: 0x2f3a4c, sleeve: 0x2f3a4c, vest: 0x5a3d34 }));
C('meS', ME);
const DADA = { s: 1, shirt: 0x4f7a3a, pants: 0x34343e, hair: 0x6f6a66, mustache: 0x5d5752, skin: SKIN2 };
const MOMA = { s: 0.95, shirt: 0xa83a4c, pants: 0x4a3046, hair: 0x4a3428, hairStyle: 'bun' };
C('dadA', DADA); C('momA', MOMA); C('momS', MOMA);
C('dadB', { s: 0.98, shirt: 0x4f7a3a, pants: 0x34343e, hair: 0xe4e4e0, mustache: 0xdcdcd8, skin: SKIN2, vest: 0x6b5a48 });
C('momB', { s: 0.93, shirt: 0xa83a4c, pants: 0x4a3046, hair: 0xc9c7c2, hairStyle: 'bun', vest: 0x7a5a50 });
sets.H.userData.pivot.add(P.meS.root); sets.H.userData.pivot.add(P.momS.root);
const phone = box(scene, 0.08, 0.15, 0.02, 0x1d1f24, 0, 0, 0, { cast: false });
const phoneGlow = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xcfe2ff })); phoneGlow.scale.set(0.065, 0.13, 0.005); phone.add(phoneGlow); phoneGlow.position.z = 0.6;
const phoneLight = new THREE.PointLight(0xbcd4ff, 0, 1.6, 1.5); scene.add(phoneLight);

// ---------- ışık önayarları ----------
const LIGHT = {
  morning: { sky: 0xbcd4ea, fog: 0xcfdcea, hs: 0xe3ecf7, hg: 0x7a8a5a, hi: 1.05, sc: 0xfff2dc, si: 1.55, sp: [14, 22, 12], lamps: 0, wins: 0, porch: 0 },
  summer: { sky: 0xc3dcf0, fog: 0xd6e3ef, hs: 0xeef3fa, hg: 0x7d8f58, hi: 1.1, sc: 0xfff6e6, si: 1.6, sp: [-12, 20, 14], lamps: 0, wins: 0, porch: 0 },
  golden: { sky: 0xf0c48e, fog: 0xe9c39a, hs: 0xfbe0bd, hg: 0x7a6a4c, hi: 0.95, sc: 0xffc683, si: 1.45, sp: [-18, 9, 14], lamps: 0.6, wins: 0.5, porch: 0.6 },
  dusk: { sky: 0xb98a86, fog: 0x9b7f84, hs: 0xd9b4a8, hg: 0x4d4a52, hi: 0.8, sc: 0xffb877, si: 0.8, sp: [-20, 7, 6], lamps: 1.6, wins: 0.9, porch: 1 },
  night: { sky: 0x17223a, fog: 0x1c2741, hs: 0x6274a0, hg: 0x2a2c36, hi: 0.8, sc: 0x9fb4dc, si: 0.55, sp: [-10, 18, 12], lamps: 1.8, wins: 1.0, porch: 1 },
  winter: { sky: 0x26324e, fog: 0x3b4664, hs: 0x8494b6, hg: 0x8a909c, hi: 0.95, sc: 0xb9c9e8, si: 0.5, sp: [-8, 18, 12], lamps: 1.8, wins: 1.0, porch: 1 },
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
  const pk = lerp(L.porch, B.porch, k);
  sets.H.userData.lanternMat.emissiveIntensity = 1.6 * pk;
  sets.H.userData.porch.intensity = 4 * pk;
}

// ---------- kamera ----------
function cam(t, keys) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1] || a;
  const k = b[0] > a[0] ? seg(t, a[0], b[0]) : 0;
  const p = lerp3(a[1], b[1], k), l = lerp3(a[2], b[2], k);
  camera.position.set(p[0], p[1], p[2]); camera.lookAt(l[0], l[1], l[2]);
  const f = lerp(a[3] || 48, b[3] || 48, k); if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); }
}

// ---------- sahneler ----------
const show = (setName, chars, o = {}) => {
  for (const k in sets) sets[k].visible = k === setName;
  for (const k in P) P[k].root.visible = chars.includes(k);
  phone.visible = false; phoneLight.intensity = 0;
  const H = sets.H.userData;
  H.pumpkins.visible = !!o.pumpkins; H.snow.visible = !!o.snow;
  H.groundMat.color.set(o.snow ? 0xdfe5ee : 0x5e8a3e);
  H.door.rotation.y = 0; H.pivot.rotation.x = 0;
  if (setName !== 'H') { H.porch.intensity = 0; }
};
const worldOf = (obj, v) => { obj.updateWorldMatrix(true, false); return v.clone().applyMatrix4(obj.matrixWorld); };
const DH = 0.45;
const stepY = z => z <= -1.4 ? DH : z <= -0.85 ? 0.22 + (DH - 0.22) * clamp((-0.85 - z) / 0.55) * 0 : (z < -0.6 ? 0.22 * clamp((-0.6 - z) / 0.25) : 0);
function upY(z) { // basamaklardan yumuşak geçiş
  if (z <= -1.45) return DH;
  if (z <= -0.85) return lerp(0.22, DH, clamp((-0.85 - z) / 0.6));
  if (z <= -0.55) return lerp(0, 0.22, clamp((-0.55 - z) / 0.3));
  return 0;
}
function sitOn(c, h, extra = {}) { pose(c, Object.assign({ sit: true, y: h - 0.72 * c.s }, extra)); }

const SC = [
  { a: 0, b: 10.5, fn: S1 }, { a: 10.5, b: 21, fn: S2 }, { a: 21, b: 31, fn: S3 }, { a: 31, b: 40, fn: S4 },
  { a: 40, b: 50, fn: S5 }, { a: 50, b: 59.5, fn: S6 }, { a: 59.5, b: 74, fn: S7 },
];

function S1(u) { // yaz 2026 - eve varış, ışık yanık
  show('H', ['meBag', 'momA']); applyLight(LIGHT.night);
  const Me = P.meBag, M = P.momA, H = sets.H.userData;
  const w = walkPath(Me, [[0.35, 11.5], [0.2, -0.3]], 0.4, 9.2, u, 6.2, { armLx: -0.1, armRx: -0.1 });
  Me.root.position.y = upY(w.z);
  const open = seg(u, 5.2, 6.2); H.door.rotation.y = 1.25 * open;
  M.root.position.set(lerp(0.1, 0.15, open), DH, lerp(-4.9, -3.55, seg(u, 5.6, 7.0)));
  const wave = seg(u, 7.0, 7.4);
  pose(M, { y: DH, ry: 0, armRx: -2.6 * wave + Math.sin(u * 7) * 0.22 * wave, armRz: 0.3 * wave, armLx: -0.1, look: 0 });
  M.root.visible = open > 0.15;
  cam(u, [[0, [2.4, 2.4, 17.5], [0, 2.4, -3], 46], [10.5, [1.6, 1.55, 6.6], [0, 1.5, -2.6], 44]]);
}
function S2(u) { // şükran 2026 - babam basamakta bekledi; bir gece kalıp gittin
  show('H', ['dadA', 'meBag', 'momA'], { pumpkins: true });
  applyLight(LIGHT.golden, LIGHT.morning, seg(u, 4.9, 5.6));
  const D = P.dadA, Me = P.meBag, M = P.momA, H = sets.H.userData;
  const stand = seg(u, 4.4, 5.2);
  if (stand < 0.5) {
    D.root.position.set(0.25, 0, -1.62);
    const watch = seg(u, 1.4, 1.9) * (1 - seg(u, 3.0, 3.5));
    sitOn(D, DH, { ry: 0, sitLift: -0.4, armLx: -1.0 - 0.6 * watch, armRx: -1.0 - 0.3 * watch, armRz: 0.25 * watch, nod: 0.12 + 0.35 * watch, look: watch ? 0.2 : Math.sin(u * 0.7) * 0.25 });
  } else {
    D.root.position.set(0.25, DH, -1.75);
    const wave = seg(u, 6.0, 6.4);
    pose(D, { y: DH, ry: 0, armRx: -2.6 * wave + Math.sin(u * 7) * 0.2 * wave, armRz: 0.32 * wave, nod: -0.05 });
  }
  if (u < 5.2) {
    const w = walkPath(Me, [[0.2, 9.0], [0.1, -0.35]], 1.6, 4.6, u, 6.2, {});
    Me.root.position.y = upY(w.z);
    if (u > 4.6) pose(Me, { ry: Math.PI * 0, look: 0, armLx: -0.1, armRx: -0.1 });
    if (u > 4.6) Me.root.rotation.y = Math.PI; // babaya döner
  } else {
    const w = walkPath(Me, [[0.1, -0.2], [0.25, 4.0], [0.35, 12]], 5.6, 10.5, u, 6.2, {});
    Me.root.position.y = upY(w.z);
    if (u > 8.8) Me.head.rotation.y = 0.7 * seg(u, 8.8, 9.4) * -1;
  }
  Me.root.visible = u > 1.5;
  H.door.rotation.y = 1.2 * seg(u, 5.0, 5.8);
  M.root.visible = u > 5.2; M.root.position.set(-0.05, DH, lerp(-4.4, -3.4, seg(u, 5.4, 6.4)));
  pose(M, { y: DH, ry: 0.05, armLx: -0.5, armRx: -0.5, armLz: -0.2, armRz: -0.2, nod: 0.1 });
  cam(u, [[0, [2.6, 1.35, 2.2], [0.1, 0.95, -1.5], 42], [4.6, [2.2, 1.3, 1.9], [0.15, 0.95, -1.2], 42],
    [6.2, [-0.95, 2.55, -3.4], [0.3, 0.7, 4.5], 46], [10.5, [-0.85, 2.6, -3.5], [0.35, 0.6, 7.5], 46]]);
}
function S3(u) { // yaz 2027 - kahve hep senin için; erken kalkarsın
  show('B', ['dadA', 'momA', 'meBag']); applyLight(LIGHT.morning);
  const seats = sets.B.userData.seats;
  const D = P.dadA, M = P.momA, Me = P.meBag;
  const seatY = 0.51;
  { const [x, z, ry] = seats[0]; D.root.position.set(x, 0, z); pose(D, { sit: true, y: seatY - 0.84 * D.s + 0.12 * D.s, ry, armLx: -1.2, armRx: -1.15, nod: 0.08 + Math.sin(u * 1.4) * 0.05, look: 0.3 }); }
  const [mx, mz, mry] = seats[5];
  const standM = seg(u, 0.4, 1.0) * (1 - seg(u, 5.6, 6.4));
  M.root.position.set(mx - 0.25 * standM, 0, mz);
  pose(M, { sit: standM < 0.5, y: standM < 0.5 ? seatY - 0.84 * M.s + 0.12 * M.s : 0, ry: mry, bow: 0.22 * standM, armRx: -1.3 * standM - (standM < 0.5 ? 1.15 : 0), armLx: -0.8 * standM - (standM < 0.5 ? 1.2 : 0), nod: 0.25 * standM, look: u > 6.4 ? -0.5 * seg(u, 6.4, 7.2) : 0 });
  const K = sets.B.userData.kettle;
  if (standM > 0) {
    const hand = worldOf(M.arms[1].hand, new THREE.Vector3(0, -0.12, 0));
    const T = sets.B.userData.table; T.updateMatrixWorld(true);
    const local = T.worldToLocal(hand.clone());
    const pour = seg(u, 1.6, 2.0) * (1 - seg(u, 4.2, 4.6));
    K.position.set(lerp(0.0, local.x, standM), lerp(0.84, local.y - 0.25, standM), lerp(0.02, local.z, standM)); K.rotation.z = -0.7 * pour;
  } else { K.position.set(0.0, 0.84, 0.02); K.rotation.z = 0; }
  sets.B.userData.food.visible = true; sets.B.userData.lone.visible = false;
  const [sx, sz, sry] = seats[2];
  const up = seg(u, 5.2, 6.0);
  if (u < 6.0) {
    Me.root.position.set(sx, 0, sz - 0.25 * up);
    pose(Me, { sit: up < 0.5, y: up < 0.5 ? seatY - 0.84 * Me.s + 0.12 * Me.s : 0, ry: sry, armLx: up < 0.5 ? -1.2 : -0.2, armRx: up < 0.5 ? -1.15 : -0.2, nod: 0.1, look: Math.sin(u * 1.1) * 0.2 });
  } else {
    walkPath(Me, [[sx, sz - 0.25], [sx - 1.5, sz - 1.6], [sx - 3.5, sz + 2.5], [sx - 4.0, sz + 6.0]], 6.0, 10.0, u, 6.5, {});
  }
  const cx = 5.2, cz = 2.6, R = 6.6;
  cam(u, [[0, [cx + Math.sin(0.55) * R, 2.9, cz + Math.cos(0.55) * R], [cx, 0.85, cz], 40], [10, [cx + Math.sin(0.05) * (R - 0.8), 2.5, cz + Math.cos(0.05) * (R - 0.8)], [cx - 0.6, 0.9, cz], 42]]);
}
function S4(u) { // noel arifesi 2027 - balkonda telefon
  show('A', ['me']); applyLight(LIGHT.night);
  sets.A.userData.balconyChair.visible = true; sets.A.userData.balTable.visible = true;
  const bp = sets.A.userData.balcony, Me = P.me;
  Me.root.position.set(bp.x - 0.7, bp.y, bp.z + 0.05);
  pose(Me, { y: bp.y, ry: 0.35, armRx: -1.25, armRz: 0.35, armLx: -0.15, nod: 0.45, look: -0.1 });
  phone.visible = true;
  const hp = worldOf(Me.arms[1].hand, new THREE.Vector3(0.0, -0.06, 0.06));
  phone.position.copy(hp); phone.rotation.set(-0.6, Me.root.rotation.y, 0);
  phoneLight.position.set(hp.x, hp.y + 0.15, hp.z + 0.15); phoneLight.intensity = 1.2;
  cam(u, [[0, [-3.4, 2.9, 2.6], [-5.3, 3.9, -5.4], 44], [9, [-4.0, 3.3, 1.2], [-5.2, 4.1, -5.4], 40]]);
}
function S5(u) { // yaz 2028 - salıncak
  show('H', ['momS', 'meS', 'dadA']); applyLight(LIGHT.summer);
  const H = sets.H.userData, piv = H.pivot;
  const amp = lerp(0.1, 0.32, seg(u, 3.5, 8.5));
  piv.rotation.x = Math.sin(u * 2.1) * amp;
  const st = H.seatTop;
  for (const [k, x] of [['momS', -0.45], ['meS', 0.45]]) {
    const c = P[k]; c.root.position.x = x; c.root.position.z = 0.05;
    sitOn(c, st, { ry: 0, armLx: -0.35, armRx: -0.35, armLz: k === 'momS' ? 0.25 : -0.1, look: k === 'momS' ? -0.35 + Math.sin(u) * 0.1 : 0.3, nod: -0.05, tilt: k === 'momS' ? 0.06 : 0 });
    c.root.position.y = st - 0.72 * c.s; // pivot içinde
  }
  // annenin kolu: zincire tutunma
  const D = P.dadA; D.root.position.set(3.3, 0, 3.9);
  const push = Math.max(0, Math.sin(u * 2.1 - 1.2)) * seg(u, 2.0, 3.0);
  pose(D, { ry: 1.0, armLx: -0.25 - 0.3 * push, armRx: -0.25, nod: 0.05, look: 0.15 });
  cam(u, [[0, [5.3, 1.35, 8.6], [5.6, 1.0, 3.0], 42], [10, [6.6, 1.45, 7.6], [5.6, 1.0, 3.0], 40]]);
}
function S6(u) { // noel 2029 - babanın beyaz saçları, kar
  show('H', ['dadB', 'meW'], { snow: true }); applyLight(LIGHT.winter);
  const H = sets.H.userData, D = P.dadB, Me = P.meW;
  H.door.rotation.y = 1.2;
  D.root.position.set(0.1, DH, -2.15);
  const touch = seg(u, 3.4, 4.2) * (1 - seg(u, 7.0, 7.8));
  const laugh = Math.sin(u * 9) * 0.04 * touch;
  pose(D, { y: DH, ry: 0.05, armRx: -2.75 * touch - 0.05, armRz: -0.55 * touch, armLx: -0.15, nod: -0.1 + laugh - 0.12 * touch, tilt: 0.08 * touch, look: -0.05 });
  const w = walkPath(Me, [[-0.4, 5.0], [-0.75, -0.2]], 0.0, 3.2, u, 6.2, {});
  Me.root.position.y = upY(w.z);
  if (u > 3.2) { Me.root.rotation.y = Math.PI - 0.5; Me.head.rotation.x = -0.15; }
  // kar
  for (const [m, a, b, c] of H.snow.userData.p) {
    const y = 6.5 - ((u * (0.55 + c * 0.35) + a * 6.5) % 6.5);
    m.position.set(-4 + b * 8 + Math.sin(u * 0.8 + a * 9) * 0.25, y, -3.5 + c * 7.5);
  }
  cam(u, [[0, [1.9, 1.6, 2.4], [0.0, 1.75, -2.2], 40], [9.5, [1.45, 1.6, 1.3], [0.0, 1.85, -2.2], 36]]);
}
function S7(u) { // şükran 2030 - kapı açılıyor, yüzünü tutuyor
  show('H', ['momB', 'meW', 'dadB'], { pumpkins: true });
  applyLight(LIGHT.dusk, LIGHT.night, seg(u, 4.0, 8.4));
  const H = sets.H.userData, M = P.momB, Me = P.meW, D = P.dadB;
  const open = seg(u, 0.2, 1.2); H.door.rotation.y = 1.25 * open;
  // ben verandada, kapıya dönük
  Me.root.position.set(0.12, DH, -2.65); pose(Me, { y: DH, ry: Math.PI, nod: -0.12, armLx: -0.1, armRx: -0.1 });
  const out = seg(u, 0.8, 2.0);
  M.root.position.set(0.1, DH, lerp(-4.3, -3.25, out));
  const hold = seg(u, 1.8, 2.6);
  pose(M, { y: DH, ry: 0, walk: out * 10, walkAmt: u > 0.8 && u < 2.0 ? 1 : 0, armLx: -1.75 * hold, armRx: -1.75 * hold, armLz: -0.42 * hold, armRz: -0.42 * hold, nod: -0.32 * hold, tilt: 0.05 * Math.sin(u * 1.5) * hold });
  D.root.visible = u > 3.0; D.root.position.set(-0.85, DH, lerp(-4.6, -3.9, seg(u, 3.0, 4.2)));
  pose(D, { y: DH, ry: 0.4, armLx: -0.1, armRx: -0.1, nod: -0.05 });
  cam(u, [[0, [3.9, 1.8, -2.95], [0.1, 1.55, -2.95], 40], [4.4, [3.6, 1.78, -2.9], [0.1, 1.55, -2.95], 38],
    [8.5, [4.9, 2.05, -2.85], [0, 1.6, -3.0], 44], [14, [5.2, 2.35, -2.75], [0, 1.7, -3.1], 46]]);
}

// ---------- yazı zaman çizelgesi ----------
const SUBS = [
  [4.2, 9.6, 'Sokağın başındayken bile<br>ışığı yakarlar.'],
  [11.5, 15.4, 'Babam bir saat boyunca<br>basamakta bekledi.'],
  [16.0, 20.2, 'Bir gece kalıp<br>yine yola çıktın.'],
  [22.0, 25.8, 'Kahve hep senin için demlenir.'],
  [26.2, 30.4, 'Sen yine de erken kalkarsın,<br>bilirler.'],
  [41.2, 45.0, 'Annem bahçeye salıncak kurdu.'],
  [45.4, 49.4, 'Her gelişinde<br>biraz daha sallanır.'],
  [51.0, 58.8, 'Babam saçlarındaki beyazı<br>bu yıl saymaya başladı.'],
  [60.6, 63.9, 'Kapıyı açtığında seni<br>beş yaşındaki gibi tuttu.'],
  [64.3, 67.6, 'Daha sık gel.<br>Işığı açık tutacağım.'],
];
const COUNTER = [
  [0, 10.5, 52, 'YAZ 2026 · EBEVEYNLER 56'],
  [10.5, 21, 51, 'ŞÜKRAN GÜNÜ 2026 · EBEVEYNLER 56'],
  [21, 31, 50, 'YAZ 2027 · EBEVEYNLER 57'],
  [31, 40, 49, 'NOEL ARİFESİ 2027 · 21:36 · EBEVEYNLER 57'],
  [40, 50, 48, 'YAZ 2028 · EBEVEYNLER 58'],
  [50, 59.5, 46, 'NOEL 2029 · EBEVEYNLER 59'],
  [59.5, 74, 43, 'ŞÜKRAN GÜNÜ 2030 · EBEVEYNLER 60'],
];
const $ = id => document.getElementById(id);
// sayaç düzeni: KALAN ZİYARET / sayı / YILDA İKİ KEZ GİDERSEN / tarih (altın)
$('agel').textContent = 'KALAN ZİYARET';
$('lab').textContent = 'YILDA İKİ KEZ GİDERSEN';
$('counter').appendChild($('cap'));
Object.assign($('cap').style, { fontFamily: 'Inter', fontWeight: '600', fontSize: '12.3px', letterSpacing: '2.1px', color: '#eab865', marginTop: '6px', marginBottom: '0', whiteSpace: 'nowrap' });
$('agen').style.fontSize = '50px'; $('agen').style.lineHeight = '56px';
// açılış alt başlığı
const t0s = document.createElement('div');
Object.assign(t0s.style, { position: 'absolute', left: '0', width: '720px', top: '392px', textAlign: 'center', fontFamily: 'Inter', fontWeight: '600', fontSize: '13px', letterSpacing: '3px', color: 'rgba(235,236,240,.9)', textShadow: '0 1px 4px rgba(0,0,0,.6)', opacity: 0 });
t0s.textContent = EPTEXT.sub; $('texts').appendChild(t0s);
// kapanış: kullanıcı adı
$('endS2').style.top = '730px';
$('endS1').style.color = '#eab865'; $('endS1').style.fontSize = '15px'; $('endS1').style.fontWeight = '600';
// telefon mesaj kartı
const chat = document.createElement('div');
chat.innerHTML = `
<div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid rgba(0,0,0,.08)">
 <div style="width:40px;height:40px;border-radius:20px;background:#e3a24a;color:#fff;font:600 18px Inter;display:flex;align-items:center;justify-content:center">A</div>
 <div><div style="font:600 17px Inter;color:#1c1c1e">Anne</div><div style="font:500 12px Inter;color:#8e8e93;margin-top:2px">24 Ara, 21:36</div></div>
</div>
<div id="cb1" style="margin:16px 0 0 auto;max-width:300px;width:fit-content;background:#2f7cf6;color:#fff;font:500 17px/23px Inter;padding:10px 15px;border-radius:20px 20px 6px 20px;opacity:0">Bu yıl yetişemiyorum anne.</div>
<div id="cbT" style="margin:12px auto 0 0;width:fit-content;background:#e5e5ea;padding:12px 16px;border-radius:20px 20px 20px 6px;opacity:0;display:flex;gap:6px"><i></i><i></i><i></i></div>
<div id="cb2" style="margin:12px auto 0 0;max-width:300px;width:fit-content;background:#e5e5ea;color:#1c1c1e;font:500 17px/23px Inter;padding:10px 15px;border-radius:20px 20px 20px 6px;opacity:0">Olur canım,<br>sofrada yerin hep var.</div>`;
Object.assign(chat.style, { position: 'absolute', left: '150px', top: '150px', width: '384px', padding: '18px 18px 20px', background: 'rgba(246,246,248,.97)', borderRadius: '28px', boxShadow: '0 12px 34px rgba(0,0,0,.4)', opacity: 0 });
$('texts').appendChild(chat);
for (const d of chat.querySelectorAll('#cbT i')) Object.assign(d.style, { width: '8px', height: '8px', borderRadius: '4px', background: '#9a9aa0', display: 'block' });

function fadeWin(t, a, b, fi = 0.55, fo = 0.55) { return clamp((t - a) / fi) * clamp((b - t) / fo); }
const END = 68;
function texts(t) {
  $('t0').style.opacity = fadeWin(t, 0.3, 3.6, 0.7, 0.6);
  t0s.style.opacity = fadeWin(t, 0.8, 3.6, 0.7, 0.6);
  let s = SUBS.find(x => t >= x[0] - 0.1 && t <= x[1] + 0.1);
  const sub = $('sub');
  if (s) { if (sub.dataset.k !== s[2]) { sub.innerHTML = s[2]; sub.dataset.k = s[2]; } sub.style.opacity = fadeWin(t, s[0], s[1], 0.5, 0.5); }
  else sub.style.opacity = 0;
  const c = COUNTER.find(x => t >= x[0] && t < x[1]) || COUNTER[COUNTER.length - 1];
  const [a, b, n, cap] = c;
  if ($('agen').textContent !== String(n)) $('agen').textContent = n;
  if ($('cap').textContent !== cap) $('cap').textContent = cap;
  const f = a > 0 ? clamp(1 - (t - a - 0.35) / 1.4) : 0;
  $('agen').style.color = `rgb(${Math.round(lerp(251, 240, f))},${Math.round(lerp(250, 168, f))},${Math.round(lerp(245, 90, f))})`;
  $('cap').style.opacity = fadeWin(t, a + 0.3, b - 0.15, 0.6, 0.4);
  $('counter').style.opacity = clamp((t - 3.4) / 0.7) * clamp((END - 0.2 - t) / 0.6);
  // telefon kartı
  chat.style.opacity = fadeWin(t, 31.7, 39.6, 0.5, 0.5);
  $('cb1').style.opacity = clamp((t - 32.6) / 0.3);
  $('cbT').style.opacity = fadeWin(t, 34.1, 35.7, 0.25, 0.15);
  for (const [i, d] of [...chat.querySelectorAll('#cbT i')].entries()) d.style.opacity = 0.45 + 0.55 * Math.max(0, Math.sin(t * 7 - i * 0.9));
  $('cb2').style.opacity = clamp((t - 35.7) / 0.3);
  // geçişler
  let dip = 0;
  for (const x of SC.slice(1)) dip = Math.max(dip, 1 - Math.abs(t - x.a) / 0.42);
  $('dip').style.opacity = clamp(dip) * 0.92;
  $('dark').style.opacity = clamp((t - END) / 0.8) * 0.93;
  $('endT').style.opacity = fadeWin(t, END + 0.8, 200, 0.9, 1);
  $('endS1').style.opacity = fadeWin(t, END + 1.6, 200, 0.7, 1);
  $('endS2').style.opacity = fadeWin(t, END + 2.2, 200, 0.7, 1);
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
window.DURATION = 74;
document.fonts.ready.then(() => { window.READY = true; });
