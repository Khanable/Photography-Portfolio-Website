const ValueError = new Error('Required a type of Vector like or numeric');

export class Vector2 {
	constructor() {
		if ( arguments.length == 1 ) {
			let arr = Array.from(arguments[0]);
			if ( arr.length == 2 ) {
				this._x = arr[0];
				this._y = arr[1];
			}
			else {
				throw new Error('Require an iterable that yields 2 values, x and y');
			}
		}
		else if ( arguments.length == 2 ) {
			this._x = arguments[0];
			this._y = arguments[1];
		}
		else {
			throw new Error('Must take an iterable or x, y as arguments');
		}
	}

	_isVector(v) {
		return v.x != undefined && v.y != undefined;
	}

	_isNumeric(v) {
		return typeof(v) == 'number';
	}
	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}
	magnitude() {
		return Math.sqrt( this.x*this.x + this.y*this.y );
	}
	normalize() {
		let mag = this.magnitude();
		return new Vector2(this.x/mag, this.y/mag);
	}
	rotate(t) {
		let x = this.x*Math.cos(t)+this.y*-Math.sin(t);
		let y = this.x*Math.sin(t)+this.y*Math.cos(t);
		return new Vector2(x, y);
	}
	add(v) {
		if ( this._isVector(v) ) {
			return new Vector2(this.x+v.x, this.y+v.y);
		}
		else if ( this._isNumeric(v) ) {
			return new Vector2(this.x+v, this.y+v);
		}
		else {
			throw ValueError;
		}
	}
	mul(v) {
		if ( this._isVector(v) ) {
			return new Vector2(this.x*v.x, this.y*v.y);
		}
		else if ( this._isNumeric(v) ) {
			return new Vector2(this.x*v, this.y*v);
		}
		else {
			throw ValueError;
		}
	}
	sub(v) {
		if ( this._isVector(v) ) {
			return new Vector2(this.x-v.x, this.y-v.y);
		}
		else if ( this._isNumeric(v) ) {
			return new Vector2(this.x-v, this.y-v);
		}
		else {
			throw ValueError
		}
	}

	div(v) {
		if ( this._isVector(v) ) {
			return new Vector2(this.x/v.x, this.y/v.y);
		}
		else if ( this._isNumeric(v) ) {
			return new Vector2(this.x/v, this.y/v);
		}
		else {
			throw ValueError;
		}
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

	pow(v) {
		if ( this._isVector(v) ) {
			return new Vector2(Math.pow(this.x, v.x), Math.pow(this.y, v.y));
		}
		else if ( this._isNumeric(v) ) {
			return new Vector2(Math.pow(this.x, v), Math.pow(this.y, v));
		}
		else {
			throw ValueError;
		}
	}
}

Vector2.One = new Vector2(1, 1);
Vector2.Zero = new Vector2(0, 0);
Vector2.Up = new Vector2(0, 1);
Vector2.Right = new Vector2(1, 0);
