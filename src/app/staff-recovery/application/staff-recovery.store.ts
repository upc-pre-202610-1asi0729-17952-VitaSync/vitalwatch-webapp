import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { UserApi } from '../../iam/infrastructure/api/user-api';
import { User } from '../../iam/domain/model/user.entity';
import { ClinicalRiskApi } from '../../clinical-risk-assessment/infrastructure/api/clinical-risk-api';
import { RiskAssessment, RiskLevel } from '../../clinical-risk-assessment/domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../clinical-risk-assessment/domain/model/clinical-alert.entity';
import { CareTeamApi } from '../../shift-coordination/infrastructure/api/care-team-api';
import { CareTeam } from '../../shift-coordination/domain/model/care-team.entity';
import { TeamMember } from '../../shift-coordination/domain/model/team-member.entity';
import { ShiftRecordApi } from '../../shift-coordination/infrastructure/api/shift-record-api';
import { ShiftRecord } from '../../shift-coordination/domain/model/shift-record.entity';
import { PreventiveActionApi } from '../infrastructure/api/preventive-action-api';
import {
    PreventiveAction,
    PreventiveActionStatus,
    PreventiveActionType
} from '../domain/model/preventive-action.entity';

export type StaffRecoveryStatusFilter = 'ALL' | PreventiveActionStatus;

@Injectable({
    providedIn: 'root'
})
export class StaffRecoveryStore {
    private authenticationStore = inject(AuthenticationStore);
    private userApi = inject(UserApi);
    private clinicalRiskApi = inject(ClinicalRiskApi);
    private careTeamApi = inject(CareTeamApi);
    private shiftRecordApi = inject(ShiftRecordApi);
    private preventiveActionApi = inject(PreventiveActionApi);

    readonly risks = signal<RiskAssessment[]>([]);
    readonly alerts = signal<ClinicalAlert[]>([]);
    readonly actions = signal<PreventiveAction[]>([]);
    readonly shifts = signal<ShiftRecord[]>([]);
    readonly teams = signal<CareTeam[]>([]);
    readonly members = signal<TeamMember[]>([]);
    readonly users = signal<User[]>([]);

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly searchTerm = signal('');
    readonly statusFilter = signal<StaffRecoveryStatusFilter>('ALL');

    readonly actionTypes: PreventiveActionType[] = [
        'RECOVERY_BREAK',
        'SHIFT_ADJUSTMENT',
        'SUPERVISOR_CHECK_IN',
        'MEDICAL_EVALUATION'
    ];

    readonly doctor = computed(() => this.authenticationStore.currentUser());

    readonly currentRisk = computed<RiskAssessment | null>(() => {
        const doctor = this.doctor();

        if (!doctor) return null;

        return this.risks().find(risk => risk.userId === doctor.id) ?? null;
    });

