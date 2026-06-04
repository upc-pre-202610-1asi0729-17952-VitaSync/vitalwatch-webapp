import { CareTeamStatus } from '../../domain/model/care-team.entity';

export interface UpdateCareTeamStatusRequest {
    status: CareTeamStatus;
}