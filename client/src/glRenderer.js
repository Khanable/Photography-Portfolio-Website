import { WebGLRenderer, Color } from 'three';
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
	}

	_render(dt) {
		this._renderer.setScissorTest(false);
		this._renderer.clear();
		let draws = this._draws.sort( (a, b) => b.layer-a.layer );
		for( let e of draws ) {
			this._renderer.setViewport(e.viewportRect.x, e.viewportRect.y, e.viewportRect.w, e.viewportRect.h);
			this._renderer.setScissor(e.viewportRect.x, e.viewportRect.y, e.viewportRect.w, e.viewportRect.h);
			this._renderer.render(e.scene, e.camera);
		}
	}

	_resize() {
		if ( this._renderer.domElement.parentNode ) {
			let size = GetElementSize(this._renderer.domElement.parentNode);
			this._renderer.setSize(size.x, size.y);
		}
	}

	draw(scene, camera, viewportRect, layer) {
		this._draws.push(new Draw(scene, camera, viewportRect, layer));
	}

}
