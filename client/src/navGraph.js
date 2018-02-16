import { NavPoint, Dir } from './view.js';
import * as index from './index.html';
import * as about from './about.html';

export const ViewLocation = {
	Index: 0,
	About: 1,
	Categories: 2,
	Category: 3,
}

export const NavGraph = new Map();
NavGraph.set(ViewLocation.Index, [new NavPoint(ViewLocation.About, Dir.East), new NavPoint(ViewLocation.Categories, Dir.South)])
NavGraph.set(ViewLocation.About, [new NavPoint(ViewLocation.Index, Dir.West)])
NavGraph.set(ViewLocation.Categories, [new NavPoint(ViewLocation.Index, Dir.North)])


export const Views = new Map();
Views.set(ViewLocation.Index, index);
Views.set(ViewLocation.About, about);
