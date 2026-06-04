import { Specialty } from '../../domain/model/specialty.entity';
import { SpecialtyResponse } from '../responses/specialty-response';

export class SpecialtyAssembler {
    static toEntity(response: SpecialtyResponse): Specialty {
        return new Specialty({
            id: response.id,
            name: response.name
        });
    }

    static toEntities(responses: SpecialtyResponse[]): Specialty[] {
        return responses.map(response => this.toEntity(response));
    }
}