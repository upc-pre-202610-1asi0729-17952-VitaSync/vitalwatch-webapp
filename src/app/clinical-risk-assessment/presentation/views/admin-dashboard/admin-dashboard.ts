import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { UserApi } from '../../../../iam/infrastructure/apis/user-api';
import { User } from '../../../../iam/domain/model/user.entity';
import { CareTeamApi } from '../../../../shift-coordination/infrastructure/api/care-team-api';
import { CareTeam } from '../../../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../../../shift-coordination/domain/model/team-member.entity';
import { ClinicalRiskApi } from '../../../infrastructure/clinical-risk-api';
import { RiskAssessment, RiskLevel } from '../../../domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../../domain/model/clinical-alert.entity';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    TranslatePipe,
    NgIcon,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private userApi = inject(UserApi);
  private careTeamApi = inject(CareTeamApi);
  private clinicalRiskApi = inject(ClinicalRiskApi);

  protected users = signal<User[]>([]);
  protected teams = signal<CareTeam[]>([]);
  protected members = signal<TeamMember[]>([]);
  protected risks = signal<RiskAssessment[]>([]);
  protected alerts = signal<ClinicalAlert[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

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
    this.risks().filter(risk => risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL')
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
        return user?.role === 'DOCTOR' && user.status === 'ACTIVE';
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
      this.errorMessage.set('clinical.admin.error.no-session');
      return;
    }

    this.loading.set(true);

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('clinical.admin.error.load-failed');
        this.loading.set(false);
      }
    });

    this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId).subscribe(teams => {
      this.teams.set(teams);
    });

    this.careTeamApi.getTeamMembers().subscribe(members => {
      this.members.set(members);
    });

    this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(currentUser.organizationId).subscribe(risks => {
      this.risks.set(risks);
    });

    this.clinicalRiskApi.getClinicalAlertsByOrganizationId(currentUser.organizationId).subscribe(alerts => {
      this.alerts.set(alerts);
    });
  }
}