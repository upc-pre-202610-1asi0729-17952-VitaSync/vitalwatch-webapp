import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SignInRequest } from './request/sign-in-request';
import { AuthenticationSession } from '../domain/model/authentication-session.entity';
import { AuthenticationUserResource } from './responses/authentication-response';
import { User } from '../domain/model/user.entity';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationApi {
  private http = inject(HttpClient);
  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  signIn(request: SignInRequest): Observable<AuthenticationSession> {
    return this.http
      .get<AuthenticationUserResource[]>(
        `${this.usersUrl}?email=${request.email}&password=${request.password}&status=ACTIVE`
      )
      .pipe(
        map(users => {
          const userResource = users[0];

          if (!userResource) {
            throw new Error('Invalid credentials.');
          }

          const user = new User({
            id: userResource.id,
            organizationId: userResource.organizationId,
            firstName: userResource.firstName,
            lastName: userResource.lastName,
            email: userResource.email,
            role: userResource.role,
            status: userResource.status
          });

          return new AuthenticationSession({
            token: `fake-jwt-${user.id}-${Date.now()}`,
            user
          });
        })
      );
  }
}