import { GLBase } from './gl.js';
import { Subject } from 'rxjs';
import { Rect } from './rect.js';
import './util.js'
import { RemoveAllChildren, GetElementSize, GetElementRect, AppendAttribute, GetWindowSize } from './util.js';
import { GL } from './gl.js';
import { UpdateController } from './update.js';
import { Color, TextureLoader, LinearFilter, OrthographicCamera, Scene, PlaneBufferGeometry, Mesh, ShaderMaterial, Math as ThreeMath } from 'three';
import { MeshBasicMaterial } from 'three';
import { Vector2 } from './vector.js';

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

uniform float strength;
uniform sampler2D tex;
varying vec2 texCoord;

void main() {
	vec4 texColor = texture2D(tex, texCoord);
	float mag = length(vec3(texColor));
	float negColorV = 1.0 - mag;
	vec4 negColor = vec4(-negColorV, -negColorV, -negColorV, negColorV);
	gl_FragColor = mix(negColor, texColor, strength);
}
`;

export const Resize = function(containerRect, elementSize) {
	let containerSize = containerRect.size;
	let containerAspect = containerSize.x/containerSize.y;
	let elementAspect = elementSize.x/elementSize.y;
	let ratioV = containerSize.div(elementSize);
	let scaleFactor = containerAspect > elementAspect ? ratioV.y : ratioV.x
	let fitSize = elementSize.mul(scaleFactor);
	let fitPos = containerRect.pos;
	fitPos = new Vector2(fitPos.x+containerSize.x/2-fitSize.x/2, fitPos.y+containerSize.y/2-fitSize.y/2);
	return new Rect(fitPos.x, fitPos.y, fitSize.x, fitSize.y);
}

const ImageGLState = {
	Created: 4,
	TransitionIn: 0,
	TransitionInComplete: 1,
	TransitionOut: 2,
	TransitionOutComplete: 3,
}

export class ImageGL {
	constructor(domRoot, navController, url, imageStateTransitionTime, loadingIndicatorTime, loadingIndicatorFactory) {
		this._domRoot = domRoot;
		this._fallBackImg = null;
		this._loaded = false;
		this._loadingIndicator = loadingIndicatorFactory.new();
		this._loadingIndicatorTime = loadingIndicatorTime;
		this._imageStateTransitionTime = imageStateTransitionTime;
		this._loadedSubject = new Subject();
		this._transitioning = false;
		this._curState = ImageGLState.Created;
		this._t = 0;
		this._nStateEnd = 0;
		this._stateTransitionOutStrengthStart = 0;
		this._subscriptions = [];
		this._url = url;
		this._webGLSupport = GL.webGLSupport;
		this._fallback = false;
		this._loadedWebGL = false;
		this._loader = new TextureLoader();

		this._loader.load(url, (texture) => {
			this._markLoaded(texture.image);
			if ( this._webGLSupport ) {
				this._uniforms.tex.value = texture;
				texture.minFilter = LinearFilter;
			}
			else {
				this._loadImageFallBack();
			}
		});

		this._subscriptions.push(UpdateController.updateSubject.subscribe( this._update.bind(this) ));
		this._subscriptions.push(navController.transitioning.subscribe( state => {
			this._transitioning = state;
		}));
		this._updateDomLoadingIndicator();

		this._lowFrameRateSubscription = UpdateController.frameRateLowSubject.subscribe( e => {
			if ( e ) {
				this._lowFrameRateSubscription.unsubscribe();
				this._loadImageFallBack();
			}
		});
		this._subscriptions.push(this._lowFrameRateSubscription);

		if ( this._webGLSupport ) {
			this._loadedWebGL = true;
			this._mesh = null;
			this._uniforms = {
				strength: { value: 0 },
				tex: { value: null },
			};
			let material = new ShaderMaterial( {
				uniforms: this._uniforms,
				vertexShader: ImageGLVertexShader,
				fragmentShader: ImageGLFragmentShader,
			} );
			material.transparent = true;
			let geometry = new PlaneBufferGeometry(1, 1);
			this._mesh = new Mesh(geometry, material);
			//GL.add(this._mesh);
		}
	}

	_markLoaded(image) {
		this._loaded = true;
		this._fallBackImg = image;
		this._loadedSubject.next();
		this._updateDomLoadingIndicator();
	}

	_resizeAndAppendImageFallBack(img) {
		this._resizeFallbackImage(img);
		this._domRoot.appendChild(img);
	}

	_loadImageFallBack() {
		if ( !this._fallback && this._loaded ) {
			this._fallback = true;
			this._webGLSupport = false;
			if ( this._loadedWebGL ) {
				this._mesh = null;
				this._uniforms = null;
				this._loader = null
			}
			if ( this._domRoot != null ) {
				this._resizeAndAppendImageFallBack(this._fallBackImg);
			}
		}
	}
	_resizeFallbackImage(img) {
		let displayRect = GetElementRect(this._domRoot);
		let naturalSize = new Vector2(img.naturalWidth, img.naturalHeight);
		let imgSize = Resize(displayRect, naturalSize);
		img.width = imgSize.w;
		img.height = imgSize.h;
	}

	_setStateTransitionIn() {
		this._curState = ImageGLState.TransitionIn;
		this._nStateEnd = this._t+this._imageStateTransitionTime;
	}
	_setStateTrasitionInComplete() {
		this._uniforms.strength.value = 1;
		this._curState = ImageGLState.TransitionInComplete;
	}
	_setStateTransitionOut() {
		this._curState = ImageGLState.TransitionOut;
		this._nStateEnd = this._t+this._imageStateTransitionTime;
		this._stateTransitionOutStrengthStart = this._uniforms.strength.value;
	}
	_setStateTransitionOutComplete() {
		this._uniforms.strength.value = 0;
		this._curState = ImageGLState.TransitionOutComplete;
	}

	_update(dt) {
		this._t+=dt;

		if ( this._domRoot != null ) {
			if ( this._loaded && this._webGLSupport ) {
				if ( this._curState == ImageGLState.Created && !this._transitioning) {
					this._setStateTransitionIn();
				}

				if ( this._curState == ImageGLState.TransitionIn ) {
					if ( this._t <= this._nStateEnd ) {
						let start = this._nStateEnd-this._imageStateTransitionTime;
						let t = this._t - start;
						this._uniforms.strength.value = ThreeMath.lerp(0, 1, t/this._imageStateTransitionTime);
					}
					else {
						this._setStateTrasitionInComplete();
					}
				}

				if ( this._curState == ImageGLState.TransitionOut ) {
					if ( this._t <= this._nStateEnd ) {
						let start = this._nStateEnd-this._imageStateTransitionTime;
						let t = this._t - start;
						this._uniforms.strength.value = ThreeMath.lerp(this._stateTransitionOutStrengthStart, 0, t/this._imageStateTransitionTime);
					}
					else {
						this._setStateTransitionOutComplete();
					}
				}

				let containerRect = GetElementRect(this._domRoot)
				let img = this._uniforms.tex.value.image;
				let imgSize = new Vector2(img.width, img.height);
				let rect = Resize(containerRect, imgSize);
			}
			else {
				if ( this._t >= this._nStateEnd ) {
					this._nStateEnd = this._t+this._loadingIndicatorTime;
				}
				let start = this._nStateEnd - this._loadingIndicatorTime;
				let t = this._t - start;
				this._loadingIndicator.update(t/this._loadingIndicatorTime);
			}

		}
	}

	resize() {
		if ( this._domRoot != null ) {
			if ( this._webGLSupport ) {
				this._setStateTrasitionInComplete();
			}
			else {
				this._resizeFallbackImage(this._fallBackImg);
			}

			if ( !this._loaded ) {
				this._loadingIndicator.resize();
			}
		}
	}

	unload() {
		if ( this._webGLSupport ) {
			this._setStateTransitionOut();
		}
	}

	destroy() {
		this._loaded = false;
		this._subscriptions.forEach( e => e.unsubscribe() );
	}

	_updateDomLoadingIndicator() {
		if ( this._domRoot != null ) {
			let indicatorParent = this._loadingIndicator.domNode.parentNode;
			if ( this._loaded && indicatorParent != null ) {
				this._domRoot.removeChild(this._loadingIndicator.domNode);
			}
			else if ( !this._loaded ){
				this._domRoot.appendChild(this._loadingIndicator.domNode);
				this._loadingIndicator.resize();
			}
		}
	}
	set domRoot(v) {
		this._domRoot = v;
		if ( !this._webGLSupport ) {
			this._resizeAndAppendImageFallBack(this._fallBackImg);
		}
		this._updateDomLoadingIndicator();
	}

	get imageSize() {
		if ( this._loaded ) {
			let img = this._fallBackImg;
			return new Vector2(img.naturalWidth, img.naturalHeight);
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
