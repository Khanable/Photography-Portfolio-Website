import { NavGraph, NavNode, Dir } from './nav.js';
import { Vector2 } from './vector.js';
import * as AboutHtml from './about.html';
import * as PhotoViewHtml from './photoView.html';
import * as IndexHtml from './index.html';
import './photoView.css';
import { GetWindowSize } from './util.js';
import './util.js';

const Location = {
	Index: 0,
	About: 1,
	Category1: 2,
	Photo1: 3,
	Photo2: 4,
}

const PhotoNameFormat = '{0}_{1}.{2}';

const PhotoClasses = [
 2160, 1080, 720, 480
].sort( (a,b) => b-a );

class PhotoNode extends NavNode {
	constructor(location, arrowText, url, basePhotoUrl, photoFileName, photoExt) {
		super(location, PhotoViewHtml, arrowText, url);
		this._basePhotoUrl = basePhotoUrl;
		this._photoFileName = photoFileName;
		this._photoExt = photoExt;

		this._domMain = null;
	}

	_load() {
		let img = new Image();
		img.addEventListener('load', () => {
			this._domMain.innerHTML = '';

			let displayRect = this._domMain.getBoundingClientRect();
			let displaySize = new Vector2(displayRect.width, displayRect.height);
			let naturalSize = new Vector2(img.naturalWidth, img.naturalHeight);
			let ratioV = displaySize.divv(naturalSize);
			let ratio = img.width > img.height ? ratioV.x : ratioV.y;
			let imgSize = naturalSize.mul(ratio);

			img.width = imgSize.x;
			img.height = imgSize.y;
			this._domMain.appendChild(img);
		});
		let windowSize = GetWindowSize();
		let shortWindowSize = windowSize.x > windowSize.y ? windowSize.y : windowSize.x;
		let applicableClasses = PhotoClasses.filter( e => e >= shortWindowSize );
		let photoClass = applicableClasses[applicableClasses.length-1];
		if ( photoClass == undefined ) {
			photoClass = PhotoClasses[0];
		}
		img.src = this._basePhotoUrl+PhotoNameFormat.format(this._photoFileName, photoClass.toString(), this._photoExt);
	}

	_setLoading() {
		this._domMain.innerHTML = '';
		this._domMain.innerHTML = '<label style="color:white;">Loading</label>';
	}

	onLoad(domNode) {
		super.onLoad(domNode);

		this._domMain = domNode.querySelector('#main');

		this._setLoading();
		this._load(domNode);
	}

	onResize(domNode) {
		super.onResize(domNode);

		this._setLoading();
		this._load();
	}

}

const IndexNode = new NavNode(Location.Index, IndexHtml, 'Index', 'index');
const AboutNode = new NavNode(Location.About, AboutHtml, 'About', 'about');
const Category1 = new PhotoNode(Location.Category1, 'Category1', 'category1', '/static/', 'testImage', 'jpg');
const Photo1 = new PhotoNode(Location.Photo1, 'Photo1', 'photo1', '/static/', 'testImage', 'jpg');
const Photo2 = new PhotoNode(Location.Photo2, 'Photo2', 'photo2', '/static/', 'testImage', 'jpg');


export const Graph = new NavGraph(IndexNode);
IndexNode.addConnection(Dir.West, AboutNode);
IndexNode.addConnection(Dir.South, Category1);

Photo1.addConnection(Dir.North, Category1);
Photo1.addConnection(Dir.East, Photo2);
Photo2.addConnection(Dir.North, Category1);
Photo2.addConnection(Dir.East, Photo1);
