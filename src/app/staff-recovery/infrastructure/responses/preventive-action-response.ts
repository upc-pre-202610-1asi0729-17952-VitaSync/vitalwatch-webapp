import {
    PreventiveActionStatus,
    PreventiveActionType
} from '../../domain/model/preventive-action.entity';

export interface PreventiveActionResponse {
    id: number;
    organizationId: number;
    supervisorId: number;
    userId: number;
    type: PreventiveActionType;
    status: PreventiveActionStatus;
    notes: string;
    createdAt: string;
    completedAt: string | null;
}