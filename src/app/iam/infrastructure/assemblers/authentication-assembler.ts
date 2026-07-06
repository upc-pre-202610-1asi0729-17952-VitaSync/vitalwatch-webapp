import { AuthenticationSession } from '../../domain/model/authentication-session.entity';
import { User } from '../../domain/model/user.entity';
import { AuthenticationUserResource } from '../responses/authentication-response';

export class AuthenticationAssembler {
  static toSession(response: AuthenticationUserResource): AuthenticationSession {
    const user = new User({
      id: response.id,
      organizationId: response.organizationId,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      role: response.role,
      status: response.status,
    });

    return new AuthenticationSession({
      token: response.token,
      user,
    });
  }
}
