import * as CubicHermiteSpline from 'cubic-hermite-spline';
import { UpdateController } from './update.js';
import { Vector2 } from './vector.js';
import { AppendDomNodeChildren, AppendAttribute, GetElementSize, LoadHtml } from './util.js';
import { Subject, ReplaySubject } from 'rxjs';
import { Matrix3 } from './matrix';
import './util.js';
import 'url-parse';


const ContentSelector = '#navContent';
const ArrowNorthSelector = '#navArrowN';
const ArrowSouthSelector = '#navArrowS';
const ArrowEastSelector = '#navArrowE';
const ArrowWestSelector = '#navArrowW';
const NoArrowNavClass = 'navNoArrowNav';
const ArrowNavClass = 'navArrowNav';
const NavWindowPathSelector = '#navPathMask';

const NavSlideControlSize = 40;
const NavSlideBendAmount = 20;
const TransitionNodeBaseStyle = 'position:absolute;height:100%;width:100%;margin:0px;';
const TransitionNodePositionFormat = 'top:{0}px;left:{1}px;';
const CornerCurveFactor = 0.1;

export class TransitionCurve {
	constructor(points, tangents) {
		this._points = points.map( e => Array.from(e) );
		this._tangents = tangents.map ( e => Array.from(e) );
	}

	interpolate(t) {
		return CubicHermiteSpline(t, this._points, this._tangents);
	}
}

class TransitionNode {
	constructor(node, incomming, direction, curve, navNode, domContentNode, entryDomNode) {
		this._node = node;
		this._incomming = incomming;
		this._direction = direction;
		this._curve = curve;
		this._navNode = navNode;
		this._domContentNode = domContentNode;
		this._domRoot = entryDomNode;

		this._setTransitionNodeStyle(this._getStartPos());
	}

	_getStartPos() {
		let windowSize = GetElementSize(this._domRoot);
		return this._incomming ? windowSize.mul(this._getTransitionVector()) : Vector2.Zero;
	}

	_getTransitionVector() {
		return DirVector[this._direction];
	}
	_setTransitionNodeStyle(pos) {
		let style = TransitionNodeBaseStyle+TransitionNodePositionFormat.format(pos.y, pos.x);
		this._node.setAttribute('style', style);
	}

	interpolate(t) {
		let startPos = this._getStartPos();
		let windowSize = GetElementSize(document.body);
		let transitionVector = this._getTransitionVector();
		let v = this._curve.interpolate(t)[0];
		let pos = startPos.add( windowSize.mul(-v).mul(transitionVector) );
		this._setTransitionNodeStyle(pos);
	}

	get node() {
		return this._node;
	}
	get navNode() {
		return this._navNode;
	}
	get domContentNode() {
		return this._domContentNode;
	}

	end() {
		if ( this._incomming ) {
			this._setTransitionNodeStyle(Vector2.Zero);
		}
	}
}

export class NavController {
	constructor(navGraph, transitionTime, transitionCurve, domElement, baseHtml) {
		this._navGraph = navGraph;
		this._curNode = null;
		this._curNodeDomContent = null;
		this._transitionTime = transitionTime;
		this._transitionCurve = transitionCurve;
		this._domRoot = domElement;

		this._transitioning = false;
		this._transitionNodeFrom = null;
		this._transitionNodeTo = null;
		this._transitionT = 0;

		this._transitioningSubject = new ReplaySubject(1);
		this._transitioningSubject.next(false);

		this._domHost = LoadHtml(baseHtml);

		this._init();
		UpdateController.updateSubject.subscribe(this._updateTransition.bind(this));
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

		window.addEventListener('resize', this._resize.bind(this));
	}

