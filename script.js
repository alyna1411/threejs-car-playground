/*
 * Three.js car playground
 * © 2026 Alina — github.com/alyna1411
 * Demo-Version (v8)
 */

// import three.js and store everything under "THREE" -> no physics, just objects
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
// import cannon-es and store everything under "CANNON" -> for physics (gravity, collision, mass...)
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

// 3D text objects
import { FontLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/FontLoader.js?module";
import { TextGeometry } from "https://unpkg.com/three@0.160.0/examples/jsm/geometries/TextGeometry.js?module";

/* ═══════════════════════════════════
   SETUP (Globals)
   ═══════════════════════════════════ */
// scene = 3D-World (three.js) | world = 3D-World (cannon-es) | camera = view/perspective | renderer = creates the <canvas>
let scene, world, camera, renderer;

let clock = new THREE.Clock(); // measures time between frames - dt = deltatime (movement not dependent on fps)
let car, carBody, carBodyGroup // car mesh + physics body
let physicsObjects = []; // array for physic objects
let keys = {}; // key listeners
let currentSpeed = 0;
let isGrounded = false; // blocks moving car in air
let groundContacts = 0; // allows moving car on platforms
let allWheels = []; // steering effect
let carWheels = []; // array for wheel meshes
let tyreTrails = [[], [], [], []]; // arrays for wheel position history (data only)
let trailMeshes = []; // array for tyre mark segments
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
let fixedBodies = []; // array for fixed platforms
let brickObjects = []; // array for brickwall
let footballBody; // football fence
let raceMarkers = []; // array for race checkpoints
let base3; // statue

/* ═══════════════════════════════════
   DRAWING CONSTANTS
═══════════════════════════════════ */
const roundaboutX = 1024;
const roundaboutY = 1024;
const roundaboutRadius = 200;
// Array for GroundTexture
const roadSegments = [
  { x1: 1024, y1: 0,    x2: 1024, y2: 764  },  // north
  { x1: 1024, y1: 1284, x2: 1024, y2: 2048 },  // south
  { x1: 0,    y1: 1024, x2: 764,  y2: 1024 },  // west
  { x1: 1284, y1: 1024, x2: 2048, y2: 1024 },  // east
  { x1: 250,  y1: 350,  x2: 250,  y2: 1024 },  // road to workshop
  { x1: 1600, y1: 1000, x2: 1600, y2: 860  },  // road to stunt park
  { x1: 500,  y1: 1220, x2: 500,  y2: 1050 },  // road to welcome
  { x1: 1200, y1: 1800, x2: 1050, y2: 1800 },  // road to race track
];

// Areas
const AREAS = {
  tuning: {
    x: 0,
    y: 0,
    w: 550,
    h: 700,
    radius: 120,
    color: "#782628",
    tl: 22,
    tr: 20,
    br: 250,
    bl: 250
  },

  stunt: {
    x: 1200,
    y: 100,
    w: 750,
    h: 700,
    radius: 120,
    color: "#5C4A32",
    tl: 20,
    tr: 250,
    br: 30,
    bl: 300
  },

  race: {
    x: 1220,
    y: 1300,
    w: 700,
    h: 700,
    radius: 120,
    color: "#5A5A5A",
    tl: 40,
    tr: 40,
    br: 40,
    bl: 40
  },

  welcome: {
    x: 150,
    y: 1300,
    w: 700,
    h: 650,
    radius: 120,
    color: "#0358A3",
  }
};

/* ───── TUNING ───── */
// PAINT
let chromeMat;
let glassMat;
let lightMat;
let interiorMat;
let numberPlateMat;
let taillightMat;
let paintMat;
let paintMat2;
let selectedCarColor = 0x5D376C;
let selectedCarColor2 = 0x9156A8;

  // BOOST
let boostTheme = "purple";

  // SPOILER
let spoilerGroup;
let spoilerStyle = "stock";

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

    white: {
      tireColor: 0xFFFFFF,
      tireRoughness: 0.2,
      tireGeo: [0.30, 0.18, 16, 32],
      spokes: 4,
      spokeColor: 0x8F8F8F,
      spokeRoughness: 0.1,
      spokeMetalness: 0.2,
      spokeGeo: [0.12, 0.22, 0.15],
      hubColor: 0xFFFFFF,
      hubRoughness: 0.5,
      hubMetalness: 0.2,
      hubGeo: [0.01, 0.01, 0.01],
      bodyLift: 0.13,
    },

    spikes: {
      tireColor: 0x1C2E2E,
      tireRoughness: 0.45,
      tireGeo: [0.33, 0.15, 16, 32],
      spokes: 15,
      spokeColor: 0x292929,
      spokeRoughness: 0.1,
      spokeMetalness: 0.3,
      spokeGeo: [0.01, 0.01, 0.01],
      hubColor: 0x787575,
      hubRoughness: 0.5,
      hubMetalness: 0.2,
      hubGeo: [0.3, 1.1, 32],
      bodyLift: 0.1,
    },

    monster: {
      tireColor: 0x3D3D3D,
      tireRoughness: 1,
      tireGeo: [0.40, 0.28, 8, 12],
      spokes: 15,
      spokeColor: 0x403E3E,
      spokeRoughness: 1,
      spokeMetalness: 0.5,
      spokeGeo: [0.2, 1.03, 0.1],
      hubColor: 0x5D8091,
      hubRoughness: 1,
      hubMetalness: 0.2,
      hubGeo: [0.2, 0.12, 3, 3],
      bodyLift: 0.2,
      bodyOffset: 0.42
    }
  };

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

const spoilerStyles = {
  stock: {
    wingType: "box",
    bars: true,
    barX: [-0.35, 0.35],
    barY: 0.5,
    barZ: -1.8,
    barHeight: 1,
    barTilt: -0.45,
    wingWidth: 1.49,
    wingHeight: 0.083,
    wingDepth: 0.38,
    wingTilt: 0.2,
    wingY: 1.0,
    wingZ: -2.05,
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
  
  drawGroundTexture(ctx);

  const texture = new THREE.CanvasTexture(canvas); // three.js creates texture from drawn canvas (THREE.Material only knows texure, not canvas)
  texture.repeat.set(-1, -1);
  texture.offset.set(1, 1);

  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),  // size of driveable area (GROUND)
    new THREE.MeshStandardMaterial({ map: texture }) // apply texture to ground material
  );
  groundMesh.rotation.x = -Math.PI / 2; // horizontal (default Plane is vertical)
  scene.add(groundMesh);

  /* ───── PHYSICS WORLD ───── */
  world = new CANNON.World(); // create invisible physic-world (cannon-es)
  world.gravity.set(0,-9.82,0); // gravity on y-axis (left=0, down=-9.82, right=0)
  world.broadphase = new CANNON.SAPBroadphase(world); // optimize collision detection
  world.broadphase.axisIndex = 0; // sort along the x-axis
  world.solver.iterations = 10;

  // GROUND PHYSICS --- important!
  const groundBody = new CANNON.Body({ mass:0 }); // create invisible physic body, mass=0 so that GROUND doesn't move!
  groundBody.addShape(new CANNON.Plane()); // create collision surface
  groundBody.quaternion.setFromEuler(-Math.PI/2,0,0); // horizontal (default Plane is vertical)
  world.addBody(groundBody); // tells cannon-es there is a floor, so objects won't "fall through"

  buildBoundaryFence();

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
  // ── SPOILER ──
  createSpoiler("stock");

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
  carBody.position.set(31.6,0.3,-35); // start position
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

