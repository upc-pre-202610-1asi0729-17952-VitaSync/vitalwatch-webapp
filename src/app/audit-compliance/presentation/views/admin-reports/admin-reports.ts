import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { UserApi } from '../../../../iam/infrastructure/apis/user-api';
import { User } from '../../../../iam/domain/model/user.entity';
import { CareTeamApi } from '../../../../shift-coordination/infrastructure/api/care-team-api';
import { CareTeam } from '../../../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../../../shift-coordination/domain/model/team-member.entity';
import { ShiftRecordApi } from '../../../../shift-coordination/infrastructure/api/shift-record-api';
import { ShiftRecord } from '../../../../shift-coordination/domain/model/shift-record.entity';
import { ClinicalRiskApi } from '../../../../clinical-risk-assessment/infrastructure/clinical-risk-api';
import { RiskAssessment, RiskLevel } from '../../../../clinical-risk-assessment/domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../../../clinical-risk-assessment/domain/model/clinical-alert.entity';
import { VitalSignAnomalyApi } from '../../../../clinical-risk-assessment/infrastructure/vital-sign-anomaly-api';
import { VitalSignAnomaly } from '../../../../clinical-risk-assessment/domain/model/vital-sign-anomaly.entity';
import { PreventiveActionApi } from '../../../../staff-recovery/infrastructure/preventive-action-api';
import { PreventiveAction } from '../../../../staff-recovery/domain/model/preventive-action.entity';

interface StaffReportItem {
  doctor: User;
  teamName: string;
  risk: RiskAssessment | null;
  activeAlerts: number;
  openAnomalies: number;
  preventiveActions: number;
  completedShifts: number;
}

