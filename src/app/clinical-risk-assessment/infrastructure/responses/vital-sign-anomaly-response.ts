import {
    VitalSignAnomalyStatus,
    VitalSignAnomalyType
} from '../../domain/model/vital-sign-anomaly.entity';
import { RiskLevel } from '../../domain/model/risk-assessment.entity';

export interface VitalSignAnomalyResponse {
    id: number;
    organizationId: number;
    userId: number;
    type: VitalSignAnomalyType;
    severity: RiskLevel;
    status: VitalSignAnomalyStatus;
    message: string;
    value: number;
    threshold: number;
    detectedAt: string;
    reviewedAt: string | null;
    reviewedBy: number | null;
}