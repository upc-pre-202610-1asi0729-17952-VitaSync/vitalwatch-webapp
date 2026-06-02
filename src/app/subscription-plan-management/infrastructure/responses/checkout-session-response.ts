import { CheckoutSessionStatus } from '../../domain/model/checkout-session.entity';

export interface CheckoutSessionResponse {
    id: number;
    organizationId: number;
    administratorId: number;
    subscriptionId: number;
    planId: number;
    planCode: string;
    status: CheckoutSessionStatus;
    createdAt: string;
}