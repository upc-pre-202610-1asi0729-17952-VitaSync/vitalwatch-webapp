import { PreventiveActionType } from '../../domain/model/preventive-action.entity';

export interface CreatePreventiveActionRequest {
    organizationId: number;
    supervisorId: number;
    userId: number;
    type: PreventiveActionType;
    notes: string;
}