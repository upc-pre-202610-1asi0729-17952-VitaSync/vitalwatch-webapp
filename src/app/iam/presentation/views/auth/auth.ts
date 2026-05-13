import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IamStore } from '../../../application/iam.store';
import { UserRole, userRoles } from '../../../domain/model/user-role';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth {
  protected readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly activeTab = signal<'login' | 'register'>('login');
  protected readonly roles = userRoles;

  protected email = '';
  protected password = '';
  protected fullName = '';
  protected role: UserRole = 'Personal Médico';

  protected selectTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
  }

  protected signIn(): void {
    const success = this.iamStore.signIn(this.email, this.password, this.role);

    if (success) {
      this.redirectByRole();
    }
  }

  protected register(): void {
    const success = this.iamStore.register(this.fullName, this.email, this.password, this.role);

    if (success) {
      this.redirectByRole();
    }
  }

  private redirectByRole(): void {
    if (this.role === 'Personal Médico') {
      this.router.navigate(['/medical-staff/my-status']).then();
      return;
    }

    if (this.role === 'Supervisor Clínico') {
      this.router.navigate(['/supervisor/dashboard']).then();
      return;
    }

    if (this.role === 'Personal Administrativo') {
      // Luego lo cambiaremos a /admin/dashboard cuando implementemos Admin xd
      this.router.navigate(['/supervisor/dashboard']).then();
      return;
    }
  }
}
