import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { Plan } from '../domain/model/plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { CheckoutSession } from '../domain/model/checkout-session.entity';
import { SubscriptionPlanApi } from '../infrastructure/subscription-plan-api';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionPlanStore {
    private authenticationStore = inject(AuthenticationStore);
    private subscriptionPlanApi = inject(SubscriptionPlanApi);

    private plansSignal = signal<Plan[]>([]);
    private currentPlanSignal = signal<Plan | null>(null);
    private currentSubscriptionSignal = signal<Subscription | null>(null);
    private checkoutSessionsSignal = signal<CheckoutSession[]>([]);
    private loadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    plans = computed(() => this.plansSignal());
    currentPlan = computed(() => this.currentPlanSignal());
    currentSubscription = computed(() => this.currentSubscriptionSignal());
    checkoutSessions = computed(() => this.checkoutSessionsSignal());
    loading = computed(() => this.loadingSignal());
    error = computed(() => this.errorSignal());

    loadPlans(): Observable<Plan[]> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.subscriptionPlanApi.getPlans().pipe(
            map(plans => {
                this.plansSignal.set(plans);
                this.loadingSignal.set(false);
                return plans;
            })
        );
    }

    loadCurrentPlan(): Observable<Plan | null> {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) {
            this.currentPlanSignal.set(null);
            this.currentSubscriptionSignal.set(null);
            return of(null);
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return forkJoin({
            plans: this.subscriptionPlanApi.getPlans(),
            subscription: this.subscriptionPlanApi.getSubscriptionByOrganizationId(currentUser.organizationId)
        }).pipe(
            map(({ plans, subscription }) => {
                this.plansSignal.set(plans);
                this.currentSubscriptionSignal.set(subscription);

                if (!subscription) {
                    this.currentPlanSignal.set(null);
                    this.loadingSignal.set(false);
                    return null;
                }

                const plan = plans.find(item => item.id === subscription.planId) ?? null;

                this.currentPlanSignal.set(plan);
                this.loadingSignal.set(false);

                return plan;
            })
        );
    }

    loadCheckoutSessions(): void {
        const currentUser = this.authenticationStore.currentUser();

        if (!currentUser) return;

        this.subscriptionPlanApi
            .getCheckoutSessionsByOrganizationId(currentUser.organizationId)
            .subscribe({
                next: sessions => {
                    this.checkoutSessionsSignal.set(sessions);
                },
                error: () => {
                    this.errorSignal.set('subscription.admin.error.load-failed');
                }
            });
    }

    changePlan(plan: Plan): Observable<CheckoutSession | null> {
        const currentUser = this.authenticationStore.currentUser();
        const subscription = this.currentSubscriptionSignal();

        if (!currentUser || !subscription) {
            this.errorSignal.set('subscription.admin.error.no-session');
            return of(null);
        }

        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.subscriptionPlanApi.createCompletedCheckoutSession({
            organizationId: currentUser.organizationId,
            administratorId: currentUser.id,
            subscriptionId: subscription.id,
            planId: plan.id,
            planCode: plan.code
        }).pipe(
            map(session => {
                this.checkoutSessionsSignal.update(sessions => [session, ...sessions]);
                this.currentSubscriptionSignal.set(
                    new Subscription({
                        id: subscription.id,
                        organizationId: subscription.organizationId,
                        planId: plan.id,
                        status: subscription.status,
                        startedAt: subscription.startedAt
                    })
                );
                this.currentPlanSignal.set(plan);
                this.loadingSignal.set(false);
                return session;
            })
        );
    }

    hasModule(moduleCode: string): boolean {
        const plan = this.currentPlanSignal();

        if (!plan) return false;

        return plan.enabledModules.includes(moduleCode);
    }

    canUseLimit(limit: number | null, currentUsage: number): boolean {
        if (limit === null) return true;

        return currentUsage < limit;
    }
}