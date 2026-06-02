import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  selector: 'app-supervisor-dashboard',
  imports: [
    TranslatePipe,
    NgIcon,
    DatePipe
  ],
  templateUrl: './supervisor-dashboard.html',
  styleUrl: './supervisor-dashboard.css'
})
export class SupervisorDashboard implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private userApi = inject(UserApi);
  private careTeamApi = inject(CareTeamApi);
  private clinicalRiskApi = inject(ClinicalRiskApi);

  protected teams = signal<CareTeam[]>([]);
  protected members = signal<TeamMember[]>([]);
  protected users = signal<User[]>([]);
  protected risks = signal<RiskAssessment[]>([]);
  protected alerts = signal<ClinicalAlert[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

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

  protected assignedRisks = computed(() =>
    this.risks().filter(risk => this.assignedMemberIds().includes(risk.userId))
  );

  protected activeAlerts = computed(() =>
    this.alerts().filter(alert =>
      alert.isActive &&
      this.assignedMemberIds().includes(alert.userId)
    )
  );

  protected highRiskCount = computed(() =>
    this.assignedRisks().filter(risk => risk.isHighRisk).length
  );

  protected averageFatigue = computed(() => {
    const risks = this.assignedRisks();

    if (risks.length === 0) return 0;

    const total = risks.reduce((sum, risk) => sum + risk.fatigueLevel, 0);

    return Math.round(total / risks.length);
  });

  protected actionsTakenToday = computed(() =>
    this.alerts().filter(alert =>
      alert.status === 'RESOLVED' &&
      this.assignedMemberIds().includes(alert.userId)
    ).length
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected getUserById(userId: number): User | undefined {
    return this.users().find(user => user.id === userId);
  }

  protected getRiskByUserId(userId: number): RiskAssessment | undefined {
    return this.risks().find(risk => risk.userId === userId);
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
      this.errorMessage.set('clinical.supervisor.error.no-session');
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
        this.errorMessage.set('clinical.supervisor.error.load-failed');
        this.loading.set(false);
      }
    });

    this.careTeamApi.getTeamMembers().subscribe(members => {
      this.members.set(members);
    });

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe(users => {
      this.users.set(users);
    });

    this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(currentUser.organizationId).subscribe(risks => {
      this.risks.set(risks);
    });

    this.clinicalRiskApi.getClinicalAlertsByOrganizationId(currentUser.organizationId).subscribe(alerts => {
      this.alerts.set(alerts);
    });
  }
}