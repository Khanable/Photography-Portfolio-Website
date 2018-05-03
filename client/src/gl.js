import { UpdateController } from './update';
import { Object3D, Color, WebGLRenderer, MeshBasicMaterial, PlaneBufferGeometry, Mesh, Scene, OrthographicCamera } from 'three';
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
			this._camera = new OrthographicCamera( -1, 1, 1, -1, 0, 100 );
			this._scene = new Scene();
			this._coordTransform = new Object3D()
			this._scene.add(this._coordTransform);
			this._renderer = new WebGLRenderer({alpha:true, depth:true, stencil:false});
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
			this._renderer.setSize(size.x, size.y);
			this._renderer.domElement.setAttribute('style', 'width:100%;height:100%;position:absolute;');
			let halfX = size.x/2;
			let halfY = size.y/2;
			this._camera.left = -halfX;
			this._camera.right = halfX;
			this._camera.top = halfY;
			this._camera.bottom = -halfY;
			this._camera.position.set(halfX, halfY, 0);
			this._camera.updateProjectionMatrix();
			this._coordTransform.position.set(0, size.y, 0);
			this._coordTransform.rotation.set(0, 0, -Math.PI);
			this._coordTransform.scale.set(-1, 1, 1);
		}
	}

	add(v) {
		if ( this._webGLSupport ) {
			let rtn = new Object3D();
			this._coordTransform.add(rtn);
			v.rotation.set(0, 0, Math.PI);
			v.scale.set(-1, 1, 1);
			rtn.add(v);
			return rtn;
		}
		else {
			throw new Error('WebGL not supported, or fallback has been loaded');
		}
	}

	remove(v) {
		if ( this._webGLSupport ) {
			this._coordTransform.remove(v);
		}
		else {
			throw new Error('WebGL not supported, or fallback has been loaded');
		}
	}

	get webGLSupport() {
		//return false;
		return this._webGLSupport;
	}
}

export const GL = new GLRenderer();
