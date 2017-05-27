import { Component } from '@angular/core';
import { CategoriesService } from './categories.service';

@Component({
	selector: 'category-root',
	templateUrl: './category.component.html',
	styleUrls: [
		'./category.component.css',
	]
})
export class CategoryComponent {
	constructor(private service : CategoriesService) {}
}
