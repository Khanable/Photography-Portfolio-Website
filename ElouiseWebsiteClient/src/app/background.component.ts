import { Component, ElementRef, AfterViewInit, ViewEncapsulation, OnDestroy, EventEmitter, Output } from '@angular/core';
import { Background, Settings } from './background';
import { IRenderComponent } from './IRenderComponent';

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
export class BackgroundComponent implements IRenderComponent, AfterViewInit, OnDestroy {
	private _b: Background;

	@Output() renderAdd: EventEmitter<IRenderComponent>;
	@Output() renderRemove: EventEmitter<IRenderComponent>;

	constructor(private ref:ElementRef) {
		this._b = new Background(this.ref, 'bstyle', new Settings());
		this.renderAdd = new EventEmitter<IRenderComponent>();
		this.renderRemove = new EventEmitter<IRenderComponent>();
	};

	ngAfterViewInit():void {
		this.renderAdd.emit(this);
	}
	ngOnDestroy():void {
		this.renderRemove.emit(this);
	}

	render(dt:number):void {
		this._b.render(dt);
	}
}
