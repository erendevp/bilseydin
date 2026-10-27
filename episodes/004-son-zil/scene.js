import * as THREE from '../../engine/three.module.js';

// ===== Bölüm metinleri (açılış başlığı + kapanış kartı) =====
const EPTEXT = {
  title: 'Ya son zil olduğunu<br>bilseydin?',
  end1: 'SIRA ARKADAŞINI ETİKETLE',
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
  if (o.collar) box(c.upper, 0.42 * s, 0.07 * s, 0.33 * s, 0xf4f3ee, 0, 0.57 * s, 0);
  if (o.skirt) box(c.hips, 0.56 * s, 0.3 * s, 0.34 * s, o.skirt, 0, -0.27 * s, 0);
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
  box(B, 1.6, 2.4, 0.02, 0x2a2420, 0, 0.17, 0.004, { cast: false });
  g.userData.door = box(B, 1.7, 2.5, 0.1, 0x6b4128, 0, 0.15, 0.05);
  g.userData.doorBits = [box(B, 0.05, 2.3, 0.12, 0x4f2f1c, 0, 0.2, 0.08), box(B, 0.08, 0.08, 0.15, 0xd6b24a, 0.2, 1.3, 0.12)];
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

// === SET S: okul binası + bahçe ===
function buildS() {
  const g = group(scene);
  ground(g, 0x77a356);
  box(g, 26, 0.05, 17, 0xb9b1a3, 0, 0, -0.3, { cast: false });
  // bahçe çizgileri: seksek
  for (let i = 0; i < 6; i++) {
    const z = 1.2 + i * 0.62, xs = (i === 2 || i === 4) ? [-5.3, -4.7] : [-5.0];
    for (const x of xs) {
      box(g, 0.56, 0.012, 0.03, 0xf2f0e8, x, 0.05, z - 0.28, { cast: false }); box(g, 0.56, 0.012, 0.03, 0xf2f0e8, x, 0.05, z + 0.28, { cast: false });
      box(g, 0.03, 0.012, 0.56, 0xf2f0e8, x - 0.28, 0.05, z, { cast: false }); box(g, 0.03, 0.012, 0.56, 0xf2f0e8, x + 0.28, 0.05, z, { cast: false });
    }
  }
  // bina
  const B = group(g); B.position.z = -9;
  box(B, 24, 9.8, 8, 0xeedcb8, 0, 0, -4);
  box(B, 24.4, 0.45, 8.4, 0xcdb894, 0, 9.8, -4);
  box(B, 24.05, 0.9, 0.1, 0xb9a47e, 0, 0, 0.02, { cast: false });
  for (let f = 1; f < 3; f++) box(B, 24.05, 0.35, 0.1, 0xc0583f, 0, f * 3.2 - 0.2, 0.02, { cast: false });
  for (let f = 0; f < 3; f++) for (let i = 0; i < 9; i++) {
    const x = -10.4 + i * 2.6; if (f === 0 && Math.abs(x) < 2) continue;
    windowBox(B, 1.5, 1.7, x, f * 3.2 + 1.1, 0.03);
  }
  box(B, 2.4, 2.7, 0.1, 0x6b4630, 0, 0.3, 0.05);
  box(B, 0.06, 2.5, 0.12, 0x4f2f1c, 0, 0.4, 0.08);
  box(B, 4.2, 0.15, 1.8, 0xcfc8ba, 0, 0, 0.9, { cast: false });
  box(B, 3.4, 0.15, 1.1, 0xcfc8ba, 0, 0.15, 0.55, { cast: false });
  box(B, 3.8, 0.16, 1.7, 0xd5d0c6, 0, 3.0, 0.85);
  g.userData.bell = box(B, 0.38, 0.38, 0.16, 0x8f949b, 1.75, 2.35, 0.08);
  // ağaçlar, banklar
  tree(g, -11.5, -5.5, 1.15); tree(g, 11.5, -5.5, 1.05, 0x6b4a2f, 0x5a8a3f); tree(g, -11.8, 4.5, 1.0); tree(g, 11.8, 4.0, 1.1);
  for (const x of [-8, 8]) { box(g, 1.8, 0.42, 0.45, 0x7c5a3a, x, 0, -7.6); box(g, 1.8, 0.08, 0.5, 0x8d6a46, x, 0.42, -7.6); }
  g.userData.pbench = box(g, 4.4, 0.4, 0.62, 0x8a6a46, 0, 0, -6.45);
  // demir çit + kapı aralığı
  const fc = 0x3f5a48;
  for (let x = -13; x <= 13; x += 0.26) { if (x > 3.2 && x < 5.4) continue; box(g, 0.05, 1.55, 0.05, fc, x, 0, 8.5, { cast: false }); }
  for (const y of [0.18, 1.45]) { box(g, 9.8 + 6.2, 0.07, 0.07, fc, -4.9, y, 8.5, { cast: false }); box(g, 7.6, 0.07, 0.07, fc, 9.2, y, 8.5, { cast: false }); }
  box(g, 0.18, 1.9, 0.18, 0x5a5e62, 3.1, 0, 8.5); box(g, 0.18, 1.9, 0.18, 0x5a5e62, 5.5, 0, 8.5);
  // dışarısı: kaldırım, yol, karşı binalar
  box(g, 80, 0.12, 2.6, 0xc3bcae, 0, 0, 9.9, { cast: false });
  box(g, 80, 0.05, 7, 0x56595f, 0, 0, 14.6, { cast: false });
  for (let i = -6; i <= 6; i++) box(g, 1.6, 0.06, 0.15, 0xe8e4d8, i * 4, 0, 14.6, { cast: false });
  lamp(g, -2.0, 10.6); lamp(g, 9.0, 10.6);
  const cols = [0xe6c9b0, 0xd8d3c5, 0xe8d9a8, 0xc9d3d6, 0xe2bfae];
  for (let i = 0; i < 7; i++) {
    const bb = group(g); bb.position.set(-27 + i * 9, 0, 21 + (i % 2) * 2); bb.rotation.y = Math.PI;
    const h = 8 + (i % 3) * 2.6;
    box(bb, 8, h, 6, cols[i % 5], 0, 0, -3);
    for (let f = 0; f < Math.floor(h / 2.8); f++) for (const wx of [-2.4, 0, 2.4]) windowBox(bb, 1.0, 1.2, wx, f * 2.8 + 1.1, 0.02);
  }
  for (let i = 0; i < 6; i++) { const bb = group(g); bb.position.set(-25 + i * 10, 0, -26); box(bb, 8, 10 + (i % 2) * 3, 6, cols[(i + 2) % 5], 0, 0, 0); }
  return g;
}

// === SET D: sınıf ===
const paneMat = new THREE.MeshLambertMaterial({ color: 0xcfe3f0, emissive: 0xe8f3fb, emissiveIntensity: 0.75 });
function desk(parent, x, z) {
  const G = group(parent); G.position.set(x, 0, z);
  const wd = 0x9c7a52, mt = 0x3b3f45;
  box(G, 1.3, 0.05, 0.5, wd, 0, 0.72, 0);
  box(G, 1.3, 0.36, 0.04, 0x7a5a3a, 0, 0.36, -0.23);
  box(G, 1.24, 0.03, 0.4, 0x7a5a3a, 0, 0.6, 0.0, { cast: false });
  for (const sx of [-0.6, 0.6]) { box(G, 0.05, 0.72, 0.05, mt, sx, 0, -0.2); box(G, 0.05, 0.47, 0.05, mt, sx, 0, 0.62); box(G, 0.05, 0.05, 0.85, mt, sx, 0.06, 0.2); }
  box(G, 1.3, 0.05, 0.36, wd, 0, 0.42, 0.52);
  box(G, 1.3, 0.28, 0.04, wd, 0, 0.6, 0.71);
  return G;
}
function buildD() {
  const g = group(scene);
  const wall = 0xece5d2, low = 0x86ab9a;
  box(g, 10.2, 0.05, 12.4, 0xb39268, 0, 0, -0.5, { cast: false });
  for (let i = 0; i < 12; i++) box(g, 10.2, 0.006, 0.02, 0x9a7b54, 0, 0.05, -6.3 + i * 1.04, { cast: false });
  box(g, 10.2, 3.4, 0.2, wall, 0, 0, -6.1, { cast: false });
  box(g, 10.2, 1.1, 0.04, low, 0, 0, -5.98, { cast: false });
  box(g, 0.2, 3.4, 12.4, wall, -5.1, 0, -0.5, { cast: false });
  box(g, 0.04, 1.0, 12.4, low, -4.98, 0, -0.5, { cast: false });
  box(g, 0.2, 3.4, 12.4, wall, 5.1, 0, -0.5, { cast: false });
  box(g, 0.04, 1.1, 12.4, low, 4.98, 0, -0.5, { cast: false });
  box(g, 10.2, 3.4, 0.2, wall, 0, 0, 5.8, { cast: false });
  box(g, 10.2, 0.1, 12.4, 0xf4f1ea, 0, 3.4, -0.5, { cast: false });
  // tahta
  box(g, 4.5, 1.5, 0.05, 0x8a6a46, 0, 0.88, -5.98, { cast: false });
  box(g, 4.3, 1.3, 0.06, 0x2f4a3c, 0, 0.98, -5.96, { cast: false });
  box(g, 4.3, 0.05, 0.12, 0x8a6a46, 0, 0.93, -5.9, { cast: false });
  for (const [x, y, w] of [[-1.4, 1.95, 1.0], [-1.25, 1.7, 1.3], [-1.35, 1.45, 0.8], [0.9, 1.9, 0.9], [1.0, 1.6, 1.2]]) box(g, w, 0.04, 0.01, 0xe8eae4, x, y, -5.92, { cast: false });
  // pencereler (sol duvar)
  for (const z of [-3.6, -0.4, 2.8]) {
    box(g, 0.1, 1.9, 2.3, 0xf2efe8, -4.96, 0.95, z, { cast: false });
    box(g, 0.08, 1.7, 2.1, 0, -4.92, 1.05, z, { mat: paneMat, cast: false });
    box(g, 0.1, 1.7, 0.06, 0xf2efe8, -4.88, 1.05, z, { cast: false });
    box(g, 0.1, 0.06, 2.1, 0xf2efe8, -4.88, 2.2, z, { cast: false });
    box(g, 0.3, 0.06, 2.3, 0xe0dbcf, -4.85, 0.92, z, { cast: false });
  }
  // kapı + pano (sağ duvar)
  box(g, 0.08, 2.2, 1.0, 0x7a5434, 4.96, 0, -4.7, { cast: false });
  box(g, 0.05, 1.2, 2.6, 0xb08a5a, 4.96, 1.2, -0.5, { cast: false });
  const pc = [0xf2e2a8, 0xd8eaf2, 0xf4c9c0, 0xdff0c8, 0xf2f0e8];
  for (let i = 0; i < 7; i++) box(g, 0.02, 0.32, 0.42, pc[i % 5], 4.92, 1.35 + (i % 2) * 0.48, -1.5 + Math.floor(i / 2) * 0.62, { cast: false });
  // öğretmen masası
  box(g, 1.6, 0.05, 0.75, 0x8a6240, 2.3, 0.75, -4.7);
  box(g, 1.6, 0.7, 0.05, 0x6b4a2f, 2.3, 0.05, -4.35);
  box(g, 0.05, 0.75, 0.75, 0x6b4a2f, 1.52, 0, -4.7); box(g, 0.05, 0.75, 0.75, 0x6b4a2f, 3.08, 0, -4.7);
  chair(g, 2.3, 0, -5.3, 0, 0x7a5434);
  box(g, 0.3, 0.05, 0.22, 0x4e7fc0, 2.0, 0.8, -4.7); box(g, 0.3, 0.07, 0.22, 0xc9463c, 2.6, 0.8, -4.65);
  // sıralar
  g.userData.desks = {};
  for (const x of [-2.7, 0, 2.7]) for (const z of [-3.0, -1.2, 0.6, 2.4]) {
    const d = desk(g, x, z); g.userData.desks[x + ',' + z] = d;
    box(d, 0.26, 0.02, 0.2, [0xe8e2cf, 0xd6e2ec, 0xf0d9b0][Math.abs(Math.round(x + z * 3)) % 3], 0.3, 0.745, 0.02, { cast: false });
  }
  const hd = g.userData.desks['-2.7,-3'];
  g.userData.line = box(hd, 0.028, 0.004, 0.44, 0x23243a, 0, 0.746, 0, { cast: false });
  g.userData.eraser = box(hd, 0.075, 0.035, 0.05, 0xe88a9a, -0.42, 0.745, 0.06);
  g.userData.karne = box(scene, 0.21, 0.012, 0.29, 0xd9e6f2, 0, 0, 0, { cast: false });
  return g;
}
sets.A = buildA(); sets.S = buildS(); sets.D = buildD();

// ---------- oyuncular ----------
const SKIN = 0xe2b38c, SKIN2 = 0xd7a37b;
const P = {};
function C(name, o) { P[name] = makeChar(o); P[name].root.visible = false; return P[name]; }
const HERO = { shirt: 0x3b6fb6, pants: 0x2b3a5c, hair: 0x4a2f1f };
const ONLUK = 0x26282f;
const DM = { hair: 0x2a1a10, hairStyle: 'long', skin: SKIN };
C('h7', Object.assign({ s: 0.6, hs: 1.28, collar: true, backpack: 0xc9463c }, HERO));
C('d7', Object.assign({ s: 0.6, hs: 1.28, collar: true, shirt: ONLUK, pants: ONLUK, skirt: ONLUK }, DM));
C('h8', Object.assign({ s: 0.62, hs: 1.26, collar: true }, HERO));
C('d8', Object.assign({ s: 0.62, hs: 1.26, collar: true, shirt: ONLUK, pants: ONLUK, skirt: ONLUK }, DM));
C('h12', Object.assign({ s: 0.78, hs: 1.12, collar: true }, HERO));
C('d12', Object.assign({ s: 0.78, hs: 1.12, collar: true, shirt: ONLUK, pants: ONLUK, skirt: ONLUK }, DM));
C('h15', Object.assign({ s: 0.88, hs: 1.06 }, HERO));
C('d15', Object.assign({ s: 0.87, hs: 1.06, shirt: 0xf1efe8, pants: 0x2e3550, skirt: 0x2e3550 }, DM));
C('me', { s: 1.0, shirt: 0x355e94, pants: 0x383a44, hair: 0x4a2f1f, beard: 0x4a2f1f });
C('tch', { s: 0.97, hs: 1.0, shirt: 0x9a5a62, pants: 0x3a3a44, skirt: 0x3a3a44, hair: 0x3a2618, hairStyle: 'bun' });
C('tchOld', { s: 0.94, hs: 1.0, shirt: 0x9a5a62, pants: 0x4a4a52, skirt: 0x4a4a52, hair: 0xc4c0b8, hairStyle: 'bun' });
// sınıf arkadaşları: küçükler (önlüklü) ve büyükler (8. sınıf)
const KH = [0x3a2618, 0x1f1610, 0x5a3a20, 0x2a1a10, 0x6a4a2a, 0x1f1610];
const small = [], big = [];
for (let i = 0; i < 6; i++) {
  const girl = i % 2 === 1, sk = i % 3 === 2 ? SKIN2 : SKIN;
  small.push('k' + i); C('k' + i, { s: 0.6 + (i % 3) * 0.015, hs: 1.27, collar: true, shirt: i === 4 ? 0x2e3550 : ONLUK, pants: ONLUK, skirt: girl ? ONLUK : 0, hair: KH[i], hairStyle: girl ? (i === 3 ? 'bun' : 'long') : '', skin: sk, backpack: [0x4a6a3a, 0, 0x7a2f2f, 0, 0x2f3d5a, 0xb08a3a][i] || 0 });
  small.push('j' + i); C('j' + i, { s: 0.77 + (i % 3) * 0.015, hs: 1.12, collar: true, shirt: ONLUK, pants: ONLUK, skirt: girl ? ONLUK : 0, hair: KH[(i + 2) % 6], hairStyle: girl ? 'long' : '', skin: sk });
}
for (let i = 0; i < 9; i++) {
  const girl = i % 3 !== 0, sk = i % 4 === 1 ? SKIN2 : SKIN;
  big.push('m' + i); C('m' + i, { s: 0.86 + (i % 3) * 0.02, hs: 1.06, shirt: i % 4 === 3 ? 0xdfe6ee : 0xf1efe8, pants: i % 2 ? 0x2e3550 : 0x4a4d55, skirt: girl ? 0x2e3550 : 0, hair: KH[i % 6], hairStyle: girl ? (i % 2 ? 'long' : 'bun') : '', skin: sk });
}

// ---------- ışık ----------
const LIGHT = {
  morning: { sky: 0xbcd4ea, fog: 0xcfdcea, hs: 0xe3ecf7, hg: 0x7a8a5a, hi: 1.05, sc: 0xfff2dc, si: 1.55, sp: [14, 22, 12], lamps: 0, wins: 0 },
  bayram: { sky: 0xc3dcf0, fog: 0xd6e3ef, hs: 0xeef3fa, hg: 0x7d8f58, hi: 1.1, sc: 0xfff6e6, si: 1.6, sp: [-12, 20, 14], lamps: 0, wins: 0 },
  sinif: { sky: 0xdfe8ee, fog: 0xe6ecef, hs: 0xfff6ea, hg: 0x8f7d68, hi: 1.15, sc: 0xfff0d8, si: 1.2, sp: [-16, 12, 3], lamps: 0, wins: 0 },
  golden: { sky: 0xf0c48e, fog: 0xe9c39a, hs: 0xfbe0bd, hg: 0x7a6a4c, hi: 0.95, sc: 0xffc683, si: 1.45, sp: [-18, 9, 14], lamps: 0.6, wins: 0.5 },
  dusk: { sky: 0xe7b48f, fog: 0xd9a98a, hs: 0xf3c9a8, hg: 0x5d5a52, hi: 0.85, sc: 0xffb877, si: 1.05, sp: [-20, 8, 6], lamps: 1.6, wins: 0.9 },
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
const D = sets.D.userData;
const show = (setName, chars) => {
  for (const k in sets) sets[k].visible = k === setName;
  for (const k in P) P[k].root.visible = chars.includes(k);
  D.karne.visible = false; D.line.visible = true; D.line.scale.z = 0.44; D.line.position.z = 0;
  D.eraser.position.set(-0.42, 0.745 + 0.0175, 0.06);
  sets.S.userData.pbench.visible = false;
  sets.A.userData.door.visible = true; sets.A.userData.doorBits.forEach(b => b.visible = true);
};
const worldOf = (obj, v) => { obj.updateWorldMatrix(true, false); return v.clone().applyMatrix4(obj.matrixWorld); };
// sıraya oturt: side +1 = koridor tarafı (kahraman), -1 = cam tarafı
const BENCH = 0.47;
function seat(c, dx, dz, side, p = {}, stand = 0) {
  c.root.position.set(dx + side * 0.33, 0, dz + 0.5);
  pose(c, Object.assign({ sit: true, sitLift: stand * Math.PI / 2, y: lerp(BENCH - 0.72 * c.s, 0, stand), ry: Math.PI }, p));
}
function runCircle(c, cx, cz, r, w, ph, u, extra = {}) {
  const a = ph + u * w;
  const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
  c.root.position.set(x, 0, z);
  const dx = -Math.sin(a) * Math.sign(w), dz = Math.cos(a) * Math.sign(w);
  pose(c, Object.assign({ walk: u * 11 + ph, walkAmt: 1, ry: Math.atan2(dx, dz), armLx: -0.2, armRx: -0.2 }, extra));
}

const SC = [
  { a: 0, b: 12, fn: S1 }, { a: 12, b: 24, fn: S2 }, { a: 24, b: 36, fn: S3 }, { a: 36, b: 50, fn: S4 },
  { a: 50, b: 61, fn: S5 }, { a: 61, b: 72.5, fn: S6 }, { a: 72.5, b: 91, fn: S7 },
];

function S1(u) { // 1998 - teneffüs zili, bahçeye koşmak
  show('S', ['h7', 'd7', 'k0', 'k1', 'k2', 'k3', 'k4', 'k5']); applyLight(LIGHT.morning);
  const door = [0, -7.9];
  // kahraman ve sıra arkadaşı kapıdan çıkıp kovalamaca
  const cx = -1.0, cz = 2.6, r = 0.95;
  if (u < 4.2) {
    walkPath(P.d7, [[door[0] - 0.3, door[1]], [-1.0, -3.0], [cx + r, cz]], 0.3, 4.2, u, 11);
    walkPath(P.h7, [[door[0] + 0.3, door[1] - 0.6], [-0.4, -3.6], [cx + r * Math.cos(-0.7), cz + r * Math.sin(-0.7)]], 0.5, 4.2, u, 11);
  } else {
    runCircle(P.d7, cx, cz, r, 0.95, 0, u - 4.2, { armLx: -0.4, armRx: -0.4 });
    runCircle(P.h7, cx, cz, r, 0.95, -0.7, u - 4.2, { armRx: -1.3, armLx: -0.3 });
  }
  const spots = [[-7, -1], [5.5, -2.5], [6.5, 3.5], [-6.5, 4.5], [3.2, 1.0], [-3.5, -4.5]];
  ['k0', 'k1', 'k2', 'k3', 'k4', 'k5'].forEach((k, i) => {
    const t0 = 0.1 + i * 0.35, end = t0 + 3.2;
    const sp = spots[i];
    if (u < end) walkPath(P[k], [[door[0] + (i - 2.5) * 0.3, door[1]], sp], t0, end, u, 11);
    else runCircle(P[k], sp[0] - 0.9, sp[1], 0.9, (i % 2 ? 1 : -1) * 1.1, 0, u - end);
  });
  cam(u, [[0, [-0.2, 1.05, 7.8], [-0.6, 0.9, -1.0], 48], [5, [-0.6, 1.1, 8.2], [-1.0, 0.7, 2.0], 46], [12, [-0.9, 1.05, 7.7], [-1.0, 0.65, 2.6], 45]]);
}
function classFill(list, stand = 0) { // diğer sıralarda oturanlar
  const seats = [[0, -3.0, -1], [0, -3.0, 1], [-2.7, -1.2, -1], [-2.7, -1.2, 1], [0, -1.2, 1], [2.7, -3.0, -1], [2.7, -1.2, 1], [0, 0.6, -1], [-2.7, 0.6, 1]];
  list.forEach((k, i) => { const s = seats[i]; seat(P[k], s[0], s[1], s[2], { nod: 0.1 + (i % 3) * 0.06, look: ((i * 37) % 5 - 2) * 0.08, armLx: -0.9, armRx: -0.9 }, stand); });
  return seats;
}
function S2(u) { // 2000 - sıranın ortasına çizgi, silgi
  show('D', ['h8', 'd8', 'k0', 'k1', 'k2', 'k3', 'k4', 'k5']); applyLight(LIGHT.sinif);
  classFill(['k0', 'k1', 'k2', 'k3', 'k4', 'k5']);
  const draw = seg(u, 1.4, 4.2);
  D.line.scale.z = 0.44 * draw; D.line.position.z = -0.22 + 0.22 * draw;
  const push = seg(u, 6.6, 7.8);
  D.eraser.position.x = lerp(-0.42, 0.12, push);
  const drawing = u > 1.2 && u < 4.4 ? 1 : 0;
  seat(P.h8, -2.7, -3.0, 1, { armRx: -1.15 - 0.15 * drawing + (1 - draw) * 0.1 * drawing, armRz: 0.55 * drawing + 0.15, armLx: -0.9, nod: 0.45 * drawing + 0.1, look: u > 5.0 ? 0.55 : 0.15 });
  seat(P.d8, -2.7, -3.0, -1, { armLx: -1.05 - 0.15 * push, armLz: 0.2 + 0.45 * push * (1 - seg(u, 8.4, 9.4)), armRx: -0.9, nod: u < 5 ? 0.35 : 0.05, look: u < 4.6 ? -0.35 : -0.6 });
  cam(u, [[0, [-1.1, 1.5, -5.5], [-2.65, 0.82, -2.6], 46], [12, [-1.45, 1.4, -5.0], [-2.65, 0.82, -2.55], 42]]);
}
function S3(u) { // 2003 - karne günü, "aferin"
  show('D', ['h12', 'd12', 'tch', 'j0', 'j1', 'j2', 'j3', 'j4', 'j5']); applyLight(LIGHT.sinif);
  classFill(['j0', 'j1', 'j2', 'j3', 'j4', 'j5']);
  const T = P.tch;
  const give = seg(u, 3.2, 4.4), pat = seg(u, 6.2, 6.9) * (1 - seg(u, 10.4, 11.0));
  if (u < 3.0) walkPath(T, [[0.6, -4.9], [-1.3, -4.6], [-1.62, -2.85]], 0.2, 3.0, u, 7);
  else { T.root.position.set(-1.62, 0, -2.85); pose(T, { ry: -Math.PI / 2 + 0.15, armRx: -1.0 * give * (1 - seg(u, 4.8, 5.4)) - 1.45 * pat + Math.sin(u * 6) * 0.06 * pat, armRz: 0.12 * pat, armLx: -0.15, bow: 0.12 + 0.12 * pat, nod: 0.35 }); }
  // karne
  D.karne.visible = u > 1.0;
  const hp = worldOf(T.arms[1].hand, new THREE.Vector3(0, -0.07, 0.05));
  const deskP = new THREE.Vector3(-2.35, 0.762, -3.08);
  const onDesk = seg(u, 4.4, 5.0);
  D.karne.position.lerpVectors(hp, deskP, onDesk); D.karne.rotation.set(onDesk ? 0 : -0.5, 0.2 * (1 - onDesk), 0);
  const up = u > 3.0 ? 1 : 0;
  seat(P.h12, -2.7, -3.0, 1, { armRx: -0.95, armLx: -0.95 - 0.2 * give * (1 - onDesk), nod: lerp(0.15, -0.28, seg(u, 2.6, 3.4)) + 0.4 * seg(u, 5.0, 5.6) * (1 - seg(u, 6.0, 6.6)), look: lerp(0, -0.75, seg(u, 2.6, 3.4)) * (1 - 0.6 * seg(u, 5.0, 5.6) * (1 - seg(u, 6.0, 6.6))) });
  seat(P.d12, -2.7, -3.0, -1, { armLx: -0.9, armRx: -0.9, nod: 0.05, look: -0.45 });
  cam(u, [[0, [-3.0, 1.5, -5.6], [-2.1, 1.0, -2.6], 48], [5, [-3.55, 1.45, -5.5], [-2.0, 1.05, -2.7], 46], [12, [-3.5, 1.4, -5.15], [-2.05, 1.05, -2.7], 42]]);
}
function S4(u) { // 2006 - son gün, aynı sıra, son zil
  const cl = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];
  show('D', ['h15', 'd15'].concat(cl)); applyLight(LIGHT.sinif);
  const ZIL = 9.2;
  const seats = classFill(cl, 0);
  cl.forEach((k, i) => {
    const s = seats[i], ts = ZIL + 0.5 + i * 0.25, tw = ts + 0.9;
    if (u > ts && u < tw) seat(P[k], s[0], s[1], s[2], { nod: 0, armLx: -0.3, armRx: -0.3 }, seg(u, ts, tw));
    else if (u >= tw) {
      const sx = s[0] + s[2] * 0.33, sz = s[1] + 0.5, ax = s[0] + (s[2] > 0 ? 1.35 : -1.35) * (s[0] === -2.7 && s[2] < 0 ? 0 : 1);
      const w = walkPath(P[k], [[sx, sz], [s[0] === -2.7 ? -1.35 : s[0] + 1.35, sz], [s[0] === -2.7 ? -1.35 : s[0] + 1.35, -4.6], [4.8, -4.6]], tw, tw + 5.5, u, 6.5);
      P[k].root.visible = w.x < 4.7;
    }
  });
  const lookW = 1 - seg(u, 4.4, 5.4);
  seat(P.d15, -2.7, -3.0, -1, { armLx: -0.95, armRx: -0.85, nod: 0.1, look: 0.75 * lookW - 0.6 * (1 - lookW) });
  seat(P.h15, -2.7, -3.0, 1, { armRx: -1.05, armRz: 0.45, armLx: -0.9, nod: u < 6.5 ? 0.15 : lerp(0.4, 0.05, seg(u, ZIL + 0.6, ZIL + 1.6)), look: u < 6.5 ? 0.55 : lerp(0.15, 0.55, seg(u, ZIL + 0.6, ZIL + 1.6)) });
  cam(u, [[0, [-4.3, 1.4, -5.3], [-2.55, 0.95, -2.5], 44], [9, [-4.2, 1.38, -5.15], [-2.6, 0.97, -2.5], 42], [14, [-4.05, 1.35, -4.95], [-2.65, 0.98, -2.5], 41]]);
}
const FLASH = 2.6;
function S5(u) { // 2006 - mezuniyet fotoğrafı
  const cl = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];
  show('S', ['h15', 'd15'].concat(cl)); applyLight(LIGHT.bayram);
  sets.S.userData.pbench.visible = true;
  const uu = Math.min(u, FLASH);
  const back = [-1.6, -0.8, 0, 0.8, 1.6], front = [-1.75, -1.05, 1.05, 1.75];
  cl.forEach((k, i) => {
    const c = P[k];
    if (i < 5) { c.root.position.set(back[i], 0, -6.45); pose(c, { y: 0.4, ry: 0, look: Math.sin(uu * 2 + i) * 0.1, armLx: 0.02, tilt: (i % 2 ? 1 : -1) * 0.04 }); }
    else { c.root.position.set(front[i - 5], 0, -5.55); pose(c, { ry: (i - 6.5) * -0.04, look: Math.sin(uu * 2.3 + i) * 0.12, armLx: -0.1, armRx: -0.1 }); }
  });
  P.h15.root.position.set(-0.36, 0, -5.5); P.d15.root.position.set(0.34, 0, -5.5);
  const lean = seg(uu, 0.8, 1.8);
  pose(P.h15, { ry: 0.06, lean: -0.06 * lean, tilt: -0.1 * lean, look: 0.25 * (1 - lean), armRz: 0.1 });
  pose(P.d15, { ry: -0.06, lean: 0.06 * lean, tilt: 0.1 * lean, look: -0.25 * (1 - lean) });
  cam(u, [[0, [0, 1.45, 3.4], [0, 1.05, -5.9], 46], [FLASH, [0, 1.42, 2.9], [0, 1.05, -5.9], 46], [11, [-0.02, 1.38, -0.6], [0, 1.12, -5.6], 40]]);
}
function S6(u) { // 2026 - okulun önünden geçmek, bahçe yine doluyor
  show('S', ['me', 'k0', 'k1', 'k2', 'k3', 'k4', 'k5']); applyLight(LIGHT.golden);
  const M = P.me;
  let mx;
  if (u < 4.6) { mx = walkPath(M, [[7.2, 9.25], [1.4, 9.25]], 0, 4.6, u, 6.0, { nod: 0.08 }).x; }
  else { mx = 1.4; M.root.position.set(1.4, 0, 9.25); const tk = seg(u, 4.6, 5.6); pose(M, { ry: lerp(-Math.PI / 2, -Math.PI + 0.25, tk), nod: 0.05 + 0.1 * seg(u, 7, 8), look: -0.15 * tk }); }
  // çocuklar zil sonrası koşar
  ['k0', 'k1', 'k2', 'k3', 'k4', 'k5'].forEach((k, i) => {
    const t0 = 5.2 + i * 0.45;
    const z = 6.0 + (i % 3) * 0.75, dir = i % 2 ? 1 : -1;
    const x0 = dir > 0 ? -4.5 - i * 0.3 : 6.5 + i * 0.3, x1 = dir > 0 ? 6.5 : -4.5;
    if (i < 2) { // ikisi tam önünde kovalamaca
      const tc = 5.0 + i * 0.3;
      P[k].root.visible = u > tc;
      if (u > tc) runCircle(P[k], 0.9, 7.3, 0.55, 1.1, i * 2.6 + Math.PI, u - tc, { armRx: -0.6 });
      return;
    }
    walkPath(P[k], [[x0, z], [x1, z + 0.3]], t0, t0 + 3.4, u, 11);
    P[k].root.visible = u > t0 && u < t0 + 3.4;
  });
  const cx = clamp(mx, 1.4, 8) - 0.5;
  cam(u, [[0, [cx, 1.2, 3.4], [mx, 1.3, 9.25], 42]]);
  if (u > 4.6) cam(u - 4.6, [[0, [0.9, 1.2, 3.4], [1.4, 1.3, 9.25], 42], [7, [1.0, 1.28, 3.9], [1.3, 1.36, 9.25], 39]]);
}
function S7(u) { // 2026 - öğretmenin kapısı, bir "aferin" daha
  show('A', ['me', 'tchOld']); applyLight(LIGHT.golden, LIGHT.dusk, seg(u, 4, 16) * 0.35);
  const M = P.me, T = P.tchOld, A = sets.A.userData;
  const Tp = [-0.32, -4.45], Mp = [0.36, -3.88];
  const ryT = Math.atan2(Mp[0] - Tp[0], Mp[1] - Tp[1]), ryM = ryT + Math.PI;
  const open = u > 5.0;
  A.door.visible = !open; A.doorBits.forEach(b => b.visible = !open);
  if (u < 4.2) walkPath(M, [[3.0, 1.8], [1.0, -2.4], Mp], 0, 4.2, u, 6.0);
  else {
    M.root.position.set(Mp[0], 0, Mp[1]);
    const bell = seg(u, 4.3, 4.6) * (1 - seg(u, 4.9, 5.2));
    const turn = seg(u, 5.6, 6.6), kiss = seg(u, 7.0, 7.8) * (1 - seg(u, 9.4, 10.2));
    pose(M, { ry: lerp(Math.PI - 0.5, ryM, turn), armRx: -1.4 * bell - 0.85 * kiss, armRz: 0.25 * kiss, bow: 0.5 * kiss, nod: 0.15 * kiss });
  }
  T.root.visible = u > 5.0;
  const tk = seg(u, 5.0, 6.8);
  const tz = lerp(-5.75, Tp[1], tk), tx = lerp(0, Tp[0], tk);
  T.root.position.set(tx, 0, tz);
  const kiss = seg(u, 7.0, 7.8) * (1 - seg(u, 9.4, 10.2)), pat = seg(u, 8.1, 8.6) * (1 - seg(u, 9.8, 10.4)), hold = seg(u, 10.2, 10.9);
  pose(T, { y: tz < -4.85 ? 0.15 : 0.08, ry: lerp(0, ryT, seg(u, 5.8, 6.8)), walk: tk * 7, walkAmt: u > 5.0 && u < 6.8 ? 1 : 0, armRx: -0.75 * kiss, armRz: 0.2 * kiss, armLx: -1.25 * pat - 0.75 * hold + Math.sin(u * 6) * 0.05 * pat, armLz: 0.35 * pat + 0.25 * hold, nod: 0.25, bow: 0.06 });
  cam(u, [[0, [3.6, 1.55, 3.8], [1.4, 1.1, -2.6], 46], [4.4, [1.9, 1.5, 0.2], [0.3, 1.2, -3.6], 44], [7, [-2.6, 1.6, -0.6], [0.0, 1.22, -4.15], 44], [13, [-2.3, 1.55, -0.95], [0.0, 1.22, -4.15], 42]]);
}

