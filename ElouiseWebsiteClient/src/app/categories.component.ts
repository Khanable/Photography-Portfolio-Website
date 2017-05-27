import { Component, OnInit } from '@angular/core';
import { CategoriesService } from './categories.service';
import { CategoryDisplay } from './category';

@Component({
	selector: 'categories-root',
	templateUrl: './categories.component.html',
	styleUrls: [
		'./categories.component.css',
	],
})
export class CategoriesComponent implements OnInit {
	constructor(private service : CategoriesService) {}

	private categories: CategoryDisplay[];
	ngOnInit(): void {
		this.service.getCategories().then( e => this.categories = e );
	}
}
