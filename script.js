/*
 * Three.js car playground
 * © 2026 Alina — github.com/alyna1411
 * Demo-Version (v8)
 */

// import three.js and store everything under "THREE" -> no physics, just objects
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
// import cannon-es and store everything under "CANNON" -> for physics (gravity, collision, mass...)
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

/* ═══════════════════════════════════
   SETUP (Globals)
   ═══════════════════════════════════ */
// scene = 3D-World (three.js) | world = 3D-World (cannon-es) | camera = view/perspective | renderer = creates the <canvas>
let scene, world, camera, renderer;

let clock = new THREE.Clock(); // measures time between frames - dt = deltatime (movement not dependent on fps)
let car, carBody, carBodyGroup // car mesh + physics body
let keys = {}; // key listeners
let currentSpeed = 0;
let isGrounded = false; // blocks moving car in air
let groundContacts = 0; // allows moving car on platforms
let allWheels = []; // steering effect
let carWheels = []; // array for wheel meshes
let tyreTrails = [[], [], [], []]; // arrays for tyre marks effect
let trailMeshes = []; // array for
let trailFadeTimer = 0;
let boostActive = false; // boost
let boostParticleTimer = 0;
let boostParticles = []; // array for boost particles
let boostSpeed = 0;
let upsideDownTimer = 0; // flipcar back on wheels
let isAutoRighting = false; // car is flipped upright -> when true = steering and speed is false/0
let autoRightTimer = 0; // flip timer
let autoRightYaw = 0; // remembers driving direction during flip (veritcal y-axis)
let jumpCooldown = 0;
let fixedBodies = [] // array for fixed platforms


/* ───── TUNING ───── */

// CAR PAINT
let chromeMat;
let glassMat;
let lightMat;
let interiorMat;
let numberPlateMat;
let taillightMat;
let paintMat;
let paintMat2;

// TYRES
let wheelStyle = "default";
let wheelPositions = [
  [0.92, 0.15, 1.08],
  [-0.92, 0.15, 1.08],
  [0.92, 0.15, -1.12],
  [-0.92, 0.15, -1.12]
];

const wheelStyles = {
    default: {
      tireColor: 0x302A2A,
      tireRoughness: 0.8,
      tireGeo: [0.30, 0.10, 16, 32],
      spokes: 6,
      spokeColor: 0xFAFAFA,
      spokeRoughness: 0.1,
      spokeMetalness: 0.2,
      spokeGeo: [0.02, 0.2, 0.1],
      hubColor: 0xFAFAFA,
      hubRoughness: 0.5,
      hubMetalness: 0.5,
      hubGeo: [0.03, 0.04, 2, 3],
      bodyLift: 0,
    },

  lip: {
    wingType: "curved",
    bars: false,
    sideWings: false,
    wingWidth: 1.6,
    wingHeight: 0.1,
    wingDepth: 0.1,
    wingTilt: 0.5,
    wingY: 0.76,
    wingZ: -2,
    curveHeight: 0.2,
    curveDirection: "down"
  },

  superbird: {
    wingType: "box",
    sideWings: false,
    bars: true,
    barX: [-0.77, 0.78],
    barY: 1.2,
    barZ: -1.85,
    barHeight: 1,
    barTilt: -0.12,
    wingWidth: 1.63,
    wingHeight: 0.06,
    wingDepth: 0.18,
    wingTilt: 0,
    wingY: 1.72,
    wingZ: -1.935,
  },

  none: null,
};

// BOOST
let boostTheme = "purple";

