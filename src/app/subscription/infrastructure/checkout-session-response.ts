export interface CheckoutSessionResponse {
    id: number;
    checkoutUrl: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}