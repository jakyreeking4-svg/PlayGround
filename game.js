import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.querySelector('#view');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba78c);
scene.fog = new THREE.FogExp2(0x9ba78c, 0.018);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 180);
camera.position.set(0, 1.68, 0);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
scene.add(new THREE.HemisphereLight(0xdce5cb, 0x354332, 1.5));
const sun = new THREE.DirectionalLight(0xffdfad, 2.4);
sun.position.set(-32, 48, -18); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -55; sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55; sun.shadow.bias = -0.0007;
scene.add(sun);

const mat = (color, roughness = 1) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
const groundMat = mat(0x526448), barkMat = mat(0x49382a), leafMats = [mat(0x304b36), mat(0x3c5a3c), mat(0x49643d), mat(0x566e42)];
const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), groundMat);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.12; ground.receiveShadow = true; scene.add(ground);
// A pale, winding deer trail gives the forest a readable path.
const pathPoints = [];
for (let i = 0; i <= 28; i++) { const z = 65 - i * 4.65; pathPoints.push(new THREE.Vector3(Math.sin(i * .22) * 5, -.08, z)); }
const pathCurve = new THREE.CatmullRomCurve3(pathPoints);
const pathVertices = [], pathIndices = [];
const pathSteps = 120, pathHalfWidth = 2.25;
for (let i = 0; i <= pathSteps; i++) {
  const u = i / pathSteps, center = pathCurve.getPointAt(u), tangent = pathCurve.getTangentAt(u);
  const nx = tangent.z, nz = -tangent.x;
  pathVertices.push(center.x + nx * pathHalfWidth, -.08, center.z + nz * pathHalfWidth);
  pathVertices.push(center.x - nx * pathHalfWidth, -.08, center.z - nz * pathHalfWidth);
  if (i < pathSteps) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    pathIndices.push(a, b, c, b, d, c);
  }
}
const pathGeometry = new THREE.BufferGeometry();
pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pathVertices, 3));
pathGeometry.setIndex(pathIndices); pathGeometry.computeVertexNormals();
const pathMesh = new THREE.Mesh(pathGeometry, mat(0x827a5d));
scene.add(pathMesh);

const treeSpots = [];
function makeTree(x, z, scale = 1) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.24, .38, 4.2, 6), barkMat); trunk.position.y = 2.05; trunk.castShadow = true; group.add(trunk);
  const leaf = leafMats[Math.floor(Math.random() * leafMats.length)];
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.35 - i * .24, 4.7 - i * .3, 7), leaf);
    crown.position.set((Math.random() - .5) * .28, 4.4 + i * 1.38, (Math.random() - .5) * .25);
    crown.rotation.y = Math.random() * 1.5; crown.castShadow = true; group.add(crown);
  }
  scene.add(group); treeSpots.push({ x, z, r: 1.05 * scale });
}
for (let z = -88; z <= 82; z += 8) {
  for (let x = -88; x <= 88; x += 8) {
    const d = Math.hypot(x, z);
    if (d < 8 || Math.random() > .82) continue;
    const px = x + (Math.random() - .5) * 6, pz = z + (Math.random() - .5) * 6;
    const pathX = Math.sin((65 - pz) / 4.65 * .22) * 5;
    if (Math.abs(px - pathX) < 4.8 && Math.random() < .9) continue;
    makeTree(px, pz, .72 + Math.random() * .75);
  }
}
// Fallen logs, stones and ferns add cover and silhouettes without heavy assets.
const rockMat = mat(0x656957), fernMat = mat(0x71834d);
for (let i = 0; i < 54; i++) {
  const x = (Math.random() - .5) * 150, z = (Math.random() - .5) * 150;
  if (Math.hypot(x, z) < 7) continue;
  if (Math.random() < .45) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.35 + Math.random() * .45, 0), rockMat);
    rock.position.set(x, .12, z); rock.scale.y = .62; rock.rotation.set(Math.random(), Math.random(), Math.random()); rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
  } else {
    const bush = new THREE.Group(); bush.position.set(x, 0, z);
    for (let j = 0; j < 5; j++) { const frond = new THREE.Mesh(new THREE.ConeGeometry(.12, .8 + Math.random() * .35, 4), fernMat); frond.position.set((Math.random() - .5) * .65, .35, (Math.random() - .5) * .65); frond.rotation.z = (Math.random() - .5) * .9; bush.add(frond); }
    scene.add(bush);
  }
}

