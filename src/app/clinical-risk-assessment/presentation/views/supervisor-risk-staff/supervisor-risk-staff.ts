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
import { RiskAssessment, RiskLevel } from '../../../domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../../domain/model/clinical-alert.entity';

type RiskFilter = 'ALL' | RiskLevel;

interface RiskStaffItem {
  doctor: User;
  risk: RiskAssessment;
  teamName: string;
  activeAlerts: number;
}

@Component({
  selector: 'app-supervisor-risk-staff',
  imports: [
    TranslatePipe,
    DatePipe,
    MatSelectModule,
    NgIcon
  ],
  templateUrl: './supervisor-risk-staff.html',
  styleUrl: './supervisor-risk-staff.css'
})
export class SupervisorRiskStaff implements OnInit {
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
  protected riskFilter = signal<RiskFilter>('ALL');

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

  protected riskStaff = computed<RiskStaffItem[]>(() =>
    this.assignedDoctors()
      .map(doctor => {
        const risk = this.getRiskByUserId(doctor.id);

        if (!risk || risk.riskLevel === 'LOW') return null;

        return {
          doctor,
          risk,
          teamName: this.getTeamNameByDoctorId(doctor.id),
          activeAlerts: this.getActiveAlertsCount(doctor.id)
        };
      })
      .filter((item): item is RiskStaffItem => item !== null)
      .sort((a, b) => {
        const riskPriority =
          this.getRiskPriority(b.risk.riskLevel) -
          this.getRiskPriority(a.risk.riskLevel);

        if (riskPriority !== 0) return riskPriority;

        return b.risk.fatigueLevel - a.risk.fatigueLevel;
      })
  );

  protected filteredRiskStaff = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const riskFilter = this.riskFilter();

    return this.riskStaff().filter(item => {
      const matchesSearch =
        item.doctor.fullName.toLowerCase().includes(search) ||
        item.doctor.email.toLowerCase().includes(search) ||
        item.teamName.toLowerCase().includes(search);

      const matchesRisk =
        riskFilter === 'ALL' ||
        item.risk.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  });

  protected moderateCount = computed(() =>
    this.riskStaff().filter(item => item.risk.riskLevel === 'MODERATE').length
  );

  protected highCount = computed(() =>
    this.riskStaff().filter(item => item.risk.riskLevel === 'HIGH').length
  );

  protected criticalCount = computed(() =>
    this.riskStaff().filter(item => item.risk.riskLevel === 'CRITICAL').length
  );

  ngOnInit(): void {
    this.loadRiskStaff();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateRiskFilter(value: RiskFilter): void {
    this.riskFilter.set(value);
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

  private getRiskByUserId(userId: number): RiskAssessment | undefined {
    return this.risks().find(risk => risk.userId === userId);
  }

  private getActiveAlertsCount(userId: number): number {
    return this.alerts().filter(alert =>
      alert.userId === userId &&
      alert.status === 'ACTIVE'
    ).length;
  }

  private getTeamNameByDoctorId(userId: number): string {
    const membership = this.members().find(member =>
      member.userId === userId &&
      this.assignedTeamIds().includes(member.teamId)
    );

    if (!membership) return '—';

    return this.teams().find(team => team.id === membership.teamId)?.name ?? '—';
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

  private loadRiskStaff(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.localErrorMessage.set('clinical.riskStaff.error.no-session');
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