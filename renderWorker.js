import Cave from "./Cave/Cave.js";
import CaveHelper from "./Cave/CaveHelper.js";
import Screen from "./Cave/Screen.js";
import * as THREE from "./three/three.module.js";
import VRPNController from "./VRPNController.js";

console.log("worker");

self.addEventListener("message", handleMessage )

const vrpnController = new VRPNController();


function handleMessage ( message ) {
	// console.log(message);
	if(message.data.type === "monitorCanvas") {
		initRenderer(message.data.canvas);
	}
	if(message.data.type === "monitorCamera") {
		updateCamera(message.data.position, message.data.quaternion);
	}
	
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0Xeeeeee);
const camera = new THREE.PerspectiveCamera( 50, 4/3, 0.01, 50 );
camera.position.set( 0, 0, 6 );

const trackedCamera = new THREE.PerspectiveCamera( 50, 1.5, 0.01, 0.3 );
const trackedCameraHelper = new THREE.CameraHelper(trackedCamera);
scene.add(trackedCameraHelper);

const PDS = Math.sqrt(2) * 1.8;
const t = new THREE.Vector3(1, 1, 0).normalize().multiplyScalar(2.25);
const screenCorners0 = [
    new THREE.Vector3(-PDS, 0, 0),
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(-PDS, 0, 2.25),
    new THREE.Vector3(0, PDS, 2.25),
];

const screenCorners1 = [
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(PDS, 0, 0),
    new THREE.Vector3( 0, PDS, 2.25),
    new THREE.Vector3( PDS, 0, 2.25),
];

const screenCorners2 = [
  new THREE.Vector3(-t.x, PDS - t.y, 0),
  new THREE.Vector3(PDS - t.x, -t.y, 0),
  new THREE.Vector3(0, PDS, 0),
  new THREE.Vector3(PDS, 0, 0),
];

// const screenCorners2 = [
//     new THREE.Vector3(-PDS + 1.34, 1.34, 0),
//     new THREE.Vector3(-PDS +3.31, -0.63, 0),
//     new THREE.Vector3(0, PDS, 0),
//     new THREE.Vector3(1.97, PDS - 1.97, 0),
// ];

const screens = [
    new Screen(screenCorners0),
    new Screen(screenCorners1),
    new Screen(screenCorners2),
]

const cave = new Cave(screens);
const caveHelper = new CaveHelper(cave);
scene.add(caveHelper)
let renderer = undefined;

function initRenderer ( canvas ) {
	renderer = new THREE.WebGLRenderer({ canvas: canvas });

	renderer.setAnimationLoop( () => {
		const head = vrpnController.head;
		console.log(head)
		trackedCamera.position.copy(head.position);
		trackedCamera.rotation.setFromQuaternion(head.rotation);
		trackedCamera.updateProjectionMatrix();
		trackedCamera.updateWorldMatrix();
		trackedCameraHelper.update();
		renderer.render(scene, camera);
	})
}

function updateCamera ( position, quaternion ) {
	console.log(position)
	camera.position.fromArray(position);
	camera.quaternion.fromArray(quaternion);
	camera.updateMatrixWorld();
}