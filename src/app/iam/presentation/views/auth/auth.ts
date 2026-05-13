import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    this.iamStore.signIn(this.email, this.password, this.role);
  }

  protected register(): void {
    this.iamStore.register(this.fullName, this.email, this.password, this.role);
  }
}
