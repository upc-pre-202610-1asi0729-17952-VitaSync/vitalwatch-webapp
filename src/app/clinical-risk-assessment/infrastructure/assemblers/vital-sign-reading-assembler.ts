import { VitalSignReading } from '../../domain/model/vital-sign-reading.entity';
import { VitalSignReadingResponse } from '../responses/vital-sign-reading-response';

export class VitalSignReadingAssembler {
    static toEntity(response: VitalSignReadingResponse): VitalSignReading {
        return new VitalSignReading({
            id: response.id,
            organizationId: response.organizationId,
            userId: response.userId,
            heartRate: response.heartRate,
            hrv: response.hrv,
            fatigueLevel: response.fatigueLevel,
            cortisolLevel: response.cortisolLevel,
            sensorStatus: response.sensorStatus,
            recordedAt: response.recordedAt
        });
    }

    static toEntities(responses: VitalSignReadingResponse[]): VitalSignReading[] {
        return responses.map(response => this.toEntity(response));
    }
}