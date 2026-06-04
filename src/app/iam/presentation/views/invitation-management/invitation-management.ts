import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../application/authentication.store';
import { IamStore } from '../../../application/iam.store';
import { Invitation, InvitationStatus } from '../../../domain/model/invitation.entity';
import { UserRole } from '../../../domain/model/user.entity';
import { SubscriptionAccessService } from '../../../../subscription-plan-management/application/subscription-access.service';

type StatusFilter = 'ALL' | InvitationStatus;

@Component({
  selector: 'app-invitation-management',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatSelectModule,
    DatePipe,
    NgIcon
  ],
  templateUrl: './invitation-management.html',
  styleUrl: './invitation-management.css'
})
export class InvitationManagement implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private authenticationStore = inject(AuthenticationStore);
  private iamStore = inject(IamStore);
  private subscriptionAccessService = inject(SubscriptionAccessService);

  private localErrorMessage = signal<string | null>(null);

  protected invitations = computed(() =>
    this.iamStore.invitations()
  );

  protected loading = computed(() =>
    this.iamStore.loading()
  );

  protected errorMessage = computed(() =>
    this.localErrorMessage() ?? this.iamStore.error()
  );

  protected copiedLink = signal<string | null>(null);
  protected statusFilter = signal<StatusFilter>('ALL');
  protected searchTerm = signal('');

  protected form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['DOCTOR' as UserRole, [Validators.required]]
  });

  protected filteredInvitations = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    return this.invitations().filter(invitation => {
      const matchesStatus = status === 'ALL' || invitation.status === status;
      const matchesSearch =
        invitation.email.toLowerCase().includes(search) ||
        invitation.role.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  });

  protected totalInvitations = computed(() =>
    this.invitations().length
  );

  protected pendingInvitations = computed(() =>
    this.invitations().filter(invitation => invitation.status === 'PENDING').length
  );

  protected acceptedInvitations = computed(() =>
    this.invitations().filter(invitation => invitation.status === 'ACCEPTED').length
  );

  protected cancelledInvitations = computed(() =>
    this.invitations().filter(invitation => invitation.status === 'CANCELLED').length
  );

  ngOnInit(): void {
    this.iamStore.loadInvitations();
  }

  protected createInvitation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.localErrorMessage.set(null);
    this.iamStore.clearError();

    if (!this.canSendInvitation()) {
      return;
    }

    const user = this.authenticationStore.currentUser();

    if (!user) {
      this.localErrorMessage.set('iam.invitations.error.no-session');
      return;
    }

    this.iamStore.createInvitation({
      organizationId: user.organizationId,
      email: this.form.controls.email.value,
      role: this.form.controls.role.value
    }).subscribe({
      next: () => {
        this.form.reset({
          email: '',
          role: 'DOCTOR'
        });

        this.localErrorMessage.set(null);
      },
      error: error => {
        this.localErrorMessage.set(
          error.error?.message ?? 'iam.invitations.error.create-failed'
        );
      }
    });
  }

  protected cancelInvitation(invitation: Invitation): void {
    if (!invitation.isPending) return;

    this.localErrorMessage.set(null);
    this.iamStore.clearError();

    this.iamStore.cancelInvitation(invitation.id).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('iam.invitations.error.cancel-failed');
      }
    });
  }

  protected deleteInvitation(invitation: Invitation): void {
    if (invitation.status === 'ACCEPTED') {
      this.localErrorMessage.set('iam.invitations.error.accepted-cannot-be-deleted');
      return;
    }

    this.localErrorMessage.set(null);
    this.iamStore.clearError();

    this.iamStore.deleteInvitation(invitation.id).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('iam.invitations.error.delete-failed');
      }
    });
  }

  protected copyInvitationLink(invitation: Invitation): void {
    const link = `${window.location.origin}/accept-invitation?token=${invitation.token}`;

    navigator.clipboard.writeText(link).then(() => {
      this.copiedLink.set(link);

      setTimeout(() => {
        this.copiedLink.set(null);
      }, 2500);
    });
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      HOSPITAL_ADMIN: 'iam.roles.admin',
      SUPERVISOR: 'iam.roles.supervisor',
      DOCTOR: 'iam.roles.doctor'
    };

    return labels[role];
  }

  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'iam.invitations.status.pending',
      ACCEPTED: 'iam.invitations.status.accepted',
      CANCELLED: 'iam.invitations.status.cancelled',
      EXPIRED: 'iam.invitations.status.expired'
    };

    return labels[status] ?? status;
  }

  private canSendInvitation(): boolean {
    const plan = this.subscriptionAccessService.currentPlan();

    if (!plan) return true;

    const invitationsThisMonth = this.iamStore.countInvitationsThisMonth();

    if (!this.subscriptionAccessService.canUseLimit(plan.monthlyInvitations, invitationsThisMonth)) {
      this.localErrorMessage.set('subscription.limits.invitations-exceeded');
      return false;
    }

    return true;
  }
}