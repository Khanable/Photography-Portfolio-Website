import { Component, AfterViewInit, ElementRef, OnDestroy, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { IRenderComponent } from './IRenderComponent';

declare const fclogo;

@Component({
	selector: 'fclogo-root',
	template: `
	`,
	styles: [
		`
	.fclogo {
		width: 50px;
		height: 50px;
	}
		`
	],
	encapsulation: ViewEncapsulation.None,
})
export class FCLogoComponent implements IRenderComponent, AfterViewInit, OnDestroy {
	@Output() renderAdd: EventEmitter<IRenderComponent>;
	@Output() renderRemove: EventEmitter<IRenderComponent>;
	private _logo:any;

	constructor(private ref: ElementRef) {
		this.renderAdd = new EventEmitter<IRenderComponent>();
		this.renderRemove = new EventEmitter<IRenderComponent>();
		//this._logo = new fclogo.Logo(ref.nativeElement, 'fclogo');
	}


	ngAfterViewInit(): void {
		this.renderAdd.emit(this);
	}

	ngOnDestroy(): void {
		this.renderRemove.emit(this);
	}

	render(dt:number):void {
		//this._logo.render(dt);
	}
}
