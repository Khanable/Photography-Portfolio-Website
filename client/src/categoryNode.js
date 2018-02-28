import { NavNode } from './nav.js';
import { LoadHtml, GetElementSize } from './util.js';
import * as CategoryHtml from './category.html';
import './category.css';
import { GetMatchingPhotoClassSize, GetPhotoUrl, Resize } from './image.js';
import { Vector2 } from './vector.js';
import './util.js';
import { Controller } from './main.js'

const SelectorCell = '.cell';
const SelectorRow = '.row';
const SelectorCategory = '#categoryMain';
const SelectorText = '#text';

export class CategoryNode extends NavNode {
	constructor(location, url, numPerRow) {
		super(location, '<div id=categoryHost><div id='+SelectorCategory.slice(1)+'></div></div>', url);
		this._photoUrls = Array.from(arguments).slice(3);
		this._subscriptions = [];
		this._images = null;
		this._domMain = null;
		this._numPerRow = numPerRow;

		let categoryDom = LoadHtml(CategoryHtml);
		this._domCell = categoryDom.querySelector(SelectorCell);
		this._domRow = categoryDom.querySelector(SelectorRow);
	}	

	_completeLoad(baseCellSize) {
		let sizes = this._images.map( e => e.imageSize );
		sizes.push(baseCellSize);
		let ySizes = sizes.map( e => e.y ).sort( (a, b) => b-a );
		let cellSizeY = ySizes.pop();

		let numRows = Math.ceil(this._photoUrls.length/this._numPerRow);
		for( let i = 0; i < numRows; i++ ) {
			let curRow = this._domRow.cloneNode(true);
			curRow.setAttribute('style', 'height: {0}px;'.format(cellSizeY));
			this._domMain.appendChild(curRow);
			for ( let j = 0; j < this._numPerRow; j++ ) {
				let curIndex = i*this._numPerRow+j;
				if ( curIndex < this._images.length ) {
					let curCell = this._domCell.cloneNode(true);
					curRow.appendChild(curCell);
					let image = this._images[curIndex];
					image.setParent(curCell);
				}
				else {
					break;
				}
			}
		}
	}

	_loadView() {
		this._images = [];

		let viewSize = GetElementSize(this._domMain);
		let baseCellSize = viewSize.div(this._photoUrls.length/this._numPerRow);

		//Adjust the Cell size to fit the smallest dimension of the images.
		for( let url of this._photoUrls ) {
			let photoClass = GetMatchingPhotoClassSize(baseCellSize);
			//let image = new ImageGL(Controller.navController, GetPhotoUrl(url, photoClass));
			//this._images.push(image);
			//this._subscriptions.push(image.loaded.subscribe( () => {
			//	if ( this._images.every( e => e.isLoaded ) ) {
			//		this._completeLoad(baseCellSize);
			//	}
			//}));
		}
	}

	_loadGL() {
		this._subscriptions.push(this._img.loaded.subscribe( () => {
		}));
	}

	onLoad(domNode) {
		super.onLoad(domNode);

		this._domMain = domNode.querySelector(SelectorCategory);

		this._setLoading();
		this._loadView();
	}

	onResize(domNode) {
		super.onResize(domNode);

		this._setLoading();
		this._loadView();
	}

	_setLoading() {
		this._domMain.innerHTML = '';
		//this._domMain.innerHTML = '<label style="color:white;">Loading</label>';
	}

	onUnload(domNode) {
		super.onUnload(domNode);
		this._images.forEach( e => e.delete() );
		this._subscriptions.forEach( e => e.unsubscribe() );
	}
}
