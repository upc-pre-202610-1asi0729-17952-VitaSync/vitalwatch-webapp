import { UserStatus } from '../../domain/model/user.entity';

export interface UpdateUserStatusRequest {
    status: UserStatus;
}