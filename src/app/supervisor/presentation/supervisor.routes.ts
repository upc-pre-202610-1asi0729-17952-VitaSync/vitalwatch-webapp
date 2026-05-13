import { Routes } from '@angular/router';
import { SupervisorLayout } from './layouts/supervisor-layout/supervisor-layout';

const dashboard = () =>
  import('./views/dashboard/dashboard').then(m => m.Dashboard);

const riskStaff = () =>
  import('./views/risk-staff/risk-staff').then(m => m.RiskStaffComponent);

const alerts = () =>
  import('./views/alerts/alerts').then(m => m.Alerts);

const anomalies = () =>
  import('./views/anomalies/anomalies').then(m => m.Anomalies);

const settings = () =>
  import('./views/settings/settings').then(m => m.Settings);

export const supervisorRoutes: Routes = [
  {
    path: '',
    component: SupervisorLayout,
    children: [
      { path: 'dashboard', loadComponent: dashboard, title: 'VitalWatch - Supervisor Dashboard' },
      { path: 'risk-staff', loadComponent: riskStaff, title: 'VitalWatch - Personal en riesgo' },
      { path: 'alerts', loadComponent: alerts, title: 'VitalWatch - Alertas' },
      { path: 'anomalies', loadComponent: anomalies, title: 'VitalWatch - Anomalías' },
      { path: 'settings', loadComponent: settings, title: 'VitalWatch - Configuración' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
