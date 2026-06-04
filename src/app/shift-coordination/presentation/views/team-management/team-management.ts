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

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type WorkAreaFilter = 'ALL' | number;

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

  protected selectedDoctorByTeam = signal<Record<number, number>>({});

  protected teams = computed(() =>
    this.shiftCoordinationStore.teams()
  );

  protected teamMembers = computed(() =>
    this.shiftCoordinationStore.teamMembers()
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

  protected availableSupervisorsForNewTeam = computed(() =>
    this.supervisors().filter(supervisor =>
      !this.shiftCoordinationStore.isSupervisorAlreadyAssigned(supervisor.id)
    )
  );

  protected searchTerm = signal('');
  protected statusFilter = signal<StatusFilter>('ALL');
  protected workAreaFilter = signal<number>(0);

  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
    workAreaId: [0, [Validators.required]],
    supervisorId: [0]
  });

  protected memberForm = this.formBuilder.group({
    teamId: [0, [Validators.required]],
    userId: [0, [Validators.required]]
  });

  protected totalTeams = computed(() =>
    this.teams().length
  );

  protected activeTeams = computed(() =>
    this.teams().filter(team => team.status === 'ACTIVE').length
  );

  protected totalSupervisors = computed(() =>
    this.supervisors().length
  );

  protected totalAssignedMembers = computed(() =>
    this.teamMembers().filter(member => {
      const user = this.getUserById(member.userId);

      return user?.role === 'DOCTOR' &&
        user.status === 'ACTIVE';
    }).length
  );

  protected inactiveTeamsCount = computed(() =>
    this.teams().filter(team => team.status === 'INACTIVE').length
  );

  protected supervisors = computed(() =>
    this.users().filter(user =>
      user.role === 'SUPERVISOR' &&
      user.status === 'ACTIVE'
    )
  );

  protected doctors = computed(() =>
    this.users().filter(user =>
      user.role === 'DOCTOR' &&
      user.status === 'ACTIVE'
    )
  );

  protected filteredTeams = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const workAreaId = this.workAreaFilter();

    return this.teams().filter(team => {
      const workAreaName = this.getWorkAreaName(team.workAreaId).toLowerCase();
      const supervisorName = this.getSupervisorName(team.supervisorId).toLowerCase();

      const matchesSearch =
        team.name.toLowerCase().includes(search) ||
        workAreaName.includes(search) ||
        supervisorName.includes(search);

      const matchesStatus =
        status === 'ALL' || team.status === status;

      const matchesWorkArea =
        workAreaId === 0 || team.workAreaId === workAreaId;

      return matchesSearch && matchesStatus && matchesWorkArea;
    });
  });

  protected availableSupervisors = computed(() =>
    this.supervisors().filter(supervisor =>
      !this.shiftCoordinationStore.isSupervisorAlreadyAssigned(supervisor.id)
    )
  );

  protected availableDoctors = computed(() =>
    this.doctors().filter(doctor =>
      !this.shiftCoordinationStore.isUserAlreadyMember(doctor.id)
    )
  );

  ngOnInit(): void {
    this.loadData();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateSelectedDoctor(teamId: number, userId: number): void {
    this.selectedDoctorByTeam.update(selected => ({
      ...selected,
      [teamId]: userId
    }));
  }

  protected updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected updateWorkAreaFilter(value: number): void {
    this.workAreaFilter.set(value);
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

  protected addMember(team: CareTeam): void {
    if (!team.isActive) {
      this.localErrorMessage.set('shift.teams.error.inactive-team');
      return;
    }

    const userId = this.selectedDoctorByTeam()[team.id];

    if (!userId) return;

    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    if (this.shiftCoordinationStore.isUserAlreadyMember(userId)) {
      this.localErrorMessage.set('shift.teams.error.member-already-assigned');
      return;
    }

    this.shiftCoordinationStore.addTeamMember({
      teamId: team.id,
      userId
    }).subscribe({
      next: () => {
        this.selectedDoctorByTeam.update(selected => ({
          ...selected,
          [team.id]: 0
        }));

        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.teams.error.add-member-failed');
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

  protected getTeamMembers(teamId: number): TeamMember[] {
    return this.shiftCoordinationStore.getTeamMembers(teamId).filter(member => {
      const user = this.getUserById(member.userId);

      return user?.role === 'DOCTOR' &&
        user.status === 'ACTIVE';
    });
  }

  protected getUserById(userId: number): User | undefined {
    return this.users().find(user => user.id === userId);
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

  protected getMembersByTeamId(teamId: number): TeamMember[] {
    return this.shiftCoordinationStore.getMembersByTeamId(teamId);
  }

  protected getUserName(userId: number): string {
    const user = this.users().find(item => item.id === userId);

    return user?.fullName ?? '—';
  }

  protected getSupervisorName(supervisorId: number | null): string {
    if (!supervisorId) return '—';

    return this.getUserName(supervisorId);
  }

  protected getWorkAreaName(workAreaId: number): string {
    return this.iamStore.getWorkAreaName(workAreaId);
  }

  protected getAvailableSupervisorsForTeam(team: CareTeam): User[] {
    return this.supervisors().filter(supervisor =>
      supervisor.id === team.supervisorId ||
      !this.shiftCoordinationStore.isSupervisorAlreadyAssigned(supervisor.id, team.id)
    );
  }

  protected getAvailableDoctorsForTeam(team: CareTeam): User[] {
    const currentTeamMembers = this.getTeamMembers(team.id).map(member => member.userId);

    return this.doctors().filter(doctor =>
      currentTeamMembers.includes(doctor.id) ||
      !this.shiftCoordinationStore.isUserAlreadyMember(doctor.id)
    );
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

  private loadData(): void {
    this.iamStore.loadStaffData();
    this.shiftCoordinationStore.loadTeams();
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