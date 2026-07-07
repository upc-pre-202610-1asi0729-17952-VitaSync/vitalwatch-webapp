export interface CheckoutSessionResponse {
  id: number;
  sessionId?: string;
  stripeSessionId?: string;
  checkoutUrl?: string;
  status: string;
  organizationId: number | null;
  planId: number;
  planCode: string;
  planName?: string;
  planPrice?: number;
  currency?: string;
  billingPeriod?: string;
  createdAt: string;
}
