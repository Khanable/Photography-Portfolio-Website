import { Component, AfterViewInit, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';

//Make a static list for tracking logo instance id for mutliple fclogo components, to start and stop approperiately
@Component({
	selector: 'fclogo-root',
	template: `
		<div id=fclogo></div>
	`,
	styles: [
		`
	.fclogo {
		width: 50px;
		height: 50px;
	}
		`
	],
	encapsulation: ViewEncapsulation.None,
})
export class FCLogoComponent implements AfterViewInit, OnDestroy {
	constructor(private ref: ElementRef) {}
	ngAfterViewInit(): void {
		let s = document.createElement("script");
		s.type = "text/javascript";
		s.innerHTML = `
			let logo = new fclogo.Logo('fclogo', 'fclogo')
			logo.start();
		`;
		this.ref.nativeElement.appendChild(s);
	}
	ngOnDestroy(): void {
		let s = document.createElement('script');
		s.type = "text/javascript";
		s.innerHTML = 'logo.stop();';
		this.ref.nativeElement.appendChild(s);
	}
}
