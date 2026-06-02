import { UserRole } from '../../domain/model/user.entity';

export interface UpdateUserRoleRequest {
    role: UserRole;
}