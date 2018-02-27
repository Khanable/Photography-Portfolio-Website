import { GLBase } from './gl.js';
import { Color, TextureLoader } from 'three';
import { Subject } from 'rxjs';
import { Vector2 } from './vector';
import './util.js'
import { GetElementSize } from './util.js';

const PhotoNameFormat = '{0}_{1}.{2}';
const PhotoClasses = [
 2160, 1080, 720, 480
].sort( (a,b) => b-a );
export const GetPhotoClassUrl = function(domElement, url) {
	let windowSize = GetElementSize(domElement);
	let shortWindowSize = windowSize.x > windowSize.y ? windowSize.y : windowSize.x;
	let applicableClasses = PhotoClasses.filter( e => e >= shortWindowSize );
	let photoClass = applicableClasses[applicableClasses.length-1];
	if ( photoClass == undefined ) {
		photoClass = PhotoClasses[0];
	}

	let urlSplit = url.split('.');
	return PhotoNameFormat.format(urlSplit[0], photoClass.toString(), urlSplit[1]);
}


const ImageGLVertexShader = `
varying vec2 texCoord;
void main() {
	texCoord = uv;
	gl_Position = projectionMatrix * vec4( position, 1.0 );
}
`;
const ImageGLFragmentShader = `

uniform vec3 saturation;
uniform sampler2D tex;
varying vec2 texCoord;

void main() {
	gl_FragColor = texture2D(tex, texCoord)*vec4(saturation, 0);
}
`;

const Settings = {
	saturation: new Color(0.2, 0.2, 0.2),
}

const FullSaturation = new Color(1, 1, 1);

export const Resize = function(containerSize, elementSize) {
	let ratioV = containerSize.divv(elementSize);
	let ratio = elementSize.x > elementSize.y ? ratioV.x : ratioV.y;
	return elementSize.mul(ratio);
}

export class ImageGL extends GLBase {
	constructor(rootDom, navController, url) {
		let uniforms = {
			saturation: { value: Settings.saturation },
			tex: { value: null },
		};

		super(rootDom, uniforms, ImageGLVertexShader, ImageGLFragmentShader);
		this._loaded = false;
		this._loadedSubject = new Subject();
		this._navController = navController;
		this._subscriptions = [];
		this._subscriptions.push(navController.transitioning.subscribe( () => {
			this._uniforms.saturation.value = Settings.saturation;
		}));
		this._subscriptions.push(navController.stoppedTransitioning.subscribe( () => {
			this._uniforms.saturation.value = FullSaturation;
		}));

		this._loader = new TextureLoader();
		this._loader.load(url, (texture) => {
			this._uniforms.tex.value = texture;
			this._loaded = true;
			this._loadedSubject.next();
			this._resize();
		});
	}

	_update(dt) {
		if ( this._loaded ) {
			this._renderer.render(this._scene, this._camera);
		}
	}

	_getElementSize() {
		if ( this._loaded ) {
			let parentDom = this._renderer.domElement.parentNode;
			let img = this._uniforms.tex.value.image;
			let displayRect = parentDom.getBoundingClientRect();
			let displaySize = new Vector2(displayRect.width, displayRect.height);
			let naturalSize = new Vector2(img.width, img.height);
			return Resize(displaySize, naturalSize);
		}
		else {
			return Vector2.Zero;
		}
	}

	get loaded() {
		return this._loadedSubject;
	}

	delete() {
		this._subscriptions.forEach( e => e.unsubscribe() );
	}

}
