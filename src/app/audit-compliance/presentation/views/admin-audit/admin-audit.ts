import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { UserApi } from '../../../../iam/infrastructure/user-api';
import { User } from '../../../../iam/domain/model/user.entity';
import { AuditLogApi } from '../../../infrastructure/audit-log-api';
import {
  AuditLog,
  AuditLogSeverity,
  AuditLogType
} from '../../../domain/model/audit-log.entity';

type AuditTypeFilter = 'ALL' | AuditLogType;
type AuditSeverityFilter = 'ALL' | AuditLogSeverity;

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
  private authenticationStore = inject(AuthenticationStore);
  private auditLogApi = inject(AuditLogApi);
  private userApi = inject(UserApi);

  protected auditLogs = signal<AuditLog[]>([]);
  protected users = signal<User[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected searchTerm = signal('');
  protected typeFilter = signal<AuditTypeFilter>('ALL');
  protected severityFilter = signal<AuditSeverityFilter>('ALL');

  protected auditTypes: AuditLogType[] = [
    'USER_INVITED',
    'USER_REGISTERED',
    'USER_ROLE_CHANGED',
    'USER_STATUS_CHANGED',
    'TEAM_CREATED',
    'TEAM_UPDATED',
    'TEAM_STATUS_CHANGED',
    'ALERT_RESOLVED',
    'ANOMALY_REVIEWED',
    'ANOMALY_DISMISSED',
    'PREVENTIVE_ACTION_CREATED',
    'PREVENTIVE_ACTION_COMPLETED',
    'SHIFT_CHECK_IN',
    'SHIFT_CHECK_OUT'
  ];

  protected filteredAuditLogs = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.typeFilter();
    const severity = this.severityFilter();

    return this.auditLogs().filter(log => {
      const actorName = this.getActorName(log.actorUserId).toLowerCase();

      const matchesSearch =
        log.description.toLowerCase().includes(search) ||
        log.type.toLowerCase().includes(search) ||
        log.resourceType.toLowerCase().includes(search) ||
        actorName.includes(search);

      const matchesType = type === 'ALL' || log.type === type;
      const matchesSeverity = severity === 'ALL' || log.severity === severity;

      return matchesSearch && matchesType && matchesSeverity;
    });
  });

  protected totalLogs = computed(() => this.auditLogs().length);

  protected warningLogs = computed(() =>
    this.auditLogs().filter(log => log.severity === 'WARNING').length
  );

  protected criticalLogs = computed(() =>
    this.auditLogs().filter(log => log.severity === 'CRITICAL').length
  );

  protected userManagementLogs = computed(() =>
    this.auditLogs().filter(log =>
      log.type === 'USER_INVITED' ||
      log.type === 'USER_REGISTERED' ||
      log.type === 'USER_ROLE_CHANGED' ||
      log.type === 'USER_STATUS_CHANGED'
    ).length
  );

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateTypeFilter(value: AuditTypeFilter): void {
    this.typeFilter.set(value);
  }

  protected updateSeverityFilter(value: AuditSeverityFilter): void {
    this.severityFilter.set(value);
  }

  protected getActorName(actorUserId: number | null): string {
    if (!actorUserId) return 'Sistema';

    return this.users().find(user => user.id === actorUserId)?.fullName ?? 'Sistema';
  }

  protected getAuditTypeLabel(type: AuditLogType): string {
    const labels: Record<AuditLogType, string> = {
      USER_INVITED: 'audit.logs.types.user-invited',
      USER_REGISTERED: 'audit.logs.types.user-registered',
      USER_ROLE_CHANGED: 'audit.logs.types.user-role-changed',
      USER_STATUS_CHANGED: 'audit.logs.types.user-status-changed',
      TEAM_CREATED: 'audit.logs.types.team-created',
      TEAM_UPDATED: 'audit.logs.types.team-updated',
      TEAM_STATUS_CHANGED: 'audit.logs.types.team-status-changed',
      ALERT_RESOLVED: 'audit.logs.types.alert-resolved',
      ANOMALY_REVIEWED: 'audit.logs.types.anomaly-reviewed',
      ANOMALY_DISMISSED: 'audit.logs.types.anomaly-dismissed',
      PREVENTIVE_ACTION_CREATED: 'audit.logs.types.preventive-action-created',
      PREVENTIVE_ACTION_COMPLETED: 'audit.logs.types.preventive-action-completed',
      SHIFT_CHECK_IN: 'audit.logs.types.shift-check-in',
      SHIFT_CHECK_OUT: 'audit.logs.types.shift-check-out'
    };

    return labels[type];
  }

  protected getSeverityLabel(severity: AuditLogSeverity): string {
    const labels: Record<AuditLogSeverity, string> = {
      INFO: 'audit.logs.severity.info',
      WARNING: 'audit.logs.severity.warning',
      CRITICAL: 'audit.logs.severity.critical'
    };

    return labels[severity];
  }

  protected getSeverityClass(severity: AuditLogSeverity): string {
    return severity.toLowerCase();
  }

  private loadAuditLogs(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('audit.logs.error.no-session');
      return;
    }

    this.loading.set(true);

    this.auditLogApi.getAuditLogsByOrganizationId(currentUser.organizationId).subscribe({
      next: auditLogs => {
        this.auditLogs.set(auditLogs);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('audit.logs.error.load-failed');
        this.loading.set(false);
      }
    });

    this.userApi.getUsersByOrganizationId(currentUser.organizationId).subscribe(users => {
      this.users.set(users);
    });
  }
}