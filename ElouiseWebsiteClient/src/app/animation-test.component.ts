import { Component } from '@angular/core';
import { trigger, state, style, animate, transition, keyframes, AnimationEvent } from '@angular/animations';

class AnimationState { 
	static CategoryView: string = 'categoryview';
	static Selected: string = 'selected';
}

@Component({
	selector: 'animationTest',
	templateUrl: './animation-test.component.html',
	styleUrls: [
		'./animation-test.component.css',
	],
	animations: [
		trigger('eleState', [
			state(AnimationState.CategoryView, style({
				backgroundColor: '#eee',
				transform: 'scale(1)'
			})),
			state(AnimationState.Selected, style({
				backgroundColor: '#cfd8dc',
				transform: 'scale(1.1)',
			})),
			transition('* => selected', animate('100ms ease-in')),
			transition('* => categoryview', 
				animate('100ms ease-out', keyframes([
					style({
						transform: 'translatex(90px)',
						offset: 0,
					}),
					style({
						transform: 'translatex(-90px)',
						offset: 1,
					}),
			]))),
		])
	]
})
export class AnimationTestComponent {
	categories: Category[] = [
		new Category(),
		new Category(),
	];
}


class Category {
	animationState: AnimationState = AnimationState.CategoryView;
	toggleAnimationState(): void {
		this.animationState == AnimationState.CategoryView ? this.animationState = AnimationState.Selected : this.animationState  = AnimationState.CategoryView;
	}
	animationStart(e: AnimationEvent): void {
		console.log('start');
	}
}
