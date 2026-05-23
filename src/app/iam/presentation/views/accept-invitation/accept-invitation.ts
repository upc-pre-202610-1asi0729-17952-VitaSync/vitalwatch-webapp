import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { MatSelectModule } from '@angular/material/select';
import { AuthLayout } from '../../../../shared/presentation/components/auth-layout/auth-layout';
import { IamCatalogApi } from '../../../infrastructure/iam-catalog-api';
import { WorkArea } from '../../../domain/model/work-area.entity';
import { Specialty } from '../../../domain/model/specialty.entity';

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
export class AcceptInvitation implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private catalogApi = inject(IamCatalogApi);

  protected workAreas = signal<WorkArea[]>([]);
  protected specialties = signal<Specialty[]>([]);

  protected passwordVisible = signal(false);
  protected confirmPasswordVisible = signal(false);

  protected form = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    workAreaId: [null as number | null, [Validators.required]],
    specialtyId: [null as number | null, [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const organizationId = 1;

    this.catalogApi.getWorkAreasByOrganizationId(organizationId).subscribe(workAreas => {
      this.workAreas.set(workAreas);
    });

    this.catalogApi.getSpecialties().subscribe(specialties => {
      this.specialties.set(specialties);
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update(value => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(value => !value);
  }

  protected passwordsDoNotMatch(): boolean {
    return this.form.controls.confirmPassword.touched &&
      this.form.controls.password.value !== this.form.controls.confirmPassword.value;
  }

  protected submit(): void {
    if (this.form.invalid || this.passwordsDoNotMatch()) {
      this.form.markAllAsTouched();
      return;
    }

    console.log(this.form.getRawValue());
  }
}