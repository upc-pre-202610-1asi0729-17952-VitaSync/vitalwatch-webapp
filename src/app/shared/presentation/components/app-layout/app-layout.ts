import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Sidebar, SidebarMenuItem, SidebarProfile } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

type UserRole = 'admin' | 'supervisor' | 'doctor';

interface AppLayoutConfig {
  title: string;
  subtitle: string;
  menuTitle: string;
  profile: SidebarProfile;
  menuItems: SidebarMenuItem[];
}

const layoutConfig: Record<UserRole, AppLayoutConfig> = {
  admin: {
    title: 'layout.admin-title',
    subtitle: 'layout.subtitle',
    menuTitle: 'navigation.admin-menu',
    profile: {
      fullName: 'Marcelo Administrador',
      email: 'admin@vitalwatch.com',
      initials: 'MA',
      avatarColor: '#11c7c7'
    },
    menuItems: [
      { label: 'navigation.general-summary', icon: 'heroSquares2x2', link: '/admin/dashboard', exact: true },
      { label: 'navigation.staff', icon: 'heroUsers', link: '/admin/staff' },
      { label: 'navigation.invitations', icon: 'heroEnvelope', link: '/admin/invitations' },
      { label: 'navigation.subscription', icon: 'heroCreditCard', link: '/admin/subscription' },
      { label: 'navigation.reports', icon: 'heroDocumentText', link: '/admin/reports' },
      { label: 'navigation.audit', icon: 'heroShieldCheck', link: '/admin/audit' },
      { label: 'navigation.settings', icon: 'heroCog6Tooth', link: '/admin/settings' }
    ]
  },
  supervisor: {
    title: 'layout.supervisor-title',
    subtitle: 'layout.subtitle',
    menuTitle: 'navigation.supervisor-menu',
    profile: {
      fullName: 'Claudia Supervisora',
      email: 'supervisor@vitalwatch.com',
      initials: 'CS',
      avatarColor: '#7c3aed'
    },
    menuItems: [
      { label: 'navigation.shift-summary', icon: 'heroSquares2x2', link: '/supervisor/dashboard', exact: true },
      { label: 'navigation.risk-staff', icon: 'heroExclamationTriangle', link: '/supervisor/risk-staff' },
      { label: 'navigation.clinical-alerts', icon: 'heroBell', link: '/supervisor/clinical-alerts' },
      { label: 'navigation.anomalies', icon: 'heroBolt', link: '/supervisor/anomalies' },
      { label: 'navigation.preventive-actions', icon: 'heroClipboardDocumentCheck', link: '/supervisor/preventive-actions' },
      { label: 'navigation.settings', icon: 'heroCog6Tooth', link: '/supervisor/settings' }
    ]
  },
  doctor: {
    title: 'layout.doctor-title',
    subtitle: 'layout.subtitle',
    menuTitle: 'navigation.clinical-menu',
    profile: {
      fullName: 'Carlos Mendoza',
      email: 'doctor@vitalwatch.com',
      initials: 'CM',
      avatarColor: '#11c7c7'
    },
    menuItems: [
      { label: 'navigation.my-health-status', icon: 'heroSquares2x2', link: '/doctor/health', exact: true },
      { label: 'navigation.my-vital-signs', icon: 'heroBolt', link: '/doctor/vital-signs' },
      { label: 'navigation.my-shifts', icon: 'heroCalendarDays', link: '/doctor/shifts' },
      { label: 'navigation.my-recovery', icon: 'heroHeart', link: '/doctor/recovery' },
      { label: 'navigation.settings', icon: 'heroCog6Tooth', link: '/doctor/settings' }
    ]
  }
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected role = (this.route.snapshot.data['role'] ?? 'doctor') as UserRole;
  protected config = layoutConfig[this.role];

  protected signOut(): void {
    this.router.navigate(['/sign-in']).then();
  }
}