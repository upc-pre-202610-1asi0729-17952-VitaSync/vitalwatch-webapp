import { TeamMember } from '../../domain/model/team-member.entity';
import { TeamMemberResponse } from '../responses/team-member-response';

export class TeamMemberAssembler {
    static toEntity(response: TeamMemberResponse): TeamMember {
        return new TeamMember({
            id: response.id,
            teamId: response.teamId,
            userId: response.userId
        });
    }

    static toEntities(responses: TeamMemberResponse[]): TeamMember[] {
        return responses.map(response => this.toEntity(response));
    }
}