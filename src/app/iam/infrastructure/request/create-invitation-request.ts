import { UserRole } from '../../domain/model/user.entity';

export interface CreateInvitationRequest {
    organizationId: number;
    email: string;
    role: UserRole;
}