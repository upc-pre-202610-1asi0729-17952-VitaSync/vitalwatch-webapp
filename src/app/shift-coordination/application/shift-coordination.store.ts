import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { IamStore } from '../../iam/application/iam.store';
import { CareTeam } from '../domain/model/care-team.entity';
import { TeamMember } from '../domain/model/team-member.entity';
import { ShiftRecord } from '../domain/model/shift-record.entity';
import { CareTeamApi } from '../infrastructure/api/care-team-api';
import { ShiftRecordApi } from '../infrastructure/api/shift-record-api';
import { CreateCareTeamRequest } from '../infrastructure/request/create-care-team-request';
import { CreateTeamMemberRequest } from '../infrastructure/request/create-team-member-request';
import { UpdateCareTeamSupervisorRequest } from '../infrastructure/request/update-care-team-supervisor-request';
import { UpdateCareTeamStatusRequest } from '../infrastructure/request/update-care-team-status-request';
import { UpdateShiftRecordStatusRequest } from '../infrastructure/request/update-shift-record-status-request';

@Injectable({
    providedIn: 'root'
})
export class ShiftCoordinationStore {
    private authenticationStore = inject(AuthenticationStore);
    private iamStore = inject(IamStore);
    private careTeamApi = inject(CareTeamApi);
    private shiftRecordApi = inject(ShiftRecordApi);

    private teamsSignal = signal<CareTeam[]>([]);
    private teamMembersSignal = signal<TeamMember[]>([]);
    private shiftRecordsSignal = signal<ShiftRecord[]>([]);
    private loadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    teams = computed(() => this.teamsSignal());
    teamMembers = computed(() => this.teamMembersSignal());
    members = computed(() => this.teamMembersSignal());

    shiftRecords = computed(() => this.shiftRecordsSignal());
    shifts = computed(() => this.shiftRecordsSignal());

    loading = computed(() => this.loadingSignal());
    error = computed(() => this.errorSignal());

    activeTeams = computed(() =>
        this.teamsSignal().filter(team => team.status === 'ACTIVE')
    );

    clearError(): void {
        this.errorSignal.set(null);
    }

    setError(message: string): void {
        this.errorSignal.set(message);
    }

