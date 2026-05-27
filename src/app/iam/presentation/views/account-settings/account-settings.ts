import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../application/authentication.store';
import { UserApi } from '../../../infrastructure/user-api';
import { User } from '../../../domain/model/user.entity';

@Component({
  selector: 'app-account-settings',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    NgIcon
  ],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css'
})
export class AccountSettings implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private authenticationStore = inject(AuthenticationStore);
  private userApi = inject(UserApi);

  protected savedUser = signal<User | null>(null);
  protected loading = signal(false);
  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);

  protected currentUser = computed(() =>
    this.savedUser() ?? this.authenticationStore.currentUser()
  );

  protected form = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.loadUserData();
  }

  protected saveChanges(): void {
    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('settings.account.error.no-session');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.userApi.updateUserProfile(user.id, {
      firstName: this.form.controls.firstName.value,
      lastName: this.form.controls.lastName.value,
      email: this.form.controls.email.value
    }).subscribe({
      next: updatedUser => {
        this.savedUser.set(updatedUser);
        this.successMessage.set('settings.account.success');
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('settings.account.error.update-failed');
        this.loading.set(false);
      }
    });
  }

  protected resetForm(): void {
    this.loadUserData();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  protected getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      HOSPITAL_ADMIN: 'settings.account.roles.admin',
      SUPERVISOR: 'settings.account.roles.supervisor',
      DOCTOR: 'settings.account.roles.doctor'
    };

    return labels[role] ?? role;
  }

  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'settings.account.status.active',
      INACTIVE: 'settings.account.status.inactive',
      PENDING: 'settings.account.status.pending'
    };

    return labels[status] ?? status;
  }

  protected getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  private loadUserData(): void {
    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('settings.account.error.no-session');
      return;
    }

    this.form.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  }
}