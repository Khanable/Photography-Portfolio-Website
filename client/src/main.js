import { NavGraph, Views } from './navGraph.js';
import { ViewController } from './view.js';
import { GetViewFromUrl } from './nav.js';
import { UpdateController } from './update.js';

class Main {
	constructor() {
		this._view = new ViewController(this, NavGraph, Views);
	}

	initLoad() {
		UpdateController.start();
		//let location = GetViewFromUrl();
		this._view.load(0);
		this._view.transition(1);
	}
}


export const Controller = new Main();
window.addEventListener('load', Controller.initLoad.bind(Controller));
