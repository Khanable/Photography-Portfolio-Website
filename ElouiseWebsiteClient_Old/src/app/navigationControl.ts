import { trigger, state, animate, transition, style } from '@angular/animations';

export class NavigationControl {
	constructor(public readonly linkPath:string, public readonly name:string) {
	}
}

export enum NavigationControlDir {
	North = 1,
	South = 2,
	East = 4,
	West = 8,
}

export enum AnimateType {
	NorthOut,
	NorthIn,
	SouthOut,
	SouthIn,
	EastOut,
	EastIn,
	WestOut,
	WestIn,
}

const centredStyle = style({
	width: '100%',
	height: '100%',
	transform: 'translate(0%)',
});
const slideNorth = style({ transform: 'translateY(100%)' });
const slideSouth = style({ transform: 'translateY(-100%)' });
const slideEast = style({ transform: 'translateX(-100%)' });
const slideWest = style({ transform: 'translateX(100%)' });
const slideAnimateCentre = animate('1s', centredStyle);
const slideAnimateNorth = animate('1s', slideNorth);
const slideAnimateSouth = animate('1s', slideSouth);
const slideAnimateEast = animate('1s', slideEast);
const slideAnimateWest = animate('1s', slideWest);


export const SlideAnimation = trigger('slideAnimation', [
	transition('* => '+AnimateType.NorthIn, [ slideNorth, slideAnimateCentre ]),
	transition('* => '+AnimateType.SouthIn, [ slideSouth, slideAnimateCentre ]),
	transition('* => '+AnimateType.EastIn, [ slideEast, slideAnimateCentre ]),
	transition('* => '+AnimateType.WestIn, [ slideWest, slideAnimateCentre ]),
	transition('* => '+AnimateType.NorthOut, [ centredStyle, slideAnimateNorth ]),
	transition('* => '+AnimateType.SouthOut, [ centredStyle, slideAnimateSouth ]),
	transition('* => '+AnimateType.EastOut, [ centredStyle, slideAnimateEast ]),
	transition('* => '+AnimateType.WestOut, [ centredStyle, slideAnimateWest ]),
]);
