import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../application/authentication.store';
import { IamStore } from '../../../application/iam.store';
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
  private iamStore = inject(IamStore);

  private savedUser = signal<User | null>(null);
  private localLoading = signal(false);
  private localErrorMessage = signal<string | null>(null);

  protected successMessage = signal<string | null>(null);

  protected loading = computed(() =>
    this.localLoading() || this.iamStore.loading()
  );

  protected errorMessage = computed(() =>
    this.localErrorMessage() ?? this.iamStore.error()
  );

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
      this.localErrorMessage.set('settings.account.error.no-session');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.localLoading.set(true);
    this.successMessage.set(null);
    this.localErrorMessage.set(null);
    this.iamStore.clearError();

    this.iamStore.updateUserProfile(user.id, {
      firstName: this.form.controls.firstName.value,
      lastName: this.form.controls.lastName.value,
      email: this.form.controls.email.value
    }).subscribe({
      next: updatedUser => {
        this.savedUser.set(updatedUser);
        this.authenticationStore.updateCurrentUser(updatedUser);
        this.successMessage.set('settings.account.success');
        this.localLoading.set(false);
      },
      error: () => {
        this.localErrorMessage.set('settings.account.error.update-failed');
        this.localLoading.set(false);
      }
    });
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
      this.localErrorMessage.set('settings.account.error.no-session');
      return;
    }

    this.form.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  }
}