import { UpdateController } from './update';
import { Color, WebGLRenderer, MeshBasicMaterial, PlaneBufferGeometry, Mesh, Scene, OrthographicCamera } from 'three';
import { GetWindowSize } from './util.js';
import * as Detector from 'three/examples/js/Detector.js';
import { Vector2 } from './vector.js';

export class GLRenderer {
	constructor() {
		this._webGLSupport = Detector.webgl;

		this._lowFrameRateSubscription = UpdateController.frameRateLowSubject.subscribe( e => {
			if ( e ) {
				this._lowFrameRateSubscription.unsubscribe();
				this._loadFallback();
			}
		});

		if ( this._webGLSupport ) {
			this._camera = new OrthographicCamera( 0, 0, 0, 0, 0, 100 );
			this._scene = new Scene();
			this._renderer = new WebGLRenderer( { alpha: true, stencilBuffer: false } );
			this._renderer.setClearColor(new Color(0, 0, 0));
			this._renderer.setPixelRatio(window.devicePixelRatio);

			document.body.appendChild(this._renderer.domElement);
			this._resizeEventHook = this._resize.bind(this);
			window.addEventListener('resize', this._resizeEventHook );

			this._renderSubscription = UpdateController.renderSubject.subscribe(this._render.bind(this));
			this._resize();
		}
	}

	_loadFallback() {
		if ( this._webGLSupport ) {
			this._webGLSupport = false;
			document.body.removeChild(this._renderer.domElement);
			this._renderer = null;
			this._camera = null;
			this._scene = null;
			window.removeEventListener('resize', this._resizeEventHook);
			this._renderSubscription.unsubscribe();
		}
	}

	_render(dt) {
		this._renderer.render(this._scene, this._camera);
	}

	_resize() {
		if ( this._renderer.domElement.parentNode != undefined ) {
			let size = GetWindowSize();
			let halfX = size.x/2;
			let halfY = size.y/2;
			this._camera.left = -1;
			this._camera.right = 1;
			this._camera.top = 1;
			this._camera.bottom = -1;
			this._camera.position.set(0.25, 0, 0);
			this._camera.updateProjectionMatrix();
			this._renderer.setSize(size.x, size.y);
			this._renderer.domElement.setAttribute('style', 'position:absolute;');
		}
	}

	add(v) {
		if ( this._webGLSupport ) {
			this._scene.add(v);
		}
		else {
			throw new Error('WebGL not supported, or fallback has been loaded');
		}
	}

	get webGLSupport() {
		return this._webGLSupport;
	}
}

export const GL = new GLRenderer();