/* ═══════════════════════════════════
  BUILD SCENE
  ═══════════════════════════════════ */
buildWorldFromSceneBuilder();
}

/* ═══════════════════════════════════
   UI POP UP
   ═══════════════════════════════════ */
function updateGaragePopup() {
  const popup = document.getElementById("garagePopup");

  if (!popup) return;
  if (!carBody) return;

  if (isInsideZone(garageZone)) {
    popup.style.display = "block";
  } else {
    popup.style.display = "none";
  }
}

function setActiveButton(button, group, popupId = "garagePopup") {

  document
    .querySelectorAll(`#${popupId} button[data-group="${group}"]`)
    .forEach(btn => btn.classList.remove("active"));

  button.classList.add("active");
}

window.setActiveButton = setActiveButton;

/* ═══════════════════════════════════
   2D SCENE
   ═══════════════════════════════════ */
function drawGroundTexture(ctx) {

  drawGrass(ctx);

  drawAreaSurfaces(ctx);

  drawRoads(ctx);

  drawRoundabout(ctx);

  drawRoadMarkings(ctx);

  drawParkBoxes(ctx);

  drawRaceTrack(ctx);

  drawFinishLine(ctx);

  drawGroundText(ctx);

  drawFootballField(ctx);
}

// GROUND
function drawGrass(ctx) {

  ctx.fillStyle = "#1A521A";
  ctx.fillRect(0, 0, 2048, 2048);

  for (let i = 0; i < 30000; i++) {

    const x = Math.random() * 2048;
    const y = Math.random() * 2048;

    const size = Math.random() * 4 + 1;

    const colors = [
      "#3C7D3C",
      "#174F17",
      "#3E853E"
    ];

    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    ctx.fillRect(x, y, size, size);
  }
}

function drawAreaSurfaces(ctx) {
  drawOrganicArea(ctx, AREAS.tuning);
  drawOrganicArea(ctx, AREAS.stunt);
  drawOrganicArea(ctx, AREAS.race);
  drawOrganicArea(ctx, AREAS.welcome);
}

function drawFootballField(ctx) {

  ctx.strokeStyle = "#F2F2F2";
  ctx.lineWidth = 4;

  const fieldX = 1250;
  const fieldY = 150;

  const fieldWidth = 290;
  const fieldHeight = 165;

  // outer lines
  ctx.strokeRect(
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight
  );

  // center line
  ctx.beginPath();
  ctx.moveTo(
    fieldX + fieldWidth / 2,
    fieldY
  );
  ctx.lineTo(
    fieldX + fieldWidth / 2,
    fieldY + fieldHeight
  );
  ctx.stroke();

  // center circle
  ctx.beginPath();
  ctx.arc(
    fieldX + fieldWidth / 2,
    fieldY + fieldHeight / 2,
    28,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  // goal lines
  ctx.strokeRect(
    1540 - 20,  // right
    204,
    20,
    60
  );

  ctx.strokeRect(
    1270 - 20, // left
    204,
    20,
    60
  );

}

/* ----------------
   ROADS
------------------ */
// ROUNDABOUT
function drawRoundabout(ctx) {

  ctx.strokeStyle = "#0D0D0D";
  ctx.lineWidth = 120;

  ctx.beginPath();
  ctx.arc(
    roundaboutX,
    roundaboutY,
    roundaboutRadius,
    0,
    Math.PI * 2
  );

  ctx.stroke();
}

// DRAW AREA HELPER 
function drawOrganicArea(ctx, area) {
  const x = area.x;
  const y = area.y;
  const w = area.w;
  const h = area.h;

  const tl = area.tl ?? 220;  // top-left curve
  const tr = area.tr ?? 220;  // top-right curve
  const br = area.br ?? 50; // bottom-right curve
  const bl = area.bl ?? 50; // bottom-left curve

  ctx.fillStyle = area.color;

  ctx.beginPath();

  ctx.moveTo(x + tl, y);

  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);

  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);

  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);

  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);

  ctx.closePath();
  ctx.fill();
}

