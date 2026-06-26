/* VividGrasp — browser recreation of the PyBullet sorting demo.
   See README for the mapping back to the original Python repo. */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(() => {
'use strict';

// ---------- Ball specs (from constants.py + simulate_objects.py) ----------
const BALL_SPECS = {
  tennis:   { radius: 0.0327, mass: 0.058,  color: 0xd9e83a, label: 'Tennis'    },
  baseball: { radius: 0.0365, mass: 0.145,  color: 0xf2efe4, label: 'Baseball'  },
  pingpong: { radius: 0.0200, mass: 0.0027, color: 0xff7a1c, label: 'Ping Pong' },
};

// Tray positions: one per ball type. z negative = behind the arm.
const TRAYS = {
  tennis:   { x: -0.40, z: -0.42 },
  baseball: { x:  0.00, z: -0.46 },
  pingpong: { x:  0.40, z: -0.42 },
};
const TRAY_HALF = 0.10;   // half-width of tray opening
const TRAY_HEIGHT = 0.04; // wall height

// Arm geometry
const BASE_H = 0.10;
const L1 = 0.32;
const L2 = 0.30;

// Table extent
const TABLE_X = 1.0, TABLE_Z = 0.70;

// ---------- Three.js scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x161b22);

const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 50);
camera.position.set(0.9, 0.85, 0.95);
camera.lookAt(0, 0.1, 0);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.1, 0);
controls.enableDamping = true;
controls.minDistance = 0.5;
controls.maxDistance = 3.0;
controls.maxPolarAngle = Math.PI * 0.49;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(0.7, 1.5, 0.6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -1.2; sun.shadow.camera.right = 1.2;
sun.shadow.camera.top = 1.2;   sun.shadow.camera.bottom = -1.2;
sun.shadow.camera.near = 0.1;  sun.shadow.camera.far = 4;
scene.add(sun);

// Table (the "plane" from the Python sim)
const tableMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
const table = new THREE.Mesh(new THREE.BoxGeometry(TABLE_X * 2, 0.02, TABLE_Z * 2), tableMat);
table.position.y = -0.01;
table.receiveShadow = true;
scene.add(table);

// Trays
function makeTray(color) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1f26, roughness: 0.8 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(TRAY_HALF * 2, 0.005, TRAY_HALF * 2), floorMat);
  floor.position.y = 0.0025; floor.receiveShadow = true;
  g.add(floor);
  const wallT = 0.006;
  const mk = (sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
  };
  mk(TRAY_HALF*2 + wallT*2, TRAY_HEIGHT, wallT, 0, TRAY_HEIGHT/2, -TRAY_HALF);
  mk(TRAY_HALF*2 + wallT*2, TRAY_HEIGHT, wallT, 0, TRAY_HEIGHT/2,  TRAY_HALF);
  mk(wallT, TRAY_HEIGHT, TRAY_HALF*2,            -TRAY_HALF, TRAY_HEIGHT/2, 0);
  mk(wallT, TRAY_HEIGHT, TRAY_HALF*2,             TRAY_HALF, TRAY_HEIGHT/2, 0);
  return g;
}
const trayMeshes = {};
for (const [kind, pos] of Object.entries(TRAYS)) {
  const t = makeTray(BALL_SPECS[kind].color);
  t.position.set(pos.x, 0, pos.z);
  scene.add(t);
  trayMeshes[kind] = t;
}

// ---------- Arm (2-axis: yaw + shoulder + elbow) ----------
const linkMat = new THREE.MeshStandardMaterial({ color: 0xc9d1d9, roughness: 0.45, metalness: 0.25 });
const jointMat = new THREE.MeshStandardMaterial({ color: 0x30363d, roughness: 0.6, metalness: 0.2 });
const baseMat = new THREE.MeshStandardMaterial({ color: 0x484f58, roughness: 0.7 });

const arm = new THREE.Group();
scene.add(arm);

const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, BASE_H, 24), baseMat);
baseMesh.position.y = BASE_H / 2;
baseMesh.castShadow = true; baseMesh.receiveShadow = true;
arm.add(baseMesh);

const yawGroup = new THREE.Group();
yawGroup.position.y = BASE_H;
arm.add(yawGroup);

const shoulderPivot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), jointMat);
shoulderPivot.castShadow = true;
yawGroup.add(shoulderPivot);

