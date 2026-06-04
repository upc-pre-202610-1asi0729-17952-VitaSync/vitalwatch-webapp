import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { UserApi } from '../../iam/infrastructure/api/user-api';
import { User } from '../../iam/domain/model/user.entity';
import { CareTeamApi } from '../../shift-coordination/infrastructure/api/care-team-api';
import { CareTeam } from '../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../shift-coordination/domain/model/team-member.entity';
import { ShiftRecordApi } from '../../shift-coordination/infrastructure/api/shift-record-api';
import { ShiftRecord } from '../../shift-coordination/domain/model/shift-record.entity';
import { ClinicalRiskApi } from '../../clinical-risk-assessment/infrastructure/api/clinical-risk-api';
import { RiskAssessment, RiskLevel } from '../../clinical-risk-assessment/domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../clinical-risk-assessment/domain/model/clinical-alert.entity';
import { VitalSignAnomalyApi } from '../../clinical-risk-assessment/infrastructure/api/vital-sign-anomaly-api';
import { VitalSignAnomaly } from '../../clinical-risk-assessment/domain/model/vital-sign-anomaly.entity';
import { PreventiveActionApi } from '../../staff-recovery/infrastructure/api/preventive-action-api';
import { PreventiveAction } from '../../staff-recovery/domain/model/preventive-action.entity';
import { AuditLogApi } from '../infrastructure/api/audit-log-api';
import {
    AuditLog,
    AuditLogSeverity,
    AuditLogType
} from '../domain/model/audit-log.entity';

export type AuditTypeFilter = 'ALL' | AuditLogType;
export type AuditSeverityFilter = 'ALL' | AuditLogSeverity;

export interface StaffReportItem {
    doctor: User;
    teamName: string;
    risk: RiskAssessment | null;
    activeAlerts: number;
    openAnomalies: number;
    preventiveActions: number;
    completedShifts: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuditComplianceStore {
    private authenticationStore = inject(AuthenticationStore);
    private auditLogApi = inject(AuditLogApi);
    private userApi = inject(UserApi);
    private careTeamApi = inject(CareTeamApi);
    private shiftRecordApi = inject(ShiftRecordApi);
    private clinicalRiskApi = inject(ClinicalRiskApi);
    private anomalyApi = inject(VitalSignAnomalyApi);
    private preventiveActionApi = inject(PreventiveActionApi);

    readonly auditLogs = signal<AuditLog[]>([]);
    readonly users = signal<User[]>([]);
    readonly teams = signal<CareTeam[]>([]);
    readonly members = signal<TeamMember[]>([]);
    readonly shifts = signal<ShiftRecord[]>([]);
    readonly risks = signal<RiskAssessment[]>([]);
    readonly alerts = signal<ClinicalAlert[]>([]);
    readonly anomalies = signal<VitalSignAnomaly[]>([]);
    readonly actions = signal<PreventiveAction[]>([]);

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);

    readonly searchTerm = signal('');
    readonly typeFilter = signal<AuditTypeFilter>('ALL');
    readonly severityFilter = signal<AuditSeverityFilter>('ALL');

