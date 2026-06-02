import { Invitation } from '../../domain/model/invitation.entity';
import { InvitationResource } from '../responses/invitation-response';

export class InvitationAssembler {
    static toEntity(response: InvitationResource): Invitation {
        return new Invitation({
            id: response.id,
            organizationId: response.organizationId,
            email: response.email,
            role: response.role,
            status: response.status,
            token: response.token,
            createdAt: response.createdAt
        });
    }

    static toEntities(responses: InvitationResource[]): Invitation[] {
        return responses.map(response => this.toEntity(response));
    }
}