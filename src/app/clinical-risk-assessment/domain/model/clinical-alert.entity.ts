import { RiskLevel } from './risk-assessment.entity';

export type ClinicalAlertStatus = 'ACTIVE' | 'RESOLVED';

export class ClinicalAlert {
    private _id: number;
    private _organizationId: number;
    private _userId: number;
    private _severity: RiskLevel;
    private _status: ClinicalAlertStatus;
    private _message: string;
    private _createdAt: string;
    private _resolvedAt?: string;
    private _resolvedBy?: number;

    constructor(props: {
        id: number;
        organizationId: number;
        userId: number;
        severity: RiskLevel;
        status: ClinicalAlertStatus;
        message: string;
        createdAt: string;
        resolvedAt?: string;
        resolvedBy?: number;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._userId = props.userId;
        this._severity = props.severity;
        this._status = props.status;
        this._message = props.message;
        this._createdAt = props.createdAt;
        this._resolvedAt = props.resolvedAt;
        this._resolvedBy = props.resolvedBy;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get userId(): number { return this._userId; }
    get severity(): RiskLevel { return this._severity; }
    get status(): ClinicalAlertStatus { return this._status; }
    get message(): string { return this._message; }
    get createdAt(): string { return this._createdAt; }
    get resolvedAt(): string | undefined { return this._resolvedAt; }
    get resolvedBy(): number | undefined { return this._resolvedBy; }

    get isActive(): boolean {
        return this._status === 'ACTIVE';
    }
}