	_resizePathView() {
		let paths = [];

		if ( !this._transitioning && this._curNode != null ) {
			let path = this._domRoot.querySelector(NavWindowPathSelector);
			paths.push(path);
		}
		else {
			let transitionNodes = this._getTransitionNodeCollection();
			for(let tNode of transitionNodes) {
				let path = tNode.node.querySelector(NavWindowPathSelector);
				paths.push(path);
			}
		}

		let boundsSize = GetElementSize(this._domRoot).sub(NavSlideControlSize*2);
		let right = new Vector2(boundsSize.x, 0);
		let top = new Vector2(0, boundsSize.y);
		let scale = boundsSize.x < boundsSize.y ? boundsSize.x : boundsSize.y;
		scale/=2;
		let points = [
			new Vector2(CornerCurveFactor, 0).mul(scale),
			new Vector2(-CornerCurveFactor, 0).mul(scale).add(right),
			new Vector2(0, CornerCurveFactor).mul(scale).add(right),
			new Vector2(0, -CornerCurveFactor).mul(scale).add(boundsSize),
			new Vector2(-CornerCurveFactor, 0).mul(scale).add(boundsSize),
			new Vector2(0, -CornerCurveFactor).mul(scale).add(top),
			new Vector2(CornerCurveFactor, 0).mul(scale).add(top),
			new Vector2(0, CornerCurveFactor).mul(scale),
		];
		points = points.map( e => e.add(NavSlideControlSize) );

		let bend = new Vector2(NavSlideBendAmount, 0);
		let defs = [];
		for( let i = 0; i < 1; i++ ) {
			let b = i*2;
			let lp = points[b];
			let rp = points[b+1];
			let dir = rp.sub(lp).normalize();
			let rotDir = bend.rotate(-0.785*2);
			let lHandle = dir.mul(NavSlideBendAmount).add(lp).add(rotDir);
			let rHandle = dir.mul(-NavSlideBendAmount).add(rp).add(rotDir);

			if ( i == 0 ) {
				defs.push('M {0} {1}'.format(lp.x, lp.y));
				defs.push('C {0} {1}, {2} {3}, {4} {5}'.format(lHandle.x, lHandle.y, rHandle.x, rHandle.y, rp.x, rp.y));
			}
			else {
				defs.push('S {0} {1}, {2} {3}'.format(lHandle.x, lHandle.y, lp.x, lp.y));
				defs.push('S {0} {1}, {2} {3}'.format(rHandle.x, rHandle.y, rp.x, rp.y));
			}
		}
		paths.forEach( e => e.setAttribute('d', defs.join(' ')) );
	}


	_resize() {
		if ( !this._transitioning && this._curNode != null ) {
			this._curNode.onResize(this._curNodeDomContent);
			let path = this._domRoot.querySelector(NavWindowPathSelector);
			paths.push(path);
		}
		else {
			let transitionNodes = this._getTransitionNodeCollection();
			for(let tNode of transitionNodes) {
				tNode.navNode.onResize(tNode.domContentNode);
				let path = tNode.node.querySelector(NavWindowPathSelector);
				paths.push(path);
			}
		}
		this._resizePathView();
	}

	_append(rootNode, domBody) {
		AppendDomNodeChildren(rootNode, domBody);
	}

	get transitioning() {
		return this._transitioningSubject;
	}

