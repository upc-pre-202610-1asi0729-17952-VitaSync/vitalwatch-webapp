import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-checkout-cancelled',
  imports: [
    TranslatePipe,
    NgIcon
  ],
  templateUrl: './checkout-cancelled.html',
  styleUrl: './checkout-cancelled.css'
})
export class CheckoutCancelled {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected tryAgain(): void {
    const planCode = this.route.snapshot.queryParamMap.get('plan') ?? 'professional';
    this.router.navigate(['/register-organization', planCode]);
  }

  protected goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}