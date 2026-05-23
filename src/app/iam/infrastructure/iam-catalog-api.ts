import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkArea } from '../domain/model/work-area.entity';
import { Specialty } from '../domain/model/specialty.entity';

interface WorkAreaResource {
  id: number;
  organizationId: number;
  name: string;
}

interface SpecialtyResource {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class IamCatalogApi {
  private http = inject(HttpClient);

  private workAreasUrl = `${environment.platformProviderApiBaseUrl}${environment.workAreasEndpointPath}`;
  private specialtiesUrl = `${environment.platformProviderApiBaseUrl}${environment.specialtiesEndpointPath}`;

  getWorkAreasByOrganizationId(organizationId: number): Observable<WorkArea[]> {
    return this.http
      .get<WorkAreaResource[]>(`${this.workAreasUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources =>
          resources.map(resource =>
            new WorkArea({
              id: resource.id,
              organizationId: resource.organizationId,
              name: resource.name
            })
          )
        )
      );
  }

  getSpecialties(): Observable<Specialty[]> {
    return this.http
      .get<SpecialtyResource[]>(this.specialtiesUrl)
      .pipe(
        map(resources =>
          resources.map(resource =>
            new Specialty({
              id: resource.id,
              name: resource.name
            })
          )
        )
      );
  }
}