    loadTeams(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('shift.teams.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        forkJoin({
            teams: this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId),
            members: this.careTeamApi.getTeamMembers()
        }).subscribe({
            next: ({ teams, members }) => {
                this.teamsSignal.set([...teams].reverse());
                this.teamMembersSignal.set(members);
                this.iamStore.loadStaffData();
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('shift.teams.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

    loadDoctorShifts(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('shift.doctor.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        this.iamStore.loadStaffData();

        this.shiftRecordApi.getShiftRecordsByUserId(
            currentUser.organizationId,
            currentUser.id
        ).subscribe({
            next: shifts => {
                this.shiftRecordsSignal.set(shifts);
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('shift.doctor.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

    createTeam(request: CreateCareTeamRequest): Observable<CareTeam> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.careTeamApi.createCareTeam(request).pipe(
            tap({
                next: team => {
                    this.teamsSignal.update(teams => [team, ...teams]);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.create-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    updateSupervisor(
        teamId: number,
        request: UpdateCareTeamSupervisorRequest
    ): Observable<CareTeam> {
        this.errorSignal.set(null);

        return this.careTeamApi.updateSupervisor(teamId, request).pipe(
            tap({
                next: updatedTeam => {
                    this.updateTeamInState(updatedTeam);
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.update-supervisor-failed');
                }
            })
        );
    }

    updateTeamStatus(
        teamId: number,
        request: UpdateCareTeamStatusRequest
    ): Observable<CareTeam> {
        this.errorSignal.set(null);

        return this.careTeamApi.updateStatus(teamId, request).pipe(
            tap({
                next: updatedTeam => {
                    this.updateTeamInState(updatedTeam);
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.update-status-failed');
                }
            })
        );
    }

    deleteTeam(team: CareTeam): Observable<void> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.careTeamApi.deleteCareTeam(team.id).pipe(
            tap({
                next: () => {
                    this.teamsSignal.update(teams =>
                        teams.filter(item => item.id !== team.id)
                    );

                    this.teamMembersSignal.update(members =>
                        members.filter(member => member.teamId !== team.id)
                    );

                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.delete-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    addTeamMember(request: CreateTeamMemberRequest): Observable<TeamMember> {
        this.errorSignal.set(null);

        return this.careTeamApi.addTeamMember(request).pipe(
            tap({
                next: member => {
                    this.teamMembersSignal.update(members => [...members, member]);
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.add-member-failed');
                }
            })
        );
    }

    removeTeamMember(memberId: number): Observable<void> {
        this.errorSignal.set(null);

        return this.careTeamApi.removeTeamMember(memberId).pipe(
            tap({
                next: () => {
                    this.teamMembersSignal.update(members =>
                        members.filter(member => member.id !== memberId)
                    );
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.remove-member-failed');
                }
            })
        );
    }

    updateShiftStatus(
        shiftRecordId: number,
        request: UpdateShiftRecordStatusRequest
    ): Observable<ShiftRecord> {
        this.errorSignal.set(null);

        return this.shiftRecordApi.updateShiftRecordStatus(shiftRecordId, request).pipe(
            tap({
                next: updatedShift => {
                    this.updateShiftInState(updatedShift);
                },
                error: () => {
                    this.errorSignal.set('shift.doctor.error.update-status-failed');
                }
            })
        );
    }

    checkIn(shift: ShiftRecord): Observable<ShiftRecord> {
        this.errorSignal.set(null);

        return this.shiftRecordApi.updateShiftRecordStatus(shift.id, {
            status: 'IN_PROGRESS',
            checkInAt: new Date().toISOString()
        }).pipe(
            tap({
                next: updatedShift => {
                    this.updateShiftInState(updatedShift);
                },
                error: () => {
                    this.errorSignal.set('shift.doctor.error.check-in-failed');
                }
            })
        );
    }

    checkOut(shift: ShiftRecord): Observable<ShiftRecord> {
        this.errorSignal.set(null);

        return this.shiftRecordApi.updateShiftRecordStatus(shift.id, {
            status: 'COMPLETED',
            checkOutAt: new Date().toISOString()
        }).pipe(
            tap({
                next: updatedShift => {
                    this.updateShiftInState(updatedShift);
                },
                error: () => {
                    this.errorSignal.set('shift.doctor.error.check-out-failed');
                }
            })
        );
    }

    clearSupervisorAssignmentsByUserId(userId: number): Observable<void> {
        return this.careTeamApi.clearSupervisorAssignmentsByUserId(userId).pipe(
            tap({
                next: () => {
                    this.teamsSignal.update(teams =>
                        teams.map(team =>
                            team.supervisorId === userId
                                ? new CareTeam({
                                    id: team.id,
                                    organizationId: team.organizationId,
                                    name: team.name,
                                    workAreaId: team.workAreaId,
                                    supervisorId: null,
                                    status: team.status
                                })
                                : team
                        )
                    );
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.cleanup-failed');
                }
            })
        );
    }

    removeMembershipsByUserId(userId: number): Observable<void> {
        return this.careTeamApi.removeMembershipsByUserId(userId).pipe(
            tap({
                next: () => {
                    this.teamMembersSignal.update(members =>
                        members.filter(member => member.userId !== userId)
                    );
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.cleanup-failed');
                }
            })
        );
    }

    getMembersByTeamId(teamId: number): TeamMember[] {
        return this.teamMembersSignal().filter(member => member.teamId === teamId);
    }

    getTeamMembers(teamId: number): TeamMember[] {
        return this.getMembersByTeamId(teamId);
    }

    isSupervisorAlreadyAssigned(supervisorId: number | null, ignoredTeamId?: number): boolean {
        if (!supervisorId) return false;

        return this.teamsSignal().some(team =>
            team.status === 'ACTIVE' &&
            team.supervisorId === supervisorId &&
            team.id !== ignoredTeamId
        );
    }

    isUserAlreadyMember(userId: number): boolean {
        return this.teamMembersSignal().some(member => member.userId === userId);
    }

    countActiveTeams(): number {
        return this.activeTeams().length;
    }

    private updateTeamInState(updatedTeam: CareTeam): void {
        this.teamsSignal.update(teams =>
            teams.map(team =>
                team.id === updatedTeam.id ? updatedTeam : team
            )
        );
    }

    private updateShiftInState(updatedShift: ShiftRecord): void {
        this.shiftRecordsSignal.update(shifts =>
            shifts.map(shift =>
                shift.id === updatedShift.id ? updatedShift : shift
            )
        );
    }
}