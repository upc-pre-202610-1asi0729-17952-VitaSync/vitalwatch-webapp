import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { StaffRecoveryStore } from '../../../application/staff-recovery.store';
import {
  PreventiveAction,
  PreventiveActionStatus,
  PreventiveActionType
} from '../../../domain/model/preventive-action.entity';

@Component({
  selector: 'app-doctor-recovery',
  imports: [
    TranslatePipe,
    DatePipe,
    NgIcon
  ],
  templateUrl: './doctor-recovery.html',
  styleUrl: './doctor-recovery.css'
})
export class DoctorRecovery implements OnInit {
  private staffRecoveryStore = inject(StaffRecoveryStore);

  protected errorMessage = this.staffRecoveryStore.errorMessage;

  protected doctor = this.staffRecoveryStore.doctor;
  protected currentRisk = this.staffRecoveryStore.currentRisk;
  protected personalActions = this.staffRecoveryStore.personalActions;
  protected pendingActions = this.staffRecoveryStore.personalPendingActions;
  protected completedActions = this.staffRecoveryStore.personalCompletedActions;
  protected activeAlerts = this.staffRecoveryStore.activeAlerts;

  protected recoveryScore = this.staffRecoveryStore.recoveryScore;
  protected recoveryStatusClass = this.staffRecoveryStore.recoveryStatusClass;
  protected recoveryStatusLabel = this.staffRecoveryStore.recoveryStatusLabel;
  protected recoveryMessage = this.staffRecoveryStore.recoveryMessage;
  protected recommendations = this.staffRecoveryStore.recommendations;

  ngOnInit(): void {
    this.staffRecoveryStore.loadDoctorRecoveryData();
  }

  protected completeAction(action: PreventiveAction): void {
    this.staffRecoveryStore.completeDoctorAction(action);
  }

  protected getActionTypeLabel(type: PreventiveActionType): string {
    return this.staffRecoveryStore.getActionTypeLabel(type);
  }

  protected getActionStatusLabel(status: PreventiveActionStatus): string {
    return this.staffRecoveryStore.getStatusLabel(status);
  }

  protected getActionStatusClass(status: PreventiveActionStatus): string {
    return this.staffRecoveryStore.getActionStatusClass(status);
  }
}