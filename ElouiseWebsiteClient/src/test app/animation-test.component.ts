import { Component, EventEmitter, Output, Input } from '@angular/core';
import { trigger, state, style, animate, transition, keyframes, AnimationEvent } from '@angular/animations';

class AnimationState { 
	static CategoryView: string = 'categoryview';
	static Selected: string = 'selected';
}

@Component({
	selector: 'animationTest',
	template: `
		<my-category  *ngFor='let cat of categories' [id]='cat' (what)='test()'>
		</my-category>
	`,
})
export class AnimationTestComponent {
	categories: number[] = [1, 2];
	test(): void {
		console.log('caught event');
	}
}


@Component({
	selector: 'my-category',
	template: `
		<div class=category [@categoryAnimation]='state' (click)='toggleState()' >
			{{id}}
		</div>
	`,
	styles: [
		`.category {
			width: 200px;
			height: 200px;
			background-color: black;
		}`,
	],
	animations: [
		trigger('categoryAnimation', [
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
export class Category {
	@Input() id: number;
	@Output('what') toCategoryView: EventEmitter<Category> = new EventEmitter<Category>();

	state: AnimationState = AnimationState.CategoryView;
	toggleState(): void {
		this.state == AnimationState.CategoryView ? this.state = AnimationState.Selected : this.state  = AnimationState.CategoryView;
		this.toCategoryView.emit(this);
	}
}
