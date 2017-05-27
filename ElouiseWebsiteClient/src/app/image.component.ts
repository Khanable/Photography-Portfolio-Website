import { Component } from '@angular/core';
import { CategoriesService } from './categories.service';

@Component({
	selector: 'image-root',
	templateUrl: './image.component.html',
	styleUrls: [
		'./image.component.css',
	]
})
export class ImageComponent {
	constructor(private CategoriesService service) {}
}
