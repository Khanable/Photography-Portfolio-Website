import { Component } from '@angular/core';
import { CategoriesService } from './categories.service';

@Component({
	selector: 'categories-root',
	templateUrl: './categories.component.html',
	styleUrls: [
		'./categories.component.css',
	],
})
export class CategoriesComponent {
	constructor(private CategoriesService service) {
}
