import { UpdateController } from './update.js';
import { Vector2 } from './vector.js';
import { AppendAttribute, GetWindowSize } from './util.js';
import * as mainHtml from './main.html';
import * as hostHtml from './host.html';
import './main.css';
import './host.css';
import './util.js';
import 'url-parse';


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

export class NavController {
	constructor(controller, navGraph, transitionTime) {
		this._navGraph = navGraph;
		this._curNode = null;
		this._parser = new DOMParser();
		this._transitionTime = transitionTime;
		this._entryNode = null;

		this._transitioning = false;
		this._transitionNodeFrom = null;
		this._transitionNodeTo = null;
		this._transitionDir = null;

		this._init();
		UpdateController.renderSubject.subscribe(this.updateTransition.bind(this));
		window.onpopstate = (event) => {
			if ( event.state != undefined ) {
				let location = event.state;
				let loadLocation = false;

				if ( !this._transitioning && this._curNode != null) {
					let e = Array.from(this._curNode.connections).find( e => {
						let dir = e[0];
						let node = e[1];
						return node.location == location;
					});
					if ( e != undefined ) {
						let node = e[1];
						this._transition(node);
					}
					else {
						loadLocation = true;
					}
				}
				else {
					loadLocation = true;;
				}

				if ( loadLocation ) {
					let node = this._navGraph.get(location);
					this._init();
					this.load(node);
				}
			}
		}
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
		this._transitioning = false;
		document.body.innerHTML = '';
		let main = this._loadHTML(mainHtml);
		this._append(document.body, main);
		this._entryNode = document.querySelector(EntrySelector);
		let host = this._loadHTML(hostHtml);
		this._append(this._entryNode, host);
	}

