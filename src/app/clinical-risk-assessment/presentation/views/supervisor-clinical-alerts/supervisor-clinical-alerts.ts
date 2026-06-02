import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { UserApi } from '../../../../iam/infrastructure/apis/user-api';
import { User } from '../../../../iam/domain/model/user.entity';
import { CareTeamApi } from '../../../../shift-coordination/infrastructure/care-team-api';
import { CareTeam } from '../../../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../../../shift-coordination/domain/model/team-member.entity';
import { ClinicalRiskApi } from '../../../infrastructure/clinical-risk-api';
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
      alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
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
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser || !alert.isActive) return;

    this.clinicalRiskApi.updateClinicalAlertStatus(alert.id, {
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolvedBy: currentUser.id
    }).subscribe({
      next: updatedAlert => {
        this.alerts.update(alerts =>
          alerts.map(item => item.id === updatedAlert.id ? updatedAlert : item)
        );
        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('clinical.alerts.error.resolve-failed');
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
      this.errorMessage.set('clinical.alerts.error.no-session');
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
        this.errorMessage.set('clinical.alerts.error.load-failed');
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