// First-person field rifle, attached to the camera so the player always has a clear action cue.
const rifle = new THREE.Group();
const gunMetal = new THREE.MeshStandardMaterial({ color: 0x202723, metalness: .48, roughness: .48 });
const wood = mat(0x654b32), cloth = mat(0x303b31);
function gunPart(geometry, material, pos, rot = [0, 0, 0]) { const m = new THREE.Mesh(geometry, material); m.position.set(...pos); m.rotation.set(...rot); rifle.add(m); return m; }
gunPart(new THREE.BoxGeometry(.13, .14, .72), wood, [-.04, -.04, -.12], [0, -.12, -.18]);
gunPart(new THREE.BoxGeometry(.12, .13, .42), gunMetal, [-.015, .015, -.48]);
gunPart(new THREE.CylinderGeometry(.027, .027, .86, 8), gunMetal, [.015, .07, -.91], [Math.PI / 2, 0, 0]);
gunPart(new THREE.CylinderGeometry(.055, .055, .24, 8), gunMetal, [.015, .085, -.67], [Math.PI / 2, 0, 0]);
gunPart(new THREE.BoxGeometry(.08, .27, .12), cloth, [-.02, -.22, -.45], [-.2, 0, -.08]);
gunPart(new THREE.BoxGeometry(.11, .13, .18), wood, [-.05, -.13, .18], [.18, 0, -.15]);
camera.add(rifle); rifle.position.set(.35, -.38, -.48); scene.add(camera);

const animals = [];
const animalMats = { body: mat(0x956e4e), light: mat(0xc3a17a), dark: mat(0x493e32), eye: new THREE.MeshStandardMaterial({ color: 0x171710, roughness: .4 }), fur: mat(0x9b8a69) };
function makeAnimal(x, z, kind = 'deer') {
  const isDeer = kind === 'deer', root = new THREE.Group(); root.position.set(x, 0, z); root.userData.kind = kind;
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), isDeer ? animalMats.body : animalMats.fur);
  body.scale.set(isDeer ? .88 : .43, isDeer ? .5 : .4, isDeer ? .43 : .62); body.position.y = isDeer ? 1.15 : .5; body.castShadow = true; root.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(isDeer ? .19 : .08, isDeer ? .3 : .14, isDeer ? .78 : .24, 6), isDeer ? animalMats.light : animalMats.fur);
  neck.position.set(0, isDeer ? 1.42 : .67, isDeer ? -.48 : -.39); neck.rotation.x = -.35; root.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(isDeer ? .28 : .18, 7, 5), isDeer ? animalMats.light : animalMats.fur);
  head.position.set(0, isDeer ? 1.78 : .74, isDeer ? -.75 : -.74); root.add(head);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.045, 5, 4), animalMats.eye); eye.position.set(side * .22, isDeer ? 1.81 : .76, isDeer ? -.83 : -.86); root.add(eye);
    if (isDeer) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.09, .3, 4), animalMats.body); ear.position.set(side * .22, 1.99, -.68); ear.rotation.z = side * -.45; root.add(ear);
      const antler = new THREE.Group(); antler.position.set(side * .1, 2.02, -.72); antler.rotation.z = side * .24;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.027, .05, .58, 5), animalMats.dark); stem.position.y = .27; antler.add(stem);
      for (let k = 0; k < 2; k++) { const tine = new THREE.Mesh(new THREE.CylinderGeometry(.016, .03, .29, 4), animalMats.dark); tine.position.set(side * (k ? -.13 : .13), .38 + k * .12, 0); tine.rotation.z = side * (k ? -.55 : .65); antler.add(tine); }
      root.add(antler);
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(isDeer ? .055 : .045, .045, isDeer ? .72 : .34, 5), animalMats.dark);
    leg.position.set(sx * (isDeer ? .49 : .24), isDeer ? .52 : .25, sz * (isDeer ? .25 : .37)); leg.rotation.x = sz * -.12; leg.castShadow = true; root.add(leg);
  }
  scene.add(root);
  animals.push({ root, kind, alive: true, speed: .32 + Math.random() * .25, phase: Math.random() * 8, flee: 0 });
}
makeAnimal(8, -16, 'deer'); makeAnimal(-13, -27, 'deer'); makeAnimal(15, -42, 'deer');
makeAnimal(-7, 11, 'rabbit'); makeAnimal(19, -11, 'rabbit'); makeAnimal(-22, 6, 'rabbit');

