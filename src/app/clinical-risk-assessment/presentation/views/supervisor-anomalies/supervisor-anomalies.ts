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
import { RiskLevel } from '../../../domain/model/risk-assessment.entity';
import {
  VitalSignAnomaly,
  VitalSignAnomalyStatus,
  VitalSignAnomalyType
} from '../../../domain/model/vital-sign-anomaly.entity';
import { VitalSignAnomalyApi } from '../../../infrastructure/vital-sign-anomaly-api';

type StatusFilter = 'ALL' | VitalSignAnomalyStatus;
type SeverityFilter = 'ALL' | RiskLevel;

@Component({
  selector: 'app-supervisor-anomalies',
  imports: [
    TranslatePipe,
    DatePipe,
    MatSelectModule,
    NgIcon
  ],
  templateUrl: './supervisor-anomalies.html',
  styleUrl: './supervisor-anomalies.css'
})
export class SupervisorAnomalies implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private userApi = inject(UserApi);
  private careTeamApi = inject(CareTeamApi);
  private anomalyApi = inject(VitalSignAnomalyApi);

  protected teams = signal<CareTeam[]>([]);
  protected members = signal<TeamMember[]>([]);
  protected users = signal<User[]>([]);
  protected anomalies = signal<VitalSignAnomaly[]>([]);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected searchTerm = signal('');
  protected statusFilter = signal<StatusFilter>('OPEN');
  protected severityFilter = signal<SeverityFilter>('ALL');

  protected assignedTeamIds = computed(() =>
    this.teams().map(team => team.id)
  );

  protected assignedMemberIds = computed(() =>
    this.members()
      .filter(member => this.assignedTeamIds().includes(member.teamId))
      .map(member => member.userId)
  );

  protected assignedAnomalies = computed(() =>
    this.anomalies().filter(anomaly =>
      this.assignedMemberIds().includes(anomaly.userId)
    )
  );

  protected openAnomalies = computed(() =>
    this.assignedAnomalies().filter(anomaly => anomaly.status === 'OPEN')
  );

  protected reviewedAnomalies = computed(() =>
    this.assignedAnomalies().filter(anomaly => anomaly.status === 'REVIEWED')
  );

  protected dismissedAnomalies = computed(() =>
    this.assignedAnomalies().filter(anomaly => anomaly.status === 'DISMISSED')
  );

  protected criticalAnomalies = computed(() =>
    this.openAnomalies().filter(anomaly => anomaly.severity === 'CRITICAL')
  );

  protected filteredAnomalies = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const severity = this.severityFilter();

    return this.assignedAnomalies().filter(anomaly => {
      const user = this.getUserById(anomaly.userId);

      const matchesSearch =
        anomaly.message.toLowerCase().includes(search) ||
        this.getAnomalyTypeLabel(anomaly.type).toLowerCase().includes(search) ||
        user?.fullName.toLowerCase().includes(search) ||
        user?.email.toLowerCase().includes(search);

      const matchesStatus = status === 'ALL' || anomaly.status === status;
      const matchesSeverity = severity === 'ALL' || anomaly.severity === severity;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  });

  ngOnInit(): void {
    this.loadAnomalies();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected updateSeverityFilter(value: SeverityFilter): void {
    this.severityFilter.set(value);
  }

  protected markAsReviewed(anomaly: VitalSignAnomaly): void {
    this.updateAnomalyStatus(anomaly, 'REVIEWED');
  }

  protected dismissAnomaly(anomaly: VitalSignAnomaly): void {
    this.updateAnomalyStatus(anomaly, 'DISMISSED');
  }

  protected getUserById(userId: number): User | undefined {
    return this.users().find(user => user.id === userId);
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

  protected getStatusLabel(status: VitalSignAnomalyStatus): string {
    const labels: Record<VitalSignAnomalyStatus, string> = {
      OPEN: 'clinical.anomalies.status.open',
      REVIEWED: 'clinical.anomalies.status.reviewed',
      DISMISSED: 'clinical.anomalies.status.dismissed'
    };

    return labels[status];
  }

  protected getAnomalyTypeLabel(type: VitalSignAnomalyType): string {
    const labels: Record<VitalSignAnomalyType, string> = {
      HEART_RATE_SPIKE: 'clinical.anomalies.types.heart-rate-spike',
      LOW_HRV: 'clinical.anomalies.types.low-hrv',
      FATIGUE_SPIKE: 'clinical.anomalies.types.fatigue-spike',
      SENSOR_SIGNAL_LOSS: 'clinical.anomalies.types.sensor-signal-loss'
    };

    return labels[type];
  }

  protected getRiskClass(riskLevel: RiskLevel): string {
    return riskLevel.toLowerCase();
  }

  private updateAnomalyStatus(anomaly: VitalSignAnomaly, status: VitalSignAnomalyStatus): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser || !anomaly.isOpen) return;

    this.anomalyApi.updateAnomalyStatus(anomaly.id, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser.id
    }).subscribe({
      next: updatedAnomaly => {
        this.anomalies.update(anomalies =>
          anomalies.map(item => item.id === updatedAnomaly.id ? updatedAnomaly : item)
        );
        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('clinical.anomalies.error.update-failed');
      }
    });
  }

  private loadAnomalies(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('clinical.anomalies.error.no-session');
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
        this.errorMessage.set('clinical.anomalies.error.load-failed');
        this.loading.set(false);
      }
    });

    this.careTeamApi.getTeamMembers().subscribe(members => {
      this.members.set(members);
    });

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe(users => {
      this.users.set(users);
    });

    this.anomalyApi.getAnomaliesByOrganizationId(currentUser.organizationId).subscribe(anomalies => {
      this.anomalies.set([...anomalies].reverse());
    });
  }
}