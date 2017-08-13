import { Component } from '@angular/core';

import { NavigationControlService } from '../navigation-control.service';
import { NavigationControl, NavigationControlDir, SlideAnimation } from '../navigationControl'

/*
		'(@slideAnimation.start)': '_nav.startAnimation()',
		'(@slideAnimation.end)': '_nav.endAnimation()',
 */
@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
	styleUrls: ['./index.component.css'],
	animations: [SlideAnimation],
	host: {
		'[@slideAnimation]': '_nav.animateType',
		'(@slideAnimation.done)': '_nav.endAnimation()',
		'style':'display:flex;',
	},
})
export class IndexComponent {

	constructor(private readonly _nav:NavigationControlService) {
		this._nav.controls = new Map([
			[NavigationControlDir.West, new NavigationControl('about', 'About')],
		]);
		this._nav.updateAnimationType();
	}
}
