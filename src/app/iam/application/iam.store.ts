import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthenticationStore } from './authentication.store';
import { User } from '../domain/model/user.entity';
import { WorkArea } from '../domain/model/work-area.entity';
import { Specialty } from '../domain/model/specialty.entity';
import { Invitation } from '../domain/model/invitation.entity';
import { UserApi } from '../infrastructure/api/user-api';
import { IamCatalogApi } from '../infrastructure/api/iam-catalog-api';
import { InvitationApi } from '../infrastructure/api/invitation-api';
import { CareTeamApi } from '../../shift-coordination/infrastructure/api/care-team-api';
import { CreateInvitationRequest } from '../infrastructure/request/create-invitation-request';
import { UpdateUserRoleRequest } from '../infrastructure/request/update-user-role-request';
import { UpdateUserStatusRequest } from '../infrastructure/request/update-user-status-request';
import { UpdateUserProfileRequest } from '../infrastructure/request/update-user-profile-request';
import { AcceptInvitationRequest } from '../infrastructure/request/accept-invitation-request';

@Injectable({
    providedIn: 'root'
})
export class IamStore {
    private authenticationStore = inject(AuthenticationStore);
    private userApi = inject(UserApi);
    private catalogApi = inject(IamCatalogApi);
    private invitationApi = inject(InvitationApi);
    private careTeamApi = inject(CareTeamApi);

    private usersSignal = signal<User[]>([]);
    private workAreasSignal = signal<WorkArea[]>([]);
    private specialtiesSignal = signal<Specialty[]>([]);
    private invitationsSignal = signal<Invitation[]>([]);
    private registrationInvitationSignal = signal<Invitation | null>(null);

    private loadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    users = computed(() => this.usersSignal());
    workAreas = computed(() => this.workAreasSignal());
    specialties = computed(() => this.specialtiesSignal());
    invitations = computed(() => this.invitationsSignal());
    registrationInvitation = computed(() => this.registrationInvitationSignal());

    loading = computed(() => this.loadingSignal());
    error = computed(() => this.errorSignal());

    activeUsers = computed(() =>
        this.usersSignal().filter(user => user.status === 'ACTIVE')
    );

    activeDoctors = computed(() =>
        this.usersSignal().filter(user =>
            user.role === 'DOCTOR' &&
            user.status === 'ACTIVE'
        )
    );

    activeSupervisors = computed(() =>
        this.usersSignal().filter(user =>
            user.role === 'SUPERVISOR' &&
            user.status === 'ACTIVE'
        )
    );

    pendingInvitations = computed(() =>
        this.invitationsSignal().filter(invitation => invitation.status === 'PENDING')
    );

    acceptedInvitations = computed(() =>
        this.invitationsSignal().filter(invitation => invitation.status === 'ACCEPTED')
    );

    cancelledInvitations = computed(() =>
        this.invitationsSignal().filter(invitation => invitation.status === 'CANCELLED')
    );

    clearError(): void {
        this.errorSignal.set(null);
    }

    setError(message: string): void {
        this.errorSignal.set(message);
    }

