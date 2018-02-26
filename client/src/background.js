import { UpdateController } from './update';
import { OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, WebGLRenderer, ShaderMaterial, Color } from 'three';
import { GetWindowSize, RandomRange } from './util.js';
import { Vector2 } from './vector.js';

const Vertex = `
varying vec2 texCoord;
void main() {
	texCoord = uv;
	gl_Position = projectionMatrix * vec4( position, 1.0 );
}
`;
const Fragment = `

uniform float focalLength;
uniform vec3 lightColor;
uniform float fallOff;

varying vec2 texCoord;

void main() {
	float centreDistance = distance(vec2(0.5, 0.5), texCoord);
	vec3 resultantColor = lightColor*pow(centreDistance, fallOff)*focalLength;
	resultantColor = 1.0-resultantColor;

	gl_FragColor = vec4(resultantColor, 0);
}
`;


const Settings = {
	lightColor: new Color(1, 1, 1),
	fallOff: 2,
	focalLength: 3,
	flickerTime: new Vector2(1, 2),
	flickerResolveTime: new Vector2(1, 2),
	flickerFallOff: new Vector2(0, 2),
}


export class Background {
	constructor(rootDom) {
		let fustrum = this._getViewFustrum();
		this._camera = new OrthographicCamera( fustrum.left, fustrum.right, fustrum.top, fustrum.bottom, 0, 1 );
		this._scene = new Scene();
		this._renderer = new WebGLRenderer();
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._mesh = null;
		this._t = 0;
		this._tFlicker = 0;
		this._nFlickerTime = 0;
		this._nFlickerResolve = 0;
		this._nFlickerFallOffE = 0;

		this._uniforms = {
			lightColor: { value: Settings.lightColor },
			focalLength: { value: Settings.focalLength },
			fallOff: { value: Settings.fallOff },
		};


		let geometry = new PlaneBufferGeometry(1, 1);
		let material = new ShaderMaterial( {
			uniforms: this._uniforms,
			vertexShader: Vertex,
			fragmentShader: Fragment,
		});
		this._mesh = new Mesh(geometry, material);
		this._scene.add(this._mesh);

		UpdateController.renderSubject.subscribe(this._update.bind(this));
		window.addEventListener('resize', this._resize.bind(this) );
		rootDom.appendChild(this._renderer.domElement);
		this._resize();
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
		let windowSize = GetWindowSize();
		let fustrum = this._getViewFustrum();
		this._camera.left = fustrum.left;
		this._camera.right = fustrum.right;
		this._camera.top = fustrum.top;
		this._camera.bottom = fustrum.bottom;
		this._camera.updateProjectionMatrix();
		this._renderer.setSize(windowSize.x, windowSize.y);
	}

	_update(dt) {
		this._t+=dt;

		if ( this._t >= this._nFlickerTime && this._t < this._nFlickerResolve ) {
			let t = this._t - this._nFlickerTime;
			let e = this._nFlickerResolve - this._nFlickerTime;
			this._uniforms.fallOff.value = this._lerpParabola(t/e, Settings.fallOff, this._nFlickerFallOffE);
		}
		else if ( this._t >= this._nFlickerResolve ) {
			this._nFlickerTime = this._t+RandomRange(Settings.flickerTime.x, Settings.flickerTime.y);
			this._nFlickerResolve = this._nFlickerTime+RandomRange(Settings.flickerResolveTime.x, Settings.flickerResolveTime.y);
			this._nFlickerFallOffE = RandomRange(Settings.flickerFallOff.x, Settings.flickerFallOff.y);
			this._uniforms.fallOff.value = Settings.fallOff;
			
			console.log('Time: '+this._nFlickerTime);
			console.log('Resolve: '+this._nFlickerResolve);
			console.log('End: '+this._nFlickerFallOffE);
		}

		this._renderer.render(this._scene, this._camera);
	}

	_lerpParabola(t, s, e) {
		let p = Math.pow(t*2-1, 2);
		let r = Math.abs(e-s);
		let m = s < e ? s : e;
		if ( s < e ) {
			p*=-1;
			m += r;
		}
		return m+p*r;
	}

}

