import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VitalSignAnomaly } from '../../domain/model/vital-sign-anomaly.entity';
import { UpdateVitalSignAnomalyStatusRequest } from '../request/update-vital-sign-anomaly-status-request';
import { VitalSignAnomalyResponse } from '../responses/vital-sign-anomaly-response';
import { VitalSignAnomalyAssembler } from '../assemblers/vital-sign-anomaly-assembler';

@Injectable({
  providedIn: 'root'
})
export class VitalSignAnomalyApi {
  private http = inject(HttpClient);

  private vitalSignAnomaliesUrl = `${environment.platformProviderApiBaseUrl}${environment.vitalSignAnomaliesEndpointPath}`;

  getAnomaliesByOrganizationId(organizationId: number): Observable<VitalSignAnomaly[]> {
    return this.http
      .get<VitalSignAnomalyResponse[]>(
        `${this.vitalSignAnomaliesUrl}?organizationId=${organizationId}&_sort=detectedAt&_order=desc`
      )
      .pipe(
        map(responses => VitalSignAnomalyAssembler.toEntities(responses))
      );
  }

  getAnomaliesByUserId(
    organizationId: number,
    userId: number
  ): Observable<VitalSignAnomaly[]> {
    return this.http
      .get<VitalSignAnomalyResponse[]>(
        `${this.vitalSignAnomaliesUrl}?organizationId=${organizationId}&userId=${userId}&_sort=detectedAt&_order=desc`
      )
      .pipe(
        map(responses => VitalSignAnomalyAssembler.toEntities(responses))
      );
  }

  updateAnomalyStatus(
    anomalyId: number,
    request: UpdateVitalSignAnomalyStatusRequest
  ): Observable<VitalSignAnomaly> {
    return this.http
      .patch<VitalSignAnomalyResponse>(
        `${this.vitalSignAnomaliesUrl}/${anomalyId}`,
        request
      )
      .pipe(
        map(response => VitalSignAnomalyAssembler.toEntity(response))
      );
  }
}