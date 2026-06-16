import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Invitation } from '../../domain/model/invitation.entity';
import { InvitationResource } from '../responses/invitation-response';
import { InvitationAssembler } from '../assemblers/invitation-assembler';
import { CreateInvitationRequest } from '../request/create-invitation-request';
import { AcceptInvitationRequest } from '../request/accept-invitation-request';

@Injectable({
  providedIn: 'root'
})
export class InvitationApi {
  private http = inject(HttpClient);

  private invitationsUrl = `${environment.platformProviderApiBaseUrl}${environment.invitationsEndpointPath}`;
  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  getInvitationsByOrganizationId(organizationId: number): Observable<Invitation[]> {
    return this.http
      .get<InvitationResource[]>(
        `${this.invitationsUrl}?organizationId=${organizationId}&_sort=createdAt&_order=desc`
      )
      .pipe(
        map(responses => InvitationAssembler.toEntities(responses))
      );
  }

  getInvitationByToken(token: string): Observable<Invitation | null> {
    return this.http
      .get<InvitationResource[]>(`${this.invitationsUrl}?token=${token}`)
      .pipe(
        map(responses =>
          responses.length > 0
            ? InvitationAssembler.toEntity(responses[0])
            : null
        )
      );
  }

  createInvitation(request: CreateInvitationRequest): Observable<Invitation> {
    return this.http
      .post<InvitationResource>(`${this.invitationsUrl}/send`, request)
      .pipe(
        map(response => InvitationAssembler.toEntity(response))
      );
  }

  cancelInvitation(invitationId: number): Observable<Invitation> {
    return this.http
      .patch<InvitationResource>(`${this.invitationsUrl}/${invitationId}`, {
        status: 'CANCELLED'
      })
      .pipe(
        map(response => InvitationAssembler.toEntity(response))
      );
  }

  deleteInvitation(invitationId: number): Observable<void> {
    return this.http.delete<void>(`${this.invitationsUrl}/${invitationId}`);
  }

  acceptInvitation(invitation: Invitation, request: AcceptInvitationRequest): Observable<Invitation> {
    const userPayload = {
      organizationId: invitation.organizationId,
      firstName: request.firstName,
      lastName: request.lastName,
      email: invitation.email,
      password: request.password,
      phone: request.phone,
      workAreaId: request.workAreaId,
      specialtyId: request.specialtyId,
      role: invitation.role,
      status: 'ACTIVE'
    };

    return this.http.post(this.usersUrl, userPayload).pipe(
      switchMap(() =>
        this.http.patch<InvitationResource>(`${this.invitationsUrl}/${invitation.id}`, {
          status: 'ACCEPTED'
        })
      ),
      map(response => InvitationAssembler.toEntity(response))
    );
  }
}