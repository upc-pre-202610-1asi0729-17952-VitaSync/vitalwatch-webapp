import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VitalSignAnomaly,
  VitalSignAnomalyStatus,
  VitalSignAnomalyType
} from '../domain/model/vital-sign-anomaly.entity';
import { RiskLevel } from '../domain/model/risk-assessment.entity';
import { UpdateVitalSignAnomalyStatusRequest } from './update-vital-sign-anomaly-status-request';

interface VitalSignAnomalyResource {
  id: number;
  organizationId: number;
  userId: number;
  type: VitalSignAnomalyType;
  severity: RiskLevel;
  status: VitalSignAnomalyStatus;
  value: number;
  threshold: number;
  message: string;
  detectedAt: string;
  reviewedAt: string | null;
  reviewedBy: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class VitalSignAnomalyApi {
  private http = inject(HttpClient);
  private anomaliesUrl = `${environment.platformProviderApiBaseUrl}${environment.vitalSignAnomaliesEndpointPath}`;

  getAnomaliesByOrganizationId(organizationId: number): Observable<VitalSignAnomaly[]> {
    return this.http
      .get<VitalSignAnomalyResource[]>(`${this.anomaliesUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.map(resource => this.toAnomaly(resource)))
      );
  }

  updateAnomalyStatus(
    anomalyId: number,
    request: UpdateVitalSignAnomalyStatusRequest
  ): Observable<VitalSignAnomaly> {
    return this.http
      .patch<VitalSignAnomalyResource>(`${this.anomaliesUrl}/${anomalyId}`, request)
      .pipe(
        map(resource => this.toAnomaly(resource))
      );
  }

  private toAnomaly(resource: VitalSignAnomalyResource): VitalSignAnomaly {
    return new VitalSignAnomaly({
      id: resource.id,
      organizationId: resource.organizationId,
      userId: resource.userId,
      type: resource.type,
      severity: resource.severity,
      status: resource.status,
      value: resource.value,
      threshold: resource.threshold,
      message: resource.message,
      detectedAt: resource.detectedAt,
      reviewedAt: resource.reviewedAt,
      reviewedBy: resource.reviewedBy
    });
  }
}