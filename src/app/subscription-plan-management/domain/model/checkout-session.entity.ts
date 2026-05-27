export type CheckoutSessionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export class CheckoutSession {
    private _id: number;
    private _organizationId: number;
    private _administratorId: number;
    private _subscriptionId: number;
    private _planId: number;
    private _planCode: string;
    private _status: CheckoutSessionStatus;
    private _createdAt: string;

    constructor(props: {
        id: number;
        organizationId: number;
        administratorId: number;
        subscriptionId: number;
        planId: number;
        planCode: string;
        status: CheckoutSessionStatus;
        createdAt: string;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._administratorId = props.administratorId;
        this._subscriptionId = props.subscriptionId;
        this._planId = props.planId;
        this._planCode = props.planCode;
        this._status = props.status;
        this._createdAt = props.createdAt;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get administratorId(): number { return this._administratorId; }
    get subscriptionId(): number { return this._subscriptionId; }
    get planId(): number { return this._planId; }
    get planCode(): string { return this._planCode; }
    get status(): CheckoutSessionStatus { return this._status; }
    get createdAt(): string { return this._createdAt; }
}