import { BillingPeriod, Plan } from '../../domain/model/plan.entity';
import { PlanResponse } from '../responses/plan-response';

export class PlanAssembler {
  static toEntity(response: PlanResponse): Plan {
    return new Plan({
      id: response.id,
      code: response.code,
      name: response.name,
      price: response.price,
      currency: response.currency,
      billingPeriod: this.toBillingPeriod(response.billingPeriod),
      description: response.description,
      maxDoctors: response.maxDoctors,
      maxSupervisors: response.maxSupervisors,
      maxTeams: response.maxTeams,
      maxWorkAreas: response.maxWorkAreas,
      monthlyInvitations: response.monthlyInvitations,
      dataHistoryDays: response.dataHistoryDays,
      supportLevel: response.supportLevel,
      recommended: response.recommended,
      featureKeys: response.featureKeys,
      enabledModules: response.enabledModules,
      disabledModules: response.disabledModules,
    });
  }

  static toEntities(responses: PlanResponse[]): Plan[] {
    return responses.map((response) => this.toEntity(response));
  }

  private static toBillingPeriod(value: string): BillingPeriod {
    return value?.toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
  }
}
