import { Component, OnInit } from '@angular/core';
import { HeroService } from './hero.service';
import { Hero } from './hero';

@Component({
	selector: 'my-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: [
		'./dashboard.component.css',
	],
})
export class DashboardComponent implements OnInit {
	constructor(private heroService: HeroService) {};
	heroes: Hero[] = [];
	ngOnInit(): void {
		this.heroService.getHeroes().then( e => this.heroes = e.slice(1, 5) );
	}
}

