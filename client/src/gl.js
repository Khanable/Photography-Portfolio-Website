import { UpdateController } from './update';
import { Color, WebGLRenderer, ShaderMaterial, WebGLRenderTarget, MeshBasicMaterial, PlaneBufferGeometry, Mesh, Scene, OrthographicCamera, Vector4 as ThreeVector4 } from 'three';
import { AppendAttribute, GetWindowSize } from './util.js';
import * as Detector from 'three/examples/js/Detector.js';

const Vertex = `
	varying vec2 texCoord;
	uniform vec4 rect;

	void main() {
		texCoord = uv;
		//Only if rect < 0 or > canvas size to this, will need canvas resolution too.
		vec2 pos = vec2(position.x-rect.x, position.y-rect.y);
		gl_Position = projectionMatrix * vec4( pos, 0, 1.0 );
	}
`;
const Fragment = `
	uniform sampler2D tex;
	varying vec2 texCoord;

	void main() {
		gl_FragColor = texture2D(tex, texCoord);
	}
`;

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

		this._lowFrameRateSubscription = UpdateController.frameRateLowSubject.subscribe( e => {
			if ( e ) {
				this._lowFrameRateSubscription.unsubscribe();
				this._loadFallback();
			}
		});

		if ( this._webGLSupport ) {
			this._camera = new OrthographicCamera( -1, 1, 1, -1, 0, 1 );
			let geometry = new PlaneBufferGeometry(1, 1);

			this._originalTexture = new WebGLRenderTarget();

			this._adjustmentTexture = new WebGLRenderTarget();
			this._adjustmentUniforms = {
				texture: { value: null },
				rect: { value: null },
			};
			this._adjustmentScene = new Scene();
			this._adjustmentMaterial = new ShaderMaterial({
			 	uniforms: this._adjustmentUniforms,
				vertexShader: Vertex,
				fragmentShader: Fragment,
			});
			this._adjustmentMesh = new Mesh(geometry, this._adjustmentMaterial);
			this._adjustmentScene.add(this._adjustmentMesh);

			this._compositionTexture = new WebGLRenderTarget();
			this._compositionScene = new Scene();
			this._compositionMaterial = new MeshBasicMaterial({map: this._adjustmentTexture.texture});
			this._compositionMesh = new Mesh(geometry, this._compositionMaterial);
			this._compositionScene.add(this._compositionMesh);

			this._renderer = new WebGLRenderer( { alpha: true, depth: false, stencilBuffer: false } );
			this._renderer.setPixelRatio(window.devicePixelRatio);
			this._renderer.autoClear = false;
			this._renderer.sortObjects = false;

			this._draws = [];

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
			this._draws = null;
			window.removeEventListener('resize', this._resizeEventHook);
			this._renderSubscription.unsubscribe();
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
			this._renderer.render(e.scene, e.camera, this._originalTexture, true);

			this._adjustmentUniforms.texture.value = this._originalTexture.texture;
			let rect = e.viewportRect;
			this._adjustmentUniforms.rect.value = new ThreeVector4(rect.x, rect.y, rect.w, rect.h);
			this._renderer.render(this._adjustmentScene, this._camera, this._adjustmentTexture, true);
			this._adjustmentUniforms.texture.value = null;

			//this._renderer.setScissor();
			//this._renderer.setViewport();
			this._compositionMaterial.map = this._adjustmentTexture.texture;
			this._renderer.render(this._compositionScene, this._camera, this._compositionTexture);
		}
		//this._renderer.render(this._compositionScene, this._camera, this._compositionTexture);
	}

	_getViewFustrum() {
		let windowSize = GetWindowSize();
		let aspect = windowSize.x < windowSize.y ? windowSize.x/windowSize.y : windowSize.y/windowSize.x;
		let rtn = {};
		aspect/=2;

		rtn.left = -aspect;
		rtn.right = aspect;
		rtn.top = 0.5;
		rtn.bottom = -0.5;

		if ( windowSize.x > windowSize.y ) {
			let lTemp = rtn.left;
			let rTemp = rtn.right;
			rtn.left = rtn.bottom;
			rtn.right = rtn.top;
			rtn.bottom = lTemp;
			rtn.top = rTemp;
		}

		return Object.freeze(rtn);
	}

	_resize() {
		if ( this._renderer.domElement.parentNode != undefined ) {
			let size = GetWindowSize();
			let fustrum = this._getViewFustrum();
			this._camera.left = fustrum.left;
			this._camera.right = fustrum.right;
			this._camera.top = fustrum.top;
			this._camera.bottom = fustrum.bottom;
			this._camera.updateProjectionMatrix();
			this._renderer.setSize(size.x, size.y);
			this._originalTexture.setSize(size.x, size.y);
			this._adjustmentTexture.setSize(size.x, size.y);
			AppendAttribute(this._renderer.domElement, 'style', 'position:absolute;');
		}
	}

	draw(scene, camera, viewportRect, layer) {
		if ( this._webGLSupport ) {
			this._draws.push(new Draw(scene, camera, viewportRect, layer));
		}
		else {
			throw new Error('WebGL not supported, or fallback loaded');
		}
	}

	get webGLSupport() {
		return this._webGLSupport;
	}
}

export const GL = new GLRenderer();
