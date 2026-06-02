export interface UserResponse {
    id: number;
    organizationId: number;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone?: string;
    role: 'HOSPITAL_ADMIN' | 'SUPERVISOR' | 'DOCTOR';
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}