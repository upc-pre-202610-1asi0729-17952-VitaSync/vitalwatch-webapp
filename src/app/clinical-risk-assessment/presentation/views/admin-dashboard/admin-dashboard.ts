import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { User } from '../../../../iam/domain/model/user.entity';
import { ShiftCoordinationStore } from '../../../../shift-coordination/application/shift-coordination.store';
import { ClinicalRiskStore } from '../../../application/clinical-risk.store';
import { RiskLevel } from '../../../domain/model/risk-assessment.entity';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    TranslatePipe,
    NgIcon
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private iamStore = inject(IamStore);
  private shiftCoordinationStore = inject(ShiftCoordinationStore);
  private clinicalRiskStore = inject(ClinicalRiskStore);

  private localErrorMessage = signal<string | null>(null);

  protected users = computed(() =>
    this.iamStore.users()
  );

  protected teams = computed(() =>
    this.shiftCoordinationStore.teams()
  );

  protected members = computed(() =>
    this.shiftCoordinationStore.teamMembers()
  );

  protected risks = computed(() =>
    this.clinicalRiskStore.riskAssessments()
  );

  protected alerts = computed(() =>
    this.clinicalRiskStore.clinicalAlerts()
  );

  protected loading = computed(() =>
    this.iamStore.loading() ||
    this.shiftCoordinationStore.loading() ||
    this.clinicalRiskStore.loading()
  );

  protected errorMessage = computed(() =>
    this.localErrorMessage() ??
    this.iamStore.error() ??
    this.shiftCoordinationStore.error() ??
    this.clinicalRiskStore.error()
  );

  protected activeUsers = computed(() =>
    this.users().filter(user => user.status === 'ACTIVE')
  );

  protected activeDoctors = computed(() =>
    this.activeUsers().filter(user => user.role === 'DOCTOR')
  );

  protected activeSupervisors = computed(() =>
    this.activeUsers().filter(user => user.role === 'SUPERVISOR')
  );

  protected activeTeams = computed(() =>
    this.teams().filter(team => team.status === 'ACTIVE')
  );

  protected activeAlerts = computed(() =>
    this.alerts().filter(alert => alert.isActive)
  );

  protected highRiskAssessments = computed(() =>
    this.risks().filter(risk =>
      risk.riskLevel === 'HIGH' ||
      risk.riskLevel === 'CRITICAL'
    )
  );

  protected averageFatigue = computed(() => {
    const risks = this.risks();

    if (risks.length === 0) return 0;

    const total = risks.reduce((sum, risk) => sum + risk.fatigueLevel, 0);

    return Math.round(total / risks.length);
  });

  protected staffAtRisk = computed(() =>
    this.highRiskAssessments()
      .filter(risk => {
        const user = this.getUserById(risk.userId);

        return user?.role === 'DOCTOR' &&
          user.status === 'ACTIVE';
      })
      .sort((a, b) => b.fatigueLevel - a.fatigueLevel)
  );

  ngOnInit(): void {
    this.loadDashboard();
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

  private loadDashboard(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.localErrorMessage.set('clinical.admin.error.no-session');
      return;
    }

    this.localErrorMessage.set(null);
    this.iamStore.clearError();
    this.shiftCoordinationStore.clearError();
    this.clinicalRiskStore.clearError();

    this.iamStore.loadStaffData();
    this.shiftCoordinationStore.loadTeams();
    this.clinicalRiskStore.loadRiskAndAlerts();
  }
}