import { UpdateController } from './update';
import { Color, OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, ShaderMaterial, Math as ThreeMath } from 'three';
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

uniform float strength;
uniform vec3 lightColor;
uniform float fallOffFactor;

varying vec2 texCoord;

void main() {
	float centreDistance = distance(vec2(0.5, 0.5), texCoord);
	float invertedDistance = pow(1.0-centreDistance, fallOffFactor);
	//Inverse Square law
	float intensity = strength / 4.0*3.14159265359*pow(invertedDistance, 2.0);
	vec3 resultantColor = lightColor*intensity;
	gl_FragColor = vec4(resultantColor, 1);
}
`;


const Settings = {
	lightColor: new Color(1, 0.839, 0.667),
	fallOffFactor: 3.0,
	strength: 2.5,
	firstLoadDarkTime: 0.75,
	firstLoadWarmTime: 3,
}

const FirstLoadState = {
	Complete: 0,
	Start: 1,
	Dark: 2,
	Warm: 3,
}


export class Background {
	constructor(navController, domRoot) {

		this._domRoot = domRoot;
		this._camera = new OrthographicCamera( -1, 1, 1, -1, 0, 1 );
		this._scene = new Scene();
		this._mesh = null;
		this._firstLoadState = FirstLoadState.Complete;
		this._t = 0;
		this._nFirstLoadState = 0;
		this._finishFirstLoadCallback = null;

		this._uniforms = {
			lightColor: { value: Settings.lightColor },
			strength: { value: Settings.strength },
			fallOffFactor: { value: Settings.fallOffFactor },
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
		navController.animatedLoadCallback = e => {
			this._firstLoadState = FirstLoadState.Start;
			this._finishFirstLoadCallback = e.transitionSlide;
		};
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

		if ( this._firstLoadState == FirstLoadState.Start) {
			this._firstLoadState = FirstLoadState.Dark;
			this._nFirstLoadState = this._t+Settings.firstLoadDarkTime;
			this._uniforms.strength.value = 0;
		}

		if ( this._firstLoadState == FirstLoadState.Dark && this._t > this._nFirstLoadState ) {
			this._firstLoadState = FirstLoadState.Warm;
			this._nFirstLoadState = this._t+Settings.firstLoadWarmTime;
		}

		if ( this._firstLoadState == FirstLoadState.Warm ) {
			if ( this._t <= this._nFirstLoadState ) {
				let start = this._nFirstLoadState-Settings.firstLoadWarmTime;
				let t = this._t-start;
				this._uniforms.strength.value = ThreeMath.lerp(0, Settings.strength, t/Settings.firstLoadWarmTime);
			}
			else {
				this._uniforms.strength.value = Settings.strength;
				this._finishFirstLoadCallback();
				this._firstLoadState = FirstLoadState.Complete;
			}
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
