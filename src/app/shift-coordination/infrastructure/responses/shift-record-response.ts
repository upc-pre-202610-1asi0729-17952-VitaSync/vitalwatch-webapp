import { ShiftStatus, ShiftType } from '../../domain/model/shift-record.entity';

export interface ShiftRecordResponse {
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