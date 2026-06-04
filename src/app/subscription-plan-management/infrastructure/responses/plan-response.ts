import { BillingPeriod } from '../../domain/model/plan.entity';

export interface PlanResponse {
    id: number;
    code: string;
    name: string;
    price: number;
    currency?: string;
    billingPeriod: BillingPeriod;
    description?: string;
    maxDoctors?: number | null;
    maxSupervisors?: number | null;
    maxTeams?: number | null;
    maxWorkAreas?: number | null;
    monthlyInvitations?: number | null;
    dataHistoryDays?: number;
    supportLevel?: string;
    recommended?: boolean;
    featureKeys?: string[];
    enabledModules?: string[];
    disabledModules?: string[];
}