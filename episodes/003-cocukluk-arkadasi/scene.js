import * as THREE from '../../engine/three.module.js';

// ===== Bölüm metinleri (açılış başlığı + kapanış kartı) =====
const EPTEXT = {
  title: 'Çocukluk arkadaşın<br>şimdi nerede?',
  end1: 'ÇOCUKLUK ARKADAŞINI ETİKETLE',
  end2: '@bilseydin.tr',
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

sets.A = buildA(); sets.C = buildC();

// ---------- oyuncular ----------
const SKIN = 0xe2b38c, SKIN2 = 0xd7a37b;
const P = {};
function C(name, o) { P[name] = makeChar(o); P[name].root.visible = false; return P[name]; }
const HERO = { shirt: 0x3b6fb6, pants: 0x2b3a5c, hair: 0x4a2f1f };
const FRI = { shirt: 0xe0a92e, pants: 0x3d3d48, hair: 0x1f1610, skin: SKIN2 };
C('h8', Object.assign({ s: 0.62, hs: 1.26 }, HERO)); C('f8', Object.assign({ s: 0.63, hs: 1.26 }, FRI));
C('h10', Object.assign({ s: 0.68, hs: 1.2 }, HERO)); C('f10', Object.assign({ s: 0.69, hs: 1.2 }, FRI));
C('h14', Object.assign({ s: 0.88, hs: 1.06, backpack: 0x3d4a3a }, HERO)); C('f14', Object.assign({ s: 0.89, hs: 1.06, backpack: 0x7a2f2f }, FRI));
C('n1', { s: 0.86, hs: 1.06, shirt: 0xb8433d, pants: 0x2d3a4d, hair: 0x5a3a20, backpack: 0x2f3d5a });
C('n2', { s: 0.87, hs: 1.06, shirt: 0x4f9a5a, pants: 0x3a3226, hair: 0x2a1a10, skin: SKIN2, backpack: 0x5a4a3a });
C('h17', Object.assign({ s: 0.96, hs: 1.02 }, HERO));
C('me', { s: 1.0, shirt: 0x355e94, pants: 0x383a44, hair: 0x4a2f1f, beard: 0x4a2f1f });
C('meC', { s: 1.0, shirt: 0x2f3a4c, sleeve: 0x2f3a4c, vest: 0x5a3d34, pants: 0x383a44, hair: 0x4a2f1f, beard: 0x4a2f1f });
C('fr', { s: 1.0, shirt: 0xd0a43a, pants: 0x3a3a44, hair: 0x1f1610, mustache: 0x1f1610, skin: SKIN2 });
const phone = box(scene, 0.08, 0.15, 0.02, 0x1d1f24, 0, 0, 0, { cast: false });
const wafer = [box(scene, 0.09, 0.035, 0.07, 0x9a6232, 0, 0, 0, { cast: false }), box(scene, 0.09, 0.035, 0.07, 0x9a6232, 0, 0, 0, { cast: false })];

// ---------- ışık ----------
const LIGHT = {
  morning: { sky: 0xbcd4ea, fog: 0xcfdcea, hs: 0xe3ecf7, hg: 0x7a8a5a, hi: 1.05, sc: 0xfff2dc, si: 1.55, sp: [14, 22, 12], lamps: 0, wins: 0 },
  bayram: { sky: 0xc3dcf0, fog: 0xd6e3ef, hs: 0xeef3fa, hg: 0x7d8f58, hi: 1.1, sc: 0xfff6e6, si: 1.6, sp: [-12, 20, 14], lamps: 0, wins: 0 },
  dusk: { sky: 0xe7b48f, fog: 0xd9a98a, hs: 0xf3c9a8, hg: 0x5d5a52, hi: 0.85, sc: 0xffb877, si: 1.05, sp: [-20, 8, 6], lamps: 1.6, wins: 0.9 },
  overcast: { sky: 0xb9c2cc, fog: 0xbcc4cd, hs: 0xd5dbe2, hg: 0x737a70, hi: 1.15, sc: 0xe8eef5, si: 0.55, sp: [6, 22, 8], lamps: 0, wins: 0.15 },
  night: { sky: 0x17223a, fog: 0x1c2741, hs: 0x6274a0, hg: 0x2a2c36, hi: 0.8, sc: 0x9fb4dc, si: 0.55, sp: [-10, 18, 12], lamps: 1.8, wins: 1.0 },
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
function cam(t, keys) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1] || a;
  const k = b[0] > a[0] ? seg(t, a[0], b[0]) : 0;
  const p = lerp3(a[1], b[1], k), l = lerp3(a[2], b[2], k);
  camera.position.set(p[0], p[1], p[2]); camera.lookAt(l[0], l[1], l[2]);
  const f = lerp(a[3] || 48, b[3] || 48, k); if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); }
}
const show = (setName, chars) => {
  for (const k in sets) sets[k].visible = k === setName;
  for (const k in P) P[k].root.visible = chars.includes(k);
  phone.visible = false; wafer.forEach(w => w.visible = false);
  sets.C.userData.ball.visible = setName === 'C';
};
const worldOf = (obj, v) => { obj.updateWorldMatrix(true, false); return v.clone().applyMatrix4(obj.matrixWorld); };
function holdPhone(c, ry) {
  phone.visible = true;
  const hp = worldOf(c.arms[1].hand, new THREE.Vector3(0, -0.06, 0.06));
  phone.position.copy(hp); phone.rotation.set(-0.6, ry, 0);
}
function kick(c, f) { if (f < 0.18) { c.legs[1].thigh.rotation.x = -0.9 * Math.sin(f / 0.18 * Math.PI); c.legs[1].knee.rotation.x = 0.3; } }

