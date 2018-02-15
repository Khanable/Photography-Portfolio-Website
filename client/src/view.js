import { UpdateController } from './update.js';
import * as mainHtml from './main.html';
import './main.css'


const EntrySelector = '#entry';
const ArrowNorthSelector = '#arrowN';
const ArrowSouthSelector = '#arrowS';
const ArrowEastSelector = '#arrowE';
const ArrowWestSelector = '#arrowW';


export class ViewController {
	constructor(controller, navGraph, views) {
		this._navGraph = navGraph;
		this._curLocation = null;
		this._views = views;
		this._parser = new DOMParser();
		this._transition = false;
		this._transitionNodes = null;

		this._initBody();

		UpdateController.renderSubject.subscribe(this.updateTransition.bind(this));
	}

	_loadHTML(htmlStr) {
		return this._parser.parseFromString(htmlStr, 'text/html').body;
	}

	_append(rootNode, domBody) {
		while( domBody.children.length > 0 ) {
			let child = domBody.children[0];
			rootNode.appendChild(child);
		}
	}

	_initBody() {
		let main = this._loadHTML(mainHtml);
		this._append(document.body, main);
	}

	load(location) {
		let entry = document.body.querySelector(EntrySelector);
		entry.innerHTML = '';
		this._append(entry, this._loadHTML(this._views.get(location)));
	}

	_createTransitionNode(fromNode) {
		let rtn = document.createElement('div');
		rtn.setAttribute('style', 'position:absolute;height:100%;width:100%;margin:0px');
		this._append(rtn, fromNode);
		document.body.appendChild(rtn);
		return rtn;
	}

	transition(location) {
		//Transition to location from current, only allow connecting hops in graph
		this._transition = true;

		let fromNode = this._createTransitionNode(document.body);

		let targetView = this._loadHTML(mainHtml);
		let targetEntry = targetView.querySelector(EntrySelector);
		this._append(targetEntry, this._loadHTML(this._views.get(location)));
		let toNode = this._createTransitionNode(targetView);


	}

	updateTransition() {
		if ( this._transition ) {
			//Move in the currect dir untill completely in view
		}
	}
}

export class NavPoint {
	constructor(index, displaySide) {
		this._displaySide = displaySide;
		this._index = index;
	}

	get displaySide() {
		return this._displaySide;
	}
	get index() {
		return this._index;
	}
}

export const DisplaySide = {
	West: 0,
	East: 1,
	North: 2,
	South: 3,
}
