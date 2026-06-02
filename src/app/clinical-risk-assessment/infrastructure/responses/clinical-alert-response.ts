import { ClinicalAlertStatus } from '../../domain/model/clinical-alert.entity';
import { RiskLevel } from '../../domain/model/risk-assessment.entity';

export interface ClinicalAlertResponse {
    id: number;
    organizationId: number;
    userId: number;
    severity: RiskLevel;
    status: ClinicalAlertStatus;
    message: string;
    createdAt: string;
    resolvedAt?: string | null;
    resolvedBy?: number | null;
}