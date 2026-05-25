import { Routes } from '@angular/router';
import {
  authenticationGuard,
  publicOnlyGuard,
  roleGuard
} from './iam/application/authentication.guard';

const iamRoutes = () =>
  import('./iam/presentation/iam.routes')
    .then(m => m.iamRoutes);

const subscriptionRoutes = () =>
  import('./subscription/presentation/subscription.routes')
    .then(m => m.subscriptionRoutes);

const appLayout = () =>
  import('./shared/presentation/components/app-layout/app-layout')
    .then(m => m.AppLayout);

const pagePlaceholder = () =>
  import('./shared/presentation/views/page-placeholder/page-placeholder')
    .then(m => m.PagePlaceholder);

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full'
  },

  {
    path: '',
    loadChildren: iamRoutes
  },

  {
    path: 'onboarding',
    canActivate: [publicOnlyGuard],
    loadChildren: subscriptionRoutes
  },

  {
    path: 'admin',
    loadComponent: appLayout,
    canActivate: [authenticationGuard, roleGuard],
    data: {
      roles: ['HOSPITAL_ADMIN']
    },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./clinical-risk-assessment/presentation/views/admin-dashboard/admin-dashboard')
            .then(m => m.AdminDashboard)
      },
      {
        path: 'dashboard',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.general-summary'
        }
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./iam/presentation/views/staff-management/staff-management')
            .then(m => m.StaffManagement)
      },
      {
        path: 'invitations',
        loadComponent: () =>
          import('./iam/presentation/views/invitation-management/invitation-management')
            .then(m => m.InvitationManagement)
      },
      {
        path: 'subscription',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.subscription'
        }
      },
      {
        path: 'reports',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.reports'
        }
      },
      {
        path: 'audit',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.audit'
        }
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./shift-coordination/presentation/views/team-management/team-management')
            .then(m => m.TeamManagement)
      },
      {
        path: 'settings',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.settings'
        }
      }
    ]
  },

  {
    path: 'supervisor',
    loadComponent: appLayout,
    canActivate: [authenticationGuard, roleGuard],
    data: {
      roles: ['SUPERVISOR']
    },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./clinical-risk-assessment/presentation/views/supervisor-dashboard/supervisor-dashboard')
            .then(m => m.SupervisorDashboard)
      },
      {
        path: 'risk-staff',
        loadComponent: () =>
          import('./clinical-risk-assessment/presentation/views/supervisor-risk-staff/supervisor-risk-staff')
            .then(m => m.SupervisorRiskStaff)
      },
      {
        path: 'clinical-alerts',
        loadComponent: () =>
          import('./clinical-risk-assessment/presentation/views/supervisor-clinical-alerts/supervisor-clinical-alerts')
            .then(m => m.SupervisorClinicalAlerts)
      },
      {
        path: 'anomalies',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.anomalies'
        }
      },
      {
        path: 'preventive-actions',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.preventive-actions'
        }
      },
      {
        path: 'settings',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.settings'
        }
      }
    ]
  },

  {
    path: 'doctor',
    loadComponent: appLayout,
    canActivate: [authenticationGuard, roleGuard],
    data: {
      roles: ['DOCTOR']
    },
    children: [
      {
        path: '',
        redirectTo: 'health',
        pathMatch: 'full'
      },
      {
        path: 'health',
        loadComponent: () =>
          import('./clinical-risk-assessment/presentation/views/doctor-health-dashboard/doctor-health-dashboard')
            .then(m => m.DoctorHealthDashboard)
      },
      {
        path: 'vital-signs',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.my-vital-signs'
        }
      },
      {
        path: 'shifts',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.my-shifts'
        }
      },
      {
        path: 'recovery',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.my-recovery'
        }
      },
      {
        path: 'settings',
        loadComponent: pagePlaceholder,
        data: {
          title: 'navigation.settings'
        }
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'sign-in'
  }
];