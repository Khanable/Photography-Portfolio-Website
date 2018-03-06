import { UpdateController } from './update';
import { Color, OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, ShaderMaterial } from 'three';
import { GetElementSize, AppendAttribute, GetWindowSize } from './util.js';
import { Vector2 } from './vector.js';
import { Color } from 'three';
import { RandomRange, GetElementRect } from './util.js';
import { Vector2 } from './vector.js';
import { GL, GLBase } from './gl.js';

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
	float invertedDistance = 1.0-centreDistance;
	vec3 resultantColor = lightColor*pow(invertedDistance, fallOff)*focalLength;
	gl_FragColor = vec4(resultantColor, 1);
}
`;


const Settings = {
	lightColor: new Color(1, 0.839, 0.667),
	fallOff: 4,
	focalLength: 2.5,
	flickerTime: new Vector2(0.16, 0.32),
	flickerResolveTime: new Vector2(6, 12),
	flickerFallOff: new Vector2(3, 5),
}


export class Background {
	constructor(navController, domRoot) {

		this._domRoot = domRoot;
		this._camera = new OrthographicCamera( -1, 1, 1, -1, 0, 1 );
		this._scene = new Scene();
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
		let material = new ShaderMaterial( {
			uniforms: this._uniforms,
			vertexShader: Vertex,
			fragmentShader: Fragment,
		} );
		let geometry = new PlaneBufferGeometry(1, 1);
		this._mesh = new Mesh(geometry, material);
		this._scene.add(this._mesh);

		UpdateController.updateSubject.subscribe( this._update.bind(this) );
		window.addEventListener('resize', this._resize.bind(this));
		this._resize();
	}

	_resize() {
		let fustrum = this._getViewFustrum();
		this._camera.left = fustrum.left;
		this._camera.right = fustrum.right;
		this._camera.top = fustrum.top;
		this._camera.bottom = fustrum.bottom;
		this._camera.updateProjectionMatrix();
	}

	_getViewFustrum() {

		//let aspect = elementSize.x/elementSize.y;
		//let xScale = aspect > 1 ? elementSize.x*aspect : elementSize.x;
		//let yScale = aspect > 1 ? elementSize.y : elementSize.y*aspect;

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
		}

		GL.draw(this._scene, this._camera, GetElementRect(this._domRoot), 0);
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
