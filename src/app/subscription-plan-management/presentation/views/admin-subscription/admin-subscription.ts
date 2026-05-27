import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { Plan } from '../../../domain/model/plan.entity';
import { Subscription } from '../../../domain/model/subscription.entity';
import { CheckoutSession } from '../../../domain/model/checkout-session.entity';
import { SubscriptionPlanApi } from '../../../infrastructure/subscription-plan-api';

@Component({
  selector: 'app-admin-subscription',
  imports: [
    TranslatePipe,
    DatePipe,
    CurrencyPipe,
    NgIcon
  ],
  templateUrl: './admin-subscription.html',
  styleUrl: './admin-subscription.css'
})
export class AdminSubscription implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private subscriptionPlanApi = inject(SubscriptionPlanApi);

  protected plans = signal<Plan[]>([]);
  protected subscription = signal<Subscription | null>(null);
  protected checkoutSessions = signal<CheckoutSession[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected currentPlan = computed(() => {
    const subscription = this.subscription();

    if (!subscription) return null;

    return this.plans().find(plan => plan.id === subscription.planId) ?? null;
  });

  protected availablePlans = computed(() => {
    const currentPlan = this.currentPlan();

    return this.plans().filter(plan => plan.id !== currentPlan?.id);
  });

  protected lastCheckoutSession = computed<CheckoutSession | null>(() => {
    const sessions = this.checkoutSessions();

    return sessions.length > 0 ? sessions[0] : null;
  });
  protected monthlyCost = computed(() =>
    this.currentPlan()?.price ?? 0
  );

  ngOnInit(): void {
    this.loadSubscriptionData();
  }

  protected changePlan(plan: Plan): void {
    const currentUser = this.authenticationStore.currentUser();
    const subscription = this.subscription();

    if (!currentUser || !subscription) {
      this.errorMessage.set('subscription.admin.error.no-session');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.subscriptionPlanApi.createCompletedCheckoutSession({
      organizationId: currentUser.organizationId,
      administratorId: currentUser.id,
      subscriptionId: subscription.id,
      planId: plan.id,
      planCode: plan.code
    }).subscribe({
      next: session => {
        this.checkoutSessions.update(sessions => [session, ...sessions]);

        this.subscriptionPlanApi.getSubscriptionByOrganizationId(currentUser.organizationId).subscribe(updatedSubscription => {
          this.subscription.set(updatedSubscription);
          this.loading.set(false);
        });
      },
      error: () => {
        this.errorMessage.set('subscription.admin.error.change-plan-failed');
        this.loading.set(false);
      }
    });
  }

  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'subscription.admin.status.active',
      PAST_DUE: 'subscription.admin.status.past-due',
      CANCELLED: 'subscription.admin.status.cancelled',
      COMPLETED: 'subscription.admin.checkout-status.completed',
      PENDING: 'subscription.admin.checkout-status.pending',
      FAILED: 'subscription.admin.checkout-status.failed'
    };

    return labels[status] ?? status;
  }

  protected getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  private loadSubscriptionData(): void {
    const currentUser = this.authenticationStore.currentUser();

    if (!currentUser) {
      this.errorMessage.set('subscription.admin.error.no-session');
      return;
    }

    this.loading.set(true);

    this.subscriptionPlanApi.getPlans().subscribe({
      next: plans => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('subscription.admin.error.load-failed');
        this.loading.set(false);
      }
    });

    this.subscriptionPlanApi.getSubscriptionByOrganizationId(currentUser.organizationId).subscribe(subscription => {
      this.subscription.set(subscription);
    });

    this.subscriptionPlanApi.getCheckoutSessionsByOrganizationId(currentUser.organizationId).subscribe(sessions => {
      this.checkoutSessions.set(sessions);
    });
  }
}