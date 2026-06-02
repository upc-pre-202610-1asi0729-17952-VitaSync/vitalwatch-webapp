import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { IamStore } from '../../iam/application/iam.store';
import { CareTeam } from '../domain/model/care-team.entity';
import { TeamMember } from '../domain/model/team-member.entity';
import { ShiftRecord } from '../domain/model/shift-record.entity';
import { CareTeamApi } from '../infrastructure/care-team-api';
import { ShiftRecordApi } from '../infrastructure/shift-record-api';
import { CreateCareTeamRequest } from '../infrastructure/create-care-team-request';
import { UpdateCareTeamSupervisorRequest } from '../infrastructure/update-care-team-supervisor-request';
import { UpdateCareTeamStatusRequest } from '../infrastructure/update-care-team-status-request';
import { CreateTeamMemberRequest } from '../infrastructure/create-team-member-request';
import { UpdateShiftRecordStatusRequest } from '../infrastructure/update-shift-record-status-request';

@Injectable({
    providedIn: 'root'
})
export class ShiftCoordinationStore {
    private authenticationStore = inject(AuthenticationStore);
    private iamStore = inject(IamStore);
    private careTeamApi = inject(CareTeamApi);
    private shiftRecordApi = inject(ShiftRecordApi);

    private teamsSignal = signal<CareTeam[]>([]);
    private membersSignal = signal<TeamMember[]>([]);
    private shiftsSignal = signal<ShiftRecord[]>([]);
    private loadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    teams = computed(() => this.teamsSignal());
    members = computed(() => this.membersSignal());
    shifts = computed(() => this.shiftsSignal());
    loading = computed(() => this.loadingSignal());
    error = computed(() => this.errorSignal());

    activeTeams = computed(() =>
        this.teamsSignal().filter(team => team.status === 'ACTIVE')
    );

    currentShift = computed(() =>
        this.shiftsSignal().find(shift => shift.status === 'IN_PROGRESS') ?? null
    );

    upcomingShifts = computed(() =>
        this.shiftsSignal()
            .filter(shift => shift.status === 'SCHEDULED')
            .sort((a, b) =>
                new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
            )
    );

    nextShift = computed(() =>
        this.upcomingShifts()[0] ?? null
    );

    completedShifts = computed(() =>
        this.shiftsSignal().filter(shift => shift.status === 'COMPLETED')
    );

    totalCompletedHours = computed(() =>
        this.completedShifts().reduce((total, shift) => {
            const start = new Date(shift.checkInAt ?? shift.scheduledStart).getTime();
            const end = new Date(shift.checkOutAt ?? shift.scheduledEnd).getTime();

            return total + Math.max(end - start, 0) / 1000 / 60 / 60;
        }, 0)
    );

    clearError(): void {
        this.errorSignal.set(null);
    }

    setError(message: string): void {
        this.errorSignal.set(message);
    }

    loadTeamManagementData(): void {
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
                this.membersSignal.set(members);

                /*
                 * Reutilizamos IamStore para usuarios, áreas y especialidades.
                 * Así team-management no vuelve a llamar directamente a UserApi ni IamCatalogApi.
                 */
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
        const doctor = this.authenticationStore.currentUser();

        if (!doctor) {
            this.errorSignal.set('shift.doctor.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        forkJoin({
            shifts: this.shiftRecordApi.getShiftRecordsByUserId(doctor.organizationId, doctor.id),
            workAreas: this.iamStore.workAreas().length > 0
                ? [this.iamStore.workAreas()]
                : this.loadWorkAreasForCurrentUser()
        }).subscribe({
            next: ({ shifts }) => {
                this.shiftsSignal.set(shifts);
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

    addTeamMember(request: CreateTeamMemberRequest): Observable<TeamMember> {
        this.errorSignal.set(null);

        return this.careTeamApi.addTeamMember(request).pipe(
            tap({
                next: member => {
                    this.membersSignal.update(members => [...members, member]);
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
                    this.membersSignal.update(members =>
                        members.filter(member => member.id !== memberId)
                    );
                },
                error: () => {
                    this.errorSignal.set('shift.teams.error.remove-member-failed');
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

                    this.membersSignal.update(members =>
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

    checkIn(shift: ShiftRecord): Observable<ShiftRecord> {
        this.errorSignal.set(null);

        return this.shiftRecordApi.updateShiftRecordStatus(shift.id, {
            status: 'IN_PROGRESS',
            checkInAt: new Date().toISOString()
        }).pipe(
            tap({
                next: updatedShift => {
                    this.replaceShift(updatedShift);
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
                    this.replaceShift(updatedShift);
                },
                error: () => {
                    this.errorSignal.set('shift.doctor.error.check-out-failed');
                }
            })
        );
    }

    countActiveTeams(): number {
        return this.activeTeams().length;
    }

    isSupervisorAlreadyAssigned(supervisorId: number | null, ignoredTeamId?: number): boolean {
        if (!supervisorId) return false;

        return this.teamsSignal().some(team =>
            team.status === 'ACTIVE' &&
            team.supervisorId === supervisorId &&
            team.id !== ignoredTeamId
        );
    }

    isDoctorAlreadyAssigned(userId: number): boolean {
        return this.membersSignal().some(member =>
            member.userId === userId
        );
    }

    getTeamMembers(teamId: number): TeamMember[] {
        return this.membersSignal().filter(member => member.teamId === teamId);
    }

    private updateTeamInState(updatedTeam: CareTeam): void {
        this.teamsSignal.update(teams =>
            teams.map(team =>
                team.id === updatedTeam.id ? updatedTeam : team
            )
        );
    }

    private replaceShift(updatedShift: ShiftRecord): void {
        this.shiftsSignal.update(shifts =>
            shifts.map(shift =>
                shift.id === updatedShift.id ? updatedShift : shift
            )
        );
    }

    private loadWorkAreasForCurrentUser() {
        this.iamStore.loadStaffData();
        return [this.iamStore.workAreas()];
    }
}