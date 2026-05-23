export interface CheckoutSessionRequest {
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
    };
}