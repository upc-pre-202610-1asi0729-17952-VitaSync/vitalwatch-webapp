import { AuthenticationSession } from '../../domain/model/authentication-session.entity';
import { UserAssembler } from './user-assembler';
import { AuthenticationUserResource } from '../responses/authentication-response';

export class AuthenticationAssembler {
    static toSession(response: AuthenticationUserResource): AuthenticationSession {
        const user = UserAssembler.toEntity(response);

        return new AuthenticationSession({
            token: `fake-jwt-${user.id}-${Date.now()}`,
            user
        });
    }
}