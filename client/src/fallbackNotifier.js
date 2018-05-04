import { UpdateController } from './update.js';
import { default as fallbackNotifierHtml } from './fallbackNotifier.html';
import { GetElementSize, LoadHtml } from './util.js';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import * as Detector from 'three/examples/js/Detector.js';
let URLParse = require('url-parse');

const Entry = {
	LowFrameRate: 0,
	NoWEBGL: 1,
	HardSetting: 2,
}

const FallbackText = {};
FallbackText[Entry.LowFrameRate] = 'Framerate low, Fallback used';
FallbackText[Entry.NoWEBGL] = 'Browser does not support WEBGL, Fallback used';
FallbackText[Entry.HardSetting] = 'Fallback setting enabled';

const StylePositionFormat = 'top:{0}px';

const NotifierState = {
	Init: 0,
	Show: 1,
	Wait: 2,
	Hide: 3,
	Complete: 4,
}

class _FallbackNotifier {
	constructor(displayTime, animateSpeed) {
		this._fallBackDom = LoadHtml(fallbackNotifierHtml).querySelector('#root');
		this._domRootStyle = this._fallBackDom.getAttribute('style');
		this._domRootStyle = this._domRootStyle == null ? '' : this._domRootStyle;
		this._domHeight = null;
		this._curDomHeight = null;
		this._displayTime = displayTime;
		this._animateSpeed = animateSpeed;
		this._updateSubscription = null;
		this._time = 0;
		this._fallbackSubject = new ReplaySubject(1);
		this._fallback = false;
		this._hardSetting = false;
		this._webGLSupport = Detector.webgl;

		this._curState = NotifierState.Init;
		this._nStateEnd = null;

		this._loadHardSetting();

		if ( !this._webGLSupport ) {
			this._showFallback(Entry.NoWEBGL);
		}
		else if ( this._hardSetting ) {
			this._showFallback(Entry.HardSetting);
		}
		else {
			this._fallbackSubject.next(false);
		}

		UpdateController.frameRateLowSubject.subscribe( isLow => {
			if ( isLow ) {
				this._showFallback(Entry.LowFrameRate);
			}
		});
	}

	_loadHardSetting() {
		let fromURL = false;
		let url = new URLParse(document.URL);
		let fallback = /fallback=(true|false)/.exec(url.query);
		if ( fallback ) {
			fromURL = true;
			if ( fallback[1] == 'true' ) {
				this._hardSetting = true;
				this._writeHardSetting();
			}
			else if ( fallback[1] == 'false' ) {
				this._clearHardSetting();
			}
		}

		if ( !fromURL ) {
			let local = window.localStorage;
			if ( local.getItem('hardFallback') ) {
				this._hardSetting = true;
			}
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

	_setHeight(height) {
		this._curDomHeight = height;
		this._fallBackDom.setAttribute('style', this._domRootStyle+StylePositionFormat.format(this._curDomHeight));
	}

	update(dt) {
		this._time+=dt;
		if ( this._curState == NotifierState.Show ) {
			this._setHeight(this._curDomHeight+this._animateSpeed*dt);
			let end = 0;
			if ( this._curDomHeight >= end ) {
				this._setHeight(end);
				this._nStateEnd = this._time+this._displayTime;
				this._curState = NotifierState.Wait;
			}
		}
		else if ( this._curState == NotifierState.Wait ) {
			if ( this._time >= this._nStateEnd ) {
				this._curState = NotifierState.Hide;
			}
		}
		else if ( this._curState == NotifierState.Hide ) {
			this._setHeight(this._curDomHeight+this._animateSpeed*-dt);
			let end = -this._domHeight;
			if ( this._curDomHeight <= end ) {
				this._curState = NotifierState.Complete;
				document.body.removeChild(this._fallBackDom);
				this._updateSubscription.unsubscribe();
			}
		}
	}

	_showFallback(entryFrom) {
		if ( this._curState == NotifierState.Init ) {
			let textDom = this._fallBackDom.querySelector('#text');
			textDom.innerText = FallbackText[entryFrom];
			document.body.appendChild(this._fallBackDom);
			this._domHeight = GetElementSize(this._fallBackDom).y;
			this._setHeight(-this._domHeight);
			this._curState = NotifierState.Show;
			this._updateSubscription = UpdateController.updateSubject.subscribe( this.update.bind(this) );
			this._fallback = true;
			this._fallbackSubject.next(true);
		}
	}


}

export const FallbackNotifier = new _FallbackNotifier(5, 30);
