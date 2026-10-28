import * as THREE from '../../engine/three.module.js';

// ===== Bölüm metinleri (açılış başlığı + kapanış kartı) =====
const EPTEXT = {
  title: 'Ya köydeki son yazın<br>olduğunu bilseydin?',
  end1: 'BUNU KUZENİNE GÖNDER',
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
  c.standOnly = [];
  if (o.longSkirt) c.standOnly.push(box(c.hips, 0.54 * s, 0.66 * s, 0.34 * s, o.longSkirt, 0, -0.62 * s, 0));
  if (o.apron) {
    box(c.upper, 0.42 * s, 0.36 * s, 0.02 * s, o.apron, 0, 0.02 * s, 0.16 * s, { cast: false });
    c.standOnly.push(box(c.hips, 0.44 * s, 0.5 * s, 0.02 * s, o.apron, 0, -0.48 * s, 0.185 * s, { cast: false }));
  }
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
  if (c.standOnly) c.standOnly.forEach(m => m.visible = !p.sit);
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


// === SET B: köydeki ev + veranda + çardak + tandır + bahçe kapısı ===
function buildB() {
  const g = group(scene);
  ground(g, 0x6f9f45);
  const Hs = group(g); Hs.position.z = -4;
  box(Hs, 10, 6, 6, 0xdccfb9, 0, 0, -3);
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
  // sedir (minderli) + yastıklar
  box(Hs, 1.9, 0.42, 0.6, 0x7a5434, -3.0, 0.12, 0.45); box(Hs, 1.9, 0.1, 0.6, 0xa8463c, -3.0, 0.54, 0.45);
  box(Hs, 0.5, 0.4, 0.14, 0xc9a24a, -3.55, 0.64, 0.2); box(Hs, 0.5, 0.4, 0.14, 0x8a3a5a, -2.45, 0.64, 0.2);
  g.userData.dedeChair = chair(Hs, 1.6, 0.12, 0.7, 0, 0x8a5a36);
  geranium(Hs, -1.0, 0.12, 0.35); geranium(Hs, 4.2, 0.12, 0.35);
  // veranda lambası
  const lm = new THREE.MeshLambertMaterial({ color: 0xfff1c9, emissive: 0xffc46a, emissiveIntensity: 0 }); g.userData.lanternMat = lm;
  box(Hs, 0.24, 0.34, 0.18, 0x26221f, -1.2, 1.9, 0.1, { cast: false });
  box(Hs, 0.18, 0.26, 0.14, 0, -1.2, 1.94, 0.14, { mat: lm, cast: false });
  const pl = new THREE.PointLight(0xffc27a, 0, 9, 1.4); pl.position.set(-1.6, 2.3, -3.2); g.add(pl); g.userData.porch = pl;
  // bahçe yolu
  box(g, 1.3, 0.03, 9.9, 0xb8a582, 0, 0, 3.55, { cast: false });
  // çit + kapı aralığı
  for (let i = -14; i <= 14; i++) { if (Math.abs(i) <= 1) continue; box(g, 0.12, 0.9, 0.08, 0xc8b89c, i * 0.8, 0, 8.5); }
  for (const s of [-1, 1]) {
    box(g, 10.1, 0.08, 0.06, 0xc8b89c, s * 6.2, 0.7, 8.5); box(g, 10.1, 0.08, 0.06, 0xc8b89c, s * 6.2, 0.3, 8.5);
    box(g, 0.18, 1.15, 0.18, 0xa8987c, s * 1.15, 0, 8.5);
  }
  const gate = group(g); gate.position.set(-1.1, 0, 8.5); g.userData.gate = gate;
  for (let i = 0; i < 3; i++) box(gate, 0.1, 0.85, 0.06, 0xc8b89c, 0.25 + i * 0.35, 0, 0);
  box(gate, 0.95, 0.08, 0.06, 0xc8b89c, 0.6, 0.65, 0); box(gate, 0.95, 0.08, 0.06, 0xc8b89c, 0.6, 0.25, 0);
  for (let i = -6; i <= 6; i++) { box(g, 0.12, 0.9, 0.08, 0xc8b89c, -11.5, 0, i * 0.8 + 3); box(g, 0.12, 0.9, 0.08, 0xc8b89c, 11.5, 0, i * 0.8 + 3); }
  // köy yolu + araba
  box(g, 90, 0.03, 4.2, 0xb3a27e, 0, 0, 11.4, { cast: false });
  const car = group(g); car.position.set(3.2, 0, 11.6); g.userData.car = car;
  box(car, 4.0, 0.7, 1.7, 0x9fb3a8, 0, 0.32, 0);
  box(car, 2.2, 0.6, 1.56, 0x9fb3a8, -0.25, 1.02, 0);
  box(car, 2.06, 0.44, 1.6, 0x2f3a44, -0.25, 1.1, 0, { cast: false });
  box(car, 0.08, 0.6, 1.6, 0x9fb3a8, -0.25, 1.02, 0, { cast: false });
  for (const [x, z] of [[-1.3, 0.78], [1.3, 0.78], [-1.3, -0.78], [1.3, -0.78]]) box(car, 0.62, 0.62, 0.24, 0x1e1e20, x, 0.0, z);
  box(car, 0.06, 0.16, 0.36, 0xf2e8c8, 2.0, 0.66, 0.55, { cast: false }); box(car, 0.06, 0.16, 0.36, 0xf2e8c8, 2.0, 0.66, -0.55, { cast: false });
  // sebze tarhı, ağaçlar
  box(g, 3, 0.25, 1.2, 0x5b3d26, -7.5, 0, 1.8);
  for (let i = 0; i < 6; i++) box(g, 0.25, 0.35, 0.25, 0x3f7f35, -8.7 + i * 0.48, 0.25, 1.8);
  for (let i = 0; i < 3; i++) box(g, 0.12, 0.12, 0.12, 0xd2402e, -8.4 + i * 0.9, 0.45, 1.85);
  tree(g, -9, -2, 1.15, 0x6b4a2f, 0x5a8f3c);
  pine(g, 10, -6, 1.6); pine(g, -14, -7, 1.9); pine(g, 14, 4, 1.4);
  for (let i = 0; i < 6; i++) tree(g, -26 + i * 10, 20 + (i % 2) * 5, 1.2 + (i % 3) * 0.15, 0x6b4a2f, [0x5a8f3c, 0x4f7f3a, 0x638f45][i % 3]);
  // tandır
  const TD = group(g); TD.position.set(-5.25, 0, 4.55); g.userData.tandir = TD;
  cyl(TD, 0.46, 0.62, 0.74, 0xb07a52, 0, 0, 0, 10);
  cyl(TD, 0.5, 0.5, 0.06, 0x9a6844, 0, 0.72, 0, 10);
  cyl(TD, 0.3, 0.3, 0.02, 0x2a1a12, 0, 0.775, 0, 10);
  const fm = new THREE.MeshLambertMaterial({ color: 0xffa040, emissive: 0xff7a20, emissiveIntensity: 1.2 });
  box(TD, 0.3, 0.02, 0.3, 0, 0, 0.78, 0, { mat: fm, cast: false });
  box(TD, 0.28, 0.2, 0.06, 0x2a1a12, 0, 0.1, 0.56, { cast: false }); // hava deliği
  box(TD, 0.2, 0.12, 0.02, 0, 0, 0.12, 0.6, { mat: fm, cast: false });
  for (let i = 0; i < 5; i++) box(TD, 0.7, 0.12, 0.12, 0x7a5434, -1.3 + (i % 2) * 0.1, (i >> 1) * 0.12, -0.6 + (i % 3) * 0.14);
  box(TD, 0.5, 0.08, 0.5, 0xe8dcc0, 0.1, 0, -1.05); // hamur tahtası
  for (let i = 0; i < 3; i++) box(TD, 0.3, 0.03, 0.24, 0xe9dcc0, 0.1, 0.08 + i * 0.03, -1.05, { cast: false });
  const SM = group(TD); SM.userData.p = []; g.userData.smoke = SM;
  for (let i = 0; i < 12; i++) { const m = box(SM, 0.16, 0.16, 0.16, 0xd9d6d0, 0, 0, 0, { cast: false }); m.material = new THREE.MeshLambertMaterial({ color: 0xdedbd5, transparent: true, opacity: 0.5 }); SM.userData.p.push([m, i / 12]); }
  // çardak + masa
  const C = group(g); C.position.set(5.2, 0, 2.6); g.userData.cardak = C;
  for (const [x, z] of [[-2, -1.4], [2, -1.4], [-2, 1.4], [2, 1.4]]) box(C, 0.16, 2.6, 0.16, 0x7a5434, x, 0, z);
  box(C, 4.3, 0.12, 0.14, 0x7a5434, 0, 2.6, -1.4); box(C, 4.3, 0.12, 0.14, 0x7a5434, 0, 2.6, 1.4);
  for (let i = 0; i < 6; i++) box(C, 0.1, 0.1, 3.1, 0x7a5434, -2 + i * 0.8, 2.72, 0);
  const leafC = [0x4f8a3a, 0x5a9a42, 0x467d33];
  for (let i = 0; i < 18; i++) { const x = -2.1 + (i % 6) * 0.84, z = -1.3 + Math.floor(i / 6) * 1.25; box(C, 0.9, 0.22, 0.9, leafC[i % 3], x + ((i * 37) % 5) * 0.03, 2.8, z); }
  for (let i = 0; i < 5; i++) box(C, 0.12, 0.25, 0.12, 0x6a3a6a, -1.6 + i * 0.8, 2.52, -0.6 + (i % 2) * 0.9);
  const T = group(C); g.userData.table = T;
  box(T, 2.8, 0.06, 1.2, 0xf4f1ea, 0, 0.78, 0);
  box(T, 2.84, 0.18, 1.24, 0xe9e4da, 0, 0.62, 0, { cast: false });
  for (const [x, z] of [[-1.25, -0.5], [1.25, -0.5], [-1.25, 0.5], [1.25, 0.5]]) box(T, 0.08, 0.62, 0.08, 0x6b4a2f, x, 0, z);
  g.userData.chairs = [];
  const seats = [[-0.8, -0.95, 0], [0, -0.95, 0], [0.8, -0.95, 0], [-0.8, 0.95, Math.PI], [0.8, 0.95, Math.PI], [1.85, 0, -Math.PI / 2]];
  for (const [x, z, ry] of seats) g.userData.chairs.push(chair(C, x, 0, z, ry, 0x8a5a36));
  g.userData.seats = seats.map(([x, z, ry]) => [5.2 + x, 2.6 + z, ry]);
  // tavla (açık) + kapalı
  const top = 0.81;
  const TV = group(T); TV.position.set(1.0, top, 0.28); TV.rotation.y = 0.785; g.userData.tavla = TV;
  for (const s of [-1, 1]) {
    box(TV, 0.36, 0.04, 0.56, 0x6e3f22, s * 0.19, 0, 0);
    box(TV, 0.32, 0.01, 0.52, 0xe1c79a, s * 0.19, 0.04, 0, { cast: false });
    for (let i = 0; i < 6; i++) for (const e of [-1, 1]) box(TV, 0.03, 0.006, 0.18, i % 2 ? 0x2a2a2a : 0xa8322a, s * 0.19 - 0.13 + i * 0.052, 0.05, e * 0.16, { cast: false });
  }
  box(TV, 0.03, 0.05, 0.56, 0x5a321a, 0, 0, 0);
  const pieces = [];
  for (let i = 0; i < 14; i++) {
    const w = i % 2 === 0, m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 10), mat(w ? 0xf4f1e8 : 0x2a201c));
    const col = i % 7, row = Math.floor(i / 7);
    m.position.set((col < 4 ? -0.32 : 0.06) + (col % 4) * 0.052, 0.06, (w ? 1 : -1) * (0.22 - row * 0.045)); m.castShadow = true; TV.add(m); pieces.push(m);
  }
  TV.userData.pieces = pieces;
  const dice = [box(TV, 0.03, 0.03, 0.03, 0xfbfaf6, 0.12, 0.045, 0.03), box(TV, 0.03, 0.03, 0.03, 0xfbfaf6, 0.17, 0.045, -0.02)];
  TV.userData.dice = dice;
  const TC = group(T); TC.position.set(1.0, top, 0.28); TC.rotation.y = 0.785; g.userData.tavlaKapali = TC;
  box(TC, 0.74, 0.09, 0.56, 0x6e3f22, 0, 0, 0); box(TC, 0.74, 0.01, 0.04, 0x4a2a16, 0, 0.09, 0, { cast: false });
  box(TC, 0.05, 0.03, 0.06, 0xc9a24a, 0, 0.05, 0.29, { cast: false });
  teaGlass(T, 0.25, top, 0.3); g.userData.glass2 = group(T); teaGlass(g.userData.glass2, 1.25, top, -0.25);
  return g;
}
sets.B = buildB();
const B = sets.B.userData;

