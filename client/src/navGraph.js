import { NavGraph, NavNode, Dir } from './nav.js';
import { PhotoNode } from './photoNode.js';
import { Resize } from './image.js';
import { Vector2 } from './vector.js';
import { GetElementRect, GetElementSize, AppendDomNodeChildren, LoadHtml } from './util.js';
import { CategoryNode } from './categoryNode.js';
import * as AboutHtml from './about.html';
import * as IndexHtml from './index.html';
import './index.css';
import * as ContactHtml from './contact.html';
import * as CVHtml from './cv.html';
import * as LogoSvg from './logo.svg';

const Location = {
	Index: 0,
	About: 1,
	Contact: 2,
	CV: 3,
	Services: 4,
	Category1: 5,
	Photo1: 6,
}

const LogoDom = LoadHtml(LogoSvg);
const LogoSize = new Vector2(200, 200);

const IndexNode = new NavNode(Location.Index, IndexHtml, 'index');
const AboutNode = new NavNode(Location.About, AboutHtml, 'about');
const ContactNode = new NavNode(Location.Contact, ContactHtml, 'contact');
const CVNode = new NavNode(Location.CV, CVHtml, 'cv');
const ServicesNode = new NavNode(Location.Services, CVHtml, 'cv');
const Category1 = new CategoryNode(Location.Category1, 'category1', 2, '/static/testImage.jpg', '/static/testImage.jpg', '/static/testImage.jpg', '/static/testImage.jpg');
const Photo1 = new PhotoNode(Location.Photo1, 'photo1', '/static/testImage.jpg');


export const Graph = new NavGraph(IndexNode);
IndexNode.addConnection(Dir.East, ContactNode, 'Contact', 'Index');
IndexNode.addConnection(Dir.West, ServicesNode, 'Services', 'Index');
ContactNode.addConnection(Dir.East, AboutNode, 'About', 'Contact');
AboutNode.addConnection(Dir.East, CVNode, 'CV', 'About');

IndexNode.addConnection(Dir.South, Category1, 'Gallery', 'Index');
Photo1.addConnection(Dir.North, Category1, 'Category1', 'Photo1');


const IndexNodeLogo = function(event, create) {
	let logoContainer = event.domNode.querySelector('#indexLogoContainer');
	if ( create ) {
		AppendDomNodeChildren(logoContainer, LogoDom.cloneNode(true));
	}
	let size = Resize(GetElementRect(logoContainer), LogoSize);
	let logo = logoContainer.querySelector('svg');
	logo.setAttribute('width',size.w);
	logo.setAttribute('height',size.h);
}
IndexNode.onLoadSubject.subscribe( (event) => IndexNodeLogo(event, true));
IndexNode.onResizeSubject.subscribe( (event) => IndexNodeLogo(event, false));