@Component({
  selector: 'app-admin-reports',
  imports: [
    TranslatePipe,
    NgIcon
  ],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css'
})
export class AdminReports implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private userApi = inject(UserApi);
  private careTeamApi = inject(CareTeamApi);
  private shiftRecordApi = inject(ShiftRecordApi);
  private clinicalRiskApi = inject(ClinicalRiskApi);
  private anomalyApi = inject(VitalSignAnomalyApi);
  private preventiveActionApi = inject(PreventiveActionApi);

  protected users = signal<User[]>([]);
  protected teams = signal<CareTeam[]>([]);
  protected members = signal<TeamMember[]>([]);
  protected shifts = signal<ShiftRecord[]>([]);
  protected risks = signal<RiskAssessment[]>([]);
  protected alerts = signal<ClinicalAlert[]>([]);
  protected anomalies = signal<VitalSignAnomaly[]>([]);
  protected actions = signal<PreventiveAction[]>([]);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected activeDoctors = computed(() =>
    this.users().filter(user =>
      user.role === 'DOCTOR' &&
      user.status === 'ACTIVE'
    )
  );

  protected activeSupervisors = computed(() =>
    this.users().filter(user =>
      user.role === 'SUPERVISOR' &&
      user.status === 'ACTIVE'
    )
  );

  protected activeTeams = computed(() =>
    this.teams().filter(team => team.status === 'ACTIVE')
  );

  protected activeAlerts = computed(() =>
    this.alerts().filter(alert => alert.status === 'ACTIVE')
  );

  protected resolvedAlerts = computed(() =>
    this.alerts().filter(alert => alert.status === 'RESOLVED')
  );

  protected openAnomalies = computed(() =>
    this.anomalies().filter(anomaly => anomaly.status === 'OPEN')
  );

  protected completedPreventiveActions = computed(() =>
    this.actions().filter(action => action.status === 'COMPLETED')
  );

  protected highRiskStaff = computed(() =>
    this.risks().filter(risk =>
      risk.riskLevel === 'HIGH' ||
      risk.riskLevel === 'CRITICAL'
    )
  );

  protected averageFatigue = computed(() => {
    const risks = this.risks().filter(risk => {
      const user = this.getUserById(risk.userId);
      return user?.role === 'DOCTOR' && user.status === 'ACTIVE';
    });

    if (risks.length === 0) return 0;

    const total = risks.reduce((sum, risk) => sum + risk.fatigueLevel, 0);

    return Math.round(total / risks.length);
  });

  protected completedShifts = computed(() =>
    this.shifts().filter(shift => shift.status === 'COMPLETED')
  );

  protected totalCompletedHours = computed(() =>
    this.completedShifts().reduce((total, shift) => {
      const start = new Date(shift.checkInAt ?? shift.scheduledStart).getTime();
      const end = new Date(shift.checkOutAt ?? shift.scheduledEnd).getTime();

      return total + Math.max(end - start, 0) / 1000 / 60 / 60;
    }, 0)
  );

  protected staffReport = computed<StaffReportItem[]>(() =>
    this.activeDoctors()
      .map(doctor => ({
        doctor,
        teamName: this.getTeamNameByDoctorId(doctor.id),
        risk: this.getRiskByUserId(doctor.id),
        activeAlerts: this.getActiveAlertCountByUserId(doctor.id),
        openAnomalies: this.getOpenAnomalyCountByUserId(doctor.id),
        preventiveActions: this.getPreventiveActionCountByUserId(doctor.id),
        completedShifts: this.getCompletedShiftCountByUserId(doctor.id)
      }))
      .sort((a, b) => {
        const aRisk = a.risk ? this.getRiskPriority(a.risk.riskLevel) : 0;
        const bRisk = b.risk ? this.getRiskPriority(b.risk.riskLevel) : 0;

        if (bRisk !== aRisk) return bRisk - aRisk;

        return (b.risk?.fatigueLevel ?? 0) - (a.risk?.fatigueLevel ?? 0);
      })
  );

  ngOnInit(): void {
    this.loadReports();
  }

  protected getUserById(userId: number): User | undefined {
    return this.users().find(user => user.id === userId);
  }

  protected getSupervisorName(supervisorId: number | null): string {
    if (!supervisorId) return '—';

    return this.getUserById(supervisorId)?.fullName ?? '—';
  }

  protected getTeamMemberCount(teamId: number): number {
    return this.members().filter(member => {
      const user = this.getUserById(member.userId);

      return member.teamId === teamId &&
        user?.role === 'DOCTOR' &&
        user.status === 'ACTIVE';
    }).length;
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

  protected formatHours(value: number): string {
    return `${Math.round(value)}h`;
  }

  private getRiskByUserId(userId: number): RiskAssessment | null {
    return this.risks().find(risk => risk.userId === userId) ?? null;
  }

  private getTeamNameByDoctorId(userId: number): string {
    const membership = this.members().find(member => member.userId === userId);

    if (!membership) return '—';

    return this.teams().find(team => team.id === membership.teamId)?.name ?? '—';
  }

  private getActiveAlertCountByUserId(userId: number): number {
    return this.alerts().filter(alert =>
      alert.userId === userId &&
      alert.status === 'ACTIVE'
    ).length;
  }

  private getOpenAnomalyCountByUserId(userId: number): number {
    return this.anomalies().filter(anomaly =>
      anomaly.userId === userId &&
      anomaly.status === 'OPEN'
    ).length;
  }

  private getPreventiveActionCountByUserId(userId: number): number {
    return this.actions().filter(action =>
      action.userId === userId
    ).length;
  }

  private getCompletedShiftCountByUserId(userId: number): number {
    return this.shifts().filter(shift =>
      shift.userId === userId &&
      shift.status === 'COMPLETED'
    ).length;
  }

  private getRiskPriority(riskLevel: RiskLevel): number {
    const priorities: Record<RiskLevel, number> = {
      LOW: 1,
      MODERATE: 2,
      HIGH: 3,
      CRITICAL: 4
    };

    return priorities[riskLevel];
  }

  private loadReports(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('audit.reports.error.no-session');
      return;
    }

    this.loading.set(true);

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('audit.reports.error.load-failed');
        this.loading.set(false);
      }
    });

    this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId).subscribe(teams => {
      this.teams.set(teams);
    });

    this.careTeamApi.getTeamMembers().subscribe(members => {
      this.members.set(members);
    });

    this.shiftRecordApi.getShiftRecordsByOrganizationId(currentUser.organizationId).subscribe(shifts => {
      this.shifts.set(shifts);
    });

    this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(currentUser.organizationId).subscribe(risks => {
      this.risks.set(risks);
    });

    this.clinicalRiskApi.getClinicalAlertsByOrganizationId(currentUser.organizationId).subscribe(alerts => {
      this.alerts.set(alerts);
    });

    this.anomalyApi.getAnomaliesByOrganizationId(currentUser.organizationId).subscribe(anomalies => {
      this.anomalies.set(anomalies);
    });

    this.preventiveActionApi.getPreventiveActionsByOrganizationId(currentUser.organizationId).subscribe(actions => {
      this.actions.set(actions);
    });
  }
}