import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'menubar-root',
	templateUrl: './menubar.component.html',
	styleUrls: [
		'./menubar.component.css',
	],
})
export class MenuBarComponent {
	constructor(private router: Router) {}

	gotoAbout():void {
		this.router.navigate(['/about'])
	}
}
