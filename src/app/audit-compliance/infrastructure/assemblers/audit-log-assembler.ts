import { AuditLog } from '../../domain/model/audit-log.entity';
import { AuditLogResponse } from '../responses/audit-log-response';

export class AuditLogAssembler {
    static toEntity(response: AuditLogResponse): AuditLog {
        return new AuditLog({
            id: response.id,
            organizationId: response.organizationId,
            actorUserId: response.actorUserId ?? null,
            type: response.type,
            severity: response.severity,
            resourceType: response.resourceType,
            resourceId: response.resourceId ?? null,
            description: response.description,
            createdAt: response.createdAt
        });
    }

    static toEntities(responses: AuditLogResponse[]): AuditLog[] {
        return responses.map(response => this.toEntity(response));
    }
}