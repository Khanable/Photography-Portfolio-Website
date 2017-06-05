import { Component, AfterViewInit } from '@angular/core';
import { trigger, state, style, animate, transition, keyframes, AnimationEvent } from '@angular/animations';
import { IRenderComponent } from './IRenderComponent';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [
		'./app.component.css',
	],
	animations: [
		trigger('menubarTrigger', [
			state('closed', style({
				transform: 'translateY(0px)',
			})),
			state('open', style({
				transform: 'translateY(-60px)',
			})),
			transition('* => closed', animate('300ms')),
			transition('* => open', animate('300ms')),
		]) 
	]
})
export class AppComponent {

	private _menubarState: string;
	get menubarState() {
		return this._menubarState;
	}
	private _ltime: number;
	private _renderList: IRenderComponent[];

	constructor() {
		this._menubarState = 'closed';
		this._renderList = [];
	}

	showMenu(): void {
		this._menubarState = 'open';
	}
	hideMenu(): void {
		this._menubarState = 'closed';
	}

	addToRenderList(renderComponent: IRenderComponent): void {
		console.log('testadd');
		this._renderList.push(renderComponent);
	}

	removeFromRenderList(renderComponent: IRenderComponent): void {
		console.log('testRemove');
		this._renderList.splice(this._renderList.indexOf(renderComponent), 1);
	}

	private _renderMainloop(time: number): void {
		let dt = (time-this._ltime)/1000;
		dt = dt > 0 ? dt : 0;
		this._ltime = time;
		this._renderList.forEach( e => ( e.render(dt) ) );
		window.requestAnimationFrame( e => ( this._renderMainloop(e) ) );
	}

	ngAfterViewInit(): void {
		this._renderMainloop(performance.now());
	}
}