const boostThemes = {
  purple: {
    color: 0xE47AFF,
    sizeMin: 0.1,
    sizeMax: 0.3,
    opacity: 0.6,
    life: 1.0,
    spawnCount: 1,
    spread: 0.5,
    rise: 0.5,
    riseRandom: 0.5,
    grow: 1.5
  },

  fire: {
    color: 0xFF3300,
    sizeMin: 0.05,
    sizeMax: 0.18,
    opacity: 0.9,
    life: 0.35,
    spawnCount: 1,
    spread: 2.5,
    rise: 0.2,
    riseRandom: 1.2,
    grow: 4
  },

  smoke: {
    color: 0xDDDDDD,
    sizeMin: 0.25,
    sizeMax: 0.55,
    opacity: 0.35,
    life: 1.4,
    spawnCount: 1,
    spread: 0.8,
    rise: 0.6,
    riseRandom: 0.7,
    grow: 2.2
  },

  bubbles: {
    color: 0xAFF7FA,
    sizeMin: 0.2,
    sizeMax: 0.2,
    opacity: 0.50,
    life: 1,
    spawnCount: 0.5,
    spread: 5,
    rise: 3,
    riseRandom: 0.1,
    grow: 1.2
  }
};

/* ───── ZONES ───── */

const jumpZone = {
  xMin: -40.5,
  xMax: -29.5,
  zMin: 33.3,
  zMax: 40.8
};

// Race zone
const raceControlZone = {
  xMin: -11.2,
  xMax: -4,
  zMin: -40.5,
  zMax: -35.3
};

// Workshop zone
const cameraZones = [
  {
    name: "workshop",
    xMin: 27,
    xMax: 42,
    zMin: 30,
    zMax: 50,
    offset: new THREE.Vector3(0, 4, -10),
    fixedView: true
  },

  {
    name: "welcome",
    xMin: 12,
    xMax: 39,
    zMin: -45,
    zMax: -13.5,
    offset: new THREE.Vector3(4, 16, -10),
    fixedView: true
  },

];

const garageZone = {
    xMin: 33,
    xMax: 41.8,
    zMin: 30.4,
    zMax: 40.7,
};

// Ramp zone
const rampBoostBlockZone = {
  xMin: -37,
  xMax: -32,
  zMin: 14.5,
  zMax: 23.5
};


/* ───── HONK AUDIO ───── */
const honkSound = new Audio('/audio/honk.mp3');
honkSound.volume = 0.2;

/* ═══════════════════════════════════
   BUILD & LOOP
   ═══════════════════════════════════ */
init();
animate();

