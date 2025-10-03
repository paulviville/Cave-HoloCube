import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/controls/OrbitControls.js";
import ScreenWindow from "./Cave/ScreenWindow.js";

export default class MultiScreenViewer {
	#worker;
	#camera;
	#caveWindow;

	constructor ( ) {
		console.log( `MultiScreenViewer - constructor` );

		window.addEventListener( "beforeunload", this.#beforeUnload.bind( this ) );
		
		this.#worker = new Worker( "./renderWorker.js", { type: "module" } );
		this.#worker.addEventListener( "error", ( event ) => { console.log( "worker error", event ); });
	
		this.#initializeMainWindow( );
		this.#initializeCaveWindow( );
	}

	#initializeMainWindow ( ) {
		const canvas = document.createElement( "canvas" );
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		document.body.appendChild( canvas );

		const offScreenCanvas = canvas.transferControlToOffscreen( );
		this.#worker.postMessage({ type: "monitorCanvas", canvas: offScreenCanvas }, [offScreenCanvas] );

		const worldUp = new THREE.Vector3(0, 0, 1);
		this.#camera = new THREE.PerspectiveCamera( 70, 800/600, 0.1, 1 );
		this.#camera.up.copy(worldUp);
		this.#camera.position.set( -2, -4, 3 );
		this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.#camera.updateMatrixWorld()

		this.#worker.postMessage({ type: "monitorCamera", position: this.#camera.position.toArray(), quaternion: this.#camera.quaternion.toArray()});

		const controls = new OrbitControls(this.#camera, canvas);
		controls.addEventListener("change", () => {
			this.#worker.postMessage({ type: "monitorCamera", position: this.#camera.position.toArray(), quaternion: this.#camera.quaternion.toArray()});
			
		})
	}

	#initializeCaveWindow ( ) {
		this.#caveWindow = new ScreenWindow({
			onLoad: ( ) => {
				console.log(this.#caveWindow.canvas)
				const offScreenCanvas = this.#caveWindow.canvas.transferControlToOffscreen( );
				this.#worker.postMessage({ type: "caveCanvas", canvas: offScreenCanvas }, [offScreenCanvas] );
			},
			onResize: ( ) => {
				this.#worker.postMessage({ type: "caveCanvasResize", width: this.#caveWindow.width, height: this.#caveWindow.height } );
			},
			onMouseUp: ( ) => {
				console.log("clicked")
				this.#worker.postMessage({ type: "flipEyes" } );
			}
		});
		this.#caveWindow.open();
	}

	#beforeUnload ( ) {
		this.#caveWindow.close();
	}
}