// ROADS
function drawRoads(ctx) {
  ctx.strokeStyle = "#0D0D0D";
  ctx.lineWidth = 120;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  roadSegments.forEach(({ x1, y1, x2, y2 }) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

// ROAD MARKINGS
function drawRoadMarkings(ctx) {
  ctx.strokeStyle = "#BFBFAC";
  ctx.lineWidth = 4;
  ctx.setLineDash([45, 35]);

  // roundabout
  ctx.beginPath();
  ctx.arc(1024, 1024, 200, 0, Math.PI * 2);
  ctx.stroke();

  roadSegments.forEach(({ x1, y1, x2, y2 }) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  ctx.setLineDash([]);

  drawZebraCrossing(ctx, 968, 705,  true);   // north
  drawZebraCrossing(ctx, 968, 1295, true);   // south
  drawZebraCrossing(ctx, 1295, 969, false);  // east
  drawZebraCrossing(ctx, 705,  969, false);  // west
}

// ZEBRA CROSSINGS
function drawZebraCrossing(ctx, x, y, horizontal = true) {

  ctx.fillStyle = "#F2F2F2";

  const stripeWidth = 10;
  const stripeHeight = 50;
  const stripeGap = 10;

  for (let i = 0; i < 6; i++) {

    if (horizontal) {

      ctx.fillRect(
        x + i * (stripeWidth + stripeGap),
        y,
        stripeWidth,
        stripeHeight
      );

    } else {

      ctx.fillRect(
        x,
        y + i * (stripeWidth + stripeGap),
        stripeHeight,
        stripeWidth
      );

    }
  }
}

// PARK BOXES
function drawParkBoxes(ctx) {
// at workshop
  ctx.fillStyle = '#0D0D0D';
  ctx.fillRect(360, 220, 120, 80); // x, y, width, height
  ctx.fillRect(360, 300, 120, 80); // x, y, width, height
  // WHITE OUTLINES
  ctx.strokeStyle = '#D9D9D9';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(360, 220, 120, 80);
  ctx.strokeRect(360, 300, 120, 80);

// at stunt park
  ctx.fillStyle = '#0D0D0D';
  ctx.fillRect(1085, 294, 110, 70); // x, y, width, height
  ctx.fillRect(1085, 222, 110, 70); // x, y, width, height
  ctx.fillRect(1085, 150, 110, 70); // x, y, width, height
  
  // white outlines
  ctx.strokeStyle = '#D9D9D9';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(1085, 294, 110, 70);
  ctx.strokeRect(1085, 222, 110, 70);
  ctx.strokeRect(1085, 150, 110, 70);

  ctx.fillStyle = '#0D0D0D';
  ctx.fillRect(1540, 802, 120, 80); // x, y, width, height

// at welcome
  ctx.fillRect(440, 1230, 120, 70); // x, y, width, height
  
// at race track
  ctx.fillRect(1210, 1740, 50, 120); // x, y, width, height

}

// RACE TRACK
function drawRaceTrack(ctx) {
  ctx.strokeStyle = "#0D0D0D";
  ctx.lineWidth = 95;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.roundRect(
    1365, // x
    1420, // y
    420,  // width
    480,  // height
    120  // radius
  );
  ctx.stroke();
}

// RACE TRACK - FINISH LINE
function drawFinishLine(ctx) {

  const x = 1545;
  const y = 1856.5;

  const tile = 8;
  const rows = 11;
  const cols = 3;

  for (let row = 0; row < rows; row++) {

    for (let col = 0; col < cols; col++) {

      ctx.fillStyle =
        (row + col) % 2 === 0
          ? "#F2F2F2"
          : "#111111";

      ctx.fillRect(
        x + col * tile,
        y + row * tile,
        tile,
        tile
      );
    }
  }

  // FINISH text
  ctx.fillStyle = "#F2F2F2";
  ctx.font = '700 20px "Exo 2"';
  ctx.textAlign = "center";

  ctx.save();
  ctx.translate(x - 15, y + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("START", 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(x + 60, y + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("FINISH", 0, 0);
  ctx.restore();
}

// TEXT HELPERS
function drawWrappedGroundText(ctx, {
  text,
  x,
  y,
  maxWidth = 300,
  lineHeight = 20,
  font = '700 20px "Exo 2"',
  color = "#FFFFFF",
  align = "left",
  rotation = 0
}) {
  ctx.save();

  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "top";

  ctx.translate(x, y);
  ctx.rotate(rotation);

  wrapText(ctx, text, 0, 0, maxWidth, lineHeight);

  ctx.restore();
}

// HEADERS
function drawGroundHeading(ctx, {
  text,
  x,
  y,
  size = 150,
  color = "#FFFFFF"
}) {

  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Exo 2"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, x, y);
}

// PARAGRAPHS
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {

  const words = text.split(' ');
  let line = '';

  for (let i = 0; i < words.length; i++) {

    const testLine = line + words[i] + ' ';
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && i > 0) {

      ctx.fillText(line, x, y);

      line = words[i] + ' ';

      y += lineHeight;

    } else {

      line = testLine;

    }
  }

  ctx.fillText(line, x, y);
}

/* ═══════════════════════════════════
    DRAW TEXT
═══════════════════════════════════ */

function drawGroundText(ctx) {

  drawGroundHeading(ctx, {
    text: "STUNT PARK",
    x: 1600,
    y: 850,
    size: 30
  });

  drawGroundHeading(ctx, {
    text: "JUMP ZONE [SPACE]",
    x: 1740,
    y: 260,
    size: 16
  });

  // TUNING ZONE
  drawGroundHeading(ctx, {
    text: "TUNING ZONE",
    x: 250,
    y: 580,
    size: 30
  });

  // RACE TRACK
  drawGroundHeading(ctx, {
    text: "RACE TRACK",
    x: 1350,
    y: 1350,
    size: 30
  });
  
  // WELCOME
  drawGroundHeading(ctx, {
    text: "WELCOME TO THREE.JS",
    x: 500,
    y: 1400,
    size: 30,
    color: "#FFFC47",
  });

  drawWrappedGroundText(ctx, {
    text: "Everything you see around you was built from simple 3D shapes, canvas textures and a lot of trial and error.",
    x: 498,
    y: 1450,
    rotation: 0,
    maxWidth: 380,
    lineHeight: 24,
    font: '700 25px "Exo 2"',
    color: "#FFFFFF",
    align: "center"
  });

   drawWrappedGroundText(ctx, {
    text: "CONTROLS:",
    x: 500,
    y: 1590,
    rotation: 0,
    maxWidth: 380,
    lineHeight: 24,
    font: '700 25px "Exo 2"',
    color: "#FFFC47",
    align: "center"
  });

  drawWrappedGroundText(ctx, {
    text: "DRIVE [WASD] BOOST [SHIFT] HONK [H] JUMP [SPACE] RESET [R]",
    x: 420,
    y: 1650,
    rotation: 0,
    maxWidth: 200,
    lineHeight: 32,
    font: '700 28px "Exo 2"',
    color: "#FFFFFF",
  });

  drawWrappedGroundText(ctx, {
    text: "⬆️ Check out the tuning options in the workshop and hit the race track to test your skills!",
    x: 485,
    y: 1825,
    rotation: 0,
    maxWidth: 500,
    lineHeight: 25,
    font: '700 20px "Exo 2"',
    color: "#FFFFFF",
    align: "center"
  });

  drawWrappedGroundText(ctx, {
    text: "Enjoy exploring. Leave a like. 👍",
    x: 350,
    y: 1900,
    rotation: 0,
    maxWidth: 400,
    lineHeight: 20,
    font: '700 15px "Exo 2"',
    color: "#FFFFFF",
  });

  drawWrappedGroundText(ctx, {
    text: "Built one bug at a time.",
    x: 622,
    y: 130,
    rotation: 0.5,
    maxWidth: 400,
    lineHeight: 20,
    font: '700 25px "Exo 2"',
    color: "#FFFFFF",
  });
}

/* ═══════════════════════════════════
   3D SCENE
   ═══════════════════════════════════ */
function buildWorldFromSceneBuilder() {
  
  // WORKSHOP AREA
  buildWorkshopArea(10, 0, 10);
  buildThreeJSMonument();

  // BASE + CAR DUMMY
  base3 = new THREE.Group();
  base3.add(spawnBox(0, 0, 0, 2.5, 9, 2.5, 0xE6FCFA));
  base3.add(spawnCarReference(0, -0.1));
  scene.add(base3);

  spawnBox(0, 0, 0, 4.2, 6, 4.2, 0xCCE0DE, 0, 0, 0, true);
  spawnBox(0, 0, 0, 6, 3, 6, 0xB7C9C8, 0, 0, 0, true);

  // RACE TRACK AREA
  buildStartGate(-11, -37.85, "START");
  buildBrickWall(-45, -46, 2, 3);

  // Control zone marker
  const rcw = Math.abs(raceControlZone.xMax - raceControlZone.xMin);
  const rcd = Math.abs(raceControlZone.zMax - raceControlZone.zMin);
  const rcx = (raceControlZone.xMin + raceControlZone.xMax) / 2;
  const rcz = (raceControlZone.zMin + raceControlZone.zMax) / 2;

  const rcGeo = new THREE.BoxGeometry(rcw, 0.8, rcd);

  const rcMarker = new THREE.Mesh(
    new THREE.BoxGeometry(rcw, 0.5, rcd),
    new THREE.MeshBasicMaterial({ color: 0x1489FA, transparent: true, opacity: 0.2 })
  );
  rcMarker.position.set(rcx, 0.5, rcz);
  scene.add(rcMarker);

  const rcEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(rcGeo),
    new THREE.LineBasicMaterial({ color: 0x1489FA, transparent: true, opacity: 0.8 })
  );
  rcMarker.add(rcEdges);

  // STUNT PARK AREA
  spawnJumpZone(jumpZone);
  buildGoal(-25.2, 38.5);
  buildGoal(-11.1, 38.5);
  spawnFootball(-18.5, 0.7, 38);
  buildBrickWall(-23, 15, 6, 3); 
  buildStuntRamp(-34.5, 16);
  buildFireRing(-34.5, 28);
  buildConeSlalom(-28, 34);

  // STREET LAMPS
  spawnStreetLamp(-3.8, -16, 1, 0); // south street
  spawnStreetLamp(3.5, -16, -1, 0);
  spawnStreetLamp(-3.8, -30, 1, 0);
  spawnStreetLamp(3.5, -30, -1, 0);
  spawnStreetLamp(-3.8, -45, 1, 0);
  spawnStreetLamp(3.5, -45, -1, 0);

  spawnStreetLamp(-3.8, 16, 1, 0); // north street
  spawnStreetLamp(3.5, 16, -1, 0);
  spawnStreetLamp(-3.8, 30, 1, 0);
  spawnStreetLamp(3.5, 30, -1, 0);
  spawnStreetLamp(-3.8, 45, 1, 0);
  spawnStreetLamp(3.5, 45, -1, 0);

  spawnStreetLamp(16, -3.5, 0, 1); // west street
  spawnStreetLamp(16, 3.5, 0, -1);
  spawnStreetLamp(30, -3.5, 0, 1);
  spawnStreetLamp(30, 3.5, 0, -1);

  spawnStreetLamp(-16, -3.5, 0, 1); // east street
  spawnStreetLamp(-16, 3.5, 0, -1);
  spawnStreetLamp(-44, -3.5, 0, 1);
  spawnStreetLamp(-44, 3.5, 0, -1);

  // STONES
  spawnStoneCluster(24, 1.8, 10);
  spawnStoneCluster(45, -45, 8); 
  spawnStoneCluster(-43, 44, 6); 

  // ROAD SIGNS
  buildRoadSigns();

  // CONES
  spawnTrafficCone(-40.8,-42.5)
  spawnTrafficCone(-39,-44.2)
  spawnTrafficCone(-41.2,-45)
  spawnTrafficCone(21, 1.3)
}

function buildRoadSigns() {
  spawnRoadSign(22, -4.6, 0, -1, "stop");
  spawnRoadSign(-4, -18, 0, -1, "yield");
  spawnRoadSign(-4, 43, 0, -1, "park");
  spawnRoadSign(29.5, 40, 0, -1, "park");

  spawnRoadSign(0.8, -5.5, 1, 0, "direction", "RACE TRACK", 1, true, 0);
  spawnRoadSign(-4.8, -0.8, 1, -1, "direction", "STUNT PARK", 1, true, 0);
  spawnRoadSign(-0.8, 5.5, -1, 0, "direction", "PARKING", 1, true, 0);
  spawnRoadSign(4.8, 0.8, 1, 1, "direction", "WORKSHOP", 1, true, 0);

  spawnRoadSign(32, -3.7, 1, 0, "direction", "WELCOME", 1, true, 0);
  spawnRoadSign(32.01, -3.6, 1, 0, "direction", "WORKSHOP", -1, false, -0.55);

  spawnRoadSign(-4.4, -33.8, 1, -1, "direction", "RACE TRACK", 1, true, 0);
}

// WORKSHOP GROUP
function buildWorkshopArea(offsetX = 0, offsetY = 0, offsetZ = 0) {
  const workshop = new THREE.Group();

  workshop.add(spawnBox(28, 0.02, 26, 9, 0.01, 11, 0xF5F7F7)); // floor
  spawnBox(offsetX + 28, offsetY + 0.05, offsetZ + 26, 9, 0.1, 11, 0xF5F7F7, 0, 0, 0, true);

  workshop.add(spawnGlassBox(23, 3, 26, 1, 7, 11)); // wall right
  workshop.add(spawnGlassBox(33, 3, 26, 1, 7, 11)); // wall left

  spawnBox(
    offsetX + 23,
    offsetY + 3,
    offsetZ + 26,
    1, 7, 11,
    0xF5F7F7,
    0,0,0,
    true
  ).visible = false;

  spawnBox(
    offsetX + 33,
    offsetY + 3,
    offsetZ + 26,
    1, 7, 11,
    0xF5F7F7,
    0,0,0,
    true
  ).visible = false;

  workshop.add(spawnBox(28, 6.2, 26, 12, 2, 13, 0x332525, Math.PI / 30, 0, 0)); // roof

  workshop.add(spawnGarageSign(28, 7, 19.3, "WORKSHOP"));
  workshop.add(spawnGarageLight(28, 5.8, 19.8));

  workshop.position.set(offsetX, offsetY, offsetZ);

  scene.add(workshop);
}

// BOX, SIGN, LIGHT
function spawnBox(x, y, z, w, h, d, color = 0x555555, rx = 0, ry = 0, rz = 0, physics = false) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1
    })
  );

  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  scene.add(mesh);

  if (physics) {
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)));
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(rx, ry, rz);
  world.addBody(body);
  fixedBodies.push({ body, hw: w/2, hh: h/2, hd: d/2 });
  }

  return mesh;
}

