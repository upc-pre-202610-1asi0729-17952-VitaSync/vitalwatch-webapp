import { SensorStatus } from '../../domain/model/vital-sign-reading.entity';

export interface VitalSignReadingResponse {
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