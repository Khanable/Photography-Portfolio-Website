import { Vector2 } from './vector.js';
import { NavController, TransitionCurve } from './nav.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';
import { Background } from './background.js';
import { ImageGL } from './image.js';
import { Graph } from './navGraph.js'

//Seconds
const SlideTransitionTime = 1;

const SlideTransitionCurve = new TransitionCurve(
	[new Vector2(0, 0), new Vector2(0.25, 1), new Vector2(1, 0)],
	[new Vector2(0, 1), new Vector2(-1, -1), new Vector2(1, 1)],
);

export class App {
	constructor() {
		this._nav = new NavController(Graph, SlideTransitionTime, SlideTransitionCurve);
		this._background = new Background(this._nav);
		let backgroundDom = document.querySelector('#background');
		this._background.setParent(backgroundDom);
		this._imageGLs = [new ImageGL(this._nav), new ImageGL(this._nav)];
	}

	init() {
		UpdateController.start();
		let navNode = Graph.getFromUrl(document.URL);
		this._nav.load(navNode);
	}

	get navController() {
		return this._nav;
	}
	get freeImageGL() {
		let n = this._imageGLs.find( e => !e.inUse);
		n.markInUse();
		return n;
	}
}

export const Controller = new App();
window.addEventListener('load', Controller.init.bind(Controller));