function spawnGarageLight(x, y, z) {
  const lightGroup = new THREE.Group();

  const holder = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.18, 0.25),
    new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.5
    })
  );

  holder.position.set(0, 0, 0);
  lightGroup.add(holder);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffffaa
    })
  );

  bulb.position.set(0, -0.18, 0);
  lightGroup.add(bulb);

  const light = new THREE.PointLight(0xffee88, 8, 12);
  light.position.set(0, -0.18, 0);
  lightGroup.add(light);

  lightGroup.position.set(x, y, z);

  return lightGroup;
}

function spawnGarageSign(x, y, z, text = "WORKSHOP") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#850123";
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = "#A3A2A3";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 122);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = '700 72px "Exo 2"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 1.2),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    })
  );

  sign.position.set(x, y, z);
  sign.rotation.y = Math.PI;
  scene.add(sign);

  return sign;
}

function spawnCylinder(x, y, z, radiusTop, radiusBottom, height, sides, color = 0x555555) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7
    })
  );

  mesh.position.set(x, y, z);
  scene.add(mesh);

  return mesh;
}

function spawnGlassBox(x, y, z, w, h, d) {

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: 0x334455,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65
    })
  );

  mesh.position.set(x, y, z);
  scene.add(mesh);

  return mesh;
}

