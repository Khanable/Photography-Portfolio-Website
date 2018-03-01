import { Vector2 } from './vector.js';

export class Rect {
	constructor(x, y, w, h) {
		this._x = x;
		this._y = y;
		this._w = w;
		this._h = h;
	}

	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}
	get w() {
		return this._w;
	}
	get h() {
		return this._h;
	}

	get size() {
		return new Vector2(this._w, this._h);
	}

	get pos() {
		return new Vector2(this._x, this._y);
	}
}
