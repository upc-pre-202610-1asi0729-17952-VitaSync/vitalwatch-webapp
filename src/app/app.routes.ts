import { Routes } from '@angular/router';
import {
  authenticationGuard,
  roleGuard
} from './iam/application/authentication.guard';
import { moduleAccessGuard } from './subscription-plan-management/application/module-access.guard';
import {
  adminShiftCoordinationRoutes,
  doctorShiftCoordinationRoutes
} from './shift-coordination/presentation/shift-coordination.routes';
import {
  adminClinicalRiskAssessmentRoutes,
  doctorClinicalRiskAssessmentRoutes,
  supervisorClinicalRiskAssessmentRoutes
} from './clinical-risk-assessment/presentation/clinical-risk-assessment.routes';
import {
  doctorStaffRecoveryRoutes,
  supervisorStaffRecoveryRoutes
} from './staff-recovery/presentation/staff-recovery.routes';

const iamRoutes = () =>
  import('./iam/presentation/iam.routes')
    .then(m => m.iamRoutes);

const subscriptionPlanManagementRoutes = () =>
  import('./subscription-plan-management/presentation/subscription-plan-management.routes')
    .then(m => m.subscriptionPlanManagementRoutes);

const appLayout = () =>
  import('./shared/presentation/components/app-layout/app-layout')
    .then(m => m.AppLayout);

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
    loadChildren: subscriptionPlanManagementRoutes
  },
  {
    path: 'register-organization',
    loadChildren: subscriptionPlanManagementRoutes
  },
  {
    path: 'checkout',
    loadChildren: subscriptionPlanManagementRoutes
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
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      ...adminClinicalRiskAssessmentRoutes,

      {
        path: 'staff',
        loadComponent: () =>
          import('./iam/presentation/views/staff-management/staff-management')
            .then(m => m.StaffManagement)
      },

      ...adminShiftCoordinationRoutes,

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
        canActivate: [moduleAccessGuard],
        data: {
          module: 'ADMIN_REPORTS'
        },
        loadComponent: () =>
          import('./audit-compliance/presentation/views/admin-reports/admin-reports')
            .then(m => m.AdminReports)
      },
      {
        path: 'audit',
        canActivate: [moduleAccessGuard],
        data: {
          module: 'ADMIN_AUDIT'
        },
        loadComponent: () =>
          import('./audit-compliance/presentation/views/admin-audit/admin-audit')
            .then(m => m.AdminAudit)
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

      ...supervisorClinicalRiskAssessmentRoutes,

      ...supervisorStaffRecoveryRoutes,

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

      ...doctorClinicalRiskAssessmentRoutes,

      ...doctorShiftCoordinationRoutes,

      ...doctorStaffRecoveryRoutes,

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