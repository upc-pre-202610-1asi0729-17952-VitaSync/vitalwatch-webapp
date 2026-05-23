import { UserRole, UserStatus } from '../domain/model/user.entity';

export interface AuthenticationUserResource {
    id: number;
    organizationId: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
}

export interface AuthenticationResponse {
    token: string;
    user: AuthenticationUserResource;
}