import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthLayout } from '../../../../shared/presentation/components/auth-layout/auth-layout';
import { IamStore } from '../../../application/iam.store';

@Component({
  selector: 'app-accept-invitation',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TranslatePipe,
    MatSelectModule,
    NgIcon,
    AuthLayout
  ],
  templateUrl: './accept-invitation.html',
  styleUrl: './accept-invitation.css'
})
export class AcceptInvitation implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private iamStore = inject(IamStore);

  protected invitation = this.iamStore.registrationInvitation;
  protected workAreas = this.iamStore.workAreas;
  protected specialties = this.iamStore.specialties;
  protected loading = this.iamStore.loading;
  protected errorMessage = this.iamStore.error;

  protected passwordVisible = signal(false);
  protected confirmPasswordVisible = signal(false);

  protected form = this.formBuilder.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    workAreaId: [0, [Validators.required]],
    specialtyId: [0, [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  private invitationEmailSync = effect(() => {
    const invitation = this.invitation();

    if (!invitation) return;

    this.form.controls.email.setValue(invitation.email);
  });

  protected passwordsDoNotMatch = computed(() => {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;

    return this.form.controls.confirmPassword.touched &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password !== confirmPassword;
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    this.iamStore.loadInvitationForRegistration(token);
  }

  protected acceptInvitation(): void {
    const invitation = this.invitation();

    if (!invitation) {
      this.iamStore.setError('auth.error.invitation-not-found');
      return;
    }

    if (!invitation.isPending) {
      this.iamStore.setError('auth.error.invitation-not-available');
      return;
    }

    if (
      this.form.invalid ||
      this.form.controls.workAreaId.value === 0 ||
      this.form.controls.specialtyId.value === 0 ||
      this.form.controls.password.value !== this.form.controls.confirmPassword.value
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.iamStore.acceptInvitationRegistration({
      firstName: this.form.controls.firstName.value,
      lastName: this.form.controls.lastName.value,
      phone: this.form.controls.phone.value,
      workAreaId: this.form.controls.workAreaId.value,
      specialtyId: this.form.controls.specialtyId.value,
      password: this.form.controls.password.value
    }).subscribe({
      next: acceptedInvitation => {
        if (!acceptedInvitation) return;

        this.router.navigate(['/sign-in']).then();
      }
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update(value => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(value => !value);
  }

  protected goToSignIn(): void {
    this.router.navigate(['/sign-in']).then();
  }
}