const shoulderGroup = new THREE.Group();
yawGroup.add(shoulderGroup);

const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, L1, 16), linkMat);
upperArm.rotation.x = Math.PI / 2;
upperArm.position.z = L1 / 2;
upperArm.castShadow = true;
shoulderGroup.add(upperArm);

const elbowGroup = new THREE.Group();
elbowGroup.position.z = L1;
shoulderGroup.add(elbowGroup);

const elbowPivot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), jointMat);
elbowPivot.castShadow = true;
elbowGroup.add(elbowPivot);

const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, L2, 16), linkMat);
lowerArm.rotation.x = Math.PI / 2;
lowerArm.position.z = L2 / 2;
lowerArm.castShadow = true;
elbowGroup.add(lowerArm);

const endEffector = new THREE.Group();
endEffector.position.z = L2;
elbowGroup.add(endEffector);

const eeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf85149, roughness: 0.5 }));
eeMesh.castShadow = true;
endEffector.add(eeMesh);

// Current joint angles (radians) — animated smoothly
const armState = { yaw: 0, shoulder: Math.PI / 2 - 0.4, elbow: -1.2 };
applyJoints();

function applyJoints() {
  yawGroup.rotation.y = armState.yaw;
  shoulderGroup.rotation.x = -armState.shoulder;
  elbowGroup.rotation.x = -armState.elbow;
}

// IK: solve (yaw, shoulder, elbow) so end-effector reaches (tx, ty, tz) world coords.
// Returns null if out of reach.
function ik(tx, ty, tz) {
  const yaw = Math.atan2(tx, tz);
  const r = Math.sqrt(tx * tx + tz * tz);
  const h = ty - BASE_H;
  const d2 = r * r + h * h;
  const c2 = (d2 - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  if (c2 < -1 || c2 > 1) return null;
  // elbow-up: negative θ2
  const theta2 = -Math.acos(c2);
  const k1 = L1 + L2 * Math.cos(theta2);
  const k2 = L2 * Math.sin(theta2);
  const theta1 = Math.atan2(h, r) - Math.atan2(k2, k1);
  return { yaw, shoulder: theta1, elbow: theta2 };
}

function endEffectorWorld() {
  const v = new THREE.Vector3();
  endEffector.getWorldPosition(v);
  return v;
}

// ---------- Balls + minimal physics ----------
const balls = []; // { kind, mesh, pos, vel, radius, attached }

function randomSafePosition(radius) {
  // Mirrors simulate_objects.py random_safe_position(): reject overlaps + too-close-to-arm.
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() * 2 - 1) * 0.45;
    const z = 0.20 + Math.random() * 0.35;
    if (Math.hypot(x, z) < 0.18) continue;
    let ok = true;
    for (const b of balls) {
      const dx = b.pos.x - x, dz = b.pos.z - z;
      if (Math.hypot(dx, dz) < (b.radius + radius + 0.01)) { ok = false; break; }
    }
    if (ok) return { x, y: radius + 0.25, z };
  }
  return { x: (Math.random() * 2 - 1) * 0.4, y: radius + 0.3, z: 0.3 };
}

function spawnBall(kind) {
  const spec = BALL_SPECS[kind];
  const p = randomSafePosition(spec.radius);
  const mat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.55, metalness: 0.05 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 24, 16), mat);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.position.set(p.x, p.y, p.z);
  scene.add(mesh);
  balls.push({
    kind, mesh, radius: spec.radius,
    pos: new THREE.Vector3(p.x, p.y, p.z),
    vel: new THREE.Vector3(0, 0, 0),
    attached: false,
    settled: false,
  });
}

function removeBall(b) {
  scene.remove(b.mesh);
  b.mesh.geometry.dispose();
  b.mesh.material.dispose();
  const i = balls.indexOf(b);
  if (i >= 0) balls.splice(i, 1);
}