    readonly auditTypes: AuditLogType[] = [
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

    readonly filteredAuditLogs = computed(() => {
        const search = this.searchTerm().toLowerCase().trim();
        const type = this.typeFilter();
        const severity = this.severityFilter();

        return this.auditLogs().filter(log => {
            const actorName = this.getActorName(log.actorUserId).toLowerCase();

            const matchesSearch =
                search.length === 0 ||
                log.description.toLowerCase().includes(search) ||
                log.type.toLowerCase().includes(search) ||
                log.resourceType.toLowerCase().includes(search) ||
                actorName.includes(search);

            const matchesType = type === 'ALL' || log.type === type;
            const matchesSeverity = severity === 'ALL' || log.severity === severity;

            return matchesSearch && matchesType && matchesSeverity;
        });
    });

    readonly totalLogs = computed(() => this.auditLogs().length);

    readonly warningLogs = computed(() =>
        this.auditLogs().filter(log => log.severity === 'WARNING').length
    );

    readonly criticalLogs = computed(() =>
        this.auditLogs().filter(log => log.severity === 'CRITICAL').length
    );

    readonly userManagementLogs = computed(() =>
        this.auditLogs().filter(log =>
            log.type === 'USER_INVITED' ||
            log.type === 'USER_REGISTERED' ||
            log.type === 'USER_ROLE_CHANGED' ||
            log.type === 'USER_STATUS_CHANGED'
        ).length
    );

    readonly activeDoctors = computed(() =>
        this.users().filter(user =>
            user.role === 'DOCTOR' &&
            user.status === 'ACTIVE'
        )
    );

    readonly activeSupervisors = computed(() =>
        this.users().filter(user =>
            user.role === 'SUPERVISOR' &&
            user.status === 'ACTIVE'
        )
    );

    readonly activeTeams = computed(() =>
        this.teams().filter(team => team.status === 'ACTIVE')
    );

    readonly activeAlerts = computed(() =>
        this.alerts().filter(alert => alert.status === 'ACTIVE')
    );

    readonly resolvedAlerts = computed(() =>
        this.alerts().filter(alert => alert.status === 'RESOLVED')
    );

    readonly openAnomalies = computed(() =>
        this.anomalies().filter(anomaly => anomaly.status === 'OPEN')
    );

    readonly completedPreventiveActions = computed(() =>
        this.actions().filter(action => action.status === 'COMPLETED')
    );

    readonly highRiskStaff = computed(() =>
        this.risks().filter(risk =>
            risk.riskLevel === 'HIGH' ||
            risk.riskLevel === 'CRITICAL'
        )
    );

    readonly averageFatigue = computed(() => {
        const risks = this.risks().filter(risk => {
            const user = this.getUserById(risk.userId);

            return user?.role === 'DOCTOR' &&
                user.status === 'ACTIVE';
        });

        if (risks.length === 0) return 0;

        const total = risks.reduce((sum, risk) => sum + risk.fatigueLevel, 0);

        return Math.round(total / risks.length);
    });

    readonly completedShifts = computed(() =>
        this.shifts().filter(shift => shift.status === 'COMPLETED')
    );

    readonly totalCompletedHours = computed(() =>
        this.completedShifts().reduce((total, shift) => {
            const start = new Date(shift.checkInAt ?? shift.scheduledStart).getTime();
            const end = new Date(shift.checkOutAt ?? shift.scheduledEnd).getTime();

            return total + Math.max(end - start, 0) / 1000 / 60 / 60;
        }, 0)
    );

    readonly staffReport = computed<StaffReportItem[]>(() =>
        this.activeDoctors()
            .map(doctor => ({
                doctor,
                teamName: this.getTeamNameByDoctorId(doctor.id),
                risk: this.getRiskByUserId(doctor.id),
                activeAlerts: this.getActiveAlertCountByUserId(doctor.id),
                openAnomalies: this.getOpenAnomalyCountByUserId(doctor.id),
                preventiveActions: this.getPreventiveActionCountByUserId(doctor.id),
                completedShifts: this.getCompletedShiftCountByUserId(doctor.id)
            }))
            .sort((a, b) => {
                const aRisk = a.risk ? this.getRiskPriority(a.risk.riskLevel) : 0;
                const bRisk = b.risk ? this.getRiskPriority(b.risk.riskLevel) : 0;

                if (bRisk !== aRisk) return bRisk - aRisk;

                return (b.risk?.fatigueLevel ?? 0) - (a.risk?.fatigueLevel ?? 0);
            })
    );

    loadAuditLogs(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorMessage.set('audit.logs.error.no-session');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        forkJoin({
            auditLogs: this.auditLogApi.getAuditLogsByOrganizationId(currentUser.organizationId),
            users: this.userApi.getUsersByOrganizationId(currentUser.organizationId)
        }).subscribe({
            next: ({ auditLogs, users }) => {
                this.auditLogs.set(auditLogs);
                this.users.set(users);
                this.loading.set(false);
            },
            error: () => {
                this.errorMessage.set('audit.logs.error.load-failed');
                this.loading.set(false);
            }
        });
    }

    loadReports(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorMessage.set('audit.reports.error.no-session');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        forkJoin({
            users: this.userApi.getUsersByOrganizationId(currentUser.organizationId),
            teams: this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId),
            members: this.careTeamApi.getTeamMembers(),
            shifts: this.shiftRecordApi.getShiftRecordsByOrganizationId(currentUser.organizationId),
            risks: this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(currentUser.organizationId),
            alerts: this.clinicalRiskApi.getClinicalAlertsByOrganizationId(currentUser.organizationId),
            anomalies: this.anomalyApi.getAnomaliesByOrganizationId(currentUser.organizationId),
            actions: this.preventiveActionApi.getPreventiveActionsByOrganizationId(currentUser.organizationId)
        }).subscribe({
            next: ({ users, teams, members, shifts, risks, alerts, anomalies, actions }) => {
                this.users.set(users);
                this.teams.set(teams);
                this.members.set(members);
                this.shifts.set(shifts);
                this.risks.set(risks);
                this.alerts.set(alerts);
                this.anomalies.set(anomalies);
                this.actions.set(actions);
                this.loading.set(false);
            },
            error: () => {
                this.errorMessage.set('audit.reports.error.load-failed');
                this.loading.set(false);
            }
        });
    }

