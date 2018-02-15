import { Component } from '@angular/core';

import { NavigationControlService } from '../navigation-control.service';
import { NavigationControl, NavigationControlDir, SlideAnimation } from '../navigationControl'

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
	animations: [SlideAnimation],
	host: {
		'[@slideAnimation]': '_nav.animateType',
		'(@slideAnimation.done)': '_nav.endAnimation()',
		'style':'display:flex;',
	},
})
export class AboutComponent {

	constructor(private readonly _nav:NavigationControlService) {
		this._nav.controls = new Map([
			[NavigationControlDir.East, new NavigationControl('index', 'Index')],
		]);
		this._nav.updateAnimationType();
	}

}
