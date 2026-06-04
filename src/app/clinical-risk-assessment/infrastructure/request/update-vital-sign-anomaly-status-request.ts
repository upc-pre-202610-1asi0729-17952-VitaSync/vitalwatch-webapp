import { VitalSignAnomalyStatus } from '../../domain/model/vital-sign-anomaly.entity';

export interface UpdateVitalSignAnomalyStatusRequest {
    status: VitalSignAnomalyStatus;
    reviewedAt: string | null;
    reviewedBy: number | null;
}