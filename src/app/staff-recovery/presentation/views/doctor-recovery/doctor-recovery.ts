import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { ClinicalRiskApi } from '../../../../clinical-risk-assessment/infrastructure/clinical-risk-api';
import { RiskAssessment, RiskLevel } from '../../../../clinical-risk-assessment/domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../../../clinical-risk-assessment/domain/model/clinical-alert.entity';
import { PreventiveActionApi } from '../../../infrastructure/preventive-action-api';
import {
  PreventiveAction,
  PreventiveActionStatus,
  PreventiveActionType
} from '../../../domain/model/preventive-action.entity';
import { ShiftRecordApi } from '../../../../shift-coordination/infrastructure/shift-record-api';
import { ShiftRecord } from '../../../../shift-coordination/domain/model/shift-record.entity';

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
  private authenticationStore = inject(AuthenticationStore);
  private clinicalRiskApi = inject(ClinicalRiskApi);
  private preventiveActionApi = inject(PreventiveActionApi);
  private shiftRecordApi = inject(ShiftRecordApi);

  protected risks = signal<RiskAssessment[]>([]);
  protected alerts = signal<ClinicalAlert[]>([]);
  protected actions = signal<PreventiveAction[]>([]);
  protected shifts = signal<ShiftRecord[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected doctor = computed(() => this.authenticationStore.currentUser());

  protected currentRisk = computed<RiskAssessment | null>(() => {
    const doctor = this.doctor();

    if (!doctor) return null;

    return this.risks().find(risk => risk.userId === doctor.id) ?? null;
  });

  protected personalActions = computed(() => {
    const doctor = this.doctor();

    if (!doctor) return [];

    return this.actions()
      .filter(action => action.userId === doctor.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  protected pendingActions = computed(() =>
    this.personalActions().filter(action => action.status === 'PENDING')
  );

  protected completedActions = computed(() =>
    this.personalActions().filter(action => action.status === 'COMPLETED')
  );

  protected activeAlerts = computed(() => {
    const doctor = this.doctor();

    if (!doctor) return [];

    return this.alerts().filter(alert =>
      alert.userId === doctor.id &&
      alert.status === 'ACTIVE'
    );
  });

  protected completedShifts = computed(() =>
    this.shifts().filter(shift => shift.status === 'COMPLETED')
  );

  protected recoveryScore = computed(() => {
    const fatigue = this.currentRisk()?.fatigueLevel ?? 0;

    return Math.max(100 - fatigue, 0);
  });

  protected recoveryStatusClass = computed(() => {
    const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

    return riskLevel.toLowerCase();
  });

  protected recoveryStatusLabel = computed(() => {
    const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

    const labels: Record<RiskLevel, string> = {
      LOW: 'staffRecovery.doctor.status.low',
      MODERATE: 'staffRecovery.doctor.status.moderate',
      HIGH: 'staffRecovery.doctor.status.high',
      CRITICAL: 'staffRecovery.doctor.status.critical'
    };

    return labels[riskLevel];
  });

  protected recoveryMessage = computed(() => {
    const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

    const messages: Record<RiskLevel, string> = {
      LOW: 'staffRecovery.doctor.message.low',
      MODERATE: 'staffRecovery.doctor.message.moderate',
      HIGH: 'staffRecovery.doctor.message.high',
      CRITICAL: 'staffRecovery.doctor.message.critical'
    };

    return messages[riskLevel];
  });

  protected recommendations = computed(() => {
    const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

    const recommendations: Record<RiskLevel, string[]> = {
      LOW: [
        'staffRecovery.doctor.recommendations.hydration',
        'staffRecovery.doctor.recommendations.monitoring'
      ],
      MODERATE: [
        'staffRecovery.doctor.recommendations.short-break',
        'staffRecovery.doctor.recommendations.breathing'
      ],
      HIGH: [
        'staffRecovery.doctor.recommendations.recovery-break',
        'staffRecovery.doctor.recommendations.notify-supervisor'
      ],
      CRITICAL: [
        'staffRecovery.doctor.recommendations.stop-critical-work',
        'staffRecovery.doctor.recommendations.request-support'
      ]
    };

    return recommendations[riskLevel];
  });

  ngOnInit(): void {
    this.loadRecoveryData();
  }

  protected completeAction(action: PreventiveAction): void {
    if (!action.isPending) return;

    this.preventiveActionApi.updatePreventiveActionStatus(action.id, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    }).subscribe({
      next: updatedAction => {
        this.actions.update(actions =>
          actions.map(item => item.id === updatedAction.id ? updatedAction : item)
        );
        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('staffRecovery.doctor.error.update-failed');
      }
    });
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

  protected getActionStatusLabel(status: PreventiveActionStatus): string {
    const labels: Record<PreventiveActionStatus, string> = {
      PENDING: 'staffRecovery.actions.status.pending',
      COMPLETED: 'staffRecovery.actions.status.completed',
      CANCELLED: 'staffRecovery.actions.status.cancelled'
    };

    return labels[status];
  }

  protected getActionStatusClass(status: PreventiveActionStatus): string {
    return status.toLowerCase();
  }

  private loadRecoveryData(): void {
    const doctor = this.authenticationStore.currentUser();

    if (!doctor) {
      this.errorMessage.set('staffRecovery.doctor.error.no-session');
      return;
    }

    this.loading.set(true);

    this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(doctor.organizationId).subscribe({
      next: risks => {
        this.risks.set(risks);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('staffRecovery.doctor.error.load-failed');
        this.loading.set(false);
      }
    });

    this.clinicalRiskApi.getClinicalAlertsByOrganizationId(doctor.organizationId).subscribe(alerts => {
      this.alerts.set(alerts);
    });

    this.preventiveActionApi.getPreventiveActionsByOrganizationId(doctor.organizationId).subscribe(actions => {
      this.actions.set(actions);
    });

    this.shiftRecordApi.getShiftRecordsByUserId(doctor.organizationId, doctor.id).subscribe(shifts => {
      this.shifts.set(shifts);
    });
  }
}