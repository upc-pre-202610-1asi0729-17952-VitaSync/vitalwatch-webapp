export interface CreateOrganizationCheckoutRequest {
    planCode: string;
    organization: {
        name: string;
        ruc: string;
        address: string;
        phone: string;
    };
    administrator: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        phone: string;
    };
}

export interface CreateOrganizationCheckoutResponse {
    checkoutUrl: string;
    stripeSessionId: string;
    organizationId: number;
    administratorId: number;
    subscriptionId: number;
    checkoutSessionId: number;
}

export interface CheckoutSessionStatusResponse {
    stripeSessionId: string;
    status: string;
    paymentStatus: string;
    activated: boolean;
}