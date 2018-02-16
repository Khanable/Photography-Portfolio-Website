import { Subject } from 'rxjs/Subject';

export class Update {

	constructor() {
		this._renderSubject = new Subject();
		this._running = false;
		this._lastT = 0;
	}

	get renderSubject() {
		return this._renderSubject;
	}

	_update(time) {
		let dt = time-this._lastT;
		this._lastT = time;
		dt/=1000;
		if ( this._running ) {
			this._renderSubject.next(dt);
			window.requestAnimationFrame(this._update.bind(this));
		}
	}

	start() {
		this._running = true;
		this._update(0);
	}

	stop() {
		this._running = false;
	}
}

export const UpdateController = new Update();
