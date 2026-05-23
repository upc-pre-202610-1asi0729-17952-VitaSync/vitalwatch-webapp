export class Subscription {
    private _id: number;
    private _organizationId: number;
    private _planId: number;
    private _status: 'ACTIVE' | 'PENDING' | 'CANCELLED';

    constructor(props: {
        id: number;
        organizationId: number;
        planId: number;
        status: 'ACTIVE' | 'PENDING' | 'CANCELLED';
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._planId = props.planId;
        this._status = props.status;
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get organizationId(): number {
        return this._organizationId;
    }

    set organizationId(value: number) {
        this._organizationId = value;
    }

    get planId(): number {
        return this._planId;
    }

    set planId(value: number) {
        this._planId = value;
    }

    get status(): 'ACTIVE' | 'PENDING' | 'CANCELLED' {
        return this._status;
    }

    set status(value: 'ACTIVE' | 'PENDING' | 'CANCELLED') {
        this._status = value;
    }
}