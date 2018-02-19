export class Vector2 {
	constructor(x, y) {
		this._x = x;
		this._y = y;
	}
	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}

	add(v) {
		return new Vector2(this.x+v.x, this.y+v.y);
	}
	mul(s) {
		return new Vector2(this.x*s, this.y*s);
	}
	mulv(v) {
		return new Vector2(this.x*v.x, this.y*v.y);
	}

	div(s) {
		return new Vector2(this.x/s, this.y/s);
	}
	divv(v) {
		return new Vector2(this.x/v.x, this.y/v.y);
	}
}

Vector2.One = new Vector2(1, 1);
Vector2.Zero = new Vector2(0, 0);
Vector2.Up = new Vector2(0, 1);
Vector2.Right = new Vector2(1, 0);
