import { Vector2 } from './vector.js';
import { NavController, TransitionCurve } from './nav.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';
import { Background } from './background.js';
import { Graph } from './navGraph.js'
import * as hostHtml from './nav.html';
import './main.css';
import './nav.css';

//Seconds
const SlideTransitionTime = 0.7;

const SlideTransitionCurve = new TransitionCurve(
	[new Vector2(0, 0), new Vector2(1, 0)],
	[new Vector2(0, 0), new Vector2(0, 0)],
);

export class App {
	constructor() {
		let domBackground = document.createElement('div');
		domBackground.setAttribute('id', 'mainBackground');
		document.body.appendChild(domBackground);
		let domNav = document.createElement('div');
		domNav.setAttribute('id', 'mainNavigation');
		document.body.appendChild(domNav);
		this._nav = new NavController(Graph, SlideTransitionTime, SlideTransitionCurve, domNav, hostHtml);
		this._background = new Background(this._nav, domBackground);
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

export const Controller = new App();
window.addEventListener('load', Controller.init.bind(Controller));
