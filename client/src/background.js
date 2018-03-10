import { UpdateController } from './update';
import { Color, OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, ShaderMaterial, Math as ThreeMath, Vector2 as ThreeVector2 } from 'three';
import { GetElementSize, AppendAttribute, GetWindowSize } from './util.js';
import { Vector2 } from './vector.js';
import { Color } from 'three';
import { RandomRange, GetElementRect } from './util.js';
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
uniform float aspect;
varying vec2 texCoord;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
	vec2 st = texCoord.xy*aspect;
	vec2 pos = vec2(st*20.0);
	float n = snoise(pos);

	float centreDistance = distance(vec2(0.5, 0.5), texCoord);
	float invertedDistance = pow(1.0-centreDistance, fallOffFactor);
	invertedDistance-=n/125.0;
	//Inverse Square law
	float intensity = strength / 4.0*3.14159265359*pow(invertedDistance, 2.0);
	vec3 resultantColor = lightColor*intensity;
	gl_FragColor = vec4(resultantColor, 1);
	//gl_FragColor = vec4(vec3(n), 1);
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
			aspect: { value: 1 },
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

		let windowSize = GetWindowSize();
		this._uniforms.aspect.value = windowSize.x/windowSize.y;
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
