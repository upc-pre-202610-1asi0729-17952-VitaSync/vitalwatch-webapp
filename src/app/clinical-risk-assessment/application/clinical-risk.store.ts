import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { RiskAssessment } from '../domain/model/risk-assessment.entity';
import { ClinicalAlert, ClinicalAlertStatus } from '../domain/model/clinical-alert.entity';
import {
    VitalSignAnomaly,
    VitalSignAnomalyStatus
} from '../domain/model/vital-sign-anomaly.entity';
import { VitalSignReading } from '../domain/model/vital-sign-reading.entity';
import { ClinicalRiskApi } from '../infrastructure/api/clinical-risk-api';
import { VitalSignReadingApi } from '../infrastructure/api/vital-sign-reading-api';
import { VitalSignAnomalyApi } from '../infrastructure/api/vital-sign-anomaly-api';
import { UpdateClinicalAlertStatusRequest } from '../infrastructure/request/update-clinical-alert-status-request';
import { UpdateVitalSignAnomalyStatusRequest } from '../infrastructure/request/update-vital-sign-anomaly-status-request';

@Injectable({
    providedIn: 'root'
})
export class ClinicalRiskStore {
    private authenticationStore = inject(AuthenticationStore);
    private clinicalRiskApi = inject(ClinicalRiskApi);
    private vitalSignReadingApi = inject(VitalSignReadingApi);
    private vitalSignAnomalyApi = inject(VitalSignAnomalyApi);

    private riskAssessmentsSignal = signal<RiskAssessment[]>([]);
    private clinicalAlertsSignal = signal<ClinicalAlert[]>([]);
    private vitalSignReadingsSignal = signal<VitalSignReading[]>([]);
    private vitalSignAnomaliesSignal = signal<VitalSignAnomaly[]>([]);

    private loadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    riskAssessments = computed(() => this.riskAssessmentsSignal());
    risks = computed(() => this.riskAssessmentsSignal());

    clinicalAlerts = computed(() => this.clinicalAlertsSignal());
    alerts = computed(() => this.clinicalAlertsSignal());

    vitalSignReadings = computed(() => this.vitalSignReadingsSignal());
    readings = computed(() => this.vitalSignReadingsSignal());

    vitalSignAnomalies = computed(() => this.vitalSignAnomaliesSignal());
    anomalies = computed(() => this.vitalSignAnomaliesSignal());

    loading = computed(() => this.loadingSignal());
    error = computed(() => this.errorSignal());

    activeAlerts = computed(() =>
        this.clinicalAlertsSignal().filter(alert => alert.status === 'ACTIVE')
    );

    resolvedAlerts = computed(() =>
        this.clinicalAlertsSignal().filter(alert => alert.status === 'RESOLVED')
    );

    openAnomalies = computed(() =>
        this.vitalSignAnomaliesSignal().filter(anomaly => anomaly.status === 'OPEN')
    );

    reviewedAnomalies = computed(() =>
        this.vitalSignAnomaliesSignal().filter(anomaly => anomaly.status === 'REVIEWED')
    );

    dismissedAnomalies = computed(() =>
        this.vitalSignAnomaliesSignal().filter(anomaly => anomaly.status === 'DISMISSED')
    );

    clearError(): void {
        this.errorSignal.set(null);
    }

    setError(message: string): void {
        this.errorSignal.set(message);
    }