// The pursuer is a distant, hooded silhouette: visible enough to read, never a gore prop.
const hunter = new THREE.Group();
const hunterMat = mat(0x171c19), coatMat = mat(0x343b32), maskMat = mat(0xb9a98b), scopeMat = new THREE.MeshStandardMaterial({ color: 0x8a3026, emissive: 0x6d160e, emissiveIntensity: 1.1 });
function hunterPart(g, material, pos, scale) { const m = new THREE.Mesh(g, material); m.position.set(...pos); if (scale) m.scale.set(...scale); m.castShadow = true; hunter.add(m); return m; }
hunterPart(new THREE.CylinderGeometry(.25, .48, 1.55, 6), coatMat, [0, .95, 0]);
hunterPart(new THREE.SphereGeometry(.31, 7, 6), hunterMat, [0, 1.94, -.03], [1, 1.15, .95]);
hunterPart(new THREE.BoxGeometry(.37, .16, .15), maskMat, [0, 1.84, -.27]);
hunterPart(new THREE.BoxGeometry(.06, .06, .04), scopeMat, [0, 1.88, -.36]);
hunterPart(new THREE.CylinderGeometry(.035, .045, 1.35, 6), gunMetal, [.37, 1.62, -.4], [Math.PI / 2, 0, -.12]);
for (const s of [-1, 1]) hunterPart(new THREE.CylinderGeometry(.1, .12, .85, 5), hunterMat, [s * .28, .36, 0]);
hunter.position.set(14, 0, -26); hunter.visible = false; scene.add(hunter);
const laserGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const laser = new THREE.Line(laserGeometry, new THREE.LineBasicMaterial({ color: 0xe94e36, transparent: true, opacity: .8 })); laser.visible = false; scene.add(laser);

