import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditLog,
  AuditLogSeverity,
  AuditLogType
} from '../domain/model/audit-log.entity';

interface AuditLogResource {
  id: number;
  organizationId: number;
  actorUserId: number | null;
  type: AuditLogType;
  severity: AuditLogSeverity;
  resourceType: string;
  resourceId: number | null;
  description: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogApi {
  private http = inject(HttpClient);
  private auditLogsUrl = `${environment.platformProviderApiBaseUrl}${environment.auditLogsEndpointPath}`;

  getAuditLogsByOrganizationId(organizationId: number): Observable<AuditLog[]> {
    return this.http
      .get<AuditLogResource[]>(
        `${this.auditLogsUrl}?organizationId=${organizationId}&_sort=createdAt&_order=desc`
      )
      .pipe(
        map(resources => resources.map(resource => this.toAuditLog(resource)))
      );
  }

  private toAuditLog(resource: AuditLogResource): AuditLog {
    return new AuditLog({
      id: resource.id,
      organizationId: resource.organizationId,
      actorUserId: resource.actorUserId,
      type: resource.type,
      severity: resource.severity,
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      description: resource.description,
      createdAt: resource.createdAt
    });
  }
}