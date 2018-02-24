import { UpdateController } from './update';
import { OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, WebGLRenderer, ShaderMaterial } from 'three';

const Vertex = `
varying vec2 texCoord;
void main() {
	texCoord = uv;
	gl_Position = viewMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const Fragment = `
uniform float focusRadius;

varying vec2 texCoord;

void main() {
	vec4 color = vec4(1, 1, 1, 0);

	if ( distance(vec2(0.5, 0.5), texCoord) < focusRadius ) {
		color = vec4(0, 0, 0, 0);
	}

	gl_FragColor = color;
}
`;

export class Background {
	constructor(rootDom) {
		this._camera = new OrthographicCamera( -1, 1, 1, -1, 0, 1 );
		this._scene = new Scene();
		this._renderer = new WebGLRenderer();
		this._renderer.setPixelRatio(window.devicePixelRatio);
		//??
		this._uniforms = {
			time: { value: 1 },
			focusRadius: { value: 0.1 },

		};

		let geometry = new PlaneBufferGeometry(2, 2);
		let material = new ShaderMaterial( {
			uniforms: this._uniforms,
			vertexShader: Vertex,
			fragmentShader: Fragment,
		} );
		let mesh = new Mesh(geometry, material);

		this._scene.add(mesh);

		UpdateController.renderSubject.subscribe(this._update.bind(this));

		rootDom.appendChild(this._renderer.domElement);
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