const raycaster = new THREE.Raycaster(); raycaster.far = 64;
const ui = {
  clock: document.querySelector('#clock'), health: document.querySelector('#health-fill'), hunger: document.querySelector('#hunger-fill'),
  hungerLabel: document.querySelector('#hunger-label'), condition: document.querySelector('#condition'), food: document.querySelector('#food-count'),
  objective: document.querySelector('#objective-text'), prompt: document.querySelector('#prompt'), threat: document.querySelector('#threat'),
  flash: document.querySelector('#hit-flash'), toast: document.querySelector('#toast'), stick: document.querySelector('#stick')
};
let started = false, paused = false, ended = false, elapsed = 0, health = 100, hunger = 100, rations = 0;
let yaw = 0, pitch = 0, toastTimer = 0, flashTimer = 0, shotTimer = 0, hunterHP = 3, hunterDown = false;
let huntClock = 13, hunterMoveClock = 0, shotCooldown = 3, threatTimer = 0, rifleKick = 0;
const keys = new Set(), move = { x: 0, y: 0 }, look = { active: false, id: null, x: 0, y: 0 };
const startScreen = document.querySelector('#start-screen'), pauseScreen = document.querySelector('#pause-screen'), endScreen = document.querySelector('#end-screen');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function say(text, duration = 2.2) { ui.toast.textContent = text; ui.toast.classList.add('show'); toastTimer = duration; }
function setThreat(text = 'YOU ARE BEING WATCHED', sub = 'Movement detected in the treeline', duration = 3) {
  document.querySelector('#threat b').textContent = text; document.querySelector('#threat small').textContent = sub;
  ui.threat.classList.add('active'); threatTimer = duration;
}
function showEnd() {
  ended = true; started = false; paused = false; laser.visible = false;
  document.querySelector('#ending-kicker').innerHTML = '<span></span> SIMULATION COMPLETE';
  document.querySelector('#ending-title').innerHTML = 'SIGNAL<br><em>LOST.</em>';
  document.querySelector('#ending-copy').textContent = 'The forest falls away. A blank white room. A voice says your name — then says you were reported missing three days ago. The simulation ends. Your disappearance doesn\'t.';
  endScreen.classList.add('visible');
}
function showDeath() {
  ended = true; started = false; paused = false; laser.visible = false;
  document.querySelector('#ending-kicker').innerHTML = '<span></span> SUBJECT VITALS: CRITICAL';
  document.querySelector('#ending-title').innerHTML = 'FIELD<br><em>TERMINATED.</em>';
  document.querySelector('#ending-copy').textContent = 'The gunshot echoes once through the trees. The world flickers — too clean, too quiet. A monitor reads SUBJECT 07: SIMULATION INTERRUPTED. Your missing-person file stays open.';
  endScreen.classList.add('visible');
}
function resetGame() {
  elapsed = 0; health = 100; hunger = 100; rations = 0; hunterHP = 3; hunterDown = false;
  huntClock = 13; hunterMoveClock = 0; shotCooldown = 4; yaw = 0; pitch = 0; camera.position.set(0, 1.68, 0);
  animals.forEach((a, i) => { a.alive = true; a.root.visible = true; a.root.position.set([[8,-16],[-13,-27],[15,-42],[-7,11],[19,-11],[-22,6]][i][0], 0, [[8,-16],[-13,-27],[15,-42],[-7,11],[19,-11],[-22,6]][i][1]); a.flee = 0; });
  hunter.position.set(14, 0, -26); hunter.visible = false; hunterDown = false;
  ended = false; paused = false; started = true; startScreen.classList.remove('visible'); endScreen.classList.remove('visible'); pauseScreen.classList.remove('visible');
  ui.threat.classList.remove('active'); updateHud(); say('FIELD LINK ESTABLISHED', 2.5);
}
function updateHud() {
  const remain = Math.max(0, 300 - elapsed), mm = Math.floor(remain / 60), ss = Math.floor(remain % 60);
  ui.clock.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  ui.health.style.width = `${health}%`; ui.hunger.style.width = `${hunger}%`;
  ui.hungerLabel.textContent = hunger > 65 ? 'SATIATED' : hunger > 30 ? 'HUNGRY' : 'STARVING';
  ui.condition.textContent = health > 66 ? 'STABLE' : health > 30 ? 'WOUNDED' : 'CRITICAL';
  ui.condition.style.color = health > 66 ? '#d5dfc4' : '#e5a678'; ui.food.textContent = rations;
  if (rations === 0) ui.objective.textContent = 'Find food. Stay out of sight.';
  else if (hunterDown) ui.objective.textContent = 'Stay alive. Something is still watching.';
  else ui.objective.textContent = 'Stay alive. Someone is tracking you.';
}

