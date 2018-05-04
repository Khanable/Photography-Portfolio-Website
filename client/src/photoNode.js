import { NavNode } from './nav.js';
import { default as PhotoViewHtml } from './photo.html';
import { Vector2 } from './vector.js';
import './photo.css';
import { ImageGL, Resize, GetPhotoClassUrl } from './image.js';
import { Controller } from './main.js'
import { RemoveAllChildren } from './util.js';

export class PhotoNode extends NavNode {
	constructor(location, url, photoUrl, imageTransitionTime, loadingIndicatorTransitionTime, loadingIndicatorFactory) {
		super(location, PhotoViewHtml, url);
		this._photoUrl = photoUrl;
		this._subscriptions = [];
		this._domMain = null;
		this._imageGL = null;
		this._imageTransitionTime = imageTransitionTime;
		this._loadingIndicatorTime = loadingIndicatorTransitionTime;
		this._loadingIndicatorFactory = loadingIndicatorFactory;
	}

	onLoad(domNode) {
		super.onLoad(domNode);
		this._domMain = domNode.querySelector('#photoContainer');
		this._imageGL = new ImageGL(Controller.navController, GetPhotoClassUrl(this._domMain, this._photoUrl), this._imageTransitionTime, this._loadingIndicatorTime, this._loadingIndicatorFactory);
		this._imageGL.loadedSubject.subscribe( () => {
			this._imageGL.domRoot = this._domMain;
		});
	}

	onResize() {
		super.onResize();
		this._imageGL.resize();
	}

	onUnload() {
		this._imageGL.unload();
	}

	onDestroy() {
		super.onDestroy();
		this._subscriptions.forEach( e => e.unsubscribe() );
		this._imageGL.destroy();
		this._imageGL = null;
	}

}
