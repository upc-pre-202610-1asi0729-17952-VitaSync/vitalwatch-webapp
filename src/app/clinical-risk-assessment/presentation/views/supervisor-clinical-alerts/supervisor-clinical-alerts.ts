import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { User } from '../../../../iam/domain/model/user.entity';
import { ShiftCoordinationStore } from '../../../../shift-coordination/application/shift-coordination.store';
import { CareTeam } from '../../../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../../../shift-coordination/domain/model/team-member.entity';
import { ClinicalRiskStore } from '../../../application/clinical-risk.store';
import { ClinicalAlert, ClinicalAlertStatus } from '../../../domain/model/clinical-alert.entity';
import { RiskAssessment, RiskLevel } from '../../../domain/model/risk-assessment.entity';

type AlertStatusFilter = 'ALL' | ClinicalAlertStatus;
type SeverityFilter = 'ALL' | RiskLevel;

@Component({
  selector: 'app-supervisor-clinical-alerts',
  imports: [
    TranslatePipe,
    DatePipe,
    MatSelectModule,
    NgIcon
  ],
  templateUrl: './supervisor-clinical-alerts.html',
  styleUrl: './supervisor-clinical-alerts.css'
})
export class SupervisorClinicalAlerts implements OnInit {
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

  protected searchTerm = signal('');
  protected statusFilter = signal<AlertStatusFilter>('ACTIVE');
  protected severityFilter = signal<SeverityFilter>('ALL');

  protected assignedTeamIds = computed(() =>
    this.teams().map(team => team.id)
  );

  protected assignedMemberIds = computed(() =>
    this.members()
      .filter(member => this.assignedTeamIds().includes(member.teamId))
      .map(member => member.userId)
  );

  protected assignedAlerts = computed(() =>
    this.alerts().filter(alert =>
      this.assignedMemberIds().includes(alert.userId)
    )
  );

  protected activeAlerts = computed(() =>
    this.assignedAlerts().filter(alert => alert.status === 'ACTIVE')
  );

  protected resolvedAlerts = computed(() =>
    this.assignedAlerts().filter(alert => alert.status === 'RESOLVED')
  );

  protected highPriorityAlerts = computed(() =>
    this.activeAlerts().filter(alert =>
      alert.severity === 'HIGH' ||
      alert.severity === 'CRITICAL'
    )
  );

  protected filteredAlerts = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const severity = this.severityFilter();

    return this.assignedAlerts().filter(alert => {
      const user = this.getUserById(alert.userId);

      const matchesSearch =
        alert.message.toLowerCase().includes(search) ||
        user?.fullName.toLowerCase().includes(search) ||
        user?.email.toLowerCase().includes(search);

      const matchesStatus = status === 'ALL' || alert.status === status;
      const matchesSeverity = severity === 'ALL' || alert.severity === severity;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  });

  ngOnInit(): void {
    this.loadAlerts();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateStatusFilter(value: AlertStatusFilter): void {
    this.statusFilter.set(value);
  }

  protected updateSeverityFilter(value: SeverityFilter): void {
    this.severityFilter.set(value);
  }

  protected resolveAlert(alert: ClinicalAlert): void {
    if (!alert.isActive) return;

    this.localErrorMessage.set(null);
    this.clinicalRiskStore.clearError();

    this.clinicalRiskStore.resolveClinicalAlert(alert).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('clinical.alerts.error.resolve-failed');
      }
    });
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

  protected getStatusLabel(status: ClinicalAlertStatus): string {
    const labels: Record<ClinicalAlertStatus, string> = {
      ACTIVE: 'clinical.alerts.status.active',
      RESOLVED: 'clinical.alerts.status.resolved'
    };

    return labels[status];
  }

  protected getRiskClass(riskLevel: RiskLevel): string {
    return riskLevel.toLowerCase();
  }

  private loadAlerts(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.localErrorMessage.set('clinical.alerts.error.no-session');
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