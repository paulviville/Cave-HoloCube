import Cave from "./Cave/Cave.js";
import CaveHelper from "./Cave/CaveHelper.js";
import Screen from "./Cave/Screen.js";
import * as THREE from "./three/three.module.js";
import VRPNController from "./VRPNController.js";
import HoloCube from "./HoloCube/HoloCube.js";
import HoloCubeDisplay from "./HoloCube/HoloCubeDisplay.js";
import { remoteScene } from "./remoteScene.js";


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

const screens = [
    new Screen(screenCorners0),
    new Screen(screenCorners1),
    new Screen(screenCorners2),
]

const cave = new Cave(screens);
const stereoCamera = cave.stereoScreenCameras[0];
const caveHelper = new CaveHelper(cave);
scene.add(caveHelper)

const textureWidth = 2048;
const textureHeight = 2048;
const renderSettings = {
	minFilter: THREE.NearestFilter,
	magFilter: THREE.NearestFilter,
	format: THREE.RGBAFormat,
	type: THREE.FloatType,
}

const renderTargetsL = {};
const renderTargetsR = {};
const screenTexturesL = {};
const screenTexturesR = {};
const camerasL = {};
const camerasR = {};

const holoCube = new HoloCube();
holoCube.position = new THREE.Vector3(0, 1.41, 1);

for( const face of ["x", "y", "z"] ) {
	renderTargetsL[face] = new THREE.WebGLRenderTarget(textureWidth, textureHeight, renderSettings);
	renderTargetsL[face].depthTexture = new THREE.DepthTexture(textureWidth, textureHeight);
	renderTargetsL[face].depthTexture.format = THREE.DepthFormat;
	renderTargetsL[face].depthTexture.type = THREE.FloatType;
	renderTargetsR[face] = new THREE.WebGLRenderTarget(textureWidth, textureHeight, renderSettings);
	renderTargetsR[face].depthTexture = new THREE.DepthTexture(textureWidth, textureHeight);
	renderTargetsR[face].depthTexture.format = THREE.DepthFormat;
	renderTargetsR[face].depthTexture.type = THREE.FloatType;

	screenTexturesL[face] = {
		texture: renderTargetsL[face].texture,
		depthTexture: renderTargetsL[face].depthTexture,
	}
	screenTexturesR[face] = {
		texture: renderTargetsR[face].texture,
		depthTexture: renderTargetsR[face].depthTexture,
	}

	camerasL[face] = new THREE.PerspectiveCamera();
	camerasL[face].matrixAutoUpdate = false;
	camerasR[face] = new THREE.PerspectiveCamera();
	camerasR[face].matrixAutoUpdate = false;
}


const holoCubeDisplayL = new HoloCubeDisplay( holoCube, screenTexturesL );
const holoCubeDisplayR = new HoloCubeDisplay( holoCube, screenTexturesR );
holoCubeDisplayL.update();
holoCubeDisplayR.update();
scene.add(holoCubeDisplayL.display);
scene.add(holoCubeDisplayL.screens);
scene.add(holoCubeDisplayR.screens);
holoCubeDisplayL.setScreenLayers(1);
holoCubeDisplayR.setScreenLayers(2);


camera.layers.enable(1);
camera.layers.enable(2);



let renderer = undefined;

function initRenderer ( canvas ) {
	renderer = new THREE.WebGLRenderer({ canvas: canvas });

	renderer.setAnimationLoop( () => {
		const head = vrpnController.head;
		trackedCamera.position.copy(head.position);
		trackedCamera.rotation.setFromQuaternion(head.rotation);
		trackedCamera.updateProjectionMatrix();
		trackedCamera.updateWorldMatrix();
		trackedCameraHelper.update();


		cave.updateStereoScreenCameras(trackedCamera.matrixWorld.clone());
		caveHelper.updateStereoScreenCameraHelpers();


		holoCube.computeCameraMatrices( stereoCamera.left.position, camerasL );
		holoCube.computeCameraMatrices( stereoCamera.right.position, camerasR );
		holoCubeDisplayL.updateScreens( stereoCamera.left.position );
		holoCubeDisplayR.updateScreens( stereoCamera.right.position );
		
		for( const face of ["x", "y", "z"] ) {
			renderer.setRenderTarget( renderTargetsL[face] );
			renderer.render( remoteScene, camerasL[face] );
			renderer.setRenderTarget( renderTargetsR[face] );
			renderer.render( remoteScene, camerasR[face] );
		}


		renderer.setRenderTarget( null );




		renderer.render(scene, camera);


	})
}

function updateCamera ( position, quaternion ) {
	camera.position.fromArray(position);
	camera.quaternion.fromArray(quaternion);
	camera.updateMatrixWorld();
}



