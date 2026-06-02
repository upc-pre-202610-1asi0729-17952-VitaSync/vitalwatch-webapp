import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { AuthenticationStore } from '../../iam/application/authentication.store';
import { Plan } from '../domain/model/plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { CheckoutSession } from '../domain/model/checkout-session.entity';
import {
    CreateHospitalAdministratorRequest,
    CreateOrganizationRequest,
    SubscriptionPlanApi
} from '../infrastructure/api/subscription-plan-api';

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
    private successMessageSignal = signal<string | null>(null);

    readonly plans = computed(() => this.plansSignal());
    readonly currentPlan = computed(() => this.currentPlanSignal());
    readonly currentSubscription = computed(() => this.currentSubscriptionSignal());
    readonly checkoutSessions = computed(() => this.checkoutSessionsSignal());
    readonly loading = computed(() => this.loadingSignal());
    readonly error = computed(() => this.errorSignal());
    readonly successMessage = computed(() => this.successMessageSignal());

    loadPlans(): Observable<Plan[]> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.subscriptionPlanApi.getPlans().pipe(
            map(plans => {
                this.plansSignal.set(plans);
                this.loadingSignal.set(false);

                return plans;
            }),
            catchError(() => {
                this.errorSignal.set('subscription.registration.error.load-plans-failed');
                this.loadingSignal.set(false);

                return of([]);
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
            }),
            catchError(() => {
                this.errorSignal.set('subscription.admin.error.load-failed');
                this.loadingSignal.set(false);

                return of(null);
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
            }),
            catchError(() => {
                this.errorSignal.set('subscription.admin.error.change-plan-failed');
                this.loadingSignal.set(false);

                return of(null);
            })
        );
    }

    registerOrganizationWithAdministrator(request: {
        plan: Plan;
        organization: CreateOrganizationRequest;
        administrator: Omit<CreateHospitalAdministratorRequest, 'organizationId'>;
    }): Observable<boolean> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);
        this.successMessageSignal.set(null);

        return this.subscriptionPlanApi.registerOrganizationWithAdministrator(request).pipe(
            map(() => {
                this.successMessageSignal.set('subscription.registration.success');
                this.loadingSignal.set(false);

                return true;
            }),
            catchError(() => {
                this.errorSignal.set('subscription.registration.error.create-failed');
                this.loadingSignal.set(false);

                return of(false);
            })
        );
    }

    setErrorMessage(message: string | null): void {
        this.errorSignal.set(message);
    }

    clearMessages(): void {
        this.errorSignal.set(null);
        this.successMessageSignal.set(null);
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