/*
 * Three.js car playground
 * © 2026 Alina — github.com/alyna1411
 * Demo-Version (v8)
 */

// import three.js and store everything under "THREE" -> no physics, just objects
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
// import cannon-es and store everything under "CANNON" -> for physics (gravity, collision, mass...)
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

// scene = 3D-World (three.js) | world = 3D-World (cannon-es) | camera = view/perspective | renderer = creates the <canvas>
let scene, world, camera, renderer;
// measures time between frames - dt = deltatime (movement not dependent on fps)
let clock = new THREE.Clock();

// build
init();
// loop
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

  window.addEventListener("resize", onResize); // when browser window is resized - adjust/update scene size
}

function animate() {
  requestAnimationFrame(animate); // loop animate() every frame
  const dt = clock.getDelta(); // measure time between frame
  renderer.render(scene, camera); // draw scene/world again
}

function onResize() { // when browser size changes
  camera.aspect = window.innerWidth / window.innerHeight; // calculate browser size
  camera.updateProjectionMatrix(); // changed settings = recalculate size 
  renderer.setSize(window.innerWidth, window.innerHeight); // resizes canvas
}