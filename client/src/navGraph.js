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
		this._photoUrl = photoUrl;
	}

	_load(domNode) {
		let img = new Image();
		img.addEventListener('load', () => {
			let domMain = domNode.querySelector('#main');
			domMain.innerHTML = '';

			let displayRect = domNode.getBoundingClientRect();
			let displaySize = new Vector2(displayRect.width, displayRect.height);
			let naturalSize = new Vector2(img.naturalWidth, img.naturalHeight);
			let ratioV = displaySize.divv(naturalSize);
			let ratio = img.width > img.height ? ratioV.x : ratioV.y;
			let imgSize = naturalSize.mul(ratio);

			img.width = imgSize.x;
			img.height = imgSize.y;
			domMain.appendChild(img);
		});
		img.src = this._photoUrl;
	}

	onLoad(domNode) {
		super.onLoad(domNode);

		let domMain = domNode.querySelector('#main');
		domMain.innerHTML = '';
		domMain.innerHTML = '<label style="color:white;">Loading</label>';

		this._load(domNode);
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
