import { CareTeam } from '../../domain/model/care-team.entity';
import { CareTeamResponse } from '../responses/care-team-response';

export class CareTeamAssembler {
    static toEntity(response: CareTeamResponse): CareTeam {
        return new CareTeam({
            id: response.id,
            organizationId: response.organizationId,
            name: response.name,
            workAreaId: response.workAreaId,
            supervisorId: response.supervisorId,
            status: response.status
        });
    }

    static toEntities(responses: CareTeamResponse[]): CareTeam[] {
        return responses.map(response => this.toEntity(response));
    }
}