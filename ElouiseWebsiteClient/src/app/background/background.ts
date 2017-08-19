import { ElementRef } from '@angular/core';

//remove?
//const wrap = function(v, s, e) {
//	let diffRange = e-s;
//	let vRange = Math.abs(v-s);
//	return (vRange%diffRange)+s;
//}

const clamp = function(v, min, max) {
	return Math.max(min, Math.min(max, v));
}

const lerp = function(t, s, e) {
	return s+t*(e-s);
}

const lerpParabola = function(t, s, e) {
	let diff = e-s;
	let cal = Math.pow((t*2)-1, 2);
	return s+(cal*diff);
}

const randomRange = function(s, e) {
	let r = Math.random();
	let diff = e-s;
	return s+(r*diff);
}

class Vector3 {
	constructor(public readonly x:number, public readonly y:number, public readonly z:number) {
	}
}

class Vector2 {
	static readonly Zero: Vector2 = new Vector2(0, 0);
	static readonly One: Vector2 = new Vector2(1, 1);

	constructor(public readonly x:number, public readonly y:number) {} 

	toIndex(size:Vector2) : number {
		return Math.floor(this.y)*Math.floor(size.x)+Math.floor(this.x);
	}

	add(v:Vector2): Vector2 { 
		return new Vector2(this.x+v.x, this.y+v.y);
	}

	distance(v:Vector2):number {
		let rel = v.sub(this);
		return rel.mag();
	}

	equals(v:Vector2):boolean {
		return this.x == v.x && this.y == v.y;
	}

	mag():number {
		return Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) );
	}

	static indexToVector(i:number, size:Vector2): Vector2 {
		return new Vector2(Math.floor(i/size.y), i%size.x);
	}

	scale(s:number): Vector2 {
		return new Vector2(this.x*s, this.y*s);
	}

	div(s:number): Vector2 {
		return new Vector2(this.x/s, this.y/s);
	}

	divV(v:Vector2): Vector2 {
		return new Vector2(this.x/v.x, this.y/v.y);
	}

	trunc():Vector2 {
		return new Vector2(Math.trunc(this.x), Math.trunc(this.y));
	}

	ceil():Vector2 {
		return new Vector2(Math.ceil(this.x), Math.ceil(this.y));
	}

	sub(v:Vector2):Vector2 {
		return new Vector2(this.x-v.x, this.y-v.y);
	}

	modV(v:Vector2) :Vector2 {
		return new Vector2(this.x%v.x, this.y%v.y);
	}

	min():number {
		return Math.min(this.x, this.y);
	}

	max():number {
		return Math.max(this.x, this.y);
	}

	//wrap(start:Vector2, end:Vector2) {
	//	return new Vector2(wrap(this.x, start.x, end.x), wrap(this.y, start.y, end.y))
	//}
	//rotate(r:number) {
	//	return new Vector2(this.x*Math.cos(r)-this.y*Math.sin(r), this.x*Math.sin(r)+this.y*Math.cos(r));
	//}
	normalize() {
		let mag = this.mag();
		return new Vector2(this.x/mag, this.y/mag);
	}

}

interface IColor {
	readonly r:number;
	readonly g:number;
	readonly b:number;
}

class Color implements IColor {
	constructor(public readonly r:number, public readonly g:number, public readonly b:number) {
		this.r = Math.trunc(clamp(this.r, 0, 255));
		this.g = Math.trunc(clamp(this.g, 0, 255));
		this.b = Math.trunc(clamp(this.b, 0, 255));
	};

	static Zero: Color = new Color(0, 0, 0);

	toStyle():string {
		return 'rgb('+this.r+','+this.g+','+this.b+')';
	}

	add(c:IColor):IColor {
		return new Color(this.r+c.r, this.g+c.g,this.b+c.b);
	}

	//static random(s:IColor, e:IColor, rFactory): IColor {
	//	let sMag = s.mag();
	//	let eMag = e.mag();
	//	let rtn = Color.from(s);

	//	let diff = eMag-sMag;
	//	let newMag = rFactory.nextIntRange(1, diff);

	//	rtn.scale(newMag);

	//	return rtn;
	//}

	mag():number {
		return Math.sqrt( Math.pow(this.r, 2) + Math.pow(this.g, 2) + Math.pow(this.b, 2) );
	}
	
	private scale(s:number):IColor {
		return new Color(this.r*s, this.g*s, this.b*s);
	}

	private normalize():IColor {
		let mag = this.mag();
		return new Color(this.r/mag, this.g/mag, this.b/mag);
	}

	static lerp(t:number, s:IColor, e:IColor):Color {
		let r = lerp(t, s.r, e.r);
		let g = lerp(t, s.g, e.g);
		let b = lerp(t, s.b, e.b);
		return new Color(r, g, b);
	}

	static lerpParabola(t:number, s:IColor, e:IColor):Color {
		let r = lerpParabola(t, s.r, e.r);
		let g = lerpParabola(t, s.g, e.g);
		let b = lerpParabola(t, s.b, e.b);
		return new Color(r, g, b);
	}

	sub(c:IColor):Color {
		return new Color(this.r-c.r, this.g-c.g, this.b-c.b);
	}

	div(s:number):Color {
		return new Color(this.r/s, this.g/s, this.b/s);
	}

	mul(s:number):Color {
		return new Color(this.r*s, this.g*s, this.b*s);
	}
	mulV(v:Vector3):Color {
		return new Color(this.r*v.x, this.g*v.y, this.b*v.z);
	}
}

class LinkedColor implements IColor {
	private readonly _index:number;
	private static readonly _numColors:number = 4;

