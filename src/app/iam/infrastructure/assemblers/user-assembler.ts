import { User } from '../../domain/model/user.entity';
import { UserResponse } from '../responses/user-response';

export class UserAssembler {
    static toEntity(response: UserResponse): User {
        return new User({
            id: response.id,
            organizationId: response.organizationId,
            firstName: response.firstName,
            lastName: response.lastName,
            email: response.email,
            phone: response.phone,
            workAreaId: response.workAreaId,
            specialtyId: response.specialtyId,
            role: response.role,
            status: response.status
        });
    }

    static toEntities(responses: UserResponse[]): User[] {
        return responses.map(response => this.toEntity(response));
    }
}