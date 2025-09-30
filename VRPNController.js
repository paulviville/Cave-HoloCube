import * as THREE from "./three/three.module.js";

const OFFSET_QUATERNION = new THREE.Quaternion();
OFFSET_QUATERNION.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2))


export default class VRPNController {
	#socket 
	
	#head = {
		position: new THREE.Vector3( 0, 0, 1.8 ),
		rotation: new THREE.Quaternion().copy( OFFSET_QUATERNION )
	};

	constructor ( ) {
		console.log( `VRPNController - constructor` );
	}

	connect ( url = "ws://localhost:8000" ) {
		this.#socket = new WebSocket( url );
		this.#socket.addEventListener( "message", this.#handleMessage.bind(this) );
	}

	#handleMessage ( message ) {
		const data = message.data;
		// TODO: CLEAN-UP
		const transforms = data.split( " " ).map( x => parseFloat(x) );
		this.#head.position.fromArray( transforms, 0 );
		this.#head.rotation.fromArray( transforms, 3 );
		this.#head.rotation.multiply( OFFSET_QUATERNION );
	}

	get head ( ) {
		return {
			position: this.#head.position.clone(),
			rotation: this.#head.rotation.clone(),
		}
	}
}