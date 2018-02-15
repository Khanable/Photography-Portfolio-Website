import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { NavigationControlDir, NavigationControl, AnimateType } from './navigationControl';

@Injectable()
export class NavigationControlService {
	private _controls:Map<NavigationControlDir, NavigationControl> = new Map();
	private _animateType:AnimateType = AnimateType.SouthIn;
	private _startedNavigation:boolean = false;
	private _navigationLink:string = '';
  constructor(private readonly _router:Router) {}

	set controls(v:Map<NavigationControlDir, NavigationControl>) {
		//Permutation handling here to protect control input, validate the map is correct
		this._controls = new Map(v);
		//let t = Array.from(v).reduce( (acc, cv) => {
		//		acc+cv[0];
		//}, 0);
		////Only 1 of each direction
		//if ( t == 15 ) {
		//	this._controls = new Map(v);
		//}
		//else {
		//	console.log('Error: Missing a direction or duplicate direction');
		//}
	}

	private _controlSet(controls:Map<NavigationControlDir, NavigationControl>, dir:NavigationControlDir):boolean {
		let control = controls.get(dir);
		if ( control ) {
			return true;
		}
		else {
			return false;
		}
	}

	private _controlString(controls:Map<NavigationControlDir, NavigationControl>, dir:NavigationControlDir):string {
		if ( this._controlSet(controls, dir) ) {
			let c = controls.get(dir); 
			return c.name;
		}
		else {
			return 'This shouldnt display!';
		}
	}

	private _controlLink(controls:Map<NavigationControlDir, NavigationControl>, dir:NavigationControlDir):string {
		if ( this._controlSet(controls, dir) ) {
			let c = controls.get(dir);
			return c.linkPath;
		}
		else {
			return 'This is not a link! How did you click on this!';
		}
	}

	getNavigationControlState(v:number):boolean {
		let rtn = false;
		let controls = this._controls;
		switch(v) {
			case NavigationControlDir.North:
				rtn = this._controlSet(controls, NavigationControlDir.North);
				break;
			case NavigationControlDir.South:
				rtn = this._controlSet(controls, NavigationControlDir.South);
				break;
			case NavigationControlDir.East:
				rtn = this._controlSet(controls, NavigationControlDir.East);
				break;
			case NavigationControlDir.West:
				rtn = this._controlSet(controls, NavigationControlDir.West);
				break;
			default:
				console.log('Incorrect value passed to getNavigationControlState');
				break;
		}
		return rtn;
	}

	getNavigationControlString(v:number):string {
		let rtn = '';
		let controls = this._controls;
		switch(v) {
			case NavigationControlDir.North:
				rtn = this._controlString(controls, NavigationControlDir.North);
				break;
			case NavigationControlDir.South:
				rtn = this._controlString(controls, NavigationControlDir.South);
				break;
			case NavigationControlDir.East:
				rtn = this._controlString(controls, NavigationControlDir.East);
				break;
			case NavigationControlDir.West:
				rtn = this._controlString(controls, NavigationControlDir.West);
				break;
			default:
				console.log('Incorrect value passed to getNavigationControlState');
				break;
		}
		return rtn;
	}

	navigate(v:number):void {
		let controls = this._controls;
		switch(v) {
			case NavigationControlDir.North:
				this._startNavigationAnimation(AnimateType.NorthOut, this._controlLink(controls, NavigationControlDir.North));
				break;
			case NavigationControlDir.South:
				this._startNavigationAnimation(AnimateType.SouthOut, this._controlLink(controls, NavigationControlDir.South));
				break;
			case NavigationControlDir.East:
				this._startNavigationAnimation(AnimateType.EastOut, this._controlLink(controls, NavigationControlDir.East));
				break;
			case NavigationControlDir.West:
				this._startNavigationAnimation(AnimateType.WestOut, this._controlLink(controls, NavigationControlDir.West));
				break;
			default:
				console.log('Incorrect value passed to getNavigationControlState');
				break;
		}
	}

	private _startNavigationAnimation(type:AnimateType, link:string) {
		this._animateType = type;
		this._navigationLink = link;
		this._startedNavigation = true;
	}

	updateAnimationType():void {
		switch(this._animateType) {
			case AnimateType.NorthOut:
				this._animateType = AnimateType.SouthIn;
				break;
			case AnimateType.SouthOut:
				this._animateType = AnimateType.NorthIn;
				break;
			case AnimateType.EastOut:
				this._animateType = AnimateType.WestIn;
				break;
			case AnimateType.WestOut:
				this._animateType = AnimateType.EastIn;
				break;
			default:
				//console.log('Somehow an input animation type ended up here');
				break;
		}
		this._startedNavigation = false;
	}

	endAnimation():void {
		if ( this._startedNavigation ) {
				this._router.navigate([this._navigationLink]);
		}
	}

	get animateType():AnimateType {
		return this._animateType;
	}
}
