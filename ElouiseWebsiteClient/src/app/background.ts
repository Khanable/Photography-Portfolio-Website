import { ElementRef } from '@angular/core';


class Vector2 {
	constructor(public x:number, public y:number) {} 

	toIndex(sizeX:number, sizeY:number) : number {
		return this.y*sizeY+this.x%sizeX;
	}

	private static random(s:number, e:number) : number {
		return Math.floor(Math.random() * (e-s)) + s;
	}

	static randomRange(sx:number, ex:number, sy:number, ey:number) : Vector2 {
		return new Vector2(Vector2.random(sx, ex), Vector2.random(sy, ey));
	}

	add(v:Vector2): Vector2 { 
		return new Vector2(this.x+v.x, this.y+v.y);
	}
}

class Color {
	private readonly _index:number;
	private static readonly _numColors:number = 4;

	constructor(private _pos:Vector2, private _data:ImageData) {
		this._index = this._pos.toIndex(this._data.width, this._data.height)*Color._numColors;
	}

	set r(v:number) {
		this._data.data[this._index] = v;
	}
	get r():number {
		return this._data.data[this._index];
	}
	set g(v:number) {
		this._data.data[this._index+1] = v;
	}
	get g():number{
		return this._data.data[this._index+1];
	}
	set b(v:number) {
		this._data.data[this._index+2] = v;
	}
	get b():number {
		return this._data.data[this._index+2];
	}
	set a(v:number) {
		this._data.data[this._index+3] = v;
	}
	get a():number {
		return this._data.data[this._index+3];
	}
}


export class Settings {
	dropTime:number = 0;
}

export class Background {
	private readonly _canvas;
	private readonly _ctx;
	private static readonly _defaultSize:Vector2 = new Vector2(1920, 1080);
	private _canvasSize:Vector2;
	private _scale:Vector2;
	private _placeT:number;
	private readonly _selectionMask :Vector2[];
	private readonly _root;

	constructor(root: ElementRef, style:string, private _settings: Settings) {
		this._root = root.nativeElement;

		this._canvas = document.createElement('canvas');
		this._canvas.className = style;
		this._ctx = this._canvas.getContext('2d');

		this._root.appendChild(this._canvas);

		this._canvasSize = new Vector2(0, 0);
		this._scale = new Vector2(0, 0);

		this._placeT = 0;

		this._selectionMask = [
			new Vector2(-1, -1),
			new Vector2(0, -1),
			new Vector2(1, -1),
			new Vector2(-1, 0),
			new Vector2(1, 0),
			new Vector2(-1, 1),
			new Vector2(0, 1),
			new Vector2(1, 1),
		];

		this.updateCanvasSize()

		//fill black
		let data = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);
		for(let x = 0; x < data.width; x++ ) {
			for(let y = 0; y < data.height; y++ ) {
				let color =  new Color(new Vector2(x, y), data);
				color.a = 255;
			}
		}
		this._ctx.putImageData(data, 0, 0);
	}

	private updateCanvasSize() : void {
		let style = window.getComputedStyle(this._canvas);
		this._canvasSize.x = parseInt(style.getPropertyValue('width'));
		this._canvasSize.y = parseInt(style.getPropertyValue('height'));
		this._scale.x = this._canvasSize.x/Background._defaultSize.x;
		this._scale.y = this._canvasSize.y/Background._defaultSize.y;
		if ( changed ) {
			let data = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);
			if ( largerNow ) {
				//fill the difference if larger with black
			}
			//we loose the canvas state here if we don't put the image back on
			this._canvas.setAttribute('width', this._canvasSize.x);
			this._canvas.setAttribute('height', this._canvasSize.y);
			this._ctx.putImageData(data, 0, 0);
		}
	}

	private place(data:ImageData, dt:number) : void{
		if ( this._placeT >= this._settings.dropTime ) {
			let rPos = Vector2.randomRange(0, data.width, 0, data.height);
			let color = new Color(rPos, data);
			color.g = 255;
			this._placeT = 0;
			console.log('hit');
		}
		else {
			this._placeT += dt;
		}
	}

	private outOfBounds(pos: Vector2, data: ImageData): boolean {
		if ( pos.x < 0 || pos.y < 0 || pos.x >= data.width || pos.y >= data.height ) {
			return true;
		}
		return false;
	}

	private update(data:ImageData, dt:number) : void {
		for(let x = 0; x < data.width; x++ ) {
			for(let y = 0; y < data.height; y++ ) {
				let pos = new Vector2(x, y);
				let color = new Color(pos, data);
				//if has color
				if ( color.g > 0 ) {
					//distribute to surrounding cells
					let mask = this._selectionMask.map( v => v.add(pos));
					for(let check of mask) {
						if ( !this.outOfBounds(check, data) ) {
							let oColor = new Color(check, data);
							color.g-=1;
							oColor.g+=1;
						}
					}
				}
			}
		}
	}

	private draw(dt:number) {
		let data = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);
		this.place(data, dt);
		//this.update(data, dt);
		this._ctx.putImageData(data, 0, 0);
	}

	render(dt:number) {
		this.updateCanvasSize();

		//this.draw(dt);
	}

}
