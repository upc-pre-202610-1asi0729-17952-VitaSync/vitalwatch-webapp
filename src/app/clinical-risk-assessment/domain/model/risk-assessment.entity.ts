export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export class RiskAssessment {
    private _id: number;
    private _organizationId: number;
    private _userId: number;
    private _fatigueLevel: number;
    private _riskLevel: RiskLevel;
    private _heartRate: number;
    private _hrv: number;
    private _lastUpdatedAt: string;

    constructor(props: {
        id: number;
        organizationId: number;
        userId: number;
        fatigueLevel: number;
        riskLevel: RiskLevel;
        heartRate: number;
        hrv: number;
        lastUpdatedAt: string;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._userId = props.userId;
        this._fatigueLevel = props.fatigueLevel;
        this._riskLevel = props.riskLevel;
        this._heartRate = props.heartRate;
        this._hrv = props.hrv;
        this._lastUpdatedAt = props.lastUpdatedAt;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get userId(): number { return this._userId; }
    get fatigueLevel(): number { return this._fatigueLevel; }
    get riskLevel(): RiskLevel { return this._riskLevel; }
    get heartRate(): number { return this._heartRate; }
    get hrv(): number { return this._hrv; }
    get lastUpdatedAt(): string { return this._lastUpdatedAt; }

    get isHighRisk(): boolean {
        return this._riskLevel === 'HIGH' || this._riskLevel === 'CRITICAL';
    }
}