// ──  FENCE ──
function buildBoundaryFence() {
  const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 });
  const wallL = 10;
  const wallT = 2;

  const wallDefs = [
    { x:  0,  z:  51, w: wallL + 4, h: 6, d: wallT },
    { x:  0,  z: -51, w: wallL + 4, h: 6, d: wallT },
    { x:  51, z:  0,  w: wallT, h: 6, d: wallL + 4 },
    { x: -51, z:  0,  w: wallT, h: 6, d: wallL + 4 },
  ];

  wallDefs.forEach(({ x, z, w, h, d }) => {
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)));
    body.position.set(x, h/2, z);
    world.addBody(body);
  });

function spawnFence(x1, z1, x2, z2) { 
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx*dx + dz*dz);
  const posts = Math.floor(len / 4);

  // posts
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    const px = x1 + dx * t;
    const pz = z1 + dz * t;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8),
      postMat
    );
    post.position.set(px, 1.0, pz);
    scene.add(post);
  }

  // bars
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const isHorizontal = Math.abs(dz) < 0.01; // North/South = X-Axis

  [0.5, 1.7].forEach(y => {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(
        isHorizontal ? len : 0.06,  // X
        0.06,                        // Y
        isHorizontal ? 0.06 : len   // Z
      ),
      railMat
    );
    rail.position.set(cx, y, cz);
    scene.add(rail);
  });
 }

  spawnFence(-50, -50,  50, -50);
  spawnFence( 50, -50,  50,  50);
  spawnFence( 50,  50, -50,  50);
  spawnFence(-50,  50, -50, -50);
}

/* ----------------
   STREET LAMPS
------------------ */
function spawnStreetLamp(x, z, dirX = 1, dirZ = 0) {
  const armLength = 0.9;
  const poleHeight = 4;
  const lampY = 4.1;

  spawnFixedPrism(x, poleHeight / 2, z, 0.08, 0.08, poleHeight, 12, 0x777777);

  const arm = spawnBox(
    x + dirX * armLength / 2,
    lampY,
    z + dirZ * armLength / 2,
    dirX !== 0 ? armLength : 0.08,
    0.08,
    dirZ !== 0 ? armLength : 0.08,
    0x777777
  );

  const lampHead = spawnBox(
    x + dirX * armLength,
    lampY - 0.15,
    z + dirZ * armLength,
    0.35,
    0.18,
    0.35,
    0xffffcc
  );

  lampHead.material.emissive = new THREE.Color(0xffee88);
  lampHead.material.emissiveIntensity = 1.5;

  // true light -> too much overhead

  /* const light = new THREE.PointLight(0xffee88, 8, 18);
  light.position.set(
    x + dirX * armLength,
    lampY - 0.25,
    z + dirZ * armLength
  );
  scene.add(light); */

  const glow = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 12, 12),
  new THREE.MeshBasicMaterial({
    color: 0xffffaa,
    transparent: true,
    opacity: 0.55
  })
);

glow.position.set(
  x + dirX * armLength,
  lampY - 0.25,
  z + dirZ * armLength
);

scene.add(glow);
}

/* ----------------
   STONES
------------------ */
function spawnStoneCluster(x, z, count = 6) {

  const group = new THREE.Group()

  for (let i = 0; i < count; i++) {

    const size = Math.random() * 0.15 + 0.05

    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(size, 0),
      new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 1
      })
    )

    // small spread around cluster center
    stone.position.set(
      x + (Math.random() - 0.5) * 2,
      0.05,
      z + (Math.random() - 0.5) * 2
    )

    stone.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )

    const s = 0.6 + Math.random() * 0.8
    stone.scale.set(s, s * 0.5, s)

    group.add(stone)
  }

  scene.add(group)
}

