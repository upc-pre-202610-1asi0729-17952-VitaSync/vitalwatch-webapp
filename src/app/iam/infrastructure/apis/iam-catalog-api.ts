import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WorkArea } from '../../domain/model/work-area.entity';
import { Specialty } from '../../domain/model/specialty.entity';
import { WorkAreaResponse } from '../responses/work-area-response';
import { SpecialtyResponse } from '../responses/specialty-response';
import { WorkAreaAssembler } from '../assemblers/work-area-assembler';
import { SpecialtyAssembler } from '../assemblers/specialty-assembler';

@Injectable({
  providedIn: 'root'
})
export class IamCatalogApi {
  private http = inject(HttpClient);

  private workAreasUrl = `${environment.platformProviderApiBaseUrl}${environment.workAreasEndpointPath}`;
  private specialtiesUrl = `${environment.platformProviderApiBaseUrl}${environment.specialtiesEndpointPath}`;

  getWorkAreasByOrganizationId(organizationId: number): Observable<WorkArea[]> {
    return this.http
      .get<WorkAreaResponse[]>(`${this.workAreasUrl}?organizationId=${organizationId}`)
      .pipe(
        map(responses => WorkAreaAssembler.toEntities(responses))
      );
  }

  getSpecialties(): Observable<Specialty[]> {
    return this.http
      .get<SpecialtyResponse[]>(this.specialtiesUrl)
      .pipe(
        map(responses => SpecialtyAssembler.toEntities(responses))
      );
  }
}