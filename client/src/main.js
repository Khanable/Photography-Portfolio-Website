import { Vector2 } from './vector.js';
import { NavController, TransitionCurve } from './nav.js';
import { FallbackNotifier } from './fallbackNotifier.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';
import { Background } from './background.js';
import { Graph, Location } from './navGraph.js'
import { default as hostHtml } from './nav.html';
import './main.css';
import './nav.css';

//Seconds
const SlideTransitionTime = 0.5;
const AnimatedLoadSlideTransitionTime = 1.0;
const SwipeThresholdFactor = 0.2;
const SwipeChangeSlideThresholdT = 0.35;

const SlideTransitionCurve = new TransitionCurve(
	[new Vector2(0, 0), new Vector2(1, 0)],
	[new Vector2(1, 0), new Vector2(1, 0)],
);

export class App {
	constructor() {
		let domBackground = document.createElement('div');
		domBackground.setAttribute('id', 'mainBackground');
		document.body.appendChild(domBackground);
		let domNav = document.createElement('div');
		domNav.setAttribute('id', 'mainNavigation');
		document.body.appendChild(domNav);
		let fallback = new FallbackNotifier(5, 30);
		this._nav = new NavController(Graph, SlideTransitionTime, SlideTransitionCurve, domNav, hostHtml, this._performAnimatedLoad.bind(this), AnimatedLoadSlideTransitionTime, SwipeThresholdFactor, SwipeChangeSlideThresholdT);
		this._background = new Background(this._nav, domBackground);
	}

	_performAnimatedLoad(navNode) {
		let firstLoad = window.sessionStorage.getItem('firstLoad');
		if ( !firstLoad ) {
			window.sessionStorage.setItem('firstLoad', false);
			return true;
		}
		else {
			return false;
		}
	}

	init() {
		let navNode = Graph.getFromUrl(document.URL);
		this._nav.load(navNode);
		UpdateController.start();
	}
	get navController() {
		return this._nav;
	}
}

export const Controller = new App();
window.addEventListener('load', Controller.init.bind(Controller));