/* ----------------
   STREET SIGNS
------------------ */
function spawnRoadSign(x, z, dirX = 1, dirZ = 0, type = "stop", text = "", arrowDir = 1, withPole = true, yOffset = 0) {
  const poleHeight = 2.4;
  const signHeight = 2.7;

  // pole
  if (withPole) {
    spawnCylinder(x, poleHeight / 2, z, 0.06, 0.06, poleHeight, 10, 0x888888);
    spawnFixedPrism(x, poleHeight / 2, z, 0.07, 0.07, poleHeight, 10, 0x777777);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (type === "stop") {
  drawStopSign(ctx);
  }

  if (type === "yield") {
  drawYieldSign(ctx);
  }

  if (type === "park") {
  drawParkSign(ctx);
  }

  if (type === "direction") {
  drawDirectionSign(ctx, text, arrowDir);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const geometry =
    type === "direction"
      ? new THREE.PlaneGeometry(2, 1.4)
      : new THREE.PlaneGeometry(2, 2);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const sign = new THREE.Mesh(
    geometry,
    material
  );

  const yPos = (type === "direction"
  ? 2.2
  : signHeight) + yOffset;

  const layerOffset = yOffset * 0.03;

  sign.position.set(
    x + dirX * (0.08 + layerOffset),
    yPos,
    z + dirZ * (0.08 + layerOffset)
  )

  if (dirX === 1) sign.rotation.y = Math.PI / 2;
  if (dirX === -1) sign.rotation.y = -Math.PI / 2;
  if (dirZ === 1) sign.rotation.y = 0;
  if (dirZ === -1) sign.rotation.y = Math.PI;

  scene.add(sign);
}

function drawStopSign(ctx) {
  ctx.fillStyle = "#D92121";
  ctx.beginPath();
  ctx.roundRect(70, 70, 370, 370, 38);
  ctx.fill();

  ctx.strokeStyle = "#F2F2F2";
  ctx.lineWidth = 18;
  ctx.stroke();

  ctx.fillStyle = "#F2F2F2";
  ctx.font = '700 100px "Exo 2"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("STOP", 256, 270);
}

function drawYieldSign(ctx) {
  ctx.fillStyle = "#F2F2F2";
  ctx.beginPath();
  ctx.moveTo(256, 470);
  ctx.lineTo(50, 70);
  ctx.lineTo(462, 70);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#D92121";
  ctx.beginPath();
  ctx.moveTo(256, 430);
  ctx.lineTo(90, 100);
  ctx.lineTo(422, 100);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(256, 350);
  ctx.lineTo(150, 140);
  ctx.lineTo(362, 140);
  ctx.closePath();
  ctx.fill();
}

function drawParkSign(ctx) {
  // blue round sign
  ctx.fillStyle = "#1E5BFF";
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.fill();

  // white border
  ctx.strokeStyle = "#F2F2F2";
  ctx.lineWidth = 18;
  ctx.stroke();

  // parking P
  ctx.fillStyle = "#FFFFFF";
  ctx.font = 'bold 280px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText('P', 256, 275);
}

function drawDirectionSign(ctx, text = "", arrowDir) {

  ctx.fillStyle = "#FFFC1A";
  ctx.strokeStyle = "#2E2D2D";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";

  ctx.beginPath();

  if (arrowDir >= 0) {
  
    // arrow to the right
  ctx.moveTo(40, 190);
  ctx.lineTo(410, 190);
  ctx.lineTo(500, 256);  // point
  ctx.lineTo(410, 322);
  ctx.lineTo(40, 322);
  
  } else {

    // arrow to the left
  ctx.moveTo(500, 190);
  ctx.lineTo(130, 190);
  ctx.lineTo(40,  256);  // point
  ctx.lineTo(130, 322);
  ctx.lineTo(500, 322);

  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // text
  ctx.fillStyle = "#111111";
  ctx.font = '700 65px "Exo 2"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textX = arrowDir >= 0
  ? 250   // right arrow
  : 290;  // left arrow

ctx.fillText(text, textX, 256);
}

/* ----------------
   STUNT PARK
------------------ */
function buildGoal(x, z) {
  const goal = new THREE.Group();

  goal.add(spawnBox(x, 0.85, z - 1.5, 0.08, 1.5, 0.08, 0xF2F2F2, 0, 0, 0, true)); // left
  goal.add(spawnBox(x, 0.85, z + 1.5, 0.08, 1.5, 0.08, 0xF2F2F2, 0, 0, 0, true)); // right
  goal.add(spawnBox(x, 1.5, z, 0.08, 0.08, 2.8, 0xF2F2F2, 0, 0, 0, true));         // crossbar

  scene.add(goal);
}

// Football
function spawnFootball(x, y, z) {
  const radius = 0.55;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#E0E0E0";
  ctx.fillRect(0, 0, 256, 256);

  // pattern
  ctx.fillStyle = "#111111";

  const spots = [];

  for (let y = 20; y <= 236; y += 27) {
    for (let x = 20; x <= 236; x += 27) {
      const offsetX = (Math.floor(y / 27) % 2) * 13;
      spots.push([x + offsetX, y]);
    }
  }

  spots.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  const ballTexture = new THREE.CanvasTexture(canvas);
  ballTexture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({
      map: ballTexture,
      roughness: 0.45
    })
  );

  mesh.position.set(x, y, z);
  scene.add(mesh);

  const body = new CANNON.Body({
    mass: 1.2,
    shape: new CANNON.Sphere(radius)
  });

  body.position.set(x, y, z);
  body.linearDamping = 0.03;
  body.angularDamping = 0.03;

  body.addEventListener("collide", (e) => {
    if (e.body === carBody) {
      const dir = new CANNON.Vec3(
        body.position.x - carBody.position.x,
        0,
        body.position.z - carBody.position.z
      );

      dir.normalize();

      body.velocity.x += dir.x * 4;
      body.velocity.z += dir.z * 4;
      body.velocity.y = Math.min(body.velocity.y, 0.5);

      body.angularVelocity.set(
        dir.z * 8,
        0,
        -dir.x * 8
      );
    }
  });

  world.addBody(body);
  footballBody = body;
  physicsObjects.push({ mesh, body });

  return mesh;
}

function keepFootballInBounds() {
  if (!footballBody) return;

  const limit = 48.5;
  const bounce = 0.7;

  if (footballBody.position.x > limit) {
    footballBody.position.x = limit;
    footballBody.velocity.x *= -bounce;
  }

  if (footballBody.position.x < -limit) {
    footballBody.position.x = -limit;
    footballBody.velocity.x *= -bounce;
  }

  if (footballBody.position.z > limit) {
    footballBody.position.z = limit;
    footballBody.velocity.z *= -bounce;
  }

  if (footballBody.position.z < -limit) {
    footballBody.position.z = -limit;
    footballBody.velocity.z *= -bounce;
  }

  if (footballBody.position.y < -2) {
    footballBody.position.set(-18.5, 0.7, 39);
    footballBody.velocity.set(0, 0, 0);
    footballBody.angularVelocity.set(0, 0, 0);
  }
}

// BRICK WALL
function buildBrickWall(x, z, width = 2, height = 3, size = 0.85) {
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({ color: 0x9C3A3A })
      );

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({ color: 0x5C5A5A })
      );
      mesh.add(edges);
      scene.add(mesh);

      addBrickPhysics(mesh, x + col * size - width * size / 2, 0.5 + row * size, z, size, 3);
    }
  }
}

// RAMP
function buildStuntRamp(x, z) {         // w, h, l               // tilt
  const ramp = spawnDriveableBox(x, 0, z,  5, 0.4, 13, 0x4A4A4A, -Math.PI / 12, 0, 0);

  spawnDriveableBox(-34.5, 0, 20,  4, 2, 5,  0xE8E8E8, -Math.PI / 12,  0,  0, true).visible = true;
  spawnBox(-34.5, 0, 23,  4, 2, 0.5,  0xD94545, 0,  0,  0, true).visible = false;

  return ramp;
}

function spawnDriveableBox(x, y, z, w, h, d, color = 0x555555, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7
    })
  );

  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  scene.add(mesh);

  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(rx, ry, rz);
  world.addBody(body);

  return mesh;
}

// FIRE RING
function buildFireRing(x, z) {
  const group = new THREE.Group();

  // pole
  group.add(spawnBox(0, 0.2, 0, 0.12, 2.5, 0.12, 0x777777));

  // glowing ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.18, 16, 64),
    new THREE.MeshBasicMaterial({
      color: 0xff5500
    })
  );

  ring.position.set(0, 3.4, 0);
  ring.rotation.y = 0;
  group.add(ring);

  // small light
  const light = new THREE.PointLight(0xff6600, 5, 10);
  light.position.set(0, 3.6, 0);
  group.add(light);

  group.position.set(x, 0, z);
  scene.add(group);

  return group;
}