const SC = [
  { a: 0, b: 10.5, fn: S1 }, { a: 10.5, b: 21, fn: S2 }, { a: 21, b: 31.5, fn: S3 }, { a: 31.5, b: 42, fn: S4 },
  { a: 42, b: 52.5, fn: S5 }, { a: 52.5, b: 63, fn: S6 }, { a: 63, b: 81, fn: S7 },
];

function S1(u) { // 8 yaş - sokakta top, akşam ezanına kadar
  show('C', ['h8', 'f8']); applyLight(LIGHT.morning, LIGHT.dusk, 0.35 + 0.65 * seg(u, 2, 10.5));
  const A = P.h8, B = P.f8, ball = sets.C.userData.ball;
  const ax = -1.0 + Math.sin(u * 0.7) * 0.08, bx = 1.0 + Math.sin(u * 0.9 + 1) * 0.08, z = 0.5;
  A.root.position.set(ax, 0, z); B.root.position.set(bx, 0, z + 0.1);
  const T = 1.55, n = Math.floor(u / T), f = (u % T) / T;
  const fromA = n % 2 === 0;
  const x0 = fromA ? ax + 0.28 : bx - 0.28, x1 = fromA ? bx - 0.28 : ax + 0.28;
  ball.position.set(lerp(x0, x1, ease(f)), 0.13 + Math.sin(f * Math.PI) * 0.28, z + 0.05);
  ball.rotation.z = -u * 7;
  const bob = (c, ph) => ({ walk: u * 6 + ph, walkAmt: 0.18, nod: 0.15 });
  pose(A, Object.assign({ ry: Math.PI / 2, armLx: 0.1, armRx: 0.1 }, bob(A, 0)));
  pose(B, Object.assign({ ry: -Math.PI / 2, armLx: 0.1, armRx: 0.1 }, bob(B, 1.3)));
  if (fromA) kick(A, f); else kick(B, f);
  cam(u, [[0, [0.3, 1.05, 7.6], [0, 0.65, 0.4], 46], [10.5, [0.6, 0.95, 6.5], [0, 0.6, 0.4], 46]]);
}
function S2(u) { // 10 yaş - bankta tek gofreti bölmek
  show('A', ['h10', 'f10']); applyLight(LIGHT.morning);
  const A = P.h10, B = P.f10, h = 0.53;
  A.root.position.set(4.25, 0, -1.92); B.root.position.set(4.95, 0, -1.92);
  const split = seg(u, 3.2, 3.8), give = seg(u, 4.2, 5.0), eat = seg(u, 6.0, 6.6);
  const munch = eat * Math.max(0, Math.sin(u * 5)) * 0.25;
  pose(A, { sit: true, y: h - 0.72 * A.s, ry: 0.25, armLx: -1.0 - 0.9 * eat + munch, armRx: -1.0 + 0.2 * give, armRz: 0.25 * give, nod: 0.35 * (1 - give) - 0.05, look: give ? 0.5 * (1 - eat) : 0 });
  pose(B, { sit: true, y: h - 0.72 * B.s, ry: -0.25, armRx: -0.3 - 0.8 * give - 1.0 * eat + munch, armLx: -0.2, armRz: 0.1, nod: 0.25 * give, look: -0.45 * (1 - eat * 0.5) });
  wafer.forEach(w => w.visible = true);
  const ha = worldOf(A.arms[0].hand, new THREE.Vector3(0, -0.05, 0.04)), hr = worldOf(A.arms[1].hand, new THREE.Vector3(0, -0.05, 0.04));
  const hb = worldOf(B.arms[1].hand, new THREE.Vector3(0, -0.05, 0.04));
  const mid = new THREE.Vector3().lerpVectors(ha, hr, 0.5);
  wafer[0].position.lerpVectors(mid, ha, split);
  const p1 = new THREE.Vector3().lerpVectors(mid, hr, split);
  wafer[1].position.lerpVectors(p1, hb, seg(u, 4.6, 5.2));
  wafer[0].rotation.y = 0.3; wafer[1].rotation.y = -0.3;
  wafer[1].scale.x = 0.09 * (1 + 0.5 * split); // büyük parça ona
  sets.A.userData.cat.userData.tail.rotation.y = Math.sin(u * 2) * 0.5;
  cam(u, [[0, [4.7, 0.95, 1.25], [4.6, 0.62, -1.9], 42], [10.5, [4.55, 0.9, 0.55], [4.6, 0.62, -1.9], 40]]);
}
function S3(u) { // 14 yaş - liseler ayrı, el sallayıp geçmek
  show('C', ['h14', 'f14', 'n1', 'n2']); applyLight(LIGHT.morning);
  const wave = (a, b) => seg(u, a, a + 0.4) * (1 - seg(u, b, b + 0.4));
  const wv = wave(4.3, 6.1);
  walkPath(P.h14, [[-9.6, 4.1], [3.6, 4.1]], 0, 10.5, u, 6.5, { armRx: -2.6 * wv + Math.sin(u * 8) * 0.2 * wv, armRz: 0.3 * wv, look: 0.9 * wv });
  walkPath(P.f14, [[3.3, 2.9], [-9.3, 2.9]], 0, 10.5, u, 6.5, { armLx: -2.6 * wv + Math.sin(u * 8) * 0.2 * wv, armLz: 0.3 * wv, look: 0.9 * wv });
  walkPath(P.n1, [[4.1, 2.4], [-8.5, 2.4]], 0, 10.5, u, 6.5, { look: -0.5 });
  walkPath(P.n2, [[2.7, 2.2], [-9.9, 2.2]], 0, 10.5, u, 6.5, { look: 0.4 });
  const hx = P.h14.root.position.x;
  cam(u, [[0, [-3.4, 1.45, 8.4], [-3.0, 1.0, 3.0], 50], [10.5, [-2.6, 1.5, 8.4], [-3.0, 1.0, 3.0], 50]]);
}
function S4(u) { // 17-21 yaş - balkonda mesajlar
  show('A', ['h17']); applyLight(LIGHT.night);
  sets.A.userData.balconyChair.visible = true; sets.A.userData.balTable.visible = true;
  const bp = sets.A.userData.balcony, Me = P.h17;
  Me.root.position.set(bp.x - 0.7, bp.y, bp.z + 0.05);
  pose(Me, { y: bp.y, ry: 0.35, armRx: -1.25, armRz: 0.35, armLx: -0.15, nod: 0.45, look: -0.1 });
  holdPhone(Me, Me.root.rotation.y);
  cam(u, [[0, [-3.4, 2.9, 2.6], [-5.3, 3.9, -5.4], 44], [10.5, [-4.0, 3.3, 1.2], [-5.2, 4.1, -5.4], 40]]);
}
function S5(u) { // yıllar geçer - yetişkin, eski kale taşlarının yanından
  show('C', ['meC']); applyLight(LIGHT.overcast, LIGHT.dusk, seg(u, 2, 10.5) * 0.7);
  const ball = sets.C.userData.ball; ball.visible = false;
  const w = walkPath(P.meC, [[6.5, 3.95], [-5.6, 3.95]], 0.0, 7.0, u, 6.0, { nod: 0.1 });
  if (u > 7.0) { pose(P.meC, { ry: -Math.PI / 2 - 0.9 * seg(u, 7.0, 7.8), nod: 0.25 * seg(u, 7.2, 8.0) }); }
  const x = P.meC.root.position.x;
  camera.position.set(x + 2.6, 1.55, 7.7); camera.lookAt(x - 0.6, 1.1, 1.6);
  if (u > 7) { const k = seg(u, 7, 10.5); camera.position.set(lerp(x + 2.6, x + 1.2, k), lerp(1.55, 1.75, k), lerp(7.7, 7.2, k)); camera.lookAt(lerp(x - 0.6, -7.0, k), lerp(1.1, 0.4, k), lerp(1.6, 0.0, k)); }
  if (camera.fov !== 46) { camera.fov = 46; camera.updateProjectionMatrix(); }
}
function S6(u) { // bayram - mahallede, ilk sen yazdın
  show('A', ['me']); applyLight(LIGHT.bayram);
  sets.A.userData.balconyChair.visible = true; sets.A.userData.balTable.visible = true;
  const Me = P.me;
  const run = seg(u, 8.4, 10.5);
  if (u < 8.4) {
    Me.root.position.set(0.6, 0, 2.4);
    const up = seg(u, 6.9, 7.4);
    pose(Me, { ry: 0.5, armRx: -1.25 * (1 - up * 0.3), armRz: 0.35, armLx: -0.15 + -0.6 * up, nod: 0.45 - 0.55 * up, look: -0.1 });
    holdPhone(Me, Me.root.rotation.y);
  } else {
    walkPath(Me, [[0.6, 2.4], [0.2, 4.6], [-3.5, 6.8]], 8.4, 11.5, u, 8.0, {});
  }
  sets.A.userData.cat.userData.tail.rotation.y = Math.sin(u * 2) * 0.5;
  cam(u, [[0, [2.9, 1.45, 5.4], [0.5, 1.3, 2.3], 42], [7, [2.6, 1.45, 4.7], [0.5, 1.3, 2.3], 40], [10.5, [3.4, 1.7, 6.6], [-0.5, 1.0, 4.0], 46]]);
}
function S7(u) { // bayram - eski kale, top, sarılma
  show('C', ['me', 'fr']); applyLight(LIGHT.bayram);
  const M = P.me, F = P.fr, ball = sets.C.userData.ball;
  // arkadaş eski kalenin önünde
  const meet = seg(u, 5.6, 7.0), hug = seg(u, 7.0, 7.8) * (1 - seg(u, 12.2, 12.8));
  const fx = lerp(-6.4, -5.25, meet), fz = 0.6;
  F.root.position.set(fx, 0, fz);
  const kf = clamp((u - 3.7) / 0.8);
  pose(F, { ry: Math.PI / 2 - 0.25, walk: meet * 8, walkAmt: u > 5.6 && u < 7.0 ? 1 : 0, armLx: -1.45 * hug, armRx: -1.45 * hug, armLz: -0.3 * hug, armRz: -0.3 * hug, nod: 0.08 });
  if (u > 3.7 && u < 4.5) kick(F, kf * 0.18);
  // ben geliyorum
  if (u < 3.4) walkPath(M, [[-1.4, 3.6], [-2.4, 2.2], [-3.25, 0.85]], 0.2, 3.4, u, 6.5, {});
  else {
    const mx = lerp(-3.25, -4.55, meet);
    M.root.position.set(mx, 0, lerp(0.85, 0.65, meet));
    pose(M, { ry: -Math.PI / 2 + 0.2, walk: meet * 8, walkAmt: u > 5.6 && u < 7.0 ? 1 : 0, armLx: -1.45 * hug, armRx: -1.45 * hug, armLz: -0.3 * hug, armRz: -0.3 * hug, nod: 0.08 });
    const trap = seg(u, 4.9, 5.1) * (1 - seg(u, 5.4, 5.7));
    M.legs[1].thigh.rotation.x -= 0.5 * trap;
  }
  // top
  if (u < 3.8) ball.position.set(-6.0, 0.13, 0.75);
  else { const k = clamp((u - 3.8) / 1.2); ball.position.set(lerp(-6.0, -3.6, ease(k)), 0.13 + Math.sin(k * Math.PI) * 0.15, lerp(0.75, 0.95, k)); ball.rotation.z = -u * 6; }
  cam(u, [[0, [0.9, 1.6, 2.1], [-5.6, 0.9, 0.7], 46], [5.5, [-1.4, 1.55, 2.5], [-5.0, 1.0, 0.7], 44], [9.5, [-4.7, 1.55, 3.6], [-4.9, 1.25, 0.6], 38], [14, [-3.8, 2.2, 6.0], [-4.9, 1.2, 0.6], 42]]);
}

