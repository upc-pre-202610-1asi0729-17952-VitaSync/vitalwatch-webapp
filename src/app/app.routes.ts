import { Routes } from '@angular/router';

const iamRoutes = () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes);
const appLayout = () => import('./shared/presentation/components/app-layout/app-layout').then(m => m.AppLayout);
const pagePlaceholder = () => import('./shared/presentation/views/page-placeholder/page-placeholder').then(m => m.PagePlaceholder);

export const routes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: '', loadChildren: iamRoutes },

  {
    path: 'admin',
    loadComponent: appLayout,
    data: { role: 'admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: pagePlaceholder, data: { title: 'navigation.general-summary' } },
      { path: 'staff', loadComponent: pagePlaceholder, data: { title: 'navigation.staff' } },
      { path: 'invitations', loadComponent: pagePlaceholder, data: { title: 'navigation.invitations' } },
      { path: 'subscription', loadComponent: pagePlaceholder, data: { title: 'navigation.subscription' } },
      { path: 'reports', loadComponent: pagePlaceholder, data: { title: 'navigation.reports' } },
      { path: 'audit', loadComponent: pagePlaceholder, data: { title: 'navigation.audit' } },
      { path: 'settings', loadComponent: pagePlaceholder, data: { title: 'navigation.settings' } }
    ]
  },

  {
    path: 'supervisor',
    loadComponent: appLayout,
    data: { role: 'supervisor' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: pagePlaceholder, data: { title: 'navigation.shift-summary' } },
      { path: 'risk-staff', loadComponent: pagePlaceholder, data: { title: 'navigation.risk-staff' } },
      { path: 'clinical-alerts', loadComponent: pagePlaceholder, data: { title: 'navigation.clinical-alerts' } },
      { path: 'anomalies', loadComponent: pagePlaceholder, data: { title: 'navigation.anomalies' } },
      { path: 'preventive-actions', loadComponent: pagePlaceholder, data: { title: 'navigation.preventive-actions' } },
      { path: 'settings', loadComponent: pagePlaceholder, data: { title: 'navigation.settings' } }
    ]
  },

  {
    path: 'doctor',
    loadComponent: appLayout,
    data: { role: 'doctor' },
    children: [
      { path: '', redirectTo: 'health', pathMatch: 'full' },
      { path: 'health', loadComponent: pagePlaceholder, data: { title: 'navigation.my-health-status' } },
      { path: 'vital-signs', loadComponent: pagePlaceholder, data: { title: 'navigation.my-vital-signs' } },
      { path: 'shifts', loadComponent: pagePlaceholder, data: { title: 'navigation.my-shifts' } },
      { path: 'recovery', loadComponent: pagePlaceholder, data: { title: 'navigation.my-recovery' } },
      { path: 'settings', loadComponent: pagePlaceholder, data: { title: 'navigation.settings' } }
    ]
  },

  { path: '**', redirectTo: 'sign-in' }
];