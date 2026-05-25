import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShiftRecord, ShiftStatus, ShiftType } from '../domain/model/shift-record.entity';
import { UpdateShiftRecordStatusRequest } from './update-shift-record-status-request';

interface ShiftRecordResource {
  id: number;
  organizationId: number;
  userId: number;
  workAreaId: number;
  type: ShiftType;
  status: ShiftStatus;
  scheduledStart: string;
  scheduledEnd: string;
  checkInAt: string | null;
  checkOutAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ShiftRecordApi {
  private http = inject(HttpClient);
  private shiftRecordsUrl = `${environment.platformProviderApiBaseUrl}${environment.shiftRecordsEndpointPath}`;

  getShiftRecordsByUserId(organizationId: number, userId: number): Observable<ShiftRecord[]> {
    return this.http
      .get<ShiftRecordResource[]>(
        `${this.shiftRecordsUrl}?organizationId=${organizationId}&userId=${userId}&_sort=scheduledStart&_order=desc`
      )
      .pipe(
        map(resources => resources.map(resource => this.toShiftRecord(resource)))
      );
  }

  updateShiftRecordStatus(
    shiftRecordId: number,
    request: UpdateShiftRecordStatusRequest
  ): Observable<ShiftRecord> {
    return this.http
      .patch<ShiftRecordResource>(`${this.shiftRecordsUrl}/${shiftRecordId}`, request)
      .pipe(
        map(resource => this.toShiftRecord(resource))
      );
  }

  private toShiftRecord(resource: ShiftRecordResource): ShiftRecord {
    return new ShiftRecord({
      id: resource.id,
      organizationId: resource.organizationId,
      userId: resource.userId,
      workAreaId: resource.workAreaId,
      type: resource.type,
      status: resource.status,
      scheduledStart: resource.scheduledStart,
      scheduledEnd: resource.scheduledEnd,
      checkInAt: resource.checkInAt,
      checkOutAt: resource.checkOutAt
    });
  }
}