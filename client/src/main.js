import { Vector2 } from './vector.js';
import { Graph } from './navGraph.js';
import { NavController, TransitionCurve } from './nav.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';
import { Background } from './background.js';

//Seconds
const SlideTransitionTime = 1;

const SlideTransitionCurve = new TransitionCurve(
	[new Vector2(0, 0), new Vector2(0.25, 1), new Vector2(1, 0)],
	[new Vector2(0, 1), new Vector2(-1, -1), new Vector2(1, 1)],
);

class Main {
	constructor() {
		this._nav = new NavController(Graph, SlideTransitionTime, SlideTransitionCurve);
		this._background = new Background(document.querySelector('#background'), this._nav);
	}

	init() {
		UpdateController.start();
		let navNode = Graph.getFromUrl(document.URL);
		this._nav.load(navNode);
	}

	get navController() {
		return this._nav;
	}
}


export const Controller = new Main();
window.addEventListener('load', Controller.init.bind(Controller));
