export interface AcceptInvitationRequest {
    invitationId: number;
    organizationId: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
    workAreaId: number;
    specialtyId: number;
    password: string;
}