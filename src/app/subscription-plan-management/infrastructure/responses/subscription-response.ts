import { SubscriptionStatus } from '../../domain/model/subscription.entity';

export interface SubscriptionResponse {
    id: number;
    organizationId: number;
    planId: number;
    status: SubscriptionStatus;
    startedAt: string;
}