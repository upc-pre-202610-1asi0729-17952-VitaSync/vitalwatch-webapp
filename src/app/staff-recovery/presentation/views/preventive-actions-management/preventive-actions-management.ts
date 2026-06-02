import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { UserApi } from '../../../../iam/infrastructure/apis/user-api';
import { User } from '../../../../iam/domain/model/user.entity';
import { CareTeamApi } from '../../../../shift-coordination/infrastructure/api/care-team-api';
import { CareTeam } from '../../../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../../../shift-coordination/domain/model/team-member.entity';
import { PreventiveActionApi } from '../../../infrastructure/preventive-action-api';
import {
  PreventiveAction,
  PreventiveActionStatus,
  PreventiveActionType
} from '../../../domain/model/preventive-action.entity';

type StatusFilter = 'ALL' | PreventiveActionStatus;

@Component({
  selector: 'app-preventive-actions-management',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatSelectModule,
    NgIcon,
    DatePipe
  ],
  templateUrl: './preventive-actions-management.html',
  styleUrl: './preventive-actions-management.css'
})
export class PreventiveActionsManagement implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private authenticationStore = inject(AuthenticationStore);
  private userApi = inject(UserApi);
  private careTeamApi = inject(CareTeamApi);
  private preventiveActionApi = inject(PreventiveActionApi);

  protected teams = signal<CareTeam[]>([]);
  protected members = signal<TeamMember[]>([]);
  protected users = signal<User[]>([]);
  protected actions = signal<PreventiveAction[]>([]);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected searchTerm = signal('');
  protected statusFilter = signal<StatusFilter>('ALL');

  protected actionTypes: PreventiveActionType[] = [
    'RECOVERY_BREAK',
    'SHIFT_ADJUSTMENT',
    'SUPERVISOR_CHECK_IN',
    'MEDICAL_EVALUATION'
  ];

  protected form = this.formBuilder.group({
    userId: [0, [Validators.required]],
    type: ['RECOVERY_BREAK' as PreventiveActionType, [Validators.required]],
    notes: ['', [Validators.required]]
  });

  protected assignedTeamIds = computed(() =>
    this.teams().map(team => team.id)
  );

  protected assignedMemberIds = computed(() =>
    this.members()
      .filter(member => this.assignedTeamIds().includes(member.teamId))
      .map(member => member.userId)
  );

  protected assignedDoctors = computed(() =>
    this.users().filter(user =>
      this.assignedMemberIds().includes(user.id) &&
      user.role === 'DOCTOR' &&
      user.status === 'ACTIVE'
    )
  );

  protected assignedActions = computed(() =>
    this.actions().filter(action =>
      this.assignedMemberIds().includes(action.userId)
    )
  );

  protected filteredActions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    return this.assignedActions().filter(action => {
      const user = this.getUserById(action.userId);

      const matchesSearch =
        action.notes.toLowerCase().includes(search) ||
        this.getActionTypeLabel(action.type).toLowerCase().includes(search) ||
        user?.fullName.toLowerCase().includes(search) ||
        user?.email.toLowerCase().includes(search);

      const matchesStatus = status === 'ALL' || action.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  protected pendingActions = computed(() =>
    this.assignedActions().filter(action => action.status === 'PENDING').length
  );

  protected completedActions = computed(() =>
    this.assignedActions().filter(action => action.status === 'COMPLETED').length
  );

  protected cancelledActions = computed(() =>
    this.assignedActions().filter(action => action.status === 'CANCELLED').length
  );

  ngOnInit(): void {
    this.loadActions();
  }

  protected createAction(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('staffRecovery.actions.error.no-session');
      return;
    }

    if (this.form.invalid || this.form.controls.userId.value === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.preventiveActionApi.createPreventiveAction({
      organizationId: currentUser.organizationId,
      supervisorId: currentUser.id,
      userId: this.form.controls.userId.value,
      type: this.form.controls.type.value,
      notes: this.form.controls.notes.value
    }).subscribe({
      next: action => {
        this.actions.update(actions => [action, ...actions]);
        this.form.reset({
          userId: 0,
          type: 'RECOVERY_BREAK',
          notes: ''
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('staffRecovery.actions.error.create-failed');
        this.loading.set(false);
      }
    });
  }

  protected completeAction(action: PreventiveAction): void {
    this.updateActionStatus(action, 'COMPLETED');
  }

  protected cancelAction(action: PreventiveAction): void {
    this.updateActionStatus(action, 'CANCELLED');
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected getUserById(userId: number): User | undefined {
    return this.users().find(user => user.id === userId);
  }

  protected getActionTypeLabel(type: PreventiveActionType): string {
    const labels: Record<PreventiveActionType, string> = {
      RECOVERY_BREAK: 'staffRecovery.actions.types.recovery-break',
      SHIFT_ADJUSTMENT: 'staffRecovery.actions.types.shift-adjustment',
      SUPERVISOR_CHECK_IN: 'staffRecovery.actions.types.supervisor-check-in',
      MEDICAL_EVALUATION: 'staffRecovery.actions.types.medical-evaluation'
    };

    return labels[type];
  }

  protected getStatusLabel(status: PreventiveActionStatus): string {
    const labels: Record<PreventiveActionStatus, string> = {
      PENDING: 'staffRecovery.actions.status.pending',
      COMPLETED: 'staffRecovery.actions.status.completed',
      CANCELLED: 'staffRecovery.actions.status.cancelled'
    };

    return labels[status];
  }

  private updateActionStatus(action: PreventiveAction, status: PreventiveActionStatus): void {
    if (!action.isPending) return;

    this.preventiveActionApi.updatePreventiveActionStatus(action.id, {
      status,
      completedAt: status === 'COMPLETED' ? new Date().toISOString() : null
    }).subscribe({
      next: updatedAction => {
        this.actions.update(actions =>
          actions.map(item => item.id === updatedAction.id ? updatedAction : item)
        );
      },
      error: () => {
        this.errorMessage.set('staffRecovery.actions.error.update-failed');
      }
    });
  }

  private loadActions(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('staffRecovery.actions.error.no-session');
      return;
    }

    this.loading.set(true);

    this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId).subscribe({
      next: teams => {
        this.teams.set(
          teams.filter(team =>
            team.supervisorId === currentUser.id &&
            team.status === 'ACTIVE'
          )
        );
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('staffRecovery.actions.error.load-failed');
        this.loading.set(false);
      }
    });

    this.careTeamApi.getTeamMembers().subscribe(members => {
      this.members.set(members);
    });

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe(users => {
      this.users.set(users);
    });

    this.preventiveActionApi.getPreventiveActionsByOrganizationId(currentUser.organizationId).subscribe(actions => {
      this.actions.set([...actions].reverse());
    });
  }
}