import { UpdateController } from './update.js';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import * as Detector from 'three/examples/js/Detector.js';
import { Message } from './message.js';

const Entry = {
	LowFrameRate: 0,
	NoWEBGL: 1,
	HardSetting: 2,
}

const FallbackText = {};
FallbackText[Entry.LowFrameRate] = 'Framerate low, Fallback used';
FallbackText[Entry.NoWEBGL] = 'Browser does not support WEBGL, Fallback used';
FallbackText[Entry.HardSetting] = 'Fallback setting enabled';

class _FallbackNotifier {
	constructor() {
		this._fallbackSubject = new ReplaySubject(1);
		this._fallback = false;
		this._hardSetting = false;
		this._webGLSupport = Detector.webgl;

		UpdateController.frameRateLowSubject.subscribe( isLow => {
			if ( isLow ) {
				this._showFallback(Entry.LowFrameRate);
			}
		});
	}

	loadHardSetting(set, v) {
		if ( set ) {
			if ( v ) {
				this._writeHardSetting();
				this._hardSetting = true;
			}
			else {
				this._clearHardSetting();
				this._hardSetting = false;
			}
		}
		else {
			let local = window.localStorage;
			let fallback = local.getItem('hardFallback');
			if ( fallback ) {
				this._hardSetting = true;
			}
			else {
				this._hardSetting = false;
			}
		}

		if ( !this._webGLSupport ) {
			this._showFallback(Entry.NoWEBGL);
		}
		else if ( this._hardSetting ) {
			this._showFallback(Entry.HardSetting);
		}
		else {
			this._fallbackSubject.next(false);
		}

	}

	_writeHardSetting() {
		window.localStorage.setItem('hardFallback', 'true');
	}

	_clearHardSetting() {
		window.localStorage.removeItem('hardFallback');
	}

	setFallback(v) {
		if ( this._fallback != v ) {
			if ( v && this._webGLSupport ) {
				this._fallback = false;
				this._fallbackSubject.next(false);
				this._clearHardSetting();
			}
			else {
				this._writeHardSetting();
				this._showFallback(Entry.HardSetting);
			}

		}
	}

	get fallbackSubject() {
		return this._fallbackSubject;
	}

	_showFallback(entryFrom) {
		let text = FallbackText[entryFrom];
		this._fallback = true;
		this._fallbackSubject.next(true);
		Message.showMessage(text);
	}
}

export const FallbackNotifier = new _FallbackNotifier();
