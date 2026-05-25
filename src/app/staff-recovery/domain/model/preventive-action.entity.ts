export type PreventiveActionType =
    'RECOVERY_BREAK' |
    'SHIFT_ADJUSTMENT' |
    'SUPERVISOR_CHECK_IN' |
    'MEDICAL_EVALUATION';

export type PreventiveActionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export class PreventiveAction {
    private _id: number;
    private _organizationId: number;
    private _supervisorId: number;
    private _userId: number;
    private _type: PreventiveActionType;
    private _status: PreventiveActionStatus;
    private _notes: string;
    private _createdAt: string;
    private _completedAt: string | null;

    constructor(props: {
        id: number;
        organizationId: number;
        supervisorId: number;
        userId: number;
        type: PreventiveActionType;
        status: PreventiveActionStatus;
        notes: string;
        createdAt: string;
        completedAt: string | null;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._supervisorId = props.supervisorId;
        this._userId = props.userId;
        this._type = props.type;
        this._status = props.status;
        this._notes = props.notes;
        this._createdAt = props.createdAt;
        this._completedAt = props.completedAt;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get supervisorId(): number { return this._supervisorId; }
    get userId(): number { return this._userId; }
    get type(): PreventiveActionType { return this._type; }
    get status(): PreventiveActionStatus { return this._status; }
    get notes(): string { return this._notes; }
    get createdAt(): string { return this._createdAt; }
    get completedAt(): string | null { return this._completedAt; }

    get isPending(): boolean {
        return this._status === 'PENDING';
    }
}