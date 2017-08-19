import { Component, AfterViewInit, OnDestroy } from '@angular/core';

import { NavigationControlService } from './navigation-control.service';
import { RenderService } from './render.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [
		'./app.component.css',
	],
	providers: [
		NavigationControlService,
		RenderService,
	],
})
export class AppComponent implements AfterViewInit {

	constructor(private readonly _nav:NavigationControlService, private readonly _render:RenderService) {
	}

	ngAfterViewInit():void {
		this._render.startRenderLoop();
	}
	ngOnDestroy():void {
		this._render.stopRenderLoop();
	}
}
