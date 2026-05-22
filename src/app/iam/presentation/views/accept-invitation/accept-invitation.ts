import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthLayout } from '../../../../shared/presentation/components/auth-layout/auth-layout';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-accept-invitation',
  imports: [
    AuthLayout,
    ReactiveFormsModule,
    TranslatePipe,
    NgIcon,
    RouterLink,
    MatSelectModule
  ],
  templateUrl: './accept-invitation.html',
  styleUrl: './accept-invitation.css'
})
export class AcceptInvitation {
  private formBuilder = inject(NonNullableFormBuilder);

  protected passwordVisible = signal(false);
  protected confirmPasswordVisible = signal(false);

  protected form = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    workArea: ['', [Validators.required]],
    specialty: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  protected workAreas = [
    'UCI',
    'Emergencias',
    'Hospitalización',
    'Cirugía',
    'Pediatría',
    'Cardiología'
  ];

  protected specialties = [
    'Medicina General',
    'Enfermería',
    'Cardiología',
    'Pediatría',
    'Anestesiología',
    'Traumatología'
  ];

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update(value => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(value => !value);
  }

  protected passwordsDoNotMatch(): boolean {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;

    return this.form.controls.confirmPassword.touched && password !== confirmPassword;
  }

  protected submit(): void {
    if (this.form.invalid || this.passwordsDoNotMatch()) {
      this.form.markAllAsTouched();
      return;
    }

    console.log(this.form.getRawValue());
  }
}