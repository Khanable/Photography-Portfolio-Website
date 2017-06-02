import { Component, ElementRef, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Background, Settings } from './background';

@Component({
	selector: 'background-root',
	template: `
	`,
	styles: [
		`
		.bstyle {
			width: 300px;
			height: 300px;
		}
		`,
	],
	encapsulation: ViewEncapsulation.None,
})
export class BackgroundComponent {
	private _b: Background;

	constructor(private ref:ElementRef) {
		this._b = new Background(this.ref, 'bstyle', new Settings());
	};

	ngAfterViewInit():void {
		this._b.start();
	}
	ngOnDestroy():void {
		this._b.stop();
	}
}
