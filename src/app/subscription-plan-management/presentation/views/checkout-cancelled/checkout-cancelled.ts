import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

import { SubscriptionPlanApi } from '../../../infrastructure/api/subscription-plan-api';

@Component({
  selector: 'app-checkout-cancelled',
  imports: [TranslatePipe, NgIcon],
  templateUrl: './checkout-cancelled.html',
  styleUrl: './checkout-cancelled.css',
})
export class CheckoutCancelled implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptionPlanApi = inject(SubscriptionPlanApi);

  protected cancellingRegistration = signal(false);

  ngOnInit(): void {
    const checkoutSessionId = Number(this.route.snapshot.queryParamMap.get('checkoutSessionId'));

    if (!checkoutSessionId) return;

    this.cancellingRegistration.set(true);

    this.subscriptionPlanApi.cancelCheckoutSession(checkoutSessionId).subscribe({
      next: () => {
        this.cancellingRegistration.set(false);
      },
      error: (error) => {
        console.error('CANCEL CHECKOUT SESSION ERROR:', error);
        this.cancellingRegistration.set(false);
      },
    });
  }

  protected tryAgain(): void {
    const planCode = this.route.snapshot.queryParamMap.get('plan') ?? 'professional';
    this.router.navigate(['/register-organization', planCode]);
  }

  protected goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}
