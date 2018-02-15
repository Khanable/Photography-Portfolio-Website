import { Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, OnInit } from '@angular/core';
import { Background, Settings } from './background';
import { RenderService } from '../render.service';

@Component({
	selector: 'background-root',
	template: `
	<canvas #canvas></canvas>
	`,
	styles: [
		`
		canvas {
			position: absolute;
			z-index: -1;
			width: 100%;
			height: 100%;
		}
		`,
	],
})
export class BackgroundComponent implements AfterViewInit, OnDestroy, OnInit {
	private _b: Background;
	private _renderCallBack:(time:number, dt:number) => void;
	@ViewChild('canvas') private readonly _canvas:ElementRef;

	constructor(private readonly _render:RenderService) {
		let self = this;
		this._renderCallBack = function(time:number, dt:number) {
			self.render(time, dt);
		}
	};

	ngOnInit():void {
		this._b = new Background(this._canvas.nativeElement, new Settings());
	}

	ngAfterViewInit():void {
		this._render.addRenderCall(this._renderCallBack);
	}
	ngOnDestroy():void {
		this._render.removeRenderCall(this._renderCallBack);
	}

	render(time:number, dt:number):void {
		this._b.render(time, dt);
	}
}
