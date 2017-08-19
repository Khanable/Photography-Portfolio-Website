import { Injectable } from '@angular/core';

@Injectable()
export class RenderService {
	private readonly _renderCalls:Array<(time:number, dt:number)=>void> = [];
	private _animationFrameCallback:(time:number) => void;
	private _loop:boolean = false;
	private _lTime:number = 0;

	constructor() {
		var self = this;
		this._animationFrameCallback = function(time) {
			if ( self._loop ) {
				self._render(time);
				window.requestAnimationFrame(self._animationFrameCallback);
			}
		}
		
	}

	addRenderCall(call:(time:number, dt:number)=>void) {
		this._renderCalls.push(call);
	}
	removeRenderCall(call:(time:number, dt:number)=>void) {
		this._renderCalls.splice(this._renderCalls.indexOf(call), 1);
	}

	startRenderLoop():void {
		this._loop = true;
		this._animationFrameCallback(0);
	}

	stopRenderLoop():void {
		this._loop = false;
	}

	private _render(time:number) {
		let dt = time-this._lTime;
		this._lTime = time;
		dt/=1000;
		time/=1000;
		this._renderCalls.forEach( e => e(time, dt) );
	}

}