// ---------- oyuncular ----------
const SKIN = 0xe2b38c, SKIN2 = 0xd7a37b;
const P = {};
function C(name, o) { P[name] = makeChar(o); P[name].root.visible = false; return P[name]; }
const HERO = { shirt: 0x3b6fb6, pants: 0x2b3a5c, hair: 0x4a2f1f };
C('h6', Object.assign({ s: 0.58, hs: 1.3 }, HERO, { pants: 0x4a5a7a, legs2: SKIN }));
C('h8', Object.assign({ s: 0.62, hs: 1.26 }, HERO, { pants: 0x4a5a7a, legs2: SKIN }));
C('h10', Object.assign({ s: 0.68, hs: 1.2 }, HERO, { pants: 0x4a5a7a, legs2: SKIN }));
C('h12', Object.assign({ s: 0.78, hs: 1.12 }, HERO));
C('h14', Object.assign({ s: 0.88, hs: 1.06, backpack: 0x3d4a3a }, HERO));
C('me', { s: 1.0, shirt: 0x355e94, pants: 0x383a44, hair: 0x4a2f1f, beard: 0x4a2f1f });
const DEDE = { s: 0.98, shirt: 0xeae7dc, vest: 0x5a4a3a, pants: 0x3e3a36, hair: 0xd8d6d0, mustache: 0xdcdcd6, skin: SKIN2, cap: 0x4a4640 };
C('dede', DEDE);
C('dede2', Object.assign({}, DEDE, { s: 0.96 }));
C('nine', { s: 0.9, shirt: 0x6a4a7a, pants: 0x5a3e5a, longSkirt: 0x5a3e5a, hairStyle: 'scarf', scarf: 0xf1ece0, apron: 0xe0d2ac });
C('nineOld', { s: 0.86, shirt: 0x6a5a7a, pants: 0x5a4a5a, longSkirt: 0x5a4a5a, vest: 0x7a6a5a, hairStyle: 'scarf', scarf: 0xf7f5ef });
const bread = box(scene, 0.34, 0.03, 0.26, 0xd9a860, 0, 0, 0, { cast: false });
box(bread, 0.3, 1.1, 0.12, 0xc08a44, 0, 0, 0.2, { cast: false });
const money = box(scene, 0.13, 0.012, 0.07, 0x8fae7a, 0, 0, 0, { cast: false });

