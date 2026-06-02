import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import {
  StaffRecoveryStatusFilter,
  StaffRecoveryStore
} from '../../../application/staff-recovery.store';
import { User } from '../../../../iam/domain/model/user.entity';
import {
  PreventiveAction,
  PreventiveActionStatus,
  PreventiveActionType
} from '../../../domain/model/preventive-action.entity';

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
  private staffRecoveryStore = inject(StaffRecoveryStore);

  protected loading = this.staffRecoveryStore.loading;
  protected errorMessage = this.staffRecoveryStore.errorMessage;
  protected statusFilter = this.staffRecoveryStore.statusFilter;

  protected actionTypes = this.staffRecoveryStore.actionTypes;
  protected assignedDoctors = this.staffRecoveryStore.assignedDoctors;
  protected assignedActions = this.staffRecoveryStore.assignedActions;
  protected filteredActions = this.staffRecoveryStore.filteredActions;

  protected pendingActions = this.staffRecoveryStore.assignedPendingActionsCount;
  protected completedActions = this.staffRecoveryStore.assignedCompletedActionsCount;
  protected cancelledActions = this.staffRecoveryStore.assignedCancelledActionsCount;

  protected form = this.formBuilder.group({
    userId: [0, [Validators.required]],
    type: ['RECOVERY_BREAK' as PreventiveActionType, [Validators.required]],
    notes: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.staffRecoveryStore.loadSupervisorPreventiveActions();
  }

  protected createAction(): void {
    if (this.form.invalid || this.form.controls.userId.value === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.staffRecoveryStore.createPreventiveAction({
      userId: this.form.controls.userId.value,
      type: this.form.controls.type.value,
      notes: this.form.controls.notes.value
    }, () => {
      this.form.reset({
        userId: 0,
        type: 'RECOVERY_BREAK',
        notes: ''
      });
    });
  }

  protected completeAction(action: PreventiveAction): void {
    this.staffRecoveryStore.completeAssignedAction(action);
  }

  protected cancelAction(action: PreventiveAction): void {
    this.staffRecoveryStore.cancelAssignedAction(action);
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.staffRecoveryStore.updateSearchTerm(input.value);
  }

  protected updateStatusFilter(value: StaffRecoveryStatusFilter): void {
    this.staffRecoveryStore.updateStatusFilter(value);
  }

  protected getUserById(userId: number): User | undefined {
    return this.staffRecoveryStore.getUserById(userId);
  }

  protected getActionTypeLabel(type: PreventiveActionType): string {
    return this.staffRecoveryStore.getActionTypeLabel(type);
  }

  protected getStatusLabel(status: PreventiveActionStatus): string {
    return this.staffRecoveryStore.getStatusLabel(status);
  }
}