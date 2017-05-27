import { Injectable } from '@angular/core';
import { CategoryDisplay, CategoryDetail } from './category';

CategoryDisplay[] mockDataDisplay = [
	new CategoryDisplay(1, 'test', 'a category'),
]

CategoryDetail[] mockDataDetail = [
	new CategoryDetail(1, ['1', '2']),
]

@Injectable()
export class CategoriesService {
	getCategories(): Promise<CategoryDisplay[]> { 
		return Promise.resolve(mockDataDisplay); 
	}
	getCategory(number id): Promise<CategoryDetail> {
		return Promise.resolve(mockDataDisplay); 
	}
}