// CONES
function spawnTrafficCone(x, z) {

  // GROUP (alles zusammen)
  const coneGroup = new THREE.Group()

  // base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.06, 0.8),
    new THREE.MeshStandardMaterial({
      color: 0x222222
    })
  )
  base.position.set(0, -0.1, 0)
  coneGroup.add(base)

  // create cone texture
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 64

  const ctx = canvas.getContext('2d')

  // orange
  ctx.fillStyle = '#ff6600'
  ctx.fillRect(0, 0, 32, 64)

  // white stripe
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 24, 32, 12)

  const coneTexture = new THREE.CanvasTexture(canvas)
  coneTexture.colorSpace = THREE.SRGBColorSpace

  // cone
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.33, 1, 12),
    new THREE.MeshStandardMaterial({
      map: coneTexture
    })
  )

  // cone sits on base
  cone.position.set(0, 0.33, 0)
  coneGroup.add(cone)

  // place whole object in world
  coneGroup.position.set(x, 0, z)
  scene.add(coneGroup)

  // box Physics
  addBoxPhysics(coneGroup, x, 0.33, z, 0.9, 5)
}

function buildConeSlalom(startX, startZ) {
  const cones = [
    [0, -2],
    [4, -5],
    [8, -8],
    [12, -11],
    [16, -14]
  ];

  cones.forEach(([x, z]) => {
    spawnTrafficCone(startX + x, startZ + z);
  });
}

// Jump Zone
function spawnJumpZone(zone, y = 0.2) {
  const w = Math.abs(zone.xMax - zone.xMin);
  const d = Math.abs(zone.zMax - zone.zMin);

  const x = (zone.xMin + zone.xMax) / 2;
  const z = (zone.zMin + zone.zMax) / 2;

  const marker = new THREE.Group();

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.1, d),
    new THREE.MeshBasicMaterial({
      color: 0x87C4B6,
      transparent: true,
      opacity: 0.4
    })
  );

  marker.add(plate);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(plate.geometry),
    new THREE.LineBasicMaterial({
      color: 0x69BFAB,
      transparent: true,
      opacity: 1
    })
  );

  marker.add(edges);

  marker.position.set(x, y, z);

  scene.add(marker);

  return marker;
}

/* ----------------
   RACE TRACK
------------------ */
// START & GOAL LINE
function buildStartGate(x, z, text = "") {

  const gate = new THREE.Group();

  // poles
  gate.add(spawnBox(-2.5, 1.5, 0, 0.12, 3, 0.12, 0x888888));
  gate.add(spawnBox( 2.5, 1.5, 0, 0.12, 3, 0.12, 0x888888));

  spawnFixedPrism(x, 1.5, z - 2.5, 0.08, 0.08, 3, 10, 0x888888);
  spawnFixedPrism(x, 1.5, z + 2.5, 0.08, 0.08, 3, 10, 0x888888);

   // banner texture
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#0D0D0D";
  ctx.fillRect(0, 0, 512, 128);

  // border
  ctx.strokeStyle = "#1489FA";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 120);

  // text
  ctx.fillStyle = "#1489FA";
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.2),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    })
  );

  banner.position.set(0, 2.8, 0);

  gate.add(banner);

  gate.position.set(x, 0, z);
  gate.rotation.y = Math.PI / 2;

  scene.add(gate);

  return gate;
}

/* ----------------
   Monument
------------------ */
function buildThreeJSMonument() {

  const loader = new FontLoader();

  loader.load(
    'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',

    function(font) {

      const geometry = new TextGeometry(
        'THREE.JS',
        {
          font: font,
          size: 2,
          depth: 0.5,
          curveSegments: 8,
          bevelEnabled: true,
          bevelThickness: 0.08,
          bevelSize: 0.04
        }
      );

      geometry.center();
      geometry.computeBoundingBox();

      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0xFDFFED
        })
      );

      mesh.position.set(13, 2.7, 42);
  
      
      mesh.scale.set(
        1,
        1.5,
        0.03
      );

      scene.add(mesh);
      mesh.rotation.y = Math.PI - 0.5;

      spawnDriveableBox(
        13,
        0,
        42,
        13,
        2,
        2,
        0x9C8E65,
        0,
        Math.PI - 0.5,
        0,
        true
      ).visible = true;
    }
  );
}

function spawnCarReference(x = 0, z = 0) {
  const carRef = new THREE.Group();

  const refPaint  = new THREE.MeshStandardMaterial({ color: 0xC4C938, roughness: 0.6 });
  const refPaint2 = new THREE.MeshStandardMaterial({ color: 0x93962C, roughness: 0.6 });

  buildCarBody(carRef, refPaint, refPaint2);

  [-0.35, 0.35].forEach(xPos => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.18), chromeMat);
    bar.rotation.x = -0.45;
    bar.position.set(xPos, 0.8, -1.9);
    carRef.add(bar);
  });

  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.49, 0.083, 0.38), refPaint2);
  wing.rotation.x = 0.2;
  wing.position.set(0, 1.0, -2.05);
  carRef.add(wing);

  [[0.9, 0.3, 1.1], [-0.9, 0.3, 1.1], [0.9, 0.3, -1.1], [-0.9, 0.3, -1.1]].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    carRef.add(wheel);
  });

  carRef.position.set(x, 4.5, z);
  scene.add(carRef);

  return carRef;
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

function spawnFixedPrism(x, y, z, radTop, radBot, height, sides, color = 0x555555, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radTop, radBot, height, sides),
    new THREE.MeshStandardMaterial({ color })
  );

  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  scene.add(mesh);

  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(radBot, height/2, radBot)));
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(rx, ry, rz);
  
  world.addBody(body);
  fixedBodies.push({ body, hw: radBot, hh: height/2, hd: radBot });

  return mesh;
}

function addBoxPhysics(mesh,x,y,z,size,mass=1){
  const body = new CANNON.Body({ mass });
  body.addShape(new CANNON.Box(new CANNON.Vec3(size/2,size/2,size/2)));
  body.position.set(x,y,z);

  body.linearDamping = 0.6
  body.angularDamping = 0.8

  world.addBody(body);
  physicsObjects.push({ mesh, body });
}

function isInsideZone(zone) {
  return (
    carBody.position.x >= zone.xMin &&
    carBody.position.x <= zone.xMax &&
    carBody.position.z >= zone.zMin &&
    carBody.position.z <= zone.zMax
  );
}

function addBrickPhysics(mesh, x, y, z, size, mass = 3) {
  const body = new CANNON.Body({ mass: 0 }); // erst statisch

  body.addShape(
    new CANNON.Box(
      new CANNON.Vec3(size / 2, size / 2, size / 2)
    )
  );

  body.position.set(x, y, z);

  body.linearDamping = 0.6;
  body.angularDamping = 0.8;

  world.addBody(body);

  physicsObjects.push({ mesh, body });

  brickObjects.push({
    body,
    mass,
    activated: false
  });
}

function activateBricksNearCar() {
  brickObjects.forEach(obj => {
    if (obj.activated) return;

    const dx = obj.body.position.x - carBody.position.x;
    const dz = obj.body.position.z - carBody.position.z;

    const distSq = dx * dx + dz * dz;

    if (distSq < 5) { // 5 units distance
      obj.body.mass = obj.mass;
      obj.body.type = CANNON.Body.DYNAMIC;
      obj.body.updateMassProperties();
      obj.body.wakeUp();

      obj.activated = true;
    }
  });
}

