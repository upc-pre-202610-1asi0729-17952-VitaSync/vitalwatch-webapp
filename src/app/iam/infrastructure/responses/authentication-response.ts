import { UserRole, UserStatus } from '../../domain/model/user.entity';

export interface AuthenticationUserResource {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  token: string;
}

export interface AuthenticationResponse extends AuthenticationUserResource {}
