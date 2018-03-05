export class Matrix3 {
	constructor(arr) {
		if ( !(arr instanceof Array) ) {
			arr = Array.from(arr);
		}

		if ( arr.length == 9 ) {
			this._data = arr.slice();
		}
		else {
			throw new Error('Matrix arr should be of length 9 (3x3)');
		}
	}

	transform(v) {
		if ( !(v instanceof Array) ) {
			v = Array.from(v);
		}
		let rtn = [];
		for( let i = 0; i < 3; i++ ) {
			let p = i*3;
			let res = this._data[p]*v[0]+this._data[1+p]*v[1]+this._data[2+p]*v[2];
			rtn.push(res);
		}
		return rtn;
	}
}
