import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ShiftRecord, ShiftStatus } from '../../domain/model/shift-record.entity';
import { CreateShiftRecordRequest } from '../request/create-shift-record-request';
import { UpdateShiftRecordStatusRequest } from '../request/update-shift-record-status-request';
import { ShiftRecordResponse } from '../responses/shift-record-response';
import { ShiftRecordAssembler } from '../assemblers/shift-record-assembler';

@Injectable({
  providedIn: 'root'
})
export class ShiftRecordApi {
  private http = inject(HttpClient);

  private shiftRecordsUrl = `${environment.platformProviderApiBaseUrl}${environment.shiftRecordsEndpointPath}`;

  getShiftRecordsByOrganizationId(organizationId: number): Observable<ShiftRecord[]> {
    return this.http
      .get<ShiftRecordResponse[]>(
        `${this.shiftRecordsUrl}?organizationId=${organizationId}`
      )
      .pipe(
        map(responses => ShiftRecordAssembler.toEntities(responses))
      );
  }

  getShiftRecordsByUserId(organizationId: number, userId: number): Observable<ShiftRecord[]> {
    return this.http
      .get<ShiftRecordResponse[]>(
        `${this.shiftRecordsUrl}?organizationId=${organizationId}&userId=${userId}`
      )
      .pipe(
        map(responses => ShiftRecordAssembler.toEntities(responses))
      );
  }

  createShiftRecord(request: CreateShiftRecordRequest): Observable<ShiftRecord> {
    const payload = {
      ...request,
      status: 'SCHEDULED' as ShiftStatus,
      checkInAt: null,
      checkOutAt: null
    };

    return this.http
      .post<ShiftRecordResponse>(this.shiftRecordsUrl, payload)
      .pipe(
        map(response => ShiftRecordAssembler.toEntity(response))
      );
  }

  updateShiftRecordStatus(
    shiftRecordId: number,
    request: UpdateShiftRecordStatusRequest
  ): Observable<ShiftRecord> {
    return this.http
      .patch<ShiftRecordResponse>(`${this.shiftRecordsUrl}/${shiftRecordId}`, request)
      .pipe(
        map(response => ShiftRecordAssembler.toEntity(response))
      );
  }
}