import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuditLog } from '../../domain/model/audit-log.entity';
import { AuditLogResponse } from '../responses/audit-log-response';
import { AuditLogAssembler } from '../assemblers/audit-log-assembler';

@Injectable({
  providedIn: 'root'
})
export class AuditLogApi {
  private http = inject(HttpClient);

  private auditLogsUrl = `${environment.platformProviderApiBaseUrl}${environment.auditLogsEndpointPath}`;

  getAuditLogsByOrganizationId(organizationId: number): Observable<AuditLog[]> {
    return this.http
      .get<AuditLogResponse[]>(
        `${this.auditLogsUrl}?organizationId=${organizationId}&_sort=createdAt&_order=desc`
      )
      .pipe(
        map(responses => AuditLogAssembler.toEntities(responses))
      );
  }
}