function init() {
  scene = new THREE.Scene(); // create empty 3D-World
  scene.background = new THREE.Color(0xD2EFFA); 

  camera = new THREE.PerspectiveCamera(   // camera perspective
    70,
    window.innerWidth / window.innerHeight,
    0.5, // <0.5 = not in view 
    1000 // >1000 = not in view
  );

  camera.position.set(0, 8, 12);  // camera position
  camera.lookAt(0, 0, 0); // looks at world center

  renderer = new THREE.WebGLRenderer({ antialias: true });  // draw 3D-World with WebGL/GPU into a canvas
  renderer.shadowMap.enabled = false; // shadow (deactivated = better perfomance)
  renderer.outputColorSpace = THREE.SRGBColorSpace; // natural colors
  renderer.toneMappingExposure = 1.0; // overall brightness

  renderer.setSize(window.innerWidth, window.innerHeight); // set canvas size = window size
  document.body.appendChild(renderer.domElement); // add to html = <canvas></canvas>

  /* ───── LIGHT ───── */
  const ambient = new THREE.AmbientLight(0xffffff, 0.45); // ambient = surrounded light
  scene.add(ambient);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1); // simulates sun = light only from one side
  sunLight.position.set(5, 10, 8);
  sunLight.castShadow = false; // shadow (deactivated)
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.25); // slight backlight
  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  /* ───── GROUND ───── */
  // 2D MESH
  const canvas = document.createElement('canvas'); // create invisible HTML-canvas
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d'); // ctx = drawing pen (2D)
  
  ctx.fillStyle = "#1A521A";
  ctx.fillRect(0, 0, 2048, 2048); // ctx draws a square (x = 0, y = 0, width = 2048, height = 2048)
  
  const texture = new THREE.CanvasTexture(canvas); // three.js creates texture from drawn canvas (THREE.Material only knows texure, not canvas)
  
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),  // size of driveable area (GROUND)
    new THREE.MeshStandardMaterial({ map: texture }) // apply texture to ground material
  );
  groundMesh.rotation.x = -Math.PI / 2; // horizontal (default Plane is vertical)
  scene.add(groundMesh);

  /* ───── PHYSICS WORLD ───── */
  world = new CANNON.World(); // create invisible physic-world (cannon-es)
  world.gravity.set(0,-9.82,0); // gravity on x-axis (left=0, down=-9.82, right=0)
  world.broadphase = new CANNON.SAPBroadphase(world); // optimize collision detection
  world.broadphase.axisIndex = 0; // sort along the x-axis
  world.solver.iterations = 10;

  // GROUND PHYSICS --- important!
  const groundBody = new CANNON.Body({ mass:0 }); // create invisible physic body, mass=0 so that GROUND doesn't move!
  groundBody.addShape(new CANNON.Plane()); // create collision surface
  groundBody.quaternion.setFromEuler(-Math.PI/2,0,0); // horizontal (default Plane is vertical)
  world.addBody(groundBody); // tells cannon-es there is a floor, so objects won't "fall through"

  /* ───── CAR BODY ───── */
  car = new THREE.Group();
  carBodyGroup = new THREE.Group();
  car.add(carBodyGroup);

  paintMat = new THREE.MeshStandardMaterial({
    color: 0x5D376C,
    roughness: 1,
    metalness: 0.5
  });
  
  paintMat2 = new THREE.MeshStandardMaterial({
    color: 0x9156A8,
    roughness: 1,
    metalness: 0.8
  });
  
  chromeMat = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    roughness: 1,
    metalness: 1
  });
  
  glassMat = new THREE.MeshStandardMaterial({
    color: 0x334455,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65
  });
  
  lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.2
  });
  
  interiorMat = new THREE.MeshStandardMaterial({
    color: 0x403D3D,
    roughness: 0.8,
    metalness: 0.7
  });
  
  numberPlateMat = new THREE.MeshStandardMaterial({
    color: 0xEDED8E,
    roughness: 1,
    metalness: 0
  });
  
  taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: 0xC5D4D6,
    emissiveIntensity: 0.2
  });

  buildCarBody(carBodyGroup, paintMat, paintMat2);
  scene.add(car);

  // WHEELS POSITION
  wheelPositions.forEach(([x, y, z], i) => {
  const wheel = createWheel(x, y, z, wheelStyle);
  wheel.userData.isWheel = true;

  car.add(wheel);
  carWheels.push(wheel);

  if (i < 2) allWheels.push(wheel);
});

/* ═══════════════════════════════════
   PHYSICS
   ═══════════════════════════════════ */
  
  // Physics body for car
  const shape = new CANNON.Box(new CANNON.Vec3(0.75,0.25,1.5));
  carBody = new CANNON.Body({ mass:800 });
  carBody.addShape(shape);
  carBody.position.set(14.8,0.3,34.2); // start position
  world.addBody(carBody);

  /* ═══════════════════════════════════
   KEY LISTENER
   ═══════════════════════════════════ */
window.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    e.preventDefault();
  }

  if (e.repeat) return;

  if (e.code === "Space") {
    jumpCar();
  }

  keys[key] = true;

  if (key === "r") resetCar();

  if (key === "shift") {
  boostActive = true;
  }

  if (key === "h") {
    honkSound.currentTime = 0;
    honkSound.play();
  }
});

window.addEventListener("keyup", e => {
  const key = e.key.toLowerCase();

  keys[key] = false;

  if (key === "shift") {
  boostActive = false;
  }
});

window.addEventListener("blur", () => {
  keys = {};
  boostActive = false;
  currentSpeed = 0;
});

  window.addEventListener("resize", onResize); // when browser window is resized - adjust/update scene size
}

/* ═══════════════════════════════════
     CAR DUMMY
     ═══════════════════════════════════ */
