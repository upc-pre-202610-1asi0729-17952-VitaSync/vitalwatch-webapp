import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { ClinicalRiskApi } from '../../../infrastructure/clinical-risk-api';
import { RiskAssessment, RiskLevel } from '../../../domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../../domain/model/clinical-alert.entity';

@Component({
  selector: 'app-doctor-health-dashboard',
  imports: [
    TranslatePipe,
    NgIcon,
    DatePipe
  ],
  templateUrl: './doctor-health-dashboard.html',
  styleUrl: './doctor-health-dashboard.css'
})
export class DoctorHealthDashboard implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private clinicalRiskApi = inject(ClinicalRiskApi);

  protected risks = signal<RiskAssessment[]>([]);
  protected alerts = signal<ClinicalAlert[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected doctor = computed(() => this.authenticationStore.currentUser());

  protected currentRisk = computed(() => {
    const doctor = this.doctor();

    if (!doctor) return null;

    return this.risks().find(risk => risk.userId === doctor.id) ?? null;
  });

  protected activeAlerts = computed(() => {
    const doctor = this.doctor();

    if (!doctor) return [];

    return this.alerts().filter(alert =>
      alert.userId === doctor.id &&
      alert.isActive
    );
  });

  protected resolvedAlerts = computed(() => {
    const doctor = this.doctor();

    if (!doctor) return [];

    return this.alerts().filter(alert =>
      alert.userId === doctor.id &&
      alert.status === 'RESOLVED'
    );
  });

  protected riskClass = computed(() =>
    this.currentRisk()?.riskLevel.toLowerCase() ?? 'low'
  );

  protected riskLabel = computed(() => {
    const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';
    return this.getRiskLabel(riskLevel);
  });

  protected healthMessage = computed(() => {
    const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

    const messages: Record<RiskLevel, string> = {
      LOW: 'clinical.doctor.message.low',
      MODERATE: 'clinical.doctor.message.moderate',
      HIGH: 'clinical.doctor.message.high',
      CRITICAL: 'clinical.doctor.message.critical'
    };

    return messages[riskLevel];
  });

  protected recommendations = computed(() => {
    const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

    const recommendations: Record<RiskLevel, string[]> = {
      LOW: [
        'clinical.doctor.recommendations.keep-hydrated',
        'clinical.doctor.recommendations.keep-monitoring'
      ],
      MODERATE: [
        'clinical.doctor.recommendations.short-break',
        'clinical.doctor.recommendations.breathing'
      ],
      HIGH: [
        'clinical.doctor.recommendations.notify-supervisor',
        'clinical.doctor.recommendations.recovery-break'
      ],
      CRITICAL: [
        'clinical.doctor.recommendations.stop-activity',
        'clinical.doctor.recommendations.immediate-support'
      ]
    };

    return recommendations[riskLevel];
  });

  ngOnInit(): void {
    this.loadHealthData();
  }

  protected getRiskLabel(riskLevel: RiskLevel): string {
    const labels: Record<RiskLevel, string> = {
      LOW: 'clinical.risk.low',
      MODERATE: 'clinical.risk.moderate',
      HIGH: 'clinical.risk.high',
      CRITICAL: 'clinical.risk.critical'
    };

    return labels[riskLevel];
  }

  protected getRiskClass(riskLevel: RiskLevel): string {
    return riskLevel.toLowerCase();
  }

  private loadHealthData(): void {
    const doctor = this.authenticationStore.currentUser();

    if (!doctor) {
      this.errorMessage.set('clinical.doctor.error.no-session');
      return;
    }

    this.loading.set(true);

    this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(doctor.organizationId).subscribe({
      next: risks => {
        this.risks.set(risks);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('clinical.doctor.error.load-failed');
        this.loading.set(false);
      }
    });

    this.clinicalRiskApi.getClinicalAlertsByOrganizationId(doctor.organizationId).subscribe({
      next: alerts => {
        this.alerts.set(alerts);
      },
      error: () => {
        this.errorMessage.set('clinical.doctor.error.load-failed');
      }
    });
  }
}