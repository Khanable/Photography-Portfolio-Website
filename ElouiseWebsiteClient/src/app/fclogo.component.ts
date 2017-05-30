import { Component, AfterViewInit, ElementRef } from '@angular/core';


@Component({
	selector: 'fclogo-root',
	template: `
		<div id=fclogo></div>
	`,
	styles: [
	],
})
export class FCLogoComponent implements AfterViewInit {
	constructor(private ref: ElementRef) {}
	ngAfterViewInit(): void {
		let s = document.createElement("script");
		s.type = "text/javascript";
		s.innerHTML = this.script;
		this.ref.nativeElement.appendChild(s);
	}
	script:string = `
/* 
 * Options
 */
var options = {
	selectorID: 'fclogo',
}

/* 
 * Settings
 */
var settings = {
	canvasSize: { x: 200, y: 200 },
	borderSegmentTMod: -0.2,
	rotateSpeed: 0.4,
	borderRectHeight: 6,
	borderRectWidthAdjust: -2.5,
	borderRadius: 50,
	colorPalate: [ 'red', 'black' ],
	numBlocks: 8,
	textRadius: 15,
	textHeight: 20,
	textSize: 5,
	debug: false,
	keyFrames: [
		{v: 0, t: 0},
		{v: 6.28, t: 1},
	],
}

/*
 * support utilities
 */
Math.lerp = function(v1, v2, t) {
	return (1-t) * v1+t * v2;
}

Math.wrap = function(value, min, max) {
	var rangeDiff = max - min;
	var valueToRange = value - min;
	var rangeOffset = valueToRange%rangeDiff;
	if ( valueToRange < 0 ) {
		rangeOffset+=rangeDiff;
	}
	return min+rangeOffset;
}
Math.clamp = function(v, min, max) {
	return Math.min(max, Math.max(v, min));
}

function KeyFrames() {
	this._frames = [];
}
KeyFrames.prototype = {};
KeyFrames.prototype.next = function(oldT, dt) {
	let t =	Math.clamp(oldT+dt, this._frames[0].t, this._frames[this._frames.length-1].t);
	let frameIndex = null;
	for( let i = 1; i < this._frames.length; i++ ) {
		if ( t >= this._frames[i-1].t && t <= this._frames[i].t ) {
			frameIndex = i;
			break;
		}
	}

	let v = Math.lerp( this._frames[frameIndex-1].v, this._frames[frameIndex].v, t );

	return {
		t: t,
		v: v,
	};
}
KeyFrames.prototype.newFrame = function(v, t) {
	this._frames.push( { v: v, t: t } );
}

function Vector2(x, y) {
	this.x = x;
	this.y = y;
}
Vector2.prototype = {};
Vector2.prototype.mag = function() {
	return Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) );
}
Vector2.prototype.sub = function(v) {
	return new Vector2(v.x-this.x, v.y-this.y);
}
Vector2.prototype.rotate = function(angle) {
	return new Vector2(this.x*Math.cos(angle)-this.y*Math.sin(angle), this.x*Math.sin(angle)+this.y*Math.cos(angle));
}
Vector2.prototype.scale = function(s) {
	return new Vector2(this.x*s, this.y*s);
}
Vector2.prototype.add = function(v) {
	return new Vector2(this.x+v.x, this.y+v.y);
}

/*
 * Canvas Drawing
 */
function CanvasEnv(ctx, settings) {
	this._ctx = ctx;
	this._settings = settings;
	this._keyFrames = new KeyFrames();
	this._elementsT = new Array(settings.numBlocks).fill(0);
	this._textT = 0;
	this._elementR = 0;
	//this._numLoops = Math.floor(this._settings.numBlocks * Math.abs(this._settings.borderSegmentTMod));
	this._numLoops = Math.floor( (settings.rotateSpeed + settings.borderSegmentTMod)*10 )/2;
	this._angleStep = (Math.PI*2)/this._settings.numBlocks;
	this._scale = { x: settings.canvasSize.x/100, y: settings.canvasSize.y/100 };

	let p1 = new Vector2(0, 1).scale(settings.borderRadius);
	let p2 = p1.rotate(this._angleStep);
	let dir = p1.sub(p2);
	this._borderRectWidth = dir.mag()+settings.borderRectWidthAdjust;
	this._rectRadius = p1.add(dir.scale(0.5)).mag();

	setupFrames = (settingsProp, keyFramesProp) => settings[settingsProp].forEach( frame => this[keyFramesProp].newFrame(frame.v, frame.t) );
	setupFrames('keyFrames', '_keyFrames');
}
CanvasEnv.prototype = {};
CanvasEnv.prototype.drawRect = function(sizex, sizey, color) {
	this._ctx.fillStyle = color;
	this._ctx.fillRect(0, 0, sizex, sizey);
}
CanvasEnv.prototype.drawText = function(text, color, size) {
	this._ctx.save();
	this._ctx.fillStyle = color;
	this._ctx.textAlign = 'center';
	this._ctx.baseline = 'middle';
	this._ctx.scale(size, size);
	this._ctx.fillText(text, 0, 0);
	this._ctx.restore();
}
CanvasEnv.prototype.drawBorderRect = function(indexT, dt, color) {
	let frame = this._keyFrames.next( this._elementsT[indexT], dt * this._settings.rotateSpeed + dt * this._settings.borderSegmentTMod / this._settings.numBlocks * indexT );
	this._elementsT[indexT] = frame.t;
	this._ctx.save();
	this._ctx.rotate(this._angleStep*indexT);
	this._ctx.rotate(frame.v);
	this._ctx.translate(-this._borderRectWidth/2, this._settings.borderRectHeight/2);
	this._ctx.translate(0, -this._rectRadius);
	this.drawRect(this._borderRectWidth, this._settings.borderRectHeight, this._settings.colorPalate[color]);
	this._ctx.restore();
}
CanvasEnv.prototype.drawFC = function(dt) {
	//let frame = this._keyFrames.next( this._textT, dt * this._settings.rotateSpeed + dt * this._settings.borderSegmentTMod / this._settings.numBlocks * this._settings.numBlocks);
	//this._textT = frame.t;
	this._ctx.save();
	//this._ctx.rotate(frame.v);
	this._ctx.translate(0, this._settings.textHeight);
	this._ctx.translate(-this._settings.textRadius, 0);
	this.drawText('F', this._settings.colorPalate[0], this._settings.textSize);
	this._ctx.translate(this._settings.textRadius*2, 0);
	this.drawText('C', this._settings.colorPalate[1], this._settings.textSize);
	this._ctx.restore();

}

CanvasEnv.prototype.draw = function(dt) {
	this._ctx.setTransform(1, 0, 0, 1, 0, 0);
	this._ctx.clearRect(0, 0, this._settings.canvasSize.x, this._settings.canvasSize.y);

	this._ctx.translate(this._settings.canvasSize.x/2, this._settings.canvasSize.y/2);
	this._ctx.scale(this._scale.x, this._scale.y);

	//Black first
	for( let i = 1; i < this._settings.numBlocks ; i+=2 ) {
		this.drawBorderRect(i, dt, i % 2);
	}
	//Red On top
	for( let i = 0; i < this._settings.numBlocks ; i+=2 ) {
		this.drawBorderRect(i, dt, i % 2);
	}

	//Text
	this.drawFC(dt);

	//Loop Animation
	let markIndex = this._elementsT.length-1;
	if ( this._elementR < this._numLoops ) {
		//Reset Mark 1 loop
		if ( this._elementsT[markIndex] >= this._settings.keyFrames[1].t ) {
			this._elementsT[markIndex] = 0;
			this._elementR++;
		}
		//Continue Advancing
		for( let i = 0; i < this._elementsT.length-1; i++ ) {
			if ( this._elementsT[i] >= this._settings.keyFrames[1].t ) {
				this._elementsT[i] = 0;
			}
		}
	}
	else {
		//Wait until all blocks stopped then reset
		if ( this._elementsT.every( e => e >= this._settings.keyFrames[1].t ) ) {
			this._elementsT = new Array(this._settings.numBlocks).fill(0);
			this._elementR = 0;
		}
	}

	//debug Centre Square
	if ( this._settings.debug ) {
		this._ctx.save();
		this._ctx.translate(-2.5, -2.5);
		this._ctx.fillStyle = 'red';
		this._ctx.fillRect(0, 0, 5, 5);
		this._ctx.restore();
	}
}

/*
 * Mainloop
 */
var lastTime = 0;
function mainloop(time, env) {
	time/=1000;
	let dt = time - lastTime;
	dt = dt <= 0 ? 0 : dt;
	lastTime = time;

	env.draw(dt);

	let callback = (time) => mainloop(time, env);
	requestAnimationFrame(callback);
}

/*
 * init
 */
let root = document.getElementById(options.selectorID);
if ( !root ) {
}
let canvas = document.createElement('canvas');
canvas.setAttribute('width', settings.canvasSize.x);
canvas.setAttribute('height', settings.canvasSize.y);
root.appendChild(canvas);
let ctx = canvas.getContext('2d');
mainloop(performance.now(), new CanvasEnv(ctx, settings));
`
}
