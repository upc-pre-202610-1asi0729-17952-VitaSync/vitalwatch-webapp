import { PreventiveActionStatus } from '../domain/model/preventive-action.entity';

export interface UpdatePreventiveActionStatusRequest {
    status: PreventiveActionStatus;
    completedAt: string | null;
}