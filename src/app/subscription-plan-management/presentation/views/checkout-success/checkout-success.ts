import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-checkout-success',
  imports: [
    TranslatePipe,
    NgIcon
  ],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout-success.css'
})
export class CheckoutSuccess {
  private router = inject(Router);

  protected goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}