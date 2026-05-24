import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationStore } from '../../../application/authentication.store';
import { NgIcon } from '@ng-icons/core';
import { MatSelectModule } from '@angular/material/select';
import { AuthLayout } from '../../../../shared/presentation/components/auth-layout/auth-layout';
import { IamCatalogApi } from '../../../infrastructure/iam-catalog-api';
import { InvitationApi } from '../../../infrastructure/invitation-api';
import { Invitation } from '../../../domain/model/invitation.entity';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogApi = inject(IamCatalogApi);
  private invitationApi = inject(InvitationApi);

  protected invitation = signal<Invitation | null>(null);
  protected workAreas = signal<WorkArea[]>([]);
  protected specialties = signal<Specialty[]>([]);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected passwordVisible = signal(false);
  protected confirmPasswordVisible = signal(false);

  private authenticationStore = inject(AuthenticationStore);

  protected form = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    workAreaId: [0, [Validators.required]],
    specialtyId: [0, [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.authenticationStore.clearSession();

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.errorMessage.set('auth.error.invitation-token-required');
      return;
    }

    this.loading.set(true);

    this.invitationApi.getInvitationByToken(token).subscribe({
      next: invitation => {
        if (!invitation.isPending) {
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
    const invitation = this.invitation();

    if (!invitation) {
      this.errorMessage.set('auth.error.invitation-token-required');
      return;
    }

    if (this.form.invalid || this.passwordsDoNotMatch()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.invitationApi.acceptInvitation({
      invitationId: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
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

  private loadCatalogs(organizationId: number): void {
    this.catalogApi.getWorkAreasByOrganizationId(organizationId).subscribe(workAreas => {
      this.workAreas.set(workAreas);
    });

    this.catalogApi.getSpecialties().subscribe(specialties => {
      this.specialties.set(specialties);
      this.loading.set(false);
    });
  }
}