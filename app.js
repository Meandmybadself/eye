import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import gsap from 'gsap'

let camera, scene, renderer;

function init() {
    const container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
    camera.position.set(0, 0, 2.5);

    scene = new THREE.Scene();

    const basePath = document.location.hostname.includes('localhost') ? 'http://localhost:3000' : './assets/';

    new RGBELoader()
        .load(`${basePath}/royal_esplanade_1k.hdr`, function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            render();

            const roughnessMipmapper = new RoughnessMipmapper(renderer);
            const loader = new GLTFLoader()//.setPath('models/');
            loader.load(`${basePath}/Eye.glb`, function (glb) {
                glb.scene.traverse(function (child) {
                    if (child.isMesh) {
                        roughnessMipmapper.generateMipmaps(child.material);
                    }
                });
                scene.add(glb.scene);
                roughnessMipmapper.dispose();

                render();
                rotateEye()
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
    window.addEventListener('click', toggleFullScreen)
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
    const eye = scene.getObjectByName('Eye_Blue_01');
    const amount = 30
    const x = deg2rad(randomBetween(0, 20))
    const y = deg2rad(randomBetween(-amount, amount))
    const time = randomBetween(2, 8)
    gsap.to(eye.rotation, time, {
        x, y, onComplete: () => {
            setTimeout(() => rotateEye(), 2000)
        },
        ease: "power3.out"
    })
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
}

init();
render();