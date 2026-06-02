import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole, UserStatus } from '../domain/model/user.entity';
import { UpdateUserRoleRequest } from './request/update-user-role-request';
import { UpdateUserStatusRequest } from './request/update-user-status-request';
import { UpdateUserProfileRequest } from './request/update-user-profile-request';

interface UserResource {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  workAreaId?: number;
  specialtyId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserApi {
  private http = inject(HttpClient);
  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  getUsersByOrganizationId(organizationId: number): Observable<User[]> {
    return this.http
      .get<UserResource[]>(`${this.usersUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.map(resource => this.toUser(resource)))
      );
  }

  updateUserRole(userId: number, request: UpdateUserRoleRequest): Observable<User> {
    return this.http
      .patch<UserResource>(`${this.usersUrl}/${userId}`, request)
      .pipe(
        map(resource => this.toUser(resource))
      );
  }

  updateUserStatus(userId: number, request: UpdateUserStatusRequest): Observable<User> {
    return this.http
      .patch<UserResource>(`${this.usersUrl}/${userId}`, request)
      .pipe(
        map(resource => this.toUser(resource))
      );
  }

  updateUserProfile(userId: number, request: UpdateUserProfileRequest): Observable<User> {
    return this.http
      .patch<UserResource>(`${this.usersUrl}/${userId}`, request)
      .pipe(
        map(resource => this.toUser(resource))
      );
  }

  private toUser(resource: UserResource): User {
    return new User({
      id: resource.id,
      organizationId: resource.organizationId,
      firstName: resource.firstName,
      lastName: resource.lastName,
      email: resource.email,
      role: resource.role,
      status: resource.status,
      phone: resource.phone,
      workAreaId: resource.workAreaId,
      specialtyId: resource.specialtyId
    });
  }
}