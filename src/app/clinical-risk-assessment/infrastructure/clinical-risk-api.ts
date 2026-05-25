import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RiskAssessment, RiskLevel } from '../domain/model/risk-assessment.entity';
import { ClinicalAlert, ClinicalAlertStatus } from '../domain/model/clinical-alert.entity';

interface RiskAssessmentResource {
  id: number;
  organizationId: number;
  userId: number;
  fatigueLevel: number;
  riskLevel: RiskLevel;
  heartRate: number;
  hrv: number;
  lastUpdatedAt: string;
}

interface ClinicalAlertResource {
  id: number;
  organizationId: number;
  userId: number;
  severity: RiskLevel;
  status: ClinicalAlertStatus;
  message: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClinicalRiskApi {
  private http = inject(HttpClient);

  private riskAssessmentsUrl = `${environment.platformProviderApiBaseUrl}${environment.riskAssessmentsEndpointPath}`;
  private clinicalAlertsUrl = `${environment.platformProviderApiBaseUrl}${environment.clinicalAlertsEndpointPath}`;

  getRiskAssessmentsByOrganizationId(organizationId: number): Observable<RiskAssessment[]> {
    return this.http
      .get<RiskAssessmentResource[]>(`${this.riskAssessmentsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.map(resource => this.toRiskAssessment(resource)))
      );
  }

  getClinicalAlertsByOrganizationId(organizationId: number): Observable<ClinicalAlert[]> {
    return this.http
      .get<ClinicalAlertResource[]>(`${this.clinicalAlertsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.map(resource => this.toClinicalAlert(resource)))
      );
  }

  private toRiskAssessment(resource: RiskAssessmentResource): RiskAssessment {
    return new RiskAssessment({
      id: resource.id,
      organizationId: resource.organizationId,
      userId: resource.userId,
      fatigueLevel: resource.fatigueLevel,
      riskLevel: resource.riskLevel,
      heartRate: resource.heartRate,
      hrv: resource.hrv,
      lastUpdatedAt: resource.lastUpdatedAt
    });
  }

  private toClinicalAlert(resource: ClinicalAlertResource): ClinicalAlert {
    return new ClinicalAlert({
      id: resource.id,
      organizationId: resource.organizationId,
      userId: resource.userId,
      severity: resource.severity,
      status: resource.status,
      message: resource.message,
      createdAt: resource.createdAt
    });
  }
}