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
        loadComponent: () =>
          import('./subscription-plan-management/presentation/views/admin-subscription/admin-subscription')
            .then(m => m.AdminSubscription)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./audit-compliance/presentation/views/admin-reports/admin-reports')
            .then(m => m.AdminReports)
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./audit-compliance/presentation/views/admin-audit/admin-audit')
            .then(m => m.AdminAudit)
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./shift-coordination/presentation/views/team-management/team-management')
            .then(m => m.TeamManagement)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./iam/presentation/views/account-settings/account-settings')
            .then(m => m.AccountSettings)
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
        loadComponent: () =>
          import('./clinical-risk-assessment/presentation/views/supervisor-anomalies/supervisor-anomalies')
            .then(m => m.SupervisorAnomalies)
      },
      {
        path: 'preventive-actions',
        loadComponent: () =>
          import('./staff-recovery/presentation/views/preventive-actions-management/preventive-actions-management')
            .then(m => m.PreventiveActionsManagement)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./iam/presentation/views/account-settings/account-settings')
            .then(m => m.AccountSettings)
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
        loadComponent: () =>
          import('./clinical-risk-assessment/presentation/views/doctor-vital-signs/doctor-vital-signs')
            .then(m => m.DoctorVitalSigns)
      },
      {
        path: 'shifts',
        loadComponent: () =>
          import('./shift-coordination/presentation/views/doctor-shifts/doctor-shifts')
            .then(m => m.DoctorShifts)
      },
      {
        path: 'recovery',
        loadComponent: () =>
          import('./staff-recovery/presentation/views/doctor-recovery/doctor-recovery')
            .then(m => m.DoctorRecovery)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./iam/presentation/views/account-settings/account-settings')
            .then(m => m.AccountSettings)
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'sign-in'
  }
];