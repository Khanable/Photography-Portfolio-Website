import { Component } from '@angular/core';
import { trigger, state, style, animate, transition, keyframes, AnimationEvent } from '@angular/animations';

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

	constructor() {
		this._menubarState = 'closed';
	}

	showMenu(): void {
		this._menubarState = 'open';
	}
	hideMenu(): void {
		this._menubarState = 'closed';
	}
}
