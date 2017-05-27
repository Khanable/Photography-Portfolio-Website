export class CategoryDisplay {
	constructor(private _id : number, private _displayImage : string, private _displayName : string) {}
	get id(): number {
		return this._id;
	}
}

export class CategoryDetail {
	constructor(private _id : number, private _images : string[]) {}
}
