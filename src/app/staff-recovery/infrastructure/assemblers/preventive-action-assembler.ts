import { PreventiveAction } from '../../domain/model/preventive-action.entity';
import { PreventiveActionResponse } from '../responses/preventive-action-response';

export class PreventiveActionAssembler {
    static toEntity(response: PreventiveActionResponse): PreventiveAction {
        return new PreventiveAction({
            id: response.id,
            organizationId: response.organizationId,
            supervisorId: response.supervisorId,
            userId: response.userId,
            type: response.type,
            status: response.status,
            notes: response.notes,
            createdAt: response.createdAt,
            completedAt: response.completedAt ?? null
        });
    }

    static toEntities(responses: PreventiveActionResponse[]): PreventiveAction[] {
        return responses.map(response => this.toEntity(response));
    }
}