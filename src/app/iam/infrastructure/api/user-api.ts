import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../../domain/model/user.entity';
import { UserResponse } from '../responses/user-response';
import { UserAssembler } from '../assemblers/user-assembler';
import { UpdateUserRoleRequest } from '../request/update-user-role-request';
import { UpdateUserStatusRequest } from '../request/update-user-status-request';
import { UpdateUserProfileRequest } from '../request/update-user-profile-request';

@Injectable({
  providedIn: 'root'
})
export class UserApi {
  private http = inject(HttpClient);

  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  getUsersByOrganizationId(organizationId: number): Observable<User[]> {
    return this.http
      .get<UserResponse[]>(`${this.usersUrl}?organizationId=${organizationId}`)
      .pipe(
        map(responses => UserAssembler.toEntities(responses))
      );
  }

  getUserById(userId: number): Observable<User> {
    return this.http
      .get<UserResponse>(`${this.usersUrl}/${userId}`)
      .pipe(
        map(response => UserAssembler.toEntity(response))
      );
  }

  updateUserRole(userId: number, request: UpdateUserRoleRequest): Observable<User> {
    return this.http
      .patch<UserResponse>(`${this.usersUrl}/${userId}`, request)
      .pipe(
        map(response => UserAssembler.toEntity(response))
      );
  }

  updateUserStatus(userId: number, request: UpdateUserStatusRequest): Observable<User> {
    return this.http
      .patch<UserResponse>(`${this.usersUrl}/${userId}`, request)
      .pipe(
        map(response => UserAssembler.toEntity(response))
      );
  }

  updateUserProfile(userId: number, request: UpdateUserProfileRequest): Observable<User> {
    return this.http
      .patch<UserResponse>(`${this.usersUrl}/${userId}`, request)
      .pipe(
        map(response => UserAssembler.toEntity(response))
      );
  }
}