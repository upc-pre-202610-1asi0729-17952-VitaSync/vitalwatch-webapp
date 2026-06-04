import { VitalSignAnomaly } from '../../domain/model/vital-sign-anomaly.entity';
import { VitalSignAnomalyResponse } from '../responses/vital-sign-anomaly-response';

export class VitalSignAnomalyAssembler {
    static toEntity(response: VitalSignAnomalyResponse): VitalSignAnomaly {
        return new VitalSignAnomaly({
            id: response.id,
            organizationId: response.organizationId,
            userId: response.userId,
            type: response.type,
            severity: response.severity,
            status: response.status,
            message: response.message,
            value: response.value,
            threshold: response.threshold,
            detectedAt: response.detectedAt,
            reviewedAt: response.reviewedAt,
            reviewedBy: response.reviewedBy
        });
    }

    static toEntities(responses: VitalSignAnomalyResponse[]): VitalSignAnomaly[] {
        return responses.map(response => this.toEntity(response));
    }
}