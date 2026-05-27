export type AuditLogType =
    'USER_INVITED' |
    'USER_REGISTERED' |
    'USER_ROLE_CHANGED' |
    'USER_STATUS_CHANGED' |
    'TEAM_CREATED' |
    'TEAM_UPDATED' |
    'TEAM_STATUS_CHANGED' |
    'ALERT_RESOLVED' |
    'ANOMALY_REVIEWED' |
    'ANOMALY_DISMISSED' |
    'PREVENTIVE_ACTION_CREATED' |
    'PREVENTIVE_ACTION_COMPLETED' |
    'SHIFT_CHECK_IN' |
    'SHIFT_CHECK_OUT';

export type AuditLogSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export class AuditLog {
    private _id: number;
    private _organizationId: number;
    private _actorUserId: number | null;
    private _type: AuditLogType;
    private _severity: AuditLogSeverity;
    private _resourceType: string;
    private _resourceId: number | null;
    private _description: string;
    private _createdAt: string;

    constructor(props: {
        id: number;
        organizationId: number;
        actorUserId: number | null;
        type: AuditLogType;
        severity: AuditLogSeverity;
        resourceType: string;
        resourceId: number | null;
        description: string;
        createdAt: string;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._actorUserId = props.actorUserId;
        this._type = props.type;
        this._severity = props.severity;
        this._resourceType = props.resourceType;
        this._resourceId = props.resourceId;
        this._description = props.description;
        this._createdAt = props.createdAt;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get actorUserId(): number | null { return this._actorUserId; }
    get type(): AuditLogType { return this._type; }
    get severity(): AuditLogSeverity { return this._severity; }
    get resourceType(): string { return this._resourceType; }
    get resourceId(): number | null { return this._resourceId; }
    get description(): string { return this._description; }
    get createdAt(): string { return this._createdAt; }

    get isCritical(): boolean {
        return this._severity === 'CRITICAL';
    }
}