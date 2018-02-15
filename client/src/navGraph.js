import { NavPoint, DisplaySide } from './view.js';
import * as index from './index.html';
import * as about from './about.html';

export const ViewLocation = {
	Index: 0,
	About: 1,
	Categories: 2,
	Category: 3,
}

export const NavGraph = new Map();
NavGraph.set(ViewLocation.Index, [new NavPoint(ViewLocation.About, DisplaySide.East), new NavPoint(ViewLocation.Categories, DisplaySide.South)])


export const Views = new Map();
Views.set(ViewLocation.Index, index);
Views.set(ViewLocation.About, about);
