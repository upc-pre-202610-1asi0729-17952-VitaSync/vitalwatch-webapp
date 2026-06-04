import { CheckoutSession } from '../../domain/model/checkout-session.entity';
import { CheckoutSessionResponse } from '../responses/checkout-session-response';

export class CheckoutSessionAssembler {
    static toEntity(response: CheckoutSessionResponse): CheckoutSession {
        return new CheckoutSession({
            id: response.id,
            organizationId: response.organizationId,
            administratorId: response.administratorId,
            subscriptionId: response.subscriptionId,
            planId: response.planId,
            planCode: response.planCode,
            status: response.status,
            createdAt: response.createdAt
        });
    }

    static toEntities(responses: CheckoutSessionResponse[]): CheckoutSession[] {
        return responses.map(response => this.toEntity(response));
    }
}