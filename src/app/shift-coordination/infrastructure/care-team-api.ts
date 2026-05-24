import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CareTeam, CareTeamStatus } from '../domain/model/care-team.entity';
import { TeamMember } from '../domain/model/team-member.entity';
import { CreateCareTeamRequest } from './create-care-team-request';
import { UpdateCareTeamSupervisorRequest } from './update-care-team-supervisor-request';
import { CreateTeamMemberRequest } from './create-team-member-request';
import { UpdateCareTeamStatusRequest } from './update-care-team-status-request';

interface CareTeamResource {
  id: number;
  organizationId: number;
  name: string;
  workAreaId: number;
  supervisorId: number | null;
  status: CareTeamStatus;
}

interface TeamMemberResource {
  id: number;
  teamId: number;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CareTeamApi {
  private http = inject(HttpClient);

  private careTeamsUrl = `${environment.platformProviderApiBaseUrl}${environment.careTeamsEndpointPath}`;
  private teamMembersUrl = `${environment.platformProviderApiBaseUrl}${environment.teamMembersEndpointPath}`;

  getCareTeamsByOrganizationId(organizationId: number): Observable<CareTeam[]> {
    return this.http
      .get<CareTeamResource[]>(`${this.careTeamsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.map(resource => this.toCareTeam(resource)))
      );
  }

  createCareTeam(request: CreateCareTeamRequest): Observable<CareTeam> {
    const payload = {
      ...request,
      status: 'ACTIVE' as CareTeamStatus
    };

    return this.http
      .post<CareTeamResource>(this.careTeamsUrl, payload)
      .pipe(
        map(resource => this.toCareTeam(resource))
      );
  }

  updateSupervisor(teamId: number, request: UpdateCareTeamSupervisorRequest): Observable<CareTeam> {
    return this.http
      .patch<CareTeamResource>(`${this.careTeamsUrl}/${teamId}`, request)
      .pipe(
        map(resource => this.toCareTeam(resource))
      );
  }

  updateStatus(teamId: number, request: UpdateCareTeamStatusRequest): Observable<CareTeam> {
    return this.http
      .patch<CareTeamResource>(`${this.careTeamsUrl}/${teamId}`, request)
      .pipe(
        map(resource => this.toCareTeam(resource))
      );
  }

  getTeamMembers(): Observable<TeamMember[]> {
    return this.http
      .get<TeamMemberResource[]>(this.teamMembersUrl)
      .pipe(
        map(resources => resources.map(resource => this.toTeamMember(resource)))
      );
  }

  addTeamMember(request: CreateTeamMemberRequest): Observable<TeamMember> {
    return this.http
      .post<TeamMemberResource>(this.teamMembersUrl, request)
      .pipe(
        map(resource => this.toTeamMember(resource))
      );
  }

  removeTeamMember(memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.teamMembersUrl}/${memberId}`);
  }

  private toCareTeam(resource: CareTeamResource): CareTeam {
    return new CareTeam({
      id: resource.id,
      organizationId: resource.organizationId,
      name: resource.name,
      workAreaId: resource.workAreaId,
      supervisorId: resource.supervisorId,
      status: resource.status
    });
  }

  private toTeamMember(resource: TeamMemberResource): TeamMember {
    return new TeamMember({
      id: resource.id,
      teamId: resource.teamId,
      userId: resource.userId
    });
  }

  deleteCareTeam(teamId: number): Observable<void> {
    return this.http
      .get<TeamMemberResource[]>(`${this.teamMembersUrl}?teamId=${teamId}`)
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
      .get<CareTeamResource[]>(`${this.careTeamsUrl}?supervisorId=${userId}`)
      .pipe(
        switchMap(teams => {
          if (teams.length === 0) return of(void 0);

          const requests = teams.map(team =>
            this.http.patch<CareTeamResource>(`${this.careTeamsUrl}/${team.id}`, {
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
      .get<TeamMemberResource[]>(`${this.teamMembersUrl}?userId=${userId}`)
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
