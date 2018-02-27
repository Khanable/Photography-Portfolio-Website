import { Vector2 } from './vector.js';

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

export const RandomRange = function(s, e) {
	return s+Math.random()*e;
}