// ---------- ışık ----------
const LIGHT = {
  morning: { sky: 0xbcd4ea, fog: 0xcfdcea, hs: 0xe3ecf7, hg: 0x7a8a5a, hi: 1.05, sc: 0xfff2dc, si: 1.55, sp: [14, 22, 12], lamps: 0, wins: 0, porch: 0 },
  dawn: { sky: 0xe8c3a8, fog: 0xe2c6b2, hs: 0xf6dccb, hg: 0x6f6a58, hi: 0.95, sc: 0xffcf9a, si: 1.25, sp: [-16, 7, 14], lamps: 0, wins: 0.35, porch: 0.3 },
  golden: { sky: 0xf0c48e, fog: 0xe9c39a, hs: 0xfbe0bd, hg: 0x7a6a4c, hi: 0.95, sc: 0xffc683, si: 1.45, sp: [-18, 9, 14], lamps: 0.6, wins: 0.5, porch: 0.4 },
  dusk: { sky: 0xd9a48a, fog: 0xc79a88, hs: 0xefc3a8, hg: 0x5d5a52, hi: 0.85, sc: 0xffb877, si: 0.95, sp: [-20, 7, 8], lamps: 1.4, wins: 0.9, porch: 0.8 },
  night: { sky: 0x17223a, fog: 0x1c2741, hs: 0x6274a0, hg: 0x2a2c36, hi: 0.8, sc: 0x9fb4dc, si: 0.55, sp: [-10, 18, 12], lamps: 1.8, wins: 1.0, porch: 1 },
};
function applyLight(L, Lb, k = 0) {
  const mix = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  const Bl = Lb || L;
  scene.background = mix(L.sky, Bl.sky); scene.fog.color = mix(L.fog, Bl.fog);
  hemi.color = mix(L.hs, Bl.hs); hemi.groundColor = mix(L.hg, Bl.hg); hemi.intensity = lerp(L.hi, Bl.hi, k);
  sun.color = mix(L.sc, Bl.sc); sun.intensity = lerp(L.si, Bl.si, k);
  const sp = lerp3(L.sp, Bl.sp, k); sun.position.set(sp[0], sp[1], sp[2]);
  lampMats.forEach(m => m.emissiveIntensity = lerp(L.lamps, Bl.lamps, k));
  winMats.forEach((m, i) => m.emissiveIntensity = (i % 3 === 1 ? 0.25 : 1) * lerp(L.wins, Bl.wins, k));
  const pk = lerp(L.porch, Bl.porch, k);
  B.lanternMat.emissiveIntensity = 1.6 * pk; B.porch.intensity = 3.2 * pk;
}
function cam(t, keys) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1] || a;
  const k = b[0] > a[0] ? seg(t, a[0], b[0]) : 0;
  const p = lerp3(a[1], b[1], k), l = lerp3(a[2], b[2], k);
  camera.position.set(p[0], p[1], p[2]); camera.lookAt(l[0], l[1], l[2]);
  const f = lerp(a[3] || 48, b[3] || 48, k); if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); }
}
const show = (chars, o = {}) => {
  for (const k in P) P[k].root.visible = chars.includes(k);
  B.chairs.forEach(c => c.visible = true);
  B.tavla.visible = !!o.tavla; B.tavlaKapali.visible = !!o.tavlaKapali;
  B.glass2.visible = !!o.tavla;
  B.smoke.visible = !!o.smoke; B.car.visible = !!o.car;
  B.gate.rotation.y = o.gateOpen ? -1.6 : 0;
  bread.visible = false; money.visible = false;
};
const worldOf = (obj, v) => { obj.updateWorldMatrix(true, false); return v.clone().applyMatrix4(obj.matrixWorld); };
const VER = 0.12;            // veranda zemini
const SEDIR = 0.64;          // sedir minderi üstü
const CHAIR = 0.51;          // sandalye oturağı
function sitOn(c, h, extra = {}) { pose(c, Object.assign({ sit: true, y: h - 0.72 * c.s }, extra)); }
const onVer = z => z < -1.6 ? VER : 0;

