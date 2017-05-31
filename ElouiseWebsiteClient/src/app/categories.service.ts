import { Injectable } from '@angular/core';
import { CategoryDisplay, CategoryDetail } from './category';

const mockDataDisplay : CategoryDisplay[] = [
	new CategoryDisplay(1, 'test', 'a category'),
	new CategoryDisplay(2, 'test', 'a category'),
	new CategoryDisplay(3, 'test', 'a category'),
];

const mockDataDetail : CategoryDetail[] = [
	new CategoryDetail(1, ['1', '2']),
];

@Injectable()
export class CategoriesService {
	getCategories(): Promise<CategoryDisplay[]> { 
		return Promise.resolve(mockDataDisplay); 
	}
	getCategory(id:number): Promise<CategoryDetail> {
		return Promise.resolve(mockDataDetail[id]); 
	}
}
