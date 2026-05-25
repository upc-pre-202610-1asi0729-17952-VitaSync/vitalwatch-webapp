export type SensorStatus = 'CONNECTED' | 'DISCONNECTED' | 'LOW_BATTERY';

export class VitalSignReading {
    private _id: number;
    private _organizationId: number;
    private _userId: number;
    private _heartRate: number;
    private _hrv: number;
    private _fatigueLevel: number;
    private _cortisolLevel: number;
    private _sensorStatus: SensorStatus;
    private _recordedAt: string;

    constructor(props: {
        id: number;
        organizationId: number;
        userId: number;
        heartRate: number;
        hrv: number;
        fatigueLevel: number;
        cortisolLevel: number;
        sensorStatus: SensorStatus;
        recordedAt: string;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._userId = props.userId;
        this._heartRate = props.heartRate;
        this._hrv = props.hrv;
        this._fatigueLevel = props.fatigueLevel;
        this._cortisolLevel = props.cortisolLevel;
        this._sensorStatus = props.sensorStatus;
        this._recordedAt = props.recordedAt;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get userId(): number { return this._userId; }
    get heartRate(): number { return this._heartRate; }
    get hrv(): number { return this._hrv; }
    get fatigueLevel(): number { return this._fatigueLevel; }
    get cortisolLevel(): number { return this._cortisolLevel; }
    get sensorStatus(): SensorStatus { return this._sensorStatus; }
    get recordedAt(): string { return this._recordedAt; }
}