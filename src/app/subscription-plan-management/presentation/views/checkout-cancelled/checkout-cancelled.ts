import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
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

  protected tryAgain(): void {
    this.router.navigate(['/register-organization', 'professional']);
  }

  protected goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}