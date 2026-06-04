import { UserRole } from '../../domain/model/user.entity';
import { InvitationStatus } from '../../domain/model/invitation.entity';

export interface InvitationResource {
    id: number;
    organizationId: number;
    email: string;
    role: UserRole;
    status: InvitationStatus;
    token: string;
    createdAt: string;
}