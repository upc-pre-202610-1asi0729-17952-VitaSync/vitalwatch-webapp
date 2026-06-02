export interface CreateCareTeamRequest {
    organizationId: number;
    name: string;
    workAreaId: number;
    supervisorId: number | null;
}