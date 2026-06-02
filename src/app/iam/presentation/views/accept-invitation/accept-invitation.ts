import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthLayout } from '../../../../shared/presentation/components/auth-layout/auth-layout';
import { InvitationApi } from '../../../infrastructure/api/invitation-api';
import { IamCatalogApi } from '../../../infrastructure/api/iam-catalog-api';
import { Invitation } from '../../../domain/model/invitation.entity';
import { WorkArea } from '../../../domain/model/work-area.entity';
import { Specialty } from '../../../domain/model/specialty.entity';

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
  private invitationApi = inject(InvitationApi);
  private catalogApi = inject(IamCatalogApi);

  protected invitation = signal<Invitation | null>(null);
  protected workAreas = signal<WorkArea[]>([]);
  protected specialties = signal<Specialty[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

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

  protected passwordsDoNotMatch = computed(() => {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;

    return this.form.controls.confirmPassword.touched &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password !== confirmPassword;
  });

  ngOnInit(): void {
    this.loadInvitation();
  }

  protected acceptInvitation(): void {
    const invitation = this.invitation();

    if (!invitation) {
      this.errorMessage.set('auth.error.invitation-not-found');
      return;
    }

    if (!invitation.isPending) {
      this.errorMessage.set('auth.error.invitation-not-available');
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

    this.loading.set(true);
    this.errorMessage.set(null);

    this.invitationApi.acceptInvitation(invitation, {
      firstName: this.form.controls.firstName.value,
      lastName: this.form.controls.lastName.value,
      phone: this.form.controls.phone.value,
      workAreaId: this.form.controls.workAreaId.value,
      specialtyId: this.form.controls.specialtyId.value,
      password: this.form.controls.password.value
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/sign-in']).then();
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('auth.error.invitation-accept-failed');
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

  private loadInvitation(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.errorMessage.set('auth.error.invitation-token-missing');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.invitationApi.getInvitationByToken(token).subscribe({
      next: invitation => {
        if (!invitation || !invitation.isPending) {
          this.errorMessage.set('auth.error.invitation-not-available');
          this.loading.set(false);
          return;
        }

        this.invitation.set(invitation);
        this.form.controls.email.setValue(invitation.email);
        this.loadCatalogs(invitation.organizationId);
      },
      error: () => {
        this.errorMessage.set('auth.error.invitation-not-found');
        this.loading.set(false);
      }
    });
  }

  private loadCatalogs(organizationId: number): void {
    this.catalogApi.getWorkAreasByOrganizationId(organizationId).subscribe({
      next: workAreas => {
        this.workAreas.set(workAreas);
      },
      error: () => {
        this.errorMessage.set('auth.error.catalog-load-failed');
      }
    });

    this.catalogApi.getSpecialties().subscribe({
      next: specialties => {
        this.specialties.set(specialties);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('auth.error.catalog-load-failed');
        this.loading.set(false);
      }
    });
  }
}