function stepPhysics(dt) {
  const g = 9.8;
  for (const b of balls) {
    if (b.attached) continue;
    b.vel.y -= g * dt;
    b.pos.addScaledVector(b.vel, dt);

    // Table (top at y=0)
    if (b.pos.y - b.radius < 0) {
      b.pos.y = b.radius;
      if (b.vel.y < 0) b.vel.y = -b.vel.y * 0.28;
      b.vel.x *= 0.86; b.vel.z *= 0.86;
      if (Math.abs(b.vel.y) < 0.05 && Math.abs(b.vel.x) < 0.05 && Math.abs(b.vel.z) < 0.05) {
        b.vel.set(0, 0, 0);
        b.settled = true;
      }
    }

    // Tray walls: keep ball within tray AABB if it's already over a tray
    for (const [, tp] of Object.entries(TRAYS)) {
      const dx = b.pos.x - tp.x, dz = b.pos.z - tp.z;
      if (Math.abs(dx) < TRAY_HALF + 0.05 && Math.abs(dz) < TRAY_HALF + 0.05 && b.pos.y < TRAY_HEIGHT + b.radius) {
        // Soft wall: nudge inward
        if (dx > TRAY_HALF - b.radius) { b.pos.x = tp.x + TRAY_HALF - b.radius; b.vel.x = -Math.abs(b.vel.x) * 0.4; }
        if (dx < -TRAY_HALF + b.radius) { b.pos.x = tp.x - TRAY_HALF + b.radius; b.vel.x =  Math.abs(b.vel.x) * 0.4; }
        if (dz > TRAY_HALF - b.radius) { b.pos.z = tp.z + TRAY_HALF - b.radius; b.vel.z = -Math.abs(b.vel.z) * 0.4; }
        if (dz < -TRAY_HALF + b.radius) { b.pos.z = tp.z - TRAY_HALF + b.radius; b.vel.z =  Math.abs(b.vel.z) * 0.4; }
      }
    }

    // Edge of table
    if (Math.abs(b.pos.x) > TABLE_X - b.radius) { b.pos.x = Math.sign(b.pos.x) * (TABLE_X - b.radius); b.vel.x *= -0.4; }
    if (Math.abs(b.pos.z) > TABLE_Z - b.radius) { b.pos.z = Math.sign(b.pos.z) * (TABLE_Z - b.radius); b.vel.z *= -0.4; }
  }

  // Ball-ball separation
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      if (a.attached || b.attached) continue;
      const d = a.pos.clone().sub(b.pos);
      const dist = d.length();
      const min = a.radius + b.radius;
      if (dist > 1e-6 && dist < min) {
        const push = d.multiplyScalar((min - dist) / 2 / dist);
        a.pos.add(push); b.pos.sub(push);
        a.vel.multiplyScalar(0.6); b.vel.multiplyScalar(0.6);
      }
    }
  }

  for (const b of balls) b.mesh.position.copy(b.pos);
}

// ---------- Sort routine (state machine) ----------
const Status = (() => {
  const el = document.getElementById('status');
  return { set: (s) => { el.textContent = s; } };
})();

let playing = false;
const routine = {
  state: 'IDLE',
  target: null,      // ball being sorted
  t: 0,              // 0..1 progress through current move
  duration: 1.2,     // seconds for current move
  startAngles: null,
  goalAngles: null,
  holdTimer: 0,
};

function easeSinusoidal(t) { return (1 - Math.cos(Math.PI * t)) / 2; }

function startMove(goal, duration) {
  if (!goal) return false;
  routine.startAngles = { ...armState };
  routine.goalAngles = goal;
  routine.t = 0;
  routine.duration = duration;
  return true;
}

function tickMove(dt) {
  routine.t += dt / routine.duration;
  const s = easeSinusoidal(Math.min(routine.t, 1));
  const a = routine.startAngles, g = routine.goalAngles;
  armState.yaw      = a.yaw      + (g.yaw      - a.yaw)      * s;
  armState.shoulder = a.shoulder + (g.shoulder - a.shoulder) * s;
  armState.elbow    = a.elbow    + (g.elbow    - a.elbow)    * s;
  applyJoints();
  return routine.t >= 1;
}

