import { UpdateController } from './update.js';
import { Vector2 } from './vector.js';
import { AppendAttribute, GetWindowSize } from './util.js';
import * as mainHtml from './main.html';
import * as hostHtml from './host.html';
import './main.css';
import './host.css';
import './util.js';


const EntrySelector = '#entry';
const ContentSelector = '#content';
const ArrowNorthSelector = '#arrowN';
const ArrowSouthSelector = '#arrowS';
const ArrowEastSelector = '#arrowE';
const ArrowWestSelector = '#arrowW';
const NoArrowNavClass = 'noArrowNav';
const ArrowNavClass = 'arrowNav';

const TransitionNodeBaseStyle = 'position:absolute;height:100%;width:100%;margin:0px;';
const TransitionNodePositionFormat = 'top:{0}px;left:{1}px;';

class TransitionNode {
	constructor(node, pos) {
		this._node = node;
		this._pos = pos;
	}
	get node() {
		return this._node;
	}

	_setTransitionNodeStyle(pos) {
		let style = TransitionNodeBaseStyle+TransitionNodePositionFormat.format(pos.y, pos.x);
		this._node.setAttribute('style', style);
	}

	set pos(v) {
		this._pos = v;
		this._setTransitionNodeStyle(v);
	}
	get pos() {
		return this._pos;
	}
}

export class ViewController {
	constructor(controller, navGraph, views, transitionTime) {
		this._navGraph = navGraph;
		this._curLocation = null;
		this._views = views;
		this._parser = new DOMParser();
		this._transitionTime = transitionTime;
		this._entryNode = null;

		this._curLocation = null;

		this._transitioning = false;
		this._transitionNodeFrom = null;
		this._transitionNodeTo = null;
		this._transitionDir = null;

		this._init();

		UpdateController.renderSubject.subscribe(this.updateTransition.bind(this));
	}

	_loadHTML(htmlStr) {
		return this._parser.parseFromString(htmlStr, 'text/html').body;
	}

	_append(rootNode, domBody) {
		while(domBody.children.length > 0 ) {
			let child = domBody.children[0];
			rootNode.appendChild(child);
		}
	}

	_init() {
		let main = this._loadHTML(mainHtml);
		this._append(document.body, main);
		this._entryNode = document.querySelector(EntrySelector);
		let host = this._loadHTML(hostHtml);
		this._append(this._entryNode, host);
	}

	_clickArrow(dir) {
		if ( !this._transitioning ) {
			let location = this._navGraph.get(this._curLocation).find( e => e.displaySideDir == dir ).index;
			this._transition(location);
		}
	}

	_getArrowNodes(hostNode) {
		let rtn = new Map();
		rtn.set(Dir.North, hostNode.querySelector(ArrowNorthSelector));
		rtn.set(Dir.South, hostNode.querySelector(ArrowSouthSelector));
		rtn.set(Dir.East, hostNode.querySelector(ArrowEastSelector));
		rtn.set(Dir.West, hostNode.querySelector(ArrowWestSelector));
		return rtn;
	}

	_initArrows(hostNode, location) {
		let connections = this._navGraph.get(location);
		let arrows = this._getArrowNodes(hostNode);

		for( let e of arrows ) {
			let arrowDir = e[0];
			let arrowNode = e[1];

			if ( !connections.some( e => e.displaySideDir == arrowDir ) ) {
				AppendAttribute(arrowNode, 'class', ' '+NoArrowNavClass);
			}
			else {
				AppendAttribute(arrowNode, 'class', ' '+ArrowNavClass);
				arrowNode.addEventListener('click', () => this._clickArrow(arrowDir));
			}

		}
	}

	load(location) {
		let contentNode = this._entryNode.querySelector(ContentSelector);
		contentNode.innerHTML = '';
		this._append(contentNode, this._loadHTML(this._views.get(location)));
		this._curLocation = location;

		this._initArrows(this._entryNode, location);
	}

	_createTransitionNode(fromNode) {
		let rtn = document.createElement('div');
		this._append(rtn, fromNode);
		this._entryNode.appendChild(rtn);
		return rtn;
	}

	_transition(location) {
		this._transitioning = true;

		let connections = this._navGraph.get(this._curLocation);
		let navPoint = connections.find( e => e.index == location );
		if ( navPoint != undefined ) {
			this._curLocation = location;
			this._transitionDir = navPoint.displaySideDir;

			let fromNode = this._createTransitionNode(this._entryNode);

			let targetView = this._loadHTML(hostHtml);
			let contentNode = targetView.querySelector(ContentSelector);
			this._append(contentNode, this._loadHTML(this._views.get(location)));
			this._initArrows(targetView, location);
			let toNode = this._createTransitionNode(targetView);

			let windowSize = new Vector2(window.innerWidth, window.innerHeight);
			let startPos = windowSize.mulv(this._transitionDir);

			this._transitionNodeFrom = new TransitionNode(fromNode, Vector2.Zero);
			this._transitionNodeTo = new TransitionNode(toNode, startPos);
		}
		else {
			throw new Error('Cannot transistion to unconnected location from current location');
		}
	}

	_isTransitionFinished(dir, pos) {
		let rtn = false;
		switch(dir) {
			case Dir.West:
				rtn = pos.x >= 0;
				break;
			case Dir.East:
				rtn = pos.x <= 0;
				break;
			case Dir.North:
				rtn = pos.y <= 0;
				break;
			case Dir.South:
				rtn = pos.y >= 0;
				break;
			default:
				throw new Error('Unknown dir type');
				break;
		}

		return rtn;
	}

	updateTransition(dt) {
		if ( this._transitioning ) {
			let transitionNodes = [this._transitionNodeFrom, this._transitionNodeTo];
			for(let tNode of transitionNodes) {
				let domNode = tNode.node;
				let windowSize = GetWindowSize();
				let deltaV = windowSize.div(this._transitionTime).mulv(this._transitionDir).mul(-1*dt);
				let v = tNode.pos.add(deltaV);
				tNode.pos = v;
			}

			if ( this._isTransitionFinished(this._transitionDir, this._transitionNodeTo.pos) ) {
				this._endTransition();
			}

		}
	}

		_endTransition() {
			this._transitioning = false;

			this._append(this._entryNode, this._transitionNodeTo.node);

			this._entryNode.removeChild(this._transitionNodeFrom.node);
			this._entryNode.removeChild(this._transitionNodeTo.node);
			this._transitionNodeFrom = null;
			this._transitionNodeTo = null;
		}
}

export class NavPoint {
	constructor(index, displaySideDir) {
		this._displaySideDir = displaySideDir;
		this._index = index;
	}

	get displaySideDir() {
		return this._displaySideDir;
	}
	get index() {
		return this._index;
	}
}

export const Dir = {
	West: Vector2.Right.mul(-1),
	East: Vector2.Right,
	North: Vector2.Up,
	South: Vector2.Up.mul(-1),
}