const SC = [
  { a: 0, b: 12, fn: S1 }, { a: 12, b: 24, fn: S2 }, { a: 24, b: 36, fn: S3 }, { a: 36, b: 48, fn: S4 },
  { a: 48, b: 62, fn: S5 }, { a: 62, b: 73, fn: S6 }, { a: 73, b: 91, fn: S7 },
];

function S1(u) { // Temmuz 1997 - köye varış, ninen kapıda
  show(['h6', 'nine', 'dede'], { gateOpen: true }); applyLight(LIGHT.morning);
  const K = P.h6, N = P.nine, D = P.dede;
  // dede veranda sandalyesinde
  D.root.position.set(1.6, 0, -3.3);
  const wave = seg(u, 2.8, 3.3) * (1 - seg(u, 5.0, 5.6));
  sitOn(D, CHAIR + VER, { ry: -0.25, armRx: -1.1 - 1.5 * wave + Math.sin(u * 7) * 0.18 * wave, armRz: 0.25 * wave, armLx: -1.1, nod: -0.05, look: -0.2 });
  // ninen kapıda, kolları açılır
  const open = seg(u, 5.6, 6.6), hug = seg(u, 7.0, 7.8);
  N.root.position.set(0.12, VER, lerp(-3.55, -3.2, seg(u, 5.0, 6.6)));
  pose(N, { y: VER, ry: 0, armLx: -1.3 * open - 0.2 * hug, armRx: -1.3 * open - 0.2 * hug, armLz: 0.6 * open * (1 - hug) - 0.35 * hug, armRz: 0.6 * open * (1 - hug) - 0.35 * hug, bow: 0.35 * hug, nod: 0.2 * hug + 0.05, look: 0 });
  // çocuk kapıdan koşar
  if (u < 7.0) {
    const w = walkPath(K, [[0.2, 10.2], [0.05, 8.5], [0.12, -2.55]], 0.4, 7.0, u, 10.5, { armLx: -0.2, armRx: -0.2 });
    K.root.position.y = onVer(w.z);
  } else {
    K.root.position.set(0.12, VER, -2.6);
    pose(K, { y: VER, ry: Math.PI, armLx: -1.6 * hug, armRx: -1.6 * hug, armLz: -0.25 * hug, armRz: -0.25 * hug, nod: -0.4 * hug, look: 0 });
  }
  cam(u, [[0, [1.6, 2.3, 14.5], [0, 1.0, 1.0], 44], [7.0, [2.4, 1.6, 2.6], [0.1, 1.0, -2.6], 42], [12, [2.0, 1.4, 1.4], [0.12, 1.05, -2.9], 40]]);
}
function S2(u) { // Ağustos 1999 - çardakta tavla
  show(['h8', 'dede'], { tavla: true }); applyLight(LIGHT.golden);
  B.chairs[1].visible = false; B.chairs[2].visible = false;
  const D = P.dede, K = P.h8, S = B.seats;
  const roll = seg(u, 1.2, 1.7) * (1 - seg(u, 2.0, 2.4));
  const kmove = seg(u, 4.0, 4.6) * (1 - seg(u, 5.2, 5.8));
  const cheer = seg(u, 7.0, 7.5) * (1 - seg(u, 9.4, 10.0));
  { const [x, z, ry] = S[5]; D.root.position.set(x, 0, z); sitOn(D, CHAIR, { ry: ry + 0.3, armRx: -1.25 - 0.4 * roll + Math.sin(u * 14) * 0.12 * roll, armLx: -1.2, nod: 0.25 - 0.2 * cheer, look: cheer ? 0.35 * cheer : 0.1, bow: 0.08 }); }
  { const [x, z, ry] = S[4]; K.root.position.set(x, 0, z - 0.05); sitOn(K, CHAIR, { ry: ry - 0.3, armRx: -1.3 - 0.35 * kmove - 1.6 * cheer, armLx: -1.25 - 1.7 * cheer, armRz: 0.35 * cheer, armLz: 0.35 * cheer, nod: 0.35 * (1 - cheer) - 0.15 * cheer, look: -0.2 * (1 - cheer) - 0.3 * cheer }); }
  const d = B.tavla.userData.dice; d[0].rotation.set(u * 9 * roll, u * 7 * roll, 0); d[1].rotation.set(u * 8 * roll, 0, u * 6 * roll);
  const pc = B.tavla.userData.pieces[2]; pc.position.x = lerp(-0.216, 0.11, seg(u, 4.2, 5.0)); pc.position.y = 0.06 + 0.05 * Math.sin(Math.PI * seg(u, 4.2, 5.0));
  cam(u, [[0, [2.7, 2.35, -1.0], [6.45, 1.0, 2.95], 40], [12, [3.0, 2.25, -0.6], [6.45, 1.02, 2.95], 38]]);
}
function S3(u) { // Temmuz 2001 - tandır, ilk ekmek
  show(['h10', 'nine'], { smoke: true }); applyLight(LIGHT.dawn);
  const N = P.nine, K = P.h10, TD = B.tandir;
  const npos = [-4.35, 4.55];
  N.root.position.set(npos[0], 0, npos[1]);
  const into = seg(u, 0.4, 1.4) * (1 - seg(u, 2.6, 3.4));
  const turn = seg(u, 3.6, 4.6), give = seg(u, 4.4, 5.4) * (1 - seg(u, 6.4, 7.0));
  pose(N, { ry: lerp(-Math.PI / 2, Math.PI / 2 - 0.25, turn), bow: 0.55 * into + 0.15 * give, armRx: -1.1 * into - 1.15 * give - 0.15, armLx: -1.1 * into - 0.4 * give - 0.1, armRz: -0.1 * into, nod: 0.25 + 0.15 * into, look: 0 });
  K.root.position.set(-3.5, 0, 4.85);
  const take = seg(u, 5.0, 5.6), eat = seg(u, 8.2, 8.9) * (1 - seg(u, 10.4, 11.0));
  pose(K, { ry: -Math.PI / 2 - 0.25 + 0.2 * (1 - turn), armLx: -1.25 * take - 0.4 * eat - (1 - take) * 0.2, armRx: -1.2 * take - 0.5 * eat - (1 - take) * 0.2, armLz: -0.25 * take, armRz: -0.25 * take, nod: 0.3 * take - 0.15 * eat - 0.15 * (1 - take), look: 0.15 * (1 - take) });
  // ekmek: tandır -> ninenin eli -> çocuğun elleri
  bread.visible = u > 2.4;
  const hn = worldOf(N.arms[1].hand, new THREE.Vector3(0, -0.08, 0.06));
  const hk1 = worldOf(K.arms[0].hand, new THREE.Vector3(0, -0.06, 0.04)), hk2 = worldOf(K.arms[1].hand, new THREE.Vector3(0, -0.06, 0.04));
  const hk = hk1.clone().add(hk2).multiplyScalar(0.5);
  const toK = seg(u, 5.2, 5.6);
  bread.position.lerpVectors(hn, hk, toK); bread.position.y += 0.03;
  bread.rotation.set(0, N.root.rotation.y * (1 - toK) + K.root.rotation.y * toK, 0);
  // duman
  for (const [m, p] of B.smoke.userData.p) {
    const k = (u * 0.22 + p) % 1;
    m.position.set(Math.sin(k * 6 + p * 9) * 0.18 + k * 0.5, 0.85 + k * 3.0, Math.cos(p * 11) * 0.12);
    const sc = 0.6 + k * 1.6; m.scale.set(0.16 * sc, 0.16 * sc, 0.16 * sc); m.material.opacity = 0.55 * (1 - k);
  }
  cam(u, [[0, [-3.1, 1.8, 9.2], [-3.95, 0.95, 4.65], 42], [12, [-3.2, 1.65, 8.5], [-3.9, 1.0, 4.65], 39]]);
}
function S4(u) { // Ağustos 2003 - sedirde masal, uyuyakalmak
  show(['h12', 'nine']); applyLight(LIGHT.night);
  const N = P.nine, K = P.h12;
  N.root.position.set(-3.35, 0, -3.5); K.root.position.set(-2.62, 0, -3.5);
  const talk = 1 - seg(u, 8.0, 9.0);
  const sleep = seg(u, 6.2, 8.4), stroke = seg(u, 8.6, 9.4);
  sitOn(N, SEDIR, { ry: 0.2, armRx: -0.75 - 0.25 * Math.max(0, Math.sin(u * 2.3)) * talk - 0.8 * stroke + Math.sin(u * 2.2) * 0.12 * stroke, armRz: -0.55 * stroke, armLx: -0.8, nod: 0.05 + 0.12 * stroke, look: 0.45, tilt: 0.06 * stroke });
  sitOn(K, SEDIR, { ry: -0.15, armLx: -0.85, armRx: -0.85, lean: 0.16 * sleep, tilt: 0.2 * sleep, nod: lerp(-0.05, 0.16, sleep), look: -0.45 * (1 - sleep) });
  cam(u, [[0, [-2.35, 1.4, 0.4], [-3.0, 0.95, -3.5], 44], [12, [-2.55, 1.3, -0.4], [-2.98, 0.95, -3.5], 40]]);
}
const ZERO = 48 + 11.0;
function S5(u) { // Ağustos 2005 - dönüş günü, avuca sıkıştırılan harçlık
  show(['h14', 'dede2'], { car: true, gateOpen: u > 9.0 }); applyLight(LIGHT.morning, LIGHT.golden, 0.25);
  const D = P.dede2, K = P.h14;
  const Dp = [-0.35, 7.25], Kp = [0.35, 7.85];
  const ryD = Math.atan2(Kp[0] - Dp[0], Kp[1] - Dp[1]), ryK = ryD + Math.PI;
  const give = seg(u, 1.4, 2.4) * (1 - seg(u, 4.8, 5.6)), wrap = seg(u, 2.8, 3.6) * (1 - seg(u, 4.8, 5.6));
  const shh = seg(u, 6.0, 6.6) * (1 - seg(u, 7.6, 8.2)), pat = seg(u, 8.0, 8.5) * (1 - seg(u, 9.0, 9.4));
  const wave = seg(u, 11.6, 12.1);
  D.root.position.set(Dp[0], 0, Dp[1]);
  pose(D, { ry: ryD + 0.3 * wave, armRx: -0.95 * give - 2.0 * shh - 1.3 * pat - 2.5 * wave + Math.sin(u * 6) * 0.15 * wave, armRz: 0.12 * shh + 0.3 * wave, armLx: -0.9 * wrap - 0.1, armLz: -0.15 * wrap, nod: 0.18 * (give + wrap) / 2 + 0.05, bow: 0.06, look: 0 });
  if (u < 9.4) {
    K.root.position.set(Kp[0], 0, Kp[1]);
    pose(K, { ry: ryK, armRx: -0.85 * give - 0.1, armLx: -0.1, nod: 0.15 * give + 0.1 * shh - 0.08, look: 0 });
  } else {
    const w = walkPath(K, [[Kp[0], Kp[1]], [0.25, 8.6], [0.9, 10.5]], 9.4, 11.6, u, 6.2);
    if (u > 11.6) { const tr = seg(u, 11.6, 12.2); pose(K, { ry: lerp(w.ry, w.ry + Math.PI - 0.4, tr), armRx: -2.5 * seg(u, 12.0, 12.5) + Math.sin(u * 6) * 0.15 * seg(u, 12, 12.5), armRz: 0.3 * seg(u, 12, 12.5), look: 0 }); }
  }
  money.visible = u > 1.0 && u < 5.0;
  if (money.visible) {
    const hd = worldOf(D.arms[1].hand, new THREE.Vector3(0, -0.08, 0.05)), hk = worldOf(K.arms[1].hand, new THREE.Vector3(0, -0.08, 0.05));
    money.position.lerpVectors(hd, hk, seg(u, 2.3, 2.8)); money.rotation.set(0, ryD, 0.3);
  }
  cam(u, [[0, [3.1, 1.7, 4.5], [0, 1.15, 7.55], 42], [9.2, [2.8, 1.6, 4.8], [0, 1.15, 7.6], 40], [11, [-4.4, 1.7, 5.0], [1.3, 1.05, 9.9], 44], [14, [-4.5, 1.75, 4.7], [1.4, 1.05, 10.0], 44]]);
}
function S6(u) { // Temmuz 2026 - çardak yerinde, karşıdaki sandalye boş
  show(['me'], { tavlaKapali: true }); applyLight(LIGHT.golden);
  B.chairs[1].visible = false; B.chairs[2].visible = false;
  const M = P.me, S = B.seats;
  const [x, z, ry] = S[4];
  if (u < 4.6) walkPath(M, [[1.6, 6.5], [3.2, 4.6], [x, z + 0.55]], 0, 4.6, u, 6.0);
  else {
    const sd = seg(u, 4.6, 5.6);
    M.root.position.set(x, 0, z + 0.55 * (1 - sd) - 0.05 * sd);
    const touch = seg(u, 6.4, 7.2), lookChair = seg(u, 8.2, 9.2);
    if (sd < 0.5) pose(M, { ry: lerp(Math.PI / 2, ry - 0.3, sd * 2), nod: 0.1 });
    else sitOn(M, CHAIR, { ry: ry - 0.3, sitLift: (1 - sd) * 1.2, armRx: -1.25 - 0.1 * touch, armLx: -1.0 - 0.25 * touch, nod: 0.38 * (1 - lookChair) + 0.05, look: -0.15 - 0.4 * lookChair, bow: 0.05 });
  }
  cam(u, [[0, [2.7, 2.35, -1.0], [2.4, 1.0, 4.6], 42], [2.6, [2.7, 2.35, -1.0], [3.4, 1.0, 4.4], 42], [5.6, [2.7, 2.35, -1.0], [6.4, 1.0, 2.95], 40], [11, [3.0, 2.25, -0.6], [6.65, 1.0, 2.85], 38]]);
}
function S7(u) { // Temmuz 2026 - ninen sedirde, masalın sonu
  show(['me', 'nineOld']); applyLight(LIGHT.dusk, LIGHT.night, seg(u, 3, 12) * 0.6);
  const N = P.nineOld, M = P.me;
  N.root.position.set(-3.35, 0, -3.5);
  const turn = seg(u, 3.2, 4.2), cheek = seg(u, 5.8, 6.8) * (1 - seg(u, 9.0, 9.8)), lean = seg(u, 9.4, 11.0);
  sitOn(N, SEDIR, { ry: 0.2 + 0.35 * turn, armRx: -0.75 - 1.45 * cheek - 0.6 * lean, armRz: -0.4 * cheek - 0.5 * lean, armLx: -0.8, nod: 0.1 + 0.08 * cheek, look: 0.3 * turn, bow: 0.08 });
  if (u < 3.4) {
    walkPath(M, [[0.8, -2.95], [-2.55, -3.05]], 0, 3.4, u, 6.0, { y: VER });
  } else {
    const sd = seg(u, 3.4, 4.4);
    M.root.position.set(lerp(-2.55, -2.58, sd), 0, lerp(-3.05, -3.5, sd));
    if (sd < 0.5) pose(M, { y: VER, ry: lerp(-2.7, -0.15, sd * 2) });
    else sitOn(M, SEDIR, { ry: -0.15, sitLift: (1 - sd) * 1.2, armLx: -0.9, armRx: -0.85, lean: 0.2 * lean, tilt: 0.28 * lean, nod: 0.05 + 0.1 * lean, look: -0.5 * (1 - lean * 0.6) });
  }
  cam(u, [[0, [-2.3, 1.6, 2.4], [-2.6, 1.0, -3.3], 44], [4.0, [-2.35, 1.4, 0.4], [-3.0, 0.98, -3.5], 44], [12, [-2.55, 1.32, -0.2], [-2.98, 1.02, -3.5], 41], [18, [-2.45, 1.6, 1.2], [-2.98, 1.05, -3.5], 44]]);
}

