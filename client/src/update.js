import { Subject } from 'rxjs/Subject';

export class Update {

	constructor() {
		this._updateSubject = new Subject();
		this._renderSubject = new Subject();
		this._running = false;
		this._lastT = 0;
	}

	get renderSubject() {
		return this._renderSubject;
	}
	get updateSubject() {
		return this._updateSubject;
	}

	_loop(time) {
		let dt = time-this._lastT;
		this._lastT = time;
		dt/=1000;

		if ( this._running ) {
			this._updateSubject.next(dt);
			this._renderSubject.next(dt);
		}

		window.requestAnimationFrame(this._loop.bind(this));
	}

	start() {
		this._running = true;
		this._loop(0);
	}

	stop() {
		this._running = false;
	}
}

export const UpdateController = new Update();
