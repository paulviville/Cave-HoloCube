import * as THREE from "./three/three.module.js";

export default class VRPNController {
	#head = {
		position: new THREE.Vector3( 0, 0, 1.8 ),
		rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)
	};

	constructor ( ) {
		console.log( `VRPNController - constructor` );
	}

	get head ( ) {
		return {
			position: this.#head.position.clone(),
			rotation: this.#head.rotation.clone(),
		}
	}
}