// Mobile analogue movement; desktop drag-to-look and WASD use the same normalized input.
const pad = document.querySelector('#move-pad');
function padUpdate(e) {
  const r = pad.querySelector('.pad-ring').getBoundingClientRect();
  const dx = (e.clientX - (r.left + r.width / 2)) / (r.width * .37);
  const dy = (e.clientY - (r.top + r.height / 2)) / (r.height * .37);
  move.x = clamp(dx, -1, 1); move.y = clamp(dy, -1, 1);
  ui.stick.style.transform = `translate(${move.x * 23}px, ${move.y * 23}px)`;
}
pad.addEventListener('pointerdown', e => { e.preventDefault(); pad.setPointerCapture(e.pointerId); padUpdate(e); });
pad.addEventListener('pointermove', e => { if (pad.hasPointerCapture(e.pointerId)) padUpdate(e); });
function releasePad(e) { if (pad.hasPointerCapture(e.pointerId)) pad.releasePointerCapture(e.pointerId); move.x = move.y = 0; ui.stick.style.transform = 'translate(0,0)'; }
pad.addEventListener('pointerup', releasePad); pad.addEventListener('pointercancel', releasePad);
function isControl(target) { return target.closest('button,.move-pad,.modal-card,.status-panel,.topbar'); }
window.addEventListener('pointerdown', e => {
  if (!started || isControl(e.target) || e.target === pad || pad.contains(e.target)) return;
  look.active = true; look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY;
});
window.addEventListener('pointermove', e => {
  if (!look.active || e.pointerId !== look.id) return;
  const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY;
  yaw -= dx * .0042; pitch = clamp(pitch - dy * .0035, -1.15, 1.15);
});
window.addEventListener('pointerup', e => { if (e.pointerId === look.id) look.active = false; });
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault(); keys.add(k); if (k === ' ' && started) shoot(); if (k === 'e' && started) eat(); if (k === 'escape' && started) togglePause(); });
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); move.x = move.y = 0; look.active = false; });
document.querySelector('#start-btn').addEventListener('click', resetGame);
document.querySelector('#restart-btn').addEventListener('click', resetGame);
document.querySelector('#pause').addEventListener('click', togglePause);
document.querySelector('#resume-btn').addEventListener('click', togglePause);
document.querySelector('#fire-btn').addEventListener('pointerdown', e => { e.preventDefault(); if (started) shoot(); });
document.querySelector('#eat-btn').addEventListener('pointerdown', e => { e.preventDefault(); if (started) eat(); });
function togglePause() { if (!started && !paused) return; paused = !paused; pauseScreen.classList.toggle('visible', paused); }

function lookingTarget() {
  camera.updateMatrixWorld();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const animalHits = raycaster.intersectObjects(animals.filter(a => a.alive).map(a => a.root), true);
  const hunterHits = hunter.visible && !hunterDown ? raycaster.intersectObject(hunter, true) : [];
  const ah = animalHits[0], hh = hunterHits[0];
  if (hh && hh.distance < (ah ? ah.distance : Infinity)) return { type: 'hunter', distance: hh.distance };
  if (ah) {
    let node = ah.object;
    while (node && !node.userData.kind) node = node.parent;
    return { type: 'animal', distance: ah.distance, animal: animals.find(a => a.root === node) };
  }
  return null;
}
function shoot() {
  if (!started || paused || ended) return;
  rifleKick = .12; shotCooldown = Math.max(shotCooldown, .18);
  const target = lookingTarget();
  if (target?.type === 'animal' && target.distance < 54 && target.animal) {
    const a = target.animal; a.alive = false; a.flee = 0;
    a.root.rotation.x = Math.PI / 2; a.root.position.y = .3;
    say(`${a.kind.toUpperCase()} DOWN · PRESS EAT TO COLLECT`, 3.4); ui.objective.textContent = 'Collect your hunt. Something heard that shot.';
    setThreat('SHOT HEARD IN THE TREES', 'The hunter is closing in', 4.5); huntClock = Math.min(huntClock, 5);
    return;
  }
  if (target?.type === 'hunter' && target.distance < 58) {
    hunterHP--; say(hunterHP > 0 ? `HIT · ${hunterHP} MORE TO DRIVE HIM BACK` : 'THE SHADOW DROPS OUT OF SIGHT', 2.6);
    if (hunterHP <= 0) { hunterDown = true; hunter.visible = false; laser.visible = false; ui.objective.textContent = 'Stay alive. Something is still watching.'; }
    return;
  }
  say('SHOT FIRED · NOTHING IN YOUR SIGHTS', 1.5);
  setThreat('YOUR POSITION IS EXPOSED', 'A shot rings through the woods', 3.2); huntClock = Math.min(huntClock, 5);
}
function eat() {
  if (!started || paused) return;
  let nearest = null, best = 3.8;
  for (const a of animals) if (!a.alive && a.root.visible) {
    const dx = camera.position.x - a.root.position.x, dz = camera.position.z - a.root.position.z;
    const d = Math.hypot(dx, dz); if (d < best) { best = d; nearest = a; }
  }
  if (!nearest) { say(rations ? 'NO FRESH HUNT NEARBY · FIND YOUR PACK' : 'HUNT AN ANIMAL FIRST', 1.8); return; }
  nearest.root.visible = false; rations++; hunger = clamp(hunger + 37, 0, 100); health = clamp(health + 8, 0, 100);
  say('FIELD RATION SECURED · +37 HUNGER', 2); updateHud();
}

