import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CareTeam, CareTeamStatus } from '../../domain/model/care-team.entity';
import { TeamMember } from '../../domain/model/team-member.entity';
import { CreateCareTeamRequest } from '../request/create-care-team-request';
import { UpdateCareTeamSupervisorRequest } from '../request/update-care-team-supervisor-request';
import { CreateTeamMemberRequest } from '../request/create-team-member-request';
import { UpdateCareTeamStatusRequest } from '../request/update-care-team-status-request';
import { CareTeamResponse } from '../responses/care-team-response';
import { TeamMemberResponse } from '../responses/team-member-response';
import { CareTeamAssembler } from '../assemblers/care-team-assembler';
import { TeamMemberAssembler } from '../assemblers/team-member-assembler';

@Injectable({
  providedIn: 'root'
})
export class CareTeamApi {
  private http = inject(HttpClient);

  private careTeamsUrl = `${environment.platformProviderApiBaseUrl}${environment.careTeamsEndpointPath}`;
  private teamMembersUrl = `${environment.platformProviderApiBaseUrl}${environment.teamMembersEndpointPath}`;

  getCareTeamsByOrganizationId(organizationId: number): Observable<CareTeam[]> {
    return this.http
      .get<CareTeamResponse[]>(`${this.careTeamsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(responses => CareTeamAssembler.toEntities(responses))
      );
  }

  createCareTeam(request: CreateCareTeamRequest): Observable<CareTeam> {
    const payload = {
      ...request,
      status: 'ACTIVE' as CareTeamStatus
    };

    return this.http
      .post<CareTeamResponse>(this.careTeamsUrl, payload)
      .pipe(
        map(response => CareTeamAssembler.toEntity(response))
      );
  }

  updateSupervisor(
    teamId: number,
    request: UpdateCareTeamSupervisorRequest
  ): Observable<CareTeam> {
    return this.http
      .patch<CareTeamResponse>(`${this.careTeamsUrl}/${teamId}`, request)
      .pipe(
        map(response => CareTeamAssembler.toEntity(response))
      );
  }

  updateStatus(
    teamId: number,
    request: UpdateCareTeamStatusRequest
  ): Observable<CareTeam> {
    return this.http
      .patch<CareTeamResponse>(`${this.careTeamsUrl}/${teamId}`, request)
      .pipe(
        map(response => CareTeamAssembler.toEntity(response))
      );
  }

  getTeamMembers(): Observable<TeamMember[]> {
    return this.http
      .get<TeamMemberResponse[]>(this.teamMembersUrl)
      .pipe(
        map(responses => TeamMemberAssembler.toEntities(responses))
      );
  }

  addTeamMember(request: CreateTeamMemberRequest): Observable<TeamMember> {
    return this.http
      .post<TeamMemberResponse>(this.teamMembersUrl, request)
      .pipe(
        map(response => TeamMemberAssembler.toEntity(response))
      );
  }

  removeTeamMember(memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.teamMembersUrl}/${memberId}`);
  }

  deleteCareTeam(teamId: number): Observable<void> {
    return this.http
      .get<TeamMemberResponse[]>(`${this.teamMembersUrl}?teamId=${teamId}`)
      .pipe(
        switchMap(members => {
          const deleteMembersRequests = members.map(member =>
            this.http.delete<void>(`${this.teamMembersUrl}/${member.id}`)
          );

          const deleteTeamRequest = this.http.delete<void>(`${this.careTeamsUrl}/${teamId}`);

          if (deleteMembersRequests.length === 0) {
            return deleteTeamRequest;
          }

          return forkJoin(deleteMembersRequests).pipe(
            switchMap(() => deleteTeamRequest)
          );
        }),
        map(() => void 0)
      );
  }

  clearSupervisorAssignmentsByUserId(userId: number): Observable<void> {
    return this.http
      .get<CareTeamResponse[]>(`${this.careTeamsUrl}?supervisorId=${userId}`)
      .pipe(
        switchMap(teams => {
          if (teams.length === 0) return of(void 0);

          const requests = teams.map(team =>
            this.http.patch<CareTeamResponse>(`${this.careTeamsUrl}/${team.id}`, {
              supervisorId: null
            })
          );

          return forkJoin(requests).pipe(
            map(() => void 0)
          );
        })
      );
  }

  removeMembershipsByUserId(userId: number): Observable<void> {
    return this.http
      .get<TeamMemberResponse[]>(`${this.teamMembersUrl}?userId=${userId}`)
      .pipe(
        switchMap(members => {
          if (members.length === 0) return of(void 0);

          const requests = members.map(member =>
            this.http.delete<void>(`${this.teamMembersUrl}/${member.id}`)
          );

          return forkJoin(requests).pipe(
            map(() => void 0)
          );
        })
      );
  }
}