function pickNextBall() {
  // Choose nearest settled ball.
  let best = null, bestD = Infinity;
  for (const b of balls) {
    if (b.attached) continue;
    if (!b.settled && b.pos.y > b.radius * 1.5) continue;
    const d = Math.hypot(b.pos.x, b.pos.z);
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}

function stepRoutine(dt) {
  switch (routine.state) {
    case 'IDLE': {
      if (!playing) return;
      const b = pickNextBall();
      if (!b) { Status.set('table clear — waiting for balls'); return; }
      routine.target = b;
      const goal = ik(b.pos.x, b.pos.y + 0.10, b.pos.z);
      if (!goal) { Status.set(`out of reach (${b.kind}) — skipping`); b.settled = false; b.pos.y += 0.001; return; }
      startMove(goal, 1.0);
      routine.state = 'APPROACH';
      Status.set(`approaching ${BALL_SPECS[b.kind].label}`);
      break;
    }
    case 'APPROACH': {
      if (tickMove(dt)) {
        const b = routine.target;
        const goal = ik(b.pos.x, b.pos.y + 0.005, b.pos.z);
        if (!goal) { routine.state = 'IDLE'; return; }
        startMove(goal, 0.6);
        routine.state = 'DESCEND';
      }
      break;
    }
    case 'DESCEND': {
      if (tickMove(dt)) {
        routine.target.attached = true;
        routine.state = 'LIFT';
        const tp = TRAYS[routine.target.kind];
        const goal = ik(routine.target.pos.x, 0.30, routine.target.pos.z);
        startMove(goal, 0.5);
        Status.set(`grabbed ${BALL_SPECS[routine.target.kind].label}`);
      }
      break;
    }
    case 'LIFT': {
      if (tickMove(dt)) {
        const tp = TRAYS[routine.target.kind];
        const goal = ik(tp.x, 0.30, tp.z);
        startMove(goal, 1.2);
        routine.state = 'TRANSPORT';
        Status.set(`transporting to ${routine.target.kind} tray`);
      }
      break;
    }
    case 'TRANSPORT': {
      if (tickMove(dt)) {
        const tp = TRAYS[routine.target.kind];
        const goal = ik(tp.x, TRAY_HEIGHT + 0.05, tp.z);
        startMove(goal, 0.6);
        routine.state = 'DROP';
      }
      break;
    }
    case 'DROP': {
      if (tickMove(dt)) {
        const b = routine.target;
        b.attached = false;
        b.vel.set(0, 0, 0);
        b.settled = false;
        routine.holdTimer = 0.4;
        routine.state = 'RELEASE_WAIT';
        Status.set(`released into ${b.kind} tray`);
      }
      break;
    }
    case 'RELEASE_WAIT': {
      routine.holdTimer -= dt;
      if (routine.holdTimer <= 0) {
        const goal = { yaw: 0, shoulder: Math.PI / 2 - 0.4, elbow: -1.2 };
        startMove(goal, 0.9);
        routine.state = 'HOME';
      }
      break;
    }
    case 'HOME': {
      if (tickMove(dt)) {
        routine.state = 'IDLE';
        routine.target = null;
      }
      break;
    }
  }

  // If attached, snap ball to the end-effector each frame.
  if (routine.target && routine.target.attached) {
    const w = endEffectorWorld();
    routine.target.pos.copy(w);
    routine.target.pos.y -= 0.022 + routine.target.radius * 0.4;
  }
}

// ---------- Detector (offscreen overhead render + HSV masks) ----------
const DETECT_W = 192, DETECT_H = 144;
const detectorTarget = new THREE.WebGLRenderTarget(DETECT_W, DETECT_H, {
  minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.UnsignedByteType,
});
const detectorCam = new THREE.OrthographicCamera(-0.70, 0.70, 0.55, -0.50, 0.1, 3.0);
detectorCam.position.set(0, 1.6, 0.025);
detectorCam.lookAt(0, 0, 0.025);
detectorCam.up.set(0, 0, 1);

const camViewCtx = document.getElementById('cam-view').getContext('2d');
const maskCtx = {
  tennis:   document.getElementById('mask-tennis').getContext('2d'),
  baseball: document.getElementById('mask-baseball').getContext('2d'),
  pingpong: document.getElementById('mask-pingpong').getContext('2d'),
};
const pixelBuf = new Uint8Array(DETECT_W * DETECT_H * 4);
const camImage = camViewCtx.createImageData(DETECT_W, DETECT_H);
const maskImages = {
  tennis:   maskCtx.tennis.createImageData(96, 72),
  baseball: maskCtx.baseball.createImageData(96, 72),
  pingpong: maskCtx.pingpong.createImageData(96, 72),
};

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r)      h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else               h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = mx === 0 ? 0 : d / mx;
  return [h, s, mx];
}

