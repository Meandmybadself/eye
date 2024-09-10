import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import gsap from 'gsap'

let camera, scene, renderer;
let controller;
let eye;

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
  // window.addEventListener('click', toggleFullScreen);
  
  // Add button for Bluetooth connection
  const connectButton = document.createElement('button');
  connectButton.textContent = 'Connect Nintendo Switch Controller';
  connectButton.style.position = 'absolute';
  connectButton.style.top = '10px';
  connectButton.style.left = '10px';
  connectButton.addEventListener('click', connectBluetoothDevice);
  document.body.appendChild(connectButton);

  setTimeout(() => blink(), randomBetween(1000, 5000));
}

function blink() {
  document.querySelectorAll('.eyelid').forEach(el => el.classList.add('eyelid--closed'));
  setTimeout(() => {
    document.querySelectorAll('.eyelid').forEach(el => el.classList.remove('eyelid--closed'));
    setTimeout(() => blink(), randomBetween(10000, 20000));
  }, 200);
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min + 1) + min;
}

function deg2rad(degrees) {
  return degrees * Math.PI / 180;
}

function rotateEye() {
  if (!eye) return;
  
  
    

  if (controller && controller.axes.length >= 2) {

    // console.log(controller);
    // console.log(controller.axes);

    const analogX = controller.axes[0];
    const analogY = controller.axes[1];
    const amount = 15;

    const x = deg2rad(analogY * amount);
    const y = deg2rad(-analogX * amount);
    
    console.log(controller)

    gsap.to(eye.rotation, 0.1, {
      x, y,
      ease: "power3.out"
    });
  } else {
    const amount = 15;
    const x = deg2rad(randomBetween(0, 15));
    const y = deg2rad(randomBetween(-amount, amount));
    const time = randomBetween(0.1, 0.5);
    
    gsap.to(eye.rotation, time, {
      x, y,
      onComplete: () => {
        setTimeout(() => rotateEye(), randomBetween(1000, 8000));
      },
      ease: "power3.out"
    });
  }
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

async function connectBluetoothDevice() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Pro Controller' }],
    });

    console.log('Bluetooth device connected:', device);

    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad);
      controller = e.gamepad;
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Gamepad disconnected:", e.gamepad);
      controller = null;
    });
  } catch (error) {
    console.error('Error connecting to Bluetooth device:', error);
  }
}

init();
render();