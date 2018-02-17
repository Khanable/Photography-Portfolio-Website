import { NavGraph, Views } from './navGraph.js';
import { ViewController } from './view.js';
import { GetViewFromUrl } from './nav.js';
import { UpdateController } from './update.js';

//Seconds
const TransitionTime = 0.8;

class Main {
	constructor() {
		this._view = new ViewController(this, NavGraph, Views, TransitionTime);
	}

	init() {
		UpdateController.start();
		let location = GetViewFromUrl();
		this._view.load(location);
	}
}


export const Controller = new Main();
window.addEventListener('load', Controller.init.bind(Controller));