function buildCarBody(targetGroup, p1Mat, p2Mat) {
  const underbody = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 3.9), numberPlateMat);
  underbody.position.set(0, 0.22, -0.12);
  targetGroup.add(underbody);

  const bodyLow = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.42, 3.8), p1Mat);
  bodyLow.position.set(0, 0.48, -0.1);
  targetGroup.add(bodyLow);

  [-0.84, 0.84].forEach(x => {
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 3.6), chromeMat);
    sill.position.set(x, 0.3, -0.1);
    targetGroup.add(sill);
  });

  // bonnet
  const hoodBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.68), p2Mat);
  hoodBase.position.set(0, 0.69, 0.95);
  targetGroup.add(hoodBase);

  for (let i = -1; i <= 1; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.016, 0.010), lightMat);
    bar.position.set(0, 0.5 + i * 0.1, 1.85);
    targetGroup.add(bar);
  }

  // roof
  const roofMain = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.12, 0.9), p1Mat);
  roofMain.position.set(0, 1.20, -0.18);
  targetGroup.add(roofMain);

  const backBase = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.8, 0.8), interiorMat);
  backBase.rotation.x = -0.52;
  backBase.position.set(0, 0.6, -0.69);
  targetGroup.add(backBase);

  const hoodSlope = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.1, 1), p1Mat);
  hoodSlope.rotation.x = -0.52;
  hoodSlope.position.set(0, 0.98, -0.95);
  targetGroup.add(hoodSlope);

  // frontscreen 
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.52, 0.05), glassMat);
  windshield.rotation.x = -0.50;
  windshield.position.set(0, 1, 0.40);
  targetGroup.add(windshield);

  // backscreen
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.58, 0.3), glassMat);
  rearWindow.rotation.x = 1;
  rearWindow.position.set(0, 1, -0.85);
  targetGroup.add(rearWindow);

  [-0.73, 0.73].forEach(x => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.88), glassMat);
    sideWin.position.set(x, 0.9, -0.1);
    targetGroup.add(sideWin);
  });

  // headlights
  [-0.52, 0.52].forEach(x => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.17, 0.03), lightMat);
    hl.position.set(x, 0.55, 1.81);
    targetGroup.add(hl);

  
    const hlFrame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.04), chromeMat);
    hlFrame.position.set(x, 0.55, 1.8);
    targetGroup.add(hlFrame);
  });

  // taillights
  [-0.52, 0.52].forEach(x => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.21, 0.09), taillightMat);
    tl.position.set(x, 0.55, -2.02);
    targetGroup.add(tl);
  });

  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
  [-0.38, 0.38].forEach(x => {
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.42, 16), exhaustMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(x, 0.22, -2.0);
    targetGroup.add(exhaust);
  });
}

/* ═══════════════════════════════════
   CAR MOVEMENT
   ═══════════════════════════════════ */
function updateCar(dt){
  autoFlipCar(dt);
  const up = new CANNON.Vec3(0, 1, 0);
  const carUp = new CANNON.Vec3();
  carBody.quaternion.vmult(up, carUp);

  const carIsTilted = carUp.y < 0.05;

  if (carIsTilted && !isAutoRighting) {
    currentSpeed = 0;
    return;
  }

  if (isAutoRighting) {
    return;
  }

  jumpCooldown = Math.max(jumpCooldown - dt, 0);

  const baseSpeed  = 10; 
  const boostMax   = 7;   // Boost on top (+5 = max 19)
  const boostRamp  = 5;   // Reloading Boost
  const boostDecay = 5;   // Boost comedown

  const boostBlocked = isInsideZone(rampBoostBlockZone);

  if (boostBlocked) {
  boostSpeed = Math.max(boostSpeed - boostDecay * 2 * dt, 0);
  }

  if (boostActive && isGrounded && !boostBlocked) {
    boostSpeed = Math.min(boostSpeed + boostRamp * dt, boostMax);
  } else {
    boostSpeed = Math.max(boostSpeed - boostDecay * dt, 0);
  }

  const maxSpeed = baseSpeed + boostSpeed;

  const maxReverse = 8;
  const acceleration = 10;
  const braking     = 20;
  const friction    = 10;      // roll out when no button clicked
  const turnSpeed   = 4;

// ── GROUNDCHECK ──
isGrounded = groundContacts > 0 || carBody.position.y <= 0.55;

// ── BOUNDARY CLAMP ──
const limit = 48.8;
const bounce = 0.3; // Bouncy effect

  if (carBody.position.x > limit)  { carBody.position.x = limit  - bounce; currentSpeed *= -0.5; }
  if (carBody.position.x < -limit) { carBody.position.x = -limit + bounce; currentSpeed *= -0.5; }
  if (carBody.position.z > limit)  { carBody.position.z = limit  - bounce; currentSpeed *= -0.5; }
  if (carBody.position.z < -limit) { carBody.position.z = -limit + bounce; currentSpeed *= -0.5; }
  if (carBody.position.y > 4.0) { carBody.position.y = 4.0; }

// ── FIXED PLATFORM CLAMP + BOUNCE ──
  for (const { body, hw, hh, hd } of fixedBodies) {
    const bx = body.position.x;
    const by = body.position.y;
    const bz = body.position.z;

    const cx = carBody.position.x;
    const cy = carBody.position.y;
    const cz = carBody.position.z;

    const carHW = 0.6;
    const carHH = 0.22;
    const carHD = 1.1;
    const bounce = 0.3;

    const overlapX = (hw + carHW) - Math.abs(cx - bx);
    const overlapY = (hh + carHH) - Math.abs(cy - by);
    const overlapZ = (hd + carHD) - Math.abs(cz - bz);

    if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
      if (overlapX < overlapY && overlapX < overlapZ) {
        // X bounce
        const dir = cx > bx ? 1 : -1;
        carBody.position.x = bx + (hw + carHW + bounce) * dir;
        currentSpeed *= -0.4;
      } else if (overlapZ < overlapY) {
        // Z bounce
        const dir = cz > bz ? 1 : -1;
        carBody.position.z = bz + (hd + carHD + bounce) * dir;
        currentSpeed *= -0.4;
      } else {
        // Y bounce
        const dir = cy > by ? 1 : -1;
        carBody.position.y = by + (hh + carHH) * dir;
      }
    }
  }

