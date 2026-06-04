import { ClinicalAlert } from '../../domain/model/clinical-alert.entity';
import { ClinicalAlertResponse } from '../responses/clinical-alert-response';

export class ClinicalAlertAssembler {
    static toEntity(response: ClinicalAlertResponse): ClinicalAlert {
        return new ClinicalAlert({
            id: response.id,
            organizationId: response.organizationId,
            userId: response.userId,
            severity: response.severity,
            status: response.status,
            message: response.message,
            createdAt: response.createdAt,
            resolvedAt: response.resolvedAt ?? undefined,
            resolvedBy: response.resolvedBy ?? undefined
        });
    }

    static toEntities(responses: ClinicalAlertResponse[]): ClinicalAlert[] {
        return responses.map(response => this.toEntity(response));
    }
}