// ---------- mesaj kartları ----------
function makeChat(name, items, pos) {
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'absolute', left: pos[0] + 'px', top: pos[1] + 'px', width: '400px', padding: '16px 18px 18px', background: 'rgba(246,246,248,.97)', borderRadius: '28px', boxShadow: '0 12px 34px rgba(0,0,0,.4)', opacity: 0, fontFamily: 'Inter' });
  const head = `<div style="display:flex;align-items:center;gap:12px;padding-bottom:10px;border-bottom:1px solid rgba(0,0,0,.08)"><div style="width:40px;height:40px;border-radius:20px;background:#e3a24a;color:#fff;font:600 18px Inter;display:flex;align-items:center;justify-content:center">${name[0]}</div><div style="font:600 17px Inter;color:#1c1c1e">${name}</div></div>`;
  const body = document.createElement('div'); el.innerHTML = head; el.appendChild(body);
  $('texts').appendChild(el);
  let key = '';
  return {
    el, update(t) {
      const vis = items.filter(it => t >= it[0] && (it[1] !== 'typing' || t < it[3]));
      const last = vis.slice(-7);
      const k = last.map(it => it[0]).join(',');
      if (k === key) return; key = k;
      body.innerHTML = last.map(it => {
        const [ , kind, txt] = it;
        if (kind === 'date') return `<div style="text-align:center;font:600 11px Inter;letter-spacing:.6px;color:#8e8e93;margin:12px 0 4px">${txt}</div>`;
        if (kind === 'status') return `<div style="text-align:right;font:500 11.5px Inter;color:#8e8e93;margin-top:4px">${txt}</div>`;
        if (kind === 'typing') return `<div style="margin:8px auto 0 0;width:fit-content;background:#e5e5ea;padding:11px 15px;border-radius:20px 20px 20px 6px;display:flex;gap:6px">${'<i style="width:8px;height:8px;border-radius:4px;background:#9a9aa0;display:block"></i>'.repeat(3)}</div>`;
        const me = kind === 'me';
        return `<div style="margin:7px ${me ? '0 0 auto' : 'auto 0 0'};max-width:300px;width:fit-content;background:${me ? '#2f7cf6' : '#e5e5ea'};color:${me ? '#fff' : '#1c1c1e'};font:500 16.5px/22px Inter;padding:9px 14px;border-radius:${me ? '20px 20px 6px 20px' : '20px 20px 20px 6px'}">${txt}</div>`;
      }).join('');
    }
  };
}
const $ = id => document.getElementById(id);
const chat1 = makeChat('Kanka', [
  [32.2, 'date', 'HAZ 2018'], [32.6, 'me', 'kanka bu yaz bi buluşalım'], [33.6, 'them', 'aynen kesin!! yazarım'],
  [35.0, 'date', 'AĞU 2018'], [35.3, 'me', 'bayramda müsait misin'], [36.1, 'them', 'olur bakarız'],
  [37.6, 'date', 'EKİ 2020'], [37.9, 'them', 'iyi ki doğdun kanka, nice yıllara! çok özledim seni'], [38.7, 'me', 'sağ ol kankaa ben de'],
  [39.9, 'date', 'EKİ 2022'], [40.2, 'them', 'iyi ki doğdun'], [40.8, 'me', 'eyv'],
], [150, 130]);
const chat2 = makeChat('Kanka', [
  [53.6, 'date', 'EKİ 2022'], [53.6, 'them', 'iyi ki doğdun'], [53.6, 'me', 'eyv'],
  [54.4, 'date', 'BUGÜN 10:12'], [55.0, 'me', 'bayram için mahalledeyim<br>sen de burada mısın?'], [55.6, 'status', 'İletildi'],
  [57.6, 'typing', null, 59.2], [59.2, 'them', 'ŞAKA MI'], [59.8, 'them', 'aşağıdayım koş!!'],
], [150, 130]);