	constructor(public readonly pos:Vector2, private readonly _data:ImageData) {
		this._index = this.pos.toIndex(new Vector2(this._data.width, this._data.height))*LinkedColor._numColors;
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
	set(c:IColor):LinkedColor{
		this.r = c.r;
		this.g = c.g;
		this.b = c.b;
		return this;
	}

	getColor():Color {
		return new Color(this.r, this.g, this.b);
	}
}


export class Settings {
	lightColor:Color = new Color(230, 230, 230);
	fallOffColorFactor:Vector3 = new Vector3(0.8, 0.8, 0.5);
	//!Lens Falloff?!
	frameFallOffFactor = 0.2;
	lensRadius:number = 80;
	flickerTimeMin:number = 2;
	flickerTimeMax:number = 4;
	flickerResolveTimeMin:number = 0.08;
	flickerResolveTimeMax:number = 0.25;
	flickerLightColorModFactorMin:number = 0.5;
	flickerLightColorModFactorMax:number = 0.8;
}

export class Background {
	private readonly _canvas;
	private readonly _ctx;
	private _canvasSize:Vector2;
	private _lastCanvasSize: Vector2;

	private _nextFlickerTime:number = 0;
	private _flickerModFactor:number = 0;
	private _flickerResolveTime:number = 0;

	private static readonly _blurKernel = [
		1/16, 2/16, 1/16,
		2/16, 4/16, 2/16,
		1/16, 2/16, 1/16,
	];

	private _flickerT:number;
	//!Implement Me!
	private readonly baseSize:Vector2 = new Vector2(1280, 720);

	constructor(canvas:ElementRef, private readonly _settings: Settings) {
		Object.freeze(this._settings);

		let start = performance.now();

		this._canvas = canvas;
		this._ctx = this._canvas.getContext('2d');

		this._canvasSize = new Vector2(0, 0);
		this._lastCanvasSize = new Vector2(0, 0);

		this.updateCanvasSize()
		this.newFlicker(0);

		console.log('start time: '+(performance.now()-start).toPrecision(3)+'ms');
	}

	private updateCanvasSize() : void {
		let style = window.getComputedStyle(this._canvas);
		this._lastCanvasSize = this._canvasSize;
		this._canvasSize = new Vector2(parseInt(style.getPropertyValue('width')), parseInt(style.getPropertyValue('height')));
		this._canvasSize = this._canvasSize.ceil();
		if ( !this._canvasSize.equals(this._lastCanvasSize) ) {
			this._canvas.setAttribute('width', this._canvasSize.x);
			this._canvas.setAttribute('height', this._canvasSize.y);
		}
	}

	private outOfBounds(pos: Vector2): boolean {
		if ( pos.x < 0 || pos.y < 0 || pos.x >= this._canvasSize.x || pos.y >= this._canvasSize.y ) {
			return true;
		}
		return false;
	}

	private newFlicker(time) {
		let s = this._settings;
		this._nextFlickerTime = time+randomRange(s.flickerTimeMin, s.flickerTimeMax);
		this._flickerResolveTime = randomRange(s.flickerResolveTimeMin, s.flickerResolveTimeMax);
		this._flickerModFactor = randomRange(s.flickerLightColorModFactorMin, s.flickerLightColorModFactorMax);
	}

	private draw(time:number, dt:number) {
		let curData = this._ctx.createImageData(this._canvasSize.x, this._canvasSize.y);
		let maxRadius = this._canvasSize.mag();
		let endColor = this._settings.lightColor.mulV(this._settings.fallOffColorFactor);
		let centre = this._canvasSize.scale(0.5);
		let distFromLensToFrame = maxRadius-this._settings.lensRadius;
		let flickering = time >= this._nextFlickerTime;
		let flickeringFinish = time >= this._nextFlickerTime+this._flickerResolveTime;
		let flickeringFor = 0;
		if ( flickering ) {
			flickeringFor = time - this._nextFlickerTime;
		}

		//Pixel Mainloop
		for(let y = 0; y < curData.height; y++ ) {
			for( let x = 0; x < curData.width; x++ ) {
				let curPos = new Vector2(x, y);
				let curLinkedColor = new LinkedColor(curPos, curData);
				curLinkedColor.a = 255;
				let curColor = null;
				let toCentreDistance = curPos.distance(centre);
				let fallOffFactor = 0;
				//Outside lens
				if ( toCentreDistance > this._settings.lensRadius ) {
					let distFromLensEdge = toCentreDistance-this._settings.lensRadius;
					curColor = Color.lerp(distFromLensEdge/distFromLensToFrame, endColor, endColor.mul(this._settings.frameFallOffFactor));
				}
				//Inside lens
				else {
					curColor = Color.lerp(toCentreDistance/this._settings.lensRadius, this._settings.lightColor, endColor);
				}

				//handle flicker
				if ( flickering ) {
					curColor = Color.lerpParabola(flickeringFor/this._flickerResolveTime, curColor.mul(this._flickerModFactor), curColor);
				}

				curLinkedColor.set(curColor);
			}
		}

		if ( flickeringFinish ) {
			this.newFlicker(time);
		}
		this._ctx.putImageData(curData, 0, 0);
	}


	private drawfr(dt:number) {
		this._ctx.save();
		this._ctx.fillStyle = 'white';
		this._ctx.baseline = 'middle';
		this._ctx.fillText((dt*1000).toPrecision(3)+'ms', 0, 0);
		this._ctx.restore();
	}

	render(time:number, dt:number) {
		this._ctx.setTransform(1, 0, 0, 1, 0, 0);
		//this.updateCanvasSize();
		this._ctx.clearRect(0, 0, this._canvasSize.x, this._canvasSize.y);

		this.draw(time, dt);
		//this.drawfr(dt);
	}

}
