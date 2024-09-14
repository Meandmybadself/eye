import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import gsap from 'gsap'

let camera, scene, renderer;
let controller;
let eye;
let lastYButtonState = false;

function init() {
  const container = document.createElement('div');
  container.id = 'container';
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(0, 0, 2.5);

  scene = new THREE.Scene();

  const basePath = document.location.hostname.includes('localhost') ? `/assets/` : './assets/';

  new RGBELoader()
    .load(`${basePath}/royal_esplanade_1k.hdr`, function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      render();

      const roughnessMipmapper = new RoughnessMipmapper(renderer);

      const loader = new GLTFLoader()
      loader.load(`${basePath}/Eye.glb`, function (glb) {
        glb.scene.traverse(function (child) {
          if (child.isMesh) {
            roughnessMipmapper.generateMipmaps(child.material);
          }
        });
        scene.add(glb.scene);
        roughnessMipmapper.dispose();
        render();
        eye = scene.getObjectByName('Eye_Blue_01');
        rotateEye();
      });
    });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize);
  
  // Add button to check for controller
  const checkControllerButton = document.createElement('button');
  checkControllerButton.textContent = 'Check for Xbox Controller';
  checkControllerButton.style.position = 'absolute';
  checkControllerButton.style.top = '10px';
  checkControllerButton.style.left = '10px';
  checkControllerButton.addEventListener('click', checkForController);
  document.body.appendChild(checkControllerButton);

  // Listen for gamepad connections
  window.addEventListener("gamepadconnected", handleGamepadConnected);
  window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
}

function handleGamepadConnected(event) {
  console.log("Gamepad connected:", event.gamepad);
  controller = event.gamepad;
}

function handleGamepadDisconnected(event) {
  console.log("Gamepad disconnected:", event.gamepad);
  controller = null;
}

function checkForController() {
  const gamepads = navigator.getGamepads();
  for (const gamepad of gamepads) {
    if (gamepad && (gamepad.id.includes('Xbox') || gamepad.id.includes('X-Box'))) {
      console.log("Xbox controller found:", gamepad);
      controller = gamepad;
      return;
    }
  }
  console.log("No Xbox controller found. Please connect your controller and try again.");
}

function rotateEye() {
  if (!eye || !controller) return;
  
  // Refresh the gamepad state
  controller = navigator.getGamepads()[controller.index];
  
  if (controller.axes.length >= 4) {
    // Xbox controller uses axes[2] for right stick X and axes[3] for right stick Y
    const analogX = controller.axes[2];
    const analogY = controller.axes[3];
    const amount = 45;

    // Invert Y axis for more intuitive control
    const x = deg2rad(analogY * amount);
    const y = deg2rad(analogX * amount);
    
    gsap.to(eye.rotation, 0.4, {
      x, y,
      ease: "power3.out"
    });
  }

  // Check Y button (index 3) for blinking
  const yButtonPressed = controller.buttons[3].pressed;
  if (yButtonPressed && !lastYButtonState) {
    blink();
  }
  lastYButtonState = yButtonPressed;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  
  if (controller) {
    rotateEye();
  }
}

function deg2rad(degrees) {
  return degrees * Math.PI / 180;
}

function blink() {
  document.querySelectorAll('.eyelid').forEach(el => el.classList.add('eyelid--closed'));
  setTimeout(() => {
    document.querySelectorAll('.eyelid').forEach(el => el.classList.remove('eyelid--closed'));
  }, 200);
}

init();
render();