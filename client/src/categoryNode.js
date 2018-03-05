import { NavNode } from './nav.js';
import { LoadHtml, GetElementSize } from './util.js';
import * as CategoryHtml from './category.html';
import './category.css';
import { ImageGL, GetMatchingPhotoClassSize, GetPhotoUrl, Resize } from './image.js';
import { Vector2 } from './vector.js';
import { Rect } from './rect.js';
import './util.js';
import { Controller } from './main.js'

const SelectorCell = '.categoryCell';
const SelectorRow = '.categoryRow';
const SelectorCategory = '#categoryMain';
const SelectorText = '#categoryText';

export class CategoryNode extends NavNode {
	constructor(location, url, numPerRow) {
		super(location, '<div id='+SelectorCategory.slice(1)+'></div>', url);
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
		let sizes = this._images.map( e => Resize(new Rect(0, 0, baseCellSize.x, baseCellSize.y), e.imageSize) );
		let sizesY = sizes.map( e => e.h ).sort( (a, b) => b-a );
		let cellSizeY = sizesY.pop();
		let rowSizeX = sizes.map( e => e.w ).sort( (a, b) => b-a );
		rowSizeX = rowSizeX.pop()+rowSizeX.pop();
		let numRows = Math.ceil(this._photoUrls.length/this._numPerRow);
		for( let i = 0; i < numRows; i++ ) {
			let curRow = this._domRow.cloneNode(true);
			curRow.setAttribute('style', 'width:{0}px;height:{1}px;'.format(rowSizeX,cellSizeY));
			this._domMain.appendChild(curRow);
			for ( let j = 0; j < this._numPerRow; j++ ) {
				let curIndex = i*this._numPerRow+j;
				if ( curIndex < this._images.length ) {
					let curCell = this._domCell.cloneNode(true);
					curRow.appendChild(curCell);
					let image = this._images[curIndex];
					image.domRoot = curCell;
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
			let image = new ImageGL(null, Controller.navController, GetPhotoUrl(url, photoClass));
			this._images.push(image);
			this._subscriptions.push(image.loadedSubject.subscribe( () => {
				if ( this._images.every( e => e.isLoaded ) ) {
					this._completeLoad(baseCellSize);
				}
			}));
		}
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

	onUnload() {
		super.onUnload();
		this._images.forEach( e => e.destroy() );
		this._subscriptions.forEach( e => e.unsubscribe() );
	}
}