const wPressed = keys["w"] || keys["arrowup"];
const sPressed = keys["s"] || keys["arrowdown"];

// ── ACCELERATION ONLY IF GROUNDED ──
  if (isGrounded) {
    if (wPressed) {
      currentSpeed = Math.min(currentSpeed + acceleration * dt, maxSpeed);
    } else if (sPressed) {
      if (currentSpeed > 0.1) {
        currentSpeed = Math.max(currentSpeed - braking * dt, 0);
      } else {
        currentSpeed = Math.max(currentSpeed - acceleration * dt, -maxReverse);
      }
    } else {
      if (currentSpeed > 0) {
        currentSpeed = Math.max(currentSpeed - friction * dt, 0);
      } else if (currentSpeed < 0) {
        currentSpeed = Math.min(currentSpeed + friction * dt, 0);
      }
    }
  } else {
    // IN AIR - keep momentum
  }

  // ── MOVING ──
  const forward = new CANNON.Vec3();
  carBody.quaternion.vmult(new CANNON.Vec3(0, 0, -1), forward);

  // only move on X/Z-axis, no moving on Y-axis
  forward.y = 0;
  forward.normalize();

  const move = forward.scale(currentSpeed * dt, new CANNON.Vec3());
  carBody.position.vsub(move, carBody.position);

  // ── STEERING ──
  const speedRatio = Math.abs(currentSpeed) / maxSpeed;
  const groundFactor = isGrounded ? 1.0 : 0.2;
  const activeTurnSpeed = turnSpeed * speedRatio * groundFactor;

  if (keys["a"] || keys["arrowleft"]) {
    const q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0,1,0), activeTurnSpeed * dt);
    const carQ = new THREE.Quaternion();
    carQ.set(carBody.quaternion.x, carBody.quaternion.y, carBody.quaternion.z, carBody.quaternion.w);
    carQ.multiply(q);
    carBody.quaternion.set(carQ.x, carQ.y, carQ.z, carQ.w);
  }
  if (keys["d"] || keys["arrowright"]) {
    const q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0,1,0), -activeTurnSpeed * dt);
    const carQ = new THREE.Quaternion();
    carQ.set(carBody.quaternion.x, carBody.quaternion.y, carBody.quaternion.z, carBody.quaternion.w);
    carQ.multiply(q);
    carBody.quaternion.set(carQ.x, carQ.y, carQ.z, carQ.w);
  }

