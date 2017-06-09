//changes
//http://lodev.org/cgtutor/randomnoise.html
//- loading bar for prewarm if needed, woould need to handle as part of mainloop or worker thread. Could use worker thread as image data
//- profile performance
//- image fallback, (unity clouds shader, overlaping images rotating)
import { ElementRef } from '@angular/core';

declare const Random;

class Vector2 {
	static readonly zero: Vector2 = new Vector2(0, 0);

	constructor(public x:number, public y:number) {} 

	toIndex(size:Vector2) : number {
		return this.x*size.y+this.y%size.x;
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

	scale(s: number): Vector2 {
		return new Vector2(this.x*s, this.y*s);
	}

	div(s: number): Vector2 {
		return new Vector2(this.x/s, this.y/s);
	}

	trunc():Vector2 {
		return new Vector2(Math.trunc(this.x), Math.trunc(this.y));
	}

	ceil():Vector2 {
		return new Vector2(Math.ceil(this.x), Math.ceil(this.y));
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

	static zero: Color = new Color(0, 0, 0);

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
		this._index = this._pos.toIndex(new Vector2(this._data.width, this._data.height))*LinkedColor._numColors;
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

	set(c:IColor):IColor{
		this.r = c.r;
		this.g = c.g;
		this.b = c.b;
		return this;
	}
}


export class Settings {
	dropTime:number = 0;
	baseColor: Color = new Color(0, 0, 0);
	circleMaskRadius:number = 16;
	prewarmCycles:number = 1;
	newPixelsPerFrame:number = 20;
	smokeFactor:number=0.1;
	smokeColorRandStart:Color = new Color(25, 25, 25);
	smokeColorRandEnd:Color = new Color(50, 50, 50);
	scaleFactor:number =  0.5;
}

export class Background {
	private readonly _canvas;
	private readonly _ctx;
	private _canvasSize:Vector2;
	private _lastCanvasSize: Vector2;
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
	private static readonly _mask2x2:Vector2[] = [
			new Vector2(0, 0),
			new Vector2(1, 0),
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

	private readonly _noiseImages;

	constructor(root: ElementRef, style:string, private _settings: Settings) {
		let start = performance.now();

		this._root = root.nativeElement;
		this._canvas = document.createElement('canvas');
		this._canvas.className = style;
		this._ctx = this._canvas.getContext('2d');
		this._root.appendChild(this._canvas);

		this._canvasSize = new Vector2(0, 0);
		this._lastCanvasSize = new Vector2(0, 0);
		this._rFactory = new Random.RandomFactory32(performance.now(), 1);

		this.updateCanvasSize()

		this._noiseImages = [];
		this._noiseImages.push(this.createNoise());
		//this._noiseImages.push(this.createNoise());

		console.log('start time: '+(performance.now()-start).toPrecision(3)+'ms');
		console.log(this._canvasSize);

		this.draw();
	}

	private smoothNoise(pos:Vector2, data:any):number {
		let fract = new Vector2(pos.x - Math.trunc(pos.x), pos.y - Math.trunc(pos.y));

		let range = Background._mask2x2.map( v => v.add(pos) );
		//Wrap around bounds and convert to LinkedColor
		let lRange = range.map( c => this.outOfBounds(c) ? new LinkedColor( new Vector2((c.x+this._canvasSize.x) % this._canvasSize.x, (c.y+this._canvasSize.y) % this._canvasSize.y), data)  : new LinkedColor( c, data ) );

		let r = 0
		r += fract.x * fract.y * (lRange[0].r/256);
		r += (1-fract.x) * fract.y * (lRange[1].r/256);
		r += fract.x * (1-fract.y) * (lRange[2].r/256);
		r += (1-fract.x) * (1-fract.y) * (lRange[3].r/256);
		return r;
	}

	private turbulence(pos:Vector2, data:any):number {
		let startSize = 32;
		let size = startSize;
		let v = 0
		while( size >= 1 ) {
			//v += this.smoothNoise(pos.div(size), data) * size;
			v += new LinkedColor(pos.div(size).trunc(), data).r/256 * size;
			size/= 2;
		}

		return 128 * v / startSize;
	}

	private createNoise() {
		let noise = this._ctx.createImageData(this._canvasSize.x, this._canvasSize.y);

		//Random noise initalize
		for( let x = 0; x < noise.width; x++ ) {
			for( let y = 0; y < noise.height; y++ ) {
				let linkedColor = new LinkedColor(new Vector2(x, y), noise);
				linkedColor.r = Math.random()*256;
			}
		}

		let adjust = new ImageData(noise.data.slice(), noise.width, noise.height);
		//smoothing and turbulance
		for( let x = 0; x < adjust.width; x++ ) {
			for( let y = 0; y < adjust.height; y++ ) {
				let d = new LinkedColor(new Vector2(x, y), adjust);
				//d.r = new LinkedColor(d.pos.div(8).trunc(), noise).r;
				//d.r = this.smoothNoise(d.pos.div(8).trunc(), noise)*256;
				d.r = this.turbulence(d.pos.div(8).trunc(), noise);
			}
		}

		return adjust;
	}

	private fillCanvasBaseColor():void {
		this._ctx.fillStyle = this._settings.baseColor.toStyle();
		this._ctx.fillRect(0, 0, this._canvasSize.x, this._canvasSize.y);
	}

	private updateCanvasSize() : void {
		let style = window.getComputedStyle(this._canvas);
		this._lastCanvasSize = this._canvasSize;
		this._canvasSize = new Vector2(parseInt(style.getPropertyValue('width')), parseInt(style.getPropertyValue('height')));
		let max = Math.max(this._canvasSize.x, this._canvasSize.y);
		this._canvasSize = new Vector2(max, max);
		this._canvasSize = this._canvasSize.scale(this._settings.scaleFactor);
		this._canvasSize = this._canvasSize.ceil();
		if ( !this._canvasSize.equals(this._lastCanvasSize) ) {
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


	private outOfBounds(pos: Vector2): boolean {
		if ( pos.x < 0 || pos.y < 0 || pos.x >= this._canvasSize.x || pos.y >= this._canvasSize.y ) {
			return true;
		}
		return false;
	}

	private draw() {
		let curData = this._ctx.getImageData(0, 0, this._canvasSize.x, this._canvasSize.y);

		for(let x = 0; x < this._canvasSize.x; x++ ) {
			for( let y = 0; y < this._canvasSize.y; y++ ) {
				let pos = new Vector2(x, y);
				let s = new LinkedColor(pos, this._noiseImages[0]);
				let d = new LinkedColor(pos, curData);
				d.r = s.r;
				d.a = 255;
			}
		}

		this._ctx.putImageData(curData, 0, 0);
	}


	private drawfr(dt:number) {
		this._ctx.save();
		this._ctx.fillStyle = 'white';
		this._ctx.textAlign = 'left';
		this._ctx.baseline = 'middle';
		this._ctx.translate(this._canvasSize.x-75, 35);
		this._ctx.scale(2, 2);
		this._ctx.fillText(dt.toPrecision(3), 0, 0);
		this._ctx.restore();
	}

	render(dt:number) {
		this._ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.updateCanvasSize();
		//this._ctx.clearRect(0, 0, this._canvasSize.x, this._canvasSize.y);

		//this.draw();
		//this.drawfr(dt);
	}

}
