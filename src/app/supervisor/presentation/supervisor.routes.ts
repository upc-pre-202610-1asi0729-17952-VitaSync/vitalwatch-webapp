import { Routes } from '@angular/router';
import { SupervisorLayout } from './layouts/supervisor-layout/supervisor-layout';

const dashboard = () =>
  import('./views/dashboard/dashboard').then(m => m.Dashboard);

const riskStaff = () =>
  import('./views/risk-staff/risk-staff').then(m => m.RiskStaffComponent);

const alerts = () =>
  import('./views/alerts/alerts').then(m => m.Alerts);

const registerAction = () =>
  import('./views/register-action/register-action').then(m => m.RegisterAction);

const anomalies = () =>
  import('./views/anomalies/anomalies').then(m => m.Anomalies);

const settings = () =>
  import('./views/settings/settings').then(m => m.Settings);

export const supervisorRoutes: Routes = [
  {
    path: '',
    component: SupervisorLayout,
    children: [
      { path: 'dashboard', loadComponent: dashboard },
      { path: 'risk-staff', loadComponent: riskStaff },
      { path: 'alerts', loadComponent: alerts },
      { path: 'alerts/:id/action', loadComponent: registerAction },
      { path: 'anomalies', loadComponent: anomalies },
      { path: 'settings', loadComponent: settings },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
