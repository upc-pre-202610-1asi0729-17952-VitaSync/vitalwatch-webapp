import { ShiftStatus } from '../domain/model/shift-record.entity';

export interface UpdateShiftRecordStatusRequest {
    status: ShiftStatus;
    checkInAt?: string | null;
    checkOutAt?: string | null;
}