import { NavGraph, NavPoint, Dir } from './nav.js';
import * as AboutHtml from './about.html';
import * as PhotoViewHtml from './photoView.html';
import * as IndexHtml from './index.html';

const Location = {
	Index: 0,
	About: 1,
	Category1: 2,
	Photo1: 3,
	Photo2: 3,
}


const IndexNode = new NavPoint(Location.Index, IndexHtml, 'Index');
const AboutNode = new NavPoint(Location.About, AboutHtml, 'About');
const Category1 = new NavPoint(Location.Category1, PhotoViewHtml, 'Category1');
const Photo1 = new NavPoint(Location.Photo1, PhotoViewHtml, 'Photo1');
const Photo2 = new NavPoint(Location.Photo2, PhotoViewHtml, 'Photo2');


export const Graph = new NavGraph(IndexNode);
IndexNode.setConnection(Dir.West, AboutNode);

IndexNode.setConnection(Dir.South, Category1);
Category1.setConnection(Dir.South, Photo1);
Photo1.setConnection(Dir.East, Photo2);

let updateCategoryPointerFunc = (navNode, dir) => {
	let connections = navNode.connections;
	if ( connections.has(dir) ) {
		let target = connections.get(dir);
		if ( target != Category1 ) {
			target.setConnection(Dir.North, Category1);
		}
	}
}

Photo1.preTransitionFunc = updateCategoryPointerFunc;
Photo2.preTransitionFunc = updateCategoryPointerFunc;
