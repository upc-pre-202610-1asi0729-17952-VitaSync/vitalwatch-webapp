import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RiskAssessment } from '../../domain/model/risk-assessment.entity';
import { ClinicalAlert } from '../../domain/model/clinical-alert.entity';
import { UpdateClinicalAlertStatusRequest } from '../request/update-clinical-alert-status-request';
import { RiskAssessmentResponse } from '../responses/risk-assessment-response';
import { ClinicalAlertResponse } from '../responses/clinical-alert-response';
import { RiskAssessmentAssembler } from '../assemblers/risk-assessment-assembler';
import { ClinicalAlertAssembler } from '../assemblers/clinical-alert-assembler';

@Injectable({
  providedIn: 'root'
})
export class ClinicalRiskApi {
  private http = inject(HttpClient);

  private riskAssessmentsUrl = `${environment.platformProviderApiBaseUrl}${environment.riskAssessmentsEndpointPath}`;
  private clinicalAlertsUrl = `${environment.platformProviderApiBaseUrl}${environment.clinicalAlertsEndpointPath}`;

  getRiskAssessmentsByOrganizationId(organizationId: number): Observable<RiskAssessment[]> {
    return this.http
      .get<RiskAssessmentResponse[]>(
        `${this.riskAssessmentsUrl}?organizationId=${organizationId}`
      )
      .pipe(
        map(responses => RiskAssessmentAssembler.toEntities(responses))
      );
  }

  getRiskAssessmentByUserId(
    organizationId: number,
    userId: number
  ): Observable<RiskAssessment | null> {
    return this.http
      .get<RiskAssessmentResponse[]>(
        `${this.riskAssessmentsUrl}?organizationId=${organizationId}&userId=${userId}`
      )
      .pipe(
        map(responses =>
          responses.length > 0
            ? RiskAssessmentAssembler.toEntity(responses[0])
            : null
        )
      );
  }

  getClinicalAlertsByOrganizationId(organizationId: number): Observable<ClinicalAlert[]> {
    return this.http
      .get<ClinicalAlertResponse[]>(
        `${this.clinicalAlertsUrl}?organizationId=${organizationId}`
      )
      .pipe(
        map(responses => ClinicalAlertAssembler.toEntities(responses))
      );
  }

  getClinicalAlertsByUserId(
    organizationId: number,
    userId: number
  ): Observable<ClinicalAlert[]> {
    return this.http
      .get<ClinicalAlertResponse[]>(
        `${this.clinicalAlertsUrl}?organizationId=${organizationId}&userId=${userId}`
      )
      .pipe(
        map(responses => ClinicalAlertAssembler.toEntities(responses))
      );
  }

  updateClinicalAlertStatus(
    alertId: number,
    request: UpdateClinicalAlertStatusRequest
  ): Observable<ClinicalAlert> {
    return this.http
      .patch<ClinicalAlertResponse>(`${this.clinicalAlertsUrl}/${alertId}`, request)
      .pipe(
        map(response => ClinicalAlertAssembler.toEntity(response))
      );
  }
}