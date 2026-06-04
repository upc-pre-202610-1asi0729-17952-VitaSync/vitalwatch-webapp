import {
    AuditLogSeverity,
    AuditLogType
} from '../../domain/model/audit-log.entity';

export interface AuditLogResponse {
    id: number;
    organizationId: number;
    actorUserId: number | null;
    type: AuditLogType;
    severity: AuditLogSeverity;
    resourceType: string;
    resourceId: number | null;
    description: string;
    createdAt: string;
}