// ── Steering wheels ──
const maxSteerAngle = 0.45;
let targetSteer = 0;
if (keys["a"] || keys["arrowleft"])  targetSteer =  maxSteerAngle;
if (keys["d"] || keys["arrowright"]) targetSteer = -maxSteerAngle;
const wheelSteer = currentSpeed >= 0 ? targetSteer : -targetSteer;
allWheels.forEach(wheel => {
  wheel.rotation.y = THREE.MathUtils.lerp(wheel.rotation.y, wheelSteer + Math.PI / 2, 0.15);
});

// ── Wheels rolling ──
carWheels.forEach(wheel => {
  wheel.children[0].rotation.z += currentSpeed * dt * 0.5;
});

// ── Tyre marks ──
 if (boostActive) trailFadeTimer = 0; // reset timer when boost active
  const isMoving = Math.abs(currentSpeed) > 0.5 && isGrounded && boostActive;
  
  // reset after stopping
   if (!isMoving) {
    if (boostActive === false) tyreTrails = [[], [], [], []];
    trailFadeTimer += dt;

    if (trailFadeTimer > 2) {
      trailMeshes.forEach((group, i) => {
        if (!group || group.length === 0) return;

        // fade from back to front
        const seg = group[0];
        seg.material.opacity -= dt * 10;

        if (seg.material.opacity <= 0) {
          scene.remove(seg);
          seg.geometry.dispose();
          trailMeshes[i].shift(); // remove
        }
      });
    }
  } else {
    trailFadeTimer = 0;
  }

  const maxTrailLength = 20; // max. length of marks

  const wheelOffsets = [
    new THREE.Vector3( 0.8, 0, 1.12),
    new THREE.Vector3(-0.8, 0, 1.12),
    new THREE.Vector3( 0.8, 0, -1.12),
    new THREE.Vector3(-0.8, 0, -1.12),
  ];

  if (isMoving) {
    wheelOffsets.forEach((offset, i) => {
      // worldposition
      const worldPos = offset.clone().applyQuaternion(car.quaternion).add(car.position);
      worldPos.y = carBody.position.y - 0.18; // over the ground, underneath the car

      tyreTrails[i].push(worldPos.clone());

      // marks
      if (tyreTrails[i].length > maxTrailLength) {
        tyreTrails[i].shift();
        // remove marks afterwards
        if (trailMeshes[i] && trailMeshes[i].length > 0) {
          const old = trailMeshes[i].shift();
          scene.remove(old);
          old.geometry.dispose();
        }
      }

      
      if (tyreTrails[i].length >= 2) {
        const last = tyreTrails[i][tyreTrails[i].length - 2];
        const curr = tyreTrails[i][tyreTrails[i].length - 1];

        const dir = curr.clone().sub(last);
        const len = dir.length();
        if (len < 0.02) return;

        const mid = last.clone().add(curr).multiplyScalar(0.5);
        const angle = Math.atan2(dir.x, dir.z);

        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(0.10, 0.01, len),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15
          })
        );
        seg.position.copy(mid);
        seg.rotation.y = angle;
        scene.add(seg);

        if (!trailMeshes[i]) trailMeshes[i] = [];
        trailMeshes[i].push(seg);
      }
    });
  }

  // ── BOOST ──
boostParticleTimer += dt;

if (boostActive && isGrounded && !boostBlocked && boostParticleTimer > 0.025) {
  boostParticleTimer = 0;

  const theme = boostThemes[boostTheme];

  // exhaust left + right
  [-0.38, 0.38].forEach(xOffset => {

    const exhaustOffset = new THREE.Vector3(xOffset, 0.22, -2.0);
    const worldPos = exhaustOffset
      .clone()
      .applyQuaternion(car.quaternion)
      .add(car.position);

    for (let i = 0; i < theme.spawnCount; i++) {
    
      const size =
        theme.sizeMin +
        Math.random() * (theme.sizeMax - theme.sizeMin);

      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(size, 6, 6),
        new THREE.MeshStandardMaterial({
          color: theme.color,
          transparent: true,
          opacity: theme.opacity,
          roughness: 1,
          metalness: 0
        })
      );

      smoke.position.copy(worldPos);

      smoke.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * theme.spread,
        theme.rise + Math.random() * theme.riseRandom,
        (Math.random() - 0.5) * theme.spread
      );

      smoke.userData.life = theme.life;
      smoke.userData.maxLife = theme.life;
      smoke.userData.grow = theme.grow;
      smoke.userData.startOpacity = theme.opacity;

      scene.add(smoke);
      boostParticles.push(smoke);
    }
  });
}

