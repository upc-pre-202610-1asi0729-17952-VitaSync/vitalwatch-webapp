import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { UserApi } from '../../../../iam/infrastructure/user-api';
import { IamCatalogApi } from '../../../../iam/infrastructure/iam-catalog-api';
import { User } from '../../../../iam/domain/model/user.entity';
import { WorkArea } from '../../../../iam/domain/model/work-area.entity';
import { CareTeam } from '../../../domain/model/care-team.entity';
import { TeamMember } from '../../../domain/model/team-member.entity';
import { CareTeamApi } from '../../../infrastructure/care-team-api';
import { SubscriptionAccessService } from '../../../../subscription-plan-management/application/subscription-access.service';

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
  private userApi = inject(UserApi);
  private catalogApi = inject(IamCatalogApi);
  private careTeamApi = inject(CareTeamApi);
  private subscriptionAccessService = inject(SubscriptionAccessService);

  protected teams = signal<CareTeam[]>([]);
  protected members = signal<TeamMember[]>([]);
  protected users = signal<User[]>([]);
  protected workAreas = signal<WorkArea[]>([]);

  protected selectedDoctorByTeam = signal<Record<number, number>>({});
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected searchTerm = signal('');
  protected workAreaFilter = signal<number>(0);

  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
    workAreaId: [0, [Validators.required]],
    supervisorId: [0]
  });

  protected supervisors = computed(() =>
    this.users().filter(user => user.role === 'SUPERVISOR' && user.status === 'ACTIVE')
  );

  protected availableSupervisorsForNewTeam = computed(() => {
    const assignedSupervisorIds = this.teams()
      .filter(team => team.status === 'ACTIVE' && team.supervisorId !== null)
      .map(team => team.supervisorId);

    return this.supervisors().filter(supervisor =>
      !assignedSupervisorIds.includes(supervisor.id)
    );
  });

  protected getAvailableSupervisorsForTeam(team: CareTeam): User[] {
    const assignedSupervisorIds = this.teams()
      .filter(currentTeam =>
        currentTeam.status === 'ACTIVE' &&
        currentTeam.id !== team.id &&
        currentTeam.supervisorId !== null
      )
      .map(currentTeam => currentTeam.supervisorId);

    return this.supervisors().filter(supervisor =>
      !assignedSupervisorIds.includes(supervisor.id)
    );
  }

  protected doctors = computed(() =>
    this.users().filter(user => user.role === 'DOCTOR' && user.status === 'ACTIVE')
  );

  protected totalTeams = computed(() => this.teams().length);
  protected activeTeams = computed(() => this.teams().filter(team => team.status === 'ACTIVE').length);
  protected totalSupervisors = computed(() => this.supervisors().length);
  protected totalAssignedMembers = computed(() =>
    this.members().filter(member => {
      const user = this.getUserById(member.userId);
      return user?.role === 'DOCTOR' && user.status === 'ACTIVE';
    }).length
  );

  protected filteredTeams = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const workAreaId = this.workAreaFilter();

    return this.teams().filter(team => {
      const workAreaName = this.getWorkAreaName(team.workAreaId).toLowerCase();

      const matchesSearch =
        team.name.toLowerCase().includes(search) ||
        workAreaName.includes(search);

      const matchesWorkArea =
        workAreaId === 0 || team.workAreaId === workAreaId;

      return matchesSearch && matchesWorkArea;
    });
  });

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateWorkAreaFilter(workAreaId: number): void {
    this.workAreaFilter.set(workAreaId);
  }

  ngOnInit(): void {
    this.loadData();
  }

  protected createTeam(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('shift.teams.error.no-session');
      return;
    }

    if (this.form.invalid || this.form.controls.workAreaId.value === 0) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.canCreateOrActivateTeam()) {
      return;
    }

    const supervisorId = this.form.controls.supervisorId.value || null;

    if (this.isSupervisorAlreadyAssigned(supervisorId)) {
      this.errorMessage.set('shift.teams.error.supervisor-already-assigned');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.careTeamApi.createCareTeam({
      organizationId: currentUser.organizationId,
      name: this.form.controls.name.value,
      workAreaId: this.form.controls.workAreaId.value,
      supervisorId
    }).subscribe({
      next: team => {
        this.teams.update(teams => [team, ...teams]);
        this.form.reset({
          name: '',
          workAreaId: 0,
          supervisorId: 0
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('shift.teams.error.create-failed');
        this.loading.set(false);
      }
    });
  }

  protected updateSupervisor(team: CareTeam, supervisorId: number): void {
    const selectedSupervisorId = supervisorId || null;

    if (this.isSupervisorAlreadyAssigned(selectedSupervisorId, team.id)) {
      this.errorMessage.set('shift.teams.error.supervisor-already-assigned');
      return;
    }

    this.careTeamApi.updateSupervisor(team.id, {
      supervisorId: selectedSupervisorId
    }).subscribe({
      next: updatedTeam => {
        this.teams.update(teams =>
          teams.map(item => item.id === updatedTeam.id ? updatedTeam : item)
        );
        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('shift.teams.error.update-supervisor-failed');
      }
    });
  }

  protected toggleTeamStatus(team: CareTeam): void {
    const nextStatus = team.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (nextStatus === 'ACTIVE' && !this.canCreateOrActivateTeam()) {
      return;
    }

    this.careTeamApi.updateStatus(team.id, { status: nextStatus }).subscribe({
      next: updatedTeam => {
        this.teams.update(teams =>
          teams.map(item => item.id === updatedTeam.id ? updatedTeam : item)
        );
        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('shift.teams.error.update-status-failed');
      }
    });
  }

  protected updateSelectedDoctor(teamId: number, userId: number): void {
    this.selectedDoctorByTeam.update(selected => ({
      ...selected,
      [teamId]: userId
    }));
  }

  protected addMember(team: CareTeam): void {
    if (!team.isActive) {
      this.errorMessage.set('shift.teams.error.inactive-team');
      return;
    }

    const userId = this.selectedDoctorByTeam()[team.id];

    if (!userId) return;

    const alreadyAssignedToAnyTeam = this.members().some(member =>
      member.userId === userId
    );

    if (alreadyAssignedToAnyTeam) {
      this.errorMessage.set('shift.teams.error.member-already-assigned');
      return;
    }

    this.careTeamApi.addTeamMember({
      teamId: team.id,
      userId
    }).subscribe({
      next: member => {
        this.members.update(members => [...members, member]);
        this.selectedDoctorByTeam.update(selected => ({
          ...selected,
          [team.id]: 0
        }));
        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('shift.teams.error.add-member-failed');
      }
    });
  }

  protected removeMember(member: TeamMember): void {
    this.careTeamApi.removeTeamMember(member.id).subscribe({
      next: () => {
        this.members.update(members => members.filter(item => item.id !== member.id));
      },
      error: () => {
        this.errorMessage.set('shift.teams.error.remove-member-failed');
      }
    });
  }

  protected getTeamMembers(teamId: number): TeamMember[] {
    return this.members().filter(member => {
      const user = this.getUserById(member.userId);

      return member.teamId === teamId &&
        user?.role === 'DOCTOR' &&
        user.status === 'ACTIVE';
    });
  }

  protected getUserById(userId: number): User | undefined {
    return this.users().find(user => user.id === userId);
  }

  protected getSupervisorName(supervisorId: number | null): string {
    if (!supervisorId) return '—';

    return this.getUserById(supervisorId)?.fullName ?? '—';
  }

  protected getWorkAreaName(workAreaId: number): string {
    return this.workAreas().find(workArea => workArea.id === workAreaId)?.name ?? '—';
  }

  protected getAvailableDoctorsForTeam(team: CareTeam): User[] {
    const assignedDoctorIds = this.members().map(member => member.userId);

    return this.doctors().filter(doctor => !assignedDoctorIds.includes(doctor.id));
  }

  private getActiveTeamCount(): number {
    return this.teams().filter(team => team.status === 'ACTIVE').length;
  }

  private canCreateOrActivateTeam(): boolean {
    const plan = this.subscriptionAccessService.currentPlan();

    if (!plan) return true;

    const activeTeams = this.getActiveTeamCount();

    if (!this.subscriptionAccessService.canUseLimit(plan.maxTeams, activeTeams)) {
      this.errorMessage.set('subscription.limits.teams-exceeded');
      return false;
    }

    return true;
  }

  private isSupervisorAlreadyAssigned(supervisorId: number | null, ignoredTeamId?: number): boolean {
    if (!supervisorId) return false;

    return this.teams().some(team =>
      team.status === 'ACTIVE' &&
      team.supervisorId === supervisorId &&
      team.id !== ignoredTeamId
    );
  }

  private loadData(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('shift.teams.error.no-session');
      return;
    }

    this.loading.set(true);

    this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId).subscribe({
      next: teams => {
        this.teams.set([...teams].reverse());
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('shift.teams.error.load-failed');
        this.loading.set(false);
      }
    });

    this.careTeamApi.getTeamMembers().subscribe(members => {
      this.members.set(members);
    });

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe(users => {
      this.users.set(users);
    });

    this.catalogApi.getWorkAreasByOrganizationId(currentUser.organizationId).subscribe(workAreas => {
      this.workAreas.set(workAreas);
    });
  }

  protected deleteTeam(team: CareTeam): void {
    const confirmed = window.confirm(`¿Eliminar ${team.name}? Esta acción también quitará sus miembros asignados.`);

    if (!confirmed) return;

    this.careTeamApi.deleteCareTeam(team.id).subscribe({
      next: () => {
        this.teams.update(teams =>
          teams.filter(item => item.id !== team.id)
        );

        this.members.update(members =>
          members.filter(member => member.teamId !== team.id)
        );

        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('shift.teams.error.delete-failed');
      }
    });
  }
}