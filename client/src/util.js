import { Vector2 } from './vector.js';
import { Rect } from './rect.js';

if ( !String.prototype.format ) {
	String.prototype.format = function() {
		let args = arguments;
		return this.replace(/{(\d+)}/g, function(match, num) {
			return args[num] != undefined ? args[num] : match;
		})
	}
}
else {
	throw new Error('String.format already exists, cannot extend');
}

export const AppendAttribute = function(node, attr, value) {
	node.setAttribute(attr, node.getAttribute(attr)+value);
}

export const GetElementSize = function(domElement) {
	let bounds = domElement.getBoundingClientRect();
	return new Vector2(bounds.width, bounds.height);
}

export const GetWindowSize = function() {
	return new Vector2(window.innerWidth, window.innerHeight);
}

export const GetElementRect = function(domElement) {
	let rect = domElement.getBoundingClientRect();
	return new Rect(rect.x, rect.y, rect.width, rect.height);
}

export const RandomRange = function(s, e) {
	return s+Math.random()*e;
}

export const LoadHtml = function(htmlStr) {
	let parser = new DOMParser();
	return parser.parseFromString(htmlStr, 'text/html').body;
}

export const AppendDomNodeChildren = function(rootNode, parentNode) {
	while(parentNode.children.length > 0 ) {
		let child = parentNode.children[0];
		rootNode.appendChild(child);
	}
}
