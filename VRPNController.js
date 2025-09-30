import * as THREE from "./three/three.module.js";

export default class VRPNController {
	#head = {
		position: new THREE.Vector3( 0, 0, 2 ),
		rotation: new THREE.Quaternion()
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