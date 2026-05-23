export class WorkArea {
    private _id: number;
    private _organizationId: number;
    private _name: string;

    constructor(props: { id: number; organizationId: number; name: string }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._name = props.name;
    }

    get id(): number {
        return this._id;
    }

    get organizationId(): number {
        return this._organizationId;
    }

    get name(): string {
        return this._name;
    }
}