function classify(h, s, v) {
  // Tennis (yellow-green), Baseball (off-white), Ping-pong (orange).
  // Thresholds tuned for the lit MeshStandardMaterial rendering — looser than the
  // raw color bands so shaded pixels still register.
  if (s < 0.18 && v > 0.45) return 'baseball';
  if (s > 0.30 && v > 0.30) {
    if (h >= 45 && h <= 95) return 'tennis';
    if (h >= 5  && h <= 38) return 'pingpong';
  }
  return null;
}

let detectAccum = 0;
function runDetector(dt) {
  detectAccum += dt;
  if (detectAccum < 0.10) return; // ~10 fps
  detectAccum = 0;

  renderer.setRenderTarget(detectorTarget);
  renderer.render(scene, detectorCam);
  renderer.setRenderTarget(null);
  renderer.readRenderTargetPixels(detectorTarget, 0, 0, DETECT_W, DETECT_H, pixelBuf);

  // Flip Y when copying (readPixels origin is bottom-left).
  const cd = camImage.data;
  const masks = { tennis: maskImages.tennis.data, baseball: maskImages.baseball.data, pingpong: maskImages.pingpong.data };
  // Mask thumbnails are 96x72 — downsample 2x.
  for (let y = 0; y < DETECT_H; y++) {
    const srcRow = (DETECT_H - 1 - y) * DETECT_W * 4;
    const dstRow = y * DETECT_W * 4;
    for (let x = 0; x < DETECT_W; x++) {
      const si = srcRow + x * 4;
      const di = dstRow + x * 4;
      cd[di]   = pixelBuf[si];
      cd[di+1] = pixelBuf[si+1];
      cd[di+2] = pixelBuf[si+2];
      cd[di+3] = 255;
    }
  }
  camViewCtx.putImageData(camImage, 0, 0);

  // Clear masks
  for (const k in masks) masks[k].fill(0);
  for (let y = 0; y < 72; y++) {
    for (let x = 0; x < 96; x++) {
      const sx = x * 2, sy = (71 - y) * 2;
      const si = (sy * DETECT_W + sx) * 4;
      const r = pixelBuf[si], g = pixelBuf[si+1], b = pixelBuf[si+2];
      const [h, s, v] = rgbToHsv(r, g, b);
      const cls = classify(h, s, v);
      if (cls) {
        const di = (y * 96 + x) * 4;
        const spec = BALL_SPECS[cls];
        masks[cls][di]   = (spec.color >> 16) & 0xff;
        masks[cls][di+1] = (spec.color >> 8)  & 0xff;
        masks[cls][di+2] =  spec.color        & 0xff;
        masks[cls][di+3] = 255;
      }
    }
  }
  maskCtx.tennis.putImageData(maskImages.tennis, 0, 0);
  maskCtx.baseball.putImageData(maskImages.baseball, 0, 0);
  maskCtx.pingpong.putImageData(maskImages.pingpong, 0, 0);
}

// ---------- UI wiring ----------
document.getElementById('play').addEventListener('click', (e) => {
  playing = !playing;
  e.target.textContent = playing ? '⏸ Pause' : '▶ Play';
  Status.set(playing ? 'running…' : 'paused');
});

document.getElementById('reset').addEventListener('click', () => {
  for (const b of [...balls]) removeBall(b);
  playing = false;
  document.getElementById('play').textContent = '▶ Play';
  routine.state = 'IDLE';
  routine.target = null;
  armState.yaw = 0; armState.shoulder = Math.PI / 2 - 0.4; armState.elbow = -1.2;
  applyJoints();
  Status.set('reset');
});

for (const btn of document.querySelectorAll('.ball-btn')) {
  btn.addEventListener('click', () => {
    spawnBall(btn.dataset.kind);
    Status.set(`spawned ${BALL_SPECS[btn.dataset.kind].label}`);
  });
}

// ---------- Animation loop ----------
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

let last = performance.now();
function tick() {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.04);
  last = now;

  resize();
  stepPhysics(dt);
  stepRoutine(dt);
  controls.update();
  renderer.render(scene, camera);
  runDetector(dt);

  requestAnimationFrame(tick);
}

// Seed the table with one of each so the page is non-empty at load.
spawnBall('tennis');
spawnBall('baseball');
spawnBall('pingpong');
Status.set('ready — press Play to sort');

requestAnimationFrame(tick);
})();
