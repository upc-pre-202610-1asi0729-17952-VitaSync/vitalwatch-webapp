import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../application/authentication.store';
import { UserApi } from '../../../infrastructure/user-api';
import { IamCatalogApi } from '../../../infrastructure/iam-catalog-api';
import { User, UserRole, UserStatus } from '../../../domain/model/user.entity';
import { WorkArea } from '../../../domain/model/work-area.entity';
import { Specialty } from '../../../domain/model/specialty.entity';
import { forkJoin } from 'rxjs';
import { CareTeamApi } from '../../../../shift-coordination/infrastructure/care-team-api';

type RoleFilter = 'ALL' | UserRole;
type StatusFilter = 'ALL' | UserStatus;

@Component({
  selector: 'app-staff-management',
  imports: [
    TranslatePipe,
    MatSelectModule,
    NgIcon
  ],
  templateUrl: './staff-management.html',
  styleUrl: './staff-management.css'
})
export class StaffManagement implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private userApi = inject(UserApi);
  private catalogApi = inject(IamCatalogApi);
  private careTeamApi = inject(CareTeamApi);
  protected users = signal<User[]>([]);
  protected workAreas = signal<WorkArea[]>([]);
  protected specialties = signal<Specialty[]>([]);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected searchTerm = signal('');
  protected roleFilter = signal<RoleFilter>('ALL');
  protected statusFilter = signal<StatusFilter>('ALL');

  protected roleOptions: UserRole[] = ['DOCTOR', 'SUPERVISOR'];

  protected filteredUsers = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter(user => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search);

      const matchesRole = role === 'ALL' || user.role === role;
      const matchesStatus = status === 'ALL' || user.status === status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  });

  protected totalUsers = computed(() => this.users().length);
  protected activeUsers = computed(() => this.users().filter(user => user.status === 'ACTIVE').length);
  protected supervisors = computed(() => this.users().filter(user => user.role === 'SUPERVISOR').length);
  protected doctors = computed(() => this.users().filter(user => user.role === 'DOCTOR').length);

  private updateUserInList(updatedUser: User): void {
    this.users.update(users =>
      users.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
  }

  private cleanAssignmentsAfterRoleChange(updatedUser: User): void {
    if (updatedUser.role === 'SUPERVISOR') {
      this.careTeamApi.removeMembershipsByUserId(updatedUser.id).subscribe({
        error: () => {
          this.errorMessage.set('iam.staff.error.cleanup-failed');
        }
      });

      return;
    }

    if (updatedUser.role === 'DOCTOR') {
      this.careTeamApi.clearSupervisorAssignmentsByUserId(updatedUser.id).subscribe({
        error: () => {
          this.errorMessage.set('iam.staff.error.cleanup-failed');
        }
      });
    }
  }

  private cleanAllAssignments(updatedUser: User): void {
    forkJoin([
      this.careTeamApi.clearSupervisorAssignmentsByUserId(updatedUser.id),
      this.careTeamApi.removeMembershipsByUserId(updatedUser.id)
    ]).subscribe({
      error: () => {
        this.errorMessage.set('iam.staff.error.cleanup-failed');
      }
    });
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateRoleFilter(value: RoleFilter): void {
    this.roleFilter.set(value);
  }

  protected updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected updateUserRole(user: User, role: UserRole): void {
    if (user.isAdmin) return;

    this.userApi.updateUserRole(user.id, { role }).subscribe({
      next: updatedUser => {
        this.users.update(users =>
          users.map(item => item.id === updatedUser.id ? updatedUser : item)
        );
      },
      error: () => {
        this.errorMessage.set('iam.staff.error.update-role-failed');
      }
    });
  }

  protected toggleUserStatus(user: User): void {
    if (user.isAdmin) return;

    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    this.userApi.updateUserStatus(user.id, { status: nextStatus }).subscribe({
      next: updatedUser => {
        this.updateUserInList(updatedUser);

        if (updatedUser.status === 'INACTIVE') {
          this.cleanAllAssignments(updatedUser);
        }

        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('iam.staff.error.update-status-failed');
      }
    });
  }

  protected getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      HOSPITAL_ADMIN: 'iam.roles.admin',
      SUPERVISOR: 'iam.roles.supervisor',
      DOCTOR: 'iam.roles.doctor'
    };

    return labels[role];
  }

  protected getStatusLabel(status: UserStatus): string {
    const labels: Record<UserStatus, string> = {
      PENDING: 'iam.staff.status.pending',
      ACTIVE: 'iam.staff.status.active',
      INACTIVE: 'iam.staff.status.inactive'
    };

    return labels[status];
  }

  protected getWorkAreaName(workAreaId?: number): string {
    if (!workAreaId) return '—';

    return this.workAreas().find(workArea => workArea.id === workAreaId)?.name ?? '—';
  }

  protected getSpecialtyName(specialtyId?: number): string {
    if (!specialtyId) return '—';

    return this.specialties().find(specialty => specialty.id === specialtyId)?.name ?? '—';
  }

  private loadStaff(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('iam.staff.error.no-session');
      return;
    }

    this.loading.set(true);

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('iam.staff.error.load-failed');
        this.loading.set(false);
      }
    });

    this.catalogApi.getWorkAreasByOrganizationId(currentUser.organizationId).subscribe(workAreas => {
      this.workAreas.set(workAreas);
    });

    this.catalogApi.getSpecialties().subscribe(specialties => {
      this.specialties.set(specialties);
    });
  }
}