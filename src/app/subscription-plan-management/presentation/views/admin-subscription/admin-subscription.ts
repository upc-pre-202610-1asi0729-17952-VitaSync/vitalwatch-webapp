import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { Plan } from '../../../domain/model/plan.entity';
import { CheckoutSession } from '../../../domain/model/checkout-session.entity';
import { SubscriptionPlanStore } from '../../../application/subscription-plan.store';

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
  private subscriptionPlanStore = inject(SubscriptionPlanStore);

  private localErrorMessage = signal<string | null>(null);

  protected plans = computed(() =>
    this.subscriptionPlanStore.plans()
  );

  protected subscription = computed(() =>
    this.subscriptionPlanStore.currentSubscription()
  );

  protected checkoutSessions = computed(() =>
    this.subscriptionPlanStore.checkoutSessions()
  );

  protected loading = computed(() =>
    this.subscriptionPlanStore.loading()
  );

  protected errorMessage = computed(() =>
    this.localErrorMessage() ?? this.subscriptionPlanStore.error()
  );

  protected currentPlan = computed(() =>
    this.subscriptionPlanStore.currentPlan()
  );

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
    this.localErrorMessage.set(null);

    this.subscriptionPlanStore.changePlan(plan).subscribe({
      next: session => {
        if (!session) {
          this.localErrorMessage.set('subscription.admin.error.change-plan-failed');
          return;
        }

        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('subscription.admin.error.change-plan-failed');
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
    this.localErrorMessage.set(null);

    this.subscriptionPlanStore.loadCurrentPlan().subscribe({
      next: () => {
        this.subscriptionPlanStore.loadCheckoutSessions();
      },
      error: () => {
        this.localErrorMessage.set('subscription.admin.error.load-failed');
      }
    });
  }
}