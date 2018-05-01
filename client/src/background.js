import { UpdateController } from './update';
import { MeshBasicMaterial, Color, OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, ShaderMaterial, Math as ThreeMath, Vector2 as ThreeVector2, Vector3 as ThreeVector3 } from 'three';
import { GetElementSize, AppendAttribute, GetWindowSize } from './util.js';
import { Vector2 } from './vector.js';
import { RandomRange, GetElementRect } from './util.js';
import { GL } from './gl.js';
import './util.js';

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
const vec3 lightColor = vec3({0}, {1}, {2});
const float fallOffFactor = {3};

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
	lightColor: new ThreeVector3(1, 0.839, 0.667),
	fallOffFactor: 3.0,
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
		this._firstLoadState = FirstLoadState.Complete;
		this._t = 0;
		this._nFirstLoadState = 0;
		this._finishFirstLoadCallback = null;
		this._webGLSupport = GL.webGLSupport;
		this._loadedWebGL = false;
		this._fallback = false;

		UpdateController.updateSubject.subscribe( this._update.bind(this) );
		window.addEventListener('resize', this._resize.bind(this));
		navController.animatedLoadCallback = e => {
			this._firstLoadState = FirstLoadState.Start;
			this._finishFirstLoadCallback = e.transitionSlide;
		};

		if ( this._webGLSupport ) {
			this._loadedWebGL = true;
			this._uniforms = {
				strength: { value: Settings.strength },
				fallOffFactor: { value: Settings.fallOffFactor },
				resolution: { value: new ThreeVector2(1, 1) },
			};
			let material = new ShaderMaterial( {
				uniforms: this._uniforms,
				vertexShader: Vertex,
				fragmentShader: Fragment.format(Settings.lightColor.x, Settings.lightColor.y, Settings.lightColor.z, Settings.fallOffFactor.toFixed(1)),
			} );
			material = new MeshBasicMaterial();
			let geometry = new PlaneBufferGeometry(1, 1);
			this._mesh = new Mesh(geometry, material);
			GL.add(this._mesh);
		}
		else {
			this._loadFallbackDom();
		}

		this._lowFrameRateSubscription = UpdateController.frameRateLowSubject.subscribe( e => {
			if ( e ) {
				this._lowFrameRateSubscription.unsubscribe();
				this._loadFallbackDom();
			}
		});

		this._resize();
	}

	_loadFallbackDom() {
		if ( !this._fallback ) {
			this._fallback = true;
			this._webGLSupport = false;
			if ( this._loadedWebGL ) {
				this._mesh = null;
				this._uniforms = null;
			}
			let backgroundDom = document.createElement('div');
			let intervals = [];
			let lightColor = [Settings.lightColor.x, Settings.lightColor.y, Settings.lightColor.z];
			let strength = Settings.strength;
			let fallOffFactor = Settings.fallOffFactor;
			//Overshoot the % to get the correct gradient.
			for(let i = 0; i < 190; i++) {
				let radius = i/190;
				let invertedDistance = Math.pow(1-radius, fallOffFactor);
				let intensity = strength / 4.0*3.14159265359*Math.pow(invertedDistance, 2.0);
				let data = lightColor.map(e => Math.round(e*intensity*256));
				data.push(i);
				intervals.push(String.prototype.format.apply('rgb({0}, {1}, {2}) {3}%', data));
			}
			backgroundDom.setAttribute('style', 'width:100%;height:100%;background:radial-gradient(circle, {0});'.format(intervals.join(',')));

			this._domRoot.appendChild(backgroundDom);
		}
	}

	_resize() {
		if ( this._webGLSupport ) {
			let windowSize = GetWindowSize();
			this._mesh.position.set(0, 0, 0);
			this._mesh.scale.set(0.25, 0.25, 1);
			this._uniforms.resolution.value = new ThreeVector2(windowSize.x, windowSize.y);
		}
	}

	_update(dt) {
		this._t+=dt;

		if ( this._webGLSupport ) {
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
		}
		else {
			if ( this._firstLoadState == FirstLoadState.Start ) {
				this._finishFirstLoadCallback();
				this._firstLoadState = FirstLoadState.Complete;
			}
		}
	}

}
