import { NavNode } from './nav.js';
import { RemoveAllChildren, SizeText, LoadHtml, GetElementSize } from './util.js';
import { default as CategoryHtml } from './category.html';
import './category.css';
import { ImageGL, GetMatchingPhotoClassSize, GetPhotoUrl, Resize } from './image.js';
import { Vector2 } from './vector.js';
import { Rect } from './rect.js';
import './util.js';
import { Controller } from './main.js'

const SelectorCell = '.categoryCell';
const SelectorRow = '.categoryRow';
const SelectorMain = '#categoryMain';
const SelectorText = '#categoryText';
const SelectorPhotos = '#categoryPhoto';

const viewHtml = `
<div id={1}>
	<div id={2}></div>
	<label id={0}></label>
</div>
`.format(SelectorText.slice(1), SelectorMain.slice(1), SelectorPhotos.slice(1));

export class CategoryNode extends NavNode {
	constructor(location, url, numPerRow, title, fontSize, imageTransitionTime, loadingIndicatorTime, loadingIndicatorFactory) {
		super(location, viewHtml, url);
		this._photoUrls = Array.from(arguments).slice(8);
		this._subscriptions = [];
		this._images = null;
		this._domMain = null;
		this._categoryNode = null;
		this._numPerRow = numPerRow;
		this._title = title;
		this._titleFontSize = fontSize;
		this._textNode = null;
		this._imageTransitionTime = imageTransitionTime;
		this._loadingTransitionTime = loadingIndicatorTime;
		this._loadingIndicatorFactory = loadingIndicatorFactory;

		let categoryDom = LoadHtml(CategoryHtml);
		this._domCell = categoryDom.querySelector(SelectorCell);
		this._domRow = categoryDom.querySelector(SelectorRow);
	}	

	_adjustTable(rows, rowSize) {
		for( let row of rows ) {
			row.setAttribute('style', 'width:{0}px;height:{1}px;'.format(rowSize.x,rowSize.y));
		}
	}

	_setupTable() {
		let numRows = Math.ceil(this._photoUrls.length/this._numPerRow);
		let rows = [];
		let cells = [];
		for( let i = 0; i < numRows; i++ ) {
			let curRow = this._domRow.cloneNode(true);
			rows.push(curRow);
			this._categoryNode.appendChild(curRow);
			for ( let j = 0; j < this._numPerRow; j++ ) {
				let curIndex = i*this._numPerRow+j;
				if ( curIndex < this._photoUrls.length ) {
					let curCell = this._domCell.cloneNode(true);
					curRow.appendChild(curCell);
					cells.push(curCell);
				}
				else {
					break;
				}
			}
		}
		return Object.freeze({
			cells: cells,
			rows: rows,
		});
	}

	_completeLoad(table, baseCellSize) {
		let sizes = this._images.map( e => Resize(new Rect(0, 0, baseCellSize.x, baseCellSize.y), e.imageSize) );
		let sizesY = sizes.map( e => e.h ).sort( (a, b) => b-a );
		let cellSizeY = sizesY.pop();
		let rowSizeX = sizes.map( e => e.w ).sort( (a, b) => a-b ).slice(this._numPerRow);
		rowSizeX = rowSizeX.reduce( (acc, cv) => acc+cv, 0);
		this._adjustTable(table.rows, new Vector2(rowSizeX, cellSizeY));
		table.cells.forEach( (e, i) => this._images[i].domRoot = e );
	}

	_loadView() {
		this._images = [];

		let viewSize = GetElementSize(this._categoryNode);
		let baseCellSize = viewSize.div(this._photoUrls.length/this._numPerRow);

		//Adjust the Cell size to fit the smallest dimension of the images.
		let table = this._setupTable();
		let cells = table.cells;
		this._adjustTable(table.rows, new Vector2(baseCellSize.x*this._numPerRow, baseCellSize.y));
		for( let i = 0; i < cells.length; i++ ) {
			let url = this._photoUrls[i];
			let cellDom = cells[i];
			let photoClass = GetMatchingPhotoClassSize(baseCellSize);
			let image = new ImageGL(Controller.navController, GetPhotoUrl(url, photoClass), this._imageTransitionTime, this._loadingTransitionTime, this._loadingIndicatorFactory);
			image.domRoot = cellDom;
			this._images.push(image);
			this._subscriptions.push(image.loadedSubject.subscribe( () => {
				if ( this._images.every( e => e.isLoaded ) ) {
					this._completeLoad(table, baseCellSize);
				}
			}));
		}
	}

	_resizeText() {
		SizeText(this._textNode, this._titleFontSize, true);
	}

	onLoad(domNode) {
		super.onLoad(domNode);
		this._domMain = domNode.querySelector(SelectorMain);
		this._categoryNode = this._domMain.querySelector(SelectorPhotos);
		this._textNode = this._domMain.querySelector(SelectorText);

		this._textNode.innerText = this._title;

		this._resizeText();
		this._loadView();
	}

	onResize() {
		super.onResize();
		this._resizeText();
		this._images.forEach( e => e.resize() );
	}

	onUnload() {
		this._images.forEach( e => e.unload() );
	}

	onDestroy() {
		super.onDestroy();
		this._images.forEach( e => e.destroy() );
		this._subscriptions.forEach( e => e.unsubscribe() );
		this._images = null;
	}
}
