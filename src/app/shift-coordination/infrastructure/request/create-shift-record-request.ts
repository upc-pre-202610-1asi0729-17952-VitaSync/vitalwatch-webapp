import { ShiftType } from '../../domain/model/shift-record.entity';

export interface CreateShiftRecordRequest {
    organizationId: number;
    userId: number;
    workAreaId: number;
    type: ShiftType;
    scheduledStart: string;
    scheduledEnd: string;
}