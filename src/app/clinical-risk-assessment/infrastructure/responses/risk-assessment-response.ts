import { RiskLevel } from '../../domain/model/risk-assessment.entity';

export interface RiskAssessmentResponse {
    id: number;
    organizationId: number;
    userId: number;
    fatigueLevel: number;
    riskLevel: RiskLevel;
    heartRate: number;
    hrv: number;
    lastUpdatedAt: string;
}