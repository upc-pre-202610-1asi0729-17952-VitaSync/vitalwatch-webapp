import { BillingPeriod, Plan } from '../../domain/model/plan.entity';
import { PlanResponse } from '../responses/plan-response';

const allModuleKeys = [
  'ADMIN_REPORTS',
  'ADMIN_AUDIT',
  'VITAL_SIGN_ANOMALIES',
  'PREVENTIVE_ACTIONS',
  'SHIFT_MANAGEMENT',
  'DOCTOR_RECOVERY',
];

export class PlanAssembler {
  static toEntity(response: PlanResponse): Plan {
    const disabledModules = response.disabledModules ?? response.disabledModuleKeys ?? [];

    const enabledModules =
      response.enabledModules ??
      this.resolveEnabledModules(response.code, response.featureKeys ?? [], disabledModules);

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
      enabledModules,
      disabledModules,
    });
  }

  static toEntities(responses: PlanResponse[]): Plan[] {
    return responses.map((response) => this.toEntity(response));
  }

  private static toBillingPeriod(value: string): BillingPeriod {
    return value?.toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
  }

  private static resolveEnabledModules(
    planCode: string,
    featureKeys: string[],
    disabledModules: string[],
  ): string[] {
    const code = planCode?.toLowerCase();

    if (code === 'enterprise') {
      return allModuleKeys;
    }

    if (code === 'professional') {
      return allModuleKeys.filter((module) => !disabledModules.includes(module));
    }

    const enabled = new Set<string>();

    if (featureKeys.includes('basic.reports')) {
      enabled.add('ADMIN_REPORTS');
    }

    if (featureKeys.includes('audit.compliance')) {
      enabled.add('ADMIN_AUDIT');
    }

    if (featureKeys.includes('shift.coordination')) {
      enabled.add('SHIFT_MANAGEMENT');
      enabled.add('PREVENTIVE_ACTIONS');
      enabled.add('VITAL_SIGN_ANOMALIES');
      enabled.add('DOCTOR_RECOVERY');
    }

    return Array.from(enabled).filter((module) => !disabledModules.includes(module));
  }
}
