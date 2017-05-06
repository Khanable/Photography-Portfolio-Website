import { Component } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
	selector: 'animationTest',
	templateUrl: './animation-test.component.html',
	styleUrls: [
		'./animation-test.component.css',
	],
	animations: [
		trigger('eleState', [
			state('inactive', style({
				backgroundColor: '#eee',
				transform: 'scale(1)'
			})),
			state('active', style({
				backgroundColor: '#cfd8dc',
				transform: 'scale(1.1)',
			})),
			transition('inactive => active', animate('100ms ease-in')),
			transition('active => inactive', animate('100ms ease-out')),
		])
	]
})
export class AnimationTestComponent {
	state: String = 'inactive';
	toggleState(): void {
		this.state == 'inactive' ? this.state = 'active' : this.state = 'inactive';
	}
}
