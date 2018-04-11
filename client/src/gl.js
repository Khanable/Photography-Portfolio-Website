import { UpdateController } from './update';
import { Color, WebGLRenderer } from 'three';
import { AppendAttribute, GetWindowSize } from './util.js';
import * as Detector from 'three/examples/js/Detector.js';

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
		this._webGLSupport = Detector.webgl;

		if ( this._webGLSupport ) {
			this._renderer = new WebGLRenderer( { alpha: true, depth: false } );
			this._renderer.setPixelRatio(window.devicePixelRatio);
			this._renderer.autoClear = false;
			this._renderer.sortObjects = false;

			this._draws = [];

			document.body.appendChild(this._renderer.domElement);
			window.addEventListener('resize', this._resize.bind(this) );

			UpdateController.renderSubject.subscribe(this._render.bind(this));
			this._resize();
		}
	}

	_render(dt) {
		this._renderer.setScissorTest(false);
		this._renderer.setClearColor(new Color(0, 0, 0), 1);
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
		if ( this._webGLSupport ) {
			this._draws.push(new Draw(scene, camera, viewportRect, layer));
		}
		else {
			throw new Error('WebGL not supported');
		}
	}

	get webGLSupport() {
		//return false;
		return this._webGLSupport;
	}
}

export const GL = new GLRenderer();
