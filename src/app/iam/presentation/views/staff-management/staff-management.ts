import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { forkJoin } from 'rxjs';
import { User, UserRole, UserStatus } from '../../../domain/model/user.entity';
import { IamStore } from '../../../application/iam.store';
import { CareTeamApi } from '../../../../shift-coordination/infrastructure/care-team-api';
import { SubscriptionAccessService } from '../../../../subscription-plan-management/application/subscription-access.service';

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
  private iamStore = inject(IamStore);
  private careTeamApi = inject(CareTeamApi);
  private subscriptionAccessService = inject(SubscriptionAccessService);

  private localErrorMessage = signal<string | null>(null);

  protected users = computed(() =>
    this.iamStore.users()
  );

  protected workAreas = computed(() =>
    this.iamStore.workAreas()
  );

  protected specialties = computed(() =>
    this.iamStore.specialties()
  );

  protected loading = computed(() =>
    this.iamStore.loading()
  );

  protected errorMessage = computed(() =>
    this.localErrorMessage() ?? this.iamStore.error()
  );

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

  protected totalUsers = computed(() =>
    this.users().length
  );

  protected activeUsers = computed(() =>
    this.users().filter(user => user.status === 'ACTIVE').length
  );

  protected supervisors = computed(() =>
    this.users().filter(user => user.role === 'SUPERVISOR').length
  );

  protected doctors = computed(() =>
    this.users().filter(user => user.role === 'DOCTOR').length
  );

  ngOnInit(): void {
    this.iamStore.loadStaffData();
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

    if (user.role === role) {
      return;
    }

    this.localErrorMessage.set(null);
    this.iamStore.clearError();

    if (user.status === 'ACTIVE' && !this.canAssignRoleByPlan(role)) {
      return;
    }

    this.iamStore.updateUserRole(user.id, { role }).subscribe({
      next: updatedUser => {
        this.cleanAssignmentsAfterRoleChange(updatedUser);
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('iam.staff.error.update-role-failed');
      }
    });
  }

  protected toggleUserStatus(user: User): void {
    if (user.isAdmin) return;

    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    this.localErrorMessage.set(null);
    this.iamStore.clearError();

    if (nextStatus === 'ACTIVE' && !this.canAssignRoleByPlan(user.role)) {
      return;
    }

    this.iamStore.updateUserStatus(user.id, { status: nextStatus }).subscribe({
      next: updatedUser => {
        if (updatedUser.status === 'INACTIVE') {
          this.cleanAllAssignments(updatedUser);
        }

        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('iam.staff.error.update-status-failed');
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
    return this.iamStore.getWorkAreaName(workAreaId);
  }

  protected getSpecialtyName(specialtyId?: number): string {
    return this.iamStore.getSpecialtyName(specialtyId);
  }

  private canAssignRoleByPlan(role: UserRole): boolean {
    const plan = this.subscriptionAccessService.currentPlan();

    if (!plan) return true;

    if (role === 'DOCTOR') {
      const activeDoctors = this.iamStore.countActiveDoctors();

      if (!this.subscriptionAccessService.canUseLimit(plan.maxDoctors, activeDoctors)) {
        this.localErrorMessage.set('subscription.limits.doctors-exceeded');
        return false;
      }
    }

    if (role === 'SUPERVISOR') {
      const activeSupervisors = this.iamStore.countActiveSupervisors();

      if (!this.subscriptionAccessService.canUseLimit(plan.maxSupervisors, activeSupervisors)) {
        this.localErrorMessage.set('subscription.limits.supervisors-exceeded');
        return false;
      }
    }

    return true;
  }

  private cleanAssignmentsAfterRoleChange(updatedUser: User): void {
    if (updatedUser.role === 'SUPERVISOR') {
      this.careTeamApi.removeMembershipsByUserId(updatedUser.id).subscribe({
        error: () => {
          this.localErrorMessage.set('iam.staff.error.cleanup-failed');
        }
      });

      return;
    }

    if (updatedUser.role === 'DOCTOR') {
      this.careTeamApi.clearSupervisorAssignmentsByUserId(updatedUser.id).subscribe({
        error: () => {
          this.localErrorMessage.set('iam.staff.error.cleanup-failed');
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
        this.localErrorMessage.set('iam.staff.error.cleanup-failed');
      }
    });
  }
}