/* ═══════════════════════════════════
   TUNING
   ═══════════════════════════════════ */

// PAINT-TUNING
function setCarColorTheme(theme) {

  if (!isInsideZone(garageZone)) return;

  const colors = {
    purple: {
      primary: 0x5D376C,
      secondary: 0x9156A8
    },
    red: {
      primary: 0x8C1F1F,
      secondary: 0xD94141
    },
    blue: {
      primary: 0x4A7DFF,
      secondary: 0x95B0F5
    },
    green: {
      primary: 0x1F7A32,
      secondary: 0x56D46B
    },
    black: {
      primary: 0x111111,
      secondary: 0x333333
    }
  };

  const selected = colors[theme];

  if (!selected) return;

  selectedCarColor = selected.primary;
  selectedCarColor2 = selected.secondary;

  paintMat.color.setHex(selectedCarColor);
  paintMat2.color.setHex(selectedCarColor2);
}

window.setCarColorTheme = setCarColorTheme;

// TYRE TUNING
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

function setWheelStyle(style) {
  if (!isInsideZone(garageZone)) return;  // ← erst prüfen
  if (!wheelStyles[style]) return;

  wheelStyle = style;

  carWheels.forEach(wheel => car.remove(wheel));  // ← richtige Gruppe, kein void
  carWheels = [];
  allWheels = [];

  const newLift = wheelStyles[style].bodyLift || 0;
  const bodyOffset = wheelStyles[style].bodyOffset || 0;

  carBodyGroup.position.y = newLift + bodyOffset;

  wheelPositions.forEach(([x, y, z], i) => {
    const wheel = createWheel(x, y + newLift, z, wheelStyle);
    wheel.userData.isWheel = true;
    car.add(wheel);
    carWheels.push(wheel);
    if (i < 2) allWheels.push(wheel);
  });
}

window.setWheelStyle = setWheelStyle;

// BOOST TUNING
function setBoostTheme(theme){
  if (!isInsideZone(garageZone)) return;
  if (!boostThemes[theme]) return;

  boostTheme = theme;
}

window.setBoostTheme = setBoostTheme;

// SPOILER TUNING
function createCurvedSpoilerPart(cfg, material) {
  const curve = new THREE.Shape();

  const w = cfg.wingWidth;
  const h = cfg.wingHeight;
  const c = cfg.curveHeight || 0.15;

  if (cfg.curveDirection === "down") {
    curve.moveTo(-w / 2, 0);
    curve.quadraticCurveTo(0, -c, w / 2, 0);
    curve.lineTo(w / 2, -h);
    curve.quadraticCurveTo(0, -c - h, -w / 2, -h);
    curve.lineTo(-w / 2, 0);
  } else {
    curve.moveTo(-w / 2, 0);
    curve.quadraticCurveTo(0, c, w / 2, 0);
    curve.lineTo(w / 2, -h);
    curve.quadraticCurveTo(0, c - h, -w / 2, -h);
    curve.lineTo(-w / 2, 0);
  }

  const geo = new THREE.ExtrudeGeometry(curve, {
    depth: cfg.wingDepth,
    bevelEnabled: false,
    steps: 1
  });

  geo.center();

  return new THREE.Mesh(geo, material);
}

function createSpoiler(style = "stock") {
  const cfg = spoilerStyles[style];

  spoilerGroup = new THREE.Group();

  if (!cfg) {
    carBodyGroup.add(spoilerGroup);
    return;
  }

  // Spoiler Bars
  if (cfg.bars) {
    const barX = cfg.barX || [-0.35, 0.35];
    const barY = cfg.barY ?? 0.5;
    const barZ = cfg.barZ ?? -1.8;

    barX.forEach(x => {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, cfg.barHeight, 0.18),
        paintMat2
      );

      bar.rotation.x = cfg.barTilt;
      bar.position.set(x, barY, barZ);
      spoilerGroup.add(bar);
    });
  }

  if (cfg.wingType === "curved") {
  const curvedPart = createCurvedSpoilerPart(cfg, paintMat2);

  curvedPart.rotation.x = cfg.wingTilt;
  curvedPart.position.set(0, cfg.wingY, cfg.wingZ);

  spoilerGroup.add(curvedPart);

  } else {

  // Main wing 1
  const spoilerLip = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.wingWidth, cfg.wingHeight, cfg.wingDepth),
    paintMat2
  );

  spoilerLip.rotation.x = cfg.wingTilt;
  spoilerLip.position.set(0, cfg.wingY, cfg.wingZ);
  spoilerGroup.add(spoilerLip);

  // Main wing 2
  const spoilerLip2 = new THREE.Mesh(
    new THREE.BoxGeometry(
      cfg.wingWidth + 0.01,
      cfg.wingHeight * 0.96,
      cfg.wingDepth + 0.01
    ),
    paintMat
  );

  spoilerLip2.rotation.x = cfg.wingTilt;
  spoilerLip2.position.set(0.01, cfg.wingY - 0.01, cfg.wingZ + 0.01);
  spoilerGroup.add(spoilerLip2);
  }

  // side wings
  if (cfg.sideWings !== false) {
  [-cfg.wingWidth / 2 - 0.055, cfg.wingWidth / 2 + 0.055].forEach(x => {
    const side = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.25, cfg.wingDepth),
      paintMat2
    );

    side.rotation.x = 10;
    side.position.set(x, cfg.wingY + 0.01, cfg.wingZ + 0.02);
    spoilerGroup.add(side);
  });
}
  carBodyGroup.add(spoilerGroup);
}

function setSpoilerStyle(style) {
  if (!isInsideZone(garageZone)) return;
  if (!(style in spoilerStyles)) return;

  spoilerStyle = style;

  if (spoilerGroup) {
    carBodyGroup.remove(spoilerGroup);
  }

  createSpoiler(style);
}

window.setSpoilerStyle = setSpoilerStyle;

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

  world.step(1/60,dt); // 1/60 simulation rate of 60 steps per seconds

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

  physicsObjects.forEach(o=>{
    o.mesh.position.copy(o.body.position);
    o.mesh.quaternion.copy(o.body.quaternion);
  });

  activateBricksNearCar();
  keepFootballInBounds();

  updateCar(dt);
  updateCamera();
  updateGaragePopup();

  // statue
  if (base3) base3.rotation.y += 0.003; // rotate car reference + top base

  document.getElementById("coords").innerHTML =
  `X: ${carBody.position.x.toFixed(1)}<br>
   Y: ${carBody.position.y.toFixed(1)}<br>
   Z: ${carBody.position.z.toFixed(1)}`;

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