// ---------- yazılar ----------
const SUBS = [
  [3.9, 7.0, 'Sekiz yaşında aynı topun<br>peşindeydiniz.'],
  [7.3, 10.2, 'Akşam ezanı okunana kadar.'],
  [11.4, 15.6, 'Bakkaldan aldığınız tek gofreti<br>ikiye bölerdiniz.'],
  [16.0, 20.3, 'Büyük parça hep ona kalırdı.'],
  [22.0, 26.0, 'Sonra liseler ayrı düştü.'],
  [26.4, 30.8, 'Sokakta görünce<br>el sallayıp geçerdiniz.'],
  [41.6, 41.6, ''],
  [43.4, 47.4, 'Sonra yıllar sessizce geçti.'],
  [47.8, 52.0, 'Kale yaptığınız taşlar<br>hâlâ yerinde duruyordu.'],
  [60.6, 62.6, 'Meğer o da yazmayı bekliyormuş.'],
  [64.0, 68.2, 'Topa hâlâ aynı yerden vuruyordu.'],
  [68.6, 73.6, 'Bunu ona gönder.<br>Bir ara, bugün olsun.'],
];
const SUBS2 = [ // mesaj kartı açıkken alt yazılar kart altında da okunur
  [41.0, 41.0, ''],
];
const AGE = [[0, 10.5, 8, '2009'], [10.5, 21, 10, '2011'], [21, 31.5, 14, '2015'], [31.5, 37.6, 17, '2018'], [37.6, 39.9, 19, '2020'], [39.9, 42, 21, '2022']];
const fmt = n => n.toLocaleString('tr-TR');
$('cap').style.display = 'none';
$('agen').style.fontSize = '50px'; $('agen').style.lineHeight = '56px';
$('lab').style.marginTop = '8px';
$('endS2').style.top = '730px';
$('endS1').style.color = '#eab865'; $('endS1').style.fontSize = '15px'; $('endS1').style.fontWeight = '600';
function fadeWin(t, a, b, fi = 0.55, fo = 0.55) { return clamp((t - a) / fi) * clamp((b - t) / fo); }
const END = 74.4;
let lastN = null, flashT = -9;
function texts(t) {
  $('t0').style.opacity = fadeWin(t, 0.3, 3.6, 0.7, 0.6);
  const s = SUBS.find(x => x[2] && t >= x[0] - 0.1 && t <= x[1] + 0.1);
  const sub = $('sub');
  // 4. ve 6. sahnede mesaj kartı var: alt yazı ayrı
  const extra = [[33.0, 36.9, '“Bir ara buluşalım”<br>hep bir arada kaldı.'], [37.3, 41.5, 'Mesajlar kısaldı, aralar uzadı.'], [53.0, 57.2, 'Bayramda mahalleye döndün.<br>İlk sen yazdın.']];
  const s2 = s || extra.find(x => t >= x[0] - 0.1 && t <= x[1] + 0.1);
  if (s2) { if (sub.dataset.k !== s2[2]) { sub.innerHTML = s2[2]; sub.dataset.k = s2[2]; } sub.style.opacity = fadeWin(t, s2[0], s2[1], 0.5, 0.5); }
  else sub.style.opacity = 0;
  // sayaç
  let label, n, lab;
  if (t < 42) { const a = AGE.find(x => t >= x[0] && t < x[1]) || AGE[AGE.length - 1]; label = 'YAŞIN'; n = a[2]; lab = a[3]; }
  else {
    label = 'GÖRÜŞMEDİĞİNİZ GÜN';
    if (t < 52.5) { n = Math.round(lerp(1, 1460, seg(t, 42.6, 51.6))); lab = (21 + Math.floor(lerp(0, 4, seg(t, 42.6, 51.6)))) + ' YAŞINDASIN'; }
    else if (t < 59.2) { n = 1461; lab = '25 YAŞINDASIN'; }
    else { n = 0; lab = 'CEVAP HEMEN GELDİ'; }
  }
  if ($('agel').textContent !== label) $('agel').textContent = label;
  if (n !== lastN) { if (lastN !== null && (n < lastN || label === 'YAŞIN')) flashT = t; lastN = n; $('agen').textContent = fmt(n); }
  if ($('lab').textContent !== lab) $('lab').textContent = lab;
  const f = clamp(1 - (t - flashT) / 1.4);
  $('agen').style.color = `rgb(${Math.round(lerp(251, 240, f))},${Math.round(lerp(250, 168, f))},${Math.round(lerp(245, 90, f))})`;
  $('lab').style.color = t >= 59.2 && t < 63 ? `rgba(240,${Math.round(lerp(235, 168, clamp(1 - (t - 59.2) / 2)))},${Math.round(lerp(238, 90, clamp(1 - (t - 59.2) / 2)))},1)` : 'rgba(232,235,238,.88)';
  $('counter').style.opacity = clamp((t - 3.4) / 0.7) * clamp((END - 0.2 - t) / 0.6);
  chat1.el.style.opacity = fadeWin(t, 31.9, 41.7, 0.5, 0.4); chat1.update(t);
  chat2.el.style.opacity = fadeWin(t, 53.3, 62.7, 0.5, 0.4); chat2.update(t);
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
window.DURATION = 81;
document.fonts.ready.then(() => { window.READY = true; });
