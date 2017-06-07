//- remove any unused variables
//
//- prewarm
//- color variation
//- cleanup code
//- settings
//- profile
//- prng integration
//- image fallback, (unity clouds shader, overlaping images rotating)
import { ElementRef } from '@angular/core';

class Utility {
	static randomRange(s:number, e:number) {
		return Math.floor(Math.random() * (e-s)) + s;
	}
}


class Vector2 {
	static readonly zero: Vector2 = new Vector2(0, 0);

	constructor(public x:number, public y:number) {} 

	toIndex(sizeX:number, sizeY:number) : number {
		return this.y*sizeY+this.x%sizeX;
	}

	static randomRange(s:Vector2, e:Vector2) : Vector2 {
		return new Vector2(Utility.randomRange(s.x, e.x), Utility.randomRange(s.y, e.y));
	}

	add(v:Vector2): Vector2 { 
		return new Vector2(this.x+v.x, this.y+v.y);
	}

	equals(v:Vector2):boolean {
		return this.x == v.x && this.y == v.y;
	}

	magnitude():number {
		return Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) );
	}
	copy():Vector2 {
		return new Vector2(this.x, this.y);
	}

	static indexToVector(i:number, size:Vector2): Vector2 {
		return new Vector2(Math.floor(i/size.y), i%size.x);
	}

}

interface IColor {
	r:number;
	g:number;
	b:number;
}

class Color implements IColor {
	constructor(public r:number, public g:number, public b:number) {};

	toStyle():string {
		return 'rgb('+this.r+','+this.g+','+this.b+')';
	}
}

class LinkedColor implements IColor {
	private readonly _index:number;
	private static readonly _numColors:number = 4;

	constructor(private _pos:Vector2, private _data:ImageData) {
		this._index = this._pos.toIndex(this._data.width, this._data.height)*LinkedColor._numColors;
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
	get pos():Vector2 {
		return this._pos.copy();
	}
}


export class Settings {
	dropTime:number = 0;
	smokeColor: Color = new Color(0, 125, 0);
	baseColor: Color = new Color(0, 0, 0);
}

export class Background {
	private readonly _canvas;
	private readonly _ctx;
	//private static readonly _defaultScale:Vector2 = new Vector2(1920, 1080);
	private _canvasSize:Vector2;
	private _lastCanvasSize: Vector2;
	private _scale:Vector2;
	private _placeT:number;
	private static readonly _selectionMask3x3Cross :Vector2[] = [
			new Vector2(0, -1),
			new Vector2(-1, 0),
			new Vector2(1, 0),
			new Vector2(0, 1),
		];
	private static readonly _selectionMask3x3 :Vector2[] = [
			new Vector2(-1, -1),
			new Vector2(0, -1),
			new Vector2(1, -1),
			new Vector2(-1, 0),
			new Vector2(1, 0),
			new Vector2(-1, 1),
			new Vector2(0, 1),
			new Vector2(1, 1),
		];
	private readonly _root;

	private _curUpdatePixelIndex:number;

	private _drawCount:number;
	private readonly _circleMask:Vector2[];

	constructor(root: ElementRef, style:string, private _settings: Settings) {
		this._root = root.nativeElement;

		this._canvas = document.createElement('canvas');
		this._canvas.className = style;
		this._ctx = this._canvas.getContext('2d');

		this._root.appendChild(this._canvas);

		this._canvasSize = new Vector2(0, 0);
		this._lastCanvasSize = new Vector2(0, 0);
		this._scale = new Vector2(0, 0);

		this._placeT = 0;
		this._drawCount = 0;
		this._curUpdatePixelIndex = 0;

		this.updateCanvasSize()

		this.fillCanvasBaseColor();

		//create circle mask
		let radius = 8;
		this._circleMask = [];
		for(let x = -radius; x < radius; x++) {
			for( let y = -radius; y < radius; y++) {
				let pos = new Vector2(x, y);
				if ( pos.magnitude() <= radius ) {
					this._circleMask.push(pos);
				}
			}
		}

		//pre-ignite
		//let curData = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);
		//let randStart = [];
		//for( let i = 0; i < 1000; i++ ) {
		//	randStart.push(Vector2.randomRange(Vector2.zero, this._canvasSize));
		//}
		//this._ctx.fillStyle = this._settings.smokeColor.toStyle();
		//randStart.forEach( v => this._ctx.fillRect(v.x, v.y, 16, 16));
		//curData = this.operate(curData, null, randStart, (sColor, dColors) => {
		//	sColor.g = this._settings.smokeColor.g;
		//});
		//this._ctx.putImageData(curData, 0, 0 );
	}

