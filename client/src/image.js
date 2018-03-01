import { GLBase } from './gl.js';
import { Color, TextureLoader, LinearFilter } from 'three';
import { Subject } from 'rxjs';
import { Vector2 } from './vector';
import { Rect } from './rect.js';
import './util.js'
import { GetElementSize, GetElementRect } from './util.js';
import { GL } from './gl.js';

const PhotoNameFormat = '{0}_{1}.{2}';
const PhotoClasses = [
 2160, 1080, 720, 480
].sort( (a,b) => b-a );
export const GetPhotoClassUrl = function(domElement, url) {
	let windowSize = GetElementSize(domElement);
	let photoClass = GetMatchingPhotoClassSize(windowSize);
	return GetPhotoUrl(url, photoClass);
}

export const GetMatchingPhotoClassSize = function(containerSize) {
	let shortWindowSize = containerSize.x > containerSize.y ? containerSize.y : containerSize.x;
	let applicableClasses = PhotoClasses.filter( e => e >= shortWindowSize );
	let photoClass = applicableClasses[applicableClasses.length-1];
	if ( photoClass == undefined ) {
		photoClass = PhotoClasses[0];
	}
	return photoClass;
}

export const GetPhotoUrl = function(url, photoClass) {
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

export const Resize = function(containerRect, elementSize) {
	let containerSize = containerRect.size;
	let containerAspect = containerSize.x/containerSize.y;
	let elementAspect = elementSize.x/elementSize.y;
	let ratioV = containerSize.divv(elementSize);
	let scaleFactor = containerAspect > elementAspect ? ratioV.y : ratioV.x
	let fitSize = elementSize.mul(scaleFactor);
	let fitPos = containerRect.pos;
	fitPos = new Vector2(fitPos.x+containerSize.x/2-fitSize.x/2, fitPos.y+containerSize.y/2-fitSize.y/2);
	return new Rect(fitPos.x, fitPos.y, fitSize.x, fitSize.y);
}

export class ImageGL extends GLBase {
	constructor(domRoot, navController, url) {
		let uniforms = {
			saturation: { value: Settings.saturation },
			tex: { value: null },
		};

		super(domRoot, uniforms, ImageGLVertexShader, ImageGLFragmentShader);
		this._loaded = false;
		this._loadedSubject = new Subject();

		this._subscriptions.push(navController.transitioning.subscribe( () => {
			this._uniforms.saturation.value = Settings.saturation;
		}));
		this._subscriptions.push(navController.stoppedTransitioning.subscribe( () => {
			this._uniforms.saturation.value = FullSaturation;
		}));

		this._loader = new TextureLoader();
		this._loader.load(url, (texture) => {
			this._uniforms.tex.value = texture;
			texture.minFilter = LinearFilter;
			this._loaded = true;
			this._loadedSubject.next();
		});
	}

	_update(dt) {
		super._update(dt);
		if ( this._loaded && this._domRoot != null) {
			let containerRect = GetElementRect(this._domRoot)
			let img = this._uniforms.tex.value.image;
			let imgSize = new Vector2(img.width, img.height);
			let rect = Resize(containerRect, imgSize);
			GL.draw(this._scene, this._camera, rect, 100);
		}
	}

	get imageSize() {
		if ( this._loaded ) {
			let tex = this._uniforms.tex.value.image;
			return new Vector2(tex.width, tex.height);
		}
		else {
			throw new Error('Image not loaded yet');
		}
	}

	get loadedSubject() {
		return this._loadedSubject;
	}

	get isLoaded() {
		return this._loaded;
	}

}
