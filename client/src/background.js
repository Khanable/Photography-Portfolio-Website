import { UpdateController } from './update';
import { Color } from 'three';
import { RandomRange } from './util.js';
import { Vector2 } from './vector.js';
import { GLBase } from './gl.js';

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


export class Background extends GLBase {
	constructor(navController) {
		let uniforms = {
			lightColor: { value: Settings.lightColor },
			focalLength: { value: Settings.focalLength },
			fallOff: { value: Settings.fallOff },
		};

		super(uniforms, Vertex, Fragment);
		this._t = 0;
		this._tFlicker = 0;
		this._nFlickerTime = 0;
		this._nFlickerResolve = 0;
		this._nFlickerFallOffE = 0;
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