// ---------- yazılar ----------
const $ = id => document.getElementById(id);
const SUBS = [
  [4.0, 7.8, 'Yaz, köyün tozlu yolunu<br>görünce başlardı.'],
  [8.2, 11.6, 'Ninen kapıda,<br>önlüğüyle beklerdi.'],
  [12.9, 17.6, 'Akşamları çardakta<br>dedenle tavla oynardın.'],
  [18.0, 23.4, 'Hep sen kazanırdın.<br>Nedenini yıllar sonra anladın.'],
  [24.9, 29.6, 'Ninen şafakta tandırı yakardı.'],
  [30.0, 35.4, 'İlk ekmek, daha sıcakken<br>hep senin avucundaydı.'],
  [36.9, 41.6, 'Yatmadan önce<br>bir masal anlatırdı.'],
  [42.0, 47.4, 'Sonunu hiç duymadın.<br>Hep ortasında uyudun.'],
  [49.0, 53.4, 'Deden, maaşından ayırdığını<br>avucuna sıkıştırdı.'],
  [53.8, 58.0, '“Annene söyleme,” dedi.<br>Söylemedin.'],
  [63.2, 67.6, 'Ertesi yaz dershane vardı.<br>Sonra hep bir şey çıktı.'],
  [68.0, 72.6, 'Çardak yerinde, tavla da.<br>Karşındaki sandalye boş.'],
  [74.4, 78.8, 'Ninen o masalın sonunu<br>hâlâ biliyor.'],
  [79.2, 84.2, 'Git, yanına otur.<br>Bu sefer sonuna kadar dinle.'],
];
// sayaç: [başla, bitir, etiket, önceki sayı, sayı, sayım başı, sayım sonu, açıklama, tarih]
const LBL = 'DEDENLE KALAN YAZ';
const COUNTER = [
  [0, 12, LBL, 9, 9, 0, 0, 'YAŞIN 6', 'TEMMUZ 1997 · KÖYDEKİ EV'],
  [12, 24, LBL, 9, 7, 12.3, 13.8, 'YAŞIN 8', 'AĞUSTOS 1999 · ÇARDAK ALTI'],
  [24, 36, LBL, 7, 5, 24.3, 25.8, 'YAŞIN 10', 'TEMMUZ 2001 · TANDIR BAŞI'],
  [36, 48, LBL, 5, 3, 36.3, 37.8, 'YAŞIN 12', 'AĞUSTOS 2003 · SEDİRDE, GECE'],
  [48, ZERO, LBL, 3, 1, 48.3, 49.8, 'YAŞIN 14', 'AĞUSTOS 2005 · DÖNÜŞ GÜNÜ'],
  [ZERO, 62, LBL, 1, 0, ZERO, ZERO + 0.01, 'YAŞIN 14', 'AĞUSTOS 2005 · DÖNÜŞ GÜNÜ'],
  [62, 73, 'YAŞIN', 35, 35, 0, 0, '', 'TEMMUZ 2026 · ÇARDAK ALTI'],
  [73, 99, 'YAŞIN', 35, 35, 0, 0, '', 'TEMMUZ 2026 · VERANDA'],
];
$('counter').appendChild($('cap'));
Object.assign($('cap').style, { fontFamily: 'Inter', fontWeight: '600', fontSize: '12.3px', letterSpacing: '2.1px', color: '#eab865', marginTop: '6px', marginBottom: '0', whiteSpace: 'nowrap' });
$('agen').style.fontSize = '50px'; $('agen').style.lineHeight = '56px';
$('lab').style.marginTop = '8px';
$('endS2').style.top = '730px';
$('endS1').style.color = '#eab865'; $('endS1').style.fontSize = '15px'; $('endS1').style.fontWeight = '600';
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
  if (n !== lastN) { if (lastN !== null) flashT = t; lastN = n; $('agen').textContent = String(n); }
  const f = clamp(1 - (t - flashT) / 1.4);
  $('agen').style.color = `rgb(${Math.round(lerp(251, 240, f))},${Math.round(lerp(250, 168, f))},${Math.round(lerp(245, 90, f))})`;
  $('cap').style.opacity = fadeWin(t, a + 0.3, b - 0.15, 0.6, 0.4);
  $('counter').style.opacity = clamp((t - 3.4) / 0.7) * clamp((END - 0.2 - t) / 0.6);
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
window.DURATION = 91;
document.fonts.ready.then(() => { window.READY = true; });
