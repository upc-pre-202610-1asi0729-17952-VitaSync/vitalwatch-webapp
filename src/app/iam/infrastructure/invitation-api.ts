import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invitation } from '../domain/model/invitation.entity';
import { InvitationResource } from './responses/invitation-response';
import { AcceptInvitationRequest } from './request/accept-invitation-request';
import { CreateInvitationRequest } from './request/create-invitation-request';

@Injectable({
  providedIn: 'root'
})
export class InvitationApi {
  private http = inject(HttpClient);

  private invitationsUrl = `${environment.platformProviderApiBaseUrl}${environment.invitationsEndpointPath}`;
  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  getInvitationsByOrganizationId(organizationId: number): Observable<Invitation[]> {
    return this.http
      .get<InvitationResource[]>(`${this.invitationsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.map(resource => this.toInvitation(resource)))
      );
  }

  getInvitationByToken(token: string): Observable<Invitation> {
    return this.http
      .get<InvitationResource[]>(`${this.invitationsUrl}?token=${token}`)
      .pipe(
        map(resources => {
          const resource = resources[0];

          if (!resource) {
            throw new Error('Invitation not found.');
          }

          return this.toInvitation(resource);
        })
      );
  }

  createInvitation(request: CreateInvitationRequest): Observable<Invitation> {
    return this.http
      .post<InvitationResource>(`${this.invitationsUrl}/send`, request)
      .pipe(
        map(resource => this.toInvitation(resource))
      );
  }

  cancelInvitation(id: number): Observable<Invitation> {
    return this.http
      .patch<InvitationResource>(`${this.invitationsUrl}/${id}`, {
        status: 'CANCELLED'
      })
      .pipe(
        map(resource => this.toInvitation(resource))
      );
  }

  deleteInvitation(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.invitationsUrl}/${id}`);
  }

  acceptInvitation(request: AcceptInvitationRequest): Observable<void> {
    const userPayload = {
      organizationId: request.organizationId,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      password: request.password,
      phone: request.phone,
      workAreaId: request.workAreaId,
      specialtyId: request.specialtyId,
      role: request.role,
      status: 'ACTIVE'
    };

    return this.http.post(this.usersUrl, userPayload).pipe(
      switchMap(() =>
        this.http.patch(`${this.invitationsUrl}/${request.invitationId}`, {
          status: 'ACCEPTED'
        })
      ),
      map(() => void 0)
    );
  }

  private toInvitation(resource: InvitationResource): Invitation {
    return new Invitation({
      id: resource.id,
      organizationId: resource.organizationId,
      email: resource.email,
      role: resource.role,
      status: resource.status,
      token: resource.token,
      createdAt: resource.createdAt
    });
  }
}