import { Component } from '@angular/core';

import { NavigationControlService } from './navigation-control.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [
		'./app.component.css',
	],
	providers: [
		NavigationControlService
	],
})
export class AppComponent {

	constructor(private readonly _nav:NavigationControlService) {}

}
