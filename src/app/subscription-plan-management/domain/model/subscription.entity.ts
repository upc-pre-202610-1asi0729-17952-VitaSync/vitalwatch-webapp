export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export class Subscription {
    private _id: number;
    private _organizationId: number;
    private _planId: number;
    private _status: SubscriptionStatus;
    private _startedAt: string;

    constructor(props: {
        id: number;
        organizationId: number;
        planId: number;
        status: SubscriptionStatus;
        startedAt: string;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._planId = props.planId;
        this._status = props.status;
        this._startedAt = props.startedAt;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get planId(): number { return this._planId; }
    get status(): SubscriptionStatus { return this._status; }
    get startedAt(): string { return this._startedAt; }

    get isActive(): boolean {
        return this._status === 'ACTIVE';
    }
}