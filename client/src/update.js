import { Subject, ReplaySubject } from 'rxjs';

export class Update {

	constructor(lowFrameRateSampleTime, lowFrameRateTriggerMS) {
		this._updateSubject = new Subject();
		this._renderSubject = new Subject();
		this._frameRateLowSubject = new ReplaySubject(1);
		this._lowFrameRateSampleTime = lowFrameRateSampleTime;
		this._lowFrameRateTriggerMS = lowFrameRateTriggerMS;

		this._running = false;
		this._wasRunning = false;
		this._lastT = null;
		this._nLowFrameRateCheck = null;
		this._frameRateLowSamples = null

		document.addEventListener('visibilitychange', () => {
			if ( document.visibilityState == 'hidden' && this._running ) {
				this._wasRunning = true;
				this.stop();
			}
			else if ( document.visibilityState == 'visible' && this._wasRunning ) {
				this._wasRunning = false;
				this.start();
			}
		});

		this._loop(null);
	}

	get renderSubject() {
		return this._renderSubject;
	}
	get updateSubject() {
		return this._updateSubject;
	}
	get frameRateLowSubject() {
		return this._frameRateLowSubject;
	}

	_loop(time) {
		if ( this._running ) {

			time/=1000;
			let dt = 0;
			//Handle stop then start without jump in dt
			if ( this._lastT == null ) {
				dt = 0;
			}
			else {
				dt = time-this._lastT;
			}
			this._lastT = time;
			this._frameRateLowSamples.push(dt);

			let frameRateCheck = false;
			if ( this._nLowFrameRateCheck == null || time >= this._nLowFrameRateCheck ) {
				if ( this._nLowFrameRateCheck != null ) {
					frameRateCheck = true;
				}
				this._nLowFrameRateCheck = time+this._lowFrameRateSampleTime;
			}

			if ( frameRateCheck ) {
				let isLow = false;
				let avgFrameRate = this._frameRateLowSamples.reduce( (acc, cv) => acc+cv, 0 )/this._frameRateLowSamples.length;
				if ( avgFrameRate >= this._lowFrameRateTriggerMS/1000 ) {
					isLow = true;
				}
				this._frameRateLowSubject.next(isLow);
				this._frameRateLowSamples = [];
			}


			this._updateSubject.next(dt);
			this._renderSubject.next(dt);

		}

		window.requestAnimationFrame(this._loop.bind(this));
	}

	start() {
		this._running = true;
		this._wasRunning = false;
		this._lastT = null;
		this._nLowFrameRateCheck = null;
		this._frameRateLowSamples = [];
	}

	stop() {
		this._running = false;
	}
}

export const UpdateController = new Update(3, 30);