// ---------- yazılar ----------
const $ = id => document.getElementById(id);
const SUBS = [
  [4.0, 7.8, 'Teneffüs zili çalınca<br>bütün dünya bahçeye sığardı.'],
  [8.2, 11.6, 'On dakika, bir yaz kadar uzundu.'],
  [12.9, 17.6, 'Sıranın ortasına<br>bir çizgi çekerdiniz.'],
  [18.0, 23.4, 'Silgin yine de hep<br>onun tarafında dururdu.'],
  [24.9, 30.0, 'Karne günü öğretmenin<br>başını okşayıp “Aferin” derdi.'],
  [30.4, 35.4, 'O tek kelime<br>bütün yaza yeterdi.'],
  [36.9, 40.7, 'Son gün yine aynı sıradaydınız.'],
  [41.1, 44.9, 'Kimse bunun son olduğunu<br>söylemedi.'],
  [45.5, 49.5, 'Son zil çaldı.<br>Bu sefer kimse koşmadı.'],
  [53.2, 56.8, 'Fotoğrafta omuz omuza durdunuz.'],
  [57.1, 60.6, 'Bir daha hepiniz<br>aynı karede olmadınız.'],
  [61.9, 66.3, 'Yirmi yıl sonra<br>okulun önünden geçtin.'],
  [66.7, 72.0, 'Zil çaldı, bahçe yine doldu.<br>Bu sefer sen dışarıdaydın.'],
  [73.4, 77.8, 'Öğretmenin hâlâ<br>aynı sokakta oturuyor.'],
  [78.2, 84.0, 'Kapısını çal.<br>Bir “aferin” daha duy.'],
];
// sayaç: [başla, bitir, etiket, önceki sayı, sayı, sayım başı, sayım sonu, açıklama, tarih]
const ZILT = 36 + 9.2;
const COUNTER = [
  [0, 12, 'KALAN TENEFFÜS', 8640, 8640, 0, 0, 'GÜNDE 6 TENEFFÜS · 8 YIL', 'EYLÜL 1998 · 1. SINIF'],
  [12, 24, 'KALAN TENEFFÜS', 8640, 6720, 12.3, 13.8, 'GÜNDE 6 TENEFFÜS · 8 YIL', 'NİSAN 2000 · 2. SINIF'],
  [24, 36, 'KALAN TENEFFÜS', 6720, 3240, 24.3, 25.8, 'GÜNDE 6 TENEFFÜS · 8 YIL', 'HAZİRAN 2003 · 5. SINIF · KARNE'],
  [36, ZILT, 'KALAN TENEFFÜS', 3240, 1, 36.3, 37.9, 'GÜNDE 6 TENEFFÜS · 8 YIL', 'HAZİRAN 2006 · 8. SINIF · SON GÜN'],
  [ZILT, 50, 'KALAN TENEFFÜS', 1, 0, ZILT, ZILT + 0.01, 'GÜNDE 6 TENEFFÜS · 8 YIL', 'HAZİRAN 2006 · 8. SINIF · SON ZİL'],
  [50, 61, 'KALAN TENEFFÜS', 0, 0, 0, 0, 'GÜNDE 6 TENEFFÜS · 8 YIL', 'MEZUNİYET · HAZİRAN 2006'],
  [61, 72.5, 'YAŞIN', 35, 35, 61, 61.01, '', 'EKİM 2026 · OKULUN ÖNÜ'],
  [72.5, 99, 'YAŞIN', 35, 35, 0, 0, '', 'EKİM 2026 · ÖĞRETMENİNİN KAPISI'],
];
$('counter').appendChild($('cap'));
Object.assign($('cap').style, { fontFamily: 'Inter', fontWeight: '600', fontSize: '12.3px', letterSpacing: '2.1px', color: '#eab865', marginTop: '6px', marginBottom: '0', whiteSpace: 'nowrap' });
$('agen').style.fontSize = '50px'; $('agen').style.lineHeight = '56px';
$('lab').style.marginTop = '8px';
$('endS2').style.top = '730px';
$('endS1').style.color = '#eab865'; $('endS1').style.fontSize = '15px'; $('endS1').style.fontWeight = '600';
// mezuniyet fotoğrafı çerçevesi
const frame = document.createElement('div');
Object.assign(frame.style, { position: 'absolute', left: '34px', top: '120px', width: '652px', height: '1010px', boxSizing: 'border-box', border: '18px solid #f3efe4', borderBottomWidth: '74px', boxShadow: '0 14px 40px rgba(0,0,0,.45)', opacity: 0 });
frame.innerHTML = '<div style="position:absolute;left:0;right:0;bottom:-56px;text-align:center;font:400 25px LoraI;color:#4a4540">8-B · Haziran 2006</div>';
$('texts').prepend(frame);
const cv = renderer.domElement;
const fmt = n => n.toLocaleString('tr-TR');
function fadeWin(t, a, b, fi = 0.55, fo = 0.55) { return clamp((t - a) / fi) * clamp((b - t) / fo); }
const END = 85;
let lastN = null, flashT = -9;
function texts(t) {
  $('t0').style.opacity = fadeWin(t, 0.3, 3.6, 0.7, 0.6);
  const s = SUBS.find(x => t >= x[0] - 0.1 && t <= x[1] + 0.1);
  const sub = $('sub');
  if (s) { if (sub.dataset.k !== s[2]) { sub.innerHTML = s[2]; sub.dataset.k = s[2]; } sub.style.opacity = fadeWin(t, s[0], s[1], 0.5, 0.5); }
  else sub.style.opacity = 0;
  const c = COUNTER.find(x => t >= x[0] && t < x[1]) || COUNTER[COUNTER.length - 1];
  const [a, b, label, n0, n1, ca, cb, lab, cap] = c;
  const n = cb > ca ? Math.round(lerp(n0, n1, seg(t, ca, cb))) : n1;
  if ($('agel').textContent !== label) $('agel').textContent = label;
  if ($('lab').textContent !== lab) { $('lab').textContent = lab; $('lab').style.display = lab ? '' : 'none'; }
  if ($('cap').textContent !== cap) $('cap').textContent = cap;
  if (n !== lastN) { if (lastN !== null) flashT = t; lastN = n; $('agen').textContent = fmt(n); }
  const f = clamp(1 - (t - flashT) / 1.4);
  $('agen').style.color = `rgb(${Math.round(lerp(251, 240, f))},${Math.round(lerp(250, 168, f))},${Math.round(lerp(245, 90, f))})`;
  $('cap').style.opacity = fadeWin(t, a + 0.3, b - 0.15, 0.6, 0.4);
  $('counter').style.opacity = clamp((t - 3.4) / 0.7) * clamp((END - 0.2 - t) / 0.6);
  // fotoğraf
  const ft = 50 + FLASH;
  const ph = fadeWin(t, ft, 61, 0.15, 0.4);
  frame.style.opacity = ph;
  cv.style.filter = ph > 0 ? `sepia(${0.42 * ph}) saturate(${1 - 0.2 * ph}) contrast(${1 + 0.04 * ph})` : 'none';
  let dip = 0;
  for (const x of SC.slice(1)) dip = Math.max(dip, 1 - Math.abs(t - x.a) / 0.42);
  dip = Math.max(dip, 1 - Math.abs(t - ft) / 0.22);
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
window.DURATION = 91;
document.fonts.ready.then(() => { window.READY = true; });
