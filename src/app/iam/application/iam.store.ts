import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { AuthenticationStore } from './authentication.store';
import { User } from '../domain/model/user.entity';
import { WorkArea } from '../domain/model/work-area.entity';
import { Specialty } from '../domain/model/specialty.entity';
import { Invitation } from '../domain/model/invitation.entity';
import { UserApi } from '../infrastructure/user-api';
import { IamCatalogApi } from '../infrastructure/iam-catalog-api';
import { InvitationApi } from '../infrastructure/invitation-api';
import { CreateInvitationRequest } from '../infrastructure/request/create-invitation-request';
import { UpdateUserRoleRequest } from '../infrastructure/request/update-user-role-request';
import { UpdateUserStatusRequest } from '../infrastructure/request/update-user-status-request';
import { UpdateUserProfileRequest } from '../infrastructure/request/update-user-profile-request';

@Injectable({
    providedIn: 'root'
})
export class IamStore {
    private authenticationStore = inject(AuthenticationStore);
    private userApi = inject(UserApi);
    private catalogApi = inject(IamCatalogApi);
    private invitationApi = inject(InvitationApi);

    private usersSignal = signal<User[]>([]);
    private workAreasSignal = signal<WorkArea[]>([]);
    private specialtiesSignal = signal<Specialty[]>([]);
    private invitationsSignal = signal<Invitation[]>([]);

    private loadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    users = computed(() => this.usersSignal());
    workAreas = computed(() => this.workAreasSignal());
    specialties = computed(() => this.specialtiesSignal());
    invitations = computed(() => this.invitationsSignal());

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
}