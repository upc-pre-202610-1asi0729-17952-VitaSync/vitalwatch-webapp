import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthenticationSession } from '../../domain/model/authentication-session.entity';
import { SignInRequest } from '../request/sign-in-request';
import { AuthenticationUserResource } from '../responses/authentication-response';
import { AuthenticationAssembler } from '../assemblers/authentication-assembler';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationApi {
  private http = inject(HttpClient);

  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  signIn(request: SignInRequest): Observable<AuthenticationSession> {
    return this.http
      .get<AuthenticationUserResource[]>(
        `${this.usersUrl}?email=${request.email}&password=${request.password}`
      )
      .pipe(
        switchMap(users => {
          if (users.length === 0) {
            return throwError(() => new Error('Invalid credentials'));
          }

          return [AuthenticationAssembler.toSession(users[0])];
        })
      );
  }
}