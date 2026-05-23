export class Specialty {
    private _id: number;
    private _name: string;

    constructor(props: { id: number; name: string }) {
        this._id = props.id;
        this._name = props.name;
    }

    get id(): number {
        return this._id;
    }

    get name(): string {
        return this._name;
    }
}