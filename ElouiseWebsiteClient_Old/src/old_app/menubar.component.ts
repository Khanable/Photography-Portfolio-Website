import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { IRenderComponent } from './IRenderComponent';

@Component({
	selector: 'menubar-root',
	templateUrl: './menubar.component.html',
	styleUrls: [
		'./menubar.component.css',
	],
})
export class MenuBarComponent {
	@Output() renderAdd: EventEmitter<IRenderComponent>;
	@Output() renderRemove: EventEmitter<IRenderComponent>;

	constructor(private router: Router) {
		this.renderAdd = new EventEmitter<IRenderComponent>();
		this.renderRemove = new EventEmitter<IRenderComponent>();
	}

	forwardAdd(e:IRenderComponent): void {
		this.renderAdd.emit(e);
	}

	forwardRemove(e:IRenderComponent): void {
		this.renderAdd.emit(e);
	}

	gotoAbout():void {
		this.router.navigate(['/about'])
	}
}
