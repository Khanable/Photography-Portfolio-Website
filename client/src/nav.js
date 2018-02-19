import { UpdateController } from './update.js';
import { Vector2 } from './vector.js';
import { AppendAttribute, GetWindowSize } from './util.js';
import { Subject } from 'rxjs';
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
					let connection = this._curNode.connections.find( connection => connection.node.location == location );
					if ( connection != undefined ) {
						let node = connection.node;
						let path = this._getShortestPath(node);
						this._transition(connection.dir, path);
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

	_clickArrow(dir, navNode) {
		if ( !this._transitioning ) {
			let path = this._getShortestPath(navNode);
			this._transition(dir, path);
			this._pushHistory(path);
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
		let connections = navNode.displayConnections;
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
				arrowNode.addEventListener('click', () => this._clickArrow(arrowDir, connections.get(arrowDir)));
			}

		}
	}

	_pushHistory(path) {
		//Make a serializable version of nav node if ever store more then just the location stack in history.
		//DONT pass the navNode itself, this method attempts to do a deep copy, apart from failing to copy the hook functions, it will do a deep copy of the entire connection graph for each individual nav node. will probably end up in a circular recursion error too.
		let navNode = path[path.length-1].node;
		window.history.pushState(navNode.location, navNode.arrowText, this._buildUrlPath(path));
	}

	_buildUrlPath(path) {
		//Ignore the root node url tag
		path = path.slice(1);
		let urlPath = '/'+path.map( e => e.node.url ).join('/');
		return urlPath;
	}

	_getShortestPath(navNode) {
		return this._navGraph.findPaths(this._navGraph.root, navNode).sort( (a,b) => a.length-b.length )[0];
	}

	_setDisplayPath(path) {
		for( let i = 1; i < path.length; i++ ) {
			let node = path[i-1].node;
			let connection = path[i];
			node.setDisplayConnection(connection);
		}
	}

	load(navNode) {
		let contentNode = this._entryNode.querySelector(ContentSelector);
		contentNode.innerHTML = '';
		this._append(contentNode, this._loadHTML(navNode.viewHtml));
		this._curNode = navNode;
		this._initArrows(this._entryNode, navNode);
		let path = this._getShortestPath(navNode);
		this._setDisplayPath(path);
		navNode.onLoad(contentNode);
		window.history.replaceState(navNode.location, navNode.arrowText, this._buildUrlPath(path));

	}

	_createTransitionNode(fromNode) {
		let rtn = document.createElement('div');
		this._append(rtn, fromNode);
		this._entryNode.appendChild(rtn);
		return rtn;
	}

	_transition(dir, path) {
		if ( !this._transitioning ) {
			this._transitioning = true;

			let targetNode = path[path.length-1].node;
			let connection = this._curNode.connections.find( e => e.dir == dir && e.node == targetNode );
			if ( connection != undefined ) {
				this._transitionDir = connection.dir;
				let transitionVector = DirVector[this._transitionDir];
				this._curNode = connection.node;

				let fromNode = this._createTransitionNode(this._entryNode);

				let targetView = this._loadHTML(hostHtml);
				let contentNode = targetView.querySelector(ContentSelector);
				this._append(contentNode, this._loadHTML(connection.node.viewHtml));
				let toNode = this._createTransitionNode(targetView);
				this._initArrows(toNode, connection.node);
				this._setDisplayPath(path);
				connection.node.onLoad(contentNode);


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
					for( let connection of cur.connections ) {
						let navNode = connection.node;
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

	//This method returns all paths found fromNode -> toNode in the form [FromNode, NavConnection...] to the target
	findPaths(fromNavNode, toNavNode) {
		let walkingPaths = [[fromNavNode]];
		let rtn = [];

		while( walkingPaths.length > 0 ) {
			let curPath = walkingPaths.pop();
			let curNode = curPath[curPath.length-1].node;
			let noRoute = false;
			while( !noRoute && curNode != toNavNode ) {
				let connections = curNode.connections.filter( connection => !curPath.includes(connection) );
				if ( connections.length > 0 ) {
					for( let i = 1; i < connections.length; i++ ) {
						let newPath = curPath.slice();
						newPath.push(connections[i]);
						walkingPaths.push(newPath);
					}
					curPath.push(connections[0]);
					curNode = connections[0].node;
				}
				else {
					noRoute = true;
				}
			}

			if ( !noRoute ) {
				rtn.push(curPath);
			}
		}

		return rtn;
	}

	getFromUrl(urlStr) {
		let rtn = this._root;

		let url = new URL(urlStr);
		let urlPath = url.pathname.split('/').filter( e => e != '' );

		let foundPath = true;
		let path = [this._root];
		for(let stepUrl of urlPath) {
			let cur = path[path.length-1];
			let connection = cur.connections.find( connection => connection.node.url == stepUrl);
			if ( connection != undefined && !path.includes(connection.node) ) {
				path.push(connection.node);
			}
			else {
				foundPath = false;
				break;
			}
		}

		if ( foundPath ) {
			rtn = path.pop();
		}

		return rtn;
	}

	get root() {
		return this._root;
	}

}

export class NavConnection {
	constructor(dir, navNode) {
		this._dir = dir;
		this._node = navNode;
	}
	
	get dir() {
		return this._dir;
	}

	get node() {
		return this._node;
	}
}

export class NavNode {

	constructor(location, viewHtml, arrowText, url) {
		this._location = location;
		this._connections = [];
		this._displayConnections = new Map();
		this._viewHtml = viewHtml;
		this._arrowText = arrowText;
		this._onLoadSubject = new Subject();
		this._url = url;
	}

	get url() {
		return this._url;
	}

	//Helper to make findPaths node or connection.node checks easier
	get node() {
		return this;
	}
	get dir() {
		throw new Error('This is a NavNode not a NavConnection');
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

	get displayConnections() {
		return new Map(this._displayConnections);
	}

	internalSetDisplayConnection(connection) {
		if ( this._connections.includes(connection) ) {
			this._displayConnections.set(connection.dir, connection.node);
		}
		else {
			throw new Error('not connected to nav node on dir');
		}
	}

	setDisplayConnection(connection) {
		let myConnection = connection;

		let navNode = connection.node;
		let dir = connection.dir;
		let otherConnection = navNode.connections.find( e => e.dir == InverseDir(dir) && e.node == this );

		this.internalSetDisplayConnection(myConnection);
		navNode.internalSetDisplayConnection(otherConnection);
	}

	get connections() {
		return Array.from(this._connections);
	}

	internalAddConnection(dir, navNode) {
		let connection = new NavConnection(dir, navNode);
		this._connections.push(connection);
		this.internalSetDisplayConnection(connection);
	}
	internalRemoveConnection(connection) {
		if ( this._connections.includes(connection) ) {
			this._connections.splice(this._connections.indexOf(connection), 1);
		}
		else {
			throw new Error('Connection not part of this node');
		}
	}
	addConnection(dir, navNode) {
		this.internalAddConnection(dir, navNode);
		navNode.internalAddConnection(InverseDir(dir), this);
	}
	get onLoadSubject() {
		return this._onLoadSubject;
	}
	onLoad(domNode) {
		this._onLoadSubject.next(this, domNode);
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
