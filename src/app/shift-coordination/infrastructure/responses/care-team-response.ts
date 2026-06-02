import { CareTeamStatus } from '../../domain/model/care-team.entity';

export interface CareTeamResponse {
    id: number;
    organizationId: number;
    name: string;
    workAreaId: number;
    supervisorId: number | null;
    status: CareTeamStatus;
}