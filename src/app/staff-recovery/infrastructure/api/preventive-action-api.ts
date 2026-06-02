import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PreventiveAction, PreventiveActionStatus } from '../../domain/model/preventive-action.entity';
import { CreatePreventiveActionRequest } from '../request/create-preventive-action-request';
import { UpdatePreventiveActionStatusRequest } from '../request/update-preventive-action-status-request';
import { PreventiveActionResponse } from '../responses/preventive-action-response';
import { PreventiveActionAssembler } from '../assemblers/preventive-action-assembler';

@Injectable({
  providedIn: 'root'
})
export class PreventiveActionApi {
  private http = inject(HttpClient);

  private preventiveActionsUrl = `${environment.platformProviderApiBaseUrl}${environment.preventiveActionsEndpointPath}`;

  getPreventiveActionsByOrganizationId(organizationId: number): Observable<PreventiveAction[]> {
    return this.http
      .get<PreventiveActionResponse[]>(`${this.preventiveActionsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(responses => PreventiveActionAssembler.toEntities(responses))
      );
  }

  createPreventiveAction(request: CreatePreventiveActionRequest): Observable<PreventiveAction> {
    const payload = {
      ...request,
      status: 'PENDING' as PreventiveActionStatus,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    return this.http
      .post<PreventiveActionResponse>(this.preventiveActionsUrl, payload)
      .pipe(
        map(response => PreventiveActionAssembler.toEntity(response))
      );
  }

  updatePreventiveActionStatus(
    actionId: number,
    request: UpdatePreventiveActionStatusRequest
  ): Observable<PreventiveAction> {
    return this.http
      .patch<PreventiveActionResponse>(`${this.preventiveActionsUrl}/${actionId}`, request)
      .pipe(
        map(response => PreventiveActionAssembler.toEntity(response))
      );
  }
}