import { Math as ThreeMath } from 'three';
import { Resize } from './image.js';
import { GetElementRect } from './util.js';
import './util.js';

export class LogoLoadingIndicatorFactory {
	constructor(logoDom, logoSize) {
		this._logoDom = logoDom.querySelector('svg');
		this._logoSize = logoSize;
	}

	new() {
		return new LogoLoadingIndicatorController(this, this._logoDom.cloneNode(true));
	}

	get logoSize() {
		return this._logoSize;
	}
}


//const colorAttributes = [
//	'stop-color',
//	'fill',
//	'stroke-color',
//	'stroke',
//	'color',
//];
const colorAttributes = [
	'fill',
];
class LogoLoadingIndicatorController {
	constructor(factory, logoDom) {
		this._factory = factory;
		this._logoDom = logoDom;
		this._startColor = 0;
		this._endColor = 1;
		this._styleFormats = new Map();
		this._parseAndSetup();
	}

	_hasColor(styleString) {
		return colorAttributes.some( e => styleString.includes(e) );
	}
	_styleToFormat(styleString) {
		let curStr = styleString;
		for(let e of colorAttributes) {
			curStr = curStr.replace(new RegExp(e+':#[0-9a-fA-F]{6}'), e+':#{0}{0}{0}');
		}
		return curStr;
	}

	_parseAndSetup() {
		let stops = this._logoDom.querySelectorAll('stop');
		let paths = this._logoDom.querySelectorAll('path');
		let domain = [];
		stops.forEach( e => domain.push(e) );
		paths.forEach( e => domain.push(e) );

		for( let node of domain ) {
			let style = node.getAttribute('style');
			if ( this._hasColor(style) ) {
				this._styleFormats.set(node, this._styleToFormat(style));
			}
		}
	}

	update(t) {
		let parent = this._logoDom.parentNode;
		if ( parent != null ) {
			t = ThreeMath.clamp(t, 0, 1);
			t = t <= 0.5 ? 2*t : -2*t+2;
			let color = ThreeMath.lerp(this._startColor, this._endColor, t);
			for( let e of this._styleFormats.entries() ) {
				let node = e[0];
				let styleFormat = e[1];
				let colorStr = (Math.floor(color*256)).toString(16).padStart(2, '0');
				node.setAttribute('style', styleFormat.format(colorStr));
			}
		}
	}

	resize() {
		let parent = this._logoDom.parentNode;
		if ( parent != null ) {
			let size = Resize(GetElementRect(parent), this._factory.logoSize);
			this._logoDom.setAttribute('width',size.w);
			this._logoDom.setAttribute('height',size.h);
		}
	}

	get domNode() {
		return this._logoDom;
	}
}
