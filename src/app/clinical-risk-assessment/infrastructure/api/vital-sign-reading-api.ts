import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VitalSignReading } from '../../domain/model/vital-sign-reading.entity';
import { VitalSignReadingResponse } from '../responses/vital-sign-reading-response';
import { VitalSignReadingAssembler } from '../assemblers/vital-sign-reading-assembler';

@Injectable({
  providedIn: 'root'
})
export class VitalSignReadingApi {
  private http = inject(HttpClient);

  private vitalSignReadingsUrl = `${environment.platformProviderApiBaseUrl}${environment.vitalSignReadingsEndpointPath}`;

  getReadingsByUserId(
    organizationId: number,
    userId: number
  ): Observable<VitalSignReading[]> {
    return this.http
      .get<VitalSignReadingResponse[]>(
        `${this.vitalSignReadingsUrl}?organizationId=${organizationId}&userId=${userId}&_sort=recordedAt&_order=desc`
      )
      .pipe(
        map(responses => VitalSignReadingAssembler.toEntities(responses))
      );
  }

  getReadingsByOrganizationId(organizationId: number): Observable<VitalSignReading[]> {
    return this.http
      .get<VitalSignReadingResponse[]>(
        `${this.vitalSignReadingsUrl}?organizationId=${organizationId}&_sort=recordedAt&_order=desc`
      )
      .pipe(
        map(responses => VitalSignReadingAssembler.toEntities(responses))
      );
  }
}