function updatePlayer(dt) {
  const forward = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - move.y;
  const sideways = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + move.x;
  const mag = Math.hypot(forward, sideways), sprint = keys.has('shift');
  const speed = 5.1 * (sprint ? 1.45 : 1);
  if (mag > .03) {
    const f = forward / Math.max(1, mag), s = sideways / Math.max(1, mag);
    const dx = (Math.sin(yaw) * f + Math.cos(yaw) * s) * speed * dt;
    const dz = (-Math.cos(yaw) * f + Math.sin(yaw) * s) * speed * dt;
    const nx = camera.position.x + dx, nz = camera.position.z + dz;
    const blocked = treeSpots.some(t => Math.hypot(nx - t.x, nz - t.z) < t.r + .45);
    if (!blocked) { camera.position.x = nx; camera.position.z = nz; }
    camera.position.x = clamp(camera.position.x, -100, 100); camera.position.z = clamp(camera.position.z, -100, 100);
    rifle.position.y = -.38 + Math.sin(elapsed * (sprint ? 14 : 9)) * .012 * Math.min(mag, 1);
  }
  camera.rotation.order = 'YXZ'; camera.rotation.set(pitch, yaw, 0);
}
function updateAnimals(dt) {
  for (const a of animals) {
    if (!a.alive) continue;
    a.phase += dt * (a.kind === 'deer' ? 2 : 3.5);
    const dx = a.root.position.x - camera.position.x, dz = a.root.position.z - camera.position.z, d = Math.hypot(dx, dz);
    if (d < (a.kind === 'deer' ? 10 : 7)) a.flee = Math.max(a.flee, 2.8);
    if (a.flee > 0) {
      a.flee -= dt; a.root.position.x += (dx / Math.max(d, .1)) * dt * a.speed * 8;
      a.root.position.z += (dz / Math.max(d, .1)) * dt * a.speed * 8;
      a.root.rotation.y = Math.atan2(-dx, dz);
    } else {
      a.root.position.x += Math.sin(a.phase * .36) * dt * a.speed * .28;
      a.root.position.z += Math.cos(a.phase * .31) * dt * a.speed * .22;
      a.root.rotation.y = Math.sin(a.phase * .36) * .55;
    }
    const bounce = Math.sin(a.phase * (a.flee > 0 ? 9 : 2)) * (a.flee > 0 ? .08 : .018);
    a.root.children[0].position.y = (a.kind === 'deer' ? 1.15 : .5) + bounce;
  }
}
function updateHunter(dt) {
  if (!hunterDown && elapsed > 9) {
    if (!hunter.visible && elapsed > 19) { hunter.visible = true; huntClock = 6; setThreat('A FIGURE IN THE TREES', 'The hunter has found your trail', 4); }
    if (hunter.visible) huntClock -= dt;
    if (hunter.visible) {
      hunterMoveClock += dt;
      const dx = camera.position.x - hunter.position.x, dz = camera.position.z - hunter.position.z, d = Math.hypot(dx, dz);
      if (hunterMoveClock > 5) {
        const step = Math.min(5, hunterMoveClock) * (d > 25 ? 1.35 : -.65);
        if (d > 25 || d < 17) { hunter.position.x += dx / Math.max(d, .1) * step; hunter.position.z += dz / Math.max(d, .1) * step; }
        hunterMoveClock = 0;
      }
      hunter.rotation.y = Math.atan2(-dx, -dz);
      if (huntClock <= 3.1 && huntClock > 0) {
        const start = hunter.position.clone().add(new THREE.Vector3(0, 1.55, 0));
        const end = camera.position.clone(); laser.geometry.setFromPoints([start, end]); laser.visible = true;
        if (huntClock > 2.8) setThreat('SNIPER LINED YOU UP', 'Break line of sight — move now', 3.3);
      } else laser.visible = false;
      if (huntClock <= 0) {
        laser.visible = false;
        if (d < 48) {
          health = clamp(health - 19, 0, 100); ui.flash.classList.add('hit'); flashTimer = .18;
          say('SNIPER HIT · BREAK LINE OF SIGHT', 2.2); setThreat('YOU HAVE BEEN HIT', 'Find cover before the next shot', 3.3);
        } else say('A SHOT CRACKS THROUGH THE DISTANCE', 2);
        huntClock = 22 + Math.random() * 9;
      }
    }
  }
}

