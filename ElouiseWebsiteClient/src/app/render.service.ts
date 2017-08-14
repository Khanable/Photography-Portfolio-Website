import { Injectable } from '@angular/core';

@Injectable()
export class RenderService {
	private readonly _renderCalls:Array<()=>void>;
	private _animationFrameCallback:(dt:number) => void;

	constructor() {
		var self = this;
		this._animationFrameCallback = function(dt) {
			self._render(dt);
			window.requestAnimationFrame(self._animationFrameCallback);
		}
		
	}

	addRenderCall(call:(dt:number)=>void) {
		this._renderCalls.push(call);
	}
	removeRenderCall(call:(dt:number)=>void) {
		this._renderCalls.splice(this._renderCalls.indexOf(call), 1);
	}

	startRenderLoop():void {
		this._animationFrameCallback(0);
	}

	private _render(dt:number) {
		this._renderCalls.forEach( e => e(dt) );
	}

}
