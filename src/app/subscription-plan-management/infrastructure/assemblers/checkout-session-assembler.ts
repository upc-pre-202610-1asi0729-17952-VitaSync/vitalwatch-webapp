import { CheckoutSession, CheckoutSessionStatus } from '../../domain/model/checkout-session.entity';
import { CheckoutSessionResponse } from '../responses/checkout-session-response';

export class CheckoutSessionAssembler {
  static toEntity(response: CheckoutSessionResponse): CheckoutSession {
    return new CheckoutSession({
      id: response.id,
      organizationId: response.organizationId ?? 0,
      administratorId: 0,
      subscriptionId: 0,
      planId: response.planId,
      planCode: response.planCode,
      status: this.toCheckoutStatus(response.status),
      createdAt: response.createdAt,
    });
  }

  static toEntities(responses: CheckoutSessionResponse[]): CheckoutSession[] {
    return responses.map((response) => this.toEntity(response));
  }

  private static toCheckoutStatus(status: string): CheckoutSessionStatus {
    if (status === 'COMPLETED') return 'COMPLETED';
    if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'FAILED') return 'FAILED';

    return 'PENDING';
  }
}
