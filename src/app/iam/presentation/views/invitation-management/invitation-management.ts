import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubscriptionAccessService } from '../../../../subscription-plan-management/application/subscription-access.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { AuthenticationStore } from '../../../application/authentication.store';
import { InvitationApi } from '../../../infrastructure/invitation-api';
import { Invitation } from '../../../domain/model/invitation.entity';
import { UserRole } from '../../../domain/model/user.entity';
import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

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
  private invitationApi = inject(InvitationApi);
  private authenticationStore = inject(AuthenticationStore);
  private subscriptionAccessService = inject(SubscriptionAccessService);

  protected invitations = signal<Invitation[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected copiedLink = signal<string | null>(null);
  protected statusFilter = signal<'ALL' | 'PENDING' | 'ACCEPTED' | 'CANCELLED'>('ALL');
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

  protected totalInvitations = computed(() => this.invitations().length);
  protected pendingInvitations = computed(() => this.invitations().filter(i => i.status === 'PENDING').length);
  protected acceptedInvitations = computed(() => this.invitations().filter(i => i.status === 'ACCEPTED').length);
  protected cancelledInvitations = computed(() => this.invitations().filter(i => i.status === 'CANCELLED').length);

  ngOnInit(): void {
    this.loadInvitations();
  }

  protected createInvitation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.canSendInvitation()) {
      return;
    }

    const user = this.authenticationStore.currentUser();

    if (!user) {
      this.errorMessage.set('iam.invitations.error.no-session');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.invitationApi.createInvitation({
      organizationId: user.organizationId,
      email: this.form.controls.email.value,
      role: this.form.controls.role.value
    }).subscribe({
      next: invitation => {
        this.invitations.update(invitations => [invitation, ...invitations]);
        this.form.reset({
          email: '',
          role: 'DOCTOR'
        });
        this.loading.set(false);
      },
      error: error => {
        console.error(error);

        this.errorMessage.set(
          error.error?.message ?? 'iam.invitations.error.create-failed'
        );

        this.loading.set(false);
      }
    });
  }

  protected cancelInvitation(invitation: Invitation): void {
    if (!invitation.isPending) return;

    this.invitationApi.cancelInvitation(invitation.id).subscribe({
      next: updatedInvitation => {
        this.invitations.update(invitations =>
          invitations.map(item => item.id === updatedInvitation.id ? updatedInvitation : item)
        );
      }
    });
  }

  protected deleteInvitation(invitation: Invitation): void {
    if (invitation.status === 'ACCEPTED') {
      this.errorMessage.set('iam.invitations.error.accepted-cannot-be-deleted');
      return;
    }

    this.invitationApi.deleteInvitation(invitation.id).subscribe({
      next: () => {
        this.invitations.update(invitations =>
          invitations.filter(item => item.id !== invitation.id)
        );
        this.errorMessage.set(null);
      },
      error: () => {
        this.errorMessage.set('iam.invitations.error.delete-failed');
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

  protected updateStatusFilter(value: 'ALL' | 'PENDING' | 'ACCEPTED' | 'CANCELLED'): void {
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

    return labels[status];
  }

  private getInvitationsThisMonthCount(): number {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return this.invitations().filter(invitation => {
      const createdAt = new Date(invitation.createdAt);

      return createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear;
    }).length;
  }

  private canSendInvitation(): boolean {
    const plan = this.subscriptionAccessService.currentPlan();

    if (!plan) return true;

    const invitationsThisMonth = this.getInvitationsThisMonthCount();

    if (!this.subscriptionAccessService.canUseLimit(plan.monthlyInvitations, invitationsThisMonth)) {
      this.errorMessage.set('subscription.limits.invitations-exceeded');
      return false;
    }

    return true;
  }

  private loadInvitations(): void {
    const user = this.authenticationStore.currentUser();

    if (!user) return;

    this.loading.set(true);

    this.invitationApi.getInvitationsByOrganizationId(user.organizationId).subscribe({
      next: invitations => {
        this.invitations.set([...invitations].reverse());
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('iam.invitations.error.load-failed');
        this.loading.set(false);
      }
    });
  }
}