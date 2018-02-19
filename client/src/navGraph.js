import { NavGraph, NavNode, Dir } from './nav.js';
import { Vector2 } from './vector.js';
import * as AboutHtml from './about.html';
import * as PhotoViewHtml from './photoView.html';
import * as IndexHtml from './index.html';
import './photoView.css';

const Location = {
	Index: 0,
	About: 1,
	Category1: 2,
	Photo1: 3,
	Photo2: 4,
}

class PhotoNode extends NavNode {
	constructor(location, arrowText, url, photoUrl) {
		super(location, PhotoViewHtml, arrowText, url);
		this._img = null;
		this._photoUrl = photoUrl;
	}

	onLoad(domNode) {
		super.onLoad(domNode);

		if ( this._img == null ) {
			this._img = new Image()
			this._img.src = this._photoUrl;
		}

		let domMain = domNode.querySelector('#main');

		let displayRect = domNode.getBoundingClientRect();
		let displaySize = new Vector2(displayRect.width, displayRect.height);
		let imgSize = new Vector2(this._img.width, this._img.height);
		let ratioV = displaySize.divv(imgSize);
		let ratio = this._img.width > this._img.height ? ratioV.x : ratioV.y;
		imgSize = imgSize.mul(ratio);

		this._img.width = imgSize.x;
		this._img.height = imgSize.y;
		domMain.appendChild(this._img);
	}

}

const IndexNode = new NavNode(Location.Index, IndexHtml, 'Index', 'index');
const AboutNode = new NavNode(Location.About, AboutHtml, 'About', 'about');
const Category1 = new PhotoNode(Location.Category1, 'Category1', 'category1', '/static/testImage.jpg');
const Photo1 = new PhotoNode(Location.Photo1, 'Photo1', 'photo1', '/static/testImage.jpg');
const Photo2 = new PhotoNode(Location.Photo2, 'Photo2', 'photo2', '/static/testImage.jpg');


export const Graph = new NavGraph(IndexNode);
IndexNode.addConnection(Dir.West, AboutNode);
IndexNode.addConnection(Dir.South, Category1);

Photo1.addConnection(Dir.North, Category1);
Photo1.addConnection(Dir.East, Photo2);
Photo2.addConnection(Dir.North, Category1);
Photo2.addConnection(Dir.East, Photo1);
