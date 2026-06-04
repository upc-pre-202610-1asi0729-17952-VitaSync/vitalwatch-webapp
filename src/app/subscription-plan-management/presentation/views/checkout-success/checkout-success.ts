import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { SubscriptionPlanApi } from '../../../infrastructure/api/subscription-plan-api';

@Component({
  selector: 'app-checkout-success',
  imports: [
    TranslatePipe,
    NgIcon
  ],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout-success.css'
})
export class CheckoutSuccess implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptionPlanApi = inject(SubscriptionPlanApi);

  protected checkingPayment = signal(false);
  protected activationMessage = signal<string | null>(null);
  protected activationError = signal<string | null>(null);

  ngOnInit(): void {
    const stripeSessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!stripeSessionId) {
      return;
    }

    this.checkingPayment.set(true);

    this.subscriptionPlanApi.getCheckoutSessionStatus(stripeSessionId).subscribe({
      next: response => {
        this.checkingPayment.set(false);

        if (response.activated) {
          this.activationMessage.set('Tu pago fue validado y tu suscripción fue activada.');
        } else {
          this.activationMessage.set('Tu pago fue recibido. La activación puede tardar unos segundos.');
        }
      },
      error: () => {
        this.checkingPayment.set(false);
        this.activationError.set('No se pudo validar el pago automáticamente. Revisa el webhook de Stripe.');
      }
    });
  }

  protected goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}