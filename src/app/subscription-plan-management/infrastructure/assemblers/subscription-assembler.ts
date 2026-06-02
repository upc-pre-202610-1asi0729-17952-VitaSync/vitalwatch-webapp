import { Subscription } from '../../domain/model/subscription.entity';
import { SubscriptionResponse } from '../responses/subscription-response';

export class SubscriptionAssembler {
    static toEntity(response: SubscriptionResponse): Subscription {
        return new Subscription({
            id: response.id,
            organizationId: response.organizationId,
            planId: response.planId,
            status: response.status,
            startedAt: response.startedAt
        });
    }

    static toEntities(responses: SubscriptionResponse[]): Subscription[] {
        return responses.map(response => this.toEntity(response));
    }
}