import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invitation } from '../domain/model/invitation.entity';
import { InvitationResource } from './invitation-response';
import { AcceptInvitationRequest } from './accept-invitation-request';

@Injectable({
  providedIn: 'root'
})
export class InvitationApi {
  private http = inject(HttpClient);

  private invitationsUrl = `${environment.platformProviderApiBaseUrl}${environment.invitationsEndpointPath}`;
  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  getInvitationByToken(token: string): Observable<Invitation> {
    return this.http
      .get<InvitationResource[]>(`${this.invitationsUrl}?token=${token}`)
      .pipe(
        map(resources => {
          const resource = resources[0];

          if (!resource) {
            throw new Error('Invitation not found.');
          }

          return new Invitation({
            id: resource.id,
            organizationId: resource.organizationId,
            email: resource.email,
            role: resource.role,
            status: resource.status,
            token: resource.token
          });
        })
      );
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
}