let hudClock = 0, promptClock = 0;
function updateGame(dt) {
  elapsed += dt;
  updatePlayer(dt);
  updateAnimals(dt);
  updateHunter(dt);
  hunger = clamp(hunger - dt * .12, 0, 100);
  if (hunger <= 0 && Math.floor(elapsed * 2) % 5 === 0) health = clamp(health - dt * 1.6, 0, 100);
  if (health <= 0) { showDeath(); return; }
  if (elapsed >= 300) { updateHud(); showEnd(); return; }
  hudClock -= dt;
  if (hudClock <= 0) { updateHud(); hudClock = .15; }
  promptClock -= dt;
  if (promptClock <= 0) {
    const target = lookingTarget();
    if (target?.type === 'animal' && target.distance < 54) {
      const name = target.animal?.kind.toUpperCase() || 'ANIMAL'; ui.prompt.textContent = `◎  ${name} IN SIGHTS · FIRE TO HUNT`;
      ui.prompt.classList.add('show');
    } else if (target?.type === 'hunter' && target.distance < 58) {
      ui.prompt.textContent = '◎  HOSTILE IN SIGHTS · FIRE TO DEFEND'; ui.prompt.classList.add('show');
    } else {
      const carcass = animals.some(a => !a.alive && a.root.visible && Math.hypot(camera.position.x - a.root.position.x, camera.position.z - a.root.position.z) < 3.8);
      if (carcass) { ui.prompt.textContent = '＋  PRESS EAT TO COLLECT YOUR HUNT'; ui.prompt.classList.add('show'); }
      else ui.prompt.classList.remove('show');
    }
    promptClock = .13;
  }
  if (toastTimer > 0 && (toastTimer -= dt) <= 0) ui.toast.classList.remove('show');
  if (threatTimer > 0 && (threatTimer -= dt) <= 0) ui.threat.classList.remove('active');
  if (flashTimer > 0 && (flashTimer -= dt) <= 0) ui.flash.classList.remove('hit');
  if (rifleKick > 0) { rifle.position.z = -.48 + rifleKick; rifleKick = Math.max(0, rifleKick - dt * .8); }
}

let previous = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.045, (now - previous) / 1000); previous = now;
  if (started && !paused && !ended) updateGame(dt);
  const targetFov = lookingTarget()?.type === 'animal' ? 69 : 72;
  if (Math.abs(camera.fov - targetFov) > .1) { camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 5); camera.updateProjectionMatrix(); }
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65)); renderer.setSize(innerWidth, innerHeight);
});
