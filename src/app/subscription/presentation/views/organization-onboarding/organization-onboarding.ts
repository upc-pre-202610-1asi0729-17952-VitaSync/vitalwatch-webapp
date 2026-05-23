import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthLayout } from '../../../../shared/presentation/components/auth-layout/auth-layout';

@Component({
  selector: 'app-organization-onboarding',
  imports: [
    AuthLayout,
    ReactiveFormsModule,
    TranslatePipe,
    RouterLink
  ],
  templateUrl: './organization-onboarding.html',
  styleUrl: './organization-onboarding.css'
})
export class OrganizationOnboarding {
  private formBuilder = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected selectedPlan = this.route.snapshot.queryParamMap.get('plan') ?? 'professional';

  protected form = this.formBuilder.group({
    organizationName: ['', [Validators.required]],
    ruc: ['', [Validators.required]],
    address: ['', [Validators.required]],
    phone: ['', [Validators.required]],

    adminFirstName: ['', [Validators.required]],
    adminLastName: ['', [Validators.required]],
    adminEmail: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  protected passwordsDoNotMatch(): boolean {
    return this.form.controls.confirmPassword.touched &&
      this.form.controls.password.value !== this.form.controls.confirmPassword.value;
  }

  protected submit(): void {
    if (this.form.invalid || this.passwordsDoNotMatch()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      planCode: this.selectedPlan,
      organization: {
        name: this.form.controls.organizationName.value,
        ruc: this.form.controls.ruc.value,
        address: this.form.controls.address.value,
        phone: this.form.controls.phone.value
      },
      administrator: {
        firstName: this.form.controls.adminFirstName.value,
        lastName: this.form.controls.adminLastName.value,
        email: this.form.controls.adminEmail.value,
        role: 'HOSPITAL_ADMIN'
      },
      subscription: {
        status: 'ACTIVE'
      }
    };

    console.log(payload);

    this.router.navigate(['/admin/dashboard']).then();
  }
}