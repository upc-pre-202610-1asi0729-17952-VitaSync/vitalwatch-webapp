import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { User } from '../../../../iam/domain/model/user.entity';
import { ShiftCoordinationStore } from '../../../../shift-coordination/application/shift-coordination.store';
import { CareTeam } from '../../../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../../../shift-coordination/domain/model/team-member.entity';
import { ClinicalRiskStore } from '../../../application/clinical-risk.store';
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
  private iamStore = inject(IamStore);
  private shiftCoordinationStore = inject(ShiftCoordinationStore);
  private clinicalRiskStore = inject(ClinicalRiskStore);

  private localErrorMessage = signal<string | null>(null);

  protected teams = computed<CareTeam[]>(() => {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) return [];

    return this.shiftCoordinationStore.teams().filter(team =>
      team.supervisorId === currentUser.id &&
      team.status === 'ACTIVE'
    );
  });

  protected members = computed<TeamMember[]>(() =>
    this.shiftCoordinationStore.teamMembers()
  );

  protected users = computed<User[]>(() =>
    this.iamStore.users()
  );

  protected risks = computed<RiskAssessment[]>(() =>
    this.clinicalRiskStore.riskAssessments()
  );

  protected alerts = computed<ClinicalAlert[]>(() =>
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
    this.risks().filter(risk =>
      this.assignedMemberIds().includes(risk.userId)
    )
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
      this.localErrorMessage.set('clinical.supervisor.error.no-session');
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