    readonly personalActions = computed(() => {
        const doctor = this.doctor();

        if (!doctor) return [];

        return this.actions()
            .filter(action => action.userId === doctor.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    readonly personalPendingActions = computed(() =>
        this.personalActions().filter(action => action.status === 'PENDING')
    );

    readonly personalCompletedActions = computed(() =>
        this.personalActions().filter(action => action.status === 'COMPLETED')
    );

    readonly activeAlerts = computed(() => {
        const doctor = this.doctor();

        if (!doctor) return [];

        return this.alerts().filter(alert =>
            alert.userId === doctor.id &&
            alert.status === 'ACTIVE'
        );
    });

    readonly completedShifts = computed(() =>
        this.shifts().filter(shift => shift.status === 'COMPLETED')
    );

    readonly recoveryScore = computed(() => {
        const fatigue = this.currentRisk()?.fatigueLevel ?? 0;

        return Math.max(100 - fatigue, 0);
    });

    readonly recoveryStatusClass = computed(() => {
        const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

        return riskLevel.toLowerCase();
    });

    readonly recoveryStatusLabel = computed(() => {
        const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

        const labels: Record<RiskLevel, string> = {
            LOW: 'staffRecovery.doctor.status.low',
            MODERATE: 'staffRecovery.doctor.status.moderate',
            HIGH: 'staffRecovery.doctor.status.high',
            CRITICAL: 'staffRecovery.doctor.status.critical'
        };

        return labels[riskLevel];
    });

    readonly recoveryMessage = computed(() => {
        const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

        const messages: Record<RiskLevel, string> = {
            LOW: 'staffRecovery.doctor.message.low',
            MODERATE: 'staffRecovery.doctor.message.moderate',
            HIGH: 'staffRecovery.doctor.message.high',
            CRITICAL: 'staffRecovery.doctor.message.critical'
        };

        return messages[riskLevel];
    });

    readonly recommendations = computed(() => {
        const riskLevel = this.currentRisk()?.riskLevel ?? 'LOW';

        const recommendations: Record<RiskLevel, string[]> = {
            LOW: [
                'staffRecovery.doctor.recommendations.hydration',
                'staffRecovery.doctor.recommendations.monitoring'
            ],
            MODERATE: [
                'staffRecovery.doctor.recommendations.short-break',
                'staffRecovery.doctor.recommendations.breathing'
            ],
            HIGH: [
                'staffRecovery.doctor.recommendations.recovery-break',
                'staffRecovery.doctor.recommendations.notify-supervisor'
            ],
            CRITICAL: [
                'staffRecovery.doctor.recommendations.stop-critical-work',
                'staffRecovery.doctor.recommendations.request-support'
            ]
        };

        return recommendations[riskLevel];
    });

    readonly assignedTeamIds = computed(() =>
        this.teams().map(team => team.id)
    );

    readonly assignedMemberIds = computed(() =>
        this.members()
            .filter(member => this.assignedTeamIds().includes(member.teamId))
            .map(member => member.userId)
    );

    readonly assignedDoctors = computed(() =>
        this.users().filter(user =>
            this.assignedMemberIds().includes(user.id) &&
            user.role === 'DOCTOR' &&
            user.status === 'ACTIVE'
        )
    );

    readonly assignedActions = computed(() =>
        this.actions().filter(action =>
            this.assignedMemberIds().includes(action.userId)
        )
    );

    readonly filteredActions = computed(() => {
        const search = this.searchTerm().toLowerCase().trim();
        const status = this.statusFilter();

        return this.assignedActions().filter(action => {
            const user = this.getUserById(action.userId);

            const matchesSearch =
                search.length === 0 ||
                action.notes.toLowerCase().includes(search) ||
                this.getActionTypeLabel(action.type).toLowerCase().includes(search) ||
                (user?.fullName.toLowerCase().includes(search) ?? false) ||
                (user?.email.toLowerCase().includes(search) ?? false);

            const matchesStatus = status === 'ALL' || action.status === status;

            return matchesSearch && matchesStatus;
        });
    });

    readonly assignedPendingActionsCount = computed(() =>
        this.assignedActions().filter(action => action.status === 'PENDING').length
    );

    readonly assignedCompletedActionsCount = computed(() =>
        this.assignedActions().filter(action => action.status === 'COMPLETED').length
    );

    readonly assignedCancelledActionsCount = computed(() =>
        this.assignedActions().filter(action => action.status === 'CANCELLED').length
    );

    loadDoctorRecoveryData(): void {
        const doctor = this.authenticationStore.currentUser();

        if (!doctor) {
            this.errorMessage.set('staffRecovery.doctor.error.no-session');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        forkJoin({
            risks: this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(doctor.organizationId),
            alerts: this.clinicalRiskApi.getClinicalAlertsByOrganizationId(doctor.organizationId),
            actions: this.preventiveActionApi.getPreventiveActionsByOrganizationId(doctor.organizationId),
            shifts: this.shiftRecordApi.getShiftRecordsByUserId(doctor.organizationId, doctor.id)
        }).subscribe({
            next: ({ risks, alerts, actions, shifts }) => {
                this.risks.set(risks);
                this.alerts.set(alerts);
                this.actions.set(actions);
                this.shifts.set(shifts);
                this.loading.set(false);
            },
            error: () => {
                this.errorMessage.set('staffRecovery.doctor.error.load-failed');
                this.loading.set(false);
            }
        });
    }

    loadSupervisorPreventiveActions(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorMessage.set('staffRecovery.actions.error.no-session');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        forkJoin({
            teams: this.careTeamApi.getCareTeamsByOrganizationId(currentUser.organizationId),
            members: this.careTeamApi.getTeamMembers(),
            users: this.userApi.getUsersByOrganizationId(currentUser.organizationId),
            actions: this.preventiveActionApi.getPreventiveActionsByOrganizationId(currentUser.organizationId)
        }).subscribe({
            next: ({ teams, members, users, actions }) => {
                this.teams.set(
                    teams.filter(team =>
                        team.supervisorId === currentUser.id &&
                        team.status === 'ACTIVE'
                    )
                );
                this.members.set(members);
                this.users.set(users);
                this.actions.set([...actions].reverse());
                this.loading.set(false);
            },
            error: () => {
                this.errorMessage.set('staffRecovery.actions.error.load-failed');
                this.loading.set(false);
            }
        });
    }

    createPreventiveAction(
        payload: {
            userId: number;
            type: PreventiveActionType;
            notes: string;
        },
        onSuccess?: () => void
    ): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorMessage.set('staffRecovery.actions.error.no-session');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        this.preventiveActionApi.createPreventiveAction({
            organizationId: currentUser.organizationId,
            supervisorId: currentUser.id,
            userId: payload.userId,
            type: payload.type,
            notes: payload.notes
        }).subscribe({
            next: action => {
                this.actions.update(actions => [action, ...actions]);
                this.loading.set(false);
                onSuccess?.();
            },
            error: () => {
                this.errorMessage.set('staffRecovery.actions.error.create-failed');
                this.loading.set(false);
            }
        });
    }

    completeDoctorAction(action: PreventiveAction): void {
        this.updateActionStatus(
            action,
            'COMPLETED',
            'staffRecovery.doctor.error.update-failed'
        );
    }

    completeAssignedAction(action: PreventiveAction): void {
        this.updateActionStatus(
            action,
            'COMPLETED',
            'staffRecovery.actions.error.update-failed'
        );
    }

    cancelAssignedAction(action: PreventiveAction): void {
        this.updateActionStatus(
            action,
            'CANCELLED',
            'staffRecovery.actions.error.update-failed'
        );
    }

    updateSearchTerm(value: string): void {
        this.searchTerm.set(value);
    }

    updateStatusFilter(value: StaffRecoveryStatusFilter): void {
        this.statusFilter.set(value);
    }

    getUserById(userId: number): User | undefined {
        return this.users().find(user => user.id === userId);
    }

    getActionTypeLabel(type: PreventiveActionType): string {
        const labels: Record<PreventiveActionType, string> = {
            RECOVERY_BREAK: 'staffRecovery.actions.types.recovery-break',
            SHIFT_ADJUSTMENT: 'staffRecovery.actions.types.shift-adjustment',
            SUPERVISOR_CHECK_IN: 'staffRecovery.actions.types.supervisor-check-in',
            MEDICAL_EVALUATION: 'staffRecovery.actions.types.medical-evaluation'
        };

        return labels[type];
    }

    getStatusLabel(status: PreventiveActionStatus): string {
        const labels: Record<PreventiveActionStatus, string> = {
            PENDING: 'staffRecovery.actions.status.pending',
            COMPLETED: 'staffRecovery.actions.status.completed',
            CANCELLED: 'staffRecovery.actions.status.cancelled'
        };

        return labels[status];
    }

    getActionStatusClass(status: PreventiveActionStatus): string {
        return status.toLowerCase();
    }

    private updateActionStatus(
        action: PreventiveAction,
        status: PreventiveActionStatus,
        errorMessageKey: string
    ): void {
        if (!action.isPending) return;

        this.preventiveActionApi.updatePreventiveActionStatus(action.id, {
            status,
            completedAt: status === 'COMPLETED' ? new Date().toISOString() : null
        }).subscribe({
            next: updatedAction => {
                this.actions.update(actions =>
                    actions.map(item => item.id === updatedAction.id ? updatedAction : item)
                );
                this.errorMessage.set(null);
            },
            error: () => {
                this.errorMessage.set(errorMessageKey);
            }
        });
    }
}