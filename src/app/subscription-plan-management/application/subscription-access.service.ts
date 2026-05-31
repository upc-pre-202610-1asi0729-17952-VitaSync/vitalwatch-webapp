import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { Plan } from '../domain/model/plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionPlanApi } from '../infrastructure/subscription-plan-api';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionAccessService {
    private authenticationStore = inject(AuthenticationStore);
    private subscriptionPlanApi = inject(SubscriptionPlanApi);

    private currentPlanSignal = signal<Plan | null>(null);
    private currentSubscriptionSignal = signal<Subscription | null>(null);

    currentPlan = computed(() => this.currentPlanSignal());
    currentSubscription = computed(() => this.currentSubscriptionSignal());

    loadCurrentPlan(): Observable<Plan | null> {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.currentPlanSignal.set(null);
            this.currentSubscriptionSignal.set(null);
            return new Observable<Plan | null>(subscriber => {
                subscriber.next(null);
                subscriber.complete();
            });
        }

        return forkJoin({
            plans: this.subscriptionPlanApi.getPlans(),
            subscription: this.subscriptionPlanApi.getSubscriptionByOrganizationId(currentUser.organizationId)
        }).pipe(
            map(({ plans, subscription }) => {
                this.currentSubscriptionSignal.set(subscription);

                if (!subscription) {
                    this.currentPlanSignal.set(null);
                    return null;
                }

                const plan = plans.find(item => item.id === subscription.planId) ?? null;
                this.currentPlanSignal.set(plan);

                return plan;
            })
        );
    }

    hasModule(moduleCode: string): boolean {
        const plan = this.currentPlanSignal();

        if (!plan) return false;

        return plan.enabledModules.includes(moduleCode);
    }

    isUnlimited(value: number | null): boolean {
        return value === null;
    }

    canUseLimit(limit: number | null, currentUsage: number): boolean {
        if (limit === null) return true;

        return currentUsage < limit;
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