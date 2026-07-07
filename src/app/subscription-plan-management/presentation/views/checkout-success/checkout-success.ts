import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout-success.css',
})
export class CheckoutSuccess {
  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/sign-in']);
  }
}
