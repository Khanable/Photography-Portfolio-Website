import { Vector2 } from './vector.js';
import { Graph } from './navGraph.js';
import { NavController, TransitionCurve } from './nav.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';

//Seconds
const SlideTransitionTime = 2;

const SlideTransitionCurve = new TransitionCurve(
	[new Vector2(0, 0), new Vector2(0.25, 1), new Vector2(1, 0)],
	[new Vector2(0, 1), new Vector2(-1, -1), new Vector2(1, 1)],
);

class Main {
	constructor() {
		this._view = new NavController(this, Graph, SlideTransitionTime, SlideTransitionCurve);
	}

	init() {
		UpdateController.start();
		let navNode = Graph.getFromUrl(document.documentURI);
		this._view.load(navNode);
	}
}


const Controller = new Main();
window.addEventListener('load', Controller.init.bind(Controller));
