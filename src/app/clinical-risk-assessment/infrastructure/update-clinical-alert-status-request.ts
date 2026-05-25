import { ClinicalAlertStatus } from '../domain/model/clinical-alert.entity';

export interface UpdateClinicalAlertStatusRequest {
    status: ClinicalAlertStatus;
    resolvedAt?: string;
    resolvedBy?: number;
}