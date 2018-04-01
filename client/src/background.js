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

const float wallEffectNoiseDistanceFactor = 0.25;
const float wallEffectFactor = 1.0;
const vec3 lightColor = vec3(1, 0.839, 0.667);
const float fallOffFactor = 3.0;

uniform float strength;
uniform vec2 resolution;
varying vec2 texCoord;

//https://github.com/stegu/webgl-noise
vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}
vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}
vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}
// Classic Perlin noise
float cnoise(vec2 P)
{
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;

  vec4 i = permute(permute(ix) + iy);

  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
  vec4 gy = abs(gx) - 0.5 ;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;

  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);

  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
  g00 *= norm.x;  
  g01 *= norm.y;  
  g10 *= norm.z;  
  g11 *= norm.w;  

  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));

  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}


void main() {
	float aspect = resolution.x/resolution.y;
	float shortSide = resolution.x < resolution.y ? resolution.x : resolution.y;
	vec2 st = texCoord.xy*aspect;
	vec2 pos = st*wallEffectNoiseDistanceFactor*shortSide;
	float n = cnoise(pos);

	float centreDistance = distance(vec2(0.5, 0.5), texCoord);
	float invertedDistance = pow(1.0-centreDistance, fallOffFactor);
	//Inverse Square law
	//https://en.wikipedia.org/wiki/Inverse-square_law
	float intensity = strength / 4.0*3.14159265359*pow(invertedDistance, 2.0);
	//Adjust Intensity by noise
	intensity-=n*(wallEffectFactor/100.0);

	vec3 resultantColor = lightColor*intensity;
	gl_FragColor = vec4(resultantColor, 1);
}
`;


const Settings = {
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
			strength: { value: Settings.strength },
			fallOffFactor: { value: Settings.fallOffFactor },
			resolution: { value: new ThreeVector2(1, 1) },
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
		this._uniforms.resolution.value = new ThreeVector2(windowSize.x, windowSize.y);
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

}
