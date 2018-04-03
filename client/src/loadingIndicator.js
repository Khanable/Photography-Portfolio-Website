import { Math as ThreeMath } from 'three';

export class LogoLoadingIndicatorFactory {
	constructor(logoDom) {
		this._logoDom = logoDom;
	}

	new() {
		return new LoadingIndicatorController(this._logoDom.cloneNode(true));
	}
}

class LogoLoadingIndicatorController {
	constructor(logoDom) {
		this._logoDom = logoDom;
		this._startColor = 0;
		this._endColor = 0.7;
		this._styleFormats = new Map();
		this._parseAndSetup();
	}

	_hasColor(styleString) {

	}
	_styleToFormat(styleString) {
	}

	_parseAndSetup() {
		let stops = this._logoDom.querySelectorAll('stop');
		let paths = this._logoDom.querySelectorAll('path');
		let domain = [].extend(stops).extend(paths);

		for( let node of domain ) {
			let style = node.getAttribute('style');
			if ( this._hasColor(style) ) {
				this._styleFormats.set(node, this._styleToFormat(style));
			}
		}
	}

	update(t) {
		for( let e of this._styleFormats.entries() ) {
			let node = e[0];
			let styleFormat = e[1];
			let color = this._startColor;
			let dir = 0;
			if ( t >= 0.5 ) {
				dir = 1;
				t = 
			}
			else {
			}

			if ( !dir ) {
			}
			else {
			}

			node.setAttribute(styleFormat.format(color*256.toString(16)));
		}
	}
}
