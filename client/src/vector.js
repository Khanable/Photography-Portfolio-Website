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
	[Symbol.iterator]() {
		let self = this;
		return Object.seal({
			_index: 0,
			next: function() {
				let rtn = {
					done: true,
				};
				switch(this._index) {
					case 0:
						rtn.value = self.x;
						break;
					case 1:
						rtn.value = self.y;
						break;
				}
				this._index++;

				if ( rtn.value != undefined ) {
					rtn.done = false;
				}
				return Object.freeze(rtn);
			},
		});
	}
}

Vector2.One = new Vector2(1, 1);
Vector2.Zero = new Vector2(0, 0);
Vector2.Up = new Vector2(0, 1);
Vector2.Right = new Vector2(1, 0);