	private fillCanvasBaseColor():void {
		this._ctx.fillStyle = this._settings.baseColor.toStyle();
		this._ctx.fillRect(0, 0, this._canvasSize.x, this._canvasSize.y);
	}

	private updateCanvasSize() : void {
		let style = window.getComputedStyle(this._canvas);
		this._lastCanvasSize = this._canvasSize;
		this._canvasSize = new Vector2(parseInt(style.getPropertyValue('width')), parseInt(style.getPropertyValue('height')));
		if ( !this._canvasSize.equals(this._lastCanvasSize) ) {
			//!this._scale = new Vector2(this._canvasSize.x/this._defaultScale.x, this._canvasSize.y/this._defaultScale.y);
			let data = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);
			//we loose the canvas state here if we don't put the image back on after changing canvas size attributes
			this._canvas.setAttribute('width', this._canvasSize.x);
			this._canvas.setAttribute('height', this._canvasSize.y);
			//Is larger, fill extra space with black, cull the rest.
			if ( this._canvasSize.magnitude() > this._lastCanvasSize.magnitude() ) {
				this.fillCanvasBaseColor();
			}
			//put the image data back
			this._ctx.putImageData(data, 0, 0);
		}
	}


	private operate(src: ImageData, selectionMask:Vector2[], srcVectors:Vector2[], operation: (srcColor:LinkedColor, dstColors:LinkedColor[]) => void) : void {
		let dst:any = new ImageData(src.data.slice(), src.width, src.height);
		for(let pos of srcVectors) { 
				let color = new LinkedColor(pos, src);
				//get surrounding cells
				let sColor = new LinkedColor(pos, dst);
				let dColors;
				if ( selectionMask ) {
					dColors = selectionMask.map( v => v.add(pos)).map( v => new LinkedColor(v, dst));
				}
				operation(sColor, dColors);
		}
		return dst;
	}

	private outOfBounds(pos: Vector2): boolean {
		if ( pos.x < 0 || pos.y < 0 || pos.x >= this._canvasSize.x || pos.y >= this._canvasSize.y ) {
			return true;
		}
		return false;
	}

	private draw(dt:number) {
		let curData = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);

		//Pixels suppply
		let randStart = [];
		for( let i = 0; i < 16; i++ ) {
			randStart.push(Vector2.randomRange(Vector2.zero, this._canvasSize));
		}
		curData = this.operate(curData, null, randStart, (sColor, dColors) => {
			sColor.g += this._settings.smokeColor.g;
		});

		//Smoke 
		let randPos = Vector2.randomRange(Vector2.zero, this._canvasSize);
		randStart = this._circleMask.map( v => v.add(randPos) );
		curData = this.operate(curData, Background._selectionMask3x3Cross, randStart, (sColor, dColors) => {
			let dCs = dColors.map( c => !this.outOfBounds(c.pos) ? c : this._settings.baseColor );
			let cal = (f, maxSmokeValue) => {
				return f * (dCs.reduce( (acc, cv) => acc+cv.g, 0 )-dCs.length*maxSmokeValue);
			}
			sColor.g += cal(0.1, 125);
		});


		//blur kernel
		//creates a sharp/soft paralax over time, defantly working!
		curData = this.operate(curData, Background._selectionMask3x3, randStart, (sColor, dColors) => {
			let kern = [
				1/16, 2/16, 1/16,
				2/16, 4/16, 2/16,
				1/16, 2/16, 1/16,
			]
			let cal = (property) => {
				let sC = sColor[property]
				let mappedColors:IColor[] = dColors.map( c => this.outOfBounds(c.pos) ? this._settings.baseColor : c );
				let dCs = mappedColors.map( c => c[property] );
				return (kern[8]*dCs[0]) + (kern[7]*dCs[1]) + (kern[6]*dCs[2]) + (kern[5]*dCs[3]) + (kern[4]*sC) + (kern[3]*dCs[4]) + (kern[2]*dCs[5]) + (kern[1]*dCs[6]) + (kern[0]*dCs[7]);
			}

			sColor.r = cal('r');
			sColor.g = cal('g');
			sColor.b = cal('b');
		});

		this._ctx.putImageData(curData, 0, 0 );
	}

	render(dt:number) {
		this.updateCanvasSize();
		this.draw(dt);
	}

}
