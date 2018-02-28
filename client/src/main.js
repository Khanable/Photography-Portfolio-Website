import { Vector2 } from './vector.js';
import { NavController, TransitionCurve } from './nav.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';
import { Background } from './background.js';
import { Graph } from './navGraph.js'
import { GLRenderer } from './glRenderer.js'
import * as hostHtml from './host.html';

//Seconds
const SlideTransitionTime = 1;

const SlideTransitionCurve = new TransitionCurve(
	[new Vector2(0, 0), new Vector2(0.25, 1), new Vector2(1, 0)],
	[new Vector2(0, 1), new Vector2(-1, -1), new Vector2(1, 1)],
);

export class App {
	constructor() {
		this._nav = new NavController(Graph, SlideTransitionTime, SlideTransitionCurve, document.body, hostHtml);
		this._background = new Background(this._nav, document.body);
		this._glRenderer = new GLRenderer();
	}

	init() {
		UpdateController.start();
		let navNode = Graph.getFromUrl(document.URL);
		this._nav.load(navNode);
	}
	get navController() {
		return this._nav;
	}
	get glRenderer() {
		return this._glRenderer;
	}
}

export const Controller = new App();
window.addEventListener('load', Controller.init.bind(Controller));
