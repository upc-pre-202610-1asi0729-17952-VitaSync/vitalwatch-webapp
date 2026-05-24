import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Sidebar, SidebarMenuItem, SidebarProfile } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { UserRole } from '../../../../iam/domain/model/user.entity';

interface AppLayoutConfig {
  title: string;
  subtitle: string;
  menuTitle: string;
  menuItems: SidebarMenuItem[];
}

const layoutConfig: Record<UserRole, AppLayoutConfig> = {
  HOSPITAL_ADMIN: {
    title: 'layout.admin-title',
    subtitle: 'layout.subtitle',
    menuTitle: 'navigation.admin-menu',
    menuItems: [
      { label: 'navigation.general-summary', icon: 'heroSquares2x2', link: '/admin/dashboard', exact: true },
      { label: 'navigation.staff', icon: 'heroUsers', link: '/admin/staff' },
      { label: 'navigation.teams', icon: 'heroUserGroup', link: '/admin/teams' },
      { label: 'navigation.invitations', icon: 'heroEnvelope', link: '/admin/invitations' },
      { label: 'navigation.subscription', icon: 'heroCreditCard', link: '/admin/subscription' },
      { label: 'navigation.reports', icon: 'heroDocumentText', link: '/admin/reports' },
      { label: 'navigation.audit', icon: 'heroShieldCheck', link: '/admin/audit' },
      { label: 'navigation.settings', icon: 'heroCog6Tooth', link: '/admin/settings' }
    ]
  },

  SUPERVISOR: {
    title: 'layout.supervisor-title',
    subtitle: 'layout.subtitle',
    menuTitle: 'navigation.supervisor-menu',
    menuItems: [
      { label: 'navigation.shift-summary', icon: 'heroSquares2x2', link: '/supervisor/dashboard', exact: true },
      { label: 'navigation.risk-staff', icon: 'heroExclamationTriangle', link: '/supervisor/risk-staff' },
      { label: 'navigation.clinical-alerts', icon: 'heroBell', link: '/supervisor/clinical-alerts' },
      { label: 'navigation.anomalies', icon: 'heroBolt', link: '/supervisor/anomalies' },
      { label: 'navigation.preventive-actions', icon: 'heroClipboardDocumentCheck', link: '/supervisor/preventive-actions' },
      { label: 'navigation.settings', icon: 'heroCog6Tooth', link: '/supervisor/settings' }
    ]
  },

  DOCTOR: {
    title: 'layout.doctor-title',
    subtitle: 'layout.subtitle',
    menuTitle: 'navigation.clinical-menu',
    menuItems: [
      { label: 'navigation.my-health-status', icon: 'heroSquares2x2', link: '/doctor/health', exact: true },
      { label: 'navigation.my-vital-signs', icon: 'heroBolt', link: '/doctor/vital-signs' },
      { label: 'navigation.my-shifts', icon: 'heroCalendarDays', link: '/doctor/shifts' },
      { label: 'navigation.my-recovery', icon: 'heroHeart', link: '/doctor/recovery' },
      { label: 'navigation.settings', icon: 'heroCog6Tooth', link: '/doctor/settings' }
    ]
  }
};

const avatarColors: Record<UserRole, string> = {
  HOSPITAL_ADMIN: '#2563eb',
  SUPERVISOR: '#7c3aed',
  DOCTOR: '#11c7c7'
};

@Component({
  selector: 'app-app-layout',
  imports: [
    Sidebar,
    Topbar,
    RouterOutlet
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css'
})
export class AppLayout {
  private router = inject(Router);
  private authenticationStore = inject(AuthenticationStore);

  protected config = computed(() => {
    const role = this.authenticationStore.currentUser()?.role ?? this.resolveRoleFromUrl();
    return layoutConfig[role];
  });

  protected profile = computed<SidebarProfile>(() => {
    const user = this.authenticationStore.currentUser();

    if (!user) {
      return {
        fullName: 'Usuario VitalWatch',
        email: 'usuario@vitalwatch.com',
        initials: 'VW',
        avatarColor: '#2563eb'
      };
    }

    return {
      fullName: user.fullName,
      email: user.email,
      initials: user.initials,
      avatarColor: avatarColors[user.role]
    };
  });

  protected signOut(): void {
    this.authenticationStore.signOut();
  }

  private resolveRoleFromUrl(): UserRole {
    const url = this.router.url;

    if (url.startsWith('/admin')) return 'HOSPITAL_ADMIN';
    if (url.startsWith('/supervisor')) return 'SUPERVISOR';
    if (url.startsWith('/doctor')) return 'DOCTOR';

    return 'DOCTOR';
  }
}