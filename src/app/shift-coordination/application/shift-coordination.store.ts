import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { IamStore } from '../../iam/application/iam.store';
import { User } from '../../iam/domain/model/user.entity';
import { CareTeam } from '../domain/model/care-team.entity';
import { TeamMember } from '../domain/model/team-member.entity';
import { ShiftRecord, ShiftStatus, ShiftType } from '../domain/model/shift-record.entity';
import { CareTeamApi } from '../infrastructure/api/care-team-api';
import { ShiftRecordApi } from '../infrastructure/api/shift-record-api';
import { CreateCareTeamRequest } from '../infrastructure/request/create-care-team-request';
import { CreateTeamMemberRequest } from '../infrastructure/request/create-team-member-request';
import { CreateShiftRecordRequest } from '../infrastructure/request/create-shift-record-request';
import { UpdateCareTeamSupervisorRequest } from '../infrastructure/request/update-care-team-supervisor-request';
import { UpdateCareTeamStatusRequest } from '../infrastructure/request/update-care-team-status-request';
import { UpdateShiftRecordStatusRequest } from '../infrastructure/request/update-shift-record-status-request';

export type SupervisorShiftStatusFilter = 'ALL' | ShiftStatus;

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

    private supervisorShiftSearchTermSignal = signal('');
    private supervisorShiftStatusFilterSignal = signal<SupervisorShiftStatusFilter>('ALL');

    teams = computed(() => this.teamsSignal());
    teamMembers = computed(() => this.teamMembersSignal());
    members = computed(() => this.teamMembersSignal());

    shiftRecords = computed(() => this.shiftRecordsSignal());
    shifts = computed(() => this.shiftRecordsSignal());

    loading = computed(() => this.loadingSignal());
    error = computed(() => this.errorSignal());

    supervisorShiftSearchTerm = computed(() => this.supervisorShiftSearchTermSignal());
    supervisorShiftStatusFilter = computed(() => this.supervisorShiftStatusFilterSignal());

    activeTeams = computed(() =>
        this.teamsSignal().filter(team => team.status === 'ACTIVE')
    );

    assignedSupervisorTeams = computed(() => {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) return [];

        return this.teamsSignal().filter(team =>
            team.status === 'ACTIVE' &&
            team.supervisorId === currentUser.id
        );
    });

    assignedSupervisorTeamIds = computed(() =>
        this.assignedSupervisorTeams().map(team => team.id)
    );

    assignedSupervisorMemberIds = computed(() =>
        this.teamMembersSignal()
            .filter(member => this.assignedSupervisorTeamIds().includes(member.teamId))
            .map(member => member.userId)
    );

    assignedSupervisorDoctors = computed(() =>
        this.iamStore.users().filter(user =>
            this.assignedSupervisorMemberIds().includes(user.id) &&
            user.role === 'DOCTOR' &&
            user.status === 'ACTIVE'
        )
    );

    supervisorShiftRecords = computed(() =>
        this.shiftRecordsSignal()
            .filter(shift => this.assignedSupervisorMemberIds().includes(shift.userId))
            .sort((a, b) =>
                new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
            )
    );

    scheduledSupervisorShifts = computed(() =>
        this.supervisorShiftRecords().filter(shift => shift.status === 'SCHEDULED')
    );

    inProgressSupervisorShifts = computed(() =>
        this.supervisorShiftRecords().filter(shift => shift.status === 'IN_PROGRESS')
    );

    completedSupervisorShifts = computed(() =>
        this.supervisorShiftRecords().filter(shift => shift.status === 'COMPLETED')
    );

    cancelledSupervisorShifts = computed(() =>
        this.supervisorShiftRecords().filter(shift => shift.status === 'CANCELLED')
    );

    filteredSupervisorShifts = computed(() => {
        const search = this.supervisorShiftSearchTermSignal().toLowerCase().trim();
        const status = this.supervisorShiftStatusFilterSignal();

        return this.supervisorShiftRecords().filter(shift => {
            const doctor = this.getUserById(shift.userId);
            const workAreaName = this.getWorkAreaName(shift.workAreaId);
            const teamName = this.getTeamNameByUserId(shift.userId);

            const matchesSearch =
                search.length === 0 ||
                doctor?.fullName.toLowerCase().includes(search) ||
                doctor?.email.toLowerCase().includes(search) ||
                workAreaName.toLowerCase().includes(search) ||
                teamName.toLowerCase().includes(search) ||
                shift.type.toLowerCase().includes(search) ||
                shift.status.toLowerCase().includes(search);

            const matchesStatus = status === 'ALL' || shift.status === status;

            return matchesSearch && matchesStatus;
        });
    });

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

    loadSupervisorShifts(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('shift.supervisor.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        this.iamStore.loadStaffData();

        forkJoin({
            teams: this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId),
            members: this.careTeamApi.getTeamMembers(),
            shifts: this.shiftRecordApi.getShiftRecordsByOrganizationId(currentUser.organizationId)
        }).subscribe({
            next: ({ teams, members, shifts }) => {
                this.teamsSignal.set(teams);
                this.teamMembersSignal.set(members);
                this.shiftRecordsSignal.set(shifts);
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('shift.supervisor.error.load-failed');
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

    createShiftRecord(request: CreateShiftRecordRequest): Observable<ShiftRecord> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.shiftRecordApi.createShiftRecord(request).pipe(
            tap({
                next: shift => {
                    this.shiftRecordsSignal.update(shifts => [shift, ...shifts]);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('shift.supervisor.error.create-failed');
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

    cancelSupervisorShift(shift: ShiftRecord): Observable<ShiftRecord> {
        this.errorSignal.set(null);

        return this.shiftRecordApi.updateShiftRecordStatus(shift.id, {
            status: 'CANCELLED'
        }).pipe(
            tap({
                next: updatedShift => {
                    this.updateShiftInState(updatedShift);
                },
                error: () => {
                    this.errorSignal.set('shift.supervisor.error.cancel-failed');
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

    updateSupervisorShiftSearchTerm(value: string): void {
        this.supervisorShiftSearchTermSignal.set(value);
    }

    updateSupervisorShiftStatusFilter(value: SupervisorShiftStatusFilter): void {
        this.supervisorShiftStatusFilterSignal.set(value);
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

    getUserById(userId: number): User | undefined {
        return this.iamStore.getUserById(userId);
    }

    getWorkAreaName(workAreaId?: number): string {
        return this.iamStore.getWorkAreaName(workAreaId);
    }

    getTeamNameByUserId(userId: number): string {
        const membership = this.teamMembersSignal().find(member => member.userId === userId);

        if (!membership) return '—';

        return this.teamsSignal().find(team => team.id === membership.teamId)?.name ?? '—';
    }

    getShiftTypeLabel(type: ShiftType): string {
        const labels: Record<ShiftType, string> = {
            DAY: 'shift.supervisor.type.day',
            NIGHT: 'shift.supervisor.type.night'
        };

        return labels[type];
    }

    getShiftStatusLabel(status: ShiftStatus): string {
        const labels: Record<ShiftStatus, string> = {
            SCHEDULED: 'shift.supervisor.status.scheduled',
            IN_PROGRESS: 'shift.supervisor.status.in-progress',
            COMPLETED: 'shift.supervisor.status.completed',
            CANCELLED: 'shift.supervisor.status.cancelled'
        };

        return labels[status];
    }

    getShiftStatusClass(status: ShiftStatus): string {
        return status.toLowerCase().replace('_', '-');
    }

    private updateTeamInState(updatedTeam: CareTeam): void {
        this.teamsSignal.update(teams =>
            teams.map(team =>
                team.id === updatedTeam.id ? updatedTeam : team
            )
        );
    }

    private updateShiftInState(updatedShift: ShiftRecord): void {
        this.shiftRecordsSignal.update(shifts => {
            const exists = shifts.some(shift => shift.id === updatedShift.id);

            if (!exists) return [updatedShift, ...shifts];

            return shifts.map(shift =>
                shift.id === updatedShift.id ? updatedShift : shift
            );
        });
    }
}