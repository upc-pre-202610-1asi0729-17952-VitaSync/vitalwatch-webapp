import { RiskAssessment } from '../../domain/model/risk-assessment.entity';
import { RiskAssessmentResponse } from '../responses/risk-assessment-response';

export class RiskAssessmentAssembler {
    static toEntity(response: RiskAssessmentResponse): RiskAssessment {
        return new RiskAssessment({
            id: response.id,
            organizationId: response.organizationId,
            userId: response.userId,
            fatigueLevel: response.fatigueLevel,
            riskLevel: response.riskLevel,
            heartRate: response.heartRate,
            hrv: response.hrv,
            lastUpdatedAt: response.lastUpdatedAt
        });
    }

    static toEntities(responses: RiskAssessmentResponse[]): RiskAssessment[] {
        return responses.map(response => this.toEntity(response));
    }
}