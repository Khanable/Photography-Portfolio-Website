import { NavNode } from './nav.js';
import * as PhotoViewHtml from './photo.html';
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

	_loadGL() {
		this._imageGL = new ImageGL(this._domMain, Controller.navController, GetPhotoClassUrl(this._domMain, this._photoUrl), this._imageTransitionTime, this._loadingIndicatorTime, this._loadingIndicatorFactory);
	}

	_load() {
		let img = new Image();
		img.addEventListener('load', () => {
			RemoveAllChildren(this._domMain);

			let displayRect = this._domMain.getBoundingClientRect();
			let displaySize = new Vector2(displayRect.width, displayRect.height);
			let naturalSize = new Vector2(img.naturalWidth, img.naturalHeight);
			let imgSize = Resize(displaySize, naturalSize);
			img.width = imgSize.x;
			img.height = imgSize.y;
			this._domMain.appendChild(img);
		});
		img.src = GetPhotoClassUrl(this._domMain, this._photoUrl);
	}


	onLoad(domNode) {
		super.onLoad(domNode);
		this._domMain = domNode.querySelector('#photoContainer');

		this._loadGL();
	}

	onResize() {
		super.onResize();

		this._loadGL();
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
