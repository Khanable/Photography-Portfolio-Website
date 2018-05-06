import { Vector2 } from './vector.js';
import { NavController, TransitionCurve } from './nav.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';
import { Background } from './background.js';
import { Graph, Location } from './navGraph.js'
import { default as hostHtml } from './nav.html';
import { FallbackNotifier } from './fallbackNotifier.js';
import { ForceLoadingKey } from './image.js';
let URLParse = require('url-parse');
import './main.css';
import './nav.css';
import { Message } from './message.js';

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
		this._nav = null;
		this._background = null;
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
		this.startSettings();
		let domBackground = document.createElement('div');
		domBackground.setAttribute('id', 'mainBackground');
		document.body.appendChild(domBackground);
		let domNav = document.createElement('div');
		domNav.setAttribute('id', 'mainNavigation');
		document.body.appendChild(domNav);
		this._nav = new NavController(Graph, SlideTransitionTime, SlideTransitionCurve, domNav, hostHtml, this._performAnimatedLoad.bind(this), AnimatedLoadSlideTransitionTime, SwipeThresholdFactor, SwipeChangeSlideThresholdT);
		this._background = new Background(this._nav, domBackground);
		let navNode = Graph.getFromUrl(document.URL);
		this._nav.load(navNode);
		UpdateController.start();
	}
	get navController() {
		return this._nav;
	}

	startSettings() {
		let url = new URLParse(document.URL);
		let fallback = /fallback=(true|false)/.exec(url.query);
		let forceLoading = /forceLoading=(true|false)/.exec(url.query);
		let local = window.localStorage;
		if ( fallback ) {
			FallbackNotifier.loadHardSetting(true, fallback[1] == 'true' ? true : false);
		}
		else {
			FallbackNotifier.loadHardSetting(false);
		}

		let showForceLoadingMessage = false;
		if ( forceLoading ) {
			let setting = forceLoading[1] == 'true' ? true : false;
			if ( setting ) {
				local.setItem(ForceLoadingKey, 'true');
				showForceLoadingMessage = true;
			}
			else {
				local.removeItem(ForceLoadingKey);
			}
		}
		if ( showForceLoadingMessage || local.getItem(ForceLoadingKey) ) {
			Message.showMessage('Force loading indicator enabled');
		}

	}
}

export const Controller = new App();
window.addEventListener('load', Controller.init.bind(Controller));
