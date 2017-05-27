import { Component } from '@angular/core';
import { CategoriesService } from './categories.service.ts';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [
		'./app.component.css',
	],
	providers: [ CategoriesService ],
})
export class AppComponent {
}