    updateSearchTerm(value: string): void {
        this.searchTerm.set(value);
    }

    updateTypeFilter(value: AuditTypeFilter): void {
        this.typeFilter.set(value);
    }

    updateSeverityFilter(value: AuditSeverityFilter): void {
        this.severityFilter.set(value);
    }

    getActorName(actorUserId: number | null): string {
        if (!actorUserId) return 'Sistema';

        return this.users().find(user => user.id === actorUserId)?.fullName ?? 'Sistema';
    }

    getAuditTypeLabel(type: AuditLogType): string {
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

    getSeverityLabel(severity: AuditLogSeverity): string {
        const labels: Record<AuditLogSeverity, string> = {
            INFO: 'audit.logs.severity.info',
            WARNING: 'audit.logs.severity.warning',
            CRITICAL: 'audit.logs.severity.critical'
        };

        return labels[severity];
    }

    getSeverityClass(severity: AuditLogSeverity): string {
        return severity.toLowerCase();
    }

    getUserById(userId: number): User | undefined {
        return this.users().find(user => user.id === userId);
    }

    getSupervisorName(supervisorId: number | null): string {
        if (!supervisorId) return '—';

        return this.getUserById(supervisorId)?.fullName ?? '—';
    }

    getTeamMemberCount(teamId: number): number {
        return this.members().filter(member => {
            const user = this.getUserById(member.userId);

            return member.teamId === teamId &&
                user?.role === 'DOCTOR' &&
                user.status === 'ACTIVE';
        }).length;
    }

    getRiskLabel(riskLevel: RiskLevel): string {
        const labels: Record<RiskLevel, string> = {
            LOW: 'clinical.risk.low',
            MODERATE: 'clinical.risk.moderate',
            HIGH: 'clinical.risk.high',
            CRITICAL: 'clinical.risk.critical'
        };

        return labels[riskLevel];
    }

    getRiskClass(riskLevel: RiskLevel): string {
        return riskLevel.toLowerCase();
    }

    formatHours(value: number): string {
        return `${Math.round(value)}h`;
    }

    private getRiskByUserId(userId: number): RiskAssessment | null {
        return this.risks().find(risk => risk.userId === userId) ?? null;
    }

    private getTeamNameByDoctorId(userId: number): string {
        const membership = this.members().find(member => member.userId === userId);

        if (!membership) return '—';

        return this.teams().find(team => team.id === membership.teamId)?.name ?? '—';
    }

    private getActiveAlertCountByUserId(userId: number): number {
        return this.alerts().filter(alert =>
            alert.userId === userId &&
            alert.status === 'ACTIVE'
        ).length;
    }

    private getOpenAnomalyCountByUserId(userId: number): number {
        return this.anomalies().filter(anomaly =>
            anomaly.userId === userId &&
            anomaly.status === 'OPEN'
        ).length;
    }

    private getPreventiveActionCountByUserId(userId: number): number {
        return this.actions().filter(action =>
            action.userId === userId
        ).length;
    }

    private getCompletedShiftCountByUserId(userId: number): number {
        return this.shifts().filter(shift =>
            shift.userId === userId &&
            shift.status === 'COMPLETED'
        ).length;
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
}