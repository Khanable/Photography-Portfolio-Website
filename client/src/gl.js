import { UpdateController } from './update';
import { Color, OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, WebGLRenderer, ShaderMaterial } from 'three';
import { GetElementSize, AppendAttribute, GetWindowSize } from './util.js';
import { Vector2 } from './vector.js';
import { UpdateController } from './update';

class Draw {
	constructor(scene, camera, viewportRect, layer) {
		this.scene = scene;
		this.camera = camera;
		this.viewportRect = viewportRect;
		this.layer = layer;
	}
}

export class GLRenderer {
	constructor() {
		this._renderer = new WebGLRenderer();
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setClearColor(new Color(0, 0, 0));

		this._draws = [];

		document.body.appendChild(this._renderer.domElement);
		window.addEventListener('resize', this._resize.bind(this) );

		UpdateController.renderSubject.subscribe(this._render.bind(this));
		this._resize();
	}

	_render(dt) {
		this._renderer.setScissorTest(false);
		this._renderer.clear();
		this._renderer.setScissorTest(true);
		let draws = this._draws.sort( (a, b) => b.layer-a.layer );
		while( draws.length > 0 ) {
			let e = draws.pop();
			this._renderer.setViewport(e.viewportRect.x, e.viewportRect.y, e.viewportRect.w, e.viewportRect.h);
			this._renderer.setScissor(e.viewportRect.x, e.viewportRect.y, e.viewportRect.w, e.viewportRect.h);
			this._renderer.render(e.scene, e.camera);
		}
	}

	_resize() {
		if ( this._renderer.domElement.parentNode ) {
			let size = GetWindowSize();
			this._renderer.setSize(size.x, size.y);
			AppendAttribute(this._renderer.domElement, 'style', 'position:absolute;');
		}
	}

	draw(scene, camera, viewportRect, layer) {
		this._draws.push(new Draw(scene, camera, viewportRect, layer));
	}
}

export class GLBase {
	constructor(domRoot, uniforms, vertexShader, fragmentShader) {
		this._domRoot = domRoot;
		this._camera = new OrthographicCamera( -1, 1, 1, -1, 0, 1 );
		this._scene = new Scene();
		this._mesh = null;
		this._uniforms = uniforms;
		this._subscriptions = [];
		this._lastFustrum = null;

		let material = new ShaderMaterial( {
			uniforms: this._uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		} );
		let geometry = new PlaneBufferGeometry(1, 1);
		this._mesh = new Mesh(geometry, material);
		this._scene.add(this._mesh);

		this._subscriptions.push(UpdateController.updateSubject.subscribe( this._update.bind(this) ));
	}

	_getViewFustrum() {
		let windowSize = GetWindowSize();
		let aspect = windowSize.x < windowSize.y ? windowSize.x/windowSize.y : windowSize.y/windowSize.x;
		aspect/=2;
		let rtn = {
			left: -aspect,
			right: aspect,
			top: 0.5,
			bottom: -0.5,
		}

		if ( windowSize.x > windowSize.y ) {
			let lTemp = rtn.left;
			let rTemp = rtn.right;
			rtn.left = rtn.bottom;
			rtn.right = rtn.top;
			rtn.bottom = lTemp;
			rtn.top = rTemp;
		}

		return rtn;
	}

	_resize() {
		if ( this._domRoot != null ) {
			let fustrum = this._getViewFustrum();
			if ( this._lastFustrum == null || (fustrum.left != this._lastFustrum.left && fustrum.right != this._lastFustrum.right && fustrum.top != this._lastFustrum.top && fustrum.bottom != this._lastFustrum.bottom) ) {
				this._camera.left = fustrum.left;
				this._camera.right = fustrum.right;
				this._camera.top = fustrum.top;
				this._camera.bottom = fustrum.bottom;
				this._camera.updateProjectionMatrix();
				this._lastFustrum = fustrum;
			}
		}
	}

	set domRoot(v) {
		this._domRoot = v;
	}

	_update(dt) {
		this._resize();
	}

	destroy() {
		this._subscriptions.forEach( e => e.unsubscribe() );
	}
}


export const GL = new GLRenderer();
