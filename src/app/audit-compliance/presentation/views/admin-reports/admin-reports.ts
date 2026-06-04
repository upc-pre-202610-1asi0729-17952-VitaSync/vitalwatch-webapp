import { Component, inject, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

import { AuditComplianceStore } from '../../../application/audit-compliance.store';
import { RiskLevel } from '../../../../clinical-risk-assessment/domain/model/risk-assessment.entity';

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
  private auditComplianceStore = inject(AuditComplianceStore);

  protected errorMessage = this.auditComplianceStore.errorMessage;

  protected activeDoctors = this.auditComplianceStore.activeDoctors;
  protected activeSupervisors = this.auditComplianceStore.activeSupervisors;
  protected activeTeams = this.auditComplianceStore.activeTeams;
  protected activeAlerts = this.auditComplianceStore.activeAlerts;
  protected resolvedAlerts = this.auditComplianceStore.resolvedAlerts;
  protected openAnomalies = this.auditComplianceStore.openAnomalies;
  protected completedPreventiveActions = this.auditComplianceStore.completedPreventiveActions;
  protected highRiskStaff = this.auditComplianceStore.highRiskStaff;
  protected averageFatigue = this.auditComplianceStore.averageFatigue;
  protected completedShifts = this.auditComplianceStore.completedShifts;
  protected totalCompletedHours = this.auditComplianceStore.totalCompletedHours;
  protected staffReport = this.auditComplianceStore.staffReport;

  ngOnInit(): void {
    this.auditComplianceStore.loadReports();
  }

  protected getSupervisorName(supervisorId: number | null): string {
    return this.auditComplianceStore.getSupervisorName(supervisorId);
  }

  protected getTeamMemberCount(teamId: number): number {
    return this.auditComplianceStore.getTeamMemberCount(teamId);
  }

  protected getRiskLabel(riskLevel: RiskLevel): string {
    return this.auditComplianceStore.getRiskLabel(riskLevel);
  }

  protected getRiskClass(riskLevel: RiskLevel): string {
    return this.auditComplianceStore.getRiskClass(riskLevel);
  }

  protected formatHours(value: number): string {
    return this.auditComplianceStore.formatHours(value);
  }
}