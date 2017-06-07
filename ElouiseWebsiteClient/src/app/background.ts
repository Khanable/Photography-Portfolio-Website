//- loading bar for prewarm if needed, woould need to handle as part of mainloop or worker thread. Could use worker thread as image data
//- color variation for smoke pixels
//- profile performance
//- image fallback, (unity clouds shader, overlaping images rotating)
import { ElementRef } from '@angular/core';

declare const Random;

class Vector2 {
	static readonly zero: Vector2 = new Vector2(0, 0);

	constructor(public x:number, public y:number) {} 

	toIndex(sizeX:number, sizeY:number) : number {
		return this.y*sizeY+this.x%sizeX;
	}

	static randomRange(s:Vector2, e:Vector2, rFactory) : Vector2 {
		return new Vector2(rFactory.nextIntRange(s.x, e.x), rFactory.nextIntRange(s.y, e.y));
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

	add(c:IColor): IColor;
	mag():number;
}

class Color implements IColor {
	constructor(public r:number, public g:number, public b:number) {};

	toStyle():string {
		return 'rgb('+this.r+','+this.g+','+this.b+')';
	}

	add(c:IColor):IColor {
		return new Color(this.r+c.r, this.g+c.g,this.b+c.b);
	}

	static random(s:IColor, e:IColor, rFactory): IColor {
		let sMag = s.mag();
		let eMag = e.mag();
		let rtn = Color.from(s);

		let diff = eMag-sMag;
		let newMag = rFactory.nextIntRange(1, diff);

		rtn.scale(newMag);

		return rtn;
	}

	mag():number {
		return Math.sqrt( Math.pow(this.r, 2) + Math.pow(this.g, 2) + Math.pow(this.b, 2) );
	}
	
	private scale(s:number):void {
		this.r*=s;
		this.g*=s;
		this.b*=s;
	}

	private normalize():void {
		let mag = this.mag();
		this.r/=mag;
		this.g/=mag;
		this.b/=mag;
	}

	static from(c:IColor):Color {
		return new Color(c.r, c.g, c.b);
	}
	
}

class LinkedColor implements IColor {
	private readonly _index:number;
	private static readonly _numColors:number = 4;

	constructor(private _pos:Vector2, private _data:ImageData) {
		this._index = this._pos.toIndex(this._data.width, this._data.height)*LinkedColor._numColors;
	}

	mag():number {
		return Math.sqrt( Math.pow(this.r, 2) + Math.pow(this.g, 2) + Math.pow(this.b, 2) );
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

	add(c:IColor):IColor {
		this.r += c.r;
		this.g += c.g;
		this.b += c.b;
		return this;
	}
}


export class Settings {
	dropTime:number = 0;
	baseColor: Color = new Color(0, 0, 0);
	circleMaskRadius:number = 8;
	prewarmCycles:number = 1;
	newPixelsPerFrame:number = 16;
	smokeFactor:number=0.1;
	smokeColorRandStart:Color = new Color(0, 100, 100);
	smokeColorRandEnd:Color = new Color(0, 180, 180);
}

export class Background {
	private readonly _canvas;
	private readonly _ctx;
	private _canvasSize:Vector2;
	private _lastCanvasSize: Vector2;
	private _scale:Vector2;
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
	private readonly _circleMask:Vector2[];
	private static readonly _blurKernel = [
		1/16, 2/16, 1/16,
		2/16, 4/16, 2/16,
		1/16, 2/16, 1/16,
	];
	private readonly _rFactory;

	constructor(root: ElementRef, style:string, private _settings: Settings) {
		this._root = root.nativeElement;
		this._canvas = document.createElement('canvas');
		this._canvas.className = style;
		this._ctx = this._canvas.getContext('2d');
		this._root.appendChild(this._canvas);

		this._canvasSize = new Vector2(0, 0);
		this._lastCanvasSize = new Vector2(0, 0);
		this._scale = new Vector2(0, 0);
		this._rFactory = new Random.RandomFactory32(performance.now(), 1);

		this.updateCanvasSize()

		this.fillCanvasBaseColor();

		this._circleMask = this.createCircleMask(this._settings.circleMaskRadius);

		this.prewarm();
	}

	private createCircleMask(radius):Vector2[] {
		let mask:Vector2[] = [];
		for(let x = -radius; x < radius; x++) {
			for( let y = -radius; y < radius; y++) {
				let pos = new Vector2(x, y);
				if ( pos.magnitude() <= radius ) {
					mask.push(pos);
				}
			}
		}
		return mask;
	}

	prewarm():void {
		for(let i = 0; i < this._settings.prewarmCycles; i++) {
			this.draw();
		}
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

	private addPixels(dataIn, toHere) {
		let dataOut = this.operate(dataIn, null, toHere, (sColor, dColors) => {
			let randColor = Color.random(this._settings.smokeColorRandStart, this._settings.smokeColorRandEnd, this._rFactory);
			sColor.add(randColor);
		});
		return dataOut;
	}

	private applySmoke(dataIn, toPixels) {
		let dataOut = this.operate(dataIn, Background._selectionMask3x3Cross, toPixels, (sColor, dColors) => {
			let dCs = dColors.map( c => !this.outOfBounds(c.pos) ? c : this._settings.baseColor );
			let cal = (maxSmokeValue) => {
				return this._settings.smokeFactor * (dCs.reduce( (acc, cv) => acc+cv.g, 0 )-dCs.length*maxSmokeValue);
			}
			//!operate on magntidue of color!
			let r = cal(this._settings.smokeColorRandEnd.r);
			let g = cal(this._settings.smokeColorRandEnd.g);
			let b = cal(this._settings.smokeColorRandEnd.b);
			sColor.add(new Color(r, g, b));
		});
		return dataOut;
	}

	private applyBlur(dataIn, toPixels) {
		//creates a sharp/soft paralax over time, defantly working!
		let dataOut = this.operate(dataIn, Background._selectionMask3x3, toPixels, (sColor, dColors) => {
			let cal = (property) => {
				let kern = Background._blurKernel;
				let sC = sColor[property]
				let mappedColors:IColor[] = dColors.map( c => this.outOfBounds(c.pos) ? this._settings.baseColor : c );
				let dCs = mappedColors.map( c => c[property] );
				return (kern[8]*dCs[0]) + (kern[7]*dCs[1]) + (kern[6]*dCs[2]) + (kern[5]*dCs[3]) + (kern[4]*sC) + (kern[3]*dCs[4]) + (kern[2]*dCs[5]) + (kern[1]*dCs[6]) + (kern[0]*dCs[7]);
			}

			sColor.r = cal('r');
			sColor.g = cal('g');
			sColor.b = cal('b');
		});
		return dataOut;
	}

	private draw() {
		let curData = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);

		let newPixels = [];
		for( let i = 0; i < this._settings.newPixelsPerFrame; i++ ) {
			newPixels.push(Vector2.randomRange(Vector2.zero, this._canvasSize, this._rFactory));
		}
		curData = this.addPixels(curData, newPixels);

		let smokePixels = [];
		let smokePixelsCentrePoint = Vector2.randomRange(Vector2.zero, this._canvasSize, this._rFactory);
		smokePixels = this._circleMask.map( v => v.add(smokePixelsCentrePoint) );
		curData = this.applySmoke(curData, smokePixels);

		curData = this.applyBlur(curData, smokePixels);

		this._ctx.putImageData(curData, 0, 0 );
	}

	render(dt:number) {
		this.updateCanvasSize();
		this.draw();
	}

}
