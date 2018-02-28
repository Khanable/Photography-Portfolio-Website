import { UpdateController } from './update';
import { OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, WebGLRenderer, ShaderMaterial, MeshBasicMaterial } from 'three';
import { GetWindowSize } from './util.js';
import { Vector2 } from './vector.js';

export class GLBase {
	constructor(uniforms, vertexShader, fragmentShader) {
		this._renderer = new WebGLRenderer();
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._camera = new OrthographicCamera( -1, 1, 1, -1, 0, 1 );
		this._scene = new Scene();
		this._mesh = null;
		this._uniforms = uniforms;

		let material = new ShaderMaterial( {
			uniforms: this._uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		} );
		let geometry = new PlaneBufferGeometry(1, 1);
		this._mesh = new Mesh(geometry, material);
		this._scene.add(this._mesh);

		UpdateController.renderSubject.subscribe( (dt) => {
			if ( this._renderer.domElement.parentNode ) {
				this._update(dt);
			}
		});
		window.addEventListener('resize', this._resize.bind(this) );
	}

	setParent(domNode) {
		domNode.appendChild(this._renderer.domElement);
		this._resize();
	}

	_getViewFustrum() {
		let windowSize = this._getElementSize();
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

	_getElementSize() {
		let bounds = this._renderer.domElement.parentNode.getBoundingClientRect();
		return new Vector2(bounds.width, bounds.height);
	}

	_resize() {
		if ( this._renderer.domElement.parentNode ) {
			let windowSize = this._getElementSize();
			let fustrum = this._getViewFustrum();
			this._camera.left = fustrum.left;
			this._camera.right = fustrum.right;
			this._camera.top = fustrum.top;
			this._camera.bottom = fustrum.bottom;
			this._camera.updateProjectionMatrix();
			this._renderer.setSize(windowSize.x, windowSize.y);
		}
	}

	_update(dt) {
		throw new Error('Not Implemented');
	}
}

