export type ShiftType = 'DAY' | 'NIGHT';
export type ShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export class ShiftRecord {
    private _id: number;
    private _organizationId: number;
    private _userId: number;
    private _workAreaId: number;
    private _type: ShiftType;
    private _status: ShiftStatus;
    private _scheduledStart: string;
    private _scheduledEnd: string;
    private _checkInAt: string | null;
    private _checkOutAt: string | null;

    constructor(props: {
        id: number;
        organizationId: number;
        userId: number;
        workAreaId: number;
        type: ShiftType;
        status: ShiftStatus;
        scheduledStart: string;
        scheduledEnd: string;
        checkInAt: string | null;
        checkOutAt: string | null;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._userId = props.userId;
        this._workAreaId = props.workAreaId;
        this._type = props.type;
        this._status = props.status;
        this._scheduledStart = props.scheduledStart;
        this._scheduledEnd = props.scheduledEnd;
        this._checkInAt = props.checkInAt;
        this._checkOutAt = props.checkOutAt;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get userId(): number { return this._userId; }
    get workAreaId(): number { return this._workAreaId; }
    get type(): ShiftType { return this._type; }
    get status(): ShiftStatus { return this._status; }
    get scheduledStart(): string { return this._scheduledStart; }
    get scheduledEnd(): string { return this._scheduledEnd; }
    get checkInAt(): string | null { return this._checkInAt; }
    get checkOutAt(): string | null { return this._checkOutAt; }

    get isScheduled(): boolean {
        return this._status === 'SCHEDULED';
    }

    get isInProgress(): boolean {
        return this._status === 'IN_PROGRESS';
    }

    get isCompleted(): boolean {
        return this._status === 'COMPLETED';
    }
}