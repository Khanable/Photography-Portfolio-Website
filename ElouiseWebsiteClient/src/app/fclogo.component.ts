import { Component, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';

//Make a static list for tracking logo instance id for mutliple fclogo components, to start and stop approperiately

@Component({
	selector: 'fclogo-root',
	template: `
		<style>
		.logo {
			width: 200;
			height: 200;
		}
		</style>
		<div id=fclogo></div>
	`,
})
export class FCLogoComponent implements AfterViewInit, OnDestroy {
	constructor(private ref: ElementRef) {}
	ngAfterViewInit(): void {
		let s = document.createElement("script");
		s.type = "text/javascript";
		s.innerHTML = `
			let logo = new fclogo.Logo('fclogo', 'logo')
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
