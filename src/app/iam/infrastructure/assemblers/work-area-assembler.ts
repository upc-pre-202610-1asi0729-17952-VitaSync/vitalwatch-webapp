import { WorkArea } from '../../domain/model/work-area.entity';
import { WorkAreaResponse } from '../responses/work-area-response';

export class WorkAreaAssembler {
    static toEntity(response: WorkAreaResponse): WorkArea {
        return new WorkArea({
            id: response.id,
            organizationId: response.organizationId,
            name: response.name
        });
    }

    static toEntities(responses: WorkAreaResponse[]): WorkArea[] {
        return responses.map(response => this.toEntity(response));
    }
}