	_init() {
		this._transitioning = false;
		this._domRoot.innerHTML = '';
		let host = this._domHost.cloneNode(true);
		this._append(this._domRoot, host);
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
				arrowNode.addEventListener('click', () => this._clickArrow(arrowDir, connections.get(arrowDir).node));
			}

		}
	}

	_pushHistory(path) {
		//Make a serializable version of nav node if ever store more then just the location stack in history.
		//DONT pass the navNode itself, this method attempts to do a deep copy, apart from failing to copy the hook functions, it will do a deep copy of the entire connection graph for each individual nav node. will probably end up in a circular recursion error too.
		let navNode = path[path.length-1].node;
		window.history.pushState(navNode.location, navNode.location.toString(), this._buildUrlPath(path));
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
		if ( this._curNode != null ) {
			this._curNode.onUnload();
		}
		let contentNode = this._domRoot.querySelector(ContentSelector);
		contentNode.innerHTML = '';
		this._append(contentNode, navNode.viewDom);
		this._curNode = navNode;
		this._curNodeDomContent = contentNode;
		navNode.onLoad(contentNode);
		this._initArrows(this._domRoot, navNode);
		let path = this._getShortestPath(navNode);
		this._setDisplayPath(path);
		window.history.replaceState(navNode.location, navNode.location.toString(), this._buildUrlPath(path));
		//this._transitioningSubject.next(true);
		this._resizePathView();

	}

	_createTransitionNode(fromNode) {
		let rtn = document.createElement('div');
		this._append(rtn, fromNode);
		this._domRoot.appendChild(rtn);
		return rtn;
	}

	_transition(dir, path) {
		if ( !this._transitioning ) {
			this._transitioning = true;
			this._transitioningSubject.next(true);

			let targetNode = path[path.length-1].node;
			let connection = this._curNode.connections.find( e => e.dir == dir && e.node == targetNode );
			if ( connection != undefined ) {
				this._transitionT = 0;
				let fromNavNode = this._curNode;
				let fromContentDomNode = this._curNodeDomContent;

				let fromNode = this._createTransitionNode(this._domRoot);
				this._transitionNodeFrom = new TransitionNode(fromNode, false, connection.dir, this._transitionCurve, fromNavNode, fromContentDomNode, this._domRoot);

				let targetView = this._domHost.cloneNode(true);
				let contentNode = targetView.querySelector(ContentSelector);
				this._curNode = connection.node;
				this._curNodeDomContent = contentNode;
				this._append(contentNode, connection.node.viewDom);
				let toNode = this._createTransitionNode(targetView);
				this._transitionNodeTo = new TransitionNode(toNode, true, connection.dir, this._transitionCurve, connection.node, contentNode, this._domRoot);
				connection.node.onLoad(contentNode);
				this._initArrows(toNode, connection.node);
				this._setDisplayPath(path);

				this._resizePathView();
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

	_getTransitionNodeCollection() {
		return [this._transitionNodeFrom, this._transitionNodeTo];
	}

	_updateTransition(dt) {
		if ( this._transitioning ) {
			let windowSize = GetElementSize(document.body);
			let transitionDT = dt/this._transitionTime;
			this._transitionT += transitionDT;
			if ( this._transitionT >= 1 ) {
				this._endTransition();
			}
			else {
				let transitionNodes = this._getTransitionNodeCollection();
				for(let tNode of transitionNodes) {
					tNode.interpolate(this._transitionT);
				}
			}
		}
	}

		_endTransition() {
			this._transitioning = false;
			this._transitioningSubject.next(false);
			this._transitionNodeFrom.navNode.onUnload();

			this._transitionNodeTo.end();

			this._append(this._domRoot, this._transitionNodeTo.node);
			this._domRoot.removeChild(this._transitionNodeFrom.node);
			this._domRoot.removeChild(this._transitionNodeTo.node);
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
	constructor(dir, navNode, arrowText) {
		this._dir = dir;
		this._node = navNode;
		this._arrowText = arrowText;
	}
	
	get dir() {
		return this._dir;
	}

	get node() {
		return this._node;
	}

	get arrowText() {
		return this._arrowText;
	}
}

export class NavNode {

	constructor(location, viewHtml, url) {
		this._location = location;
		this._connections = [];
		this._displayConnections = new Map();
		this._viewDom = LoadHtml(viewHtml);
		this._onLoadSubject = new Subject();
		this._onUnloadSubject = new Subject();
		this._onResizeSubject = new Subject();
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

	get viewDom() {
		return this._viewDom.cloneNode(true);
	}

	get displayConnections() {
		return new Map(this._displayConnections);
	}

	internalSetDisplayConnection(connection) {
		if ( this._connections.includes(connection) ) {
			this._displayConnections.set(connection.dir, connection);
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

	internalAddConnection(dir, navNode, arrowText) {
		let connection = new NavConnection(dir, navNode, arrowText);
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
	addConnection(dir, navNode, myArrowText, otherArrowText) {
		this.internalAddConnection(dir, navNode, myArrowText);
		navNode.internalAddConnection(InverseDir(dir), this, otherArrowText);
	}
	get onLoadSubject() {
		return this._onLoadSubject;
	}
	get onUnloadSubject() {
		return this._onUnloadSubject;
	}
	get onResizeSubject() {
		return this._onResizeSubject;
	}
	onLoad(domNode) {
		this._onLoadSubject.next(new NavNodeEventSubscription(this, domNode));
	}
	onUnload() {
		this._onUnloadSubject.next(this);
	}
	onResize(domNode) {
		this._onResizeSubject.next(new NavNodeEventSubscription(this, domNode));
	}
}

const NavNodeEventSubscription = function(navNode, domNode) {
	return Object.freeze({
		navNode: navNode,
		domNode: domNode,
	});
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
