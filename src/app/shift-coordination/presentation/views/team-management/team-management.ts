import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { User } from '../../../../iam/domain/model/user.entity';
import { CareTeam } from '../../../domain/model/care-team.entity';
import { TeamMember } from '../../../domain/model/team-member.entity';
import { ShiftCoordinationStore } from '../../../application/shift-coordination.store';
import { SubscriptionAccessService } from '../../../../subscription-plan-management/application/subscription-access.service';

type WorkAreaFilter = 'ALL' | number;
type TeamStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-team-management',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatSelectModule,
    NgIcon
  ],
  templateUrl: './team-management.html',
  styleUrl: './team-management.css'
})
export class TeamManagement implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private authenticationStore = inject(AuthenticationStore);
  private iamStore = inject(IamStore);
  private shiftCoordinationStore = inject(ShiftCoordinationStore);
  private subscriptionAccessService = inject(SubscriptionAccessService);

  private localErrorMessage = signal<string | null>(null);

  protected teams = computed(() =>
    this.shiftCoordinationStore.teams()
  );

  protected members = computed(() =>
    this.shiftCoordinationStore.members()
  );

  protected users = computed(() =>
    this.iamStore.users()
  );

  protected workAreas = computed(() =>
    this.iamStore.workAreas()
  );

  protected loading = computed(() =>
    this.shiftCoordinationStore.loading() || this.iamStore.loading()
  );

  protected errorMessage = computed(() =>
    this.localErrorMessage() ??
    this.shiftCoordinationStore.error() ??
    this.iamStore.error()
  );

  protected searchTerm = signal('');
  protected workAreaFilter = signal<WorkAreaFilter>('ALL');
  protected statusFilter = signal<TeamStatusFilter>('ALL');

  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
    workAreaId: [0, [Validators.required]],
    supervisorId: [0]
  });

  protected filteredTeams = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const workArea = this.workAreaFilter();
    const status = this.statusFilter();

    return this.teams().filter(team => {
      const workAreaName = this.getWorkAreaName(team.workAreaId).toLowerCase();
      const supervisorName = this.getSupervisorName(team.supervisorId).toLowerCase();

      const matchesSearch =
        team.name.toLowerCase().includes(search) ||
        workAreaName.includes(search) ||
        supervisorName.includes(search);

      const matchesWorkArea =
        workArea === 'ALL' ||
        team.workAreaId === workArea;

      const matchesStatus =
        status === 'ALL' ||
        team.status === status;

      return matchesSearch && matchesWorkArea && matchesStatus;
    });
  });

  protected totalTeams = computed(() =>
    this.teams().length
  );

  protected activeTeams = computed(() =>
    this.teams().filter(team => team.status === 'ACTIVE').length
  );

  protected inactiveTeams = computed(() =>
    this.teams().filter(team => team.status === 'INACTIVE').length
  );

  protected assignedMembers = computed(() =>
    this.members().length
  );

  protected availableSupervisors = computed(() =>
    this.users().filter(user =>
      user.role === 'SUPERVISOR' &&
      user.status === 'ACTIVE'
    )
  );

  protected availableDoctors = computed(() =>
    this.users().filter(user =>
      user.role === 'DOCTOR' &&
      user.status === 'ACTIVE' &&
      !this.shiftCoordinationStore.isDoctorAlreadyAssigned(user.id)
    )
  );

  ngOnInit(): void {
    this.shiftCoordinationStore.loadTeamManagementData();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateWorkAreaFilter(value: WorkAreaFilter): void {
    this.workAreaFilter.set(value);
  }

  protected updateStatusFilter(value: TeamStatusFilter): void {
    this.statusFilter.set(value);
  }

  protected createTeam(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.localErrorMessage.set('shift.teams.error.no-session');
      return;
    }

    if (this.form.invalid || this.form.controls.workAreaId.value === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    if (!this.canCreateOrActivateTeam()) {
      return;
    }

    const supervisorId = this.form.controls.supervisorId.value || null;

    if (this.shiftCoordinationStore.isSupervisorAlreadyAssigned(supervisorId)) {
      this.localErrorMessage.set('shift.teams.error.supervisor-already-assigned');
      return;
    }

    this.shiftCoordinationStore.createTeam({
      organizationId: currentUser.organizationId,
      name: this.form.controls.name.value,
      workAreaId: this.form.controls.workAreaId.value,
      supervisorId
    }).subscribe({
      next: () => {
        this.form.reset({
          name: '',
          workAreaId: 0,
          supervisorId: 0
        });

        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.teams.error.create-failed');
      }
    });
  }

  protected updateSupervisor(team: CareTeam, supervisorId: number): void {
    const selectedSupervisorId = supervisorId || null;

    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    if (this.shiftCoordinationStore.isSupervisorAlreadyAssigned(selectedSupervisorId, team.id)) {
      this.localErrorMessage.set('shift.teams.error.supervisor-already-assigned');
      return;
    }

    this.shiftCoordinationStore.updateSupervisor(team.id, {
      supervisorId: selectedSupervisorId
    }).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.teams.error.update-supervisor-failed');
      }
    });
  }

  protected toggleTeamStatus(team: CareTeam): void {
    const nextStatus = team.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    if (nextStatus === 'ACTIVE' && !this.canCreateOrActivateTeam()) {
      return;
    }

    this.shiftCoordinationStore.updateTeamStatus(team.id, {
      status: nextStatus
    }).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.teams.error.update-status-failed');
      }
    });
  }

  protected deleteTeam(team: CareTeam): void {
    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    this.shiftCoordinationStore.deleteTeam(team).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.teams.error.delete-failed');
      }
    });
  }

  protected addMember(team: CareTeam, userId: number): void {
    if (!userId) return;

    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    if (this.shiftCoordinationStore.isDoctorAlreadyAssigned(userId)) {
      this.localErrorMessage.set('shift.teams.error.member-already-assigned');
      return;
    }

    this.shiftCoordinationStore.addTeamMember({
      teamId: team.id,
      userId
    }).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.teams.error.add-member-failed');
      }
    });
  }

  protected removeMember(member: TeamMember): void {
    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    this.shiftCoordinationStore.removeTeamMember(member.id).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.teams.error.remove-member-failed');
      }
    });
  }

  protected removeMemberByUserId(teamId: number, userId: number): void {
    const member = this.members().find(item =>
      item.teamId === teamId &&
      item.userId === userId
    );

    if (!member) return;

    this.removeMember(member);
  }

  protected getTeamMembers(teamId: number): User[] {
    const teamMembers = this.shiftCoordinationStore.getTeamMembers(teamId);

    return teamMembers
      .map(member => this.users().find(user => user.id === member.userId))
      .filter((user): user is User => !!user);
  }

  protected getTeamMemberRecords(teamId: number): TeamMember[] {
    return this.shiftCoordinationStore.getTeamMembers(teamId);
  }

  protected getAvailableDoctorsForTeam(teamId: number): User[] {
    const currentTeamUserIds = this.getTeamMembers(teamId).map(user => user.id);

    return this.users().filter(user =>
      user.role === 'DOCTOR' &&
      user.status === 'ACTIVE' &&
      (
        !this.shiftCoordinationStore.isDoctorAlreadyAssigned(user.id) ||
        currentTeamUserIds.includes(user.id)
      )
    );
  }

  protected getAvailableSupervisorsForTeam(teamId: number): User[] {
    return this.users().filter(user =>
      user.role === 'SUPERVISOR' &&
      user.status === 'ACTIVE' &&
      !this.shiftCoordinationStore.isSupervisorAlreadyAssigned(user.id, teamId)
    );
  }

  protected getWorkAreaName(workAreaId?: number): string {
    return this.iamStore.getWorkAreaName(workAreaId);
  }

  protected getSupervisorName(supervisorId?: number | null): string {
    if (!supervisorId) return '—';

    return this.users().find(user => user.id === supervisorId)?.fullName ?? '—';
  }

  protected getUserName(userId: number): string {
    return this.users().find(user => user.id === userId)?.fullName ?? '—';
  }

  protected getUserInitials(userId: number): string {
    return this.users().find(user => user.id === userId)?.initials ?? '--';
  }

  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'shift.teams.status.active',
      INACTIVE: 'shift.teams.status.inactive'
    };

    return labels[status] ?? status;
  }

  protected getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  private canCreateOrActivateTeam(): boolean {
    const plan = this.subscriptionAccessService.currentPlan();

    if (!plan) return true;

    const activeTeams = this.shiftCoordinationStore.countActiveTeams();

    if (!this.subscriptionAccessService.canUseLimit(plan.maxTeams, activeTeams)) {
      this.localErrorMessage.set('subscription.limits.teams-exceeded');
      return false;
    }

    return true;
  }
}