	_clickArrow(navNode) {
		if ( !this._transitioning ) {
			this._transition(navNode);
			this._pushHistory(navNode);
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

	_initArrows(hostNode, navNode) {
		let connections = navNode.connections;
		let arrows = this._getArrowNodes(hostNode);

		for( let e of arrows ) {
			let arrowDir = e[0];
			let arrowNode = e[1];

			if ( !connections.has(arrowDir) ) {
				AppendAttribute(arrowNode, 'class', ' '+NoArrowNavClass);
			}
			else {
				AppendAttribute(arrowNode, 'class', ' '+ArrowNavClass);
				arrowNode.innerText = connections.get(arrowDir).arrowText;
				arrowNode.addEventListener('click', () => this._clickArrow(connections.get(arrowDir)));
			}

		}
	}

	_pushHistory(navNode) {
		//Make a serializable version of nav node if ever store more then just the location stack in history.
		//DONT pass the navNode itself, this method attempts to do a deep copy, apart from failing to copy the hook functions, it will do a deep copy of the entire connection graph for each individual nav node. will probably end up in a circular recursion error too.
		window.history.pushState(navNode.location, navNode.arrowText, navNode.url);
	}

	load(navNode) {
		let contentNode = this._entryNode.querySelector(ContentSelector);
		contentNode.innerHTML = '';
		this._append(contentNode, this._loadHTML(navNode.viewHtml));
		this._curNode = navNode;
		navNode.onLoad();
		this._initArrows(this._entryNode, navNode);
	}

	_createTransitionNode(fromNode) {
		let rtn = document.createElement('div');
		this._append(rtn, fromNode);
		this._entryNode.appendChild(rtn);
		return rtn;
	}

	_transition(navNode) {
		if ( !this._transitioning ) {
			this._transitioning = true;

			let connection = Array.from(this._curNode.connections).find( e => e[1] == navNode );
			if ( connection != undefined ) {
				this._curNode = navNode;
				navNode.onLoad();
				this._transitionDir = connection[0];
				let transitionVector = DirVector[this._transitionDir];

				let fromNode = this._createTransitionNode(this._entryNode);

				let targetView = this._loadHTML(hostHtml);
				let contentNode = targetView.querySelector(ContentSelector);
				this._append(contentNode, this._loadHTML(navNode.viewHtml));
				this._initArrows(targetView, navNode);
				let toNode = this._createTransitionNode(targetView);

				let windowSize = new Vector2(window.innerWidth, window.innerHeight);
				let startPos = windowSize.mulv(transitionVector);

				this._transitionNodeFrom = new TransitionNode(fromNode, Vector2.Zero);
				this._transitionNodeTo = new TransitionNode(toNode, startPos);
			}
			else {
				this._transitioning = false;
				throw new Error('Cannot transistion to unconnected location from current location');
			}
		}
		else {
			throw new Error('Already Transitioning');
		}
	}

	_isTransitionFinished(dir, pos) {
		let v = dir < 2 ? pos.x : pos.y
		return dir % 2 == 0 ? v >= 0 : v <= 0;

		//switch(dir) {
		//	case Dir.West:
		//		rtn = pos.x >= 0;
		//		break;
		//	case Dir.East:
		//		rtn = pos.x <= 0;
		//		break;
		//	case Dir.South:
		//		rtn = pos.y >= 0;
		//		break;
		//	case Dir.North:
		//		rtn = pos.y <= 0;
		//		break;
		//}
	}

	updateTransition(dt) {
		if ( this._transitioning ) {
			let transitionNodes = [this._transitionNodeFrom, this._transitionNodeTo];
			for(let tNode of transitionNodes) {
				let domNode = tNode.node;
				let windowSize = GetWindowSize();
				let transitionVector = DirVector[this._transitionDir];
				let deltaV = windowSize.div(this._transitionTime).mulv(transitionVector).mul(-1*dt);
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

export class NavGraph {

	constructor(rootNavNode) {
		this._root = rootNavNode;
	}

	[Symbol.iterator]() {
		let self = this;
		return Object.freeze({
			_visited: [],
			_found: [self._root],
			next: function() {
				let rtn = {};
				if ( this._found.length > 0 ) {
					let cur = this._found.pop();
					for( let e of cur.connections ) {
						let navNode = e[1];
						if ( !this._visited.includes(navNode) ) {
							this._found.push(navNode);
						}
					}
					this._visited.push(cur);
					rtn.value = cur;
					rtn.done = false;
				}
				else {
					rtn.done = true;
				}
				return Object.freeze(rtn);
			}
		});
	}

	get(location) {
		return Array.from(this).find( e => e.location == location );
	}

	getFromUrl(urlStr) {
		let rtn = this._root;

		let url = new URL(urlStr);
		let path = url.pathname;
		path = path.slice(1);

		let navNode = Array.from(this).find( e => e.url == path );
		if ( navNode != undefined ) {
			rtn = navNode;
		}

		return rtn;
	}

}

export class NavNode {

	constructor(location, viewHtml, arrowText, url) {
		this._location = location;
		this._connections = new Map();
		this._viewHtml = viewHtml;
		this._arrowText = arrowText;
		this._onLoadFunc = null;
		this._url = url;
	}

	get url() {
		return this._url;
	}

	get location() {
		return this._location;
	}

	get arrowText() {
		return this._arrowText;
	}

	get viewHtml() {
		return this._viewHtml;
	}

	get connections() {
		return new Map(this._connections);
	}

	internalSetConnection(dir, navNode) {
		this._connections.set(dir, navNode);
	}
	internalDeleteConnection(dir) {
		this._connections.delete(dir);
	}
	setConnection(dir, navNode) {
		let targetOld = navNode.connections.get(InverseDir(dir));
		if ( targetOld ) {
			targetOld.internalDeleteConnection(dir);
		}
		let myOld = this._connections.get(dir);
		if ( myOld ) {
			myOld.internalDeleteConnection(InverseDir(dir));
		}

		this.internalSetConnection(dir, navNode);
		navNode.internalSetConnection(InverseDir(dir), this);
	}
	set onLoadFunc(v) {
		this._onLoadFunc = v;
	}
	onLoad() {
		if ( this._onLoadFunc ) {
			this._onLoadFunc(this);
		}
	}

}

export const Dir = Object.freeze({
	West: 0,
	East: 1,
	North: 2,
	South: 3,
});

const DirVector = Object.freeze([
	Vector2.Right.mul(-1),
	Vector2.Right,
	Vector2.Up.mul(-1),
	Vector2.Up,
]);

const InverseDir = function(dir) {
	return dir % 2 == 0 ? dir+1 : dir-1;
}
