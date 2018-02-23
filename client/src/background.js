import { UpdateController } from './update';
import { OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, WebGLRenderer } from 'three';

const Vertex = '';
const Fragment = '';

class Background {
	constructor(rootDom) {
		this._camera = new OrthoGraphicCamera( -1, 1, 1, -1, 0, 1 );
		this._scene = Scene();
		this._renderer = WebGLRenderer();
		this._renderer.setPixelRatio(window.devicePixelRatio);
		//??
		this._uniforms = {
			time: { value: 1 }
		};

		let geometry = new PlaneBufferGeometry(2, 2);
		let material = new ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: Vertex;
			fragmentShader: Fragment;
		} );
		let mesh = new Mesh(geometry, material);

		this._scene.add(mesh);

		UpdateController.renderSubject.subscibe(this._update.bind(this));

		this._rootDom.appendChild(this._renderer.domElement);
		window.addEventListener('resize', this._resize.bind(this) );
		this._resize();
	}

	_resize() {
		this._renderer.setSize(window.innerWidth, window.innerHeight);
	}

	_update(dt) {
		this._uniforms.time.value+=dt;
		this._renderer.render(this._scene, this._camera);
	}
}