    loadStaffData(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('iam.staff.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        forkJoin({
            users: this.userApi.getUsersByOrganizationId(currentUser.organizationId),
            workAreas: this.catalogApi.getWorkAreasByOrganizationId(currentUser.organizationId),
            specialties: this.catalogApi.getSpecialties()
        }).subscribe({
            next: ({ users, workAreas, specialties }) => {
                this.usersSignal.set(users);
                this.workAreasSignal.set(workAreas);
                this.specialtiesSignal.set(specialties);
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('iam.staff.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

  loadCatalogData(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorSignal.set('iam.staff.error.no-session');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      workAreas: this.catalogApi.getWorkAreasByOrganizationId(currentUser.organizationId),
      specialties: this.catalogApi.getSpecialties()
    }).subscribe({
      next: ({ workAreas, specialties }) => {
        this.workAreasSignal.set(workAreas);
        this.specialtiesSignal.set(specialties);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set('auth.error.catalog-load-failed');
        this.loadingSignal.set(false);
      }
    });
  }

    loadInvitations(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('iam.invitations.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        this.invitationApi.getInvitationsByOrganizationId(currentUser.organizationId).subscribe({
            next: invitations => {
                this.invitationsSignal.set([...invitations].reverse());
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('iam.invitations.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

    loadInvitationForRegistration(token: string | null): void {
        if (!token) {
            this.errorSignal.set('auth.error.invitation-token-missing');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);
        this.registrationInvitationSignal.set(null);

        this.invitationApi.getInvitationByToken(token).subscribe({
            next: invitation => {
                if (!invitation || !invitation.isPending) {
                    this.errorSignal.set('auth.error.invitation-not-available');
                    this.loadingSignal.set(false);
                    return;
                }

                this.registrationInvitationSignal.set(invitation);

                forkJoin({
                    workAreas: this.catalogApi.getWorkAreasByOrganizationId(invitation.organizationId),
                    specialties: this.catalogApi.getSpecialties()
                }).subscribe({
                    next: ({ workAreas, specialties }) => {
                        this.workAreasSignal.set(workAreas);
                        this.specialtiesSignal.set(specialties);
                        this.loadingSignal.set(false);
                    },
                    error: () => {
                        this.errorSignal.set('auth.error.catalog-load-failed');
                        this.loadingSignal.set(false);
                    }
                });
            },
            error: () => {
                this.errorSignal.set('auth.error.invitation-not-found');
                this.loadingSignal.set(false);
            }
        });
    }

    acceptInvitationRegistration(request: AcceptInvitationRequest): Observable<Invitation | null> {
        const invitation = this.registrationInvitationSignal();

        if (!invitation) {
            this.errorSignal.set('auth.error.invitation-not-found');
            return of(null);
        }

        if (!invitation.isPending) {
            this.errorSignal.set('auth.error.invitation-not-available');
            return of(null);
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.invitationApi.acceptInvitation(invitation, request).pipe(
            tap({
                next: updatedInvitation => {
                    this.registrationInvitationSignal.set(updatedInvitation);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('auth.error.invitation-accept-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    updateUserRole(userId: number, request: UpdateUserRoleRequest): Observable<User> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.userApi.updateUserRole(userId, request).pipe(
            tap({
                next: updatedUser => {
                    this.updateUserInState(updatedUser);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('iam.staff.error.update-role-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    updateUserRoleWithAssignmentCleanup(
        user: User,
        request: UpdateUserRoleRequest
    ): Observable<User> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.userApi.updateUserRole(user.id, request).pipe(
            switchMap(updatedUser =>
                this.cleanAssignmentsAfterRoleChange(updatedUser).pipe(
                    map(() => updatedUser),
                    catchError(() => {
                        this.errorSignal.set('iam.staff.error.cleanup-failed');
                        return of(updatedUser);
                    })
                )
            ),
            tap({
                next: updatedUser => {
                    this.updateUserInState(updatedUser);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('iam.staff.error.update-role-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    updateUserStatus(userId: number, request: UpdateUserStatusRequest): Observable<User> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.userApi.updateUserStatus(userId, request).pipe(
            tap({
                next: updatedUser => {
                    this.updateUserInState(updatedUser);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('iam.staff.error.update-status-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    updateUserStatusWithAssignmentCleanup(
        user: User,
        request: UpdateUserStatusRequest
    ): Observable<User> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.userApi.updateUserStatus(user.id, request).pipe(
            switchMap(updatedUser => {
                if (updatedUser.status !== 'INACTIVE') {
                    return of(updatedUser);
                }

                return this.cleanAllAssignments(updatedUser).pipe(
                    map(() => updatedUser),
                    catchError(() => {
                        this.errorSignal.set('iam.staff.error.cleanup-failed');
                        return of(updatedUser);
                    })
                );
            }),
            tap({
                next: updatedUser => {
                    this.updateUserInState(updatedUser);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('iam.staff.error.update-status-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    updateUserProfile(userId: number, request: UpdateUserProfileRequest): Observable<User> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.userApi.updateUserProfile(userId, request).pipe(
            tap({
                next: updatedUser => {
                    this.updateUserInState(updatedUser);
                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('settings.account.error.update-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    createInvitation(request: CreateInvitationRequest): Observable<Invitation> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.invitationApi.createInvitation(request).pipe(
            tap({
                next: invitation => {
                    this.invitationsSignal.update(invitations => [invitation, ...invitations]);
                    this.loadingSignal.set(false);
                },
                error: error => {
                    this.errorSignal.set(
                        error.error?.message ?? 'iam.invitations.error.create-failed'
                    );

                    this.loadingSignal.set(false);
                }
            })
        );
    }

    cancelInvitation(invitationId: number): Observable<Invitation> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.invitationApi.cancelInvitation(invitationId).pipe(
            tap({
                next: updatedInvitation => {
                    this.invitationsSignal.update(invitations =>
                        invitations.map(invitation =>
                            invitation.id === updatedInvitation.id ? updatedInvitation : invitation
                        )
                    );

                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('iam.invitations.error.cancel-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    deleteInvitation(invitationId: number): Observable<void> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.invitationApi.deleteInvitation(invitationId).pipe(
            tap({
                next: () => {
                    this.invitationsSignal.update(invitations =>
                        invitations.filter(invitation => invitation.id !== invitationId)
                    );

                    this.loadingSignal.set(false);
                },
                error: () => {
                    this.errorSignal.set('iam.invitations.error.delete-failed');
                    this.loadingSignal.set(false);
                }
            })
        );
    }

    getUserById(userId: number): User | undefined {
        return this.usersSignal().find(user => user.id === userId);
    }

    getWorkAreaName(workAreaId?: number): string {
        if (!workAreaId) return '—';

        return this.workAreasSignal().find(workArea => workArea.id === workAreaId)?.name ?? '—';
    }

    getSpecialtyName(specialtyId?: number): string {
        if (!specialtyId) return '—';

        return this.specialtiesSignal().find(specialty => specialty.id === specialtyId)?.name ?? '—';
    }

    countActiveDoctors(): number {
        return this.activeDoctors().length;
    }

    countActiveSupervisors(): number {
        return this.activeSupervisors().length;
    }

    countInvitationsThisMonth(): number {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        return this.invitationsSignal().filter(invitation => {
            const createdAt = new Date(invitation.createdAt);

            return createdAt.getMonth() === currentMonth &&
                createdAt.getFullYear() === currentYear;
        }).length;
    }

    private updateUserInState(updatedUser: User): void {
        this.usersSignal.update(users => {
            const exists = users.some(user => user.id === updatedUser.id);

            if (!exists) {
                return [updatedUser, ...users];
            }

            return users.map(user =>
                user.id === updatedUser.id ? updatedUser : user
            );
        });
    }

    private cleanAssignmentsAfterRoleChange(updatedUser: User): Observable<void> {
        if (updatedUser.role === 'SUPERVISOR') {
            return this.careTeamApi.removeMembershipsByUserId(updatedUser.id);
        }

        if (updatedUser.role === 'DOCTOR') {
            return this.careTeamApi.clearSupervisorAssignmentsByUserId(updatedUser.id);
        }

        return of(void 0);
    }

    private cleanAllAssignments(updatedUser: User): Observable<void> {
        return forkJoin([
            this.careTeamApi.clearSupervisorAssignmentsByUserId(updatedUser.id),
            this.careTeamApi.removeMembershipsByUserId(updatedUser.id)
        ]).pipe(
            map(() => void 0)
        );
    }
}