// boost update & fade
for (let i = boostParticles.length - 1; i >= 0; i--) {

  const s = boostParticles[i];

  s.userData.life -= dt * 1.8;

  const lifeRatio = Math.max(
    0,
    s.userData.life / s.userData.maxLife
  );

  s.material.opacity = lifeRatio * s.userData.startOpacity;

  s.position.add(
    s.userData.velocity.clone().multiplyScalar(dt)
  );

  s.scale.setScalar(
    1 + (1 - lifeRatio) * s.userData.grow
  );

  if (s.userData.life <= 0) {
    scene.remove(s);
    s.geometry.dispose();
    s.material.dispose();
    boostParticles.splice(i, 1);
  }
}

// Sync graphics
car.position.copy(carBody.position);
car.quaternion.copy(carBody.quaternion);
}

// RESET Button
function resetCar() {
  carBody.position.set(14.8,0.3,34.2);
  carBody.velocity.set(0, 0, 0);
  carBody.angularVelocity.set(0, 0, 0);
  carBody.quaternion.setFromEuler(0, 0, 0);
  currentSpeed = 0;
}

// Flip car back on wheels
function autoFlipCar(dt) {
  const up = new CANNON.Vec3(0, 1, 0);
  const carUp = new CANNON.Vec3();

  carBody.quaternion.vmult(up, carUp);

  const isTooTilted = carUp.y < 0.05;

  if (isTooTilted && !isAutoRighting) {
    upsideDownTimer += dt;
  } else if (!isAutoRighting) {
    upsideDownTimer = 0;
  }

  if (upsideDownTimer > 0.15 && !isAutoRighting) {
    isAutoRighting = true;
    autoRightTimer = 0;
    autoRightYaw = getCarYaw();

    currentSpeed = 0;
    boostSpeed = 0;
    boostActive = false;
  }

  if (isAutoRighting) {
    autoRightTimer += dt;

    carBody.velocity.set(0, 0, 0);
    carBody.angularVelocity.set(0, 0, 0);

    const t = Math.min(autoRightTimer / 0.15, 1);

    const startQ = new THREE.Quaternion(
      carBody.quaternion.x,
      carBody.quaternion.y,
      carBody.quaternion.z,
      carBody.quaternion.w
    );

    const endQ = new THREE.Quaternion();
    endQ.setFromEuler(new THREE.Euler(0, autoRightYaw, 0));

    startQ.slerp(endQ, t);

    carBody.quaternion.set(startQ.x, startQ.y, startQ.z, startQ.w);
    carBody.position.y = THREE.MathUtils.lerp(carBody.position.y, 1.1, 0.08);

    if (t >= 1) {
      isAutoRighting = false;
      upsideDownTimer = 0;
      carBody.quaternion.setFromEuler(0, autoRightYaw, 0);
      carBody.position.y = 1.1;
    }
  }
}

function getCarYaw() {
  const forward = new CANNON.Vec3(0, 0, -1);
  const worldForward = new CANNON.Vec3();

  carBody.quaternion.vmult(forward, worldForward);

  return Math.atan2(worldForward.x, worldForward.z);
}

// Jump
function jumpCar() {
  const onRealGround = carBody.position.y <= 0.65;

  if (!onRealGround) return;
  if (!isInsideZone(jumpZone)) return;

  carBody.position.y += 0.08;
  carBody.velocity.y = 8;
  jumpCooldown = 1.0;
}

/* ═══════════════════════════════════
   HELPERS
   ═══════════════════════════════════ */
function isInsideZone(zone) {
  return (
    carBody.position.x >= zone.xMin &&
    carBody.position.x <= zone.xMax &&
    carBody.position.z >= zone.zMin &&
    carBody.position.z <= zone.zMax
  );
}

