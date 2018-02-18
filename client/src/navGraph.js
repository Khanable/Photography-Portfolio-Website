import { NavGraph, NavNode, Dir } from './nav.js';
import * as AboutHtml from './about.html';
import * as PhotoViewHtml from './photoView.html';
import * as IndexHtml from './index.html';

const Location = {
	Index: 0,
	About: 1,
	Category1: 2,
	Photo1: 3,
	Photo2: 4,
}


const IndexNode = new NavNode(Location.Index, IndexHtml, 'Index', 'index');
const AboutNode = new NavNode(Location.About, AboutHtml, 'About', 'about');
const Category1 = new NavNode(Location.Category1, PhotoViewHtml, 'Category1', 'category1');
const Photo1 = new NavNode(Location.Photo1, PhotoViewHtml, 'Photo1', 'photo1');
const Photo2 = new NavNode(Location.Photo2, PhotoViewHtml, 'Photo2', 'photo2');


export const Graph = new NavGraph(IndexNode);
IndexNode.setConnection(Dir.West, AboutNode);
IndexNode.setConnection(Dir.South, Category1);

Photo1.setConnection(Dir.East, Photo2);

let onLoadSetCategory = (navNode) => {
	let connections = navNode.connections;
	if ( navNode != Category1 ) {
		if ( !connections.has(Dir.North) ) {
			navNode.setConnection(Dir.North, Category1);
		}
	}
	else {
		if ( !connections.has(Dir.South) ) {
			navNode.setConnection(Dir.South, Photo1);
		}
	}
}


Category1.onLoadFunc = onLoadSetCategory;
Photo1.onLoadFunc = onLoadSetCategory;
Photo2.onLoadFunc = onLoadSetCategory;
