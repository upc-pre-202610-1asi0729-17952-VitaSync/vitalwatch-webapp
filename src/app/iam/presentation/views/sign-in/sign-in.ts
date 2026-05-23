import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthLayout } from '../../../../shared/presentation/components/auth-layout/auth-layout';
import { AuthenticationStore } from '../../../application/authentication.store';

@Component({
  selector: 'app-sign-in',
  imports: [
    AuthLayout,
    ReactiveFormsModule,
    TranslatePipe,
    NgIcon,
  ],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {
  private formBuilder = inject(NonNullableFormBuilder);

  protected passwordVisible = signal(false);

  protected form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  protected store = inject(AuthenticationStore);

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update(value => !value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.signIn({
      email: this.form.controls.email.value,
      password: this.form.controls.password.value
    });
  }
}