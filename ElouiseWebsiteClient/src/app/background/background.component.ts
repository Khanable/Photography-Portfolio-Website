import { Component, ElementRef, AfterViewInit, ViewEncapsulation, OnDestroy, EventEmitter, Output } from '@angular/core';
import { Background, Settings } from './background';
import { RenderService } from '../render.service';

@Component({
	selector: 'background-root',
	template: `
	`,
	styles: [
		`
		.bstyle {
			position: fixed;
			z-index: -100;
			top: 0px;
			left: 0px;
			right: 0px;
			bottom: 0px;
			width: 100%;
			height: 100%;
		}
		`,
	],
	encapsulation: ViewEncapsulation.None,
})
export class BackgroundComponent implements AfterViewInit, OnDestroy {
	private _b: Background;
	private _renderCallBack:(dt:number) => void;

	constructor(ref:ElementRef, private readonly _render:RenderService) {
		this._b = new Background(this.ref, 'bstyle', new Settings());
		let self = this;
		this._renderCallBack = function(dt:number) {
			self.render(dt);
		}
	};

	ngAfterViewInit():void {
		this._render.addRenderCall(this._renderCallBack);
	}
	ngOnDestroy():void {
		this._render.removeRenderCall(this._renderCallBack);
	}

	render(dt:number):void {
		this._b.render(dt);
	}
}
