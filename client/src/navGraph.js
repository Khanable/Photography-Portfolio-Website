import { NavGraph, NavNode, Dir } from './nav.js';
import { PhotoNode } from './photoNode.js';
import { Resize } from './image.js';
import { Vector2 } from './vector.js';
import { SizeText, GetElementRect, GetElementSize, AppendDomNodeChildren, LoadHtml } from './util.js';
import { CategoryNode } from './categoryNode.js';
import * as AboutHtml from './about.html';
import * as IndexHtml from './index.html';
import './index.css';
import * as ContactHtml from './contact.html';
import * as CVHtml from './cv.html';
import * as LogoSvg from './logo.svg';
import { LogoLoadingIndicatorFactory } from './loadingIndicator.js';

export const Location = {
	Index: 0,
	About: 1,
	Contact: 2,
	CV: 3,
	Services: 4,
	Category1: 5,
	Photo1: 6,
}

const ImageStateTransitionTime = 1.0;
const LoadingIndicatedTransitionTime = 1.0;

const IndexDom = LoadHtml(IndexHtml);
const IndexLogoContainerSelector = '#indexLogoContainer';
const IndexLogoTextSelector = '#indexLogoText';
const LogoFontSize = 5;
const LogoDom = LoadHtml(LogoSvg);
const LogoSize = new Vector2(200, 200);
AppendDomNodeChildren(IndexDom.querySelector(IndexLogoContainerSelector), LogoDom.cloneNode(true));

const LoadingIndicatorFactory = new LogoLoadingIndicatorFactory(LogoDom);

const IndexNode = new NavNode(Location.Index, IndexDom, 'index');
const AboutNode = new NavNode(Location.About, AboutHtml, 'about');
const ContactNode = new NavNode(Location.Contact, ContactHtml, 'contact');
const CVNode = new NavNode(Location.CV, CVHtml, 'cv');
const ServicesNode = new NavNode(Location.Services, CVHtml, 'cv');
const Category1 = new CategoryNode(Location.Category1, 'category1', 2, 'Category 1', 25, ImageStateTransitionTime, LoadingIndicatedTransitionTime, LoadingIndicatorFactory, '/static/testImage.jpg', '/static/testImage.jpg', '/static/testImage.jpg', '/static/testImage.jpg');
const Photo1 = new PhotoNode(Location.Photo1, 'photo1', '/static/testImage.jpg', ImageStateTransitionTime, LoadingIndicatedTransitionTime, LoadingIndicatorFactory);


export const Graph = new NavGraph(IndexNode);
IndexNode.addConnection(Dir.East, ContactNode, 'Contact', 'Index');
IndexNode.addConnection(Dir.West, ServicesNode, 'Services', 'Index');
ContactNode.addConnection(Dir.East, AboutNode, 'About', 'Contact');
AboutNode.addConnection(Dir.East, CVNode, 'CV', 'About');

IndexNode.addConnection(Dir.South, Category1, 'Gallery', 'Index');
Photo1.addConnection(Dir.North, Category1, 'Category1', 'Photo1');


const IndexNodeLogo = {
	_container: null,
	_logo: null,
	_logoText: null,
	load: function(event) {
		this._logoText = event.domNode.querySelector(IndexLogoTextSelector);
		this._container = event.domNode.querySelector(IndexLogoContainerSelector);
		this._logo = this._container.querySelector('svg');
		this.resize();
	},
	resize: function() {
		let size = Resize(GetElementRect(this._container), LogoSize);
		SizeText(this._logoText, LogoFontSize, true)
		this._logo.setAttribute('width',size.w);
		this._logo.setAttribute('height',size.h);
	},
}
IndexNode.onLoadSubject.subscribe( IndexNodeLogo.load.bind(IndexNodeLogo) );
IndexNode.onResizeSubject.subscribe( IndexNodeLogo.resize.bind(IndexNodeLogo) );
