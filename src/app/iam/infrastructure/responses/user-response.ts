import { UserRole, UserStatus } from '../../domain/model/user.entity';

export interface UserResponse {
    id: number;
    organizationId: number;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone?: string;
    workAreaId?: number;
    specialtyId?: number;
    role: UserRole;
    status: UserStatus;
}