    loadOrganizationClinicalData(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('clinical.common.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        forkJoin({
            risks: this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(currentUser.organizationId),
            alerts: this.clinicalRiskApi.getClinicalAlertsByOrganizationId(currentUser.organizationId),
            anomalies: this.vitalSignAnomalyApi.getAnomaliesByOrganizationId(currentUser.organizationId)
        }).subscribe({
            next: ({ risks, alerts, anomalies }) => {
                this.riskAssessmentsSignal.set(risks);
                this.clinicalAlertsSignal.set(alerts);
                this.vitalSignAnomaliesSignal.set([...anomalies].reverse());
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('clinical.common.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

    loadRiskAndAlerts(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('clinical.common.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        forkJoin({
            risks: this.clinicalRiskApi.getRiskAssessmentsByOrganizationId(currentUser.organizationId),
            alerts: this.clinicalRiskApi.getClinicalAlertsByOrganizationId(currentUser.organizationId)
        }).subscribe({
            next: ({ risks, alerts }) => {
                this.riskAssessmentsSignal.set(risks);
                this.clinicalAlertsSignal.set(alerts);
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('clinical.common.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

    loadVitalSignReadingsForCurrentDoctor(): void {
        const doctor = this.authenticationStore.currentUser();

        if (!doctor) {
            this.errorSignal.set('clinical.vitalSigns.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        this.vitalSignReadingApi.getReadingsByUserId(
            doctor.organizationId,
            doctor.id
        ).subscribe({
            next: readings => {
                this.vitalSignReadingsSignal.set(readings);
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('clinical.vitalSigns.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

    loadAnomalies(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.errorSignal.set('clinical.anomalies.error.no-session');
            return;
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        this.vitalSignAnomalyApi.getAnomaliesByOrganizationId(currentUser.organizationId).subscribe({
            next: anomalies => {
                this.vitalSignAnomaliesSignal.set([...anomalies].reverse());
                this.loadingSignal.set(false);
            },
            error: () => {
                this.errorSignal.set('clinical.anomalies.error.load-failed');
                this.loadingSignal.set(false);
            }
        });
    }

    resolveClinicalAlert(alert: ClinicalAlert): Observable<ClinicalAlert> {
        const currentUser = this.authenticationStore.currentUser();

        const request: UpdateClinicalAlertStatusRequest = {
            status: 'RESOLVED',
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUser?.id
        };

        return this.updateClinicalAlertStatus(alert.id, request);
    }

    updateClinicalAlertStatus(
        alertId: number,
        request: UpdateClinicalAlertStatusRequest
    ): Observable<ClinicalAlert> {
        this.errorSignal.set(null);

        return this.clinicalRiskApi.updateClinicalAlertStatus(alertId, request).pipe(
            tap({
                next: updatedAlert => {
                    this.clinicalAlertsSignal.update(alerts =>
                        alerts.map(alert =>
                            alert.id === updatedAlert.id ? updatedAlert : alert
                        )
                    );
                },
                error: () => {
                    this.errorSignal.set('clinical.alerts.error.resolve-failed');
                }
            })
        );
    }

    updateAnomalyStatus(
        anomaly: VitalSignAnomaly,
        status: VitalSignAnomalyStatus
    ): Observable<VitalSignAnomaly> {
        const currentUser = this.authenticationStore.currentUser();

        const request: UpdateVitalSignAnomalyStatusRequest = {
            status,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUser?.id ?? null
        };

        this.errorSignal.set(null);

        return this.vitalSignAnomalyApi.updateAnomalyStatus(anomaly.id, request).pipe(
            tap({
                next: updatedAnomaly => {
                    this.vitalSignAnomaliesSignal.update(anomalies =>
                        anomalies.map(item =>
                            item.id === updatedAnomaly.id ? updatedAnomaly : item
                        )
                    );
                },
                error: () => {
                    this.errorSignal.set('clinical.anomalies.error.update-failed');
                }
            })
        );
    }

    getRiskByUserId(userId: number): RiskAssessment | undefined {
        return this.riskAssessmentsSignal().find(risk => risk.userId === userId);
    }

    getAlertsByUserId(userId: number): ClinicalAlert[] {
        return this.clinicalAlertsSignal().filter(alert => alert.userId === userId);
    }

    getReadingsByUserId(userId: number): VitalSignReading[] {
        return this.vitalSignReadingsSignal().filter(reading => reading.userId === userId);
    }

    getAnomaliesByUserId(userId: number): VitalSignAnomaly[] {
        return this.vitalSignAnomaliesSignal().filter(anomaly => anomaly.userId === userId);
    }
}