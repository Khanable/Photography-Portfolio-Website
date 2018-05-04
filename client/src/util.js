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

export const SizeText = function(domNode, fontPercentage, shortSide) {
	let windowSize = GetWindowSize();
	let sorted = Array.from(windowSize).sort( (a,b) => a-b );
	let side = shortSide ? sorted[0] : sorted[1];
	domNode.setAttribute('style', 'font-size: {0}px;'.format(side*(fontPercentage/100)));
}

export const AppendAttribute = function(node, attr, value) {
	let prev = node.getAttribute(attr);
	if ( prev == null ) {
		prev = '';
	}
	node.setAttribute(attr, prev+value);
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
	return new Rect(rect.left, rect.top, rect.width, rect.height);
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

export const RemoveAllChildren = function(node) {
	let children = node.children;
	while( children.length > 0 ) {
		let child = children[0];
		node.removeChild(child);
	}
}
