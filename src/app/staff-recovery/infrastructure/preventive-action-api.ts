import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PreventiveAction,
  PreventiveActionStatus,
  PreventiveActionType
} from '../domain/model/preventive-action.entity';
import { CreatePreventiveActionRequest } from './create-preventive-action-request';
import { UpdatePreventiveActionStatusRequest } from './update-preventive-action-status-request';

interface PreventiveActionResource {
  id: number;
  organizationId: number;
  supervisorId: number;
  userId: number;
  type: PreventiveActionType;
  status: PreventiveActionStatus;
  notes: string;
  createdAt: string;
  completedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PreventiveActionApi {
  private http = inject(HttpClient);
  private preventiveActionsUrl = `${environment.platformProviderApiBaseUrl}${environment.preventiveActionsEndpointPath}`;

  getPreventiveActionsByOrganizationId(organizationId: number): Observable<PreventiveAction[]> {
    return this.http
      .get<PreventiveActionResource[]>(`${this.preventiveActionsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.map(resource => this.toPreventiveAction(resource)))
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
      .post<PreventiveActionResource>(this.preventiveActionsUrl, payload)
      .pipe(
        map(resource => this.toPreventiveAction(resource))
      );
  }

  updatePreventiveActionStatus(
    actionId: number,
    request: UpdatePreventiveActionStatusRequest
  ): Observable<PreventiveAction> {
    return this.http
      .patch<PreventiveActionResource>(`${this.preventiveActionsUrl}/${actionId}`, request)
      .pipe(
        map(resource => this.toPreventiveAction(resource))
      );
  }

  private toPreventiveAction(resource: PreventiveActionResource): PreventiveAction {
    return new PreventiveAction({
      id: resource.id,
      organizationId: resource.organizationId,
      supervisorId: resource.supervisorId,
      userId: resource.userId,
      type: resource.type,
      status: resource.status,
      notes: resource.notes,
      createdAt: resource.createdAt,
      completedAt: resource.completedAt
    });
  }
}