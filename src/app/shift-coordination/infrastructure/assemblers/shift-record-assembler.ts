import { ShiftRecord } from '../../domain/model/shift-record.entity';
import { ShiftRecordResponse } from '../responses/shift-record-response';

export class ShiftRecordAssembler {
    static toEntity(response: ShiftRecordResponse): ShiftRecord {
        return new ShiftRecord({
            id: response.id,
            organizationId: response.organizationId,
            userId: response.userId,
            workAreaId: response.workAreaId,
            type: response.type,
            status: response.status,
            scheduledStart: response.scheduledStart,
            scheduledEnd: response.scheduledEnd,
            checkInAt: response.checkInAt,
            checkOutAt: response.checkOutAt
        });
    }

    static toEntities(responses: ShiftRecordResponse[]): ShiftRecord[] {
        return responses.map(response => this.toEntity(response));
    }
}