import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SensorStatus, VitalSignReading } from '../domain/model/vital-sign-reading.entity';

interface VitalSignReadingResource {
  id: number;
  organizationId: number;
  userId: number;
  heartRate: number;
  hrv: number;
  fatigueLevel: number;
  cortisolLevel: number;
  sensorStatus: SensorStatus;
  recordedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class VitalSignReadingApi {
  private http = inject(HttpClient);
  private readingsUrl = `${environment.platformProviderApiBaseUrl}${environment.vitalSignReadingsEndpointPath}`;

  getReadingsByUserId(organizationId: number, userId: number): Observable<VitalSignReading[]> {
    return this.http
      .get<VitalSignReadingResource[]>(
        `${this.readingsUrl}?organizationId=${organizationId}&userId=${userId}&_sort=recordedAt&_order=desc`
      )
      .pipe(
        map(resources => resources.map(resource => this.toVitalSignReading(resource)))
      );
  }

  private toVitalSignReading(resource: VitalSignReadingResource): VitalSignReading {
    return new VitalSignReading({
      id: resource.id,
      organizationId: resource.organizationId,
      userId: resource.userId,
      heartRate: resource.heartRate,
      hrv: resource.hrv,
      fatigueLevel: resource.fatigueLevel,
      cortisolLevel: resource.cortisolLevel ?? 0,
      sensorStatus: resource.sensorStatus,
      recordedAt: resource.recordedAt
    });
  }
}