import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';

import {
  AuditComplianceStore,
  AuditSeverityFilter,
  AuditTypeFilter
} from '../../../application/audit-compliance.store';
import {
  AuditLogSeverity,
  AuditLogType
} from '../../../domain/model/audit-log.entity';

@Component({
  selector: 'app-admin-audit',
  imports: [
    TranslatePipe,
    DatePipe,
    MatSelectModule,
    NgIcon
  ],
  templateUrl: './admin-audit.html',
  styleUrl: './admin-audit.css'
})
export class AdminAudit implements OnInit {
  private auditComplianceStore = inject(AuditComplianceStore);

  protected errorMessage = this.auditComplianceStore.errorMessage;

  protected searchTerm = this.auditComplianceStore.searchTerm;
  protected typeFilter = this.auditComplianceStore.typeFilter;
  protected severityFilter = this.auditComplianceStore.severityFilter;

  protected auditTypes = this.auditComplianceStore.auditTypes;
  protected filteredAuditLogs = this.auditComplianceStore.filteredAuditLogs;

  protected totalLogs = this.auditComplianceStore.totalLogs;
  protected warningLogs = this.auditComplianceStore.warningLogs;
  protected criticalLogs = this.auditComplianceStore.criticalLogs;
  protected userManagementLogs = this.auditComplianceStore.userManagementLogs;

  ngOnInit(): void {
    this.auditComplianceStore.loadAuditLogs();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.auditComplianceStore.updateSearchTerm(input.value);
  }

  protected updateTypeFilter(value: AuditTypeFilter): void {
    this.auditComplianceStore.updateTypeFilter(value);
  }

  protected updateSeverityFilter(value: AuditSeverityFilter): void {
    this.auditComplianceStore.updateSeverityFilter(value);
  }

  protected getActorName(actorUserId: number | null): string {
    return this.auditComplianceStore.getActorName(actorUserId);
  }

  protected getAuditTypeLabel(type: AuditLogType): string {
    return this.auditComplianceStore.getAuditTypeLabel(type);
  }

  protected getSeverityLabel(severity: AuditLogSeverity): string {
    return this.auditComplianceStore.getSeverityLabel(severity);
  }

  protected getSeverityClass(severity: AuditLogSeverity): string {
    return this.auditComplianceStore.getSeverityClass(severity);
  }
}