import { Component, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition, keyframes, AnimationEvent } from '@angular/animations';

class AnimationState { 
	static CategoryView: string = 'categoryview';
	static Selected: string = 'selected';
}

@Component({
	selector: 'animationTest',
	template: `
		<div  *ngFor='let cat of categories' class=category [@categoryAnimation]='cat.state' (click)='cat.toggleState()'> 
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
export class AnimationTestComponent implements OnInit {
	categories: AnimatedCategory[];
	stateChange(category: AnimatedCategory): void {
		this.categories.forEach( (e: AnimatedCategory) => e != category ? e.resetState() : null );
	}
	ngOnInit(): void {
		this.categories = [
			new AnimatedCategory(this),
			new AnimatedCategory(this),
		]
	}
}


export class AnimatedCategory {
	constructor(private rootComponent: AnimationTestComponent) {}
	state: AnimationState = AnimationState.CategoryView;
	toggleState(): void {
		this.state == AnimationState.CategoryView ? this.state = AnimationState.Selected : this.state  = AnimationState.CategoryView;
		this.rootComponent.stateChange(this);
	}
	resetState(): void {
		this.state = AnimationState.CategoryView;
	}
}
