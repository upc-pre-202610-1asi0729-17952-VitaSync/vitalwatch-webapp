import { Component, computed, EventEmitter, inject, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { SubscriptionAccessService } from '../../../../subscription-plan-management/application/subscription-access.service';

export interface SidebarProfile {
  fullName: string;
  email: string;
  initials: string;
  avatarColor: string;
}

export interface SidebarMenuItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
  module?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    NgIcon
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private subscriptionAccessService = inject(SubscriptionAccessService);

  @Input({ required: true }) profile!: SidebarProfile;
  @Input({ required: true }) menuTitle = '';
  @Input({ required: true }) menuItems: SidebarMenuItem[] = [];

  @Output() signOut = new EventEmitter<void>();

  protected visibleMenuItems = computed(() =>
    this.menuItems.filter(item =>
      !item.module || this.subscriptionAccessService.hasModule(item.module)
    )
  );
}