/* ═══════════════════════════════════
   TUNING
   ═══════════════════════════════════ */
// PAINT-TUNING


// TYRE-TUNING
function createWheel(x, y, z, style = wheelStyle) {
  const wheelGroup = new THREE.Group();  // steering only
  const rollGroup = new THREE.Group();   // rolling only
  wheelGroup.add(rollGroup);

  const cfg = wheelStyles[style] || wheelStyles.default;
  const tireMat = new THREE.MeshStandardMaterial({
    color: cfg.tireColor,
    roughness: cfg.tireRoughness
  });
  const tireGeo = new THREE.TorusGeometry(...cfg.tireGeo);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  rollGroup.add(tire);

  for (let i = 0; i < cfg.spokes; i++) {
    const angle = (i / cfg.spokes) * Math.PI * 2;
    const spokeMat = new THREE.MeshStandardMaterial({
      color: cfg.spokeColor,
      roughness: cfg.spokeRoughness,
      metalness: cfg.spokeMetalness
    });
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(...cfg.spokeGeo),
      spokeMat
    );
    spoke.position.set(
      Math.sin(angle) * 0.14,
      Math.cos(angle) * 0.14,
      0
    );
    spoke.rotation.z = -angle;
    rollGroup.add(spoke);
  }

  const innerRimMat = new THREE.MeshStandardMaterial({
    color: cfg.hubColor,
    roughness: cfg.hubRoughness,
    metalness: cfg.hubMetalness
  });
  const innerRim = new THREE.Mesh(
    cfg.hubGeo.length === 3
      ? new THREE.ConeGeometry(...cfg.hubGeo)
      : new THREE.TorusGeometry(...cfg.hubGeo),
    innerRimMat
  );
  if (cfg.hubGeo.length === 3) {
    innerRim.rotation.x = x < 0 ? -Math.PI / 2 : Math.PI / 2;
  }
  rollGroup.add(innerRim);

  wheelGroup.rotation.y = Math.PI / 2;
  wheelGroup.position.set(x, y, z);
  return wheelGroup;
}

// BOOST TUNING

// SPOILER TUNING


/* ═══════════════════════════════════
   CAMERA
   ═══════════════════════════════════ */
function updateCamera() {
  let offset = new THREE.Vector3(0, 7, -12); // 0, 7, -12
  let fixedView = false;

  for (const zone of cameraZones) {
    if (isInsideZone(zone)) {
      offset = zone.offset;
      fixedView = zone.fixedView === true;
      break;
    }
  }

  let target;

  if (fixedView) {
    // fixed world-offset
    target = car.position.clone().add(offset);
  } else {
    // third-person
    const cameraOffset = offset.clone();
    cameraOffset.applyQuaternion(car.quaternion);
    target = car.position.clone().add(cameraOffset);
  }

  camera.position.lerp(target, 0.04);

  const lookTarget = car.position.clone();
  lookTarget.y += 1.2;

  camera.lookAt(lookTarget);
}


/* ═══════════════════════════════════
   LOOP
   ═══════════════════════════════════ */
function animate() {
  requestAnimationFrame(animate); // loop animate() every frame
  const dt = clock.getDelta(); // measure time between frame

  world.step(1/60,dt);

  if (carBody.velocity.y > 3) {
  carBody.velocity.y = 3;
  }

  groundContacts = 0; // reset every frame
  for (let i = 0; i < world.contacts.length; i++) {
    const c = world.contacts[i];
    if (c.bi === carBody || c.bj === carBody) {
      groundContacts++;
    }
  }

  updateCar(dt);
  updateCamera();

  renderer.render(scene, camera); // draw scene/world again
}

/* ═══════════════════════════════════
   RESIZE
   ═══════════════════════════════════ */
function onResize() { // when browser size changes
  camera.aspect = window.innerWidth / window.innerHeight; // calculate browser size
  camera.updateProjectionMatrix(); // changed settings = recalculate size 
  renderer.setSize(window.innerWidth, window.innerHeight); // resizes canvas
}