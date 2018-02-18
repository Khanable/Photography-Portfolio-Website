import { Graph } from './navGraph.js';
import { NavController } from './nav.js';
import { GetNavFromUrl } from './util.js';
import { UpdateController } from './update.js';

//Seconds
const TransitionTime = 0.8;

class Main {
	constructor() {
		this._view = new NavController(this, Graph, TransitionTime);
	}

	init() {
		UpdateController.start();
		let navNode = Graph.getFromUrl(document.documentURI);
		this._view.load(navNode);
	}
}


const Controller = new Main();
window.addEventListener('load', Controller.init.bind(Controller));
