import { UpdateController } from './update.js';
import { GL } from './gl.js';
import { default as fallbackNotifierHtml } from './fallbackNotifier.html';
import { GetElementSize, LoadHtml } from './util.js';

const Entry = {
	LowFrameRate: 0,
	NoWEBGL: 1,
}

const FallbackText = {};
FallbackText[Entry.LowFrameRate] = 'Framerate low, Fallback used';
FallbackText[Entry.NoWEBGL] = 'Browser does not support WEBGL, Fallback used';

const StylePositionFormat = 'top:{0}px';

const NotifierState = {
	Init: 0,
	Show: 1,
	Wait: 2,
	Hide: 3,
	Complete: 4,
}

export class FallbackNotifier {
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

		this._curState = NotifierState.Init;
		this._nStateEnd = null;

		if ( !GL.webGLSupport ) {
			this.showFallback(Entry.NoWEBGL);
		}

		this._lowFrameRateSubscription = UpdateController.frameRateLowSubject.subscribe( isLow => {
			if ( isLow ) {
				this._lowFrameRateSubscription.unsubscribe();
				this.showFallback(Entry.LowFrameRate);
			}
		});

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

	showFallback(entryFrom) {
		if ( this._curState == NotifierState.Init ) {
			let textDom = this._fallBackDom.querySelector('#text');
			textDom.innerText = FallbackText[entryFrom];
			document.body.appendChild(this._fallBackDom);
			this._domHeight = GetElementSize(this._fallBackDom).y;
			this._setHeight(-this._domHeight);
			this._curState = NotifierState.Show;
			this._updateSubscription = UpdateController.updateSubject.subscribe( this.update.bind(this) );
		}
	}


}
