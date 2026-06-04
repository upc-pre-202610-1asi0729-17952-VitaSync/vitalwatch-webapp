export interface OrganizationResponse {
    id: number;
    name: string;
    ruc: string;
    address: string;
    phone: string;
    status: 'ACTIVE' | 'INACTIVE';
    planId: number;
}