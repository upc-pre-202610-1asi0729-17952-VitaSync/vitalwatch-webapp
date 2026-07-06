import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthenticationSession } from '../../domain/model/authentication-session.entity';
import { SignInRequest } from '../request/sign-in-request';
import { AuthenticationUserResource } from '../responses/authentication-response';
import { AuthenticationAssembler } from '../assemblers/authentication-assembler';
import { UserResponse } from '../responses/user-response';
import { UserAssembler } from '../assemblers/user-assembler';
import { User } from '../../domain/model/user.entity';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationApi {
  private http = inject(HttpClient);

  private authenticationUrl = `${environment.platformProviderApiBaseUrl}/authentication`;

  signIn(request: SignInRequest): Observable<AuthenticationSession> {
    return this.http
      .post<AuthenticationUserResource>(`${this.authenticationUrl}/sign-in`, request)
      .pipe(map((response) => AuthenticationAssembler.toSession(response)));
  }

  getAuthenticatedUser(): Observable<User> {
    return this.http
      .get<UserResponse>(`${this.authenticationUrl}/me`)
      .pipe(map((response) => UserAssembler.toEntity(response)));
  }
}
