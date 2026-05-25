import { RiskLevel } from './risk-assessment.entity';

export type VitalSignAnomalyType =
    'HEART_RATE_SPIKE' |
    'LOW_HRV' |
    'FATIGUE_SPIKE' |
    'SENSOR_SIGNAL_LOSS';

export type VitalSignAnomalyStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED';

export class VitalSignAnomaly {
    private _id: number;
    private _organizationId: number;
    private _userId: number;
    private _type: VitalSignAnomalyType;
    private _severity: RiskLevel;
    private _status: VitalSignAnomalyStatus;
    private _value: number;
    private _threshold: number;
    private _message: string;
    private _detectedAt: string;
    private _reviewedAt: string | null;
    private _reviewedBy: number | null;

    constructor(props: {
        id: number;
        organizationId: number;
        userId: number;
        type: VitalSignAnomalyType;
        severity: RiskLevel;
        status: VitalSignAnomalyStatus;
        value: number;
        threshold: number;
        message: string;
        detectedAt: string;
        reviewedAt: string | null;
        reviewedBy: number | null;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._userId = props.userId;
        this._type = props.type;
        this._severity = props.severity;
        this._status = props.status;
        this._value = props.value;
        this._threshold = props.threshold;
        this._message = props.message;
        this._detectedAt = props.detectedAt;
        this._reviewedAt = props.reviewedAt;
        this._reviewedBy = props.reviewedBy;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get userId(): number { return this._userId; }
    get type(): VitalSignAnomalyType { return this._type; }
    get severity(): RiskLevel { return this._severity; }
    get status(): VitalSignAnomalyStatus { return this._status; }
    get value(): number { return this._value; }
    get threshold(): number { return this._threshold; }
    get message(): string { return this._message; }
    get detectedAt(): string { return this._detectedAt; }
    get reviewedAt(): string | null { return this._reviewedAt; }
    get reviewedBy(): number | null { return this._reviewedBy; }

    get isOpen(): boolean {
        return this._status === 'OPEN';
    }
}