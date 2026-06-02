import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Plan } from '../domain/model/plan.entity';
import { SubscriptionPlanStore } from './subscription-plan.store';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionAccessService {
    private subscriptionPlanStore = inject(SubscriptionPlanStore);

    currentPlan = computed(() => this.subscriptionPlanStore.currentPlan());
    currentSubscription = computed(() => this.subscriptionPlanStore.currentSubscription());

    loadCurrentPlan(): Observable<Plan | null> {
        return this.subscriptionPlanStore.loadCurrentPlan();
    }

    hasModule(moduleCode: string): boolean {
        return this.subscriptionPlanStore.hasModule(moduleCode);
    }

    canUseLimit(limit: number | null, currentUsage: number): boolean {
        return this.subscriptionPlanStore.canUseLimit(limit, currentUsage);
    }

    getLimitExceededMessage(resource: string): string {
        const messages: Record<string, string> = {
            doctors: 'subscription.limits.doctors-exceeded',
            supervisors: 'subscription.limits.supervisors-exceeded',
            teams: 'subscription.limits.teams-exceeded',
            workAreas: 'subscription.limits.work-areas-exceeded',
            invitations: 'subscription.limits.invitations-exceeded'
        };

        return messages[resource] ?? 'subscription.limits.generic-exceeded';
    }
}