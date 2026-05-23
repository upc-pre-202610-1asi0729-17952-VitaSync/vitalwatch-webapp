import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SubscriptionApi } from '../../../infrastructure/subscription-api';

@Component({
  selector: 'app-checkout-payment',
  imports: [TranslatePipe],
  templateUrl: './checkout-payment.html',
  styleUrl: './checkout-payment.css'
})
export class CheckoutPayment implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionApi = inject(SubscriptionApi);

  protected sessionId = 0;
  protected loading = signal(false);

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
  }

  protected confirmPayment(): void {
    this.loading.set(true);

    this.subscriptionApi.completeCheckoutSession(this.sessionId).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/onboarding/success'], {
          queryParams: { sessionId: this.sessionId }
        }).then();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  protected cancelPayment(): void {
    this.subscriptionApi.cancelCheckoutSession(this.sessionId).subscribe({
      next: () => this.router.navigate(['/onboarding']).then()
    });
  }
}