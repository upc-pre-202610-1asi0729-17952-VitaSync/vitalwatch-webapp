import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

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
  @Input({ required: true }) profile!: SidebarProfile;
  @Input({ required: true }) menuTitle = '';
  @Input({ required: true }) menuItems: SidebarMenuItem[] = [];

  @Output() signOut = new EventEmitter<void>();
}