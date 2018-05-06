import { UpdateController } from './update.js';
import { default as messageHtml } from './message.html';
import { GetElementSize, LoadHtml } from './util.js';

const StylePositionFormat = 'top:{0}px';

const NotifierState = {
	Init: 0,
	Show: 1,
	Wait: 2,
	Hide: 3,
	Complete: 4,
}


class _Message {
	constructor(displayTime, animateSpeed) {
		this._messageDom = LoadHtml(messageHtml).querySelector('#root');
		this._domRootStyle = this._messageDom.getAttribute('style');
		this._domRootStyle = this._domRootStyle == null ? '' : this._domRootStyle;
		this._domHeight = null;
		this._curDomHeight = null;
		this._displayTime = displayTime;
		this._animateSpeed = animateSpeed;
		this._time = 0;
		this._curState = NotifierState.Complete;
		this._nStateEnd = null;
		this._curMessage = null;
		this._messageQueue = [];

		UpdateController.updateSubject.subscribe(this._update.bind(this));
	}

	showMessage(text) {
		this._messageQueue.push(text);
	}

	_setHeight(height) {
		this._curDomHeight = height;
		this._messageDom.setAttribute('style', this._domRootStyle+StylePositionFormat.format(this._curDomHeight));
	}

	_update(dt) {
		this._time+=dt;

		if ( this._curState == NotifierState.Init ) {
			let textDom = this._messageDom.querySelector('#text');
			textDom.innerText = this._curMessage;
			document.body.appendChild(this._messageDom);
			this._domHeight = GetElementSize(this._messageDom).y;
			this._setHeight(-this._domHeight);
			this._curState = NotifierState.Show;
		}

		if ( this._curState == NotifierState.Show ) {
			this._setHeight(this._curDomHeight+this._animateSpeed*dt);
			let end = 0;
			if ( this._curDomHeight >= end ) {
				this._setHeight(end);
				this._nStateEnd = this._time+this._displayTime;
				this._curState = NotifierState.Wait;
			}
		}

		if ( this._curState == NotifierState.Wait ) {
			if ( this._time >= this._nStateEnd ) {
				this._curState = NotifierState.Hide;
			}
		}

		if ( this._curState == NotifierState.Hide ) {
			this._setHeight(this._curDomHeight+this._animateSpeed*-dt);
			let end = -this._domHeight;
			if ( this._curDomHeight <= end ) {
				this._curState = NotifierState.Complete;
				document.body.removeChild(this._messageDom);
			}
		}

		if ( this._curState == NotifierState.Complete ) {
			if ( this._messageQueue.length > 0 ) {
				this._curMessage = this._messageQueue.pop();
				this._curState = NotifierState.Init;
			}
		}
	}

	_showFallback(entryFrom) {
	}
}

export const Message = new _Message(5, 30);
