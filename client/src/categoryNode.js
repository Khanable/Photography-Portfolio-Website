import { NavNode } from './nav.js';
import * as CategoryHtml from './category.html';
import './category.css';

export class CategoryNode extends NavNode {
	constructor(location, url) {
		super(location, CategoryHtml, url);
		this._photos = Array.from(arguments).slice(2);
	}	

	onLoad(domNode) {
	}
}
