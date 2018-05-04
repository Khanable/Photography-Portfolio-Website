import { FallbackNotifier } from './fallbackNotifier.js';
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
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
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
		this._img = null;
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
		this._lastFallback = false;
		this._firstLoad = false;
		this._loader = new TextureLoader();

		this._loader.load(url, (texture) => {
			this._markLoaded(texture.image);
			if ( !this._lastFallback ) {
				this._loadWebGL();
				this._uniforms.tex.value = texture;
				texture.minFilter = LinearFilter;
			}
			else {
				this._loadImageFallBack();
			}
			this.resize();
		});

		this._subscriptions.push(UpdateController.updateSubject.subscribe( this._update.bind(this) ));
		this._subscriptions.push(navController.transitioning.subscribe( state => {
			this._transitioning = state;
		}));
		this._updateDomLoadingIndicator();

		FallbackNotifier.fallbackSubject.subscribe( e => {
			if ( this._loaded ) {
				this._cleanup();
				if ( e ) {
					this._loadImageFallBack();
				}
				else {
					this._loadWebGL();
				}
				this._firstLoad = true;
			}
			else {
				this._lastFallback = e;
			}
		});

	}

	_cleanup() {
		if ( this._firstLoad ) {
			if ( this._lastFallback ) {
				this._domRoot.removeChild(this._img);
			}
			else {
				this._transform = null;
				this._uniforms = null;
			}
		}
	}

	_loadWebGL() {
		this._lastFallback = false;

		this._transform = null;
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
		let mesh = new Mesh(geometry, material);
		this._transform = GL.add(mesh);
	}

	_markLoaded(image) {
		this._loaded = true;
		this._img = image;
		this._loadedSubject.next();
		this._updateDomLoadingIndicator();
	}

	_appendImageFallBack() {
		this._domRoot.appendChild(this._img);
	}

	_loadImageFallBack() {
		if ( !this._lastFallback && this._loaded ) {
			this._lastFallback = true;
			if ( this._domRoot != null ) {
				this._appendImageFallBack();
			}
		}
	}
	_resizeImage() {
		let displayRect = GetElementRect(this._domRoot);
		let naturalSize = new Vector2(this._img.naturalWidth, this._img.naturalHeight);
		let imgSize = Resize(displayRect, naturalSize);
		if ( !this._lastFallback ) {
			this._transform.scale.set(imgSize.w, imgSize.h, 1);
		}
		else {
			this._img.width = imgSize.w;
			this._img.height = imgSize.h;
		}
		return imgSize;
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
			if ( this._loaded && !this._lastFallback ) {
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

				let rect = this._resizeImage();
				this._transform.position.set(rect.x+rect.w/2, rect.y+rect.h/2, -10);
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
			if ( this._loaded ) {
				this._resizeImage();
			}
			else {
				this._loadingIndicator.resize();
			}
		}
	}

	unload() {
		if ( !this._lastFallback ) {
			this._setStateTransitionOut();
		}
	}

	destroy() {
		this._loaded = false;
		this._subscriptions.forEach( e => e.unsubscribe() );
		GL.remove(this._transform);
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
		this.resize();
		if ( this._lastFallback ) {
			this._appendImageFallBack();
		}
		this._updateDomLoadingIndicator();
	}

	get imageSize() {
		if ( this._loaded ) {
			let img = this._img;
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
